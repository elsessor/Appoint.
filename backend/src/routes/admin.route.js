import express from "express";
import { adminOnly } from "../middleware/admin.middleware.js";
import {
  getDashboardStats,
  getAllUsers,
  updateUserRole,
  deleteUser,
  getAllAppointments,
  deleteAppointment,
} from "../controllers/admin.controller.js";

const router = express.Router();

router.use(adminOnly);

router.get("/dashboard", getDashboardStats);
router.get("/users", getAllUsers);
router.put("/users/:id/role", updateUserRole);
router.delete("/users/:id", deleteUser);

router.get("/appointments", getAllAppointments);
router.delete("/appointments/:id", deleteAppointment);

export default router;

