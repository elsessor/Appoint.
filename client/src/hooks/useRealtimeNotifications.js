import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { disconnectSocket, initSocket } from "../lib/socket";
import { initPresence } from "../lib/presence";

const useRealtimeNotifications = (shouldConnect) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!shouldConnect) {
      console.log('[useRealtimeNotifications] shouldConnect=false, disconnecting');
      disconnectSocket();
      return;
    }

    console.log('[useRealtimeNotifications] shouldConnect=true, initializing');
    const socket = initSocket();

    // Initialize presence tracking
    initPresence(socket);

    const handleNotificationUpdate = () => {
      console.log('[useRealtimeNotifications] Received notifications:update');
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    };

    socket.on("notifications:update", handleNotificationUpdate);

    return () => {
      socket.off("notifications:update", handleNotificationUpdate);
    };
  }, [queryClient, shouldConnect]);
};

export default useRealtimeNotifications;

