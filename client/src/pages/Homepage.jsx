import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, useMemo, useRef } from "react";
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
import { CheckCircleIcon, MapPinIcon, UserPlusIcon, UsersIcon, CalendarIcon, VideoIcon, UserCheckIcon, ClockIcon, SearchIcon, XIcon, ChevronLeft, ChevronRight } from "lucide-react";

import { capitalize } from "../lib/utils";
import usePresence from "../hooks/usePresence";
import useAvailabilityStatus from "../hooks/useAvailabilityStatus";
import useMultiplePresence from "../hooks/useMultiplePresence";

import FriendCard, { getLanguageFlag } from "../components/FriendCard";
import NoFriendsFound from "../components/NoFriendsFound";
import useAuthUser from "../hooks/useAuthUser";
import FriendsCarousel from "../components/FriendsCarousel";

const HomePage = () => {
  const queryClient = useQueryClient();
  const friendsCarouselRef = useRef(null);
  const [outgoingRequestsIds, setOutgoingRequestsIds] = useState(new Set());
  const [outgoingRequestMap, setOutgoingRequestMap] = useState(new Map());
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState("all");
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [showJumpToTop, setShowJumpToTop] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [analyticsPeriod, setAnalyticsPeriod] = useState("yesterday"); // "yesterday", "lastWeek", "lastMonth"
  const { authUser } = useAuthUser();

  const scrollFriendsCarousel = (direction) => {
    if (friendsCarouselRef.current) {
      const scrollAmount = 250;
      friendsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

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

    // Get online statuses for ALL friends (not just top 10)
    const friendIds = realFriends.map(f => f._id);
    const onlineStatuses = useMultiplePresence(friendIds);
    
    // Sort all friends with online friends first, then show top 10 (or more if online)
    const mainFriends = useMemo(() => {
      const sorted = [...realFriends].sort((a, b) => {
        const aOnline = onlineStatuses.get(a._id.toString()) || false;
        const bOnline = onlineStatuses.get(b._id.toString()) || false;
        if (aOnline === bOnline) return 0;
        return aOnline ? -1 : 1;
      });
      // Show top 10, or all online friends if more than 10
      const onlineFriendsCount = sorted.filter(f => onlineStatuses.get(f._id.toString())).length;
      const displayCount = Math.max(10, onlineFriendsCount);
      return sorted.slice(0, displayCount);
    }, [realFriends, onlineStatuses]);

  const totalAppointments = appointments.length;
  const completedCalls = appointments.filter((apt) => apt.status === "completed").length;
  const onlineContacts = realFriends.filter(f => onlineStatuses.get(f._id.toString())).length;
  const pendingAppointments = appointments.filter((apt) => apt.status === "pending").length;
  const pendingRequests = friendRequests?.incomingReqs?.length || 0;

  // Calculate time ranges based on selected period
  const getTimeRange = () => {
    const now = new Date();
    let start, end;
    
    switch(analyticsPeriod) {
      case "yesterday":
        start = new Date(now);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastWeek":
        start = new Date(now);
        start.setDate(start.getDate() - 7);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
        break;
      case "lastMonth":
      default:
        start = new Date(now);
        start.setMonth(start.getMonth() - 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(now);
        end.setHours(23, 59, 59, 999);
    }
    return { start, end };
  };

  const countInRange = (dateStr, start, end) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    return d >= start && d < end;
  };

  const { start: currentStart, end: currentEnd } = getTimeRange();
  
  // Get previous period for comparison
  const getPreviousPeriod = () => {
    const { start, end } = getTimeRange();
    const duration = end - start;
    return {
      start: new Date(start - duration),
      end: new Date(start)
    };
  };

  const { start: prevStart, end: prevEnd } = getPreviousPeriod();

  // Appointments metrics
  const appointmentsCurrent = appointments.filter((a) => countInRange(a.createdAt, currentStart, currentEnd)).length;
  const appointmentsPrev = appointments.filter((a) => countInRange(a.createdAt, prevStart, prevEnd)).length;

  // Completed calls metrics
  const completedCurrent = appointments.filter((a) => a.status === "completed" && countInRange(a.completedAt || a.updatedAt || a.createdAt, currentStart, currentEnd)).length;
  const completedPrev = appointments.filter((a) => a.status === "completed" && countInRange(a.completedAt || a.updatedAt || a.createdAt, prevStart, prevEnd)).length;

  // Active contacts (online friends) - no period comparison needed, just current count
  const onlineContactsPrev = 0; // Online status doesn't have history

  // Pending appointments metrics
  const pendingAppointmentsCurrent = appointments.filter((a) => a.status === "pending").length;
  const acceptedThisMonth = (friendRequests?.acceptedReqs || []).filter((r) => countInRange(r.updatedAt || r.createdAt, currentStart, currentEnd)).length;

  // Friend requests metrics  
  const incomingCurrent = (friendRequests?.incomingReqs || []).length;

  const computePercent = (current, previous) => {
    if (previous === 0 && current === 0) return { label: "—", positive: false };
    if (previous === 0) return { label: current > 0 ? `+${current}` : "—", positive: current > 0 };
    const diff = current - previous;
    const pct = Math.round((diff / previous) * 100);
    return { label: `${pct > 0 ? "+" : ""}${pct}%`, positive: pct >= 0 };
  };

  const appointmentsDelta = computePercent(appointmentsCurrent, appointmentsPrev);
  const completedDelta = computePercent(completedCurrent, completedPrev);
  const onlineContactsDelta = { label: `${onlineContacts}/${realFriends.length}`, positive: true };
  const acceptedFriendsDelta = { label: acceptedThisMonth, positive: acceptedThisMonth > 0 };

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
    <div className="min-h-screen bg-base-100 pt-2 lg:pt-16 pb-16 lg:pb-20 px-2 sm:px-4 animate-fade-in">
      <div className="w-full max-w-full lg:max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="space-y-2 sm:space-y-4">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">Welcome back{authUser?.fullName ? `, ${authUser.fullName}` : ""}!</h2>
          <p className="text-xs sm:text-sm text-base-content opacity-70">Here's what's happening with your appointments.</p>
          
          {/* Analytics Period Selector */}
          <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-4 flex-wrap">
            {[
              { value: "yesterday", label: "Today" },
              { value: "lastWeek", label: "Last 7 Days" },
              { value: "lastMonth", label: "Last 30 Days" }
            ].map(period => (
              <button
                key={period.value}
                onClick={() => setAnalyticsPeriod(period.value)}
                className={`btn btn-xs sm:btn-sm ${
                  analyticsPeriod === period.value 
                    ? "btn-primary" 
                    : "btn-outline"
                }`}
              >
                <span className="text-xs sm:text-sm">{period.label}</span>
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3 lg:gap-4 mt-4 sm:mt-6">
            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body p-2 sm:p-3 lg:p-4 gap-2">
                <p className="text-base-content opacity-70 text-[10px] sm:text-xs lg:text-sm line-clamp-2">Total Appointments</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold">{appointmentsCurrent}</p>
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] sm:text-xs ${appointmentsDelta.positive ? "text-success" : "text-error"}`}>
                    {appointmentsDelta.label}
                  </div>
                  <div className="badge badge-xs sm:badge-sm lg:badge-lg badge-primary">
                    <CalendarIcon className="size-2 sm:size-3 lg:size-4" />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body p-2 sm:p-3 lg:p-4 gap-2">
                <p className="text-base-content opacity-70 text-[10px] sm:text-xs lg:text-sm line-clamp-2">Completed Calls</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold">{completedCurrent}</p>
                <div className="flex items-center justify-between">
                  <div className={`text-[10px] sm:text-xs ${completedDelta.positive ? "text-success" : "text-error"}`}>
                    {completedDelta.label}
                  </div>
                  <div className="badge badge-xs sm:badge-sm lg:badge-lg" style={{ backgroundColor: "#00c875" }}>
                    <VideoIcon className="size-2 sm:size-3 lg:size-4" style={{ color: "#08173fff" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body p-2 sm:p-3 lg:p-4 gap-2">
                <p className="text-base-content opacity-70 text-[10px] sm:text-xs lg:text-sm line-clamp-2">Active Contacts</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold">{onlineContacts}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-base-content opacity-60">
                    {onlineContacts}/{realFriends.length}
                  </span>
                  <div className="badge badge-xs sm:badge-sm lg:badge-lg" style={{ backgroundColor: "#9d4edd" }}>
                    <UserCheckIcon className="size-2 sm:size-3 lg:size-4" style={{ color: "#08173fff" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="card-body p-2 sm:p-3 lg:p-4 gap-2">
                <p className="text-base-content opacity-70 text-[10px] sm:text-xs lg:text-sm line-clamp-2">Pending</p>
                <p className="text-lg sm:text-xl lg:text-3xl font-bold">{pendingAppointmentsCurrent}</p>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] sm:text-xs text-base-content opacity-60">
                    Confirmation
                  </span>
                  <div className="badge badge-xs sm:badge-sm lg:badge-lg" style={{ backgroundColor: "#ff9500" }}>
                    <ClockIcon className="size-2 sm:size-3 lg:size-4" style={{ color: "#08173fff" }} />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden sm:block">
              <div className="card bg-base-200 shadow-md hover:shadow-lg transition-shadow">
                <div className="card-body p-2 sm:p-3 lg:p-4 gap-2">
                  <p className="text-base-content opacity-70 text-[10px] sm:text-xs lg:text-sm line-clamp-2">Requests</p>
                  <p className="text-lg sm:text-xl lg:text-3xl font-bold">{incomingCurrent}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-xs text-base-content opacity-60">
                      {acceptedThisMonth} accepted
                    </span>
                    <div className="badge badge-xs sm:badge-sm lg:badge-lg" style={{ backgroundColor: "#ff7aa2" }}>
                      <UsersIcon className="size-2 sm:size-3 lg:size-4" style={{ color: "#08173fff" }} />
                    </div>
                  </div>
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
            <style>{`
              .friend-circle-wrapper {
                transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
              }
              .friends-carousel {
                display: flex;
                gap: 1.5rem;
                overflow-x: auto;
                scroll-behavior: smooth;
                padding: 0.5rem 0;
                scrollbar-width: none;
                -ms-overflow-style: none;
              }
              .friends-carousel::-webkit-scrollbar {
                display: none;
              }
              .friends-carousel {
                -webkit-overflow-scrolling: touch;
              }
            `}</style>
            
            {/* Mobile Horizontal Swipe with Arrows */}
            <div className="lg:hidden relative group">
              {/* Left Arrow */}
              <button
                onClick={() => scrollFriendsCarousel('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 sm:-translate-x-8 z-10 bg-primary/80 hover:bg-primary text-primary-content p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Scroll friends left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              {/* Right Arrow */}
              <button
                onClick={() => scrollFriendsCarousel('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 sm:translate-x-8 z-10 bg-primary/80 hover:bg-primary text-primary-content p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                aria-label="Scroll friends right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div className="friends-carousel" ref={friendsCarouselRef}>
                {mainFriends.map((f) => (
                  <div key={f._id || f.fullName} className="friend-circle-wrapper flex-shrink-0">
                    <FriendCircle friend={f} />
                  </div>
                ))}
                {realFriends.length > mainFriends.length && (
                  <div className="flex-shrink-0 flex flex-col items-center justify-center w-20">
                    <Link to="/friends" className="btn btn-primary btn-sm gap-1">
                      <UsersIcon className="size-4" />
                      More
                    </Link>
                    <div className="mt-3 text-xs font-semibold text-center">+{realFriends.length - mainFriends.length}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Desktop Grid View */}
            <div className="hidden lg:flex flex-wrap items-left justify-start gap-6">
              {mainFriends.map((f) => (
                <div key={f._id || f.fullName} className="friend-circle-wrapper">
                  <FriendCircle friend={f} />
                </div>
              ))}
              {realFriends.length > mainFriends.length && (
                <div className="flex flex-col items-center justify-end w-20">
                  <Link to="/friends" className="btn btn-primary btn-sm gap-1">
                    <UsersIcon className="size-4" />
                    More
                  </Link>
                  <div className="mt-3 text-xs font-semibold text-center">+{realFriends.length - mainFriends.length}</div>
                </div>
              )}
            </div>
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
            <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-4 items-stretch sm:items-center">
              {/* Search Bar */}
              <div className="relative flex-1">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 size-4 sm:size-5 opacity-50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search name or location"
                  className="input input-bordered input-sm sm:input-lg w-full pl-9 sm:pl-10 text-xs sm:text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Language Filter */}
              <div className="flex-1 sm:flex-none sm:w-48">
                <select
                  className="select select-bordered select-sm sm:select-lg w-full text-xs sm:text-base"
                  value={languageFilter}
                  onChange={(e) => setLanguageFilter(e.target.value)}
                  aria-label="Filter by language"
                >
                  <option value="all">All Languages</option>
                  {availableLanguages.map((lang) => (
                    <option key={lang} value={lang}>
                      {capitalize(lang)}
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
            <>
              {/* Mobile Carousel */}
              <div className="lg:hidden -mx-2 sm:-mx-4">
                <FriendsCarousel itemsPerView={1}>
                  {filteredUsers.map((user) => {
                    const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                    return (
                      <div
                        key={user._id}
                        className="card bg-base-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col h-full"
                      >
                        <Link 
                          to={`/profile/${user._id}`}
                          className="btn btn-circle btn-sm hover:btn-primary transition-all duration-300 absolute top-4 right-4 z-10"
                          title="View Profile"
                          aria-label={`View ${user.fullName} profile`}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </Link>

                        <div className="card-body p-4 sm:p-5 space-y-3 sm:space-y-4 flex flex-col flex-1">
                          {/* User Info Section */}
                          <div className="flex items-center gap-3 pr-10">
                            <div className="avatar flex-shrink-0">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-base-300">
                                <img 
                                  src={user.profilePic && user.profilePic.trim() ? user.profilePic : '/default-profile.png'} 
                                  alt={user.fullName}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.target.src = '/default-profile.png';
                                  }}
                                />
                              </div>
                            </div>

                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base sm:text-lg line-clamp-1">{user.fullName}</h3>
                              {user.location && (
                                <div className="flex items-center text-xs opacity-70 mt-1 gap-1 line-clamp-1">
                                  <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                                  <span className="truncate">{user.location}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Languages Section */}
                          <div className="flex flex-col gap-1.5">
                            <span className="badge badge-secondary text-xs sm:text-sm gap-1">
                              {getLanguageFlag(user.nativeLanguage)}
                              <span>Native: {capitalize(user.nativeLanguage)}</span>
                            </span>
                            <span className="badge badge-outline text-xs sm:text-sm gap-1">
                              {getLanguageFlag(user.learningLanguage)}
                              <span>Learning: {capitalize(user.learningLanguage)}</span>
                            </span>
                          </div>

                          {/* Bio Section */}
                          {user.bio && (
                            <p className="text-xs sm:text-sm opacity-70 line-clamp-2 leading-relaxed">{user.bio}</p>
                          )}

                          {/* Action Button - Always at bottom */}
                          <button
                            className={`btn btn-sm w-full gap-2 mt-auto ${
                              hasRequestBeenSent ? "btn-outline btn-error" : "btn-primary"
                            }`}
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
                            aria-label={hasRequestBeenSent ? `Cancel friend request to ${user.fullName}` : `Send friend request to ${user.fullName}`}
                          >
                            {loadingUserId === user._id ? (
                              <span className="loading loading-spinner loading-sm"></span>
                            ) : hasRequestBeenSent ? (
                              <>
                                <XIcon className="w-4 h-4" />
                                <span>Cancel</span>
                              </>
                            ) : (
                              <>
                                <UserPlusIcon className="w-4 h-4" />
                                <span>Add Friend</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </FriendsCarousel>
              </div>

              {/* Desktop Grid */}
              <div className="hidden lg:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {filteredUsers.map((user) => {
                  const hasRequestBeenSent = outgoingRequestsIds.has(user._id);

                  return (
                    <div
                      key={user._id}
                      className="card bg-base-200 hover:shadow-lg transition-all duration-300 relative overflow-hidden flex flex-col h-full"
                    >
                      <Link 
                        to={`/profile/${user._id}`}
                        className="btn btn-circle btn-sm hover:btn-primary transition-all duration-300 absolute top-4 right-4 z-10"
                        title="View Profile"
                        aria-label={`View ${user.fullName} profile`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </Link>

                      <div className="card-body p-4 sm:p-5 space-y-3 sm:space-y-4 flex flex-col flex-1">
                        {/* User Info Section */}
                        <div className="flex items-center gap-3 pr-10">
                          <div className="avatar flex-shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-base-300">
                              <img 
                                src={user.profilePic && user.profilePic.trim() ? user.profilePic : '/default-profile.png'} 
                                alt={user.fullName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/default-profile.png';
                                }}
                              />
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base sm:text-lg line-clamp-1">{user.fullName}</h3>
                            {user.location && (
                              <div className="flex items-center text-xs opacity-70 mt-1 gap-1 line-clamp-1">
                                <MapPinIcon className="w-3 h-3 flex-shrink-0" />
                                <span className="truncate">{user.location}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Languages Section */}
                        <div className="flex flex-col gap-1.5">
                          <span className="badge badge-secondary text-xs sm:text-sm gap-1">
                            {getLanguageFlag(user.nativeLanguage)}
                            <span>Native: {capitalize(user.nativeLanguage)}</span>
                          </span>
                          <span className="badge badge-outline text-xs sm:text-sm gap-1">
                            {getLanguageFlag(user.learningLanguage)}
                            <span>Learning: {capitalize(user.learningLanguage)}</span>
                          </span>
                        </div>

                        {/* Bio Section */}
                        {user.bio && (
                          <p className="text-xs sm:text-sm opacity-70 line-clamp-2 leading-relaxed">{user.bio}</p>
                        )}

                        {/* Action Button - Always at bottom */}
                        <button
                          className={`btn btn-sm w-full gap-2 mt-auto ${
                            hasRequestBeenSent ? "btn-outline btn-error" : "btn-primary"
                          }`}
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
                          aria-label={hasRequestBeenSent ? `Cancel friend request to ${user.fullName}` : `Send friend request to ${user.fullName}`}
                        >
                          {loadingUserId === user._id ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : hasRequestBeenSent ? (
                            <>
                              <XIcon className="w-4 h-4" />
                              <span>Cancel</span>
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="w-4 h-4" />
                              <span>Add Friend</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </div>

      {/* Jump to Top Button */}
      {showJumpToTop && (
        <button
          onClick={scrollToTop}
          className={`fixed bottom-4 right-4 sm:bottom-6 sm:right-6 lg:bottom-8 lg:right-8 flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-3 lg:py-4 bg-secondary text-secondary-content rounded-full shadow-2xl hover:shadow-3xl hover:bg-secondary/90 transition-all duration-300 ${isFadingOut ? 'animate-fade-out' : 'animate-fade-in'} font-semibold text-xs sm:text-sm lg:text-base border border-secondary/20 backdrop-blur-sm`}
          title="Scroll to top"
          aria-label="Jump to top"
          style={{
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), 0 0 40px rgba(168, 85, 247, 0.3)'
          }}
        >
          <span className="hidden sm:inline">Jump to top</span>
          <span className="sm:hidden">Top</span>
          <svg className="w-4 h-4 sm:w-5 sm:h-5 lg:w-5 lg:h-5 transform rotate-180 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

const FriendCircle = ({ friend }) => {
  const initials = (friend.fullName || "").split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
  const userOnline = usePresence(friend._id); // Subscribe to real-time online status
  const availabilityStatus = useAvailabilityStatus(friend._id); // Subscribe to real-time availability status
  
  // Use real-time availability status if available, otherwise fall back to initial value
  const status = ((availabilityStatus || friend.availabilityStatus) ?? "offline").toLowerCase();

  const statusClass = !userOnline
    ? 'bg-neutral-500'
    : status === 'available'
    ? 'bg-success'
    : status === 'limited'
    ? 'bg-warning'
    : status === 'away'
    ? 'bg-error'
    : 'bg-neutral-500';

  return (
    <div className="flex flex-col items-center group w-20">
      <Link to={`/profile/${friend._id}`} className="relative">
        <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-primary/20 transition-all duration-300 transform group-hover:scale-105 bg-base-300 cursor-pointer">
          {friend.profilePic ? (
            <img 
              src={friend.profilePic} 
              alt={friend.fullName || 'friend avatar'} 
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
      {friend.fullName ? (
        <div className="mt-3 text-base font-semibold text-white group-hover:text-primary transition-colors text-center truncate w-full">{friend.fullName}</div>
      ) : (
        <div className="mt-3 text-base font-semibold text-transparent">&nbsp;</div>
      )}
    </div>
  );
};

export default HomePage;