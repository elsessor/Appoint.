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

  // Filter today's appointments
  const todaysAppointments = appointments.filter(apt => 
    isToday(typeof apt.startTime === 'string' ? parseISO(apt.startTime) : new Date(apt.startTime))
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
              <div className="px-6 py-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => setSelectedAppointment(null)}
                      className="p-2 hover:bg-base-300 rounded-lg transition flex-shrink-0"
                    >
                      <X className="w-5 h-5 text-base-content/70" />
                    </button>
                    {professional && (
                      <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0">
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
                      <h1 className="text-xl font-bold text-base-content truncate">{selectedAppointment.title || 'Appointment'}</h1>
                      <p className="text-sm text-base-content/60 mt-1">{appointmentDateStr} at {appointmentTime}</p>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => onEditAppointment?.(selectedAppointment)}
                      className="flex items-center gap-2 px-4 py-2 btn btn-outline btn-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Reschedule
                    </button>
                    <button
                      onClick={() => {
                        onDeleteAppointment?.(selectedAppointment._id);
                        setSelectedAppointment(null);
                      }}
                      className="flex items-center gap-2 px-4 py-2 btn btn-outline btn-error btn-sm"
                    >
                      <Trash2 className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-8">
              <div className="space-y-6">
                {/* Status Card */}
                <div className="bg-base-100 border border-base-300 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-6">
                    <span className={`inline-flex items-center gap-2 px-3 py-1 badge gap-2 ${
                      selectedAppointment.status === 'confirmed' 
                        ? 'badge-success' 
                        : selectedAppointment.status === 'declined'
                        ? 'badge-error'
                        : selectedAppointment.status === 'pending'
                        ? 'badge-warning'
                        : 'badge-info'
                    }`}>
                      <CheckCircle2 className="w-4 h-4" />
                      {selectedAppointment.status === 'scheduled' ? 'Confirmed' : selectedAppointment.status?.charAt(0).toUpperCase() + selectedAppointment.status?.slice(1)}
                    </span>
                    <span className="text-base-content/60 text-sm">Appointment ID: #{selectedAppointment._id?.slice(-6) || 'N/A'}</span>
                  </div>

                  {/* Decline Reason */}
                  {selectedAppointment.status === 'declined' && selectedAppointment.declinedReason && (
                    <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex gap-3">
                      <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold text-error mb-1">Appointment Declined</p>
                        <p className="text-sm text-error/80">{selectedAppointment.declinedReason}</p>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <Calendar className="w-10 h-10 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-base-content/60 text-sm">Date</p>
                        <p className="text-base-content font-medium text-sm">{appointmentDateStr}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <Clock className="w-10 h-10 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-base-content/60 text-sm">Time</p>
                        <p className="text-base-content font-medium text-sm">{appointmentTime}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <Video className="w-10 h-10 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-base-content/60 text-sm">Type</p>
                        <p className="text-base-content font-medium text-sm">{selectedAppointment.meetingType || 'Video Call'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                      <Clock className="w-10 h-10 text-primary flex-shrink-0" />
                      <div>
                        <p className="text-base-content/60 text-sm">Duration</p>
                        <p className="text-base-content font-medium text-sm">{selectedAppointment.duration || 30} minutes</p>
                      </div>
                    </div>
                  </div>

                  <hr className="border-base-300 my-6" />

                  {selectedAppointment.title && (
                    <>
                      <div className="mb-6">
                        <h4 className="text-base-content font-semibold mb-2">Subject</h4>
                        <p className="text-base-content/70 text-sm">{selectedAppointment.title}</p>
                      </div>
                      <hr className="border-base-300 my-6" />
                    </>
                  )}

                  {selectedAppointment.description && (
                    <div>
                      <h4 className="text-base-content font-semibold mb-2">Notes</h4>
                      <p className="text-base-content/70 text-sm">{selectedAppointment.description}</p>
                    </div>
                  )}
                </div>

                {/* Booking Details */}
                {selectedAppointment.bookedBy && (
                  <div className="bg-base-100 border border-base-300 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-4">Booking Information</h3>
                    <div className="space-y-3 text-sm">
                      <div>
                        <p className="text-base-content/60 mb-1">Name</p>
                        <p className="text-base-content">
                          {selectedAppointment.bookedBy.firstName} {selectedAppointment.bookedBy.lastName}
                        </p>
                      </div>
                      <div>
                        <p className="text-base-content/60 mb-1">Email</p>
                        <p className="text-base-content">{selectedAppointment.bookedBy.email}</p>
                      </div>
                      {selectedAppointment.bookedBy.phoneNumber && (
                        <div>
                          <p className="text-base-content/60 mb-1">Phone</p>
                          <p className="text-base-content">{selectedAppointment.bookedBy.phoneNumber}</p>
                        </div>
                      )}
                      {selectedAppointment.bookedBy.notes && (
                        <div>
                          <p className="text-base-content/60 mb-1">Additional Notes</p>
                          <p className="text-base-content">{selectedAppointment.bookedBy.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Card */}
                {professional && (
                  <div className="bg-base-100 border border-base-300 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-base-content mb-4">Contact</h3>
                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-20 h-20 rounded-full overflow-hidden mb-3">
                        <img
                          src={(professional.profilePic && professional.profilePic.trim()) ? professional.profilePic : '/default-profile.svg'}
                          alt={professional.fullName}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/default-profile.svg';
                          }}
                        />
                      </div>
                      <h4 className="text-base-content font-semibold mb-1">{professional.fullName}</h4>
                      <p className="text-base-content/60 text-sm">{professional.learningLanguage || 'Friend'}</p>
                    </div>

                    <div className="space-y-3 mb-6">
                      {professional.email && (
                        <div className="flex items-center gap-3 text-base-content/70 text-sm">
                          <Mail className="w-4 h-4 flex-shrink-0" />
                          <span className="break-all">{professional.email}</span>
                        </div>
                      )}
                      {professional.phoneNumber && (
                        <div className="flex items-center gap-3 text-base-content/70 text-sm">
                          <Phone className="w-4 h-4 flex-shrink-0" />
                          <span>{professional.phoneNumber}</span>
                        </div>
                      )}
                      {professional.location && (
                        <div className="flex items-center gap-3 text-base-content/70 text-sm">
                          <MapPin className="w-4 h-4 flex-shrink-0" />
                          <span>{professional.location}</span>
                        </div>
                      )}
                    </div>

                    <hr className="border-base-300 my-4" />

                    <div className="space-y-2">
                      <button 
                        onClick={() => navigate(`/call/${selectedAppointment._id}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 btn btn-primary btn-sm"
                      >
                        <Video className="w-4 h-4" />
                        Join Video Call
                      </button>
                      <button
                        onClick={() => navigate(`/chat/${professional._id}`)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 btn btn-outline btn-sm"
                      >
                        <MessageSquare className="w-4 h-4" />
                        Send Message
                      </button>
                    </div>
                  </div>
                )}

                {/* Quick Info */}
                <div className="bg-base-100 border border-base-300 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-base-content mb-4">Quick Info</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="text-base-content/60 mb-1">Created</p>
                      <p className="text-base-content">
                        {selectedAppointment.createdAt ? format(new Date(selectedAppointment.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </p>
                    </div>
                    <hr className="border-base-300" />
                    <div>
                      <p className="text-base-content/60 mb-1">Status</p>
                      <p className="text-base-content capitalize">{selectedAppointment.status}</p>
                    </div>
                    <hr className="border-base-300" />
                    <div>
                      <p className="text-base-content/60 mb-1">Reminder</p>
                      <p className="text-base-content">
                        {selectedAppointment.reminder === 1440 ? '1 day before' :
                         selectedAppointment.reminder === 120 ? '2 hours before' :
                         selectedAppointment.reminder === 60 ? '1 hour before' :
                         selectedAppointment.reminder ? `${selectedAppointment.reminder} minutes before` :
                         'No reminder'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Meeting Notes */}
                <div className="bg-base-100 border border-base-300 rounded-lg p-6 mb-8">
                  <h3 className="text-lg font-semibold text-base-content mb-4">Meeting Minutes</h3>
                  <textarea
                    value={meetingNotes}
                    onChange={(e) => setMeetingNotes(e.target.value)}
                    placeholder="Add notes during or after the meeting..."
                    className="w-full p-3 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary textarea textarea-bordered resize-none text-sm"
                    rows="4"
                  />
                  <button className="mt-4 px-4 py-2 btn btn-primary btn-sm">
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
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Modal */}
        <div className="relative z-50 w-full max-w-2xl bg-base-100 rounded-lg shadow-2xl">
          {/* Header */}
          <div className="bg-base-200 border-b border-base-300 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-base-content">
                Today's Appointments
              </h2>
              <p className="text-sm text-base-content/60 mt-1">
                {format(new Date(), 'EEEE, MMMM d')} • {todaysAppointments.length} appointment{todaysAppointments.length !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-base-300 rounded-lg transition"
            >
              <X className="w-6 h-6 text-base-content/70" />
            </button>
          </div>

          {/* Content */}
          <div className="max-h-[calc(100vh-200px)] overflow-y-auto">
            {todaysAppointments.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="mx-auto h-12 w-12 text-base-content/40 mb-4" />
                <p className="text-base-content font-semibold">No appointments today</p>
                <p className="text-base-content/60 text-sm mt-1">
                  You're all set for today!
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-3">
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
                      className="w-full text-left p-4 rounded-lg border border-base-300 hover:border-primary/50 hover:bg-base-100/50 transition group"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-base-content group-hover:text-primary transition truncate">
                            {appointment.title || 'Untitled'}
                          </p>
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                              <span className="text-sm text-base-content/70">{aptTime}</span>
                            </div>
                            {otherUser && (
                              <span className="text-sm text-base-content/60">
                                with <span className="text-base-content font-semibold">{otherUser.fullName || otherUser.name}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`badge badge-sm flex-shrink-0 ${
                          appointment.status === 'confirmed' ? 'badge-success' :
                          appointment.status === 'pending' ? 'badge-warning' :
                          appointment.status === 'declined' ? 'badge-error' :
                          'badge-info'
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
          <div className="bg-base-100 border-t border-base-300 px-8 py-4 flex justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-lg transition"
            >
              Close
            </button>
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
};

export default TodaysAppointmentsModal;
