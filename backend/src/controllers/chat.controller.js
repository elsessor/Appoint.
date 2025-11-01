import { generateStreamToken, upsertStreamUser } from "../lib/stream.js";
import User from "../models/User.js";

export async function getStreamToken(req, res) {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.query;
    
    console.log("=== GET STREAM TOKEN ===");
    console.log("Current user ID:", userId.toString());
    console.log("Target user ID from query:", targetUserId);
    console.log("Full query params:", req.query);
    
    // Sync current user
    try {
      await upsertStreamUser({
        id: userId.toString(),
        name: req.user.fullName,
        image: req.user.profilePic || "",
      });
      console.log(`✅ Stream user synced for ${req.user.fullName}`);
    } catch (streamError) {
      console.error("❌ Error upserting Stream user:", streamError);
    }
    
    // Sync target user if provided
    if (targetUserId) {
      console.log("🔍 Target user ID provided, fetching from database...");
      try {
        const targetUser = await User.findById(targetUserId).select("-password");
        if (targetUser) {
          console.log("✅ Target user found:", targetUser.fullName);
          await upsertStreamUser({
            id: targetUser._id.toString(),
            name: targetUser.fullName,
            image: targetUser.profilePic || "",
          });
          console.log(`✅ Target user ${targetUser.fullName} synced to Stream`);
        } else {
          console.log("❌ Target user not found in database");
        }
      } catch (err) {
        console.error("❌ Error syncing target user:", err);
      }
    } else {
      console.log("⚠️ WARNING: No target user ID provided in query params!");
    }
    
    const token = generateStreamToken(userId);

    res.status(200).json({ token });
  } catch (error) {
    console.log("Error in getStreamToken controller:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
}