import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  cancelFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserById,
  markNotificationsRead,
  sendFriendRequest,
  unfriend,
  getMySettings,
  updateMySettings,
  changePassword,
  deleteMyAccount,
  updateProfilePicture,
  getMyProfile,
  updateMyProfile,
  toggleFavorite,
  updatePrivacyPreferences,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/friends", getMyFriends);
router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.delete("/friend-request/:id", cancelFriendRequest);
router.delete("/friend/:id", unfriend);
router.put("/notifications/read", markNotificationsRead);

// Settings
router.get("/me/settings", getMySettings);
router.put("/me/settings", updateMySettings);
router.put("/me/password", changePassword);
router.put("/me/profile-picture", updateProfilePicture);
router.delete("/me", deleteMyAccount);

// Preferences
router.put("/preferences/privacy", updatePrivacyPreferences);

// Profile
router.get("/me/profile", getMyProfile);
router.put("/me/profile", updateMyProfile);
router.post("/favorite/:id", toggleFavorite);

router.get("/", getRecommendedUsers);
router.get("/:id", getUserById);

export default router;