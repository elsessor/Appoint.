import Appointment from "../models/Appointment.js";
import User from "../models/User.js";
import { createNotification } from "./notifications.controller.js";
import {
  isWithinBreakTime,
  checkLeadTime,
  validateAppointmentDuration,
} from "../utils/availabilityUtils.js";

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
    // This prevents both users from having conflicting appointments
    const overlappingAppointments = await Appointment.find({
      $or: [
        // Check if friend already has appointments at this time
        {
          $or: [
            { userId: friendId },
            { friendId: friendId }
          ]
        },
        // Check if current user already has appointments at this time
        {
          $or: [
            { userId: userId },
            { friendId: userId }
          ]
        }
      ],
      // Only check non-cancelled appointments
      status: { $in: ['pending', 'confirmed', 'scheduled'] },
      // Time overlap check: appointment starts before new one ends AND ends after new one starts
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    // Filter to only relevant conflicts (not with each other already)
    const hasConflict = overlappingAppointments.some(existingAppt => {
      const existingUserId = (existingAppt.userId._id || existingAppt.userId).toString();
      const existingFriendId = (existingAppt.friendId._id || existingAppt.friendId).toString();
      
      // Skip if this is an appointment between these two users (update scenario)
      if ((existingUserId === userId && existingFriendId === friendId) ||
          (existingUserId === friendId && existingFriendId === userId)) {
        return false;
      }
      
      // Conflict if:
      // - Friend has other appointments that conflict
      // - Current user has other appointments that conflict
      return (existingUserId === friendId || existingFriendId === friendId) ||
             (existingUserId === userId || existingFriendId === userId);
    });

    if (hasConflict) {
      const conflictingAppt = overlappingAppointments.find(appt => {
        const existingUserId = (appt.userId._id || appt.userId).toString();
        const existingFriendId = (appt.friendId._id || appt.friendId).toString();
        return ((existingUserId === friendId || existingFriendId === friendId) ||
                (existingUserId === userId || existingFriendId === userId));
      });
      
      const conflictTime = new Date(conflictingAppt.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
      
      return res.status(409).json({
        message: `This time slot conflicts with an existing appointment at ${conflictTime}. Please choose a different time.`,
        conflictingAppointmentId: conflictingAppt._id,
        conflictTime: conflictingAppt.startTime
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
      appointmentDuration: appointmentDuration || durationMinutes,
    });

    await appointment.save();
    await appointment.populate(["userId", "friendId"]);

    // Create notification for the friend
    const user = await User.findById(userId);
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

    res.status(200).json(appointments);
  } catch (error) {
    console.error("Error in getAppointments controller", error.message);
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

    if (startTime) appointment.startTime = new Date(startTime);
    if (endTime) appointment.endTime = new Date(endTime);
    if (title) appointment.title = title;
    if (description) appointment.description = description;
    if (meetingType) appointment.meetingType = meetingType;
    if (status) appointment.status = status;
    if (declinedReason) appointment.declinedReason = declinedReason;
    if (bookedBy) appointment.bookedBy = { ...appointment.bookedBy, ...bookedBy };

    await appointment.save();
    await appointment.populate(["userId", "friendId"]);

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

    // Check if user has authorization to delete (either userId or friendId can delete)
    const appointmentUserId = appointment.userId.toString();
    const appointmentFriendId = appointment.friendId.toString();
    
    if (appointmentUserId !== userId && appointmentFriendId !== userId) {
      return res.status(403).json({ message: "Not authorized to delete this appointment" });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({ message: "Appointment deleted successfully" });
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
      availabilityStatus,
    } = req.body;

    if (!days || !start || !end) {
      return res
        .status(400)
        .json({ message: "Missing required fields: days, start, end" });
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
        },
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
