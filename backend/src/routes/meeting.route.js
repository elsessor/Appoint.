import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { 
  createMeetingMinutes, 
  getUserMeetingMinutes, 
  getMeetingMinutesById,
  deleteMeetingMinutes
} from "../controllers/meeting.controller.js";

const router = express.Router();

router.use(protectRoute);

router.post("/minutes", createMeetingMinutes);
router.get("/my-minutes", getUserMeetingMinutes);
router.get("/minutes/:id", getMeetingMinutesById);
router.delete("/minutes/:id", deleteMeetingMinutes);

export default router;