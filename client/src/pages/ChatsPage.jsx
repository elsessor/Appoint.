import { useEffect, useState } from "react";
import { useParams } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import useStreamChat from "../hooks/useStreamChat";
import toast from "react-hot-toast";

import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from "stream-chat-react";

import ChatLoader from "../components/ChatLoader";
import CallButton from "../components/CallButton";
import ConversationList from "../components/ConversationList";
import { MessageCircle } from "lucide-react";

const ChatsPage = () => {
  const { id: targetUserId } = useParams();
  const chatClient = useStreamChat();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(targetUserId || null);
  const { authUser } = useAuthUser();

  useEffect(() => {
    let isMounted = true;
    let activeChannel = null;

    const setupChannel = async () => {
      if (!chatClient || !authUser) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        if (selectedUserId) {
          const channelId = [authUser._id, selectedUserId].sort().join("-");

          const currChannel = chatClient.channel("messaging", channelId, {
            members: [authUser._id, selectedUserId],
          });

          await currChannel.watch();
          
          // Only update if this is still the latest request
          if (isMounted && selectedUserId === [authUser._id, selectedUserId].sort()[1] || selectedUserId === [authUser._id, selectedUserId].sort()[0]) {
            setChannel(currChannel);
            activeChannel = currChannel;
          }
        } else {
          if (isMounted) {
            setChannel(null);
          }
        }
      } catch (error) {
        console.error("Error setting up channel:", error);
        if (isMounted) {
          toast.error("Could not load chat. Please try again.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    setupChannel();

    return () => {
      isMounted = false;
      // Cleanup: unwatch the previous channel
      if (activeChannel) {
        try {
          activeChannel.unwatch();
        } catch (e) {
          console.log("Channel already unwatched");
        }
      }
    };
  }, [chatClient, authUser, selectedUserId]);

  const handleVideoCall = () => {
    if (channel) {
      const callUrl = `${window.location.origin}/call/${channel.id}`;

      channel.sendMessage({
        text: `I've started a video call. Join me here: ${callUrl}`,
      });

      toast.success("Video call link sent successfully!");
    }
  };

  if (!chatClient) return <ChatLoader />;

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {chatClient && <ConversationList chatClient={chatClient} onSelectUser={setSelectedUserId} />}

      <div className="flex-1 flex flex-col">
        {chatClient && channel && selectedUserId ? (
          <Chat client={chatClient} key={selectedUserId}>
            <Channel channel={channel} key={selectedUserId}>
              <div className="flex-1 flex flex-col relative">
                <CallButton handleVideoCall={handleVideoCall} />
                <Window>
                  <ChannelHeader />
                  <MessageList />
                  <MessageInput focus />
                </Window>
              </div>
              <Thread />
            </Channel>
          </Chat>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="w-20 h-20 mx-auto text-gray-500 mb-4" />
              <h2 className="text-2xl font-semibold mb-2">Select a conversation</h2>
              <p className="text-gray-400">Choose a contact from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatsPage;