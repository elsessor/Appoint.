import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
  createAppointment,
  getAppointments,
  getAppointmentById,
  updateAppointment,
  deleteAppointment,
  saveCustomAvailability,
  getUserAvailability,
  getFriendAppointments,
  getCompletedAppointments,
  getUpcomingAppointmentsCount,
  userJoinedCall,
  userLeftCall,
} from "../controllers/appointments.controller.js";


const router = express.Router();

router.use(protectRoute);

router.post("/availability", saveCustomAvailability);
router.get("/availability/:userId", getUserAvailability);

router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/completed/:friendId", getCompletedAppointments);
router.get("/upcoming/:friendId", getUpcomingAppointmentsCount);
router.get("/friend/:friendId", getFriendAppointments);
router.get("/:id", getAppointmentById);

// Call tracking routes
router.post("/:appointmentId/joined", userJoinedCall);
router.post("/:appointmentId/left", userLeftCall);

router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);



export default router;
