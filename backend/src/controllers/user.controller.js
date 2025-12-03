import User from "../models/User.js";
import FriendRequest from "../models/FriendRequest.js";
import mongoose from "mongoose";
import { upsertStreamUser } from "../lib/stream.js";
import { emitNotificationUpdate } from "../lib/socket.js";

export async function getRecommendedUsers(req, res) {
  try {
    const currentUserId = req.user.id;
    const currentUser = req.user;

    // Get all users who are not the current user, not already friends, onboarded, and not pending deletion
    let recommendedUsers = await User.find({
      $and: [
        { _id: { $ne: currentUserId } },
        { _id: { $nin: currentUser.friends } },
        { isOnboarded: true },
        { isDeletionPending: { $ne: true } },
      ],
    }).lean();

    // Filter out users with profileVisibility: 'private' unless the viewer is a friend
    recommendedUsers = recommendedUsers.filter(user => {
      if (user.preferences?.privacy?.profileVisibility === "private") {
        // Only show if current user is a friend
        return user.friends?.map(f => f.toString()).includes(currentUserId.toString());
      }
      return true; // public profiles
    });

    res.status(200).json(recommendedUsers);
  } catch (error) {
    console.error("Error in getRecommendedUsers controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getUserById(req, res) {
  try {
    const { id } = req.params;
    const currentUserId = req.user?.id;
    const viewerId = req.user?._id?.toString() || req.user?.id?.toString();
    const user = await User.findById(id).select("-password -email");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    const userData = user.toObject();
    if (currentUserId) {
      const currentUser = await User.findById(currentUserId).select("favorites");
      userData.isFavorite = currentUser?.favorites?.includes(id) || false;
    }
    
    res.status(200).json(userData);
    // Privacy enforcement
    if (user.preferences?.privacy?.profileVisibility === "private") {
      const isFriend = user.friends?.map(f => f.toString()).includes(viewerId);
      const isSelf = viewerId === user._id.toString();
      if (!isFriend && !isSelf) {
        return res.status(403).json({ message: "This profile is private." });
      }
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error in getUserById controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyFriends(req, res) {
  try {
    const user = await User.findById(req.user.id)
      .select("friends favorites")
      .populate("friends", "fullName profilePic nativeLanguage learningLanguage availabilityStatus");

    const friendsWithFavoriteStatus = user.friends.map(friend => {
      const friendObj = friend.toObject();
      friendObj.isFavorite = user.favorites.includes(friend._id);
      return friendObj;
    });

    res.status(200).json(friendsWithFavoriteStatus);
  } catch (error) {
    console.error("Error in getMyFriends controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function sendFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: recipientId } = req.params;

    if (myId === recipientId) {
      return res.status(400).json({ message: "You can't send friend request to yourself" });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient) {
      return res.status(404).json({ message: "Recipient not found" });
    }

    if (recipient.friends.includes(myId)) {
      return res.status(400).json({ message: "You are already friends with this user" });
    }

    const existingRequest = await FriendRequest.findOne({
      $or: [
        { sender: myId, recipient: recipientId },
        { sender: recipientId, recipient: myId },
      ],
    });

    if (existingRequest) {
      return res
        .status(400)
        .json({ message: "A friend request already exists between you and this user" });
    }

    const friendRequest = await FriendRequest.create({
      sender: myId,
      recipient: recipientId,
      recipientSeen: false,
      senderSeen: true,
    });

    emitNotificationUpdate(recipientId);

    res.status(201).json(friendRequest);
  } catch (error) {
    console.error("Error in sendFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function acceptFriendRequest(req, res) {
  try {
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.recipient.toString() !== req.user.id) {
      return res.status(403).json({ message: "You are not authorized to accept this request" });
    }

    friendRequest.status = "accepted";
    friendRequest.senderSeen = false;
    friendRequest.recipientSeen = true;
    await friendRequest.save();

    await User.findByIdAndUpdate(friendRequest.sender, {
      $addToSet: { friends: friendRequest.recipient },
    });

    await User.findByIdAndUpdate(friendRequest.recipient, {
      $addToSet: { friends: friendRequest.sender },
    });

    emitNotificationUpdate(friendRequest.sender);
    emitNotificationUpdate(friendRequest.recipient);

    res.status(200).json({ message: "Friend request accepted" });
  } catch (error) {
    console.log("Error in acceptFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getFriendRequests(req, res) {
  try {
    const incomingReqs = await FriendRequest.find({
      recipient: req.user.id,
      status: "pending",
    }).populate("sender", "fullName profilePic nativeLanguage learningLanguage availabilityStatus");

    const acceptedReqs = await FriendRequest.find({
      sender: req.user.id,
      status: "accepted",
    }).populate("recipient", "fullName profilePic availabilityStatus");

    res.status(200).json({ incomingReqs, acceptedReqs });
  } catch (error) {
    console.log("Error in getPendingFriendRequests controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getOutgoingFriendReqs(req, res) {
  try {
    const outgoingRequests = await FriendRequest.find({
      sender: req.user.id,
      status: "pending",
    }).populate("recipient", "fullName profilePic nativeLanguage learningLanguage availabilityStatus");

    res.status(200).json(outgoingRequests);
  } catch (error) {
    console.log("Error in getOutgoingFriendReqs controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function cancelFriendRequest(req, res) {
  try {
    const myId = req.user.id;
    const { id: requestId } = req.params;

    const friendRequest = await FriendRequest.findById(requestId);

    if (!friendRequest) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    if (friendRequest.sender.toString() !== myId) {
      return res.status(403).json({ message: "You are not authorized to cancel this request" });
    }

    if (friendRequest.status !== "pending") {
      return res.status(400).json({ message: "Cannot cancel a request that is not pending" });
    }

    await FriendRequest.findByIdAndDelete(requestId);

    emitNotificationUpdate(friendRequest.recipient);

    res.status(200).json({ message: "Friend request cancelled successfully" });
  } catch (error) {
    console.error("Error in cancelFriendRequest controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function unfriend(req, res) {
  try {
    const myId = req.user.id;
    const { id: friendId } = req.params;

    if (myId === friendId) {
      return res.status(400).json({ message: "You can't unfriend yourself" });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    await User.findByIdAndUpdate(myId, {
      $pull: { friends: friendId },
    });

    await User.findByIdAndUpdate(friendId, {
      $pull: { friends: myId },
    });

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error in unfriend controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMySettings(req, res) {
  try {
    const user = await User.findById(req.user.id).select("settings");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.status(200).json(user.settings || {});
  } catch (error) {
    console.error("Error in getMySettings controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateMySettings(req, res) {
  try {
    const { notifications, privacy, videoAudio, availability } = req.body;

    const updates = {};
    if (notifications) updates["settings.notifications"] = notifications;
    if (privacy) updates["settings.privacy"] = privacy;
    if (videoAudio) updates["settings.videoAudio"] = videoAudio;
    
    // Handle availability settings including max appointments per day
    if (availability) {
      // Validate maxPerDay if provided
      if (availability.maxPerDay !== undefined) {
        const maxPerDay = parseInt(availability.maxPerDay, 10);
        if (isNaN(maxPerDay) || maxPerDay < 1 || maxPerDay > 20) {
          return res.status(400).json({ 
            message: "Max appointments per day must be between 1 and 20" 
          });
        }
        updates["availability.maxPerDay"] = maxPerDay;
      }
      
      // Handle other availability fields
      if (availability.days !== undefined) updates["availability.days"] = availability.days;
      if (availability.start !== undefined) updates["availability.start"] = availability.start;
      if (availability.end !== undefined) updates["availability.end"] = availability.end;
      if (availability.slotDuration !== undefined) updates["availability.slotDuration"] = availability.slotDuration;
      if (availability.buffer !== undefined) updates["availability.buffer"] = availability.buffer;
      if (availability.minLeadTime !== undefined) updates["availability.minLeadTime"] = availability.minLeadTime;
      if (availability.cancelNotice !== undefined) updates["availability.cancelNotice"] = availability.cancelNotice;
      if (availability.appointmentDuration !== undefined) updates["availability.appointmentDuration"] = availability.appointmentDuration;
      if (availability.breakTimes !== undefined) updates["availability.breakTimes"] = availability.breakTimes;
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No settings provided to update" });
    }

    const user = await User.findByIdAndUpdate(req.user.id, { $set: updates }, { new: true }).select(
      "settings availability"
    );

    res.status(200).json({
      settings: user.settings,
      availability: user.availability
    });
  } catch (error) {
    console.error("Error in updateMySettings controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updatePrivacyPreferences(req, res) {
  try {
    const userId = req.user.id;
    const { appointmentRequestsFrom, showAvailability, profileVisibility } = req.body;

    const validAppointmentRequestsFrom = ["everyone", "friends"];
    const validShowAvailability = ["everyone", "friends", "nobody"];
    const validProfileVisibility = ["public", "private"];

    if (appointmentRequestsFrom && !validAppointmentRequestsFrom.includes(appointmentRequestsFrom)) {
      return res.status(400).json({ message: "Invalid appointmentRequestsFrom value" });
    }

    if (showAvailability && !validShowAvailability.includes(showAvailability)) {
      return res.status(400).json({ message: "Invalid showAvailability value" });
    }

    if (profileVisibility && !validProfileVisibility.includes(profileVisibility)) {
      return res.status(400).json({ message: "Invalid profileVisibility value" });
    }

    // Use upsert-style update to ensure preferences object exists
    const user = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          "preferences.privacy.appointmentRequestsFrom": appointmentRequestsFrom || "everyone",
          "preferences.privacy.showAvailability": showAvailability || "everyone",
          "preferences.privacy.profileVisibility": profileVisibility || "public",
        },
      },
      { new: true, upsert: false }
    ).select("preferences");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ privacy: user.preferences?.privacy });
  } catch (error) {
    console.error("Error in updatePrivacyPreferences controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function changePassword(req, res) {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current and new passwords are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters long" });
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error in changePassword controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function deleteMyAccount(req, res) {
  try {
    const userId = req.user.id;
    const { confirmation, gracePeriodDays } = req.body || {};

    if (confirmation !== "DELETE") {
      return res.status(400).json({ message: "Invalid confirmation phrase" });
    }

    // Determine grace period (default 14 days, clamp to 1–30 days for safety)
    let days = Number.isFinite(Number(gracePeriodDays)) ? Number(gracePeriodDays) : 14;
    if (Number.isNaN(days)) days = 14;
    days = Math.min(Math.max(days, 1), 30);

    const now = new Date();
    const scheduledFor = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $set: {
          isDeletionPending: true,
          deletionRequestedAt: now,
          deletionScheduledFor: scheduledFor,
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.clearCookie("jwt");
    res.status(200).json({
      message: "Account scheduled for deletion",
      deletionScheduledFor: scheduledFor,
      gracePeriodDays: days,
    });
  } catch (error) {
    console.error("Error in deleteMyAccount controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateProfilePicture(req, res) {
  try {
    const userId = req.user.id;
    const { profilePic } = req.body;

    if (!profilePic) {
      return res.status(400).json({ message: "Profile picture is required" });
    }

    if (typeof profilePic !== 'string') {
      return res.status(400).json({ message: "Invalid profile picture format" });
    }

    if (!profilePic.startsWith('data:image/')) {
      return res.status(400).json({ message: "Profile picture must be a valid image data URL" });
    }

    if (profilePic.length > 10 * 1024 * 1024) {
      return res.status(400).json({ message: "Profile picture is too large. Maximum size is 10MB." });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { profilePic },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user:", streamError.message);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.error("Error in updateProfilePicture controller", error.message);
    if (error.name === 'PayloadTooLargeError') {
      return res.status(413).json({ message: "Image file is too large. Please use a smaller image." });
    }
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function getMyProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    res.status(200).json({
      fullName: user.fullName,
      profilePic: user.profilePic,
      bio: user.bio,
      location: user.location,
      phone: user.phone,
      twitter: user.twitter,
      pinterest: user.pinterest,
      linkedin: user.linkedin,
      skills: user.skills || [],
    });
  } catch (error) {
    console.error("Error in getMyProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function updateMyProfile(req, res) {
  try {
    const userId = req.user.id;
    const { fullName, bio, location, phone, twitter, pinterest, linkedin, skills } = req.body;

    const updates = {};
    if (fullName !== undefined) updates.fullName = fullName;
    if (bio !== undefined) updates.bio = bio;
    if (location !== undefined) updates.location = location;
    if (phone !== undefined) updates.phone = phone;
    if (twitter !== undefined) updates.twitter = twitter;
    if (pinterest !== undefined) updates.pinterest = pinterest;
    if (linkedin !== undefined) updates.linkedin = linkedin;
    if (skills !== undefined) updates.skills = Array.isArray(skills) ? skills : [];

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: "No profile fields provided to update" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true }
    ).select("-password");

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream user updated for ${updatedUser.fullName}`);
    } catch (streamError) {
      console.log("Error updating Stream user:", streamError.message);
    }

    res.status(200).json({
      success: true,
      user: {
        fullName: updatedUser.fullName,
        profilePic: updatedUser.profilePic,
        bio: updatedUser.bio,
        location: updatedUser.location,
        phone: updatedUser.phone,
        twitter: updatedUser.twitter,
        pinterest: updatedUser.pinterest,
        linkedin: updatedUser.linkedin,
        skills: updatedUser.skills || [],
      },
    });
  } catch (error) {
    console.error("Error in updateMyProfile controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function markNotificationsRead(req, res) {
  try {
    const userId = req.user.id;

    await FriendRequest.updateMany(
      { recipient: userId, recipientSeen: false },
      { $set: { recipientSeen: true } }
    );

    await FriendRequest.updateMany(
      { sender: userId, senderSeen: false },
      { $set: { senderSeen: true } }
    );

    res.status(200).json({ success: true, message: "Notifications marked as read" });
  } catch (error) {
    console.error("Error in markNotificationsRead controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

export async function toggleFavorite(req, res) {
  try {
    const userId = req.user.id;
    const { id: friendId } = req.params;

    if (!friendId || !mongoose.Types.ObjectId.isValid(friendId)) {
      return res.status(400).json({ message: "Invalid friend ID" });
    }

    // Check if friend exists
    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if friendId is in favorites
    const isFavorited = user.favorites.includes(friendId);

    if (isFavorited) {
      // Remove from favorites
      user.favorites = user.favorites.filter(id => id.toString() !== friendId);
    } else {
      // Add to favorites
      user.favorites.push(friendId);
    }

    await user.save();

    res.status(200).json({
      success: true,
      isFavorite: !isFavorited,
      message: isFavorited ? "Removed from favorites" : "Added to favorites",
    });
  } catch (error) {
    console.error("Error in toggleFavorite controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}