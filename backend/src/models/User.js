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
    phone: {
      type: String,
      default: "",
    },
    twitter: {
      type: String,
      default: "",
    },
    pinterest: {
      type: String,
      default: "",
    },
    linkedin: {
      type: String,
      default: "",
    },
    skills: {
      type: [String],
      default: [],
    },
    isOnboarded: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    friends: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    favorites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    // Availability settings
    availability: {
      days: {
        type: [Number],
        default: [1, 2, 3, 4, 5], // 0=Sunday, 1=Monday, etc.
      },
      start: {
        type: String,
        default: "09:00",
      },
      end: {
        type: String,
        default: "17:00",
      },
      slotDuration: {
        type: Number,
        default: 30,
      },
      buffer: {
        type: Number,
        default: 15,
      },
      maxPerDay: {
        type: Number,
        default: 5,
      },
      breakTimes: {
        type: [
          {
            start: String,
            end: String,
          },
        ],
        default: [],
      },
      minLeadTime: {
        type: Number,
        default: 0,
      },
      cancelNotice: {
        type: Number,
        default: 0,
      },
      appointmentDuration: {
        min: {
          type: Number,
          default: 15,
        },
        max: {
          type: Number,
          default: 120,
        },
      },
      defaultReminderTime: {
        type: Number,
        default: 15,
        enum: [0, 5, 10, 15, 30, 60, 120, 1440], // minutes before appointment
      },
    },
    // Availability status: available, limited, or away
    availabilityStatus: {
      type: String,
      enum: ["available", "limited", "away"],
      default: "available",
    },
    // User Preferences (functional settings)
    preferences: {
      privacy: {
        appointmentRequestsFrom: { type: String, default: "everyone", enum: ["everyone", "friends"] },
        showAvailability: { type: String, default: "everyone", enum: ["everyone", "friends", "nobody"] },
        profileVisibility: { type: String, default: "public", enum: ["public", "private"] },
      },
    },
    availability: {
      days: {
        type: [Number],
        default: [1, 2, 3, 4, 5],
      },
      start: {
        type: String,
        default: "09:00",
      },
      end: {
        type: String,
        default: "17:00",
      },
      slotDuration: {
        type: Number,
        default: 30,
      },
      buffer: {
        type: Number,
        default: 15,
      },
      maxPerDay: {
        type: Number,
        default: 5,
      },
      breakTimes: {
        type: [{ start: String, end: String }],
        default: [],
      },
      minLeadTime: {
        type: Number,
        default: 0,
      },
      cancelNotice: {
        type: Number,
        default: 0,
      },
      appointmentDuration: {
        min: {
          type: Number,
          default: 15,
        },
        max: {
          type: Number,
          default: 120,
        },
      },
    },
    availabilityStatus: {
      type: String,
      enum: ['available', 'limited', 'away'],
      default: 'available',
    },
    // Soft delete / scheduled deletion
    isDeletionPending: {
      type: Boolean,
      default: false,
    },
    deletionRequestedAt: {
      type: Date,
    },
    deletionScheduledFor: {
      type: Date,
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