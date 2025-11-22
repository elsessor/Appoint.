import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isBefore, isToday, addMinutes } from 'date-fns';
import { X, Clock, User, MessageSquare, Calendar, ChevronDown } from 'lucide-react';

const CANCELLATION_REASONS = [
  'Schedule Conflict',
  'Unexpected Emergency',
  'Weather Issues',
  'Technical Difficulties',
  'Personal Reasons',
  'Other (Please specify)',
];

const AppointmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  initialTime,
  friends = [],
  currentUser,
  availability = {
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
  },
  appointment = null,
  onDelete = null,
  onAccept = null,
  onDecline = null,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    friendId: '',
    meetingType: 'Video Call',
    duration: 30,
  });

  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [declineMessage, setDeclineMessage] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  useEffect(() => {
    if (appointment) {
      const startTime = typeof appointment.startTime === 'string' 
        ? appointment.startTime 
        : appointment.startTime?.toISOString?.() || '';
      const endTime = typeof appointment.endTime === 'string' 
        ? appointment.endTime 
        : appointment.endTime?.toISOString?.() || '';
      
      setFormData({
        title: appointment.title || '',
        description: appointment.description || appointment.message || '',
        startTime,
        endTime,
        friendId: appointment.friendId || appointment.participant?._id || '',
        meetingType: appointment.meetingType || 'Video Call',
        duration: appointment.duration || 30,
      });
    } else if (initialDate) {
      const dateStr = format(initialDate, 'yyyy-MM-dd');
      const timeStr = initialTime ? format(initialTime, 'HH:mm') : '09:00';
      setFormData(prev => ({
        ...prev,
        startTime: `${dateStr}T${timeStr}`,
        endTime: `${dateStr}T${timeStr}`,
      }));
    }
  }, [appointment, initialDate, initialTime, isOpen]);

  const generateTimeSlots = useMemo(() => {
    const slots = [];
    const [startHour, startMin] = availability.start.split(':').map(Number);
    const [endHour, endMin] = availability.end.split(':').map(Number);
    const duration = availability.slotDuration || 30;
    const now = new Date();

    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);
    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    // If the initial date is today, only show future slots
    const selectedDate = initialDate ? new Date(initialDate) : new Date();
    const isSelectedToday = isToday(selectedDate);

    while (current < end) {
      const slotTime = format(current, 'HH:mm');
      // Disable past time slots if booking for today
      const isDisabled = isSelectedToday && isBefore(current, now);
      slots.push({ time: slotTime, disabled: isDisabled });
      current = addMinutes(current, duration);
    }

    return slots;
  }, [availability, initialDate]);

  const timeSlots = generateTimeSlots;

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'duration') {
      setFormData(prev => ({
        ...prev,
        [name]: parseInt(value),
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleStartTimeChange = (e) => {
    const newStartTime = e.target.value;
    setFormData(prev => ({
      ...prev,
      startTime: newStartTime,
      // Auto-calculate end time based on duration
      endTime: newStartTime ? format(addMinutes(parseISO(newStartTime), formData.duration), 'yyyy-MM-dd\'T\'HH:mm') : '',
    }));
  };

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      duration: newDuration,
      // Recalculate end time with new duration
      endTime: prev.startTime ? format(addMinutes(parseISO(prev.startTime), newDuration), 'yyyy-MM-dd\'T\'HH:mm') : '',
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter an appointment title');
      return;
    }

    if (!formData.startTime) {
      alert('Please select a start time');
      return;
    }

    if (!formData.friendId) {
      alert('Please select a friend');
      return;
    }

    // Validate that the appointment is not in the past
    const startDateTime = parseISO(formData.startTime);
    const now = new Date();
    if (isBefore(startDateTime, now)) {
      alert('Cannot schedule an appointment in the past');
      return;
    }

    onSubmit(formData);
    setFormData({
      title: '',
      description: '',
      startTime: '',
      endTime: '',
      friendId: '',
      meetingType: 'Video Call',
      duration: 30,
    });
  };

  const handleCancelAppointment = () => {
    if (!cancellationReason) {
      alert('Please select a cancellation reason');
      return;
    }

    const finalReason = cancellationReason === 'Other (Please specify)' 
      ? customReason 
      : cancellationReason;

    if (!finalReason.trim()) {
      alert('Please provide a reason');
      return;
    }

    if (onDelete) {
      onDelete(finalReason);
      setShowCancellation(false);
      setCancellationReason('');
      setCustomReason('');
      onClose();
    }
  };

  const handleDeclineAppointment = () => {
    if (!declineMessage.trim()) {
      alert('Please provide a reason for declining');
      return;
    }

    if (onDecline) {
      onDecline(declineMessage);
      setShowDeclineForm(false);
      setDeclineMessage('');
      onClose();
    }
  };

  const durationOptions = [15, 30, 45, 60, 90, 120];

  if (!isOpen) return null;

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
          <div className="sticky top-0 bg-gradient-to-r from-gray-800 to-gray-700 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-100">
                {showCancellation 
                  ? 'Cancel Appointment' 
                  : showDeclineForm 
                  ? 'Decline Appointment' 
                  : appointment ? 'Edit Appointment' : 'Create Appointment'}
              </h2>
              {appointment && !showCancellation && !showDeclineForm && (
                <p className="text-sm text-gray-400 mt-1">
                  Appointment ID: {appointment._id?.slice(-6) || 'N/A'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-300 transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {!showCancellation && !showDeclineForm ? (
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Appointment Title <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Project Discussion, Language Lesson"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Friend Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Schedule With <span className="text-red-400">*</span>
                </label>
                <select
                  name="friendId"
                  value={formData.friendId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select a friend</option>
                  {friends.map(friend => (
                    <option key={friend._id} value={friend._id}>
                      {friend.fullName || friend.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Time Section */}
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h3 className="text-lg font-semibold text-gray-100 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Schedule Details
                </h3>

                {/* Start Date/Time */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Start Date & Time <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleStartTimeChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-400 mt-1">Note: Cannot schedule in the past</p>
                </div>

                {/* Duration */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Duration <span className="text-red-400">*</span>
                  </label>
                  <select
                    value={formData.duration}
                    onChange={handleDurationChange}
                    className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {durationOptions.map(duration => (
                      <option key={duration} value={duration}>
                        {duration} minutes
                      </option>
                    ))}
                  </select>
                </div>

                {/* End Time (Auto-calculated) */}
                {formData.startTime && (
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Time (Auto-calculated)
                    </label>
                    <div className="px-4 py-3 bg-gray-600 rounded-lg text-gray-200 border border-gray-600">
                      {formData.endTime 
                        ? format(parseISO(formData.endTime), 'MMM d, yyyy - h:mm a')
                        : 'Will be calculated based on duration'
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Meeting Type
                </label>
                <select
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Video Call</option>
                  <option>Phone Call</option>
                  <option>In Person</option>
                  <option>Chat</option>
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Notes & Details
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional information about this appointment..."
                  rows="4"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Booking Information Summary */}
              {formData.startTime && formData.friendId && (
                <div className="bg-blue-900 bg-opacity-30 border border-blue-700 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-200 mb-2">Appointment Summary</h4>
                  <div className="space-y-1 text-sm text-blue-100">
                    <p><span className="text-blue-300 font-medium">Title:</span> {formData.title || 'Not set'}</p>
                    <p><span className="text-blue-300 font-medium">Date & Time:</span> {format(parseISO(formData.startTime), 'MMM d, yyyy - h:mm a')}</p>
                    <p><span className="text-blue-300 font-medium">Duration:</span> {formData.duration} minutes</p>
                    <p><span className="text-blue-300 font-medium">Type:</span> {formData.meetingType}</p>
                    {formData.friendId && (
                      <p><span className="text-blue-300 font-medium">With:</span> {friends.find(f => f._id === formData.friendId)?.fullName || 'Selected friend'}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4 border-t border-gray-700">
                {appointment && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowCancellation(true)}
                    className="px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                  >
                    Cancel Appointment
                  </button>
                )}
                <div className="flex-1 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    {appointment ? 'Update' : 'Create'} Appointment
                  </button>
                </div>
              </div>
            </form>
          ) : showCancellation ? (
            <CancellationForm
              cancellationReason={cancellationReason}
              setCancellationReason={setCancellationReason}
              customReason={customReason}
              setCustomReason={setCustomReason}
              onCancel={() => setShowCancellation(false)}
              onSubmit={handleCancelAppointment}
            />
          ) : (
            <DeclineForm
              declineMessage={declineMessage}
              setDeclineMessage={setDeclineMessage}
              onCancel={() => setShowDeclineForm(false)}
              onSubmit={handleDeclineAppointment}
            />
          )}
        </div>
      </div>
    </div>
  );
};

// Cancellation Form Component
const CancellationForm = ({ 
  cancellationReason, 
  setCancellationReason, 
  customReason, 
  setCustomReason, 
  onCancel, 
  onSubmit 
}) => (
  <div className="p-6 space-y-6">
    <div className="bg-red-900 bg-opacity-30 border border-red-700 rounded-lg p-4">
      <p className="text-red-200 text-sm">
        Cancelling this appointment will notify the other person. Please provide a reason for accountability.
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">
        Reason for Cancellation <span className="text-red-400">*</span>
      </label>
      <div className="space-y-2">
        {CANCELLATION_REASONS.map((reason) => (
          <div key={reason} className="flex items-center">
            <input
              type="radio"
              id={reason}
              name="cancellation"
              value={reason}
              checked={cancellationReason === reason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="h-4 w-4 rounded-full border-gray-500 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor={reason} className="ml-3 text-sm text-gray-300 cursor-pointer">
              {reason}
            </label>
          </div>
        ))}
      </div>
    </div>

    {cancellationReason === 'Other (Please specify)' && (
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Please explain your reason
        </label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Enter your cancellation reason..."
          rows="4"
          className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
        />
      </div>
    )}

    <div className="flex gap-3 pt-4 border-t border-gray-700">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
      >
        Confirm Cancellation
      </button>
    </div>
  </div>
);

// Decline Form Component
const DeclineForm = ({ declineMessage, setDeclineMessage, onCancel, onSubmit }) => (
  <div className="p-6 space-y-6">
    <div className="bg-yellow-900 bg-opacity-30 border border-yellow-700 rounded-lg p-4">
      <p className="text-yellow-200 text-sm">
        Declining this appointment will notify the requester. Please provide a reason in your message.
      </p>
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        Message <span className="text-red-400">*</span>
      </label>
      <textarea
        value={declineMessage}
        onChange={(e) => setDeclineMessage(e.target.value)}
        placeholder="Explain why you're declining this appointment..."
        rows="6"
        className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
    </div>

    <div className="flex gap-3 pt-4 border-t border-gray-700">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg font-medium transition"
      >
        Decline Appointment
      </button>
    </div>
  </div>
);

CancellationForm.propTypes = {
  cancellationReason: PropTypes.string.isRequired,
  setCancellationReason: PropTypes.func.isRequired,
  customReason: PropTypes.string.isRequired,
  setCustomReason: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

DeclineForm.propTypes = {
  declineMessage: PropTypes.string.isRequired,
  setDeclineMessage: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

AppointmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialDate: PropTypes.instanceOf(Date),
  initialTime: PropTypes.instanceOf(Date),
  friends: PropTypes.arrayOf(PropTypes.object),
  currentUser: PropTypes.object,
  availability: PropTypes.object,
  appointment: PropTypes.object,
  onDelete: PropTypes.func,
  onAccept: PropTypes.func,
  onDecline: PropTypes.func,
};

export default AppointmentModal;
