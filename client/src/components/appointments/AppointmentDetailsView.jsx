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

const AppointmentDetails = ({
  appointment,
  currentUser,
  onClose,
  onEdit,
  onDelete,
}) => {
  const { theme } = useThemeStore();
  const navigate = useNavigate();
  const [meetingNotes, setMeetingNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  if (!appointment) {
    return (
      <div className="flex items-center justify-center h-screen" data-theme={theme}>
        <p className="text-base-content/60">No appointment selected</p>
      </div>
    );
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

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      {/* Header */}
      <div className="bg-base-200 border-b border-base-300 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={onClose}
                className="p-2 hover:bg-base-300 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-base-content/70" />
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
              <div>
                <h1 className="text-2xl font-bold text-base-content">{appointment.title || 'Appointment'}</h1>
                <p className="text-sm text-base-content/60 mt-1">{appointmentDateStr} at {appointmentTime}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onEdit();
                  setIsEditing(!isEditing);
                }}
                className="flex items-center gap-2 px-4 py-2 btn btn-outline btn-sm"
              >
                <Edit className="w-4 h-4" />
                Reschedule
              </button>
              <button
                onClick={onDelete}
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
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <div className="bg-base-100 border border-base-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <span className={`inline-flex items-center gap-2 px-3 py-1 badge gap-2 ${
                  appointment.status === 'confirmed' 
                    ? 'badge-success' 
                    : appointment.status === 'declined'
                    ? 'badge-error'
                    : appointment.status === 'pending'
                    ? 'badge-warning'
                    : 'badge-info'
                }`}>
                  <CheckCircle2 className="w-4 h-4" />
                  {appointment.status === 'scheduled' ? 'Confirmed' : appointment.status?.charAt(0).toUpperCase() + appointment.status?.slice(1)}
                </span>
                <span className="text-base-content/60 text-sm">Appointment ID: #{appointment._id?.slice(-6) || 'N/A'}</span>
              </div>

              {/* Decline Reason */}
              {appointment.status === 'declined' && appointment.declinedReason && (
                <div className="mb-6 p-4 bg-error/10 border border-error/30 rounded-lg flex gap-3">
                  <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-error mb-1">Appointment Declined</p>
                    <p className="text-sm text-error/80">{appointment.declinedReason}</p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                  <Calendar className="w-10 h-10 text-primary" />
                  <div>
                    <p className="text-base-content/60 text-sm">Date</p>
                    <p className="text-base-content font-medium">{appointmentDateStr}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                  <Clock className="w-10 h-10 text-primary" />
                  <div>
                    <p className="text-base-content/60 text-sm">Time</p>
                    <p className="text-base-content font-medium">{appointmentTime}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                  <Video className="w-10 h-10 text-primary" />
                  <div>
                    <p className="text-base-content/60 text-sm">Type</p>
                    <p className="text-base-content font-medium">{appointment.meetingType || 'Video Call'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 bg-base-200 rounded-lg">
                  <Clock className="w-10 h-10 text-primary" />
                  <div>
                    <p className="text-base-content/60 text-sm">Duration</p>
                    <p className="text-base-content font-medium">{appointment.duration || 30} minutes</p>
                  </div>
                </div>
              </div>

              <hr className="border-base-300 my-6" />

              {appointment.title && (
                <>
                  <div className="mb-6">
                    <h4 className="text-base-content font-semibold mb-2">Subject</h4>
                    <p className="text-base-content/70">{appointment.title}</p>
                  </div>
                  <hr className="border-base-300 my-6" />
                </>
              )}

              {appointment.description && (
                <div>
                  <h4 className="text-base-content font-semibold mb-2">Notes</h4>
                  <p className="text-base-content/70">{appointment.description}</p>
                </div>
              )}
            </div>

            {/* Booking Details */}
            {appointment.bookedBy && (
              <div className="bg-base-100 border border-base-300 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-base-content mb-4">Booking Information</h3>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-base-content/60 mb-1">Name</p>
                    <p className="text-base-content">
                      {appointment.bookedBy.firstName} {appointment.bookedBy.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-base-content/60 mb-1">Email</p>
                    <p className="text-base-content">{appointment.bookedBy.email}</p>
                  </div>
                  {appointment.bookedBy.phoneNumber && (
                    <div>
                      <p className="text-base-content/60 mb-1">Phone</p>
                      <p className="text-base-content">{appointment.bookedBy.phoneNumber}</p>
                    </div>
                  )}
                  {appointment.bookedBy.notes && (
                    <div>
                      <p className="text-base-content/60 mb-1">Additional Notes</p>
                      <p className="text-base-content">{appointment.bookedBy.notes}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Meeting Notes */}
            <div className="bg-base-100 border border-base-300 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-base-content mb-4">Meeting Minutes</h3>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder="Add notes during or after the meeting..."
                className="w-full p-3 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary textarea textarea-bordered resize-none"
                rows="5"
              />
              <button className="mt-4 px-4 py-2 btn btn-primary">
                Save Minutes
              </button>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Professional/Friend Info */}
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
                    onClick={() => navigate(`/call/${appointment._id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 btn btn-primary"
                  >
                    <Video className="w-4 h-4" />
                    Join Video Call
                  </button>
                  <button
                    onClick={() => navigate(`/chat/${professional._id}`)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 btn btn-outline"
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
                    {appointment.createdAt ? format(new Date(appointment.createdAt), 'MMM dd, yyyy') : 'N/A'}
                  </p>
                </div>
                <hr className="border-base-300" />
                <div>
                  <p className="text-base-content/60 mb-1">Status</p>
                  <p className="text-base-content capitalize">{appointment.status}</p>
                </div>
                <hr className="border-base-300" />
                <div>
                  <p className="text-base-content/60 mb-1">Reminder</p>
                  <p className="text-base-content">
                    {appointment.reminder === 1440 ? '1 day before' :
                     appointment.reminder === 120 ? '2 hours before' :
                     appointment.reminder === 60 ? '1 hour before' :
                     appointment.reminder ? `${appointment.reminder} minutes before` :
                     'No reminder'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
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
};

export default AppointmentDetails;
