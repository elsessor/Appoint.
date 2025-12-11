import { io } from "socket.io-client";
import { resetPresence } from "./presence";

let socketInstance = null;

// Determine socket URL based on environment
const getSocketURL = () => {
  const envURL = import.meta.env.VITE_SOCKET_URL;
  
  if (envURL) {
    console.log('[Socket] Using VITE_SOCKET_URL:', envURL);
    return envURL;
  }
  
  // In production or different devices, use the same host but port 5001 (backend)
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // For production deployment: use same protocol and hostname, port 5001
  const url = `${protocol}//${hostname}:5001`;
  console.log('[Socket] Auto-detected socket URL:', url);
  return url;
};

export const initSocket = () => {
  if (socketInstance && socketInstance.connected) {
    console.log('[Socket] Socket already connected');
    return socketInstance;
  }

  if (!socketInstance) {
    const SOCKET_URL = getSocketURL();
    console.log('[Socket] Creating new socket connection to:', SOCKET_URL);
    
    socketInstance = io(SOCKET_URL, {
      withCredentials: true,
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5,
    });
    
    socketInstance.on('connect', () => {
      console.log('[Socket] ✅ Connected successfully, socket ID:', socketInstance.id);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('[Socket] ⚠️ Disconnected');
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('[Socket] ❌ Connection error:', error);
    });
    
    return socketInstance;
  } else if (!socketInstance.connected) {
    console.log('[Socket] Socket exists but disconnected, reconnecting');
    socketInstance.connect();
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
