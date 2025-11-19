import Appointment from "../models/Appointment.js";
import User from "../models/User.js";

export async function createAppointment(req, res) {
  try {
    const userId = req.user.id;
    const {
      friendId,
      startTime,
      endTime,
      title,
      description,
      meetingType,
      bookedBy,
      availability,
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

    const appointment = new Appointment({
      userId,
      friendId,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      title: title || "Appointment",
      description: description || "",
      meetingType: meetingType || "Video Call",
      status: "scheduled",
      bookedBy: bookedBy || {},
      availability: availability || {},
    });

    await appointment.save();
    await appointment.populate(["userId", "friendId"]);

    res.status(201).json(appointment);
  } catch (error) {
    console.error("Error in createAppointment controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getAppointments(req, res) {
  try {
    const userId = req.user.id;

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
    const userId = req.user.id;

    const appointment = await Appointment.findById(id)
      .populate("userId", "fullName profilePic email")
      .populate("friendId", "fullName profilePic email");

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has access to this appointment
    if (
      appointment.userId.toString() !== userId &&
      appointment.friendId.toString() !== userId
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
    const userId = req.user.id;
    const { startTime, endTime, title, description, meetingType, status, bookedBy } =
      req.body;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has authorization to update
    if (appointment.userId.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to update this appointment" });
    }

    if (startTime) appointment.startTime = new Date(startTime);
    if (endTime) appointment.endTime = new Date(endTime);
    if (title) appointment.title = title;
    if (description) appointment.description = description;
    if (meetingType) appointment.meetingType = meetingType;
    if (status) appointment.status = status;
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
    const userId = req.user.id;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check if user has authorization to delete
    if (appointment.userId.toString() !== userId) {
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
    const userId = req.user.id;
    const { days, start, end, slotDuration, buffer, maxPerDay } = req.body;

    if (!days || !start || !end) {
      return res
        .status(400)
        .json({ message: "Missing required fields: days, start, end" });
    }

    // Create or update availability record
    let appointment = await Appointment.findOne({ userId, title: "Availability" });

    if (!appointment) {
      appointment = new Appointment({
        userId,
        title: "Availability",
        availability: {
          days,
          start,
          end,
          slotDuration: slotDuration || 30,
          buffer: buffer || 15,
          maxPerDay: maxPerDay || 5,
        },
      });
    } else {
      appointment.availability = {
        days,
        start,
        end,
        slotDuration: slotDuration || 30,
        buffer: buffer || 15,
        maxPerDay: maxPerDay || 5,
      };
    }

    await appointment.save();

    res.status(200).json({
      message: "Availability saved successfully",
      availability: appointment.availability,
    });
  } catch (error) {
    console.error("Error in saveCustomAvailability controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getUserAvailability(req, res) {
  try {
    const { userId } = req.params;

    const availabilityRecord = await Appointment.findOne({
      userId,
      title: "Availability",
    });

    if (!availabilityRecord) {
      return res.status(200).json({
        days: [1, 2, 3, 4, 5],
        start: "09:00",
        end: "17:00",
        slotDuration: 30,
        buffer: 15,
        maxPerDay: 5,
      });
    }

    res.status(200).json(availabilityRecord.availability);
  } catch (error) {
    console.error("Error in getUserAvailability controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
