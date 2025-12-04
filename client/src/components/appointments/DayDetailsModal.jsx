import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isToday, isBefore } from 'date-fns';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointmentDetail, setSelectedAppointmentDetail] = useState(null);

  // Hide page scrollbar and prevent interaction when modal is open
  React.useEffect(() => {
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = 'auto';
    };
  }, []);

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

  // Check if current user is a participant in an appointment
  const isUserParticipant = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const userId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    return userId === currentUserId || friendId === currentUserId;
  };

  // Filter appointments based on context:
  // - If viewing friend's calendar (viewingFriendId exists), show ALL their appointments
  // - Otherwise, show only appointments where current user is a participant
  // - Only show CONFIRMED appointments (hide pending, declined, cancelled, completed)
  const filteredAppointments = (viewingFriendId 
    ? appointments // Show all appointments when viewing friend's calendar
    : appointments.filter(isUserParticipant)
  ).filter(appt => appt.status === 'confirmed');

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { bg: 'bg-blue-500', text: 'text-white', label: 'Scheduled' },
      confirmed: { bg: 'bg-green-500', text: 'text-white', label: 'Confirmed' },
      cancelled: { bg: 'bg-red-500', text: 'text-white', label: 'Cancelled' },
      completed: { bg: 'bg-gray-500', text: 'text-white', label: 'Completed' },
      pending: { bg: 'bg-yellow-500', text: 'text-white', label: 'Pending' },
      declined: { bg: 'bg-red-500', text: 'text-white', label: 'Declined' },
    };
    
    const config = statusConfig[status?.toLowerCase()] || { bg: 'bg-gray-500', text: 'text-white', label: status || 'Scheduled' };
    
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  // Get card background color based on status
  const getStatusCardColor = (status) => {
    const statusCardMap = {
      scheduled: 'hover:bg-base-200/50 border-base-300/40',
      confirmed: 'hover:bg-base-200/50 border-base-300/40',
      completed: 'hover:bg-base-200/50 border-base-300/40',
      pending: 'hover:bg-base-200/50 border-base-300/40',
      cancelled: 'hover:bg-base-200/50 border-base-300/40',
      declined: 'hover:bg-base-200/50 border-base-300/40',
    };
    return statusCardMap[status?.toLowerCase()] || 'hover:bg-base-200/50 border-base-300/40';
  };

  const getAppointmentType = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentUserId = appointment.userId?._id || appointment.userId;
    
    // When viewing friend's calendar, check if current user is involved
    if (viewingFriendId) {
      const friendId = appointment.friendId?._id || appointment.friendId;
      if (appointmentUserId === currentUserId || friendId === currentUserId) {
        const isRequested = appointmentUserId === currentUserId;
        return isRequested ? 'Requested' : 'Received';
      }
      // Appointment between other people
      return 'Other';
    }
    
    const isRequested = appointmentUserId === currentUserId;
    return isRequested ? 'Requested' : 'Received';
  };

  const getOtherUser = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentUserId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    
    // When viewing friend's calendar and current user is not involved, show both participants
    if (viewingFriendId) {
      if (appointmentUserId !== currentUserId && friendId !== currentUserId) {
        // Return both participants for appointments between other people
        return {
          user: appointment.userId,
          friend: appointment.friendId,
          isBetweenOthers: true
        };
      }
    }
    
    return appointmentUserId === currentUserId ? appointment.friendId : appointment.userId;
  };

  const getAttendanceBadge = (appointment) => {
    if (!appointment || appointment.status !== 'completed') return null;
    const currentUserId = currentUser?._id || currentUser?.id;
    const attended = (appointment.attendedBy || []).map(String).includes(currentUserId);
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${attended ? 'bg-green-800 text-green-200' : 'bg-red-800 text-red-200'}`}>
        {attended ? 'Joined' : 'Missed'}
      </span>
    );
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
    
    // Close both the appointment modal and day details modal after submission
    setShowAppointmentModal(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      {/* Only show backdrop and modal if appointment modal and details view are not open */}
      {!showAppointmentModal && !selectedAppointmentDetail && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
          
          {/* Modal */}
          <div className="relative z-[61] bg-base-100 rounded-lg shadow-xl max-w-lg w-full sm:max-h-[90vh] max-h-[95vh] flex flex-col mx-2 sm:mx-4">
          <div className="bg-base-100 px-3 sm:px-6 pt-3 sm:pt-5 pb-2 sm:pb-4 border-b border-base-300/40">
            <div className="flex justify-between items-start gap-2">
              <div>
                <h3 className="text-base sm:text-lg leading-6 font-bold text-base-content">
                  {format(date, 'EEE, MMM d')}
                </h3>
                {isHoliday && (
                  <p className="mt-1 text-xs font-semibold text-warning uppercase tracking-wide">{isHoliday}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 sm:p-2 hover:bg-base-200 rounded-lg transition-all text-base-content/60 hover:text-base-content flex-shrink-0"
              >
                <X className="h-4 sm:h-5 w-4 sm:w-5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {appointments.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              <div className="bg-base-200/30 rounded-lg p-4 sm:p-8 space-y-3 sm:space-y-4">
                <Calendar className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-base-content/40" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-base-content">No appointments</h3>
                  <p className="mt-0.5 sm:mt-1 text-xs text-base-content/60">
                    You don't have any appointments scheduled for this day.
                  </p>
                </div>
                <div className="pt-2 sm:pt-4">
                  <button
                    type="button"
                    onClick={handleCreateAppointment}
                    className="inline-flex items-center px-3 sm:px-4 py-2 sm:py-2 bg-primary text-white font-semibold rounded-lg hover:bg-primary/90 transition-all text-xs sm:text-sm shadow-sm"
                  >
                    Schedule Appointment
                  </button>
                </div>
              </div>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-4 sm:p-8 text-center">
              <div className="bg-base-200/30 rounded-lg p-4 sm:p-8 space-y-3 sm:space-y-4">
                <Calendar className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-base-content/40" />
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-base-content">No accessible appointments</h3>
                  <p className="mt-0.5 sm:mt-1 text-xs text-base-content/60">
                    You don't have access to appointments on this day.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                {filteredAppointments
                  .map((appointment) => {
                  const appointmentType = getAppointmentType(appointment);
                  const otherUser = getOtherUser(appointment);
                  const isRequested = appointmentType === 'Requested';
                  const isOtherPeopleAppt = appointmentType === 'Other';

                  return (
                  <button
                    key={appointment._id || appointment.id}
                    onClick={() => setSelectedAppointmentDetail(appointment)}
                    className={`w-full text-left p-2 sm:p-4 rounded-lg transition border ${getStatusCardColor(appointment.status)} hover:border-primary/30 group`}
                  >
                    <div className="space-y-1.5 sm:space-y-2">
                      <div className="flex items-start justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold text-base-content truncate group-hover:text-primary transition-colors">
                            {appointment.title}
                          </p>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-1.5 flex-wrap">
                            {isOtherPeopleAppt ? (
                              // Show both participants for appointments between other people
                              <div className="flex items-center gap-1 text-xs text-base-content/60">
                                <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-base-content/50 flex-shrink-0" />
                                <span className="truncate">
                                  <span className="text-base-content font-semibold">{otherUser.user?.fullName || otherUser.user?.name}</span>
                                  <span className="mx-1">with</span>
                                  <span className="text-base-content font-semibold">{otherUser.friend?.fullName || otherUser.friend?.name}</span>
                                </span>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-1">
                                  {isRequested ? (
                                    <Send className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-primary flex-shrink-0" />
                                  ) : (
                                    <ArrowDown className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-warning flex-shrink-0" />
                                  )}
                                  <span className={`text-xs font-semibold px-1.5 sm:px-2 py-0.5 rounded-full ${
                                    isRequested 
                                      ? 'bg-primary/15 text-primary' 
                                      : 'bg-warning/15 text-warning'
                                  }`}>
                                    {appointmentType}
                                  </span>
                                </div>
                                {otherUser && !otherUser.isBetweenOthers && (
                                  <span className="text-xs text-base-content/60 truncate">
                                    with <span className="text-base-content font-semibold">{otherUser.fullName || otherUser.name}</span>
                                  </span>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {getStatusBadge(appointment.status)}
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-base-content/70">
                          <Clock className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-base-content/50 flex-shrink-0" />
                          <span className="truncate">
                            {formatTime(appointment.startTime)}
                            {appointment.endTime && (
                              <>
                                <span className="mx-0.5">-</span>
                                {formatTime(appointment.endTime)}
                                <span className="text-base-content/50 mx-0.5">•</span>
                                <span>{formatDuration(appointment.startTime, appointment.endTime)}</span>
                              </>
                            )}
                          </span>
                        </div>
                        {appointment.participant && (
                          <div className="flex items-center gap-1.5 text-xs text-base-content/70 truncate">
                            <User className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-base-content/50 flex-shrink-0" />
                            <span className="truncate">{appointment.participant.name || appointment.participant.email}</span>
                          </div>
                        )}
                      </div>
                      {appointment.message && (
                        <div className="flex items-start gap-1.5 text-xs text-base-content/70 pt-1 sm:pt-2 border-t border-base-300/30">
                          <MessageSquare className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-base-content/50 mt-0.5 flex-shrink-0" />
                          <p className="whitespace-pre-line line-clamp-2 text-xs">{appointment.message}</p>
                        </div>
                      )}
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          )}
          
          {filteredAppointments.length > 0 && (
            <div className="bg-base-100 border-t border-base-300/40 px-3 sm:px-6 py-2 sm:py-3 flex flex-col-reverse sm:flex-row-reverse gap-2 sm:gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCreateAppointment}
                className="flex-1 inline-flex justify-center rounded-lg border border-transparent shadow-sm px-3 sm:px-4 py-2 sm:py-2.5 bg-primary text-white text-xs sm:text-sm font-semibold hover:bg-primary/90 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
              >
                <span className="hidden sm:inline">New Appointment</span>
                <span className="sm:hidden">New</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 inline-flex justify-center rounded-lg border border-base-300/50 shadow-sm px-3 sm:px-4 py-2 sm:py-2.5 bg-base-200/50 text-base-content text-xs sm:text-sm font-semibold hover:bg-base-200 transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary/50"
              >
                Close
              </button>
            </div>
          )}
          </div>
        </>
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
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
      )}

      {/* Appointment Details Side Panel */}
      {selectedAppointmentDetail && (
        <AppointmentDetailsView
          appointment={selectedAppointmentDetail}
          currentUser={currentUser}
          onClose={() => setSelectedAppointmentDetail(null)}
          onDelete={() => setSelectedAppointmentDetail(null)}
          onEdit={() => {
            console.log('Edit appointment:', selectedAppointmentDetail._id);
          }}
        />
      )}
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