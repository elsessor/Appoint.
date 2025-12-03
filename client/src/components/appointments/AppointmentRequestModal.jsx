import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns';
import { X, Clock, User, Calendar, CheckCircle, XCircle, MessageSquare, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

const AppointmentRequestModal = ({
  isOpen,
  onClose,
  appointment,
  onAccept,
  onDecline,
  isLoading = false,
}) => {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineMessage, setDeclineMessage] = useState('');

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

  if (!isOpen || !appointment) return null;

  const startTime = typeof appointment.startTime === 'string'
    ? parseISO(appointment.startTime)
    : new Date(appointment.startTime);

  const endTime = appointment.endTime
    ? (typeof appointment.endTime === 'string'
      ? parseISO(appointment.endTime)
      : new Date(appointment.endTime))
    : null;

  const requester = appointment.requester || appointment.createdBy || appointment.userId;

  const handleDecline = () => {
    if (!declineMessage.trim()) {
      toast.error('Please provide a reason for declining');
      return;
    }
    onDecline?.(appointment._id, declineMessage);
    setShowDeclineForm(false);
    setDeclineMessage('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Sliding Modal */}
      <div className="absolute inset-y-0 right-0 pl-4 sm:pl-10 max-w-full flex">
        <div className="w-screen max-w-sm sm:max-w-md md:max-w-2xl bg-base-100 shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-base-200 border-b border-base-300 px-3 sm:px-6 py-3 sm:py-6 flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-base-content">
                {showDeclineForm ? 'Decline Request' : 'Appointment Request'}
              </h2>
              <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                {appointment._id?.slice(-6) || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-base-content/60 hover:text-base-content transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {!showDeclineForm ? (
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
              {/* Status Alert */}
              <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                <p className="text-warning text-sm font-medium">
                  ⏰ Awaiting Your Response
                </p>
                <p className="text-warning/80 text-sm mt-1">
                  Please accept or decline this appointment request. The requester will be notified of your decision.
                </p>
              </div>

              {/* Requester Information */}
              {requester && (
                <div className="bg-base-200 rounded-lg p-3 sm:p-4 border border-base-300">
                  <h3 className="text-base sm:text-lg font-semibold text-base-content mb-3 sm:mb-4 flex items-center gap-2">
                    <User className="w-4 sm:w-5 h-4 sm:h-5" />
                    Requested By
                  </h3>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    {requester.profilePic ? (
                      <img
                        src={requester.profilePic}
                        alt={requester.fullName}
                        className="w-12 sm:w-16 h-12 sm:h-16 rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-lg sm:text-xl font-bold text-white">
                          {(requester.fullName || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm sm:text-base font-semibold text-base-content truncate">
                        {requester.fullName || requester.name}
                      </h4>
                      <p className="text-xs sm:text-sm text-base-content/60 truncate">{requester.email}</p>
                      {requester.learningLanguage && (
                        <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                          Learning: {requester.learningLanguage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              <div className="bg-base-200 rounded-lg p-3 sm:p-4 border border-base-300">
                <h3 className="text-base sm:text-lg font-semibold text-base-content mb-3 sm:mb-4">Appointment Details</h3>
                <div className="space-y-3 sm:space-y-4">
                  {/* Title */}
                  <div>
                    <p className="text-xs sm:text-sm text-base-content/60">Title</p>
                    <p className="text-sm sm:text-base text-base-content font-medium">{appointment.title || 'Untitled'}</p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-4 sm:w-5 h-4 sm:h-5 text-base-content/60 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-base-content/60">Date</p>
                      <p className="text-base-content font-medium">
                        {format(startTime, 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-4 sm:w-5 h-4 sm:h-5 text-base-content/60 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm text-base-content/60">Time</p>
                      <p className="text-sm sm:text-base text-base-content font-medium">
                        {format(startTime, 'h:mm a')}
                        {endTime && ` - ${format(endTime, 'h:mm a')}`}
                      </p>
                      {appointment.duration && (
                        <p className="text-xs sm:text-sm text-base-content/60 mt-1">
                          Duration: {appointment.duration} minutes
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meeting Type */}
                  {appointment.meetingType && (
                    <div>
                      <p className="text-xs sm:text-sm text-base-content/60">Meeting Type</p>
                      <p className="text-sm sm:text-base text-base-content font-medium">{appointment.meetingType}</p>
                    </div>
                  )}

                  {/* Location */}
                  {appointment.location && appointment.meetingType?.toLowerCase() === 'in-person' && (
                    <div className="flex items-start gap-2">
                      <MapPin className="w-4 sm:w-5 h-4 sm:h-5 text-base-content/60 mt-1 flex-shrink-0" />
                      <div>
                        <p className="text-xs sm:text-sm text-base-content/60">Location</p>
                        <p className="text-sm sm:text-base text-base-content font-medium">{appointment.location}</p>
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {appointment.description && (
                    <div>
                      <p className="text-xs sm:text-sm text-base-content/60">Notes</p>
                      <p className="text-xs sm:text-sm text-base-content mt-1 whitespace-pre-wrap">
                        {appointment.description}
                      </p>
                    </div>
                  )}

                  {/* Reminder */}
                  {appointment.reminder && (
                    <div>
                      <p className="text-xs sm:text-sm text-base-content/60">Reminder</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="badge badge-info gap-1 text-xs sm:text-sm">
                          <span>🔔</span>
                          <span>
                            {appointment.reminder === 1440 ? '1 day before' :
                             appointment.reminder === 120 ? '2 hours before' :
                             appointment.reminder === 60 ? '1 hour before' :
                             `${appointment.reminder} minutes before`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Information Summary */}
              <div className="bg-primary/10 border border-primary/30 rounded-lg p-3 sm:p-4">
                <h4 className="text-xs sm:text-sm font-semibold text-primary mb-2">Summary</h4>
                <div className="space-y-1 text-xs sm:text-sm text-base-content/80">
                  <p><span className="text-primary font-medium">Title:</span> {appointment.title || 'Not set'}</p>
                  <p><span className="text-primary font-medium">Date & Time:</span> {format(startTime, 'MMM d, yyyy - h:mm a')}</p>
                  {appointment.duration && (
                    <p><span className="text-primary font-medium">Duration:</span> {appointment.duration} minutes</p>
                  )}
                  <p><span className="text-primary font-medium">Type:</span> {appointment.meetingType || 'Not specified'}</p>
                  {appointment.location && appointment.meetingType?.toLowerCase() === 'in-person' && (
                    <p><span className="text-primary font-medium">Location:</span> {appointment.location}</p>
                  )}
                  {appointment.reminder && (
                    <p><span className="text-primary font-medium">Reminder:</span> {
                      appointment.reminder === 1440 ? '1 day before' :
                      appointment.reminder === 120 ? '2 hours before' :
                      appointment.reminder === 60 ? '1 hour before' :
                      `${appointment.reminder} minutes before`
                    }</p>
                  )}
                  {requester && (
                    <p><span className="text-primary font-medium">With:</span> {requester.fullName || requester.name}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-base-300">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 btn btn-outline btn-sm text-xs sm:text-sm"
                >
                  Later
                </button>
                <button
                  onClick={() => setShowDeclineForm(true)}
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 btn btn-error btn-sm flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <XCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Decline</span>
                  <span className="sm:hidden">No</span>
                </button>
                <button
                  onClick={() => onAccept?.(appointment._id)}
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 btn btn-success btn-sm flex items-center justify-center gap-1 sm:gap-2 text-xs sm:text-sm"
                >
                  <CheckCircle className="w-3 sm:w-4 h-3 sm:h-4" />
                  <span className="hidden sm:inline">Accept</span>
                  <span className="sm:hidden">Yes</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 sm:p-6 space-y-3 sm:space-y-6">
              {/* Decline Form Header */}
              <div className="bg-error/10 border border-error/30 rounded-lg p-3 sm:p-4">
                <p className="text-error/80 text-xs sm:text-sm">
                  Please provide a reason for declining this appointment. The requester will see your message.
                </p>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-base-content mb-2">
                  Your Message <span className="text-error">*</span>
                </label>
                <textarea
                  value={declineMessage}
                  onChange={(e) => setDeclineMessage(e.target.value)}
                  placeholder="Explain why you're declining this appointment..."
                  rows="4"
                  className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-base-200 border border-base-300 rounded-lg text-xs sm:text-sm text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-error/50 resize-none textarea textarea-bordered"
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-base-300">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineMessage('');
                  }}
                  disabled={isLoading}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 btn btn-outline btn-sm text-xs sm:text-sm"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isLoading || !declineMessage.trim()}
                  className="flex-1 px-3 sm:px-6 py-2 sm:py-3 btn btn-error btn-sm text-xs sm:text-sm"
                >
                  {isLoading ? 'Declining...' : 'Confirm'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AppointmentRequestModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  appointment: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    title: PropTypes.string,
    startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
    duration: PropTypes.number,
    meetingType: PropTypes.string,
    description: PropTypes.string,
    requester: PropTypes.object,
    createdBy: PropTypes.object,
  }),
  currentUser: PropTypes.object,
  onAccept: PropTypes.func,
  onDecline: PropTypes.func,
  isLoading: PropTypes.bool,
};

export default AppointmentRequestModal;
