import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

const COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

function signJwt(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET_KEY, { expiresIn: "7d" });
}

function cookieOptions() {
  return {
    maxAge: COOKIE_MAX_AGE,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  };
}

export async function signup(req, res) {
  const { email, password, fullName } = req.body;

  try {
    if (!email || !password || !fullName) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: "Invalid email format" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists, please use a different one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1;
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
    } catch (err) {
      console.log("Error creating Stream user:", err?.message || err);
    }

    const token = signJwt(newUser._id);
    res.cookie("jwt", token, cookieOptions());

    return res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.error("Error in signup controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: "Invalid email or password" });

    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) return res.status(401).json({ message: "Invalid email or password" });

    // Handle pending deletion / grace period
    const now = new Date();
    let deletionCancellation = null;

    if (user.isDeletionPending && user.deletionScheduledFor) {
      if (user.deletionScheduledFor <= now) {
        return res.status(410).json({ message: "This account has been permanently deleted." });
      } else {
        user.isDeletionPending = false;
        user.deletionRequestedAt = null;
        user.deletionScheduledFor = null;
        await user.save();

        deletionCancellation = {
          cancelled: true,
          message: "You have prevented the deletion of your account. Your account is active again.",
        };
      }
    }

    const token = signJwt(user._id);
    res.cookie("jwt", token, cookieOptions());

    return res.status(200).json({ success: true, user, deletionCancellation });
  } catch (error) {
    console.error("Error in login controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt", cookieOptions());
  return res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user && req.user._id;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const { fullName, bio, nativeLanguage, learningLanguage, location } = req.body;
    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError?.message || streamError);
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}