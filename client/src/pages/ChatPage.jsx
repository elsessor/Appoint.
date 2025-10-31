import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { getStreamToken } from "../lib/api";

import {
  Chat, Channel, ChannelHeader, MessageList, MessageInput, Thread, Window 
} from 'stream-chat-react';
import { StreamChat } from 'stream-chat';
import  toast  from "react-hot-toast";
import  ChatLoader  from "../components/ChatLoader";

const STREAM_API_KEY = import.meta.env.VITE_STEAM_API_KEY

const ChatPage = () => {
  const {id:targetUserId } = useParams();
  
  const [chatClient, setChatClient] = useState(null);
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const {authUser} = useAuthUser();

  const {data:tokenData} = useQuery({
    queryKey: ['stream-token'],
    queryFn: getStreamToken,
    enabled: !!authUser
  })

  useEffect(() =>{
     const initChat = async () => {
      if (!tokenData?.token || !authUser) return;

      try{
        console.log("Initializing stream chat client...")

        const client = StreamChat.getInstance(STREAM_API_KEY);

        await client.connectUser({
          id: authUser._id,
          name: authUser.fullName,
          image: authUser.avatarUrl,
        }, tokenData.token)
        
        const channelId = [authUser._id, targetUserId].sort().join("-");

        const currChannel = client.channel("messaging", channelId, {
          members: [authUser._id, targetUserId],
        });

        await currChannel.watch();
        setChatClient(client);
        setChannel(currChannel);
      } catch (error) {
        console.error("Error initializing chat client:", error); 
        toast.error("Failed to load chat. Please try again later.");

      } finally {
        setLoading(false);
      }
  }
    initChat()
  }, [tokenData, authUser, targetUserId]);
  if (loading || !chatClient || !channel) return <ChatLoader />


  return( 
  <div className="h-[93vh] ">
   <Chat client={chatClient}>
    <Channel channel={channel}>
      <div className="w-full relative ">

        <Window>
          <ChannelHeader />
          <MessageList />
          <MessageInput focus />
        </Window>
        </div>
    </Channel>
   </Chat> 

  </div>
  );
};

export default ChatPage;