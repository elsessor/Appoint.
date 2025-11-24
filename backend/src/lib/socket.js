import { Server } from "socket.io";
import cookie from "cookie";
import jwt from "jsonwebtoken";

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
      origin,
      credentials: true,
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

    socket.on("disconnect", () => {
      const userSocketSet = userSockets.get(userId);
      if (!userSocketSet) return;

      userSocketSet.delete(socket.id);
      if (userSocketSet.size === 0) {
        userSockets.delete(userId);
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

