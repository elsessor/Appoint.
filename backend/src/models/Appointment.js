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
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
