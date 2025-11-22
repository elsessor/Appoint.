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
    availabilityStatus: {
      type: String,
      enum: ["available", "limited", "away"],
      default: "available",
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
      minLeadTime: {
        type: Number,
        default: 0, // hours before booking
      },
      cancelNotice: {
        type: Number,
        default: 0, // hours before appointment to cancel
      },
      appointmentDuration: {
        min: {
          type: Number,
          default: 15, // minutes
        },
        max: {
          type: Number,
          default: 120, // minutes
        },
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