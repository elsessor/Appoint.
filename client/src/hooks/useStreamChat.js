import { useEffect, useState } from "react";
import { StreamChat } from "stream-chat";
import { useQuery } from "@tanstack/react-query";
import { getStreamToken } from "../lib/api";
import useAuthUser from "./useAuthUser";

const STREAM_API_KEY = import.meta.env.VITE_STREAM_API_KEY;

let chatClientInstance = null;

const useStreamChat = () => {
  const [chatClient, setChatClient] = useState(null);
  const { authUser } = useAuthUser();

  const { data: tokenData } = useQuery({
    queryKey: ["streamToken"],
    queryFn: getStreamToken,
    enabled: !!authUser,
  });

  useEffect(() => {
    const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try {
        // Reuse existing client if already connected
        if (chatClientInstance && chatClientInstance.userID === authUser._id) {
          setChatClient(chatClientInstance);
          return;
        }

        // Disconnect old client if exists
        if (chatClientInstance) {
          await chatClientInstance.disconnectUser();
        }

        console.log("Initializing stream chat client...");

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser(
          {
            id: authUser._id,
            name: authUser.fullName,
            image: authUser.profilePic,
          },
          tokenData.token
        );

        chatClientInstance = client;
        setChatClient(client);
        console.log("Stream chat connected successfully!");
      } catch (error) {
        console.error("Error initializing chat:", error);
      }
    };

    initChat();
  }, [tokenData, authUser]);

  return chatClient;
};

export default useStreamChat;