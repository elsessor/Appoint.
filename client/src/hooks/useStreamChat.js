import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "./useAuthUser";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

const useStreamChat = () => {
  const [chatClient, setChatClient] = useState(null);
  const { authUser } = useAuthUser();

  const { data: tokenData, isLoading: tokenLoading } = useQuery({
    queryKey: ["streamToken", authUser?._id], // ✅ Invalidate on user change
    queryFn: getStreamToken,
    enabled: !!authUser,
    staleTime: 1000 * 60 * 5, // ✅ Shorter cache - 5 min
    retry: 2,
  });

  useEffect(() => {
    let mounted = true;
    let client = null;

    const initChat = async () => {
      if (!tokenData?.token || !authUser?._id || tokenLoading) {
        console.log("⏳ Waiting for token and auth user...");
        return;
      }

      const userId = authUser._id.toString();

      try {
        console.log("🔄 Initializing fresh Stream chat for:", userId);

        // ✅ ALWAYS create a brand new client - no caching, no getInstance
        client = new StreamChat(STREAM_API_KEY, {
          timeout: 10000,
          enableInsights: false,
          enableWSFallback: true, // ✅ Use HTTP fallback if WebSocket fails
        });

        console.log("🔌 Connecting user...");
        
        await client.connectUser(
          {
            id: userId,
            name: authUser.fullName,
            // DON'T send image - it's too large and causes connection failures
            // image: authUser.profilePic || undefined,
          },
          tokenData.token
        );

        if (mounted) {
          console.log("✅ Stream chat connected successfully!");
          setChatClient(client);
        }
      } catch (error) {
        console.error("❌ Error initializing chat:", error);
        
        // ✅ Clean up failed connection
        if (client) {
          try {
            await client.disconnectUser();
          } catch (e) {
            // Ignore disconnect errors
          }
        }
        
        if (mounted) {
          setChatClient(null);
        }
      }
    };

    initChat();

    // ✅ Cleanup on unmount or dependency change
    return () => {
      mounted = false;
      if (client) {
        console.log("🧹 Cleaning up Stream client");
        client.disconnectUser().catch(() => {});
      }
    };
  }, [tokenData?.token, authUser?._id, tokenLoading]);

  return chatClient;
};

export default useStreamChat;