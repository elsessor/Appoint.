import { io } from "socket.io-client";
import { resetPresence } from "./presence";

let socketInstance = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const initSocket = () => {
  if (!socketInstance) {
    console.log('[Socket] Creating new socket connection');
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true, // Let it auto-connect
    });
    socketInstance.on('connect', () => {
      console.log('[Socket] Connected successfully, socket ID:', socketInstance.id);
    });
    socketInstance.on('disconnect', () => {
      console.log('[Socket] Disconnected');
    });
  } else if (!socketInstance.connected) {
    console.log('[Socket] Socket exists but disconnected, reconnecting');
    socketInstance.connect();
  } else {
    console.log('[Socket] Socket already connected');
  }

  return socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (!socketInstance) {
    console.log('[Socket] No socket to disconnect');
    return;
  }
  console.log('[Socket] Disconnecting socket');
  resetPresence();
  socketInstance.off();
  socketInstance.disconnect();
  socketInstance = null;
};
