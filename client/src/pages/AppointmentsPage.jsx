import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Video, Phone, MapPin, Trash2, Edit } from 'lucide-react';
import { getAppointments, deleteAppointment } from '../lib/api';
import PageLoader from '../components/PageLoader';
import AppointmentDetailsView from '../components/appointments/AppointmentDetailsView';
import ConfirmDialog from '../components/ConfirmDialog';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../store/useThemeStore';

const AppointmentsPage = () => {
  const { theme } = useThemeStore();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all'); // all, scheduled, pending, completed, cancelled
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState(null);

  // Fetch appointments
  const { data: appointments = [], isLoading, refetch } = useQuery({
    queryKey: ['appointments'],
    queryFn: getAppointments,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Filter appointments
  const filteredAppointments = filterStatus === 'all' 
    ? appointments 
    : appointments.filter(apt => apt.status === filterStatus);

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
              </div>

              {/* Filter Tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { value: 'all', label: 'All', count: appointments.length },
                  { value: 'scheduled', label: 'Scheduled', count: appointments.filter(a => a.status === 'scheduled').length },
                  { value: 'pending', label: 'Pending', count: appointments.filter(a => a.status === 'pending').length },
                  { value: 'completed', label: 'Completed', count: appointments.filter(a => a.status === 'completed').length },
                  { value: 'cancelled', label: 'Cancelled', count: appointments.filter(a => a.status === 'cancelled').length },
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

          {/* Appointments List */}
          <div className="max-w-7xl mx-auto px-6 py-8">
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
                          // Handle edit
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
    </div>
  );
};

export default AppointmentsPage;
