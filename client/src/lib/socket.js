import { io } from "socket.io-client";

let socketInstance = null;

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

export const initSocket = () => {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
    });
  } else if (!socketInstance.connected) {
    socketInstance.connect();
  }

  return socketInstance;
};

export const getSocket = () => socketInstance;

export const disconnectSocket = () => {
  if (!socketInstance) return;
  socketInstance.off();
  socketInstance.disconnect();
  socketInstance = null;
};

