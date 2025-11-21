import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Calendar from '../components/appointments/Calendar';
import { getMyFriends, getAuthUser, createAppointment, updateAppointment, deleteAppointment, getAppointments } from '../lib/api';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import { format, parseISO } from 'date-fns';

const AppointmentBookingPage = () => {
  const queryClient = useQueryClient();
  const [viewingFriendId, setViewingFriendId] = useState(null);

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

  // Callback handlers
  const handleCreateAppointment = useCallback((appointmentData) => {
    const userId = currentUser?._id || currentUser?.id;
    createAppointmentMutation.mutate({
      ...appointmentData,
      userId,
      status: 'scheduled'
    });
  }, [createAppointmentMutation, currentUser]);

  const handleUpdateAppointment = useCallback((appointmentData) => {
    updateAppointmentMutation.mutate(appointmentData);
  }, [updateAppointmentMutation]);

  const handleDeleteAppointment = useCallback((appointmentId) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      deleteAppointmentMutation.mutate(appointmentId);
    }
  }, [deleteAppointmentMutation]);

  // Filter today's appointments
  const todayAppointments = appointments.filter(appt => {
    const apptDate = typeof appt.startTime === 'string' 
      ? parseISO(appt.startTime)
      : new Date(appt.startTime);
    return format(apptDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  if (loadingFriends || loadingUser || loadingAppointments) {
    return <PageLoader />;
  }

  if (!currentUser || (!currentUser._id && !currentUser.id)) {
    console.warn('Current user data:', currentUser);
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center py-10">
          <p className="text-error text-lg font-semibold">You must be logged in to book an appointment.</p>
          <a href="/login" className="text-blue-400 hover:text-blue-300 mt-4 inline-block">
            Go to Login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-100">Book Appointment</h1>
            <p className="text-gray-400 mt-1">View your schedule and book appointments with friends</p>
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
          <h2 className="text-xl font-semibold text-gray-100 mb-4">
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
                
                return (
                  <div 
                    key={appointment._id || appointment.id} 
                    className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:shadow-lg transition-all"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-medium text-gray-100">{appointment.title || 'Untitled'}</h3>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-900 text-green-200' :
                        appointment.status === 'cancelled' ? 'bg-red-900 text-red-200' :
                        'bg-blue-900 text-blue-200'
                      }`}>
                        {appointment.status || 'Scheduled'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-400 mb-2">
                      {format(startTime, 'h:mm a')}
                      {endTime && ` - ${format(endTime, 'h:mm a')}`}
                    </p>
                    {appointment.participant && (
                      <p className="text-sm text-gray-400">
                        With: {appointment.participant.name || 'Friend'}
                      </p>
                    )}
                    {appointment.message && (
                      <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                        {appointment.message}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 bg-gray-900 rounded-lg border border-gray-800">
              <p className="text-gray-400">No appointments scheduled for today</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AppointmentBookingPage;
