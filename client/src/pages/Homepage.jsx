import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo } from "react";
import {
  getOutgoingFriendReqs,
  getRecommendedUsers,
  getUserFriends,
  getFriendRequests,
  sendFriendRequest,
  cancelFriendRequest,
  getAppointments,
} from "../lib/api";
import { Link } from "react-router";
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon, CalendarIcon, VideoIcon, UserCheckIcon, ClockIcon, SearchIcon, XIcon } from "lucide-react";

import { capitialize } from "../lib/utils";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import useAuthUser from "../hooks/useAuthUser";
import { isOnline } from '../lib/presence';

const HomePage = () => {
  const queryClient = useQueryClient();
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [outgoingRequestMap, setOutgoingRequestMap] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [showJumpToTop, setShowJumpToTop] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const { authUser } = useAuthUser();

  // Handle scroll for jump-to-top button
  useEffect(() => {
    const handleScroll = () => {
      // Show button when user is actually near the bottom
      // Using a large threshold (1000px from bottom) to ensure it only shows near the very end
      const distanceFromBottom = document.documentElement.scrollHeight - (window.innerHeight + window.scrollY);
      const isNearBottom = distanceFromBottom < 150; // Show when within 1000px of bottom
      
      if (!isNearBottom && showJumpToTop) {
        // Start fade out animation before hiding
        setIsFadingOut(true);
        setTimeout(() => {
          setShowJumpToTop(false);
          setIsFadingOut(false);
        }, 300); // Match animation duration
      } else if (isNearBottom && !showJumpToTop) {
        setShowJumpToTop(true);
        setIsFadingOut(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showJumpToTop]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getUserFriends,
  });

  const { data: recommendedUsers = [], isLoading: loadingUsers } = useQuery({
    queryKey: ["users"],
    queryFn: getRecommendedUsers,
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ["outgoingFriendReqs"],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
  });

  const { data: appointments = [] } = useQuery({
    queryKey: ["appointments"],
    queryFn: getAppointments,
  });

  const { mutate: sendRequestMutation } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      setLoadingUserId(null);
    },
    onError: () => {
      setLoadingUserId(null);
    },
  });

  const { mutate: cancelRequestMutation } = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["outgoingFriendReqs"] });
      setLoadingUserId(null);
    },
    onError: () => {
      setLoadingUserId(null);
    },
  });

  useEffect(() => {
    const outgoingIds = new Set();
    const requestMap = new Map();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        outgoingIds.add(req.recipient._id);
        requestMap.set(req.recipient._id, req._id);
      });
      setOutgoingRequestsIds(outgoingIds);
      setOutgoingRequestMap(requestMap);
    } else {
      setOutgoingRequestsIds(new Set());
      setOutgoingRequestMap(new Map());
    }
  }, [outgoingFriendReqs]);


  const uniqueFriendsMap = new Map();
  (friends || []).forEach((fr) => {
    const key = fr._id || fr.fullName || JSON.stringify(fr);
    if (!uniqueFriendsMap.has(key)) uniqueFriendsMap.set(key, fr);
  });
  const uniqueFriends = Array.from(uniqueFriendsMap.values());

    const realFriends = uniqueFriends.filter((f) => Boolean(f.fullName));

    const mainFriends = realFriends.slice(0, 10);
    const otherFriends = realFriends.slice(10, 20);

  const totalAppointments = appointments.length;
  const completedCalls = appointments.filter((apt) => apt.status === "completed").length;
  const activeContacts = realFriends.length;
  const pendingAppointments = appointments.filter((apt) => apt.status === "pending").length;
  const pendingRequests = (friendRequests?.incomingReqs?.length || 0) + pendingAppointments;

  const msInDay = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const currentStart = new Date(now - 30 * msInDay);
  const prevStart = new Date(now - 60 * msInDay);

  const countInRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d < end;
  };

  const appointmentsCurrent = appointments.filter((a) => countInRange(a.createdAt, currentStart, new Date())).length;
  const appointmentsPrev = appointments.filter((a) => countInRange(a.createdAt, prevStart, currentStart)).length;

  const completedCurrent = appointments.filter((a) => a.status === "completed" && countInRange(a.updatedAt || a.createdAt, currentStart, new Date())).length;
  const completedPrev = appointments.filter((a) => a.status === "completed" && countInRange(a.updatedAt || a.createdAt, prevStart, currentStart)).length;

  const pendingAppointmentsCurrent = appointments.filter((a) => a.status === "pending" && countInRange(a.createdAt, currentStart, new Date())).length;
  const pendingAppointmentsPrev = appointments.filter((a) => a.status === "pending" && countInRange(a.createdAt, prevStart, currentStart)).length;

  const incomingCurrent = (friendRequests?.incomingReqs || []).filter((r) => countInRange(r.createdAt, currentStart, new Date())).length;
  const incomingPrev = (friendRequests?.incomingReqs || []).filter((r) => countInRange(r.createdAt, prevStart, currentStart)).length;

  const acceptedCurrent = (friendRequests?.acceptedReqs || []).filter((r) => countInRange(r.updatedAt || r.createdAt, currentStart, new Date())).length;
  const acceptedPrev = (friendRequests?.acceptedReqs || []).filter((r) => countInRange(r.updatedAt || r.createdAt, prevStart, currentStart)).length;
  const prevActiveContacts = Math.max(activeContacts - acceptedCurrent, 0);

  const computePercent = (current, previous) => {
    if (previous === 0 && current === 0) return { label: "0%", positive: false };
    if (previous === 0) return { label: `+${Math.round(current * 100)}%`, positive: true };
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    return { label: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
  };

  const appointmentsDelta = computePercent(appointmentsCurrent, appointmentsPrev);
  const completedDelta = computePercent(completedCurrent, completedPrev);
  const activeDelta = computePercent(activeContacts, prevActiveContacts);
  const pendingAppointmentsDelta = computePercent(pendingAppointmentsCurrent, pendingAppointmentsPrev);
  const pendingFriendRequestsDelta = computePercent(incomingCurrent, incomingPrev);

  // Filter and search recommended users
  const filteredUsers = useMemo(() => {
    let filtered = recommendedUsers;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user) =>
        user.fullName?.toLowerCase().includes(query) ||
        user.location?.toLowerCase().includes(query)
      );
    }

    // Apply language filter
    if (languageFilter !== "all") {
      filtered = filtered.filter((user) =>
        user.nativeLanguage === languageFilter ||
        user.learningLanguage === languageFilter
      );
    }

    return filtered;
  }, [recommendedUsers, searchQuery, languageFilter]);

  // Get unique languages for filter dropdown
  const availableLanguages = useMemo(() => {
    const languages = new Set();
    recommendedUsers.forEach((user) => {
      if (user.nativeLanguage) languages.add(user.nativeLanguage);
      if (user.learningLanguage) languages.add(user.learningLanguage);
    });
    return Array.from(languages).sort();
  }, [recommendedUsers]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-base-100 min-h-full" style={{ paddingBottom: '100px' }}>
      <div className="container mx-auto space-y-10">
        <div className="space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Welcome back{authUser?.fullName ? `, ${authUser.fullName}` : ""}!</h2>
          <p className="text-base-content opacity-70">Here's what's happening with your appointments today.</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mt-6">
            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-base-content opacity-70 text-sm min-h-[2.5rem] flex items-center">Total Appointments</p>
                    <p className="text-3xl font-bold mt-2">{totalAppointments}</p>
                  </div>
                  <div className="badge badge-lg badge-primary">
                    <CalendarIcon className="size-4" />
                  </div>
                </div>
                <div className={`text-xs ${appointmentsDelta.positive ? "text-success" : "text-error"} mt-3`}>
                  {appointmentsDelta.label} from last month
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-base-content opacity-70 text-sm min-h-[2.5rem] flex items-center">Completed Calls</p>
                    <p className="text-3xl font-bold mt-2">{completedCalls}</p>
                  </div>
                  <div className="badge badge-lg" style={{ backgroundColor: "#00c875" }}>
                    <VideoIcon className="size-4" style={{ color: "#08173fff" }} />
                  </div>
                </div>
                <div className={`text-xs ${completedDelta.positive ? "text-success" : "text-error"} mt-3`}>
                  {completedDelta.label} from last month
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-base-content opacity-70 text-sm min-h-[2.5rem] flex items-center">Active Contacts</p>
                    <p className="text-3xl font-bold mt-2">{activeContacts}</p>
                  </div>
                  <div className="badge badge-lg" style={{ backgroundColor: "#9d4edd" }}>
                    <UserCheckIcon className="size-4" style={{ color: "#08173fff" }} />
                  </div>
                </div>
                <div className={`text-xs ${activeDelta.positive ? "text-success" : "text-error"} mt-3`}>
                  {activeDelta.label} from last month
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-base-content opacity-70 text-sm min-h-[2.5rem] flex items-center">Pending Appointments</p>
                    <p className="text-3xl font-bold mt-2">{pendingAppointments}</p>
                  </div>
                  <div className="badge badge-lg" style={{ backgroundColor: "#ff9500" }}>
                    <ClockIcon className="size-4" style={{ color: "#08173fff" }} />
                  </div>
                </div>
                <div className={`text-xs ${pendingAppointmentsDelta.positive ? "text-success" : "text-error"} mt-3`}>
                  {pendingAppointmentsDelta.label} from last month
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-base-content opacity-70 text-sm min-h-[2.5rem] flex items-center">Pending Friend Requests</p>
                    <p className="text-3xl font-bold mt-2">{friendRequests?.incomingReqs?.length || 0}</p>
                  </div>
                  <div className="badge badge-lg" style={{ backgroundColor: "#ff7aa2" }}>
                    <UsersIcon className="size-4" style={{ color: "#08173fff" }} />
                  </div>
                </div>
                <div className={`text-xs ${pendingFriendRequestsDelta.positive ? "text-success" : "text-error"} mt-3`}>
                  {pendingFriendRequestsDelta.label} from last month
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Your Friends</h2>
            <Link to="/notifications" className="btn btn-outline btn-sm">
              <UsersIcon className="mr-2 size-4" />
              Friend Requests
            </Link>
          </div>

          {loadingFriends ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : friends.length === 0 ? (
            <NoFriendsFound />
          ) : (
            <>
            <div className="flex flex-wrap items-left justify-start gap-6">
              {mainFriends.map((f, idx) => {
                const initials = (f.fullName || "").split(" ").map((s) => s[0]).slice(0,2).join("").toUpperCase();
                const status = (f.availabilityStatus ?? "offline").toLowerCase();
                // If the user is not currently connected, show offline (neutral) regardless of their availability.
                // If they are connected, reflect their availability: available -> green, limited -> warning, away -> error.
                const statusClass = !isOnline(f._id)
                  ? 'bg-neutral-500'
                  : status === 'available'
                  ? 'bg-success'
                  : status === 'limited'
                  ? 'bg-warning'
                  : status === 'away'
                  ? 'bg-error'
                  : 'bg-neutral-500';
                return (
                  <div key={f._id || f.fullName} className="flex flex-col items-center group w-20">
                    <Link to={`/profile/${f._id}`} className="relative">
                      <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 transition-all duration-300 transform group-hover:scale-105 bg-base-300 cursor-pointer">
                        {f.profilePic ? (
                          <img 
                            src={f.profilePic} 
                            alt={f.fullName || 'friend avatar'} 
                            className="w-full h-full object-cover rounded-full"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              if (e.target.nextElementSibling) {
                                e.target.nextElementSibling.style.display = 'flex';
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-lg font-semibold text-base-content">{initials}</div>
                        )}
                      </div>
                      <span className={`absolute top-0 right-0 -translate-x-0 translate-y-1 w-4 h-4 rounded-full border-2 border-base-100 ${statusClass} z-10`} />
                    </Link>
                    {f.fullName ? (
                      <div className="mt-3 text-base font-semibold text-white group-hover:text-primary transition-colors text-center truncate w-full">{f.fullName}</div>
                    ) : (
                      <div className="mt-3 text-base font-semibold text-transparent">&nbsp;</div>
                    )}
                    {idx === 9 && realFriends.length > 10 && (
                      <div className="mt-3">
                        <Link to="/friends" className="btn btn-outline btn-sm">View All Friends</Link>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {otherFriends.length > 0 && (
              <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
                {otherFriends.map((f) => {
                  const initials = (f.fullName || "").split(" ").map((s) => s[0]).slice(0,2).join("").toUpperCase();
                  const status = (f.availabilityStatus ?? "offline").toLowerCase();
                  const statusClass = status === "available"
                    ? "bg-success"
                    : status === "limited"
                    ? "bg-warning"
                    : status === "offline"
                    ? "bg-neutral-500"
                    : "bg-error";
                  return (
                    <div key={f._id || f.fullName} className="flex flex-col items-center w-16">
                      <Link to={`/profile/${f._id}`} className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-primary/20 bg-base-300 cursor-pointer">
                          {f.profilePic ? (
                            <img 
                              src={f.profilePic} 
                              alt={f.fullName || 'friend avatar'} 
                              className="w-full h-full object-cover rounded-full"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                if (e.target.nextElementSibling) {
                                  e.target.nextElementSibling.style.display = 'flex';
                                }
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-base-content">{initials}</div>
                          )}
                        </div>
                        <span className={`absolute top-0 right-0 -translate-x-1/2 translate-y-1/2 w-3 h-3 rounded-full border-2 border-base-100 ${statusClass} z-10`} />
                      </Link>
                      <div className="mt-2 text-sm font-medium text-center truncate w-full">{f.fullName}</div>
                    </div>
                  );
                })}
              </div>
            )}
            </>
          )}
        </div>

        <section>
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Set Up Your Next Session</h2>
                <p className="opacity-70">
                  Discover people you can book time with—simple and personalized.
                </p>
              </div>
            </div>

            {/* Search and Filter Section */}
            <div className="mt-6 flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-5 opacity-50" />
                <input
                  type="text"
                  placeholder="Search by name, or location"
                  className="input input-bordered w-full pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="sm:w-64">
                <select
                  className="select select-bordered w-full"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {capitialize(lang)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {loadingUsers ? (
            <div className="flex justify-center py-12">
              <span className="loading loading-spinner loading-lg" />
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="card bg-base-200 p-6 text-center">
              <h3 className="font-semibold text-lg mb-2">
                {searchQuery || languageFilter !== "all" 
                  ? "No users found matching your search" 
                  : "No recommendations available"}
              </h3>
              <p className="text-base-content opacity-70">
                {searchQuery || languageFilter !== "all"
                  ? "Try adjusting your search or filter criteria."
                  : "Check back later for new language partners!"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredUsers.map((user) => {
                const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                return (
                  <div
                    key={user._id}
                    className="card bg-base-200 hover:shadow-lg transition-all duration-300"
                  >
                    <div className="card-body p-5 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="avatar size-16 rounded-full">
                          <img src={user.profilePic && user.profilePic.trim() ? user.profilePic : '/default-profile.png'} alt={user.fullName} />
                        </div>

                        <div>
                          <h3 className="font-semibold text-lg">{user.fullName}</h3>
                          {user.location && (
                            <div className="flex items-center text-xs opacity-70 mt-1">
                              <MapPinIcon className="size-3 mr-1" />
                              {user.location}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5">
                        <span className="badge badge-secondary">
                          {getLanguageFlag(user.nativeLanguage)}
                          Native: {capitialize(user.nativeLanguage)}
                        </span>
                        <span className="badge badge-outline">
                          {getLanguageFlag(user.learningLanguage)}
                          Learning: {capitialize(user.learningLanguage)}
                        </span>
                      </div>

                      {user.bio && <p className="text-sm opacity-70">{user.bio}</p>}

                      <button
                        className={`btn w-full mt-2 ${
                          hasRequestBeenSent ? "btn-outline btn-error" : "btn-primary"
                        } `}
                        onClick={() => {
                          setLoadingUserId(user._id);
                          if (hasRequestBeenSent) {
                            const requestId = outgoingRequestMap.get(user._id);
                            if (requestId) {
                              cancelRequestMutation(requestId);
                            }
                          } else {
                            sendRequestMutation(user._id);
                          }
                        }}
                        disabled={loadingUserId === user._id}
                      >
                        {loadingUserId === user._id ? (
                          <span className="loading loading-spinner loading-sm"></span>
                        ) : hasRequestBeenSent ? (
                          <>
                            <XIcon className="size-4 mr-2" />
                            Cancel Request
                          </>
                        ) : (
                          <>
                            <UserPlusIcon className="size-4 mr-2" />
                            Send Friend Request
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Jump to Top Button */}
      {showJumpToTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-5 flex items-center gap-3 px-6 py-4 bg-secondary text-secondary-content rounded-full shadow-2xl hover:shadow-3xl hover:bg-secondary/90 transition-all duration-300 ${isFadingOut ? 'animate-fade-out' : 'animate-fade-in'} font-semibold text-base border border-secondary/20 backdrop-blur-sm`}
          title="Scroll to top"
          aria-label="Jump to top"
          style={{
            left: 'calc(50% + 120px)',
            transform: 'translateX(-50%)',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.3)'
          }}
        >
          <span>Click here to Jump to the top</span>
          <svg className="w-5 h-5 transform rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </button>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes fadeOut {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.3s ease-in-out forwards;
        }
        .animate-fade-out {
          animation: fadeOut 0.3s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default HomePage;