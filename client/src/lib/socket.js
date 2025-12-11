import { io } from "socket.io-client";
import { resetPresence } from "./presence";

let socketInstance = null;

// Determine socket URL based on environment
const getSocketURL = () => {
  // Priority 1: Explicit environment variable (for different networks/servers)
  const envURL = import.meta.env.VITE_SOCKET_URL;
  if (envURL) {
    console.log('[Socket] Using VITE_SOCKET_URL from env:', envURL);
    return envURL;
  }
  
  // Priority 2: For localhost development - always use localhost
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    const url = 'http://localhost:5001';
    console.log('[Socket] Development mode: using localhost:5001');
    return url;
  }
  
  // Priority 3: For same server deployment (frontend and backend on same machine)
  // Both devices access the same server IP, both connect to that server's port 5001
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  const url = `${protocol}//${hostname}:5001`;
  console.log('[Socket] Production mode: using auto-detected URL:', url);
  console.log('[Socket] ⚠️  If this is wrong, set VITE_SOCKET_URL environment variable');
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
      reconnectionAttempts: Infinity, // Keep trying indefinitely
      transports: ['websocket', 'polling'], // Try websocket first, fallback to polling
    });
    
    socketInstance.on('connect', () => {
      console.log('[Socket] ✅ Connected successfully, socket ID:', socketInstance.id);
    });
    
    socketInstance.on('disconnect', (reason) => {
      console.log('[Socket] ⚠️ Disconnected:', reason);
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
