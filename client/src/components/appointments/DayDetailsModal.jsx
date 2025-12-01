import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isToday, isBefore } from 'date-fns';
import { Clock, User, MessageSquare, Calendar, X, Send, ArrowDown } from 'lucide-react';
import AppointmentModal from './AppointmentModal';
import AppointmentDetailsView from './AppointmentDetailsView';

const DayDetailsModal = ({
  date,
  appointments = [],
  onClose,
  onCreateAppointment,
  isHoliday,
  currentUser,
  friends = [],
  availability = {},
  onAppointmentSubmit,
  friendsAvailability = {},
  viewingFriendId = null,
}) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState(null);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return '';
    try {
      const startDate = typeof start === 'string' ? parseISO(start) : start;
      const endDate = typeof end === 'string' ? parseISO(end) : end;
      const diffInMinutes = Math.round((endDate - startDate) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes} min`;
      }
      
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } catch (e) {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { bg: 'bg-info/15', text: 'text-info', label: 'Scheduled' },
      confirmed: { bg: 'bg-success/15', text: 'text-success', label: 'Confirmed' },
      cancelled: { bg: 'bg-error/15', text: 'text-error', label: 'Cancelled' },
      completed: { bg: 'bg-base-300/30', text: 'text-base-content', label: 'Completed' },
      pending: { bg: 'bg-warning/15', text: 'text-warning', label: 'Pending' },
      declined: { bg: 'bg-error/15', text: 'text-error', label: 'Declined' },
    };
    
    const config = statusConfig[status?.toLowerCase()] || { bg: 'bg-base-300/30', text: 'text-base-content', label: status || 'Scheduled' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getAppointmentType = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentUserId = appointment.userId?._id || appointment.userId;
    const isRequested = appointmentUserId === currentUserId;
    return isRequested ? 'Requested' : 'Received';
  };

  const getOtherUser = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentUserId = appointment.userId?._id || appointment.userId;
    return appointmentUserId === currentUserId ? appointment.friendId : appointment.userId;
  };

  const handleCreateAppointment = () => {
    setShowAppointmentModal(true);
  };

  const handleAppointmentModalClose = () => {
    setShowAppointmentModal(false);
  };

  const handleAppointmentSubmit = (formData) => {
    // Call the same handler as in Calendar/AppointmentBookingPage
    if (onCreateAppointment) {
      onCreateAppointment(formData);
    }
    
    // Close the appointment modal after submission
    setShowAppointmentModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-base-100 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-base-100 px-6 pt-5 pb-4 sm:p-6 sm:pb-4 border-b border-base-300/40">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg leading-6 font-bold text-base-content">
                  {format(date, 'EEEE, MMMM d')}
                </h3>
                {isHoliday && (
                  <p className="mt-1.5 text-xs font-semibold text-warning uppercase tracking-wide">{isHoliday}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-base-200 rounded-lg transition-all text-base-content/60 hover:text-base-content flex-shrink-0"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="p-8 text-center">
              <div className="bg-base-200/30 rounded-lg p-8 space-y-4">
                <Calendar className="mx-auto h-12 w-12 text-base-content/40" />
                <div>
                  <h3 className="text-sm font-bold text-base-content">No appointments</h3>
                  <p className="mt-1 text-xs text-base-content/60">
                    You don't have any appointments scheduled for this day.
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    type="button"
                    onClick={handleCreateAppointment}
                    className="inline-flex items-center px-4 py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all text-sm shadow-sm"
                  >
                    Schedule Appointment
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <div className="space-y-3">
                {appointments.map((appointment) => {
                  const appointmentType = getAppointmentType(appointment);
                  const otherUser = getOtherUser(appointment);
                  const isRequested = appointmentType === 'Requested';

                  return (
                  <button
                    key={appointment._id || appointment.id}
                    onClick={() => setSelectedAppointmentDetail(appointment)}
                    className="w-full text-left hover:bg-base-200/50 p-4 rounded-lg transition border border-base-300/40 hover:border-primary/30 group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-base-content truncate group-hover:text-primary transition-colors">
                            {appointment.title}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              {isRequested ? (
                                <Send className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              ) : (
                                <ArrowDown className="w-3.5 h-3.5 text-warning flex-shrink-0" />
                              )}
                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                isRequested 
                                  ? 'bg-primary/15 text-primary' 
                                  : 'bg-warning/15 text-warning'
                              }`}>
                                {appointmentType}
                              </span>
                            </div>
                            {otherUser && (
                              <span className="text-xs text-base-content/60">
                                with <span className="text-base-content font-semibold">{otherUser.fullName || otherUser.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(appointment.status)}
                      </div>
                      
                      <div className="flex flex-col gap-1.5">
                        <div className="flex items-center gap-2 text-xs text-base-content/70">
                          <Clock className="w-3.5 h-3.5 text-base-content/50 flex-shrink-0" />
                          <span>
                            {formatTime(appointment.startTime)}
                            {appointment.endTime && (
                              <>
                                <span className="mx-1">-</span>
                                {formatTime(appointment.endTime)}
                                <span className="text-base-content/50 mx-1">•</span>
                                <span>{formatDuration(appointment.startTime, appointment.endTime)}</span>
                              </>
                            )}
                          </span>
                        </div>
                        {appointment.participant && (
                          <div className="flex items-center gap-2 text-xs text-base-content/70">
                            <User className="w-3.5 h-3.5 text-base-content/50 flex-shrink-0" />
                            {appointment.participant.name || appointment.participant.email}
                          </div>
                        )}
                      </div>
                      {appointment.message && (
                        <div className="flex items-start gap-2 text-xs text-base-content/70 pt-2 border-t border-base-300/30">
                          <MessageSquare className="w-3.5 h-3.5 text-base-content/50 mt-0.5 flex-shrink-0" />
                          <p className="whitespace-pre-line line-clamp-2">{appointment.message}</p>
                        </div>
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {appointments.length > 0 && (
            <div className="bg-base-100 border-t border-base-300/40 px-6 py-3 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="button"
                onClick={handleCreateAppointment}
                className="flex-1 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-4 py-2.5 bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
              >
                New Appointment
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 inline-flex justify-center rounded-lg border border-base-300/50 shadow-sm px-4 py-2.5 bg-base-200/50 text-base-content text-sm font-semibold hover:bg-base-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Show appointment details when an appointment is clicked */}
      {selectedAppointmentDetail && (
        <AppointmentDetailsView
          appointment={selectedAppointmentDetail}
          currentUser={currentUser}
          onClose={() => setSelectedAppointmentDetail(null)}
          onDelete={() => {
            setSelectedAppointmentDetail(null);
            // Optionally trigger a delete handler here if needed
          }}
          onEdit={() => {
            // Handle edit
            console.log('Edit appointment:', selectedAppointmentDetail._id);
          }}
        />
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={handleAppointmentModalClose}
        onSubmit={handleAppointmentSubmit}
        initialDate={date}
        initialTime={undefined}
        initialFriendId={viewingFriendId}
        friends={friends}
        currentUser={currentUser}
        appointments={appointments}
        availability={availability}
        friendsAvailability={friendsAvailability}
        currentUserStatus={currentUser?.availabilityStatus || 'available'}
      />
    </div>
  );
};

DayDetailsModal.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      status: PropTypes.string,
      message: PropTypes.string,
      participant: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
      }),
    })
  ),
  onClose: PropTypes.func.isRequired,
  onCreateAppointment: PropTypes.func,
  onAppointmentSubmit: PropTypes.func,
  isHoliday: PropTypes.string,
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    availabilityStatus: PropTypes.string,
  }),
  friends: PropTypes.arrayOf(PropTypes.object),
  availability: PropTypes.object,
  friendsAvailability: PropTypes.object,
  viewingFriendId: PropTypes.string,
};

export default DayDetailsModal;