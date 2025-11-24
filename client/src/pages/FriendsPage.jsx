import { Calendar, UserX, MessageCircle } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router";
import { getUserFriends, getAppointments, unfriendUser, getFriendAppointments } from "../lib/api";
import { useState } from "react";
import useAuthUser from "../hooks/useAuthUser";

const LanguageBadge = ({ type, language }) => {
  const langLower = language?.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];

  return (
    <div className={`inline-flex items-center justify-center gap-2 px-2 py-1 rounded-lg text-xs font-medium ${
      type === 'native' ? 'bg-primary text-primary-content' : 'bg-secondary/20 text-secondary'
    }`}>
      {countryCode && (
        <img
          src={`https://flagcdn.com/24x18/${countryCode}.png`}
          alt={`${langLower} flag`}
          className="h-3.5 w-5 rounded-sm object-cover"
        />
      )}
      <span>{type === 'native' ? language : 'Learn: ' + language}</span>
    </div>
  );
};

const ScheduleModal = ({ friend, isOpen, onClose, currentUserId }) => {
  // Fetch ALL appointments for this specific friend
  const { data: friendAppointments = [] } = useQuery({
    queryKey: ["friendAppointments", friend?._id],
    queryFn: () => getFriendAppointments(friend?._id),
    enabled: Boolean(isOpen && friend?._id),
  });

  // Check if current user is involved in each appointment
  const isUserInvolved = (apt) => {
    const currentUserIdStr = currentUserId?._id?.toString() || currentUserId?.toString();
    const friendId = apt.friendId?._id?.toString() || apt.friendId?.toString();
    const userId = apt.userId?._id?.toString() || apt.userId?.toString();
    return userId === currentUserIdStr || friendId === currentUserIdStr;
  };

  // Get the other person's name in the appointment
  const getOtherPersonName = (apt) => {
    const friendIdStr = apt.friendId?._id?.toString() || apt.friendId?.toString();
    const userIdStr = apt.userId?._id?.toString() || apt.userId?.toString();
    const currentFriendIdStr = friend?._id?.toString() || friend?._id;

    // If friend is the userId, show the friendId person's name
    if (userIdStr === currentFriendIdStr) {
      return apt.friendId?.fullName || "Unknown";
    }
    // If friend is the friendId, show the userId person's name
    return apt.userId?.fullName || "Unknown";
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-md">
        <h3 className="font-bold text-lg mb-4">
          <span className="text-primary">{friend?.fullName}</span>'s Availability
        </h3>
        
        {friendAppointments.length === 0 ? (
          <div className="text-center py-6">
            <Calendar className="w-12 h-12 opacity-30 mx-auto mb-2" />
            <p className="text-sm opacity-70">No appointments scheduled.</p>
            <p className="text-xs opacity-50 mt-2">This friend is available for booking!</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {friendAppointments.map((apt) => {
              const userInvolved = isUserInvolved(apt);
              const otherPersonName = getOtherPersonName(apt);
              
              return (
                <div 
                  key={apt._id} 
                  className={`p-4 rounded-lg border-l-4 transition-all ${
                    userInvolved 
                      ? 'bg-primary/20 border-primary' 
                      : 'bg-warning/20 border-warning'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-base">{apt.title || "Appointment"}</p>
                      <p className="text-xs opacity-80 mt-1">
                        with <span className="font-medium">{otherPersonName}</span>
                      </p>
                      <div className={`text-xs mt-2 ${userInvolved ? 'opacity-90' : 'opacity-70'}`}>
                        {userInvolved ? (
                          <span className="badge badge-primary badge-sm">You're involved</span>
                        ) : (
                          <span className="badge badge-warning badge-sm">Not your appointment</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-xs opacity-70 space-y-1 mt-3">
                    <p>📅 {new Date(apt.startTime).toLocaleDateString()}</p>
                    <p>🕐 {new Date(apt.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(apt.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p>💬 {apt.meetingType}</p>
                    <p className="capitalize">
                      Status: <span className={`badge badge-sm ${apt.status === 'confirmed' ? 'badge-success' : apt.status === 'completed' ? 'badge-info' : apt.status === 'pending' ? 'badge-warning' : 'badge-ghost'}`}>
                        {apt.status}
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="modal-action mt-6">
          <button className="btn btn-outline btn-sm" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};

const FriendCard = ({ friend, onUnfriend, currentUserId }) => {
  const [showSchedule, setShowSchedule] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const name = friend.fullName || friend.name || "Unknown";
  const avatar = friend.profilePic || friend.avatar || "/default-profile.png";
  const native = friend.nativeLanguage || friend.native || "Unknown";
  const learning = friend.learningLanguage || friend.learning || "Unknown";
  const status = (friend.availabilityStatus || "available").toLowerCase();
  const statusColor = status === "available" ? "text-success" : status === "limited" ? "text-warning" : "text-error";

  const handleUnfriendConfirm = () => {
    setShowUnfriendConfirm(false);
    onUnfriend(friend._id || friend.id);
  };

  return (
    <>
      <div className="card bg-gradient-to-br from-base-200 to-base-300 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
        {/* Header with avatar and status */}
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20">
          <div className="absolute -bottom-6 left-4">
            <div className="relative">
              <img 
                src={avatar} 
                alt={name} 
                className="w-20 h-20 rounded-full border-4 border-base-200 object-cover group-hover:scale-105 transition-transform"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-base-200 ${status === 'available' ? 'bg-success' : status === 'limited' ? 'bg-warning' : 'bg-error'}`} />
            </div>
          </div>
        </div>

        <div className="card-body pt-10 pb-4">
          <div>
            <h3 className="card-title text-lg truncate">{name}</h3>
            <p className="text-xs opacity-60">{status}</p>
          </div>

          <div className="flex flex-col gap-2">
            <LanguageBadge type="native" language={native} />
            <LanguageBadge type="learning" language={learning} />
          </div>

          <div className="card-actions justify-between gap-2 mt-4">
            <Link
              to={`/chat/${friend._id || friend.id}`}
              className="btn btn-sm btn-primary flex-1"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Link>
            <button 
              className="btn btn-circle btn-sm btn-ghost"
              onClick={() => setShowSchedule(true)}
              title="View availability"
            >
              <Calendar className="w-4 h-4" />
            </button>
            <button 
              className="btn btn-circle btn-sm btn-ghost hover:bg-error/20"
              onClick={() => setShowUnfriendConfirm(true)}
              title="Unfriend"
            >
              <UserX className="w-4 h-4 text-error" />
            </button>
          </div>
        </div>
      </div>
      
      <ScheduleModal friend={friend} isOpen={showSchedule} onClose={() => setShowSchedule(false)} currentUserId={currentUserId} />
      
      {/* Unfriend Confirmation Modal */}
      {showUnfriendConfirm && (
        <dialog open className="modal modal-bottom sm:modal-middle">
          <div className="modal-box">
            <h3 className="font-bold text-lg">
              Are you sure you want to unfriend <span className="text-primary">{name}</span>?
            </h3>
            <p className="py-4 text-sm opacity-70">
              This action cannot be undone. You'll no longer see their availability or be able to message them directly.
            </p>
            <div className="modal-action">
              <button 
                className="btn btn-outline"
                onClick={() => setShowUnfriendConfirm(false)}
              >
                Cancel
              </button>
              <button 
                className="btn btn-error"
                onClick={handleUnfriendConfirm}
              >
                Unfriend
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => setShowUnfriendConfirm(false)}>
            <button>close</button>
          </form>
        </dialog>
      )}
    </>
  );
};

const FriendsPage = () => {
  const queryClient = useQueryClient();
  const { authUser } = useAuthUser();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
    retry: false,
  });

  const unfriendMutation = useMutation({
    mutationFn: unfriendUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
    },
    onError: (error) => {
      console.error("Error unfriending:", error);
    },
  });

  const friends = Array.isArray(data) ? data : [];

  return (
    <div className="p-6 bg-base-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">Friends</h1>
          <p className="text-base-content opacity-70">
            {friends.length} {friends.length === 1 ? 'friend' : 'friends'} connected
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1,2,3,4,5,6].map((i) => (
              <div key={i} className="card bg-base-200 animate-pulse h-80">
                <div className="card-body">
                  <div className="h-40 bg-base-300 rounded mb-4" />
                  <div className="h-4 bg-base-300 rounded w-2/3 mb-2" />
                  <div className="h-3 bg-base-300 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="alert alert-error">
            <span>Failed to load friends.</span>
          </div>
        ) : friends.length === 0 ? (
          <div className="card bg-base-200 p-12 text-center">
            <p className="text-lg opacity-70">No friends yet. Start connecting with users!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {friends.map((friend) => (
              <FriendCard 
                friend={friend} 
                key={friend._id || friend.id}
                onUnfriend={(friendId) => unfriendMutation.mutate(friendId)}
                currentUserId={authUser?._id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendsPage;