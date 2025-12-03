import React, { useState, useCallback, useMemo, memo, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router';
import Calendar from '../components/appointments/Calendar';
import CalendarSidebar from '../components/appointments/CalendarSidebar';
import AppointmentDetailsView from '../components/appointments/AppointmentDetailsView';
import TodaysAppointmentsModal from '../components/appointments/TodaysAppointmentsModal';

// Memoize components for performance
const MemoizedCalendar = memo(Calendar);
const MemoizedCalendarSidebar = memo(CalendarSidebar);
import AppointmentRequestModal from '../components/appointments/AppointmentRequestModal';
import ThemeSelector from '../components/ThemeSelector';
import { getMyFriends, getAuthUser, createAppointment, updateAppointment, deleteAppointment, getAppointments, getUserAvailability, getFriendAppointments } from '../lib/api';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { useThemeStore } from '../store/useThemeStore';
import { Search, X, AlertCircle } from 'lucide-react';

const AppointmentBookingPage = () => {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const searchBarRef = useRef(null);
  const [searchParams] = useSearchParams();
  const friendIdParam = searchParams.get('friendId');
  const [viewingFriendId, setViewingFriendId] = useState(friendIdParam || null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [visibleFriends, setVisibleFriends] = useState([]);
  const [isMultiCalendarMode, setIsMultiCalendarMode] = useState(true);
  const [selectedMiniCalDate, setSelectedMiniCalDate] = useState(null);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showDesktopSidebar, setShowDesktopSidebar] = useState(true);
  const [expandTodayAppointments, setExpandTodayAppointments] = useState(true);
  const [expandSearchResults, setExpandSearchResults] = useState(false);
  const [showTodaysAppointmentsModal, setShowTodaysAppointmentsModal] = useState(false);
  const [friendsAvailability, setFriendsAvailability] = useState({});

  // Get current user
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
    retry: 1,
    onError: (error) => {
      console.error('Failed to load user:', error);
    }
  });

  // Get friends list
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: getMyFriends,
    enabled: !!(currentUser?._id || currentUser?.id),
    onError: (error) => {
      toast.error('Failed to load friends. Please try again.');
      console.error('Error fetching friends:', error);
    }
  });

  // Get appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
    enabled: !!(currentUser?._id || currentUser?.id),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get friend's appointments when viewing them
  const { data: friendAppointmentsData = [] } = useQuery({
    queryKey: ['friendAppointments', viewingFriendId],
    queryFn: () => getFriendAppointments(viewingFriendId),
    enabled: !!viewingFriendId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get viewing friend's availability status
  const { data: friendAvailability } = useQuery({
    queryKey: ['friendAvailability', viewingFriendId],
    queryFn: () => getUserAvailability(viewingFriendId),
    enabled: !!viewingFriendId,
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Get current user's availability
  const { data: currentUserAvailability } = useQuery({
    queryKey: ['userAvailability', currentUser?._id],
    queryFn: () => getUserAvailability(currentUser?._id),
    enabled: !!(currentUser?._id && !viewingFriendId),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Auto-check all friends by default
  useEffect(() => {
    if (friends.length > 0 && visibleFriends.length === 0) {
      const friendIds = friends.map(f => f._id || f.id);
      setVisibleFriends(friendIds);
    }
  }, [friends]);

  // Determine which appointments to display based on viewing state
  const displayAppointments = viewingFriendId ? friendAppointmentsData : appointments;

  // Default availability for all users - Monday to Friday, 9 AM to 5 PM
  const defaultAvailability = {
    days: [1, 2, 3, 4, 5], // Monday to Friday
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
    buffer: 15,
    minLeadTime: 0,
    cancelNotice: 0,
    appointmentDuration: { min: 15, max: 120 },
  };

  // Close search dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setShowSearchResults(false);
        setExpandSearchResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch availability for all friends
  useEffect(() => {
    if (friends.length === 0) return;

    const fetchFriendsAvailability = async () => {
      const availabilityMap = {};
      
      for (const friend of friends) {
        try {
          const response = await getUserAvailability(friend._id);
          // Properly extract availabilityStatus from response
          // If user has no custom settings, backend returns default availability with 'available' status
          const status = response?.availabilityStatus || 'available';
          availabilityMap[friend._id] = status;
        } catch (error) {
          console.error(`Failed to fetch availability for friend ${friend._id}:`, error);
          // Default to available on error (user has not set custom availability)
          availabilityMap[friend._id] = 'available';
        }
      }
      
      setFriendsAvailability(availabilityMap);
    };

    fetchFriendsAvailability();
  }, [friends]);

  // Scheduling availability - will use friend's actual availability when viewing them
  const getAvailabilityForCalendar = useMemo(() => {
    if (viewingFriendId) {
      // When viewing a friend, use their availability (with defaults if they haven't customized)
      return friendAvailability?.availability || defaultAvailability;
    }
    // Use current user's actual availability or default
    return currentUserAvailability?.availability || defaultAvailability;
  }, [viewingFriendId, friendAvailability, currentUserAvailability]);

  // Create appointment mutation
  const createAppointmentMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      toast.success('Appointment created successfully!');
      queryClient.invalidateQueries(['appointments']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create appointment');
      console.error('Booking error:', error);
    }
  });

  // Update appointment mutation
  const updateAppointmentMutation = useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => {
      toast.success('Appointment updated successfully!');
      queryClient.invalidateQueries(['appointments']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update appointment');
    }
  });

  // Delete appointment mutation
  const deleteAppointmentMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      toast.success('Appointment deleted successfully!');
      queryClient.invalidateQueries(['appointments']);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete appointment');
    }
  });

  // Reschedule appointment mutation
  const rescheduleAppointmentMutation = useMutation({
    mutationFn: (data) => updateAppointment({ 
      id: data.appointmentId,
      startTime: data.startTime,
      endTime: data.endTime,
      title: data.title,
      description: data.description,
      meetingType: data.meetingType,
      location: data.location,
      duration: data.duration,
    }),
    onSuccess: () => {
      toast.success('Appointment rescheduled successfully!');
      queryClient.invalidateQueries(['appointments']);
      setSelectedAppointmentDetail(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
    }
  });

  // Accept appointment mutation
  const acceptAppointmentMutation = useMutation({
    mutationFn: (appointmentId) => updateAppointment({ id: appointmentId, status: 'confirmed' }),
    onSuccess: () => {
      toast.success('Appointment accepted!');
      queryClient.invalidateQueries(['appointments']);
      setShowRequestModal(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to accept appointment');
    }
  });

  // Decline appointment mutation
  const declineAppointmentMutation = useMutation({
    mutationFn: (data) => updateAppointment({ 
      id: data.appointmentId,
      status: 'declined', 
      declinedReason: data.reason 
    }),
    onSuccess: () => {
      toast.success('Appointment declined!');
      queryClient.invalidateQueries(['appointments']);
      setShowRequestModal(false);
      setSelectedRequest(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to decline appointment');
    }
  });

  // Callback handlers
  const handleCreateAppointment = useCallback((appointmentData) => {
    // Validate appointment data
    if (!appointmentData.title || !appointmentData.title.trim()) {
      toast.error('Please enter an appointment title');
      return;
    }
    if (!appointmentData.startTime) {
      toast.error('Please select a start time');
      return;
    }
    if (!appointmentData.friendId) {
      toast.error('Please select a friend');
      return;
    }

    const userId = currentUser?._id || currentUser?.id;
    createAppointmentMutation.mutate({
      ...appointmentData,
      userId,
      status: 'pending'  // Create as pending - waiting for recipient response
    });
  }, [createAppointmentMutation, currentUser]);

  const handleUpdateAppointment = useCallback((appointmentData) => {
    updateAppointmentMutation.mutate(appointmentData);
  }, [updateAppointmentMutation]);

  const handleDeleteAppointment = useCallback((appointmentId, reason) => {
    deleteAppointmentMutation.mutate(appointmentId);
  }, [deleteAppointmentMutation]);

  const handleAcceptAppointment = useCallback((appointmentId) => {
    acceptAppointmentMutation.mutate(appointmentId);
  }, [acceptAppointmentMutation]);

  const handleDeclineAppointment = useCallback((appointmentId, reason) => {
    declineAppointmentMutation.mutate({
      appointmentId,
      reason
    });
  }, [declineAppointmentMutation]);

  // Toggle friend visibility in multi-calendar view
  const handleToggleFriendVisibility = useCallback((friendId) => {
    setVisibleFriends(prev => {
      if (prev.includes(friendId)) {
        return prev.filter(id => id !== friendId);
      } else {
        return [...prev, friendId];
      }
    });

    // Show toast notification (outside state setter to avoid duplicates)
    const friend = friends.find(f => f._id === friendId);
    const friendName = friend?.fullName || friend?.name || 'Friend';
    const isNowVisible = !visibleFriends.includes(friendId); // Check before state update
    
    toast.success(
      isNowVisible 
        ? `${friendName}'s calendar is now visible` 
        : `${friendName}'s calendar is hidden`,
      { duration: 2000 }
    );
  }, [friends, visibleFriends]);

  // Get appointment owner details
  const getAppointmentOwner = (appointment) => {
    const userId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    const currentUserId = currentUser?._id || currentUser?.id;

    if (userId === currentUserId || friendId === currentUserId) {
      return {
        name: currentUser?.name || currentUser?.fullName || 'You',
        id: currentUserId,
        isCurrentUser: true,
      };
    }

    const friend = friends.find(f => f._id === userId || f._id === friendId);
    return {
      name: friend?.name || friend?.fullName || 'Friend',
      id: friend?._id,
      isCurrentUser: false,
    };
  };

  // Get color for owner
  const getColorForOwner = (ownerId) => {
    const colorPalette = [
      { badge: 'bg-blue-500', text: 'text-blue-700' },
      { badge: 'bg-purple-500', text: 'text-purple-700' },
      { badge: 'bg-emerald-500', text: 'text-emerald-700' },
      { badge: 'bg-rose-500', text: 'text-rose-700' },
      { badge: 'bg-amber-500', text: 'text-amber-700' },
      { badge: 'bg-cyan-500', text: 'text-cyan-700' },
      { badge: 'bg-pink-500', text: 'text-pink-700' },
      { badge: 'bg-indigo-500', text: 'text-indigo-700' },
    ];
    
    const friendIndex = friends.findIndex(f => f._id === ownerId);
    return friendIndex >= 0 ? colorPalette[(friendIndex + 1) % colorPalette.length] : colorPalette[0];
  };

  // Get status-based colors for consistent styling across all components
  const getStatusBadgeColor = (status) => {
    const statusColorMap = {
      scheduled: { badge: 'bg-blue-500', text: 'text-white' },
      confirmed: { badge: 'bg-green-500', text: 'text-white' },
      completed: { badge: 'bg-gray-500', text: 'text-white' },
      pending: { badge: 'bg-yellow-500', text: 'text-white' },
      cancelled: { badge: 'bg-red-500', text: 'text-white' },
      declined: { badge: 'bg-red-500', text: 'text-white' },
    };
    return statusColorMap[status?.toLowerCase()] || { badge: 'bg-gray-500', text: 'text-white' };
  };

  // Get card background color based on status
  const getStatusCardColor = (status) => {
    // Always use theme colors for card backgrounds
    return 'bg-base-100 border-base-300';
  };

  // Helper function to detect if this is a pending request FROM another user
  const isPendingRequestFromOther = useCallback((appointment) => {
    // Current user is receiving a request if they are the friendId and status is pending
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentFriendId = appointment.friendId?._id || appointment.friendId;
    return appointment.status === 'pending' && appointmentFriendId === currentUserId;
  }, [currentUser]);

  // Filter today's appointments
  const todayAppointments = displayAppointments.filter(appt => {
    const apptDate = typeof appt.startTime === 'string' 
      ? parseISO(appt.startTime)
      : new Date(appt.startTime);
    return format(apptDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  // Get pending requests for current user (where they are the recipient)
  const pendingRequests = appointments.filter(appt => isPendingRequestFromOther(appt));

  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    return friends.filter(friend => {
      const fullName = (friend.fullName || friend.name || '').toLowerCase();
      const email = (friend.email || '').toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return fullName.includes(query) || email.includes(query);
    });
  }, [searchQuery, friends]);

  // Get the currently viewed friend's details
  const selectedFriend = useMemo(() => {
    return friends.find(f => f._id === viewingFriendId);
  }, [viewingFriendId, friends]);

  if (loadingFriends || loadingUser || loadingAppointments) {
    return <PageLoader />;
  }

  if (!currentUser || (!currentUser._id && !currentUser.id)) {
    console.warn('Current user data:', currentUser);
    return (
      <div className="min-h-screen bg-base-100 flex items-center justify-center" data-theme={theme}>
        <div className="text-center py-10">
          <p className="text-error text-lg font-semibold">You must be logged in to book an appointment.</p>
          <a href="/login" className="text-primary hover:text-primary-focus mt-4 inline-block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 flex flex-col lg:flex-row" data-theme={theme}>
      {/* Mobile Sidebar Overlay */}
      {showSidebar && isMultiCalendarMode && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setShowSidebar(false)} />
      )}

      {/* Sidebar */}
      {isMultiCalendarMode && (
        <div className={`fixed left-0 top-0 h-screen z-50 lg:static lg:z-auto transition-all duration-300 overflow-hidden ${
          showSidebar ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${showDesktopSidebar ? 'lg:w-80' : 'lg:w-0'}`}>
          <div className="w-80 h-full shadow-lg bg-base-100 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-base-300 lg:hidden">
              <h3 className="font-semibold text-base-content">Calendars</h3>
              <button onClick={() => setShowSidebar(false)} className="btn btn-ghost btn-sm">
                ✕
              </button>
            </div>
            <MemoizedCalendarSidebar
              friends={friends}
              currentUser={currentUser}
              visibleFriends={visibleFriends}
              onToggleFriendVisibility={handleToggleFriendVisibility}
              selectedDate={selectedMiniCalDate}
              onDateSelect={setSelectedMiniCalDate}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col flex-1">
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold text-base-content">Book Appointment</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              {isMultiCalendarMode && (
                <button
                  onClick={() => setShowSidebar(!showSidebar)}
                  className="btn btn-outline btn-sm lg:hidden flex-1 md:flex-none"
                  title="Show/hide calendars sidebar"
                >
                  📅 Calendars
                </button>
              )}
              {isMultiCalendarMode && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowDesktopSidebar(!showDesktopSidebar)}
                    className="btn btn-outline btn-sm hidden lg:inline-flex"
                    title="Toggle sidebar"
                  >
                    {showDesktopSidebar ? '◄' : '►'}
                  </button>
                  <span className="text-xs font-medium text-base-content/60 hidden lg:inline">
                    {showDesktopSidebar ? 'Hide' : 'Show'} Calendars
                  </span>
                </div>
              )}
            </div>
          </div>


          {/* Friend Search Bar */}
        <div className="mb-8 relative" ref={searchBarRef}>
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/50 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="View friend's calendar (name or email)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                setShowSearchResults(!showSearchResults);
                if (showSearchResults) {
                  setExpandSearchResults(false);
                }
              }}
              aria-label="Search friends by name or email"
              className="w-full pl-12 pr-12 py-3 bg-base-100 border border-base-300 rounded-lg text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/50 transition"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                  setViewingFriendId(null);
                }}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-base-content/50 hover:text-base-content transition"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchResults && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50">
              {filteredFriends.length > 0 || friends.length > 0 ? (
              <>
                <button
                  onClick={() => setExpandSearchResults(!expandSearchResults)}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-semibold text-base-content/60 bg-base-200 hover:bg-base-300 transition cursor-pointer border-b border-base-300"
                  aria-expanded={expandSearchResults}
                >
                  <span className={`text-lg transition-transform duration-200 ${expandSearchResults ? 'rotate-180' : ''}`}>↓</span>
                  <span>
                    {searchQuery ? 'Search Results' : 'Quick Access'}
                  </span>
                  <span className="ml-auto text-base-content/50">
                    {searchQuery ? filteredFriends.length : Math.min(3, friends.length)}
                  </span>
                </button>
                {expandSearchResults && (
              <div className="max-h-80 overflow-y-auto">
                {(searchQuery ? filteredFriends : friends.slice(0, 3)).map(friend => {
                  const friendStatus = friendsAvailability[friend._id] || 'available';
                  const isAway = friendStatus === 'away';
                  
                  return (
                  <button
                    key={friend._id}
                    onClick={() => {
                      if (!isAway) {
                        setViewingFriendId(friend._id);
                        setSearchQuery('');
                        setShowSearchResults(false);
                        setExpandSearchResults(false);
                      }
                    }}
                    disabled={isAway}
                    className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-base-300 last:border-b-0 transition ${
                      isAway 
                        ? 'opacity-50 cursor-not-allowed bg-base-200'
                        : 'hover:bg-base-200 cursor-pointer'
                    }`}
                  >
                    {friend.profilePic ? (
                      <img
                        src={friend.profilePic}
                        alt={friend.fullName}
                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {(friend.fullName || friend.name || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-base-content truncate">
                        {friend.fullName || friend.name}
                      </p>
                      <p className="text-xs text-base-content/60 truncate">
                        {friend.email}
                      </p>
                    </div>
                  </button>
                  );
                })}
                {!searchQuery && friends.length > 3 && (
                  <div className="px-4 py-2 text-xs text-base-content/60 text-center border-t border-base-300">
                    {friends.length - 3} more friends • Type to search
                  </div>
                )}
              </div>
                )}
              </>
              ) : null}
            </div>
          )}

          {/* No Results Message */}
          {showSearchResults && filteredFriends.length === 0 && searchQuery.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-lg p-4 text-center text-base-content/60 z-50">
              No friends found matching "{searchQuery}"
            </div>
          )}
        </div>

        {/* Selected Friend Info */}
        {viewingFriendId && selectedFriend && (
          <div className={`mb-6 border-2 rounded-lg p-5 ${
            friendAvailability?.availabilityStatus === 'away'
              ? 'bg-error/10 border-error/30'
              : friendAvailability?.availabilityStatus === 'limited'
              ? 'bg-warning/10 border-warning/30'
              : 'bg-primary/10 border-primary/30'
          }`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="relative flex-shrink-0">
                  {selectedFriend.profilePic ? (
                    <img
                      src={selectedFriend.profilePic}
                      alt={selectedFriend.fullName}
                      className="w-16 h-16 rounded-full object-cover ring-2 ring-base-300"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-primary text-white flex items-center justify-center font-bold text-lg ring-2 ring-base-300">
                      {(selectedFriend.fullName || selectedFriend.name || 'U')[0].toUpperCase()}
                    </div>
                  )}
                  <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-sm font-bold text-white badge ${
                    friendAvailability?.availabilityStatus === 'away'
                      ? 'badge-error'
                      : friendAvailability?.availabilityStatus === 'limited'
                      ? 'badge-warning'
                      : 'badge-success'
                  }`}>
                    {friendAvailability?.availabilityStatus === 'away' ? '✕' : friendAvailability?.availabilityStatus === 'limited' ? '⚠' : '✓'}
                  </div>
                </div>
                <div className="flex-1">
                  <div className="mb-2">
                    <p className="font-bold text-lg text-base-content">
                      {selectedFriend.fullName || selectedFriend.name}
                    </p>
                    <p className="text-sm text-base-content/60">
                      {selectedFriend.email}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-3">
                    <span className={`badge font-medium ${
                      friendAvailability?.availabilityStatus === 'away'
                        ? 'badge-error'
                        : friendAvailability?.availabilityStatus === 'limited'
                        ? 'badge-warning'
                        : 'badge-success'
                    }`}>
                      {friendAvailability?.availabilityStatus === 'away'
                        ? '✕ Away'
                        : friendAvailability?.availabilityStatus === 'limited'
                        ? '⚠ Limited Availability'
                        : '✓ Available'}
                    </span>
                    {friendAvailability?.availabilityStatus === 'away' && (
                      <p className="text-xs text-error font-medium">Not accepting bookings</p>
                    )}
                  </div>
                  {friendAvailability?.availabilityStatus !== 'away' && (
                    <p className="text-xs text-base-content/60 mt-2">
                      📅 You can view their calendar and schedule appointments below
                    </p>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingFriendId(null);
                  setSearchQuery('');
                }}
                className="btn btn-outline btn-sm flex-shrink-0"
              >
                Back
              </button>
            </div>
          </div>
        )}

        {/* Calendar Component */}
        <div className="rounded-lg shadow-2xl overflow-hidden mb-8 transition-all">
          <MemoizedCalendar
            appointments={displayAppointments}
            friends={friends}
            currentUser={currentUser}
            onAppointmentCreate={handleCreateAppointment}
            onAppointmentUpdate={handleUpdateAppointment}
            onAppointmentDelete={handleDeleteAppointment}
            availability={getAvailabilityForCalendar}
            visibleFriends={visibleFriends}
            isMultiCalendarMode={isMultiCalendarMode}
            isViewingFriendAway={friendAvailability?.availabilityStatus === 'away'}
            viewingFriendId={viewingFriendId}
            friendsAvailability={friendsAvailability}
          />
        </div>

        {/* Today's Appointments Section */}
        <div className="mt-8 animate-fade-in">
          <button
            onClick={() => setExpandTodayAppointments(!expandTodayAppointments)}
            className="flex items-center gap-2 text-xl font-semibold text-base-content mb-4 hover:text-primary transition cursor-pointer w-full"
            aria-expanded={expandTodayAppointments}
          >
            <span className={`text-lg transition-transform duration-200 ${expandTodayAppointments ? 'rotate-180' : ''}`}>↓</span>
            <span>
              Today's Appointments ({todayAppointments.length}) • {format(new Date(), 'EEEE, MMMM d')}
            </span>
          </button>
          
          {expandTodayAppointments && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAppointments.length === 0 ? (
                <div className="col-span-full text-center py-8">
                  <p className="text-base-content/60 font-medium">No appointments scheduled for today</p>
                </div>
              ) : (
                todayAppointments.map((appointment) => {
                const startTime = typeof appointment.startTime === 'string' 
                  ? parseISO(appointment.startTime)
                  : new Date(appointment.startTime);
                const endTime = appointment.endTime 
                  ? (typeof appointment.endTime === 'string' 
                      ? parseISO(appointment.endTime)
                      : new Date(appointment.endTime))
                  : null;
                
                const statusColor = getStatusBadgeColor(appointment.status);
                const cardColor = getStatusCardColor(appointment.status);

                const isPending = isPendingRequestFromOther(appointment);
                const owner = getAppointmentOwner(appointment);
                const ownerColor = isMultiCalendarMode ? getColorForOwner(owner.id) : null;

                return (
                  <div 
                    key={appointment._id || appointment.id} 
                    className={`p-4 border-2 rounded-lg transition-all cursor-pointer ${cardColor || 'bg-base-100 border-base-300'}`}
                    onClick={() => {
                      if (isPending) {
                        setSelectedRequest(appointment);
                        setShowRequestModal(true);
                      } else {
                        setShowTodaysAppointmentsModal(true);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-base-content">{appointment.title || 'Untitled'}</h3>
                        {isMultiCalendarMode && !owner.isCurrentUser && (
                          <div className="flex items-center gap-2 mt-2">
                            {(() => {
                              const ownerFriend = friends.find(f => f._id === owner.id);
                              return (
                                <>
                                  {ownerFriend?.profilePic ? (
                                    <img
                                      src={ownerFriend.profilePic}
                                      alt={ownerFriend.fullName}
                                      className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                                      {(ownerFriend?.fullName || owner.name || 'U')[0].toUpperCase()}
                                    </div>
                                  )}
                                  <p className="text-xs text-base-content/60">
                                    With: {owner.name}
                                  </p>
                                </>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isMultiCalendarMode && (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${ownerColor?.badge}`}>
                            {owner.name[0].toUpperCase()}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${statusColor?.badge || 'bg-gray-500'} ${statusColor?.text || 'text-white'}`}>
                          {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Scheduled'}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm text-base-content/70 mb-2">
                      {format(startTime, 'h:mm a')}
                      {endTime && ` - ${format(endTime, 'h:mm a')}`}
                    </p>
                    {appointment.participant && (
                      <p className="text-sm text-base-content/60">
                        With: {appointment.participant.name || 'Friend'}
                      </p>
                    )}
                    {appointment.message && (
                      <p className="mt-2 text-sm text-base-content/60 line-clamp-2">
                        {appointment.message}
                      </p>
                    )}
                  </div>
                );
              })
              )}
            </div>
          )}
        </div>
      </div>
      </div>

      {/* Appointment Request Modal */}
      <AppointmentRequestModal
        isOpen={showRequestModal}
        onClose={() => {
          setShowRequestModal(false);
          setSelectedRequest(null);
        }}
        appointment={selectedRequest}
        currentUser={currentUser}
        onAccept={handleAcceptAppointment}
        onDecline={handleDeclineAppointment}
        isLoading={acceptAppointmentMutation.isLoading || declineAppointmentMutation.isLoading}
      />

      {/* Appointment Details View */}
      {selectedAppointmentDetail && (
        <AppointmentDetailsView
          appointment={selectedAppointmentDetail}
          currentUser={currentUser}
          onClose={() => setSelectedAppointmentDetail(null)}
          onDelete={() => {
            handleDeleteAppointment(selectedAppointmentDetail._id);
            setSelectedAppointmentDetail(null);
          }}
          onEdit={() => {
            console.log('Edit appointment:', selectedAppointmentDetail._id);
          }}
          friends={friends}
          availability={currentUser?.availability || {}}
          friendsAvailability={friendsAvailability}
          appointments={appointments}
          onUpdateAppointment={(formData) => {
            rescheduleAppointmentMutation.mutate({
              appointmentId: selectedAppointmentDetail._id,
              ...formData
            });
          }}
        />
      )}

      {/* Today's Appointments Modal */}
      <TodaysAppointmentsModal
        isOpen={showTodaysAppointmentsModal}
        onClose={() => setShowTodaysAppointmentsModal(false)}
        appointments={appointments}
        currentUser={currentUser}
        onEditAppointment={(appointment) => {
          setShowTodaysAppointmentsModal(false);
          console.log('Edit appointment:', appointment._id);
        }}
        onDeleteAppointment={(appointmentId) => {
          handleDeleteAppointment(appointmentId);
          setShowTodaysAppointmentsModal(false);
        }}
      />
    </div>
  );
};

export default AppointmentBookingPage;
