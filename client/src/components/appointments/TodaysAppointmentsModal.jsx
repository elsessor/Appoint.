import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isToday } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  X,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  Edit,
  Trash2,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

const TodaysAppointmentsModal = ({
  isOpen,
  onClose,
  appointments = [],
  currentUser,
  onEditAppointment,
  onDeleteAppointment,
  onNewAppointment,
}) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [meetingNotes, setMeetingNotes] = useState('');

  // Hide page scrollbar when modal is open
  React.useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
    }

    return () => {
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Check if current user is a participant in an appointment
  const isUserParticipant = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const userId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    return userId === currentUserId || friendId === currentUserId;
  };

  // Filter today's appointments to only show those where user is a participant
  const todaysAppointments = appointments.filter(apt => 
    isToday(typeof apt.startTime === 'string' ? parseISO(apt.startTime) : new Date(apt.startTime)) &&
    isUserParticipant(apt)
  );

  const handleSelectAppointment = (appointment) => {
    setSelectedAppointment(appointment);
    setMeetingNotes('');
  };

  const getOtherUser = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentUserId = appointment.userId?._id || appointment.userId;
    return appointmentUserId === currentUserId ? appointment.friendId : appointment.userId;
  };

  if (selectedAppointment) {
    // Detail View
    const appointmentDate = typeof selectedAppointment.startTime === 'string'
      ? parseISO(selectedAppointment.startTime)
      : new Date(selectedAppointment.startTime);

    const appointmentTime = format(appointmentDate, 'h:mm a');
    const appointmentDateStr = format(appointmentDate, 'MMMM dd, yyyy');
    const professional = getOtherUser(selectedAppointment);

    // Check if user is the receiver (only they can view details and access calls)
    const currentUserId = currentUser?._id || currentUser?.id;
    const appointmentFriendId = selectedAppointment.friendId?._id || selectedAppointment.friendId;
    const isReceiver = appointmentFriendId === currentUserId;

    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" data-theme={theme}>
        <div className="flex items-center justify-end min-h-screen">
          {/* Backdrop - click to close */}
          <div 
            className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
            onClick={() => setSelectedAppointment(null)}
            aria-hidden="true"
          ></div>

          {/* Side Panel */}
          <div className="relative z-50 h-screen w-full max-w-2xl bg-base-100 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="bg-base-200 border-b border-base-300 sticky top-0 z-10">
              <div className="px-3 sm:px-6 py-3 sm:py-6">
                <div className="flex items-center justify-between gap-2 sm:gap-0">
                  <div className="flex items-center gap-2 sm:gap-4 flex-1">
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      className="p-1.5 sm:p-2 hover:bg-base-300 rounded-lg transition flex-shrink-0"
                    >
                      <X className="w-4 sm:w-5 h-4 sm:h-5 text-base-content/70" />
                    </button>
                    {professional && (
                      <div className="w-8 sm:w-12 h-8 sm:h-12 rounded-full overflow-hidden flex-shrink-0">
                        <img
                          src={(professional.profilePic && professional.profilePic.trim()) ? professional.profilePic : '/default-profile.svg'}
                          alt={professional.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-profile.svg';
                          }}
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h1 className="text-base sm:text-xl font-bold text-base-content truncate">{selectedAppointment.title || 'Appointment'}</h1>
                      <p className="text-xs sm:text-sm text-base-content/60 mt-0.5 sm:mt-1">{format(appointmentDate, 'MMM d')} at {appointmentTime}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEditAppointment?.(selectedAppointment)}
                      className="flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 btn btn-outline btn-sm text-xs sm:text-sm"
                    >
                      <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="hidden sm:inline">Reschedule</span>
                      <span className="sm:hidden">Edit</span>
                    </button>
                    <button
                      onClick={() => {
                        onDeleteAppointment?.(selectedAppointment._id);
                        setSelectedAppointment(null);
                      }}
                      className="flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 btn btn-outline btn-error btn-sm text-xs sm:text-sm"
                    >
                      <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="hidden sm:inline">Cancel</span>
                      <span className="sm:hidden">X</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-3 sm:px-6 py-4 sm:py-8">
              <div className="space-y-3 sm:space-y-6">
                {/* Status Card */}
                <div className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-6">
                  <div className="flex items-center justify-between mb-3 sm:mb-6 gap-2">
                    <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold gap-1 sm:gap-2 flex-shrink-0 ${
                      selectedAppointment.status === 'confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : selectedAppointment.status === 'declined'
                        ? 'bg-red-100 text-red-700'
                        : selectedAppointment.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-700'
                        : selectedAppointment.status === 'completed'
                        ? 'bg-gray-200 text-gray-700'
                        : selectedAppointment.status === 'cancelled'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      <CheckCircle2 className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="hidden sm:inline">{selectedAppointment.status === 'scheduled' ? 'Confirmed' : selectedAppointment.status?.charAt(0).toUpperCase() + selectedAppointment.status?.slice(1)}</span>
                      <span className="sm:hidden">{selectedAppointment.status?.charAt(0).toUpperCase()}</span>
                    </span>
                    <span className="text-base-content/60 text-xs sm:text-sm truncate">ID: #{selectedAppointment._id?.slice(-6) || 'N/A'}</span>
                  </div>

                  {/* Decline Reason */}
                  {selectedAppointment.status === 'declined' && selectedAppointment.declinedReason && (
                    <div className="mb-3 sm:mb-6 p-2 sm:p-4 bg-error/10 border border-error/30 rounded-lg flex gap-2 sm:gap-3">
                      <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-error flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-error mb-0.5 sm:mb-1 text-xs sm:text-base">Appointment Declined</p>
                        <p className="text-xs sm:text-sm text-error/80 line-clamp-2">{selectedAppointment.declinedReason}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-6">
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-base-200 rounded-lg">
                      <Calendar className="w-8 sm:w-10 h-8 sm:h-10 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-base-content/60 text-xs sm:text-sm">Date</p>
                        <p className="text-base-content font-medium text-xs sm:text-sm">{format(appointmentDate, 'MMM d')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-base-200 rounded-lg">
                      <Clock className="w-8 sm:w-10 h-8 sm:h-10 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-base-content/60 text-xs sm:text-sm">Time</p>
                        <p className="text-base-content font-medium text-xs sm:text-sm">{appointmentTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-base-200 rounded-lg">
                      <Video className="w-8 sm:w-10 h-8 sm:h-10 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-base-content/60 text-xs sm:text-sm">Type</p>
                        <p className="text-base-content font-medium text-xs sm:text-sm truncate">{selectedAppointment.meetingType || 'Video Call'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-base-200 rounded-lg">
                      <Clock className="w-8 sm:w-10 h-8 sm:h-10 text-primary flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-base-content/60 text-xs sm:text-sm">Duration</p>
                        <p className="text-base-content font-medium text-xs sm:text-sm">{selectedAppointment.duration || 30}m</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-base-300 my-2 sm:my-6" />

                  {selectedAppointment.title && (
                    <>
                      <div className="mb-3 sm:mb-6">
                        <h4 className="text-base-content font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Subject</h4>
                        <p className="text-base-content/70 text-xs sm:text-sm line-clamp-3">{selectedAppointment.title}</p>
                      </div>
                      <hr className="border-base-300 my-2 sm:my-6" />
                    </>
                  )}

                  {selectedAppointment.description && (
                    <div>
                      <h4 className="text-base-content font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Notes</h4>
                      <p className="text-base-content/70 text-xs sm:text-sm line-clamp-3">{selectedAppointment.description}</p>
                    </div>
                  )}
                </div>

                {/* Booking Details */}
                {selectedAppointment.bookedBy && (
                  <div className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-base-content mb-2 sm:mb-4">Booking Info</h3>
                    <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                      <div>
                        <p className="text-base-content/60 mb-0.5 sm:mb-1">Name</p>
                        <p className="text-base-content truncate">
                          {selectedAppointment.bookedBy.firstName} {selectedAppointment.bookedBy.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-base-content/60 mb-0.5 sm:mb-1">Email</p>
                        <p className="text-base-content break-all text-xs sm:text-sm">{selectedAppointment.bookedBy.email}</p>
                      </div>
                      {selectedAppointment.bookedBy.phoneNumber && (
                        <div>
                          <p className="text-base-content/60 mb-0.5 sm:mb-1">Phone</p>
                          <p className="text-base-content">{selectedAppointment.bookedBy.phoneNumber}</p>
                        </div>
                      )}
                      {selectedAppointment.bookedBy.notes && (
                        <div>
                          <p className="text-base-content/60 mb-0.5 sm:mb-1">Notes</p>
                          <p className="text-base-content line-clamp-2">{selectedAppointment.bookedBy.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Card */}
                {professional && (
                  <div className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-6">
                    <h3 className="text-base sm:text-lg font-semibold text-base-content mb-3 sm:mb-4">Contact</h3>
                    <div className="flex flex-col items-center text-center mb-3 sm:mb-6">
                      <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full overflow-hidden mb-2 sm:mb-3">
                        <img
                          src={(professional.profilePic && professional.profilePic.trim()) ? professional.profilePic : '/default-profile.svg'}
                          alt={professional.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-profile.svg';
                          }}
                        />
                      </div>
                      <h4 className="text-base-content font-semibold mb-0.5 sm:mb-1 text-sm sm:text-base truncate">{professional.fullName}</h4>
                      <p className="text-base-content/60 text-xs sm:text-sm">{professional.learningLanguage || 'Friend'}</p>
                    </div>

                    <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-6">
                      {professional.email && (
                        <div className="flex items-center gap-2 sm:gap-3 text-base-content/70 text-xs sm:text-sm">
                          <Mail className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                          <span className="break-all">{professional.email}</span>
                        </div>
                      )}
                      {professional.phoneNumber && (
                        <div className="flex items-center gap-2 sm:gap-3 text-base-content/70 text-xs sm:text-sm">
                          <Phone className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                          <span>{professional.phoneNumber}</span>
                        </div>
                      )}
                      {professional.location && (
                        <div className="flex items-center gap-2 sm:gap-3 text-base-content/70 text-xs sm:text-sm">
                          <MapPin className="w-3 sm:w-4 h-3 sm:h-4 flex-shrink-0" />
                          <span className="truncate">{professional.location}</span>
                        </div>
                      )}
                    </div>

                    <hr className="border-base-300 my-2 sm:my-4" />

                    <div className="space-y-2 sm:space-y-2">
                      <button 
                        onClick={() => navigate(`/call/${selectedAppointment._id}`)}
                        disabled={!isReceiver}
                        className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 btn btn-primary btn-sm text-xs sm:text-sm ${!isReceiver ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!isReceiver ? 'Only the appointment receiver can join' : 'Join video call'}
                      >
                        <Video className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="hidden sm:inline">Join Video Call</span>
                        <span className="sm:hidden">Join Call</span>
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${professional._id}`)}
                        disabled={!isReceiver}
                        className={`w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 btn btn-outline btn-sm text-xs sm:text-sm ${!isReceiver ? 'opacity-50 cursor-not-allowed' : ''}`}
                        title={!isReceiver ? 'Only the appointment receiver can message' : 'Send message'}
                      >
                        <MessageSquare className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="hidden sm:inline">Send Message</span>
                        <span className="sm:hidden">Message</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-base-content mb-2 sm:mb-4">Quick Info</h3>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-base-content/60 mb-0.5 sm:mb-1">Created</p>
                      <p className="text-base-content">
                        {selectedAppointment.createdAt ? format(new Date(selectedAppointment.createdAt), 'MMM d') : 'N/A'}
                      </p>
                    </div>
                    <hr className="border-base-300" />
                    <div>
                      <p className="text-base-content/60 mb-0.5 sm:mb-1">Status</p>
                      <p className="text-base-content capitalize">{selectedAppointment.status}</p>
                    </div>
                    <hr className="border-base-300" />
                    <div>
                      <p className="text-base-content/60 mb-0.5 sm:mb-1">Reminder</p>
                      <p className="text-base-content">
                        {selectedAppointment.reminder === 1440 ? '1 day' :
                         selectedAppointment.reminder === 120 ? '2 hours' :
                         selectedAppointment.reminder === 60 ? '1 hour' :
                         selectedAppointment.reminder ? `${selectedAppointment.reminder}m` :
                         'None'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meeting Notes */}
                <div className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-6 mb-4 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-semibold text-base-content mb-2 sm:mb-4">Meeting Minutes</h3>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Add notes during or after the meeting..."
                    className="w-full p-2 sm:p-3 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary textarea textarea-bordered resize-none text-xs sm:text-sm"
                    rows="4"
                  />
                  <button className="mt-2 sm:mt-4 px-3 sm:px-4 py-1.5 sm:py-2 btn btn-primary btn-sm text-xs sm:text-sm">
                    Save Minutes
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List View
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50" data-theme={theme}>
      <div className="flex items-center justify-center min-h-screen pt-2 sm:pt-4 px-2 sm:px-4 pb-10 sm:pb-20">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal */}
        <div className="relative z-50 w-full max-w-2xl bg-base-100 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="bg-base-200 border-b border-base-300 px-4 sm:px-8 py-3 sm:py-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-base-content">
                <span className="hidden sm:inline">Today's Appointments</span>
                <span className="sm:hidden">Today</span>
              </h2>
              <p className="text-xs sm:text-sm text-base-content/60 mt-0.5 sm:mt-1">
                {format(new Date(), 'EEE, MMM d')} • {todaysAppointments.length} appointment{todaysAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 hover:bg-base-300 rounded-lg transition flex-shrink-0"
            >
              <X className="w-4 sm:w-6 h-4 sm:h-6 text-base-content/70" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {todaysAppointments.length === 0 ? (
              <div className="p-4 sm:p-8 text-center">
                <Calendar className="mx-auto h-10 sm:h-12 w-10 sm:w-12 text-base-content/40 mb-2 sm:mb-4" />
                <p className="text-base-content font-semibold text-sm sm:text-base">No appointments today</p>
                <p className="text-base-content/60 text-xs sm:text-sm mt-0.5 sm:mt-1">
                  You're all set for today!
                </p>
              </div>
            ) : (
              <div className="p-3 sm:p-6 space-y-2 sm:space-y-3">
                {todaysAppointments.map((appointment) => {
                  const aptDate = typeof appointment.startTime === 'string'
                    ? parseISO(appointment.startTime)
                    : new Date(appointment.startTime);
                  const aptTime = format(aptDate, 'h:mm a');
                  const otherUser = getOtherUser(appointment);

                  return (
                    <button
                      key={appointment._id}
                      onClick={() => handleSelectAppointment(appointment)}
                      className="w-full text-left p-2 sm:p-4 rounded-lg border border-base-300 hover:border-primary/50 hover:bg-base-100/50 transition group"
                    >
                      <div className="flex items-start justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-xs sm:text-base text-base-content group-hover:text-primary transition truncate">
                            {appointment.title || 'Untitled'}
                          </p>
                          <div className="flex items-center gap-1 sm:gap-2 mt-1 sm:mt-2 flex-wrap">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 sm:w-4 h-3 sm:h-4 text-base-content/60 flex-shrink-0" />
                              <span className="text-xs sm:text-sm text-base-content/70">{aptTime}</span>
                            </div>
                            {otherUser && (
                              <span className="text-xs sm:text-sm text-base-content/60 truncate">
                                with <span className="text-base-content font-semibold">{otherUser.fullName || otherUser.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`inline-flex items-center px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                          appointment.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                          appointment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          appointment.status === 'declined' ? 'bg-red-100 text-red-700' :
                          appointment.status === 'completed' ? 'bg-gray-200 text-gray-700' :
                          appointment.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1) || 'Scheduled'}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-base-100 border-t border-base-300 px-3 sm:px-8 py-2 sm:py-4 flex flex-col-reverse sm:flex-row gap-2 sm:gap-0 items-center sm:justify-between">
            <button
              onClick={onClose}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-lg transition text-sm sm:text-base"
            >
              Close
            </button>
            {onNewAppointment && (
              <button
                onClick={onNewAppointment}
                className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-green-400 hover:bg-green-500 text-green-950 font-semibold rounded-lg transition text-sm sm:text-base"
              >
                <span className="hidden sm:inline">New Appointment</span>
                <span className="sm:hidden">New</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

TodaysAppointmentsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  appointments: PropTypes.arrayOf(PropTypes.object),
  currentUser: PropTypes.object,
  onEditAppointment: PropTypes.func,
  onDeleteAppointment: PropTypes.func,
  onNewAppointment: PropTypes.func,
};

export default TodaysAppointmentsModal;
