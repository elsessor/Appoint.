import User from "./models/User.js";
import FriendRequest from "./models/FriendRequest.js";

// Permanently delete users whose scheduled deletion date has passed
export async function hardDeleteExpiredUsers() {
  const now = new Date();

  try {
    const usersToDelete = await User.find({
      isDeletionPending: true,
      deletionScheduledFor: { $lte: now },
    });

    if (!usersToDelete.length) return;

    console.log(`hardDeleteExpiredUsers: found ${usersToDelete.length} user(s) to delete`);

    for (const user of usersToDelete) {
      const userId = user._id;

      // Clean up related friend requests
      await FriendRequest.deleteMany({
        $or: [{ sender: userId }, { recipient: userId }],
      });

      // Remove this user from other users' friends lists
      await User.updateMany({ friends: userId }, { $pull: { friends: userId } });

      // Finally delete the user
      await User.findByIdAndDelete(userId);

      console.log(`hardDeleteExpiredUsers: permanently deleted user ${userId}`);
    }
  } catch (error) {
    console.error("Error in hardDeleteExpiredUsers:", error);
  }
}


