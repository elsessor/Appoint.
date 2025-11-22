import React, { useState, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Calendar from '../components/appointments/Calendar';
import CalendarSidebar from '../components/appointments/CalendarSidebar';
import AppointmentRequestModal from '../components/appointments/AppointmentRequestModal';
import ThemeSelector from '../components/ThemeSelector';
import { getMyFriends, getAuthUser, createAppointment, updateAppointment, deleteAppointment, getAppointments } from '../lib/api';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { useThemeStore } from '../store/useThemeStore';
import { Search, X } from 'lucide-react';

const AppointmentBookingPage = () => {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const [viewingFriendId, setViewingFriendId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [visibleFriends, setVisibleFriends] = useState([]);
  const [isMultiCalendarMode, setIsMultiCalendarMode] = useState(true);
  const [selectedMiniCalDate, setSelectedMiniCalDate] = useState(null);

  // Scheduling availability
  const availability = {
    days: [1, 2, 3, 4, 5], // Monday to Friday
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
    buffer: 15,
  };

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
    deleteAppointmentMutation.mutate({ 
      id: appointmentId, 
      cancellationReason: reason 
    });
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
    setVisibleFriends(prev => 
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  }, []);

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

  // Helper function to detect if this is a pending request FROM another user
  const isPendingRequestFromOther = useCallback((appointment) => {
    // Current user is receiving a request if they are the friendId and status is pending
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentFriendId = appointment.friendId?._id || appointment.friendId;
    return appointment.status === 'pending' && appointmentFriendId === currentUserId;
  }, [currentUser]);

  // Filter today's appointments (all appointments for today)
  const todayAppointments = appointments.filter(appt => {
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

  // Get appointments for the viewed friend
  const friendAppointments = useMemo(() => {
    if (!viewingFriendId) return appointments;
    
    // Filter appointments where the viewed friend is involved
    return appointments.filter(apt => {
      const friendId = apt.friendId?._id || apt.friendId;
      const userId = apt.userId?._id || apt.userId;
      
      return friendId === viewingFriendId || userId === viewingFriendId;
    });
  }, [viewingFriendId, appointments]);

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
    <div className="min-h-screen bg-base-100 p-4 md:p-6 lg:p-8" data-theme={theme}>
      {/* Incoming Requests Banner */}
      {pendingRequests.length > 0 && (
        <div className="mb-6 bg-gradient-to-r from-warning/20 to-info/20 border-l-4 border-warning rounded-lg p-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <span className="text-2xl">📬</span>
              <div>
                <p className="text-base font-bold text-base-content">
                  {pendingRequests.length} Appointment Request{pendingRequests.length !== 1 ? 's' : ''} Waiting
                </p>
                <p className="text-sm text-base-content/70 mt-1">
                  Friends have sent you appointment requests. Review and respond to them below.
                </p>
              </div>
            </div>
            <a href="/appointments" className="btn btn-warning btn-sm">
              View All Requests
            </a>
          </div>
        </div>
      )}

      <div className="flex gap-6">
        {/* Calendar Sidebar */}
        {isMultiCalendarMode && (
          <div className="hidden lg:block flex-shrink-0">
            <div className="rounded-lg shadow-lg overflow-hidden" style={{ width: '300px', maxHeight: 'calc(100vh - 200px)' }}>
              <CalendarSidebar
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

        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Book Appointment</h1>
            <p className="text-base-content/60 mt-1">View your schedule and book appointments with friends</p>
          </div>
        </div>

        {/* Friend Search Bar */}
        <div className="mb-8 relative">
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-base-content/50">
              <Search className="w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search friends to view their calendar..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(e.target.value.trim().length > 0);
              }}
              onFocus={() => {
                if (searchQuery.trim().length > 0) {
                  setShowSearchResults(true);
                }
              }}
              className="w-full pl-12 pr-12 py-3 bg-base-100 border border-base-300 rounded-lg text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
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
          {showSearchResults && filteredFriends.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50">
              <div className="max-h-64 overflow-y-auto">
                {filteredFriends.map(friend => (
                  <button
                    key={friend._id}
                    onClick={() => {
                      setViewingFriendId(friend._id);
                      setSearchQuery('');
                      setShowSearchResults(false);
                    }}
                    className="w-full px-4 py-3 text-left hover:bg-base-200 transition flex items-center gap-3 border-b border-base-300 last:border-b-0"
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
                ))}
              </div>
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
          <div className="mb-6 bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {selectedFriend.profilePic ? (
                  <img
                    src={selectedFriend.profilePic}
                    alt={selectedFriend.fullName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold">
                    {(selectedFriend.fullName || selectedFriend.name || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="font-semibold text-base-content">
                    Viewing {selectedFriend.fullName || selectedFriend.name}'s Calendar
                  </p>
                  <p className="text-sm text-base-content/60">
                    You can see their appointments and schedule new ones
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setViewingFriendId(null);
                  setSearchQuery('');
                }}
                className="btn btn-outline btn-sm"
              >
                Back to My Calendar
              </button>
            </div>
          </div>
        )}

        {/* Calendar Component */}
        <div className="rounded-lg shadow-2xl overflow-hidden mb-8">
          <Calendar
            appointments={viewingFriendId ? friendAppointments : appointments}
            friends={friends}
            currentUser={currentUser}
            onAppointmentCreate={handleCreateAppointment}
            onAppointmentUpdate={handleUpdateAppointment}
            onAppointmentDelete={handleDeleteAppointment}
            availability={availability}
            visibleFriends={visibleFriends}
            isMultiCalendarMode={isMultiCalendarMode}
          />
        </div>

        {/* Today's Appointments Section */}
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-base-content mb-4">
            Today's Appointments ({format(new Date(), 'EEEE, MMMM d, yyyy')})
          </h2>
          
          {todayAppointments.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {todayAppointments.map((appointment) => {
                const startTime = typeof appointment.startTime === 'string' 
                  ? parseISO(appointment.startTime)
                  : new Date(appointment.startTime);
                const endTime = appointment.endTime 
                  ? (typeof appointment.endTime === 'string' 
                      ? parseISO(appointment.endTime)
                      : new Date(appointment.endTime))
                  : null;
                
                const statusColors = {
                  pending: 'bg-warning/20 border-warning text-warning-content',
                  confirmed: 'bg-success/20 border-success text-success-content',
                  scheduled: 'bg-info/20 border-info text-info-content',
                  declined: 'bg-error/20 border-error text-error-content',
                  cancelled: 'bg-base-300 border-base-300 text-base-content/70',
                };

                const isPending = isPendingRequestFromOther(appointment);
                const owner = getAppointmentOwner(appointment);
                const ownerColor = isMultiCalendarMode ? getColorForOwner(owner.id) : null;

                return (
                  <div 
                    key={appointment._id || appointment.id} 
                    className={`p-4 border-2 rounded-lg transition-all ${
                      isPending 
                        ? 'bg-warning/20 border-warning hover:shadow-lg cursor-pointer' 
                        : 'bg-base-200 border-base-300 hover:shadow-lg cursor-pointer'
                    }`}
                    onClick={() => {
                      if (isPending) {
                        setSelectedRequest(appointment);
                        setShowRequestModal(true);
                      }
                    }}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-base-content">{appointment.title || 'Untitled'}</h3>
                        {isMultiCalendarMode && !owner.isCurrentUser && (
                          <p className="text-xs text-base-content/60 mt-1">
                            With: {owner.name}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {isMultiCalendarMode && (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${ownerColor?.badge}`}>
                            {owner.name[0].toUpperCase()}
                          </span>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium badge ${
                          statusColors[appointment.status] || statusColors.scheduled
                        }`}>
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
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-base-200 rounded-lg border-2 border-base-300">
              <p className="text-base-content/60">No appointments scheduled for today</p>
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
    </div>
  );
};

export default AppointmentBookingPage;
