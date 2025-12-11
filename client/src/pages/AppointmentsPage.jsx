import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { format, parseISO, isToday } from 'date-fns';
import { Calendar, Clock, Video, Phone, MapPin, Trash2, Edit, Bell, Clock3, CheckCircle, CheckCircle2, XCircle, ListIcon, Star } from "lucide-react";
import { getAppointments, deleteAppointment, updateAppointment, getAuthUser } from '../lib/api';
import PageLoader from '../components/PageLoader';
import AppointmentDetailsView from '../components/appointments/AppointmentDetailsView';
import AppointmentRequestModal from '../components/appointments/AppointmentRequestModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ThemeSelector from '../components/ThemeSelector';
import RatingModal from '../components/appointments/RatingModal';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../store/useThemeStore';
import { getStatusColor } from '../utils/statusColors';

const AppointmentsPage = () => {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('scheduled'); 
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);


  const { data: currentUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
    retry: 1,
  });


  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
    staleTime: 1000 * 60 * 5,
  });

  const [ratingModalOpen, setRatingModalOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [viewingRating, setViewingRating] = useState(null);
  const [showViewRatingModal, setShowViewRatingModal] = useState(false);

  const ratingMutation = useMutation({
    mutationFn: ({ id, rating, feedback }) => updateAppointment({ id, rating, feedback }),
    onSuccess: () => {
      toast.success('Rating saved');
      queryClient.invalidateQueries(['appointments']);
      setRatingModalOpen(false);
      setRatingTarget(null);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to save rating');
    }
  });


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
      setSelectedAppointment(null);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to reschedule appointment');
    }
  });

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


  const currentUserId = currentUser?._id || currentUser?.id;


  const involvedAppointments = appointments.filter((apt) => {
    const appointmentUserId = apt.userId?._id || apt.userId;
    const appointmentFriendId = apt.friendId?._id || apt.friendId;
    return appointmentUserId === currentUserId || appointmentFriendId === currentUserId;
  });

  
  const incomingRequests = appointments.filter((apt) => {
    const appointmentFriendId = apt.friendId?._id || apt.friendId;
    return (apt.status === 'pending' || apt.status === 'scheduled') && appointmentFriendId === currentUserId;
  });


  const userCreatedAppointments = appointments.filter((apt) => {
    const appointmentUserId = apt.userId?._id || apt.userId;
    return appointmentUserId === currentUserId;
  });

  
  const userSentPendingAppointments = userCreatedAppointments.filter((apt) => apt.status === 'pending');

  
  const appointmentsForToday = involvedAppointments
    .filter((apt) => {
      const startTime = typeof apt.startTime === 'string' ? parseISO(apt.startTime) : new Date(apt.startTime);
      // Exclude completed, cancelled, and declined appointments
      const isValidStatus = !['completed', 'cancelled', 'declined'].includes(apt.status?.toLowerCase());
      // Must be confirmed or scheduled
      const isActiveStatus = ['confirmed', 'scheduled'].includes(apt.status?.toLowerCase());
      return isToday(startTime) && isActiveStatus && isValidStatus;
    })
    .sort((a, b) => {
      const timeA = typeof a.startTime === 'string' ? parseISO(a.startTime) : new Date(a.startTime);
      const timeB = typeof b.startTime === 'string' ? parseISO(b.startTime) : new Date(b.startTime);
      return timeA - timeB;
    });

  
  useEffect(() => {
    if (appointments.length > 0) {
      console.log('Total appointments:', appointments.length);
      console.log('Incoming requests:', incomingRequests.length);
    }
  }, [appointments, currentUser, incomingRequests]);

  // Check for view parameter in URL and display that appointment
  useEffect(() => {
    const appointmentId = searchParams.get('view');
    if (appointmentId && appointments.length > 0) {
      const foundAppointment = appointments.find(apt => apt._id === appointmentId);
      if (foundAppointment) {
        setSelectedAppointment(foundAppointment);
      }
    }
  }, [searchParams, appointments]);

  
  const filteredAppointments = filterStatus === 'all'
    ? involvedAppointments
    : filterStatus === 'incoming'
    ? incomingRequests
    : filterStatus === 'pending'
    ? userSentPendingAppointments
    : filterStatus === 'scheduled'
    ? appointmentsForToday
    : involvedAppointments.filter((apt) => apt.status === filterStatus);

  
  const handleDeleteClick = (appointmentId) => {
    setAppointmentToDelete(appointmentId);
    setShowConfirmDialog(true);
  };

  const handleDeleteAppointment = async () => {
    if (!appointmentToDelete) return;
    
    try {
      await deleteAppointment(appointmentToDelete);
      toast.success('Appointment cancelled successfully');
      refetch();
      setSelectedAppointment(null);
      setAppointmentToDelete(null);
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Failed to cancel appointment');
    }
  };

  const handleAcceptAppointment = useCallback((appointmentId) => {
    acceptAppointmentMutation.mutate(appointmentId);
  }, [acceptAppointmentMutation]);

  const handleDeclineAppointment = useCallback((appointmentId, reason) => {
    declineAppointmentMutation.mutate({
      appointmentId,
      reason
    });
  }, [declineAppointmentMutation]);

  const formatAppointmentDateTime = (appointment) => {
    const startTime = typeof appointment.startTime === 'string'
      ? parseISO(appointment.startTime)
      : new Date(appointment.startTime);
    return format(startTime, 'MMM dd, yyyy - h:mm a');
  };


  const getStatusBadgeColor = (status) => {
    return getStatusColor(status);
  };

  const getStatusAccent = (status) => {
    switch (status) {
      case 'scheduled':
        return 'bg-gradient-to-b from-blue-500 to-blue-600';
      case 'confirmed':
        return 'bg-gradient-to-b from-green-500 to-green-600';
      case 'pending':
        return 'bg-gradient-to-b from-yellow-400 to-yellow-500';
      case 'completed':
        return 'bg-gradient-to-b from-indigo-500 to-indigo-600';
      case 'cancelled':
      case 'declined':
        return 'bg-gradient-to-b from-red-500 to-red-600';
      default:
        return 'bg-gray-400';
    }
  };


  const getMeetingTypeIcon = (meetingType) => {
    switch (meetingType) {
      case 'Video Call':
        return <Video className="w-4 h-4" />;
      case 'Phone Call':
        return <Phone className="w-4 h-4" />;
      case 'In Person':
        return <MapPin className="w-4 h-4" />;
      default:
        return <Video className="w-4 h-4" />;
    }
  };

  // Helper: Get the other user in the appointment (not the current user)
  const getOtherUser = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentUserId = appointment.userId?._id || appointment.userId;
    // If current user created the appointment, show the friend
    // Otherwise show the user who created it
    return appointmentUserId === currentUserId ? appointment.friendId : appointment.userId;
  };

  // Helper: Get other user's profile picture with fallback
  const getOtherUserProfilePic = (appointment) => {
    const otherUser = getOtherUser(appointment);
    return (otherUser?.profilePic?.trim()) ? otherUser.profilePic : '/default-profile.svg';
  };

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      {selectedAppointment ? (
        <AppointmentDetailsView
          appointment={selectedAppointment}
          currentUser={currentUser}
          onClose={() => setSelectedAppointment(null)}
          onDelete={() => handleDeleteClick(selectedAppointment._id)}
          onEdit={() => {
            console.log('Edit appointment:', selectedAppointment._id);
          }}
          onSendMessage={() => {
            console.log('Send message');
          }}
          friends={currentUser?.friends || []}
          availability={currentUser?.availability || {}}
          friendsAvailability={{}}
          appointments={appointments}
          onUpdateAppointment={(formData) => {
            rescheduleAppointmentMutation.mutate({
              appointmentId: selectedAppointment._id,
              ...formData
            });
          }}
        />
      ) : (
        <>
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-extrabold text-base-content">Appointments</h1>
                <p className="text-sm text-base-content/60">Manage your upcoming and past appointments</p>
              </div>
              <div className="flex items-center gap-2">
              </div>
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-2">
            <div className="flex gap-2 flex-wrap items-center">
                {[
                  { value: 'scheduled', label: 'Today', count: appointmentsForToday.length, Icon: Calendar, priority: true },
                  { value: 'all', label: 'All', count: involvedAppointments.length, Icon: ListIcon },
                  { value: 'incoming', label: 'Incoming', count: incomingRequests.length, Icon: Bell },
                  { value: 'pending', label: 'Pending', count: userSentPendingAppointments.length, Icon: Clock3 },
                  { value: 'confirmed', label: 'Confirmed', count: involvedAppointments.filter(a => a.status === 'confirmed').length, Icon: CheckCircle },
                  { value: 'completed', label: 'Completed', count: involvedAppointments.filter(a => a.status === 'completed').length, Icon: CheckCircle2 },
                  { value: 'cancelled', label: 'Cancelled', count: involvedAppointments.filter(a => a.status === 'cancelled').length, Icon: XCircle },
                  { value: 'declined', label: 'Declined', count: involvedAppointments.filter(a => a.status === 'declined').length, Icon: XCircle },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterStatus(tab.value)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-2 whitespace-nowrap btn-sm ${
                      filterStatus === tab.value
                        ? tab.priority
                          ? 'btn btn-error btn-sm'
                          : 'btn btn-primary btn-sm'
                        : tab.priority
                        ? 'btn btn-outline btn-error btn-sm'
                        : 'btn btn-outline btn-sm'
                    }`}
                  >
                    <tab.Icon className="w-4 h-4" />
                    <span>{tab.label}</span>
                    <span className={`badge badge-sm font-bold ${
                      filterStatus === tab.value
                        ? 'badge-ghost'
                        : tab.priority
                        ? 'badge-error'
                        : 'badge-ghost'
                    }`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
            </div>
          </div>

          <div className="max-w-7xl mx-auto px-6 py-8">
            {filterStatus === 'incoming' && incomingRequests.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-base-content mb-2">No incoming requests</h3>
                <p className="text-base-content/60">
                  You don't have any pending appointment requests.
                </p>
              </div>
            ) : filterStatus === 'incoming' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {incomingRequests.map((appointment) => {
                  const requester = appointment.userId;
                  return (
                    <div
                      key={appointment._id}
                      className="bg-base-100 border-2 border-warning rounded-lg p-4 hover:shadow-lg transition cursor-pointer group"
                      onClick={() => {
                        setSelectedRequest(appointment);
                        setShowRequestModal(true);
                      }}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={requester?.profilePic || '/default-profile.svg'}
                            alt={requester.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/default-profile.svg';
                            }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base-content truncate">
                            {requester?.fullName || 'Someone'}
                          </h3>
                          <p className="text-xs text-base-content/60 truncate">
                            {appointment.title || 'Appointment'}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-base-content/70 mb-3">
                        <Calendar className="w-3 h-3" />
                        <span>{formatAppointmentDateTime(appointment)}</span>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(appointment);
                          setShowRequestModal(true);
                        }}
                        className="btn btn-warning btn-sm w-full group-hover:btn-warning-focus"
                      >
                        Review Request
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className={filterStatus === 'scheduled' ? "max-w-4xl mx-auto" : ""}>
                {filterStatus === 'scheduled' ? (
                  <div className="space-y-4">
                    {appointmentsForToday.length === 0 ? (
                      <div className="text-center py-12">
                        <Calendar className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-base-content mb-2">No appointments today</h3>
                        <p className="text-base-content/60">
                          You don't have any confirmed appointments scheduled for today.
                        </p>
                      </div>
                    ) : (
                      appointmentsForToday.map((appointment, index) => {
                        const startTime = typeof appointment.startTime === 'string' ? parseISO(appointment.startTime) : new Date(appointment.startTime);
                        const isUpcoming = startTime > new Date();
                        const isCurrentOrSoon = Math.abs(new Date() - startTime) < 3600000; // Within 1 hour
                        
                        return (
                          <div key={appointment._id} className="relative">
                            <div className="absolute -left-8 top-0 flex flex-col items-center">
                              <div className={`w-5 h-5 rounded-full border-3 flex items-center justify-center text-xs font-bold ${
                                isCurrentOrSoon 
                                  ? 'bg-error border-error text-white animate-pulse' 
                                  : 'bg-primary border-primary text-white'
                              }`}>
                                {index + 1}
                              </div>
                              {index < appointmentsForToday.length - 1 && (
                                <div className="w-0.5 h-20 bg-base-300 mt-2" />
                              )}
                            </div>

                            {/* Card */}
                            <div className={`ml-8 p-5 rounded-xl border-2 transition-all ${
                              isCurrentOrSoon
                                ? 'bg-gradient-to-r from-error/10 to-warning/10 border-error shadow-lg ring-2 ring-error/20'
                                : 'bg-base-100 border-base-300 hover:shadow-md'
                            }`}>
                              {/* Top section: Avatar, Name, Status */}
                              <div className="flex items-start justify-between gap-3 mb-3">
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  {/* Avatar */}
                                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-offset-2 ring-offset-base-100" style={{
                                    ringColor: isCurrentOrSoon ? 'rgb(239, 68, 68)' : 'rgb(59, 130, 246)'
                                  }}>
                                    <img
                                      src={
                                        (() => {
                                          const appointmentUserId = appointment.userId?._id || appointment.userId;
                                          const otherUserProfilePic = appointmentUserId === currentUserId 
                                            ? appointment.friendId?.profilePic 
                                            : appointment.userId?.profilePic;
                                          return otherUserProfilePic || '/default-profile.svg';
                                        })()
                                      }
                                      alt="User"
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        e.target.src = '/default-profile.svg';
                                      }}
                                    />
                                  </div>

                                  {/* Name and Specialty */}
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-base-content text-base truncate">
                                      {(() => {
                                        const appointmentUserId = appointment.userId?._id || appointment.userId;
                                        const otherUser = appointmentUserId === currentUserId 
                                          ? appointment.friendId 
                                          : appointment.userId;
                                        return otherUser?.fullName || 'Unknown';
                                      })()}
                                    </h3>
                                    <p className="text-xs text-base-content/60 truncate">
                                      {appointment.title || 'Appointment'}
                                    </p>
                                  </div>
                                </div>

                                {/* Status Badge + Urgency indicator */}
                                <div className="flex items-center gap-2">
                                  {isCurrentOrSoon && (
                                    <div className="badge badge-error badge-xs animate-pulse">Soon</div>
                                  )}
                                  <div className={`badge badge-xs ${getStatusBadgeColor(appointment.status)}`}>
                                    {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Confirmed'}
                                  </div>
                                </div>
                              </div>

                              {/* Details: Date, Time, Location */}
                              <div className="flex flex-col gap-2 mb-4 text-xs text-base-content/70">
                                <div className="flex items-center gap-2 font-semibold text-base-content">
                                  <Clock className="w-4 h-4 text-primary" />
                                  <span className="text-sm">{format(startTime, 'h:mm a')} - {format(typeof appointment.endTime === 'string' ? parseISO(appointment.endTime) : new Date(appointment.endTime), 'h:mm a')}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {getMeetingTypeIcon(appointment.meetingType)}
                                  <span>{appointment.meetingType || 'Video Call'}</span>
                                </div>
                                {appointment.location && appointment.meetingType?.toLowerCase() === 'in-person' && (
                                  <div className="flex items-center gap-2">
                                    <MapPin className="w-3 h-3" />
                                    <span className="truncate">{appointment.location}</span>
                                  </div>
                                )}
                              </div>

                              {/* Action Buttons */}
                              <div className="flex flex-col gap-2 pt-3 border-t border-base-300">
                                <button
                                  onClick={() => setSelectedAppointment(appointment)}
                                  className={`w-full btn btn-xs ${isCurrentOrSoon ? 'btn-error' : 'btn-primary'}`}
                                >
                                  View Details
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAppointments.map((appointment) => (
                          <div key={appointment._id} className="rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-transform transform hover:-translate-y-1">
                            <div className="flex h-full bg-gradient-to-b from-base-100 to-base-200">
                              <div
                                className={`w-2 hidden md:block ${(() => {
                                  // If other participant is offline, show grey indicator
                                  const appointmentUserId = appointment.userId?._id || appointment.userId;
                                  const otherUser = appointmentUserId === currentUserId ? appointment.friendId : appointment.userId;
                                  const availability = (otherUser?.availabilityStatus || '').toLowerCase();
                                  if (availability === 'offline') {
                                    return 'bg-gradient-to-b from-gray-400 to-gray-500';
                                  }

                                  if (appointment.status === 'completed') {
                                    const attended = (appointment.attendedBy || []).map(String).includes(currentUserId);
                                    return attended
                                      ? 'bg-gradient-to-b from-blue-500 to-blue-600'
                                      : 'bg-gradient-to-b from-orange-400 to-orange-500';
                                  }
                                  return getStatusAccent(appointment.status);
                                })()}`}
                              />
                              <div className="flex-1 p-3 flex flex-col h-full">
                                <div className="flex items-center justify-between gap-2 mb-2">
                                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-1 ring-offset-1 ring-offset-base-100">
                                      <img
                                        src={
                                          (() => {
                                            const appointmentUserId = appointment.userId?._id || appointment.userId;
                                            const otherUserProfilePic = appointmentUserId === currentUserId 
                                              ? appointment.friendId?.profilePic 
                                              : appointment.userId?.profilePic;
                                            return otherUserProfilePic || '/default-profile.svg';
                                          })()
                                        }
                                        alt="User"
                                        className="w-full h-full object-cover"
                                        onError={(e) => { e.target.src = '/default-profile.svg'; }}
                                      />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                          <h3 className="font-medium text-base-content text-sm truncate">
                                            {(() => {
                                              const appointmentUserId = appointment.userId?._id || appointment.userId;
                                              const otherUser = appointmentUserId === currentUserId 
                                                ? appointment.friendId 
                                                : appointment.userId;
                                              return otherUser?.fullName || 'Unknown';
                                            })()}
                                          </h3>
                                          <p className="text-xs text-base-content/60 truncate line-clamp-1">
                                            {appointment.title || 'Appointment'}
                                          </p>
                                          {/* Attended badge moved to header right to keep uniform height */}
                                        </div>

                                        <div className="flex items-center gap-2 ml-2 flex-none">
                                          {appointment.status === 'completed' && (() => {
                                            const ratings = appointment.ratings || [];
                                            const appointmentUserId = appointment.userId?._id || appointment.userId;
                                            const appointmentFriendId = appointment.friendId?._id || appointment.friendId;
                                            const otherId = (appointmentUserId === currentUserId) ? appointmentFriendId : appointmentUserId;
                                            const otherRating = ratings.find(r => (r.userId?._id || r.userId) === (otherId) || (r.userId && r.userId.toString() === (otherId && otherId.toString())));
                                            return (
                                              <div
                                                className="flex items-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => {
                                                  if (otherRating) {
                                                    setViewingRating(otherRating);
                                                    setShowViewRatingModal(true);
                                                  }
                                                }}
                                                title={otherRating ? 'Click to view feedback' : 'No rating from other user'}
                                              >
                                                {Array.from({ length: 5 }).map((_, i) => {
                                                  const filled = otherRating ? i < (otherRating.rating || 0) : false;
                                                  return (
                                                    <Star key={i} className={`w-4 h-4 ${filled ? 'text-yellow-400' : 'text-gray-400'}`} strokeWidth={filled ? 0 : 1.2} fill={filled ? 'currentColor' : 'none'} />
                                                  );
                                                })}
                                              </div>
                                            );
                                          })()}
                                                  {(() => {
                                                    const appointmentUserId = appointment.userId?._id || appointment.userId;
                                                    const otherUser = appointmentUserId === currentUserId ? appointment.friendId : appointment.userId;
                                                    const availability = (otherUser?.availabilityStatus || '').toLowerCase();
                                                    const isCompleted = appointment.status === 'completed';
                                                    const attended = (appointment.attendedBy || []).map(String).includes(currentUserId);

                                                    if (availability === 'offline') {
                                                      return (
                                                        <div className={`badge badge-xs badge-neutral`}>
                                                          Offline
                                                        </div>
                                                      );
                                                    }

                                                    const badgeClass = isCompleted
                                                      ? (attended ? 'badge-primary' : 'badge-warning')
                                                      : getStatusBadgeColor(appointment.status);
                                                    const label = isCompleted
                                                      ? (attended ? 'Joined' : 'Missed')
                                                      : (appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Pending');
                                                    return (
                                                      <div className={`badge badge-xs ${badgeClass}`}>
                                                        {label}
                                                      </div>
                                                    );
                                                  })()}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Rating row moved into header right; no extra vertical space */}

                                <div className="flex flex-col gap-1 mb-2 text-xs text-base-content/70">
                                  <div className="flex items-center gap-2 font-semibold text-base-content">
                                    <Clock className="w-4 h-4 text-primary" />
                                    <span className="text-sm">{format(new Date(appointment.startTime), 'h:mm a')} - {format(typeof appointment.endTime === 'string' ? parseISO(appointment.endTime) : new Date(appointment.endTime), 'h:mm a')}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {getMeetingTypeIcon(appointment.meetingType)}
                                    <span>{appointment.meetingType || 'Video Call'}</span>
                                  </div>
                                  {appointment.location && appointment.meetingType?.toLowerCase() === 'in-person' && (
                                    <div className="flex items-center gap-2">
                                      <MapPin className="w-3 h-3" />
                                      <span className="truncate">{appointment.location}</span>
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1 mt-auto pt-2">
                                  <button
                                    onClick={() => setSelectedAppointment(appointment)}
                                    className="btn btn-primary btn-sm flex-1"
                                  >
                                    View Details
                                  </button>
                                  {appointment.status === 'completed' && (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); setRatingTarget(appointment); setRatingModalOpen(true); }}
                                      className="btn btn-secondary btn-sm"
                                    >
                                      Rate
                                    </button>
                                  )}
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleDeleteClick(appointment._id); }}
                                    className="btn btn-error btn-sm"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        onClose={() => {
          setShowConfirmDialog(false);
          setAppointmentToDelete(null);
        }}
        onConfirm={handleDeleteAppointment}
        title="Cancel Appointment"
        message="Are you sure you want to cancel this appointment? This action cannot be undone."
        confirmText="Yes, Cancel"
        cancelText="Keep Appointment"
        variant="danger"
      />

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
      <RatingModal
        isOpen={ratingModalOpen}
        onClose={() => { setRatingModalOpen(false); setRatingTarget(null); }}
        initialRating={ratingTarget ? (ratingTarget.ratings && ratingTarget.ratings.find(r => (r.userId?._id || r.userId) === currentUserId || (r.userId && r.userId.toString() === currentUserId))?.rating) || 0 : 0}
        initialFeedback={ratingTarget ? (ratingTarget.ratings && (ratingTarget.ratings.find(r => (r.userId?._id || r.userId) === currentUserId || (r.userId && r.userId.toString() === currentUserId))?.feedback)) : ''}
        isLoading={ratingMutation.isLoading}
        onSubmit={({ rating, feedback }) => {
          if (!ratingTarget) return;
          ratingMutation.mutate({ id: ratingTarget._id, rating, feedback });
        }}
      />

      {/* View Rating Modal (Read-Only) */}
      {showViewRatingModal && viewingRating && (
        <div className="modal modal-open">
          <div className="modal-box w-full max-w-md">
            <h3 className="font-bold text-lg mb-4">Feedback & Rating</h3>
            
            {/* Stars Display */}
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${i < (viewingRating.rating || 0) ? 'text-yellow-400' : 'text-gray-400'}`}
                  strokeWidth={i < (viewingRating.rating || 0) ? 0 : 1.2}
                  fill={i < (viewingRating.rating || 0) ? 'currentColor' : 'none'}
                />
              ))}
              <span className="ml-2 text-sm text-base-content/70">({viewingRating.rating || 0}/5)</span>
            </div>

            {/* Feedback Text */}
            {viewingRating.feedback ? (
              <div className="mb-4">
                <p className="text-sm font-semibold text-base-content/80 mb-2">Feedback:</p>
                <p className="text-sm text-base-content/70 bg-base-200 p-3 rounded-lg">{viewingRating.feedback}</p>
              </div>
            ) : (
              <p className="text-sm text-base-content/60 italic mb-4">No feedback provided</p>
            )}

            {/* Close Button */}
            <div className="modal-action">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowViewRatingModal(false);
                  setViewingRating(null);
                }}
              >
                Close
              </button>
            </div>
          </div>
          <form method="dialog" className="modal-backdrop" onClick={() => {
            setShowViewRatingModal(false);
            setViewingRating(null);
          }}>
            <button>close</button>
          </form>
        </div>
      )}
    </div>
  );
};

export default AppointmentsPage;
