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
} from "../controllers/appointments.controller.js";

const router = express.Router();

router.use(protectRoute);

// Availability operations MUST come before /:id routes
router.post("/availability", saveCustomAvailability);
router.get("/availability/:userId", getUserAvailability);

// Appointment CRUD operations
router.post("/", createAppointment);
router.get("/", getAppointments);
router.get("/:id", getAppointmentById);
router.put("/:id", updateAppointment);
router.delete("/:id", deleteAppointment);

export default router;
