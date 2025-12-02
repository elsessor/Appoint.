import { Calendar, UserX, MessageCircle, User } from "lucide-react";
import { LANGUAGE_TO_FLAG } from "../constants";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router";
import { getUserFriends, getAppointments, unfriendUser, getFriendAppointments } from "../lib/api";
import { useState, useMemo } from "react";
import { parseISO, format, isToday, isSameDay, addDays } from "date-fns";
import useAuthUser from "../hooks/useAuthUser";
import { isOnline } from '../lib/presence';

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
  const [selectedDate, setSelectedDate] = useState(null);


  const { data: friendAppointments = [] } = useQuery({
    queryKey: ["friendAppointments", friend?._id],
    queryFn: () => getFriendAppointments(friend?._id),
    enabled: Boolean(isOpen && friend?._id),
  });


  const uniqueDates = friendAppointments.length > 0 
    ? [...new Set(friendAppointments.map(apt => {
        const date = new Date(apt.startTime);
        return date.toDateString();
      }))].map(dateStr => new Date(dateStr)).sort((a, b) => a - b)
    : [];


  const filteredAppointments = selectedDate
    ? friendAppointments.filter(apt => {
        const aptDate = new Date(apt.startTime);
        return isSameDay(aptDate, selectedDate);
      })
    : friendAppointments;


  const isUserInvolved = (apt) => {
    const currentUserIdStr = currentUserId?._id?.toString() || currentUserId?.toString();
    const friendId = apt.friendId?._id?.toString() || apt.friendId?.toString();
    const userId = apt.userId?._id?.toString() || apt.userId?.toString();
    return userId === currentUserIdStr || friendId === currentUserIdStr;
  };


  const getOtherPersonName = (apt) => {
    const friendIdStr = apt.friendId?._id?.toString() || apt.friendId?.toString();
    const userIdStr = apt.userId?._id?.toString() || apt.userId?.toString();
    const currentFriendIdStr = friend?._id?.toString() || friend?._id;


    if (userIdStr === currentFriendIdStr) {
      return apt.friendId?.fullName || "Unknown";
    }

    return apt.userId?.fullName || "Unknown";
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-bottom sm:modal-middle">
      <div className="modal-box w-full max-w-2xl">
        <h3 className="font-bold text-xl mb-4">
          <span className="text-primary">{friend?.fullName}</span>'s Schedule
        </h3>
        
        {friendAppointments.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 opacity-30 mx-auto mb-4" />
            <p className="text-lg font-semibold opacity-70">No appointments scheduled</p>
            <p className="text-sm opacity-50 mt-2">This friend is available for booking!</p>
          </div>
        ) : (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              <button
                onClick={() => setSelectedDate(null)}
                className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                  selectedDate === null
                    ? 'btn btn-primary btn-sm'
                    : 'btn btn-outline btn-sm'
                }`}
              >
                All Dates ({friendAppointments.length})
              </button>
              {uniqueDates.map((date) => (
                <button
                  key={date.toDateString()}
                  onClick={() => setSelectedDate(date)}
                  className={`px-3 py-2 rounded-lg font-medium whitespace-nowrap transition-all ${
                    selectedDate && isSameDay(date, selectedDate)
                      ? 'btn btn-primary btn-sm'
                      : 'btn btn-outline btn-sm'
                  }`}
                >
                  <span className="text-xs">
                    {isToday(date) ? 'Today' : format(date, 'MMM dd')} ({friendAppointments.filter(apt => isSameDay(new Date(apt.startTime), date)).length})
                  </span>
                </button>
              ))}
            </div>

            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {filteredAppointments.length === 0 ? (
                <div className="text-center py-6">
                  <Calendar className="w-12 h-12 opacity-30 mx-auto mb-2" />
                  <p className="text-sm opacity-70">No appointments on this date</p>
                </div>
              ) : (
                filteredAppointments.map((apt) => {
                  const userInvolved = isUserInvolved(apt);
                  const otherPersonName = getOtherPersonName(apt);
                  const startTime = new Date(apt.startTime);
                  const endTime = new Date(apt.endTime);
                  
                  return (
                    <div 
                      key={apt._id} 
                      className={`rounded-lg p-5 border-l-4 transition-all ${
                        userInvolved 
                          ? 'bg-primary/15 border-primary shadow-sm hover:shadow-md' 
                          : 'bg-warning/15 border-warning shadow-sm hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="font-bold text-base text-base-content">{apt.title || "Appointment"}</p>
                          <p className="text-xs opacity-70 mt-0.5">
                            with <span className="font-semibold">{otherPersonName}</span>
                          </p>
                        </div>
                        <span className={`badge badge-sm font-semibold ${
                          apt.status === 'confirmed' 
                            ? 'badge-success' 
                            : apt.status === 'completed' 
                            ? 'badge-info' 
                            : apt.status === 'pending' 
                            ? 'badge-warning' 
                            : 'badge-ghost'
                        }`}>
                          {apt.status}
                        </span>
                      </div>

                      <div className="bg-base-200/50 rounded-lg p-4 mb-3 border border-base-300/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold opacity-70">📅 Date</span>
                          <span className="font-semibold text-base">{startTime.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold opacity-70">🕐 Time</span>
                          <span className="font-bold text-lg text-primary">
                            {startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">💬</span>
                          <div>
                            <p className="text-xs opacity-60">Type</p>
                            <p className="font-medium">{apt.meetingType}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{userInvolved ? '✓' : '⊗'}</span>
                          <div>
                            <p className="text-xs opacity-60">Involvement</p>
                            <p className="font-medium text-xs">{userInvolved ? 'You\'re involved' : 'Not your appointment'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        <div className="modal-action mt-6 pt-4 border-t border-base-300">
          <button className="btn btn-outline" onClick={onClose}>Close</button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop" onClick={onClose}>
        <button>close</button>
      </form>
    </dialog>
  );
};

const FriendCard = ({ friend, onUnfriend, currentUserId }) => {
  const navigate = useNavigate();
  const [showSchedule, setShowSchedule] = useState(false);
  const [showUnfriendConfirm, setShowUnfriendConfirm] = useState(false);
  const name = friend.fullName || friend.name || "Unknown";
  const avatar = friend.profilePic || friend.avatar || "/default-profile.svg";
  const native = friend.nativeLanguage || friend.native || "Unknown";
  const learning = friend.learningLanguage || friend.learning || "Unknown";
  const status = (friend.availabilityStatus ?? "offline").toLowerCase();
  // If user is offline (not connected), show neutral/offline regardless of availability.
  const statusColor = !isOnline(friend._id)
    ? 'text-neutral'
    : status === 'available'
    ? 'text-success'
    : status === 'limited'
    ? 'text-warning'
    : status === 'away'
    ? 'text-error'
    : 'text-neutral';

  const handleUnfriendConfirm = () => {
    setShowUnfriendConfirm(false);
    onUnfriend(friend._id || friend.id);
  };

  const handleCalendarClick = () => {
    navigate(`/booking?friendId=${friend._id || friend.id}`);
  };

  return (
    <>
      <div className="card relative bg-gradient-to-br from-base-200 to-base-300 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden group">
        <div className="relative h-32 bg-gradient-to-r from-primary/20 to-secondary/20">
          <Link
            to={`/profile/${friend._id || friend.id}`}
            className="absolute top-3 right-3 btn btn-ghost btn-sm btn-circle z-10"
            title={`View ${name}'s profile`}
            aria-label={`View ${name} profile`}
            onClick={(e) => e.stopPropagation()}
          >
            <User className="w-4 h-4" />
          </Link>
          <div className="absolute -bottom-6 left-4">
            <div className="relative">
              <img 
                src={avatar} 
                alt={name} 
                className="w-20 h-20 rounded-full border-4 border-base-200 object-cover group-hover:scale-105 transition-transform"
              />
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-3 border-base-200 ${!isOnline(friend._id) ? 'bg-neutral-500' : status === 'available' ? 'bg-success' : status === 'limited' ? 'bg-warning' : status === 'away' ? 'bg-error' : 'bg-neutral-500'}`} />
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
              onClick={handleCalendarClick}
              title="Book appointment"
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
  const [searchQuery, setSearchQuery] = useState("");

  const filteredFriends = useMemo(() => {
    const q = (searchQuery || "").trim().toLowerCase();
    if (!q) return friends;

    return friends.filter((f) => {
      const name = (f.fullName || f.name || "").toLowerCase();
      const native = (f.nativeLanguage || f.native || "").toLowerCase();
      const learning = (f.learningLanguage || f.learning || "").toLowerCase();
      return (
        name.includes(q) ||
        native.includes(q) ||
        learning.includes(q)
      );
    });
  }, [friends, searchQuery]);

  return (
    <div className="p-6 bg-base-100 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-primary mb-2">Friends</h1>
          <p className="text-base-content opacity-70 mb-3">
            {searchQuery ? (
              <span>Showing {filteredFriends.length} of {friends.length} results</span>
            ) : (
              <span>
                {friends.length} {friends.length === 1 ? 'friend' : 'friends'} connected
              </span>
            )}
          </p>

          <div className="mb-4">
            <label htmlFor="friends-search" className="sr-only">Search friends</label>
            <div className="flex gap-2 items-center">
              <input
                id="friends-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by name or language"
                aria-label="Search friends by name or language"
                className="input input-bordered w-full md:w-1/2"
              />
              {searchQuery && (
                <button
                  className="btn btn-ghost"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                >
                  Clear
                </button>
              )}
            </div>
          </div>
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
            {filteredFriends.map((friend) => (
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
