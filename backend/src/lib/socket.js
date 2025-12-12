import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

let io;
const userSockets = new Map();

const getUserSocketSet = (userId) => {
  const id = userId?.toString();
  if (!id) return null;
  if (!userSockets.has(id)) {
    userSockets.set(id, new Set());
  }
  return userSockets.get(id);
};

export const initSocket = (server, origin) => {
  io = new Server(server, {
    cors: {
      origin: true, // Accept all origins with credentials (JWT is in cookies)
      credentials: true,
      methods: ['GET', 'POST'],
    },
  });

  io.use((socket, next) => {
    try {
      const rawCookies = socket.handshake.headers.cookie;
      if (!rawCookies) {
        return next(new Error("Unauthorized"));
      }

      const parsedCookies = cookie.parse(rawCookies);
      const token = parsedCookies?.jwt;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
      socket.userId = decoded.userId?.toString();

      if (!socket.userId) {
        return next(new Error("Unauthorized"));
      }

      next();
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.userId;
    const sockets = getUserSocketSet(userId);
    sockets?.add(socket.id);

    console.log(`[Socket] ✅ User ${userId} connected. Total sockets for user: ${sockets?.size}, Total online users: ${userSockets.size}, Socket ID: ${socket.id}`);
    console.log(`[Socket] 📊 Current online users:`, Array.from(userSockets.keys()));

    // If this is the first socket for the user, broadcast that the user is online
    if (sockets && sockets.size === 1) {
      console.log(`[Socket] 🔔 First socket for user ${userId}, broadcasting presence:update with online=true`);
      io.emit('presence:update', { userId: userId.toString(), online: true });
    }

    // Send the new client a list of all currently online users
    const onlineUserIds = Array.from(userSockets.keys());
    console.log(`[Socket] 📤 Sending presence:init to user ${userId} with ${onlineUserIds.length} online users:`, onlineUserIds);
    socket.emit('presence:init', {
      onlineUsers: onlineUserIds.map(id => ({ userId: id, online: true }))
    });

    socket.on("disconnect", () => {
      console.log(`[Socket] User ${userId} disconnected. Socket ID: ${socket.id}`);
      const userSocketSet = userSockets.get(userId);
      if (!userSocketSet) return;

      userSocketSet.delete(socket.id);
      console.log(`[Socket] Remaining sockets for user ${userId}: ${userSocketSet.size}`);
      
      if (userSocketSet.size === 0) {
        userSockets.delete(userId);
        console.log(`[Socket] No more sockets for user ${userId}, broadcasting presence:update with online=false`);
        // User has no more active sockets; broadcast offline and update lastOnline
        io.emit('presence:update', { userId: userId.toString(), online: false });
        
        // Update lastOnline in database
        User.findByIdAndUpdate(userId, { lastOnline: new Date() }, { new: true })
          .catch(err => console.error(`[Socket] Error updating lastOnline for user ${userId}:`, err));
      }
    });
  });
};

export const emitNotificationUpdate = (userId) => {
  if (!io || !userId) return;

  const socketSet = userSockets.get(userId.toString());
  if (!socketSet) return;

  socketSet.forEach((socketId) => {
    io.to(socketId).emit("notifications:update");
  });
};

// Emit appointment created event to both participants
export const emitAppointmentCreated = (appointment) => {
  if (!io || !appointment) return;

  const userId = (appointment.userId._id || appointment.userId).toString();
  const friendId = (appointment.friendId._id || appointment.friendId).toString();

  console.log(`[Socket] Emitting appointment:created to users ${userId} and ${friendId}`);

  // Emit to creator
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:created", appointment);
    });
  }

  // Emit to recipient
  const friendSocketSet = userSockets.get(friendId);
  if (friendSocketSet) {
    friendSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:created", appointment);
    });
  }
};

// Emit appointment updated event to both participants
export const emitAppointmentUpdated = (appointment) => {
  if (!io || !appointment) return;

  const userId = (appointment.userId._id || appointment.userId).toString();
  const friendId = (appointment.friendId._id || appointment.friendId).toString();

  console.log(`[Socket] Emitting appointment:updated to users ${userId} and ${friendId}`);

  // Emit to creator
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:updated", appointment);
    });
  }

  // Emit to recipient
  const friendSocketSet = userSockets.get(friendId);
  if (friendSocketSet) {
    friendSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:updated", appointment);
    });
  }
};

// Emit appointment status changed event to both participants
export const emitAppointmentStatusChanged = (appointment, oldStatus, newStatus) => {
  if (!io || !appointment) return;

  const userId = (appointment.userId._id || appointment.userId).toString();
  const friendId = (appointment.friendId._id || appointment.friendId).toString();

  console.log(`[Socket] Emitting appointment:statusChanged (${oldStatus} → ${newStatus}) to users ${userId} and ${friendId}`);

  const eventData = {
    appointment,
    oldStatus,
    newStatus,
  };

  // Emit to creator
  const userSocketSet = userSockets.get(userId);
  if (userSocketSet) {
    userSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:statusChanged", eventData);
    });
  }

  // Emit to recipient
  const friendSocketSet = userSockets.get(friendId);
  if (friendSocketSet) {
    friendSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:statusChanged", eventData);
    });
  }
};

// Emit appointment deleted/cancelled event to both participants
export const emitAppointmentDeleted = (appointmentId, userId, friendId) => {
  if (!io || !appointmentId) return;

  console.log(`[Socket] Emitting appointment:deleted to users ${userId} and ${friendId}`);

  const eventData = { appointmentId, userId, friendId };

  // Emit to creator
  const userSocketSet = userSockets.get(userId.toString());
  if (userSocketSet) {
    userSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:deleted", eventData);
    });
  }

  // Emit to recipient
  const friendSocketSet = userSockets.get(friendId.toString());
  if (friendSocketSet) {
    friendSocketSet.forEach((socketId) => {
      io.to(socketId).emit("appointment:deleted", eventData);
    });
  }
};

// Emit availability status change to all connected clients
export const emitAvailabilityStatusChanged = (userId, newStatus, availabilityData = {}) => {
  if (!io || !userId) return;

  console.log(`[Socket] 📢 Broadcasting availability:changed for user ${userId}: ${newStatus}`);
  io.emit('availability:changed', { 
    userId: userId.toString(), 
    availabilityStatus: newStatus,
    availability: availabilityData
  });
};

