import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { disconnectSocket, initSocket, getSocket } from "../lib/socket";
import { initPresence } from "../lib/presence";

const useRealtimeNotifications = (shouldConnect) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!shouldConnect) {
      disconnectSocket();
      return undefined;
    }

    const socket = initSocket();

    // initialize presence tracking
    initPresence(socket);

    const handleNotificationUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    };

    socket.on("notifications:update", handleNotificationUpdate);
    socket.on("connect_error", console.error);

    return () => {
      socket.off("notifications:update", handleNotificationUpdate);
      socket.off("connect_error", console.error);
    };
  }, [queryClient, shouldConnect]);
};

export default useRealtimeNotifications;

