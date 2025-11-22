import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Calendar from '../components/appointments/Calendar';
import AppointmentRequestModal from '../components/appointments/AppointmentRequestModal';
import ThemeSelector from '../components/ThemeSelector';
import { getMyFriends, getAuthUser, createAppointment, updateAppointment, deleteAppointment, getAppointments } from '../lib/api';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';
import { useThemeStore } from '../store/useThemeStore';

const AppointmentBookingPage = () => {
  const { theme } = useThemeStore();
  const queryClient = useQueryClient();
  const [viewingFriendId, setViewingFriendId] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);

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

      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-base-content">Book Appointment</h1>
            <p className="text-base-content/60 mt-1">View your schedule and book appointments with friends</p>
          </div>
          <div>
            <ThemeSelector />
          </div>
        </div>

        {/* Calendar Component */}
        <div className="rounded-lg shadow-2xl overflow-hidden mb-8">
          <Calendar
            appointments={appointments}
            friends={friends}
            currentUser={currentUser}
            onAppointmentCreate={handleCreateAppointment}
            onAppointmentUpdate={handleUpdateAppointment}
            onAppointmentDelete={handleDeleteAppointment}
            availability={availability}
            viewingFriendId={viewingFriendId}
            onViewingFriendChange={setViewingFriendId}
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
                      <h3 className="font-medium text-base-content">{appointment.title || 'Untitled'}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium badge ${
                        statusColors[appointment.status] || statusColors.scheduled
                      }`}>
                        {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Scheduled'}
                      </span>
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
