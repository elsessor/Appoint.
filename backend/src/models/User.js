import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    bio: {
      type: String,
      default: "",
    },
    profilePic: {
      type: String,
      default: "",
    },
    nativeLanguage: {
      type: String,
      default: "",
    },
    learningLanguage: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "",
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    settings: {
      notifications: {
        appointmentReminders: { type: Boolean, default: true },
        newMessages: { type: Boolean, default: true },
        appointmentRequests: { type: Boolean, default: true },
        emailNotifications: { type: Boolean, default: true },
        smsNotifications: { type: Boolean, default: false },
        reminderTiming: { type: String, default: "15 minutes before" },
      },
      privacy: {
        profileVisible: { type: Boolean, default: true },
        onlineStatus: { type: Boolean, default: true },
        readReceipts: { type: Boolean, default: true },
      },
      videoAudio: {
        camera: { type: String, default: "Default Camera" },
        microphone: { type: String, default: "Default Microphone" },
        speaker: { type: String, default: "Default Speaker" },
        hdVideo: { type: Boolean, default: false },
        noiseCancellation: { type: Boolean, default: false },
        autoStartVideo: { type: Boolean, default: false },
        mirrorVideo: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  const isPasswordCorrect = await bcrypt.compare(enteredPassword, this.password);
  return isPasswordCorrect;
};

const User = mongoose.model("User", userSchema);

export default User;