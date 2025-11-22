import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns';
import { X, Clock, User, Calendar, CheckCircle, XCircle, MessageSquare } from 'lucide-react';

const AppointmentRequestModal = ({
  isOpen,
  onClose,
  appointment,
  currentUser,
  onAccept,
  onDecline,
  isLoading = false,
}) => {
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineMessage, setDeclineMessage] = useState('');

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
      alert('Please provide a reason for declining');
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
        className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      {/* Sliding Modal */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-2xl bg-gray-800 shadow-xl overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-r from-blue-700 to-blue-600 border-b border-blue-600 px-6 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">
                {showDeclineForm ? 'Decline Request' : 'Appointment Request'}
              </h2>
              <p className="text-sm text-blue-100 mt-1">
                {appointment._id?.slice(-6) || 'N/A'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-blue-100 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {!showDeclineForm ? (
            <div className="p-6 space-y-6">
              {/* Status Alert */}
              <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4">
                <p className="text-yellow-200 text-sm font-medium">
                  ⏰ Awaiting Your Response
                </p>
                <p className="text-yellow-100 text-sm mt-1">
                  Please accept or decline this appointment request. The requester will be notified of your decision.
                </p>
              </div>

              {/* Requester Information */}
              {requester && (
                <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                  <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Requested By
                  </h3>
                  <div className="flex items-center gap-4">
                    {requester.profilePic ? (
                      <img
                        src={requester.profilePic}
                        alt={requester.fullName}
                        className="w-16 h-16 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                        <span className="text-xl font-bold text-white">
                          {(requester.fullName || 'U')[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <h4 className="font-semibold text-gray-100">
                        {requester.fullName || requester.name}
                      </h4>
                      <p className="text-sm text-gray-400">{requester.email}</p>
                      {requester.learningLanguage && (
                        <p className="text-sm text-gray-400 mt-1">
                          Learning: {requester.learningLanguage}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Appointment Details */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100 mb-4">Appointment Details</h3>
                <div className="space-y-4">
                  {/* Title */}
                  <div>
                    <p className="text-sm text-gray-400">Title</p>
                    <p className="text-gray-100 font-medium">{appointment.title || 'Untitled'}</p>
                  </div>

                  {/* Date & Time */}
                  <div className="flex items-start gap-2">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400">Date</p>
                      <p className="text-gray-100 font-medium">
                        {format(startTime, 'EEEE, MMMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  {/* Start Time */}
                  <div className="flex items-start gap-2">
                    <Clock className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-400">Time</p>
                      <p className="text-gray-100 font-medium">
                        {format(startTime, 'h:mm a')}
                        {endTime && ` - ${format(endTime, 'h:mm a')}`}
                      </p>
                      {appointment.duration && (
                        <p className="text-sm text-gray-400 mt-1">
                          Duration: {appointment.duration} minutes
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Meeting Type */}
                  {appointment.meetingType && (
                    <div>
                      <p className="text-sm text-gray-400">Meeting Type</p>
                      <p className="text-gray-100 font-medium">{appointment.meetingType}</p>
                    </div>
                  )}

                  {/* Description */}
                  {appointment.description && (
                    <div>
                      <p className="text-sm text-gray-400">Notes</p>
                      <p className="text-gray-100 mt-1 whitespace-pre-wrap">
                        {appointment.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Booking Information Summary */}
              <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-200 mb-2">Summary</h4>
                <div className="space-y-1 text-sm text-blue-100">
                  <p><span className="text-blue-300 font-medium">Title:</span> {appointment.title || 'Not set'}</p>
                  <p><span className="text-blue-300 font-medium">Date & Time:</span> {format(startTime, 'MMM d, yyyy - h:mm a')}</p>
                  {appointment.duration && (
                    <p><span className="text-blue-300 font-medium">Duration:</span> {appointment.duration} minutes</p>
                  )}
                  <p><span className="text-blue-300 font-medium">Type:</span> {appointment.meetingType || 'Not specified'}</p>
                  {requester && (
                    <p><span className="text-blue-300 font-medium">With:</span> {requester.fullName || requester.name}</p>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  onClick={onClose}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 text-gray-200 rounded-lg font-medium transition"
                >
                  Later
                </button>
                <button
                  onClick={() => setShowDeclineForm(true)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Decline
                </button>
                <button
                  onClick={() => onAccept?.(appointment._id)}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-700 disabled:opacity-50 text-white rounded-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  Accept
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Decline Form Header */}
              <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
                <p className="text-red-200 text-sm">
                  Please provide a reason for declining this appointment. The requester will see your message.
                </p>
              </div>

              {/* Message Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  value={declineMessage}
                  onChange={(e) => setDeclineMessage(e.target.value)}
                  placeholder="Explain why you're declining this appointment..."
                  rows="6"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeclineForm(false);
                    setDeclineMessage('');
                  }}
                  disabled={isLoading}
                  className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:opacity-50 text-gray-200 rounded-lg font-medium transition"
                >
                  Back
                </button>
                <button
                  type="button"
                  onClick={handleDecline}
                  disabled={isLoading || !declineMessage.trim()}
                  className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-700 disabled:opacity-50 text-white rounded-lg font-medium transition"
                >
                  {isLoading ? 'Declining...' : 'Confirm Decline'}
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
