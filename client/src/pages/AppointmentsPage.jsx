import React, { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Video, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import { getAppointments, deleteAppointment, updateAppointment, getAuthUser } from '../lib/api';
import PageLoader from '../components/PageLoader';
import AppointmentDetailsView from '../components/appointments/AppointmentDetailsView';
import AppointmentRequestModal from '../components/appointments/AppointmentRequestModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ThemeSelector from '../components/ThemeSelector';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../store/useThemeStore';

const AppointmentsPage = () => {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, scheduled, pending, completed, cancelled
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

  // Fetch current user
  const { data: currentUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
    retry: 1,
  });

  // Fetch appointments
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
    staleTime: 1000 * 60 * 5, // 5 minutes
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

  // Separate incoming requests (pending OR scheduled appointments where current user is the recipient/friendId)
  // These are requests FROM others TO the user that need a response
  const incomingRequests = appointments.filter(apt => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentFriendId = apt.friendId?._id || apt.friendId;
    // Show appointments where:
    // 1. Status is 'pending' (newly created, waiting for response), OR
    // 2. Status is 'scheduled' (legacy - created before fix)
    // AND the current user is the recipient (friendId)
    return (apt.status === 'pending' || apt.status === 'scheduled') && appointmentFriendId === currentUserId;
  });
  
  // User's own appointments (created by them, excluding incoming requests)
  const userAppointments = appointments.filter(apt => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentUserId = apt.userId?._id || apt.userId;
    const appointmentFriendId = apt.friendId?._id || apt.friendId;
    // Show appointments created by the user, regardless of status
    // Exclude incoming requests (pending/scheduled where user is friendId)
    const isCreatedByUser = appointmentUserId === currentUserId;
    const isIncomingRequest = (apt.status === 'pending' || apt.status === 'scheduled') && appointmentFriendId === currentUserId;
    return isCreatedByUser && !isIncomingRequest;
  });

  // Debug logging
  useEffect(() => {
    if (appointments.length > 0) {
      console.log('Total appointments:', appointments.length);
      console.log('Incoming requests:', incomingRequests.length);
    }
  }, [appointments, currentUser, incomingRequests]);

  // Filter appointments based on status
  const filteredAppointments = filterStatus === 'all' 
    ? userAppointments
    : userAppointments.filter(apt => apt.status === filterStatus);

  // Handle delete appointment
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

  // Format appointment date and time
  const formatAppointmentDateTime = (appointment) => {
    const startTime = typeof appointment.startTime === 'string'
      ? parseISO(appointment.startTime)
      : new Date(appointment.startTime);
    return format(startTime, 'MMM dd, yyyy - h:mm a');
  };

  // Get status badge color
  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'scheduled':
        return 'badge-success';
      case 'pending':
        return 'badge-warning';
      case 'completed':
        return 'badge-info';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-neutral';
    }
  };

  // Get meeting type icon
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

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      {/* Incoming Requests Section - Prominent Position */}
      {incomingRequests.length > 0 && !selectedAppointment && (
        <div data-incoming-requests className="bg-gradient-to-r from-warning/20 to-info/20 border-b-2 border-warning sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-6 py-5">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-3xl">📬</div>
                <div>
                  <h2 className="text-lg font-bold text-base-content">
                    Incoming Appointment Requests
                  </h2>
                  <p className="text-sm text-base-content/70">
                    {incomingRequests.length} {incomingRequests.length === 1 ? 'request' : 'requests'} waiting for your response
                  </p>
                </div>
              </div>
            </div>
            
            {/* Requests Cards */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {incomingRequests.map((request) => {
                const requester = request.userId;
                return (
                  <div
                    key={request._id}
                    className="bg-base-100 border-2 border-warning rounded-lg p-4 hover:shadow-lg transition cursor-pointer group"
                    onClick={() => {
                      setSelectedRequest(request);
                      setShowRequestModal(true);
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Requester Avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                        {requester?.profilePic ? (
                          <img
                            src={requester.profilePic}
                            alt={requester.fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                            {(requester?.fullName || 'U')[0].toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base-content truncate">
                          {requester?.fullName || 'Someone'}
                        </h3>
                        <p className="text-xs text-base-content/60 truncate">
                          {request.title || 'Appointment'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-xs text-base-content/70 mb-3">
                      <Calendar className="w-3 h-3" />
                      <span>{formatAppointmentDateTime(request)}</span>
                    </div>
                    
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedRequest(request);
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
          </div>
        </div>
      )}

      {selectedAppointment ? (
        <AppointmentDetailsView
          appointment={selectedAppointment}
          onClose={() => setSelectedAppointment(null)}
          onDelete={() => handleDeleteClick(selectedAppointment._id)}
          onEdit={() => {
            // Handle edit
            console.log('Edit appointment:', selectedAppointment._id);
          }}
          onSendMessage={() => {
            console.log('Send message');
          }}
        />
      ) : (
        <>
          {/* Header */}
          <div className="bg-base-200 border-b border-base-300 sticky top-0 z-10">
            <div className="max-w-7xl mx-auto px-6 py-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-bold text-base-content">My Appointments</h1>
                  <p className="text-base-content/60 mt-1">View and manage all your scheduled appointments</p>
                </div>
                <div>
                  <ThemeSelector />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap items-center">
                {incomingRequests.length > 0 && (
                  <button
                    onClick={() => {
                      const incomingSection = document.querySelector('[data-incoming-requests]');
                      if (incomingSection) {
                        incomingSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }
                    }}
                    className="btn btn-warning btn-sm gap-1"
                  >
                    <span>📬</span>
                    <span>Incoming ({incomingRequests.length})</span>
                  </button>
                )}
                {[
                  { value: 'all', label: 'All', count: userAppointments.length },
                  { value: 'scheduled', label: 'Scheduled', count: userAppointments.filter(a => a.status === 'scheduled').length },
                  { value: 'confirmed', label: 'Confirmed', count: userAppointments.filter(a => a.status === 'confirmed').length },
                  { value: 'completed', label: 'Completed', count: userAppointments.filter(a => a.status === 'completed').length },
                  { value: 'cancelled', label: 'Cancelled', count: userAppointments.filter(a => a.status === 'cancelled').length },
                  { value: 'declined', label: 'Declined', count: userAppointments.filter(a => a.status === 'declined').length },
                ].map((tab) => (
                  <button
                    key={tab.value}
                    onClick={() => setFilterStatus(tab.value)}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      filterStatus === tab.value
                        ? 'btn btn-primary btn-sm'
                        : 'btn btn-outline btn-sm'
                    }`}
                  >
                    {tab.label} ({tab.count})
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* My Appointments List */}
          <div className="max-w-7xl mx-auto px-6 py-8">
            <h2 className="text-xl font-semibold text-base-content mb-6">My Appointments</h2>
            {filteredAppointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-16 h-16 text-base-content/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-base-content mb-2">No appointments found</h3>
                <p className="text-base-content/60">
                  {filterStatus === 'all'
                    ? 'You don\'t have any appointments yet. Start by booking one!'
                    : `You don't have any ${filterStatus} appointments.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredAppointments.map((appointment) => (
                  <div
                    key={appointment._id}
                    onClick={() => setSelectedAppointment(appointment)}
                    className="bg-base-100 border border-base-300 rounded-lg p-6 hover:shadow-lg transition cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start gap-4 flex-1">
                        {/* Professional Avatar */}
                        <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={
                              (appointment.userId?.profilePic || appointment.friendId?.profilePic) || '/default-profile.png'
                            }
                            alt="Professional"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = '/default-profile.png';
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-base-content">
                            {appointment.userId?.fullName || appointment.friendId?.fullName || 'Unknown'}
                          </h3>
                          <p className="text-sm text-base-content/60 mb-2">
                            {appointment.title || 'Appointment'}
                          </p>

                          <div className="flex flex-wrap gap-4 text-sm text-base-content/70">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {formatAppointmentDateTime(appointment)}
                            </div>
                            <div className="flex items-center gap-1">
                              {getMeetingTypeIcon(appointment.meetingType)}
                              {appointment.meetingType || 'Video Call'}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div
                          className={`badge ${getStatusBadgeColor(appointment.status)}`}
                        >
                          {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Pending'}
                        </div>
                      </div>
                    </div>

                    {appointment.description && (
                      <div className="px-0 py-2 mb-3 border-t border-base-300 pt-3">
                        <p className="text-sm text-base-content/70">{appointment.description}</p>
                      </div>
                    )}

                    <div className="flex gap-2 pt-3 border-t border-base-300">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toast.info('Edit feature coming soon');
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium btn btn-ghost btn-sm"
                      >
                        <Edit className="w-4 h-4" />
                        Reschedule
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteClick(appointment._id);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium btn btn-ghost btn-error btn-sm"
                      >
                        <Trash2 className="w-4 h-4" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
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
    </div>
  );
};

export default AppointmentsPage;
