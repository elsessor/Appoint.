import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { disconnectSocket, initSocket } from "../lib/socket";

const useRealtimeNotifications = (shouldConnect) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!shouldConnect) {
      disconnectSocket();
      return undefined;
    }

    const socket = initSocket();

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

