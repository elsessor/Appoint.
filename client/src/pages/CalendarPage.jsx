import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Calendar from "../components/appointments/Calendar";
import { getMyFriends, getAuthUser, createAppointment, updateAppointment, deleteAppointment } from "../lib/api";
import PageLoader from "../components/PageLoader";
import { toast } from "react-hot-toast";

const CalendarPage = () => {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedFriendId, setSelectedFriendId] = useState('');
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  // Scheduling constraints / availability (can be moved to API or config later)
  const generalAvailability = {
    days: [1, 2, 3, 4, 5], // Monday to Friday
    start: '09:00',
    end: '17:00',
    slotDuration: 30, // minutes
    buffer: 15, // minutes buffer between appointments
    maxPerDay: 5
  };

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ["authUser"],
    queryFn: getAuthUser
  });

  // Get friends list
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getMyFriends
  });

  // Get appointments
  const { data: appointments = [], isLoading: loadingAppointments } = useQuery({
    queryKey: ["appointments"],
    queryFn: async () => {
      // Replace with your actual API call
      // const response = await fetchAppointments();
      // return response.data;
      return [];
    }
  });

  // Mutations
  const createAppointmentMutation = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment created successfully');
      setShowAppointmentModal(false);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to create appointment');
    }
  });

  const updateAppointmentMutation = useMutation({
    mutationFn: updateAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment updated successfully');
      setShowAppointmentModal(false);
      setSelectedAppointment(null);
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to update appointment');
    }
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: deleteAppointment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success('Appointment deleted successfully');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to delete appointment');
    }
  });

  const handleCreateAppointment = useCallback((appointmentData) => {
    createAppointmentMutation.mutate({
      ...appointmentData,
      userId: currentUser?._id,
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

  const handleCreateNewAppointment = (date, time) => {
    setSelectedDate(date || new Date());
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
  };

  const handleEditAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setSelectedDate(parseISO(appointment.startTime));
    setShowAppointmentModal(true);
  };

  // Filter today's appointments
  const todayAppointments = appointments.filter(appt => {
    const apptDate = typeof appt.startTime === 'string' 
      ? parseISO(appt.startTime)
      : new Date(appt.startTime);
    return format(apptDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  });

  if (loadingFriends || loadingAppointments) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-950 p-4 md:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-100">Appointment Calendar</h1>
          <div className="mt-4 md:mt-0">
          </div>
        </div>

        <div className="rounded-lg shadow-2xl overflow-hidden">
          <Calendar
            appointments={appointments}
            friends={friends}
            currentUser={currentUser}
            onAppointmentCreate={handleCreateAppointment}
            onAppointmentUpdate={handleUpdateAppointment}
            onAppointmentDelete={handleDeleteAppointment}
            availability={generalAvailability}
            onDateSelect={setSelectedDate}
            onAppointmentSelect={handleEditAppointment}
          />
        </div>

        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-100 mb-4">
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
                    className="p-4 bg-gray-800 border border-gray-700 rounded-lg hover:bg-gray-750 hover:shadow-lg transition-all cursor-pointer"
                    onClick={() => handleEditAppointment(appointment)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium text-gray-100">{appointment.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {format(startTime, 'h:mm a')}
                          {endTime && ` - ${format(endTime, 'h:mm a')}`}
                        </p>
                        {appointment.participant && (
                          <p className="text-sm text-gray-400 mt-1">
                            With: {appointment.participant.name || 'Friend'}
                          </p>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        appointment.status === 'confirmed' ? 'bg-green-900 text-green-200' :
                        appointment.status === 'cancelled' ? 'bg-red-900 text-red-200' :
                        'bg-blue-900 text-blue-200'
                      }`}>
                        {appointment.status || 'Scheduled'}
                      </span>
                    </div>
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

        {showAppointmentModal && (
          <AppointmentModal
            isOpen={showAppointmentModal}
            onClose={() => {
              setShowAppointmentModal(false);
              setSelectedAppointment(null);
            }}
            initialDate={selectedDate}
            initialTime={selectedAppointment ? 
              (typeof selectedAppointment.startTime === 'string' 
                ? parseISO(selectedAppointment.startTime) 
                : new Date(selectedAppointment.startTime)) 
              : null}
            friends={friends}
            currentUser={currentUser}
            availability={generalAvailability}
            appointment={selectedAppointment}
            onSubmit={selectedAppointment ? handleUpdateAppointment : handleCreateAppointment}
            onDelete={selectedAppointment ? 
              () => handleDeleteAppointment(selectedAppointment._id || selectedAppointment.id) 
              : null}
          />
        )}
      </div>
    </div>
  );
};

export default CalendarPage;
