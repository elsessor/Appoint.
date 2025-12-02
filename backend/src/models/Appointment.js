import mongoose from "mongoose";

const appointmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    friendId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    title: {
      type: String,
      default: "Appointment",
    },
    description: {
      type: String,
      default: "",
    },
    meetingType: {
      type: String,
      enum: ["Video Call", "Phone Call", "In Person"],
      default: "Video Call",
    },
    status: {
      type: String,
      enum: ["pending", "scheduled", "confirmed", "completed", "cancelled", "declined"],
      default: "pending",
    },
    // List of users who actually attended/joined the appointment
    attendedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Ratings and feedback left by participants after completion
    ratings: [
      {
        userId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        rating: {
          type: Number,
          min: 1,
          max: 5,
        },
        feedback: {
          type: String,
          default: "",
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    declinedReason: {
      type: String,
      default: "",
    },
    bookedBy: {
      firstName: String,
      lastName: String,
      email: String,
      phoneNumber: String,
      notes: String,
    },
    availability: {
      days: [Number],
      start: String,
      end: String,
      slotDuration: Number,
      buffer: Number,
      maxPerDay: Number,
      breakTimes: [
        {
          start: String,
          end: String,
        },
      ],
      minLeadTime: Number,
      cancelNotice: Number,
    },
    duration: {
      type: Number,
      required: true,
      min: 15,
      max: 480, // max 8 hours
    },
    reminder: {
      type: Number,
      default: 15, // minutes before appointment
      enum: [0, 5, 10, 15, 30, 60, 120, 1440], // 0, 5min, 10min, 15min, 30min, 1hr, 2hr, 1day
    },
    location: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
