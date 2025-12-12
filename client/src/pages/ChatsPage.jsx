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
import { MessageCircle, ArrowLeft } from "lucide-react";

const ChatsPage = () => {
  const { id: targetUserId } = useParams();
  const chatClient = useStreamChat();
  const [channel, setChannel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedUserId, setSelectedUserId] = useState(targetUserId || null);
  const [selectedUserName, setSelectedUserName] = useState("");
  const [isMobileView, setIsMobileView] = useState(false);
  const { authUser } = useAuthUser();

  // Detect if we're on mobile
  useEffect(() => {
    const checkMobileView = () => {
      setIsMobileView(window.innerWidth < 1024); // lg breakpoint
    };
    checkMobileView();
    window.addEventListener("resize", checkMobileView);
    return () => window.removeEventListener("resize", checkMobileView);
  }, []);

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

  const handleSelectUser = (userId, userName) => {
    setSelectedUserId(userId);
    setSelectedUserName(userName);
  };

  const handleBackToConversations = () => {
    setSelectedUserId(null);
    setSelectedUserName("");
  };

  if (!chatClient) return <ChatLoader />;

  // Mobile messenger-like view: Show either conversations list OR chat, not both
  if (isMobileView) {
    if (selectedUserId) {
      // Show only the chat with back button
      return (
        <div className="flex flex-col h-[calc(100vh-4rem)] pt-2 lg:pt-16 pb-16 bg-base-100 overflow-hidden">
          {/* Chat Header with Back Button */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-base-300 bg-base-200 flex-shrink-0">
            <button
              onClick={handleBackToConversations}
              className="btn btn-ghost btn-sm btn-circle"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-sm flex-1 truncate">{selectedUserName}</h2>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {chatClient && channel && selectedUserId ? (
              <Chat client={chatClient} key={selectedUserId}>
                <Channel channel={channel} key={selectedUserId}>
                  <div className="flex-1 flex flex-col relative">
                    <CallButton handleVideoCall={handleVideoCall} />
                    <Window>
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
            ) : null}
          </div>
        </div>
      );
    } else {
      // Show only the conversations list
      return (
        <div className="flex flex-col h-[calc(100vh-4rem)] pt-2 lg:pt-16 pb-16 bg-base-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-base-300 bg-base-200 flex-shrink-0">
            <h2 className="font-semibold text-lg text-primary">Messages</h2>
          </div>
          <div className="w-full h-full flex flex-col overflow-hidden">
            {chatClient && <ConversationList chatClient={chatClient} onSelectUser={handleSelectUser} />}
          </div>
        </div>
      );
    }
  }

  // Desktop view: Show both conversations list and chat side-by-side
  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-4rem)] lg:h-screen pt-2 lg:pt-16 pb-16 lg:pb-0 gap-0 lg:gap-0 overflow-hidden animate-fade-in">
      <div className="w-full lg:w-80 lg:border-r border-b lg:border-b-0 border-base-300 flex-shrink-0">
        <div className="px-4 py-3 border-b border-base-300 bg-base-200">
          <h2 className="font-semibold text-lg text-primary">Messages</h2>
        </div>
        {chatClient && <ConversationList chatClient={chatClient} onSelectUser={handleSelectUser} />}
      </div>

      <div className="flex-1 flex flex-col px-2 sm:px-4">
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