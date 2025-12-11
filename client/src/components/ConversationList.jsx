import { useQuery } from "@tanstack/react-query";
import { getUserFriends } from "../lib/api";
import { Search, MessageCircle } from "lucide-react";
import { useParams } from "react-router";
import { useState, useEffect } from "react";

const ConversationList = ({ chatClient, onSelectUser }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [lastMessageMap, setLastMessageMap] = useState({});
  const [version, setVersion] = useState(0); // 🚀 force re-render for sorting
  const { id: activeUserId } = useParams();

  const { data: friends, isLoading } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const filtered = friends?.filter((friend) =>
    friend.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  // 🔥 SORT newest message → top
  const sortedFriends = [...filtered].sort((a, b) => {
    const ta = lastMessageMap[a._id]
      ? new Date(lastMessageMap[a._id]).getTime()
      : 0;
    const tb = lastMessageMap[b._id]
      ? new Date(lastMessageMap[b._id]).getTime()
      : 0;
    return tb - ta;
  });

  const updateLastMessageInfo = (friendId, date) => {
    setLastMessageMap((prev) => ({
      ...prev,
      [friendId]: date,
    }));
    setVersion((v) => v + 1); // 🔥 triggers instant list re-sort
  };

  // ⭐ Listen globally for ANY new message (real-time sorting)
  useEffect(() => {
    if (!chatClient) return;

    const handleNewMessage = (event) => {
      const msg = event.message;
      if (!msg) return;

      const channel = event.channel;
      if (!channel) return;

      // Identify who the other user is
      const members = Object.keys(channel.state.members);
      const otherUser = members.find(
        (id) => id !== chatClient.user?.id
      );

      if (!otherUser) return;

      // ⏫ bump last message for that user
      updateLastMessageInfo(otherUser, msg.created_at);
    };

    chatClient.on("message.new", handleNewMessage);

    return () => chatClient.off("message.new", handleNewMessage);
  }, [chatClient]);

  if (isLoading) {
    return (
      <div className="w-80 border-r border-base-300 bg-base-200 flex items-center justify-center">
        <span className="loading loading-spinner loading-md"></span>
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-base-300 bg-base-200 flex flex-col h-full">

      {/* Search Bar */}
      <div className="p-4 border-b border-base-300">
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

      {/* Conversation Items */}
      <div className="flex-1 overflow-y-auto">
        {sortedFriends.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-4 text-center">
            <MessageCircle className="w-12 h-12 text-gray-500 mb-2" />
            <p className="text-sm text-gray-500">
              {searchQuery ? "No conversations found" : "No conversations yet"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-base-300">
            {sortedFriends.map((friend, index) => (
              <ConversationItem
                key={friend._id}
                friend={friend}
                isActive={activeUserId === friend._id}
                chatClient={chatClient}
                loadDelay={index * 150}
                onLastMessage={(d) =>
                  updateLastMessageInfo(friend._id, d)
                }
                onSelectUser={onSelectUser}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const ConversationItem = ({
  friend,
  isActive,
  chatClient,
  loadDelay = 0,
  onLastMessage,
  onSelectUser,
}) => {
  const [isOnline, setIsOnline] = useState(false);
  const [lastMessage, setLastMessage] = useState("Click to start chatting...");
  const [lastMessageTime, setLastMessageTime] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSelecting, setIsSelecting] = useState(false);

  useEffect(() => {
    if (!chatClient || !chatClient.user?.id) return;

    let isMounted = true;
    let channel = null;

    const loadConversation = async () => {
      try {
        await new Promise((res) => setTimeout(res, loadDelay));
        if (!isMounted) return;

        const currentUserId = chatClient.user.id;
        const channelId = [currentUserId, friend._id].sort().join("-");
        channel = chatClient.channel("messaging", channelId);

        const state = await channel.query({
          watch: false,
          state: true,
          messages: { limit: 1 },
        });

        if (!isMounted) return;

        const msgs = state.messages;
        if (msgs?.length > 0) {
          updateLastMessage(msgs[msgs.length - 1]);
        }

        await checkOnlineStatus();

        // Listen for messages inside THIS channel
        channel.on("message.new", (e) => {
          if (isMounted && e.message) updateLastMessage(e.message);
        });

        setIsLoading(false);
      } catch (err) {
        setIsLoading(false);
        if (err.code === 17) {
          setLastMessage("Start a conversation");
        } else {
          setLastMessage("Click to chat");
        }
      }
    };

    const checkOnlineStatus = async () => {
      try {
        const { users } = await chatClient.queryUsers({ id: friend._id });
        if (isMounted && users[0]) setIsOnline(users[0].online);
      } catch {}
    };

    const updateLastMessage = (msg) => {
      const text = msg.text || "Sent an attachment";
      setLastMessage(text.length > 40 ? text.slice(0, 40) + "..." : text);

      const date = new Date(msg.created_at);
      setLastMessageTime(formatMessageTime(date));

      // Notify parent (🔥 important for real-time sorting)
      onLastMessage?.(msg.created_at);
    };

    const handlePresence = (event) => {
      if (event.user?.id === friend._id) {
        setIsOnline(event.user.online);
      }
    };

    loadConversation();
    chatClient.on("user.presence.changed", handlePresence);

    return () => {
      isMounted = false;
      chatClient.off("user.presence.changed", handlePresence);
      if (channel) channel.off("message.new");
    };
  }, [chatClient, friend._id]);

  const formatMessageTime = (d) => {
    const now = new Date();
    const diff = now - d;
    const mins = diff / 60000;
    const hours = diff / 3600000;
    const days = diff / 86400000;

    if (mins < 1) return "Just now";
    if (mins < 60) return `${Math.floor(mins)} min ago`;
    if (hours < 24) return `${Math.floor(hours)}h ago`;
    if (days === 1) return "Yesterday";
    if (days < 7) return `${Math.floor(days)}d ago`;

    return d.toLocaleDateString();
  };

  const handleClick = () => {
    if (isSelecting) return; // Prevent rapid clicks
    setIsSelecting(true);
    onSelectUser?.(friend._id);
    
    // Reset after 500ms to allow next selection
    setTimeout(() => setIsSelecting(false), 500);
  };

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-3 p-4 hover:bg-base-300 cursor-pointer transition-colors ${
        isActive ? "bg-base-300" : ""
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="avatar">
          <div className="w-12 h-12 rounded-full">
            <img
              src={friend.profilePic || "/default-profile.svg"}
              alt={friend.fullName}
              onError={(e) => (e.target.src = "/default-profile.svg")}
            />
          </div>
        </div>

        {isOnline && (
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full border-2 border-base-200"></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <h3 className="font-semibold text-sm truncate">
            {friend.fullName}
          </h3>
          <span className="text-xs text-gray-500">{lastMessageTime}</span>
        </div>

        <p className="text-sm text-gray-400 truncate">
          {isLoading ? (
            <span className="loading loading-dots loading-xs"></span>
          ) : (
            lastMessage
          )}
        </p>
      </div>
    </div>
  );
};

export default ConversationList;
