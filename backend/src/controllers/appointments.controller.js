import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { createNotification } from "./notifications.controller.js";
import {
  isWithinBreakTime,
  checkLeadTime,
  validateAppointmentDuration,
} from "../utils/availabilityUtils.js";
import {
  emitAppointmentCreated,
  emitAppointmentUpdated,
  emitAppointmentStatusChanged,
  emitAppointmentDeleted,
} from "../lib/socket.js";

export async function createAppointment(req, res) {
  try {
    const userId = req.user._id.toString();
    const {
      friendId,
      startTime,
      endTime,
      title,
      description,
      meetingType,
      bookedBy,
      availability,
      appointmentDuration,
    } = req.body;

    if (!friendId || !startTime || !endTime) {
      return res
        .status(400)
        .json({ message: "Missing required fields: friendId, startTime, endTime" });
    }

    // Verify friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    // Calculate appointment duration
    const durationMs = end.getTime() - start.getTime();
    const durationMinutes = durationMs / (1000 * 60);

    // Get friend's availability settings
    const friendAvailability = friend.availability || {};

    // Validate duration
    if (durationMinutes < 15) {
      return res
        .status(400)
        .json({ message: "Appointment duration must be at least 15 minutes" });
    }

    const durationValidation = validateAppointmentDuration(durationMinutes, {
      min: friendAvailability.appointmentDuration?.min || 15,
      max: friendAvailability.appointmentDuration?.max || 120,
    });

    if (!durationValidation.isValid) {
      return res.status(400).json({ message: durationValidation.error });
    }

    // Check lead time requirement
    const minLeadTime = friendAvailability.minLeadTime || 0;
    if (!checkLeadTime(startTime, minLeadTime)) {
      const hours = minLeadTime;
      return res.status(400).json({
        message: `Bookings require at least ${hours} hour${hours > 1 ? 's' : ''} advance notice`,
      });
    }

    // Check if appointment is within break times
    const breakTimes = friendAvailability.breakTimes || [];
    const startTimeStr = `${start.getHours().toString().padStart(2, '0')}:${start
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const endTimeStr = `${end.getHours().toString().padStart(2, '0')}:${end
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    if (isWithinBreakTime(startTimeStr, endTimeStr, breakTimes)) {
      return res.status(400).json({
        message: "This time slot overlaps with a break time",
      });
    }

    // Check if friend is away
    if (friend.availabilityStatus === 'away') {
      return res.status(400).json({
        message: "This user is currently away and not accepting bookings",
      });
    }

    // Check if appointment is on an available day
    const availableDays = friendAvailability.days || [1, 2, 3, 4, 5];
    const appointmentDay = start.getDay(); // 0 = Sunday, 1 = Monday, etc.
    if (!availableDays.includes(appointmentDay)) {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const appointmentDayName = dayNames[appointmentDay];
      const availableDayNames = availableDays.map(d => dayNames[d]).join(', ');
      return res.status(400).json({
        message: `${appointmentDayName} is not available. Available days are: ${availableDayNames}`,
      });
    }

    // Check if appointment time is within working hours
    const [friendStartHour, friendStartMin] = (friendAvailability.start || '09:00').split(':').map(Number);
    const [friendEndHour, friendEndMin] = (friendAvailability.end || '17:00').split(':').map(Number);
    const friendStartMinutes = friendStartHour * 60 + friendStartMin;
    const friendEndMinutes = friendEndHour * 60 + friendEndMin;
    
    const appointmentStartMinutes = start.getHours() * 60 + start.getMinutes();
    const appointmentEndMinutes = end.getHours() * 60 + end.getMinutes();
    
    if (appointmentStartMinutes < friendStartMinutes || appointmentEndMinutes > friendEndMinutes) {
      return res.status(400).json({
        message: `Appointment must be between ${friendAvailability.start} and ${friendAvailability.end}`,
      });
    }

    // ⚠️ CRITICAL: Check for overlapping/double-booking appointments
    // This prevents BOTH users from booking the same time slot
    const overlappingAppointments = await Appointment.find({
      // Only check non-cancelled appointments
      status: { $in: ['pending', 'confirmed', 'scheduled'] },
      // Time overlap check: appointment starts before new one ends AND ends after new one starts
      startTime: { $lt: end },
      endTime: { $gt: start },
      // Check both participants (either party could have a conflict)
      $or: [
        { userId: friendId },      // Friend's appointments
        { friendId: friendId },    // Friend as recipient
        { userId: userId },        // Current user's appointments
        { friendId: userId }       // Current user as recipient
      ]
    });

    // Check for conflicts - but exclude the case where they already have an appointment together
    // (this would be an update scenario)
    const conflict = overlappingAppointments.find(existingAppt => {
      const existingUserId = (existingAppt.userId._id || existingAppt.userId).toString();
      const existingFriendId = (existingAppt.friendId._id || existingAppt.friendId).toString();
      
      // Skip if this is already an appointment between these two users (update/reschedule case)
      const isSameAppointmentPair = 
        (existingUserId === userId && existingFriendId === friendId) ||
        (existingUserId === friendId && existingFriendId === userId);
      
      if (isSameAppointmentPair) {
        return false;
      }
      
      // Return true if there's a conflict involving either the friend or current user
      return (existingUserId === friendId || existingFriendId === friendId) ||
             (existingUserId === userId || existingFriendId === userId);
    });

    if (conflict) {
      const conflictTime = new Date(conflict.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return res.status(409).json({
        message: `This time slot conflicts with an existing appointment at ${conflictTime}. Please choose a different time.`,
        conflictingAppointmentId: conflict._id,
        conflictTime: conflict.startTime
      });
    }

    // Check max appointments per day constraint for the logged-in user
    const user = await User.findById(userId);
    const maxPerDay = user.availability?.maxPerDay || 5;
    const startOfDay = new Date(start);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(start);
    endOfDay.setHours(23, 59, 59, 999);

    // Count ALL appointments for the logged-in user on this day (with any friend)
    // Include pending, confirmed, and scheduled statuses
    const appointmentsOnSameDay = await Appointment.countDocuments({
      $or: [
        { userId: userId },
        { friendId: userId }
      ],
      status: { $in: ['pending', 'confirmed', 'scheduled'] },
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`[Booking Validation] User ${userId} has ${appointmentsOnSameDay} appointments on this day (max: ${maxPerDay})`);

    if (appointmentsOnSameDay >= maxPerDay) {
      return res.status(400).json({
        message: `You have reached the maximum of ${maxPerDay} appointments per day. You currently have ${appointmentsOnSameDay} appointments scheduled. Please choose a different date.`,
        maxPerDay,
        currentCount: appointmentsOnSameDay,
        appointmentsOnDate: appointmentsOnSameDay
      });
    }

    // Also check if the recipient (friend) has reached their max appointments per day
    const friendMaxPerDay = friend.availability?.maxPerDay || 5;
    const friendAppointmentsOnSameDay = await Appointment.countDocuments({
      $or: [
        { userId: friendId },
        { friendId: friendId }
      ],
      status: { $in: ['pending', 'confirmed', 'scheduled'] },
      startTime: { $gte: startOfDay, $lte: endOfDay }
    });

    console.log(`[Booking Validation] Friend ${friendId} has ${friendAppointmentsOnSameDay} appointments on this day (max: ${friendMaxPerDay})`);

    if (friendAppointmentsOnSameDay >= friendMaxPerDay) {
      return res.status(400).json({
        message: `${friend.fullName} has reached their maximum of ${friendMaxPerDay} appointments for this day (currently has ${friendAppointmentsOnSameDay}). Please choose a different date.`,
        maxPerDay: friendMaxPerDay,
        currentCount: friendAppointmentsOnSameDay,
        appointmentsOnDate: friendAppointmentsOnSameDay,
        recipientName: friend.fullName
      });
    }

    const appointment = new Appointment({
      userId,
      friendId,
      startTime: start,
      endTime: end,
      title: title || "Appointment",
      description: description || "",
      meetingType: meetingType || "Video Call",
      status: "pending",
      bookedBy: bookedBy || {},
      availability: availability || {},
      duration: appointmentDuration || durationMinutes,
    });

    await appointment.save();
    await appointment.populate(["userId", "friendId"]);

    // Create notification for the friend
    const formattedDate = new Date(startTime).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const formattedTime = new Date(startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });

    await createNotification({
      recipientId: friendId,
      senderId: userId,
      type: "appointment",
      title: "New Appointment Request",
      message: `${user.fullName} has booked an appointment with you on ${formattedDate} at ${formattedTime}`,
      appointmentId: appointment._id,
    });

    // Emit socket event for real-time updates
    emitAppointmentCreated(appointment);

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error in createAppointment controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAppointments(req, res) {
  try {
    const userId = req.user._id.toString();

    const appointments = await Appointment.find({
      $or: [{ userId }, { friendId: userId }],
    })
      .populate("userId", "fullName profilePic email")
      .populate("friendId", "fullName profilePic email")
      .sort({ startTime: 1 });

    // Auto-mark past appointments as completed (if not already completed/cancelled/declined)
    try {
      const now = new Date();
      const updates = appointments.map(async (apt) => {
        if (
          apt.endTime &&
          new Date(apt.endTime) < now &&
          !["completed", "cancelled", "declined"].includes(apt.status)
        ) {
          apt.status = "completed";
          await apt.save();
        }
      });
      await Promise.all(updates);
    } catch (err) {
      console.warn("Failed to auto-complete appointments:", err?.message || err);
    }
    
    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error in getAppointments controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendAppointments(req, res) {
  try {
    const { friendId } = req.params;

    // Get ALL appointments for a specific friend (show their complete availability)
    const appointments = await Appointment.find({
      $or: [{ userId: friendId }, { friendId: friendId }],
    })
      .populate("userId", "fullName profilePic email")
      .populate("friendId", "fullName profilePic email")
      .sort({ startTime: 1 });

    // Auto-mark past appointments as completed
    try {
      const now = new Date();
      const updates = appointments.map(async (apt) => {
        if (
          apt.endTime &&
          new Date(apt.endTime) < now &&
          !["completed", "cancelled", "declined"].includes(apt.status)
        ) {
          apt.status = "completed";
          await apt.save();
        }
      });
      await Promise.all(updates);
    } catch (err) {
      console.warn("Failed to auto-complete friend appointments:", err?.message || err);
    }

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error in getFriendAppointments controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getCompletedAppointments(req, res) {
  try {
    const { friendId } = req.params;

    // Get all completed appointments for the friend (with any user)
    const completedAppointments = await Appointment.find({
      status: "completed",
      $or: [
        { userId: friendId },
        { friendId: friendId }
      ]
    })
      .populate("userId", "fullName profilePic email")
      .populate("friendId", "fullName profilePic email")
      .sort({ startTime: -1 })
      .limit(5);

    res.status(200).json(completedAppointments);
  } catch (error) {
    console.error("Error in getCompletedAppointments controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAppointmentById(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const appointment = await Appointment.findById(id)
      .populate("userId", "fullName profilePic email")
      .populate("friendId", "fullName profilePic email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Auto-mark single appointment as completed if its endTime has passed
    try {
      if (
        appointment.endTime &&
        new Date(appointment.endTime) < new Date() &&
        !["completed", "cancelled", "declined"].includes(appointment.status)
      ) {
        appointment.status = "completed";
        await appointment.save();
      }
    } catch (err) {
      console.warn("Failed to auto-complete appointment:", err?.message || err);
    }

    // Check if user has access to this appointment
    // Handle both populated and non-populated cases
    const appointmentUserId = (appointment.userId._id || appointment.userId).toString();
    const appointmentFriendId = (appointment.friendId._id || appointment.friendId).toString();
    const currentUserId = req.user._id.toString();
    
    if (
      appointmentUserId !== currentUserId &&
      appointmentFriendId !== currentUserId
    ) {
      return res.status(403).json({ message: "Not authorized to view this appointment" });
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error in getAppointmentById controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateAppointment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const { startTime, endTime, title, description, meetingType, status, bookedBy, declinedReason } =
      req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has authorization to update
    // Both userId (creator) and friendId (recipient) can update the appointment
    const appointmentUserId = (appointment.userId._id || appointment.userId).toString();
    const appointmentFriendId = (appointment.friendId._id || appointment.friendId).toString();
    
    if (appointmentUserId !== userId && appointmentFriendId !== userId) {
      return res.status(403).json({ message: "Not authorized to update this appointment" });
    }

    // Track old status for socket event
    const oldStatus = appointment.status;

    // Validate status transitions if status is being changed
    if (status && status !== appointment.status) {
      const currentStatus = appointment.status;
      const validTransitions = {
        pending: ['confirmed', 'declined', 'cancelled'],
        confirmed: ['cancelled', 'completed'],
        scheduled: ['cancelled', 'completed'],
        completed: [], // Terminal state
        cancelled: [], // Terminal state
        declined: []   // Terminal state
      };

      if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
        return res.status(400).json({
          message: `Cannot transition from '${currentStatus}' to '${status}'. Valid transitions: ${validTransitions[currentStatus].join(', ') || 'none'}`,
          currentStatus,
          attemptedStatus: status,
          validTransitions: validTransitions[currentStatus]
        });
      }
    }

    if (startTime) appointment.startTime = new Date(startTime);
    if (endTime) appointment.endTime = new Date(endTime);
    if (title) appointment.title = title;
    if (description) appointment.description = description;
    if (meetingType) appointment.meetingType = meetingType;
    if (status) appointment.status = status;
    // If client indicates they joined the meeting, add them to attendedBy
    if (req.body.join === true) {
      const already = appointment.attendedBy?.map(String).includes(userId);
      if (!already) {
        appointment.attendedBy = appointment.attendedBy || [];
        appointment.attendedBy.push(userId);
      }
    }
    // Handle rating + feedback (rating is number 1-5, feedback is string)
    if (typeof req.body.rating !== 'undefined') {
      const ratingValue = Number(req.body.rating);
      const feedbackText = typeof req.body.feedback === 'string' ? req.body.feedback : '';

      // ensure ratings array exists
      appointment.ratings = appointment.ratings || [];

      // check if current user already rated
      const existingIndex = appointment.ratings.findIndex(r => (r.userId && r.userId.toString()) === userId);
      if (existingIndex >= 0) {
        // update existing
        appointment.ratings[existingIndex].rating = ratingValue;
        appointment.ratings[existingIndex].feedback = feedbackText;
        appointment.ratings[existingIndex].createdAt = new Date();
      } else {
        // push new rating
        appointment.ratings.push({ userId, rating: ratingValue, feedback: feedbackText, createdAt: new Date() });
      }
    }
    if (declinedReason) appointment.declinedReason = declinedReason;
    if (bookedBy) appointment.bookedBy = { ...appointment.bookedBy, ...bookedBy };

    await appointment.save();
    await appointment.populate(["userId", "friendId"]);

    // Emit socket events for real-time updates
    if (status && status !== oldStatus) {
      // Status changed - emit specific status change event
      emitAppointmentStatusChanged(appointment, oldStatus, status);

      // Create notification for status changes
      const apptUserId = (appointment.userId._id || appointment.userId).toString();
      const apptFriendId = (appointment.friendId._id || appointment.friendId).toString();
      const recipientId = apptUserId === userId ? apptFriendId : apptUserId;
      const sender = await User.findById(userId).select('fullName');

      const formattedDate = new Date(appointment.startTime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      const formattedTime = new Date(appointment.startTime).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });

      let notificationTitle = '';
      let notificationMessage = '';

      if (status === 'confirmed') {
        notificationTitle = 'Appointment Confirmed';
        notificationMessage = `${sender.fullName} has confirmed your appointment scheduled for ${formattedDate} at ${formattedTime}`;
      } else if (status === 'declined') {
        notificationTitle = 'Appointment Declined';
        notificationMessage = `${sender.fullName} has declined your appointment request for ${formattedDate} at ${formattedTime}`;
      } else if (status === 'cancelled') {
        notificationTitle = 'Appointment Cancelled';
        notificationMessage = `${sender.fullName} has cancelled the appointment scheduled for ${formattedDate} at ${formattedTime}`;
      } else if (status === 'completed') {
        notificationTitle = 'Appointment Completed';
        notificationMessage = `Your appointment with ${sender.fullName} scheduled for ${formattedDate} at ${formattedTime} has been marked as completed`;
      }

      if (notificationTitle && notificationMessage) {
        await createNotification({
          recipientId,
          senderId: userId,
          type: "appointment",
          title: notificationTitle,
          message: notificationMessage,
          appointmentId: appointment._id,
        });
      }
    } else {
      // General update (time, title, etc.)
      emitAppointmentUpdated(appointment);
    }

    // If rating was provided in this update, create a notification for the other participant
    try {
      if (typeof req.body.rating !== 'undefined') {
        const ratingValue = Number(req.body.rating);
        const feedbackText = typeof req.body.feedback === 'string' ? req.body.feedback : '';

        // Determine recipient (the other participant)
        const apptUserId = (appointment.userId && appointment.userId._id) ? appointment.userId._id.toString() : (appointment.userId ? appointment.userId.toString() : null);
        const apptFriendId = (appointment.friendId && appointment.friendId._id) ? appointment.friendId._id.toString() : (appointment.friendId ? appointment.friendId.toString() : null);
        const currentUserId = userId;
        let recipientId = null;
        if (apptUserId && apptFriendId) {
          recipientId = apptUserId === currentUserId ? apptFriendId : apptUserId;
        }

        if (recipientId) {
          const sender = await User.findById(userId).select('fullName');
          const shortFeedback = feedbackText ? (feedbackText.length > 120 ? feedbackText.slice(0, 117) + '...' : feedbackText) : '';
          const message = shortFeedback
            ? `${sender.fullName} rated the meeting ${ratingValue}⭐ — "${shortFeedback}"`
            : `${sender.fullName} rated the meeting ${ratingValue}⭐`;

          await createNotification({
            recipientId,
            senderId: userId,
            type: 'rating',
            title: 'New meeting rating',
            message,
            appointmentId: appointment._id,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to create rating notification:', err?.message || err);
    }

    res.status(200).json(appointment);
  } catch (error) {
    console.error("Error in updateAppointment controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteAppointment(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Only the appointment requester (userId) can cancel
    const appointmentUserId = appointment.userId.toString();
    const appointmentFriendId = appointment.friendId.toString();
    
    if (appointmentUserId !== userId) {
      return res.status(403).json({ 
        message: "Only the appointment requester can cancel. Recipients should use the decline option instead." 
      });
    }

    // Prevent cancellation of already completed, cancelled, or declined appointments
    if (['completed', 'cancelled', 'declined'].includes(appointment.status)) {
      return res.status(400).json({ 
        message: `Cannot cancel an appointment that is already ${appointment.status}` 
      });
    }

    // Check cancel notice requirement
    // The cancelNotice is stored in the appointment's availability snapshot
    const cancelNoticeMinutes = appointment.availability?.cancelNotice || 0;
    if (cancelNoticeMinutes > 0) {
      const now = new Date();
      const appointmentStart = new Date(appointment.startTime);
      const minutesUntilAppointment = (appointmentStart - now) / (1000 * 60);

      if (minutesUntilAppointment < cancelNoticeMinutes) {
        const hoursNotice = Math.ceil(cancelNoticeMinutes / 60);
        return res.status(400).json({
          message: `This appointment requires ${hoursNotice} hour${hoursNotice > 1 ? 's' : ''} notice to cancel. Please contact the organizer.`,
          requiredNoticeMinutes: cancelNoticeMinutes,
          minutesUntilAppointment: Math.max(0, minutesUntilAppointment)
        });
      }
    }

    // Mark as cancelled instead of hard delete (better for history/auditing)
    const oldStatus = appointment.status;
    appointment.status = 'cancelled';
    await appointment.save();
    await appointment.populate(["userId", "friendId"]);

    // Create notification for cancellation
    const sender = await User.findById(userId).select('fullName');
    const formattedDate = new Date(appointment.startTime).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const formattedTime = new Date(appointment.startTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    await createNotification({
      recipientId: appointmentFriendId,
      senderId: userId,
      type: "appointment",
      title: "Appointment Cancelled",
      message: `${sender.fullName} has cancelled the appointment scheduled for ${formattedDate} at ${formattedTime}`,
      appointmentId: appointment._id,
    });

    // Emit socket events for real-time updates
    emitAppointmentStatusChanged(appointment, oldStatus, 'cancelled');
    emitAppointmentDeleted(appointment._id, appointmentUserId, appointmentFriendId);

    res.status(200).json({ message: "Appointment cancelled successfully" });
  } catch (error) {
    console.error("Error in deleteAppointment controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function saveCustomAvailability(req, res) {
  try {
    const userId = req.user._id.toString();
    const {
      days,
      start,
      end,
      slotDuration,
      buffer,
      maxPerDay,
      breakTimes,
      minLeadTime,
      cancelNotice,
      appointmentDuration,
      defaultReminderTime,
      availabilityStatus,
    } = req.body;

    if (!days || !start || !end) {
      return res
        .status(400)
        .json({ message: "Missing required fields: days, start, end" });
    }

    // Validate defaultReminderTime if provided
    if (defaultReminderTime !== undefined) {
      const validReminderTimes = [0, 5, 10, 15, 30, 60, 120, 1440];
      if (!validReminderTimes.includes(defaultReminderTime)) {
        return res.status(400).json({ message: 'Invalid defaultReminderTime value' });
      }
    }

    // Update user availability settings using findByIdAndUpdate
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        availability: {
          days,
          start,
          end,
          slotDuration: slotDuration || 30,
          buffer: buffer || 15,
          maxPerDay: maxPerDay || 5,
          breakTimes: breakTimes || [],
          minLeadTime: minLeadTime || 0,
          cancelNotice: cancelNotice || 0,
          appointmentDuration: appointmentDuration || {
            min: 15,
            max: 120,
          },
          defaultReminderTime: defaultReminderTime !== undefined ? defaultReminderTime : 15,
        },
        // Also save maxPerDay to top-level field for appointment creation validation
        maxAppointmentsPerDay: maxPerDay || 5,
        ...(availabilityStatus && ['available', 'limited', 'away'].includes(availabilityStatus) && {
          availabilityStatus: availabilityStatus,
        }),
      },
      { new: true, runValidators: false }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    console.log('✅ User availability updated successfully');
    console.log('Saved availability:', JSON.stringify(updatedUser.availability, null, 2));

    res.status(200).json({
      message: "Availability saved successfully",
      availability: updatedUser.availability,
      availabilityStatus: updatedUser.availabilityStatus,
    });
  } catch (error) {
    console.error("❌ Error in saveCustomAvailability:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
      }

export async function getUserAvailability(req, res) {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    // Default availability for users who haven't customized their settings
    const defaultAvailability = {
      days: [1, 2, 3, 4, 5],
      start: "09:00",
      end: "17:00",
      slotDuration: 30,
      buffer: 15,
      maxPerDay: 5,
      breakTimes: [],
      minLeadTime: 0,
      cancelNotice: 0,
      appointmentDuration: {
        min: 15,
        max: 120,
      },
    };

    // If user doesn't exist or has no availability settings, return defaults with 'available' status
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if availability exists and has the required fields
    if (!user.availability || !user.availability.days || !user.availability.start || !user.availability.end) {
      return res.status(200).json({
        availability: defaultAvailability,
        availabilityStatus: user.availabilityStatus || "available",
      });
    }

    // User has custom availability settings
    res.status(200).json({
      availability: user.availability,
      availabilityStatus: user.availabilityStatus || "available",
    });
  } catch (error) {
    console.error("Error in getUserAvailability controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getUpcomingAppointmentsCount(req, res) {
  try {
    const { friendId } = req.params;
    const { days = 7 } = req.query;

    if (!friendId) {
      return res.status(400).json({ message: "friendId is required" });
    }

    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get date 7 days from now
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + parseInt(days));
    endDate.setHours(23, 59, 59, 999);

    // Find all appointments for the friend in the next 7 days
    const appointments = await Appointment.find({
      $or: [
        { userId: friendId },
        { friendId: friendId },
      ],
      startTime: {
        $gte: today,
        $lt: endDate,
      },
      status: { $in: ['confirmed', 'pending'] }, // Only count confirmed/pending appointments
    }).populate('userId friendId', 'fullName');

    // Count bookings per day
    const bookingsByDay = {};

    // Initialize all days with 0 bookings
    for (let i = 0; i < parseInt(days); i++) {
      const date = new Date(today);
      date.setDate(date.getDate() + i);
      const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
      bookingsByDay[dateKey] = 0;
    }

    // Count appointments for each day
    appointments.forEach((appointment) => {
      const appDate = new Date(appointment.startTime);
      appDate.setHours(0, 0, 0, 0);
      const dateKey = appDate.toISOString().split('T')[0];
      if (bookingsByDay.hasOwnProperty(dateKey)) {
        bookingsByDay[dateKey]++;
      }
    });

    // Convert to array format for frontend
    const bookingsArray = Object.values(bookingsByDay);

    res.status(200).json({
      bookingsByDay: bookingsArray,
      totalAppointments: appointments.length,
    });
  } catch (error) {
    console.error("Error in getUpcomingAppointmentsCount controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
