import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { Search, MessageCircle } from "lucide-react";
import { Link, useParams } from "react-router";
import { useState, useEffect } from "react";

const ConversationList = ({ chatClient }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const { id: activeUserId } = useParams();

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const filteredFriends = friends?.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="w-80 border-r border-base-300 bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-base-300 bg-base-200 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-base-300">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="input input-sm input-bordered w-full pl-10 bg-base-100"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto">
        {!filteredFriends || filteredFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="w-12 h-12 text-gray-500 mb-2" />
            <p className="text-sm text-gray-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {filteredFriends.map((friend) => (
              <ConversationItem
                key={friend._id}
                friend={friend}
                isActive={activeUserId === friend._id}
                chatClient={chatClient}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationItem = ({ friend, isActive, chatClient }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastMessage, setLastMessage] = useState("Click to start chatting...");
  const [lastMessageTime, setLastMessageTime] = useState("");

  useEffect(() => {
    if (!chatClient) return;

    const checkOnlineStatus = async () => {
      try {
        const { users } = await chatClient.queryUsers({ id: friend._id });
        if (users[0]) {
          setIsOnline(users[0].online);
        }
      } catch (error) {
        console.error("Error checking online status:", error);
      }
    };

    const getLastMessage = async () => {
      try {
        // Get channel ID (same logic as in ChatsPage)
        const currentUserId = chatClient.user.id;
        const channelId = [currentUserId, friend._id].sort().join("-");
        
        // Query the channel
        const channel = chatClient.channel("messaging", channelId);
        await channel.watch();

        // Get last message
        const messages = channel.state.messages;
        if (messages && messages.length > 0) {
          const lastMsg = messages[messages.length - 1];
          
          // Truncate message if too long
          const messageText = lastMsg.text || "Sent an attachment";
          setLastMessage(messageText.length > 40 ? messageText.substring(0, 40) + "..." : messageText);
          
          // Format time
          const msgDate = new Date(lastMsg.created_at);
          const now = new Date();
          const diffInMs = now - msgDate;
          const diffInMins = Math.floor(diffInMs / 60000);
          const diffInHours = Math.floor(diffInMs / 3600000);
          const diffInDays = Math.floor(diffInMs / 86400000);

          if (diffInMins < 1) {
            setLastMessageTime("Just now");
          } else if (diffInMins < 60) {
            setLastMessageTime(`${diffInMins} min ago`);
          } else if (diffInHours < 24) {
            setLastMessageTime(`${diffInHours}h ago`);
          } else if (diffInDays === 1) {
            setLastMessageTime("Yesterday");
          } else if (diffInDays < 7) {
            setLastMessageTime(`${diffInDays}d ago`);
          } else {
            setLastMessageTime(msgDate.toLocaleDateString());
          }
        }

        // Listen for new messages
        channel.on('message.new', (event) => {
          if (event.message) {
            const messageText = event.message.text || "Sent an attachment";
            setLastMessage(messageText.length > 40 ? messageText.substring(0, 40) + "..." : messageText);
            setLastMessageTime("Just now");
          }
        });

      } catch (error) {
        console.error("Error getting last message:", error);
      }
    };

    checkOnlineStatus();
    getLastMessage();

    // Listen for presence changes
    const handleEvent = (event) => {
      if (event.user?.id === friend._id) {
        setIsOnline(event.user.online);
      }
    };

    chatClient.on('user.presence.changed', handleEvent);

    return () => {
      chatClient.off('user.presence.changed', handleEvent);
    };
  }, [chatClient, friend._id]);

  const unreadCount = 0; // You can implement unread count later

  return (
    <Link
      to={`/chats/${friend._id}`}
      className={`flex items-center gap-3 p-4 hover:bg-base-300 cursor-pointer transition-colors ${
        isActive ? "bg-base-300" : ""
      }`}
    >
      {/* Profile Picture with Online Indicator */}
      <div className="relative flex-shrink-0">
        <div className="avatar">
          <div className="w-12 h-12 rounded-full">
            <img
              src={friend.profilePic || "/default-avatar.png"}
              alt={friend.fullName}
            />
          </div>
        </div>
        {/* Online indicator - green dot - only show if online */}
        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-200"></div>
        )}
      </div>

      {/* Message Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm truncate">{friend.fullName}</h3>
          <span className="text-xs text-gray-500">{lastMessageTime}</span>
        </div>
        <p className="text-sm text-gray-400 truncate">{lastMessage}</p>
      </div>

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <div className="badge badge-primary badge-sm">{unreadCount}</div>
      )}
    </Link>
  );
};

export default ConversationList;