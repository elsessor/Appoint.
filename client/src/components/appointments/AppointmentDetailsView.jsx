import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Video,
  MessageSquare,
  FileText,
  Download,
  Edit,
  Trash2,
  MapPin,
  Mail,
  Phone,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';
import AppointmentModal from './AppointmentModal';

const AppointmentDetails = ({
  appointment,
  currentUser,
  onClose,
  onEdit,
  onDelete,
  friends = [],
  availability = {},
  friendsAvailability = {},
  appointments = [],
  onUpdateAppointment,
}) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);

  if (!appointment) {
    return null;
  }

  const appointmentDate = typeof appointment.startTime === 'string'
    ? parseISO(appointment.startTime)
    : new Date(appointment.startTime);

  const appointmentTime = format(appointmentDate, 'h:mm a');
  const appointmentDateStr = format(appointmentDate, 'MMMM dd, yyyy');

  // Determine the "other user" - show the user that is NOT the current user
  const currentUserId = currentUser?._id || currentUser?.id;
  const appointmentUserId = appointment.userId?._id || appointment.userId;
  const appointmentFriendId = appointment.friendId?._id || appointment.friendId;

  // If current user is the userId (creator), show friendId; otherwise show userId
  const professional = appointmentUserId === currentUserId 
    ? appointment.friendId 
    : appointment.userId;

  // Check if current user is a participant in this appointment
  const isParticipant = appointmentUserId === currentUserId || appointmentFriendId === currentUserId;

  // Both participants can manage (reschedule/cancel) their appointments
  // Only pending requests have special rules (only receiver can accept/decline)
  const canPerformActions = isParticipant;

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-black/50" data-theme={theme}>
      <div className="flex items-center justify-end min-h-screen">
        {/* Backdrop - click to close */}
        <div 
          className="fixed inset-0 bg-black/30 backdrop-blur-sm" 
          onClick={onClose}
          aria-hidden="true"
        ></div>

        {/* Sliding Side Panel */}
        <div className="relative z-[71] h-screen w-full max-w-3xl bg-base-100 shadow-2xl overflow-y-auto">
          {/* Header */}
          <div className="bg-base-200 border-l border-base-300 sticky top-0 z-10">
            <div className="px-3 sm:px-6 py-3 sm:py-6">
              <div className="flex items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center gap-2 sm:gap-4 flex-1">
                  <button
                    onClick={onClose}
                    className="p-1.5 sm:p-2 hover:bg-base-300 rounded-lg transition flex-shrink-0"
                  >
                    <ArrowLeft className="w-4 sm:w-5 h-4 sm:h-5 text-base-content/70" />
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
                    <h1 className="text-base sm:text-xl font-bold text-base-content truncate">{appointment.title || 'Appointment'}</h1>
                    <p className="text-xs sm:text-sm text-base-content/60 mt-0.5 sm:mt-1">{format(appointmentDate, 'MMM d')} at {appointmentTime}</p>
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                  {canPerformActions && (
                    <>
                      <button
                        onClick={() => setShowRescheduleModal(true)}
                        className="flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 btn btn-outline btn-sm text-xs sm:text-sm"
                      >
                        <Edit className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="hidden sm:inline">Reschedule</span>
                        <span className="sm:hidden">Edit</span>
                      </button>
                      <button
                        onClick={onDelete}
                        className="flex items-center gap-1 px-2 sm:px-4 py-1 sm:py-2 btn btn-outline btn-error btn-sm text-xs sm:text-sm"
                      >
                        <Trash2 className="w-3 sm:w-4 h-3 sm:h-4" />
                        <span className="hidden sm:inline">Cancel</span>
                        <span className="sm:hidden">X</span>
                      </button>
                    </>
                  )}
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
                  <span className={`inline-flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 badge gap-2 flex-shrink-0 ${
                    appointment.status === 'confirmed' 
                      ? 'badge-success' 
                      : appointment.status === 'declined'
                      ? 'badge-error'
                      : appointment.status === 'pending'
                      ? 'badge-warning'
                      : 'badge-info'
                  }`}>
                    <CheckCircle2 className="w-3 sm:w-4 h-3 sm:h-4" />
                    <span className="hidden sm:inline">{appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}</span>
                    <span className="sm:hidden">{appointment.status?.charAt(0).toUpperCase()}</span>
                  </span>
                  <span className="text-base-content/60 text-xs sm:text-sm truncate">ID: #{appointment._id?.slice(-6) || 'N/A'}</span>
                </div>

                {/* Decline Reason */}
                {appointment.status === 'declined' && appointment.declinedReason && (
                  <div className="mb-3 sm:mb-6 p-2 sm:p-4 bg-error/10 border border-error/30 rounded-lg flex gap-2 sm:gap-3">
                    <AlertCircle className="w-4 sm:w-5 h-4 sm:h-5 text-error flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-error mb-0.5 sm:mb-1 text-xs sm:text-base">Appointment Declined</p>
                      <p className="text-xs sm:text-sm text-error/80 line-clamp-2">{appointment.declinedReason}</p>
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
                      <p className="text-base-content font-medium text-xs sm:text-sm truncate">{appointment.meetingType || 'Video Call'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 p-2 sm:p-4 bg-base-200 rounded-lg">
                    <Clock className="w-8 sm:w-10 h-8 sm:h-10 text-primary flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-base-content/60 text-xs sm:text-sm">Duration</p>
                      <p className="text-base-content font-medium text-xs sm:text-sm">{appointment.duration || 30}m</p>
                    </div>
                  </div>
                </div>

                <hr className="border-base-300 my-2 sm:my-6" />

                {appointment.title && (
                  <>
                    <div className="mb-3 sm:mb-6">
                      <h4 className="text-base-content font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Subject</h4>
                      <p className="text-base-content/70 text-xs sm:text-sm line-clamp-3">{appointment.title}</p>
                    </div>
                    <hr className="border-base-300 my-2 sm:my-6" />
                  </>
                )}

                {appointment.description && (
                  <div>
                    <h4 className="text-base-content font-semibold mb-1 sm:mb-2 text-sm sm:text-base">Notes</h4>
                    <p className="text-base-content/70 text-xs sm:text-sm line-clamp-3">{appointment.description}</p>
                  </div>
                )}
              </div>

              {/* Booking Details */}
              {appointment.bookedBy && (
                <div className="bg-base-100 border border-base-300 rounded-lg p-3 sm:p-6">
                  <h3 className="text-base sm:text-lg font-semibold text-base-content mb-2 sm:mb-4">Booking Info</h3>
                  <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm">
                    <div>
                      <p className="text-base-content/60 mb-0.5 sm:mb-1">Name</p>
                      <p className="text-base-content truncate">
                        {appointment.bookedBy.firstName} {appointment.bookedBy.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-base-content/60 mb-0.5 sm:mb-1">Email</p>
                      <p className="text-base-content break-all text-xs sm:text-sm">{appointment.bookedBy.email}</p>
                    </div>
                    {appointment.bookedBy.phoneNumber && (
                      <div>
                        <p className="text-base-content/60 mb-0.5 sm:mb-1">Phone</p>
                        <p className="text-base-content">{appointment.bookedBy.phoneNumber}</p>
                      </div>
                    )}
                    {appointment.bookedBy.notes && (
                      <div>
                        <p className="text-base-content/60 mb-0.5 sm:mb-1">Notes</p>
                        <p className="text-base-content line-clamp-2">{appointment.bookedBy.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Professional/Friend Info */}
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
                      onClick={() => navigate(`/call/${appointment._id}`)}
                      className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 btn btn-primary btn-sm text-xs sm:text-sm"
                    >
                      <Video className="w-3 sm:w-4 h-3 sm:h-4" />
                      <span className="hidden sm:inline">Join Video Call</span>
                      <span className="sm:hidden">Join Call</span>
                    </button>
                    <button
                      onClick={() => navigate(`/chat/${professional._id}`)}
                      className="w-full flex items-center justify-center gap-2 px-3 sm:px-4 py-1.5 sm:py-2 btn btn-outline btn-sm text-xs sm:text-sm"
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
                      {appointment.createdAt ? format(new Date(appointment.createdAt), 'MMM d') : 'N/A'}
                    </p>
                  </div>
                  <hr className="border-base-300" />
                  <div>
                    <p className="text-base-content/60 mb-0.5 sm:mb-1">Status</p>
                    <p className="text-base-content capitalize">{appointment.status}</p>
                  </div>
                  <hr className="border-base-300" />
                  {appointment.status === 'completed' && (
                    <>
                      <div>
                        <p className="text-base-content/60 mb-0.5 sm:mb-1">Attendance</p>
                        <p className="text-base-content">
                          {(() => {
                            const currentUserId = currentUser?._id || currentUser?.id;
                            const attended = (appointment.attendedBy || []).map(String).includes(currentUserId);
                            return attended ? 'Joined' : 'Missed';
                          })()}
                        </p>
                      </div>
                      <hr className="border-base-300" />
                    </>
                  )}
                  <div>
                    <p className="text-base-content/60 mb-0.5 sm:mb-1">Reminder</p>
                    <p className="text-base-content">
                      {appointment.reminder === 1440 ? '1 day' :
                       appointment.reminder === 120 ? '2 hours' :
                       appointment.reminder === 60 ? '1 hour' :
                       appointment.reminder ? `${appointment.reminder}m` :
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

      {/* Reschedule Appointment Modal */}
      <AppointmentModal
        isOpen={showRescheduleModal}
        onClose={() => {
          setShowRescheduleModal(false);
          onClose();
        }}
        onSubmit={onUpdateAppointment}
        appointment={appointment}
        friends={friends}
        currentUser={currentUser}
        availability={availability}
        friendsAvailability={friendsAvailability}
        appointments={appointments}
      />
    </div>
  );
};

AppointmentDetails.propTypes = {
  appointment: PropTypes.object,
  currentUser: PropTypes.object,
  onClose: PropTypes.func,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  onSendMessage: PropTypes.func,
  friends: PropTypes.arrayOf(PropTypes.object),
  availability: PropTypes.object,
  friendsAvailability: PropTypes.object,
  appointments: PropTypes.arrayOf(PropTypes.object),
  onUpdateAppointment: PropTypes.func,
};

export default AppointmentDetails;
