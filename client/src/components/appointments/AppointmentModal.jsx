import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isBefore, isToday, addMinutes } from 'date-fns';
import { X, Clock, User, MessageSquare, Calendar, ChevronDown } from 'lucide-react';
import AvailabilityInfo from '../AvailabilityInfo';
import { getUserAvailability } from '../../lib/api';
import toast from 'react-hot-toast';

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
  initialFriendId = null,
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
  currentUserStatus = 'available',
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
  const [selectedFriendAvailability, setSelectedFriendAvailability] = useState(null);
  const [loadingFriendAvailability, setLoadingFriendAvailability] = useState(false);
  const [step, setStep] = useState(1); // 1: Form, 2: Review/Summary

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
          friendId: initialFriendId || '',
          friendSearch: '',
          showFriendDropdown: false,
          meetingType: 'Video Call',
          duration: 30,
          location: '',
          reminder: 15,
        });
      }
    }
  }, [appointment, initialDate, initialTime, initialFriendId, isOpen]);

  // Fetch selected friend's availability when friendId changes
  useEffect(() => {
    if (formData.friendId) {
      setLoadingFriendAvailability(true);
      const selectedFriend = friends.find(f => f._id === formData.friendId);
      
      if (selectedFriend) {
        // Fetch friend's availability from API
        getUserAvailability(selectedFriend._id)
          .then(data => {
            setSelectedFriendAvailability(data);
            setLoadingFriendAvailability(false);
          })
          .catch(error => {
            console.error('Failed to fetch friend availability:', error);
            setSelectedFriendAvailability(null);
            setLoadingFriendAvailability(false);
          });
      }
    } else {
      setSelectedFriendAvailability(null);
    }
  }, [formData.friendId, friends]);

  const generateTimeSlots = useMemo(() => {
    const slots = [];
    
    // Use selected friend's availability if available, otherwise use current user's availability
    const effectiveAvailability = selectedFriendAvailability?.availability || availability;
    
    // Guard against undefined availability
    if (!effectiveAvailability || !effectiveAvailability.start || !effectiveAvailability.end) {
      return slots;
    }
    
    const [startHour, startMin] = effectiveAvailability.start.split(':').map(Number);
    const [endHour, endMin] = effectiveAvailability.end.split(':').map(Number);
    const duration = effectiveAvailability.slotDuration || 30;
    const appointmentDuration = effectiveAvailability.appointmentDuration?.max || 60;
    const minLeadTime = effectiveAvailability.minLeadTime || 0; // in hours
    const breakTimes = effectiveAvailability.breakTimes || [];
    const now = new Date();

    // Parse the selected date from formData
    let selectedDate = new Date();
    if (formData.startTime) {
      try {
        selectedDate = parseISO(formData.startTime);
      } catch (e) {
        selectedDate = initialDate ? new Date(initialDate) : new Date();
      }
    } else if (initialDate) {
      selectedDate = new Date(initialDate);
    }

    const isSelectedToday = isToday(selectedDate);

    // Create time slots for the selected date
    let current = new Date(selectedDate);
    current.setHours(startHour, startMin, 0, 0);
    
    let end = new Date(selectedDate);
    end.setHours(endHour, endMin, 0, 0);

    // Check if appointment would fit within available time
    const appointmentEndTime = addMinutes(current, appointmentDuration);

    while (current < end) {
      const slotTime24 = format(current, 'HH:mm');
      const slotTime12 = format(current, 'h:mm a');
      
      // Check if appointment fits within available hours
      const slotEndTime = addMinutes(current, appointmentDuration);
      const fitsInAvailableTime = slotEndTime <= end;
      
      // Check if time is in the past
      const isPast = isSelectedToday && isBefore(current, now);
      
      // Check if meets minimum lead time requirement
      let meetsLeadTime = true;
      if (minLeadTime > 0 && isSelectedToday) {
        const leadTimeDeadline = addMinutes(now, minLeadTime * 60);
        meetsLeadTime = !isBefore(current, leadTimeDeadline);
      }
      
      // Check if in break time
      let isInBreakTime = false;
      const slotTimeStr = slotTime24;
      for (const breakTime of breakTimes) {
        const [bStartHour, bStartMin] = breakTime.start.split(':').map(Number);
        const [bEndHour, bEndMin] = breakTime.end.split(':').map(Number);
        const breakStart = new Date(selectedDate);
        breakStart.setHours(bStartHour, bStartMin, 0, 0);
        const breakEnd = new Date(selectedDate);
        breakEnd.setHours(bEndHour, bEndMin, 0, 0);
        
        if (current >= breakStart && current < breakEnd) {
          isInBreakTime = true;
          break;
        }
      }
      
      const isDisabled = isPast || !fitsInAvailableTime || !meetsLeadTime || isInBreakTime;
      
      let disabledReason = '';
      if (isPast) disabledReason = '(Past)';
      else if (!fitsInAvailableTime) disabledReason = '(Too late)';
      else if (!meetsLeadTime) disabledReason = `(Need ${minLeadTime}h notice)`;
      else if (isInBreakTime) disabledReason = '(Break time)';
      
      slots.push({ 
        time: slotTime24, 
        display: slotTime12, 
        disabled: isDisabled,
        reason: disabledReason
      });
      current = addMinutes(current, duration);
    }

    return slots;
  }, [availability, formData.startTime, initialDate, selectedFriendAvailability, formData.duration]);

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
    
    // Check if current user is away
    if (currentUserStatus === 'away') {
      toast.error('You are currently away and cannot schedule appointments. Please change your status to continue.');
      return;
    }
    
    if (!formData.title.trim()) {
      toast.error('Please enter an appointment title');
      return;
    }

    if (!formData.startTime) {
      toast.error('Please select a start time');
      return;
    }

    if (!formData.friendId) {
      toast.error('Please select a friend');
      return;
    }

    // Check if selected friend is away
    const selectedFriend = friends.find(f => f._id === formData.friendId);
    const friendStatus = friendsAvailability[selectedFriend?._id] || 'available';
    
    if (friendStatus === 'away') {
      toast.error('This friend is currently away and not accepting bookings');
      return;
    }

    // Get friend's availability for constraint validation
    const friendAvail = selectedFriendAvailability?.availability;
    
    // Validate location for in-person appointments
    if (formData.meetingType === 'In Person' && !formData.location.trim()) {
      toast.error('Please enter a location for in-person appointments');
      return;
    }

    // Validate that the appointment is not in the past
    const startDateTime = parseISO(formData.startTime);
    const endDateTime = parseISO(formData.endTime);
    const now = new Date();
    
    if (isBefore(startDateTime, now)) {
      toast.error('Cannot schedule an appointment in the past');
      return;
    }

    // Constraint: Check minimum lead time
    if (friendAvail && friendAvail.minLeadTime > 0) {
      const leadTimeDeadline = addMinutes(now, friendAvail.minLeadTime * 60);
      if (isBefore(startDateTime, leadTimeDeadline)) {
        toast.error(`This friend requires ${friendAvail.minLeadTime} hour${friendAvail.minLeadTime > 1 ? 's' : ''} advance notice`);
        return;
      }
    }

    // Constraint: Check appointment fits within available hours
    if (friendAvail && friendAvail.start && friendAvail.end) {
      const [endHour, endMin] = friendAvail.end.split(':').map(Number);
      const availEndTime = new Date(startDateTime);
      availEndTime.setHours(endHour, endMin, 0, 0);
      
      if (isBefore(availEndTime, endDateTime)) {
        toast.error(`Appointment extends past available time (${friendAvail.end})`);
        return;
      }
    }

    // Constraint: Check against break times
    if (friendAvail && friendAvail.breakTimes && friendAvail.breakTimes.length > 0) {
      for (const breakTime of friendAvail.breakTimes) {
        const [bStartHour, bStartMin] = breakTime.start.split(':').map(Number);
        const [bEndHour, bEndMin] = breakTime.end.split(':').map(Number);
        
        const breakStart = new Date(startDateTime);
        breakStart.setHours(bStartHour, bStartMin, 0, 0);
        const breakEnd = new Date(startDateTime);
        breakEnd.setHours(bEndHour, bEndMin, 0, 0);
        
        // Check if appointment overlaps with break time
        if (isBefore(startDateTime, breakEnd) && isBefore(breakStart, endDateTime)) {
          toast.error(`Appointment conflicts with break time (${breakTime.start} - ${breakTime.end})`);
          return;
        }
      }
    }

    // Constraint: Check appointment duration constraints
    if (friendAvail && friendAvail.appointmentDuration) {
      const minDuration = friendAvail.appointmentDuration.min || 15;
      const maxDuration = friendAvail.appointmentDuration.max || 120;
      
      if (formData.duration < minDuration) {
        toast.error(`Minimum appointment duration is ${minDuration} minutes`);
        return;
      }
      if (formData.duration > maxDuration) {
        toast.error(`Maximum appointment duration is ${maxDuration} minutes`);
        return;
      }
    }

    // All validations passed, move to summary step
    setStep(2);
  };

  const handleConfirmAppointment = () => {
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
    setStep(1);
  };

  const handleCancelAppointment = () => {
    if (!cancellationReason) {
      toast.error('Please select a cancellation reason');
      return;
    }

    const finalReason = cancellationReason === 'Other (Please specify)' 
      ? customReason 
      : cancellationReason;

    if (!finalReason.trim()) {
      toast.error('Please provide a reason');
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
      toast.error('Please provide a reason for declining');
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
          <div className="sticky top-0 z-40 bg-gradient-to-r from-base-100 via-base-100 to-base-200/50 border-b-2 border-base-300/60 px-8 py-7 flex items-center justify-between backdrop-blur-sm">
            <div className="flex-1">
              <div className="flex items-center gap-5 mb-3">
                <h2 className="text-4xl font-black text-base-content">
                  {showCancellation 
                    ? 'Cancel Appointment' 
                    : showDeclineForm 
                    ? 'Decline Appointment' 
                    : appointment ? 'Edit Appointment' : 'New Appointment'}
                </h2>
                {!showCancellation && !showDeclineForm && (
                  <div className="flex items-center gap-3 ml-6 px-4 py-2 bg-primary/5 rounded-full border border-primary/20">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs transition-all ${step === 1 ? 'bg-primary text-white shadow-lg' : 'bg-base-300 text-base-content/50'}`}>
                      1
                    </div>
                    <span className={`text-xs font-semibold transition-colors ${step === 1 ? 'text-primary' : 'text-base-content/40'}`}>Details</span>
                    <span className={`transition-colors ${step === 1 ? 'text-primary/50' : 'text-base-content/20'}`}>→</span>
                    <div className={`flex items-center justify-center w-7 h-7 rounded-full font-bold text-xs transition-all ${step === 2 ? 'bg-primary text-white shadow-lg' : 'bg-base-300 text-base-content/50'}`}>
                      2
                    </div>
                    <span className={`text-xs font-semibold transition-colors ${step === 2 ? 'text-primary' : 'text-base-content/40'}`}>Review</span>
                  </div>
                )}
              </div>
              {appointment && !showCancellation && !showDeclineForm && (
                <p className="text-xs text-base-content/40 mt-2 font-mono tracking-wide">
                  ID: {appointment._id?.slice(-8) || 'N/A'}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2.5 hover:bg-base-300/80 rounded-lg transition-all text-base-content/50 hover:text-base-content hover:shadow-sm ml-4"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content */}
          {!showCancellation && !showDeclineForm ? (
            step === 1 ? (
              // STEP 1: Form Entry
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Away Status Warning */}
              {currentUserStatus === 'away' && (
                <div className="p-5 bg-gradient-to-r from-error/15 to-error/10 border-2 border-error/30 rounded-xl shadow-sm">
                  <p className="text-error font-bold flex items-start gap-3">
                    <span className="text-2xl flex-shrink-0">✕</span>
                    <span>
                      <div className="font-bold mb-1">You Are Currently Away</div>
                      <div className="text-sm font-semibold">
                        You cannot schedule appointments while your status is "Away". Please update your availability status to create appointments.
                      </div>
                    </span>
                  </p>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"></span>
                  Appointment Title <span className="text-error ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Project Discussion, Language Lesson"
                  className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content placeholder-base-content/35 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm hover:border-base-300/80"
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
                                ? 'opacity-60 cursor-not-allowed bg-error/5 hover:bg-error/5'
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
                  <div className="mt-5 space-y-4">
                    {/* Away Status Warning */}
                    {(() => {
                      const selectedFriend = friends.find(f => f._id === formData.friendId);
                      const friendStatus = friendsAvailability[selectedFriend?._id] || 'available';
                      
                      if (friendStatus === 'away') {
                        return (
                          <div className="p-4 bg-gradient-to-r from-error/15 to-error/10 border-2 border-error/30 rounded-xl shadow-sm">
                            <p className="text-error font-bold flex items-start gap-3">
                              <span className="text-xl flex-shrink-0">✕</span>
                              <span>
                                <div className="font-bold mb-1">Unable to Schedule</div>
                                <div className="text-sm font-semibold">
                                  This friend is currently away and not accepting new appointments. Please try again when they become available.
                                </div>
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Friend Profile Card */}
                    <div className="p-5 bg-gradient-to-br from-primary/8 to-primary/3 rounded-xl border-2 border-primary/25 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
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

                    {/* Friend's Availability Info */}
                    {(() => {
                      const selectedFriend = friends.find(f => f._id === formData.friendId);
                      if (!selectedFriend) return null;

                      // Use the fetched availability data
                      const friendStatus = friendsAvailability[selectedFriend._id] || 'available';

                      if (loadingFriendAvailability) {
                        return (
                          <div className="p-4 bg-base-200/50 rounded-xl animate-pulse">
                            <div className="h-20 bg-base-300 rounded"></div>
                          </div>
                        );
                      }

                      return (
                        <AvailabilityInfo 
                          availability={selectedFriendAvailability?.availability || {}} 
                          availabilityStatus={selectedFriendAvailability?.availabilityStatus || friendStatus}
                        />
                      );
                    })()}
                  </div>
                )}
              </div>

              {/* Date and Time Section */}
              <div className="bg-gradient-to-br from-primary/4 via-base-100 to-base-100/80 rounded-2xl p-7 border-2 border-primary/15 shadow-sm">
                <h3 className="text-lg font-bold text-base-content mb-7 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  Schedule Details
                </h3>

                <div className="space-y-6">
                  {/* Date Picker */}
                  <div>
                    <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"></span>
                      Date <span className="text-error ml-1">*</span>
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
                      className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm hover:border-base-300/80"
                    />
                    <p className="text-xs text-base-content/50 mt-2.5 font-medium">Choose your preferred date</p>
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"></span>
                      Time <span className="text-error ml-1">*</span>
                    </label>
                    <div className="space-y-3">
                      {/* Custom Time Button at Top */}
                      <button
                        type="button"
                        onClick={() => {
                          const date = formData.startTime.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                          setFormData(prev => ({
                            ...prev,
                            startTime: `${date}Tcustom`,
                          }));
                        }}
                        className={`w-full px-5 py-3.5 rounded-xl font-bold transition-all border-2 shadow-sm ${
                          formData.startTime.split('T')[1] === 'custom'
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-white border-primary shadow-lg'
                            : 'bg-base-50 text-base-content border-base-300/60 hover:border-primary/40 hover:bg-base-100'
                        }`}
                      >
                        ⚙ Enter Custom Time
                      </button>

                      {/* Suggested Times Grid - 2 columns */}
                      <div className="grid grid-cols-2 gap-2.5">
                        {timeSlots.map(slot => (
                          <button
                            key={slot.time}
                            type="button"
                            disabled={slot.disabled}
                            onClick={() => {
                              const date = formData.startTime.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                              setFormData(prev => ({
                                ...prev,
                                startTime: `${date}T${slot.time}`,
                                endTime: format(addMinutes(parseISO(`${date}T${slot.time}`), prev.duration), 'yyyy-MM-dd\'T\'HH:mm')
                              }));
                            }}
                            className={`px-3.5 py-3 rounded-lg font-semibold text-sm transition-all border-2 shadow-sm ${
                              formData.startTime.split('T')[1] === slot.time
                                ? 'bg-gradient-to-r from-primary to-primary/80 text-white border-primary shadow-md'
                                : slot.disabled
                                ? 'bg-base-200/60 text-base-content/35 border-base-300/50 cursor-not-allowed'
                                : 'bg-base-50 text-base-content border-base-300/60 hover:border-primary/40 hover:bg-base-100 hover:shadow-md'
                            }`}
                          >
                            <div className="text-xs font-bold">{slot.display}</div>
                            {slot.reason && <div className="text-xs opacity-60 font-medium">{slot.reason}</div>}
                          </button>
                        ))}
                      </div>

                      {/* Custom Time Input - Only show if "custom" is selected */}
                      {formData.startTime.split('T')[1] === 'custom' && (
                        <div className="border-t border-base-300 pt-3 space-y-3">
                          <label className="text-xs font-semibold text-base-content/70 mb-2 block">
                            Enter your preferred time:
                          </label>
                          <input
                            type="time"
                            value={formData.startTime.split('T')[2] || '09:00'}
                            onChange={(e) => {
                              const customTime = e.target.value;
                              const date = formData.startTime.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                              
                              // Validate custom time is within available hours
                              const effectiveAvailability = selectedFriendAvailability?.availability || availability;
                              if (effectiveAvailability && effectiveAvailability.start && effectiveAvailability.end) {
                                const [availStartHour, availStartMin] = effectiveAvailability.start.split(':').map(Number);
                                const [availEndHour, availEndMin] = effectiveAvailability.end.split(':').map(Number);
                                const [customHour, customMin] = customTime.split(':').map(Number);
                                
                                const availStartInMinutes = availStartHour * 60 + availStartMin;
                                const availEndInMinutes = availEndHour * 60 + availEndMin;
                                const customInMinutes = customHour * 60 + customMin;
                                
                                if (customInMinutes >= availStartInMinutes && customInMinutes < availEndInMinutes) {
                                  setFormData(prev => ({
                                    ...prev,
                                    startTime: `${date}T${customTime}`,
                                    endTime: format(addMinutes(parseISO(`${date}T${customTime}`), prev.duration), 'yyyy-MM-dd\'T\'HH:mm')
                                  }));
                                } else {
                                  toast.error(`Time must be between ${effectiveAvailability.start} and ${effectiveAvailability.end}`);
                                }
                              }
                            }}
                            className="w-full px-4 py-3 bg-base-100 border-2 border-primary/30 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                          />
                          <p className="text-xs text-base-content/50">
                            Available: {(selectedFriendAvailability?.availability || availability)?.start || '09:00'} - {(selectedFriendAvailability?.availability || availability)?.end || '17:00'}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              const date = formData.startTime.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                              setFormData(prev => ({
                                ...prev,
                                startTime: `${date}T`,
                              }));
                            }}
                            className="w-full px-4 py-3 bg-base-200 text-base-content border-2 border-base-300 rounded-xl font-semibold hover:bg-base-300 transition-all"
                          >
                            ← Back to Suggested Times
                          </button>
                        </div>
                      )}
                    </div>
                    {isToday(parseISO(formData.startTime || format(new Date(), 'yyyy-MM-dd'))) && (
                      <p className="text-xs text-base-content/60 mt-3 bg-warning/10 border border-warning/30 rounded-lg p-2">
                        ⏰ Some times may be disabled due to: past times, break times, or minimum lead time requirement
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
                      <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"></span>
                      Duration <span className="text-error ml-1">*</span>
                    </label>
                    <select
                      value={formData.duration}
                      onChange={handleDurationChange}
                      className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none shadow-sm hover:border-base-300/80"
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
                  className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm hover:border-base-300/80"
                >
                  <option>Video Call</option>
                  <option>Phone Call</option>
                  <option>In Person</option>
                </select>
              </div>

              {/* Location - Only show for In Person meetings */}
              {formData.meetingType === 'In Person' && (
                <div>
                  <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
                    <span className="w-2 h-2 rounded-full bg-error"></span>
                    Meeting Location <span className="text-error ml-1">*</span>
                  </label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="e.g., Coffee Shop, Library, Park"
                    className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content placeholder-base-content/35 focus:outline-none focus:border-error focus:ring-2 focus:ring-error/10 transition-all shadow-sm hover:border-base-300/80"
                  />
                </div>
              )}

              {/* Description */}
              <div>
                <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"></span>
                  Notes & Details
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Add any additional information about this appointment..."
                  rows="4"
                  className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content placeholder-base-content/35 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none shadow-sm hover:border-base-300/80"
                />
              </div>

              {/* Reminder */}
              <div>
                <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
                  <span className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-primary/70"></span>
                  Reminder Notification
                </label>
                <select
                  name="reminder"
                  value={formData.reminder}
                  onChange={handleChange}
                  className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all shadow-sm hover:border-base-300/80"
                >
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
                <p className="text-xs text-base-content/50 mt-2.5 font-medium">
                  Get notified before your appointment
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-7 border-t-2 border-base-300">
                {appointment && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowCancellation(true)}
                    className="px-6 py-3 bg-error/10 hover:bg-error/20 text-error font-bold rounded-xl transition-all border-2 border-error/30 shadow-sm"
                  >
                    Cancel Appointment
                  </button>
                )}
                <div className="flex-1 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-3 bg-base-200/70 hover:bg-base-300 text-base-content font-bold rounded-xl transition-all shadow-sm"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={currentUserStatus === 'away' || (formData.friendId && friendsAvailability[formData.friendId] === 'away')}
                    className="px-8 py-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-primary disabled:hover:to-primary/80"
                    title={currentUserStatus === 'away' ? 'You are away and cannot schedule appointments' : (formData.friendId && friendsAvailability[formData.friendId] === 'away' ? 'Cannot schedule with someone who is away' : '')}
                  >
                    Next →
                  </button>
                </div>
              </div>
            </form>
            ) : (
              // STEP 2: Review/Summary
              <div className="p-8 space-y-8">
                <div className="bg-gradient-to-br from-success/10 via-base-200/50 to-success/5 border-2 border-success/30 rounded-2xl p-6">
                  <h4 className="text-lg font-bold text-base-content mb-7 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-success to-success/60 flex items-center justify-center text-white font-bold">
                      ✓
                    </div>
                    Appointment Details
                  </h4>
                  <div className="space-y-4">
                    {/* Title */}
                    {formData.title && (
                      <div className="pb-4 border-b-2 border-success/20">
                        <p className="text-xs text-base-content/50 font-bold uppercase mb-2 tracking-wider">📋 Appointment Title</p>
                        <p className="text-xl font-bold text-base-content">{formData.title}</p>
                      </div>
                    )}

                    {/* Date & Time Info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-base-100 to-base-100/70 rounded-lg p-5 border-2 border-primary/15 shadow-sm">
                        <p className="text-xs text-base-content/50 font-bold mb-3 uppercase tracking-wider">📅 Date</p>
                        <p className="text-lg font-bold text-base-content">{format(parseISO(formData.startTime), 'MMM d, yyyy')}</p>
                        <p className="text-xs text-base-content/60 mt-2 font-semibold">{format(parseISO(formData.startTime), 'EEEE')}</p>
                      </div>
                      <div className="bg-gradient-to-br from-base-100 to-base-100/70 rounded-lg p-5 border-2 border-primary/15 shadow-sm">
                        <p className="text-xs text-base-content/50 font-bold mb-3 uppercase tracking-wider">⏰ Time</p>
                        <p className="text-lg font-bold text-base-content">{format(parseISO(formData.startTime), 'h:mm a')} - {format(parseISO(formData.endTime), 'h:mm a')}</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="bg-gradient-to-br from-base-100 to-base-100/70 rounded-lg p-5 border-2 border-primary/15 shadow-sm">
                      <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wider">⌛ Duration</p>
                      <p className="text-lg font-bold text-base-content">{formData.duration} minute{formData.duration !== 1 ? 's' : ''}</p>
                    </div>

                    {/* Meeting Type & Location */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gradient-to-br from-base-100 to-base-100/70 rounded-lg p-5 border-2 border-primary/15 shadow-sm">
                        <p className="text-xs text-base-content/50 font-bold mb-3 uppercase tracking-wider">📞 Type</p>
                        <p className="text-lg font-bold text-base-content">{formData.meetingType}</p>
                      </div>
                      {formData.meetingType === 'In Person' && formData.location && (
                        <div className="bg-gradient-to-br from-base-100 to-base-100/70 rounded-lg p-5 border-2 border-primary/15 shadow-sm">
                          <p className="text-xs text-base-content/50 font-bold mb-3 uppercase tracking-wider">📍 Location</p>
                          <p className="text-lg font-bold text-base-content truncate">{formData.location}</p>
                        </div>
                      )}
                    </div>

                    {/* With Whom */}
                    {formData.friendId && (
                      <div className="bg-gradient-to-r from-primary/8 to-primary/3 rounded-lg p-5 border-2 border-primary/20 shadow-sm">
                        <p className="text-xs text-base-content/50 font-bold mb-3 uppercase tracking-wider">👥 Scheduled With</p>
                        <p className="text-lg font-bold text-base-content">{friends.find(f => f._id === formData.friendId)?.fullName || 'Selected friend'}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {formData.description && (
                      <div className="bg-gradient-to-br from-base-100 to-base-100/70 rounded-lg p-5 border-2 border-primary/15 shadow-sm">
                        <p className="text-xs text-base-content/50 font-bold mb-3 uppercase tracking-wider">📝 Notes</p>
                        <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">{formData.description}</p>
                      </div>
                    )}

                    {/* Reminder */}
                    {formData.reminder > 0 && (
                      <div className="bg-gradient-to-r from-warning/10 to-warning/5 rounded-lg p-5 border-2 border-warning/25 shadow-sm">
                        <p className="text-xs text-base-content/50 font-bold mb-3 uppercase tracking-wider">🔔 Reminder</p>
                        <p className="text-lg font-bold text-base-content">
                          {formData.reminder === 1440 ? '1 day before' :
                           formData.reminder === 120 ? '2 hours before' :
                           formData.reminder === 60 ? '1 hour before' :
                           `${formData.reminder} minutes before`}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-7 border-t-2 border-base-300">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-6 py-3 bg-base-200/70 hover:bg-base-300 text-base-content font-bold rounded-xl transition-all shadow-sm"
                  >
                    ← Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAppointment}
                    className="flex-1 px-8 py-3 bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
                  >
                    ✓ Confirm & Create
                  </button>
                </div>
              </div>
            )
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
    <div className="bg-gradient-to-br from-error/10 to-error/5 border-2 border-error/25 rounded-2xl p-6 shadow-sm">
      <p className="text-base-content text-sm font-semibold flex items-start gap-3">
        <span className="text-xl flex-shrink-0">⚠️</span>
        <span>Cancelling this appointment will notify the other person. Please select a reason for cancellation.</span>
      </p>
    </div>

    <div>
      <label className="block text-sm font-bold text-base-content mb-4 flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-error"></span>
        Cancellation Reason <span className="text-error ml-1">*</span>
      </label>
      <div className="space-y-2.5">
        {CANCELLATION_REASONS.map((reason) => (
          <label key={reason} className="flex items-center gap-3 p-4 rounded-xl hover:bg-base-100 cursor-pointer transition group border-2 border-transparent hover:border-error/20 shadow-sm">
            <input
              type="radio"
              name="cancellation"
              value={reason}
              checked={cancellationReason === reason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="radio radio-error"
            />
            <span className="text-sm font-semibold text-base-content group-hover:text-error transition">
              {reason}
            </span>
          </label>
        ))}
      </div>
    </div>

    {cancellationReason === 'Other (Please specify)' && (
      <div>
        <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-primary"></span>
          Explain Your Reason
        </label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Enter your cancellation reason..."
          rows="4"
          className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content placeholder-base-content/35 focus:outline-none focus:border-error focus:ring-2 focus:ring-error/10 transition-all resize-none shadow-sm hover:border-base-300/80"
        />
      </div>
    )}
    <div className="flex gap-4 pt-7 border-t-2 border-base-300">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-base-200/70 hover:bg-base-300 text-base-content font-bold rounded-xl transition-all shadow-sm"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-error to-error/80 hover:from-error/90 hover:to-error/70 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
      >
        Confirm Cancellation
      </button>
    </div>
  </div>
);

// Decline Form Component
const DeclineForm = ({ declineMessage, setDeclineMessage, onCancel, onSubmit }) => (
  <div className="p-8 space-y-8">
    <div className="bg-gradient-to-br from-warning/10 to-warning/5 border-2 border-warning/25 rounded-2xl p-6 shadow-sm">
      <p className="text-base-content text-sm font-semibold flex items-start gap-3">
        <span className="text-xl flex-shrink-0">ℹ️</span>
        <span>Declining this appointment will notify the requester. Please provide a clear reason in your message.</span>
      </p>
    </div>

    <div>
      <label className="block text-sm font-bold text-base-content mb-3 flex items-center gap-2.5">
        <span className="w-2 h-2 rounded-full bg-warning"></span>
        Your Message <span className="text-error ml-1">*</span>
      </label>
      <textarea
        value={declineMessage}
        onChange={(e) => setDeclineMessage(e.target.value)}
        placeholder="Explain why you're declining this appointment..."
        rows="6"
        className="w-full px-5 py-3.5 bg-base-50 border-2 border-base-300/60 rounded-xl text-base-content placeholder-base-content/35 focus:outline-none focus:border-warning focus:ring-2 focus:ring-warning/10 transition-all resize-none shadow-sm hover:border-base-300/80"
      />
    </div>

    <div className="flex gap-4 pt-7 border-t-2 border-base-300">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-6 py-3 bg-base-200/70 hover:bg-base-300 text-base-content font-bold rounded-xl transition-all shadow-sm"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-6 py-3 bg-gradient-to-r from-warning to-warning/80 hover:from-warning/90 hover:to-warning/70 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-xl"
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
  initialFriendId: PropTypes.string,
  friends: PropTypes.arrayOf(PropTypes.object),
  currentUser: PropTypes.object,
  availability: PropTypes.object,
  appointment: PropTypes.object,
  onDelete: PropTypes.func,
  onAccept: PropTypes.func,
  onDecline: PropTypes.func,
  friendsAvailability: PropTypes.object,
  currentUserStatus: PropTypes.oneOf(['available', 'limited', 'away']),
};

export default AppointmentModal;
