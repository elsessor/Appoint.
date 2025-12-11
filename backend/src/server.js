import express from "express";
import "dotenv/config";
import cookieParser from "cookie-parser";
import cors from "cors";
import { createServer } from "http";
import path from "path";

import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import chatRoutes from "./routes/chat.route.js";
import meetingRoutes from "./routes/meeting.route.js";
import appointmentRoutes from "./routes/appointments.route.js";
import notificationRoutes from "./routes/notifications.route.js";
import adminRoutes from "./routes/admin.route.js";
import { hardDeleteExpiredUsers } from "./deleteScheduler.js";

import { connectDB } from "./lib/db.js";
import { initSocket } from "./lib/socket.js";
import { startReminderScheduler } from './utils/appointmentReminders.js';

const app = express();
const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();
const CLIENT_ORIGIN = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/meetings", meetingRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../client/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../client", "dist", "index.html"));
  });
}

const server = createServer(app);
initSocket(server, CLIENT_ORIGIN);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  connectDB();

  startReminderScheduler();

  // Run scheduled hard delete for users whose 14-day grace period has expired
  // Runs once every 24 hours
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(() => {
    hardDeleteExpiredUsers().catch((err) => {
      console.error("Error in scheduled hardDeleteExpiredUsers:", err);
    });
  }, ONE_DAY_MS);
});