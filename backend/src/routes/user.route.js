import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  acceptFriendRequest,
  getFriendRequests,
  getMyFriends,
  getOutgoingFriendReqs,
  getRecommendedUsers,
  markNotificationsRead,
  sendFriendRequest,
  getMySettings,
  updateMySettings,
  changePassword,
  deleteMyAccount,
  updateProfilePicture,
  getMyProfile,
  updateMyProfile,
} from "../controllers/user.controller.js";

const router = express.Router();

router.use(protectRoute);

router.get("/", getRecommendedUsers);
router.get("/friends", getMyFriends);

router.post("/friend-request/:id", sendFriendRequest);
router.put("/friend-request/:id/accept", acceptFriendRequest);
router.put("/notifications/read", markNotificationsRead);

router.get("/friend-requests", getFriendRequests);
router.get("/outgoing-friend-requests", getOutgoingFriendReqs);

// Settings
router.get("/me/settings", getMySettings);
router.put("/me/settings", updateMySettings);
router.put("/me/password", changePassword);
router.put("/me/profile-picture", updateProfilePicture);
router.delete("/me", deleteMyAccount);

// Profile
router.get("/me/profile", getMyProfile);
router.put("/me/profile", updateMyProfile);

export default router;