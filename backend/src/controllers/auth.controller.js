import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";
import jwt from "jsonwebtoken";

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
      return res.status(400).json({ message: "Email already exists, please use a diffrent one" });
    }

    const idx = Math.floor(Math.random() * 100) + 1; 
    const randomAvatar = `https://avatar.iran.liara.run/public/${idx}.png`;

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
      availability: {
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
      },
      availabilityStatus: "available",
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream user created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating Stream user:", error);
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({ success: true, user: newUser });
  } catch (error) {
    console.log("Error in signup controller", error);
    res.status(500).json({ message: "Internal Server Error" });
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
        // Grace period is over – account should have been deleted
        return res.status(410).json({ message: "This account has been permanently deleted." });
      } else {
        // Still in grace period – cancel deletion
        user.isDeletionPending = false;
        user.deletionRequestedAt = null;
        user.deletionScheduledFor = null;
        await user.save();

        deletionCancellation = {
          cancelled: true,
          message:
            "You have prevented the deletion of your account. Your account is active again.",
        };
      }
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true, 
      sameSite: "strict", 
      secure: process.env.NODE_ENV === "production",
    });

    res.status(200).json({ success: true, user, deletionCancellation });
  } catch (error) {
    console.log("Error in login controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export function logout(req, res) {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "Logout successful" });
}

export async function onboard(req, res) {
  try {
    const userId = req.user._id;

    const { 
      fullName, 
      bio, 
      nativeLanguage, 
      learningLanguage, 
      location, 
      nationality,
      profession,
      skills,
      profilePic
    } = req.body;

    // Required fields validation
    if (!fullName || !bio || !nativeLanguage || !learningLanguage || !location || !nationality) {
      return res.status(400).json({
        message: "Required fields are missing",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "location",
          !nationality && "nationality",
        ].filter(Boolean),
      });
    }

    // Build update object
    const updateData = {
      fullName,
      bio,
      nativeLanguage,
      learningLanguage,
      location,
      nationality,
      isOnboarded: true,
    };

    // Add optional fields if provided
    if (profession) updateData.profession = profession;
    if (skills && Array.isArray(skills)) updateData.skills = skills;
    if (profilePic) updateData.profilePic = profilePic;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      updateData,
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated after onboarding for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user during onboarding:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}