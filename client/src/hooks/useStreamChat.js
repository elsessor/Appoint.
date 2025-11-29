import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "./useAuthUser";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

let chatClientInstance = null;
let isConnecting = false; // ✅ Prevent concurrent connections

const useStreamChat = () => {
  const [chatClient, setChatClient] = useState(chatClientInstance);
  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
    staleTime: 1000 * 60 * 60, // ✅ Cache token for 1 hour
  });

  useEffect(() => {
    const initChat = async () => {
      // ✅ Guard against multiple calls
      if (!tokenData?.token || !authUser || isConnecting) {
        return;
      }

      // ✅ If already connected to this user, reuse
      if (chatClientInstance?.userID === authUser._id) {
        setChatClient(chatClientInstance);
        return;
      }

      try {
        isConnecting = true;
        console.log("Initializing stream chat client...");

        // ✅ Disconnect previous user if exists
        if (chatClientInstance) {
          console.log("Disconnecting previous user...");
          await chatClientInstance.disconnectUser();
          chatClientInstance = null;
        }

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id.toString(), // ✅ Ensure string
            name: authUser.fullName,
          },
          tokenData.token
        );

        chatClientInstance = client;
        setChatClient(client);
        console.log("Stream chat connected successfully!");
      } catch (error) {
        console.error("Error initializing chat:", error);
        chatClientInstance = null;
        setChatClient(null);
      } finally {
        isConnecting = false; // ✅ Reset flag
      }
    };

    initChat();
  }, [tokenData?.token, authUser?._id]); // ✅ Only depend on token and user ID

  return chatClient;
};

export default useStreamChat;