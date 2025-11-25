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
  availability = {
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
  },
  appointment = null,
  onDelete = null,
  friendsAvailability = {},
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    friendId: '',
    friendSearch: '',
    showFriendDropdown: false,
    meetingType: 'Video Call',
    duration: 30,
    location: '',
    reminder: 15, // minutes before appointment
  });

  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [declineMessage, setDeclineMessage] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);

  useEffect(() => {
    if (isOpen) {
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
          friendSearch: '',
          showFriendDropdown: false,
          meetingType: appointment.meetingType || 'Video Call',
          duration: appointment.duration || 30,
          location: appointment.location || '',
          reminder: appointment.reminder || 15,
        });
      } else if (initialDate) {
        const dateStr = format(initialDate, 'yyyy-MM-dd');
        const timeStr = initialTime ? format(initialTime, 'HH:mm') : '09:00';
        setFormData({
          title: '',
          description: '',
          startTime: `${dateStr}T${timeStr}`,
          endTime: `${dateStr}T${timeStr}`,
          friendId: '',
          friendSearch: '',
          showFriendDropdown: false,
          meetingType: 'Video Call',
          duration: 30,
          location: '',
          reminder: 15,
        });
      }
    }
  }, [appointment, initialDate, initialTime, isOpen]);

  const generateTimeSlots = useMemo(() => {
    const slots = [];
    const [startHour, startMin] = availability.start.split(':').map(Number);
    const [endHour, endMin] = availability.end.split(':').map(Number);
    const duration = availability.slotDuration || 30;
    const now = new Date();

    // Parse the selected date from formData
    let selectedDate = new Date();
    if (formData.startTime) {
      selectedDate = parseISO(formData.startTime);
    } else if (initialDate) {
      selectedDate = new Date(initialDate);
    }

    const isSelectedToday = isToday(selectedDate);

    // Create time slots for the selected date
    let current = new Date(selectedDate);
    current.setHours(startHour, startMin, 0, 0);
    
    let end = new Date(selectedDate);
    end.setHours(endHour, endMin, 0, 0);

    while (current < end) {
      const slotTime24 = format(current, 'HH:mm');
      const slotTime12 = format(current, 'h:mm a');
      // Only disable past times for today
      const isDisabled = isSelectedToday && isBefore(current, now);
      slots.push({ time: slotTime24, display: slotTime12, disabled: isDisabled });
      current = addMinutes(current, duration);
    }

    return slots;
  }, [availability, formData.startTime, initialDate]);

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

    // Validate location for in-person appointments
    if (formData.meetingType === 'In Person' && !formData.location.trim()) {
      alert('Please enter a location for in-person appointments');
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
      friendSearch: '',
      showFriendDropdown: false,
      meetingType: 'Video Call',
      duration: 30,
      location: '',
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
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Sliding Modal */}
      <div className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-2xl bg-base-100 shadow-2xl overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-gradient-to-br from-base-100 to-base-200 border-b border-base-300 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-base-content">
                {showCancellation 
                  ? 'Cancel Appointment' 
                  : showDeclineForm 
                  ? 'Decline Appointment' 
                  : appointment ? 'Edit Appointment' : 'Create Appointment'}
              </h2>
              {appointment && !showCancellation && !showDeclineForm && (
                <p className="text-xs text-base-content/50 mt-2 font-mono">
                  {appointment._id?.slice(-8) || 'N/A'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-base-300 rounded-lg transition-colors text-base-content/60 hover:text-base-content"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {!showCancellation && !showDeclineForm ? (
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Appointment Title <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Project Discussion, Language Lesson"
                  className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                />
              </div>

              {/* Friend Selection */}
              <div>
                <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Schedule With <span className="text-error">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or select a friend..."
                    className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                    onChange={(e) => {
                      setFormData(prev => ({...prev, friendSearch: e.target.value}));
                    }}
                    onFocus={() => {
                      setFormData(prev => ({...prev, showFriendDropdown: true}));
                    }}
                    value={formData.friendSearch || ''}
                  />
                  {formData.showFriendDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border-2 border-base-300 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto">
                      {friends.filter(f => {
                        const search = (formData.friendSearch || '').toLowerCase();
                        return (f.fullName || f.name || '').toLowerCase().includes(search) ||
                               (f.email || '').toLowerCase().includes(search);
                      }).map(friend => {
                        const friendStatus = friendsAvailability[friend._id] || 'available';
                        const isAway = friendStatus === 'away';
                        const statusConfig = {
                          available: {
                            badge: 'badge-success',
                            label: 'Available',
                            icon: '✓'
                          },
                          limited: {
                            badge: 'badge-warning',
                            label: 'Limited',
                            icon: '⚠'
                          },
                          away: {
                            badge: 'badge-error',
                            label: 'Away',
                            icon: '✕'
                          }
                        };
                        
                        const config = statusConfig[friendStatus];
                        
                        return (
                          <button
                            key={friend._id}
                            type="button"
                            disabled={isAway}
                            onClick={() => {
                              if (!isAway) {
                                setFormData(prev => ({
                                  ...prev,
                                  friendId: friend._id,
                                  friendSearch: friend.fullName || friend.name,
                                  showFriendDropdown: false
                                }));
                              }
                            }}
                            className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-base-200 last:border-b-0 transition ${
                              isAway
                                ? 'opacity-50 cursor-not-allowed bg-base-200'
                                : formData.friendId === friend._id
                                ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer'
                                : 'hover:bg-base-200 cursor-pointer'
                            }`}
                          >
                            {friend.profilePic ? (
                              <img
                                src={friend.profilePic}
                                alt={friend.fullName}
                                className="w-9 h-9 rounded-full object-cover flex-shrink-0 ring-2 ring-base-300"
                              />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                                {(friend.fullName || friend.name || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-base-content truncate">
                                {friend.fullName || friend.name}
                              </p>
                              <p className="text-xs text-base-content/50 truncate">
                                {friend.email}
                              </p>
                            </div>
                            <span className={`badge ${config.badge} gap-1 text-xs flex-shrink-0`}>
                              {config.icon} {config.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Selected Friend Card */}
                {formData.friendId && (
                  <div className="mt-4 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 flex items-center gap-4">
                    {(() => {
                      const selectedFriend = friends.find(f => f._id === formData.friendId);
                      if (!selectedFriend) return null;
                      
                      const friendStatus = friendsAvailability[selectedFriend._id] || 'available';
                      const statusConfig = {
                        available: {
                          badge: 'badge-success',
                          label: 'Available',
                          icon: '✓'
                        },
                        limited: {
                          badge: 'badge-warning',
                          label: 'Limited',
                          icon: '⚠'
                        },
                        away: {
                          badge: 'badge-error',
                          label: 'Away',
                          icon: '✕'
                        }
                      };
                      const config = statusConfig[friendStatus];

                      return (
                        <>
                          {selectedFriend.profilePic ? (
                            <img
                              src={selectedFriend.profilePic}
                              alt={selectedFriend.fullName}
                              className="w-12 h-12 rounded-full object-cover flex-shrink-0 ring-2 ring-primary"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold flex-shrink-0">
                              {(selectedFriend.fullName || selectedFriend.name || 'U')[0].toUpperCase()}
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-base-content">{selectedFriend.fullName || selectedFriend.name}</p>
                            <p className="text-xs text-base-content/60">{selectedFriend.email}</p>
                          </div>
                          <span className={`badge ${config.badge} gap-1`}>
                            {config.icon} {config.label}
                          </span>
                        </>
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Date and Time Section */}
              <div className="bg-gradient-to-br from-primary/5 via-base-200/30 to-base-300/20 rounded-2xl p-6 border-2 border-primary/20">
                <h3 className="text-lg font-semibold text-base-content mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-primary" />
                  Schedule Details
                </h3>

                <div className="space-y-6">
                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-semibold text-base-content mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Date <span className="text-error">*</span>
                    </label>
                    <input
                      type="date"
                      value={formData.startTime.split('T')[0] || ''}
                      onChange={(e) => {
                        const newDate = e.target.value;
                        const time = formData.startTime.split('T')[1] || '09:00';
                        setFormData(prev => ({
                          ...prev,
                          startTime: `${newDate}T${time}`,
                          endTime: format(addMinutes(parseISO(`${newDate}T${time}`), prev.duration), 'yyyy-MM-dd\'T\'HH:mm')
                        }));
                      }}
                      className="w-full px-4 py-3 bg-base-100 border-2 border-primary/30 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                    />
                    <p className="text-xs text-base-content/60 mt-2">Select your preferred date</p>
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label className="block text-sm font-semibold text-base-content mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Time <span className="text-error">*</span>
                    </label>
                    <select
                      value={formData.startTime.split('T')[1] || '09:00'}
                      onChange={(e) => {
                        const newTime = e.target.value;
                        const date = formData.startTime.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                        setFormData(prev => ({
                          ...prev,
                          startTime: `${date}T${newTime}`,
                          endTime: format(addMinutes(parseISO(`${date}T${newTime}`), prev.duration), 'yyyy-MM-dd\'T\'HH:mm')
                        }));
                      }}
                      className="w-full px-4 py-3 bg-base-100 border-2 border-primary/30 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      {timeSlots.map(slot => (
                        <option key={slot.time} value={slot.time} disabled={slot.disabled}>
                          {slot.display} {slot.disabled ? '(Past)' : ''}
                        </option>
                      ))}
                    </select>
                    {isToday(parseISO(formData.startTime || format(new Date(), 'yyyy-MM-dd'))) && (
                      <p className="text-xs text-base-content/60 mt-2">Past times are disabled for today</p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-semibold text-base-content mb-2 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      Duration <span className="text-error">*</span>
                    </label>
                    <select
                      value={formData.duration}
                      onChange={handleDurationChange}
                      className="w-full px-4 py-3 bg-base-100 border-2 border-primary/30 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all appearance-none"
                    >
                      {durationOptions.map(duration => (
                        <option key={duration} value={duration}>
                          {duration} minute{duration !== 1 ? 's' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* End Time Display */}
                  {formData.startTime && formData.endTime && (
                    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-4">
                      <p className="text-xs text-base-content/60 mb-2 font-medium uppercase tracking-wide">End Time</p>
                      <p className="text-lg font-bold text-base-content">
                        {format(parseISO(formData.endTime), 'h:mm a')}
                      </p>
                      <p className="text-xs text-base-content/50 mt-1">
                        {format(parseISO(formData.endTime), 'MMM d, yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Meeting Type */}
              <div>
                <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Meeting Type
                </label>
                <select
                  name="meetingType"
                  value={formData.meetingType}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  <option>Video Call</option>
                  <option>Phone Call</option>
                  <option>In Person</option>
                </select>
              </div>

              {/* Location - Only show for In Person meetings */}
              {formData.meetingType === 'In Person' && (
                <div>
                  <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
                    Meeting Location <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Coffee Shop, Library, Park"
                    className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Notes & Details
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional information about this appointment..."
                  rows="4"
                  className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                />
              </div>

              {/* Reminder */}
              <div>
                <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Reminder Notification
                </label>
                <select
                  name="reminder"
                  value={formData.reminder}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all"
                >
                  <option value={0}>No reminder</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
                <p className="text-xs text-base-content/60 mt-2">
                  Get notified before your appointment
                </p>
              </div>

              {/* Booking Information Summary */}
              {formData.startTime && formData.friendId && (
                <div className="bg-gradient-to-br from-success/10 via-base-200/50 to-success/5 border-2 border-success/30 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-base-content mb-6 flex items-center gap-2">
                    <span className="text-2xl">📋</span>
                    Appointment Overview
                  </h4>
                  <div className="space-y-4">
                    {/* Title */}
                    {formData.title && (
                      <div className="pb-4 border-b border-success/20">
                        <p className="text-xs text-base-content/60 font-semibold uppercase mb-1 tracking-wide">Title</p>
                        <p className="text-base font-bold text-base-content">{formData.title}</p>
                      </div>
                    )}

                    {/* Date & Time Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-base-100/70 rounded-lg p-3">
                        <p className="text-xs text-base-content/60 font-semibold mb-1">📅 Date</p>
                        <p className="text-sm font-bold text-base-content">{format(parseISO(formData.startTime), 'MMM d, yyyy')}</p>
                      </div>
                      <div className="bg-base-100/70 rounded-lg p-3">
                        <p className="text-xs text-base-content/60 font-semibold mb-1">⏰ Time</p>
                        <p className="text-sm font-bold text-base-content">{format(parseISO(formData.startTime), 'h:mm a')} - {format(parseISO(formData.endTime), 'h:mm a')}</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="bg-base-100/70 rounded-lg p-3">
                      <p className="text-xs text-base-content/60 font-semibold mb-1">⌛ Duration</p>
                      <p className="text-sm font-bold text-base-content">{formData.duration} minute{formData.duration !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Meeting Type & Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-base-100/70 rounded-lg p-3">
                        <p className="text-xs text-base-content/60 font-semibold mb-1">📞 Type</p>
                        <p className="text-sm font-bold text-base-content">{formData.meetingType}</p>
                      </div>
                      {formData.meetingType === 'In Person' && formData.location && (
                        <div className="bg-base-100/70 rounded-lg p-3">
                          <p className="text-xs text-base-content/60 font-semibold mb-1">📍 Location</p>
                          <p className="text-sm font-bold text-base-content truncate">{formData.location}</p>
                        </div>
                      )}
                    </div>

                    {/* With Whom */}
                    {formData.friendId && (
                      <div className="bg-gradient-to-r from-primary/20 to-primary/10 rounded-lg p-3 border border-primary/30">
                        <p className="text-xs text-base-content/60 font-semibold mb-2">👥 With</p>
                        <p className="text-sm font-bold text-base-content">{friends.find(f => f._id === formData.friendId)?.fullName || 'Selected friend'}</p>
                      </div>
                    )}

                    {/* Reminder */}
                    {formData.reminder > 0 && (
                      <div className="bg-warning/10 rounded-lg p-3 border border-warning/20">
                        <p className="text-xs text-base-content/60 font-semibold mb-1">🔔 Reminder</p>
                        <p className="text-sm font-bold text-base-content">
                          {formData.reminder === 1440 ? '1 day before' :
                           formData.reminder === 120 ? '2 hours before' :
                           formData.reminder === 60 ? '1 hour before' :
                           `${formData.reminder} minutes before`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-4 pt-6 border-t-2 border-base-300">
                {appointment && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowCancellation(true)}
                    className="px-6 py-3 bg-error/20 hover:bg-error/30 text-error font-semibold rounded-xl transition-all border-2 border-error/30"
                  >
                    Cancel Appointment
                  </button>
                )}
                <div className="flex-1 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-xl transition-all"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
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
  <div className="p-8 space-y-8">
    <div className="bg-gradient-to-br from-error/20 to-error/5 border-2 border-error/30 rounded-2xl p-6">
      <p className="text-error-content text-sm font-medium flex items-start gap-3">
        <span className="text-xl flex-shrink-0">⚠</span>
        <span>Cancelling this appointment will notify the other person. Please provide a reason for accountability.</span>
      </p>
    </div>

    <div>
      <label className="block text-sm font-semibold text-base-content mb-4 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
        Reason for Cancellation <span className="text-error">*</span>
      </label>
      <div className="space-y-3">
        {CANCELLATION_REASONS.map((reason) => (
          <label key={reason} className="flex items-center gap-3 p-3 rounded-xl hover:bg-base-200/50 cursor-pointer transition group">
            <input
              type="radio"
              name="cancellation"
              value={reason}
              checked={cancellationReason === reason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="radio radio-primary"
            />
            <span className="text-sm font-medium text-base-content group-hover:text-primary transition">
              {reason}
            </span>
          </label>
        ))}
      </div>
    </div>

    {cancellationReason === 'Other (Please specify)' && (
      <div>
        <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          Please explain your reason
        </label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Enter your cancellation reason..."
          rows="4"
          className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
        />
      </div>
    )}

    <div className="flex gap-4 pt-6 border-t-2 border-base-300">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-xl transition-all"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-error to-error/80 hover:from-error/90 hover:to-error/70 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
      >
        Confirm Cancellation
      </button>
    </div>
  </div>
);

// Decline Form Component
const DeclineForm = ({ declineMessage, setDeclineMessage, onCancel, onSubmit }) => (
  <div className="p-8 space-y-8">
    <div className="bg-gradient-to-br from-warning/20 to-warning/5 border-2 border-warning/30 rounded-2xl p-6">
      <p className="text-warning-content text-sm font-medium flex items-start gap-3">
        <span className="text-xl flex-shrink-0">ℹ</span>
        <span>Declining this appointment will notify the requester. Please provide a reason in your message.</span>
      </p>
    </div>

    <div>
      <label className="block text-sm font-semibold text-base-content mb-3 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
        Message <span className="text-error">*</span>
      </label>
      <textarea
        value={declineMessage}
        onChange={(e) => setDeclineMessage(e.target.value)}
        placeholder="Explain why you're declining this appointment..."
        rows="6"
        className="w-full px-4 py-3 bg-base-200 border-2 border-base-300 rounded-xl text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
      />
    </div>

    <div className="flex gap-4 pt-6 border-t-2 border-base-300">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-base-200 hover:bg-base-300 text-base-content font-semibold rounded-xl transition-all"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-warning-content font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
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
