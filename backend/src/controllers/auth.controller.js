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

    // Generate avatar - randomly choose between generated SVG or Iran avatar
    let profilePic;
    
    // Iran avatar URLs (placeholder avatars)
    const iranAvatars = [
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars1',
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars2',
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars3',
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars4',
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars5',
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars6',
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars7',
      'https://api.dicebear.com/7.x/avataaars-neutral/svg?seed=iranianavatars8',
    ];

    // Randomly decide between generated SVG or Iran avatar
    const useIranAvatar = Math.random() < 0.5;

    if (useIranAvatar) {
      const avatarIndex = Math.floor(Math.random() * iranAvatars.length);
      profilePic = iranAvatars[avatarIndex];
    } else {
      // Generate a professional person silhouette avatar (Facebook-style)
      // Uses a fixed color palette for consistency
      const colors = ['#8b9dc3', '#6b8bb8', '#5a7ba6', '#4a6b94', '#3a5b84', '#2a4b74', '#1a3b64', '#0a2b54'];
      const colorIndex = fullName.charCodeAt(0) % colors.length;
      const iconColor = colors[colorIndex];
      const bgColor = '#e4e6eb';
      
      // Create SVG avatar with person silhouette (Facebook-style default profile)
      profilePic = `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" width="200" height="200"><rect width="200" height="200" fill="${bgColor}"/><circle cx="100" cy="75" r="35" fill="${iconColor}"/><ellipse cx="100" cy="160" rx="60" ry="50" fill="${iconColor}"/></svg>`)}`;
    }

    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        // Don't send image - can cause permission issues
      });
      console.log("✅ Stream user created successfully for:", newUser._id.toString());
    } catch (err) {
      console.error("❌ CRITICAL: Failed to create Stream user during signup:", err?.message || err);
      // Delete the user since Stream setup failed
      await User.findByIdAndDelete(newUser._id);
      return res.status(500).json({ message: "Failed to setup chat services. Please try again." });
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

    const { fullName, bio, nationality, location, phone, skills, interests } = req.body;
    console.log('Onboarding request body:', req.body);
    console.log('profilePic in req.body:', req.body.profilePic);
    
    if (!fullName || !bio || !nationality || !location) {
      return res.status(400).json({
        message: "All fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nationality && "nationality",
          !location && "location",
        ].filter(Boolean),
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        skills: Array.isArray(skills) ? skills : [],
        interests: Array.isArray(interests) ? interests : [],
        isOnboarded: true,
      },
      { new: true }
    );

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        // Don't send image - can cause permission issues
      });
      console.log("✅ Stream user updated successfully during onboarding:", updatedUser._id.toString());
    } catch (streamError) {
      console.error("❌ CRITICAL: Failed to update Stream user during onboarding:", streamError?.message || streamError);
      return res.status(500).json({ message: "Failed to sync profile with chat services. Please try again." });
    }

    return res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Onboarding error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists (security best practice)
      return res.status(200).json({
        success: true,
        message: "If an account exists with that email, you can reset it",
      });
    }

    // For simple version, no actual reset token needed
    // User enters new password directly in modal
    return res.status(200).json({
      success: true,
      message: "Email found. You can now reset your password.",
    });
  } catch (error) {
    console.error("Error in forgot password controller", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function verifyEmail(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "Email not found in our records" });
    }

    return res.status(200).json({
      success: true,
      message: "Email verified. Please enter your new password.",
    });
  } catch (error) {
    console.error("Error verifying email", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function resetPasswordSimple(req, res) {
  try {
    const { email, newPassword } = req.body;

    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password has been reset successfully",
    });
  } catch (error) {
    console.error("Error resetting password", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}


