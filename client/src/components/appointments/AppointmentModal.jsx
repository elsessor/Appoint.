import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isBefore, isToday, addMinutes, isAfter } from 'date-fns';
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
  currentUser = null,
  appointments = [],
  selectedDate = null,
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
        // Validate initialDate is a valid Date object
        let dateStr = '';
        try {
          dateStr = format(initialDate, 'yyyy-MM-dd');
        } catch (e) {
          dateStr = format(new Date(), 'yyyy-MM-dd');
        }
        
        // Validate initialTime before formatting
        let timeStr = '09:00';
        if (initialTime instanceof Date) {
          try {
            timeStr = format(initialTime, 'HH:mm');
          } catch (e) {
            timeStr = '09:00';
          }
        }
        
        // Get the friend's name if initialFriendId is provided
        let friendSearchText = '';
        if (initialFriendId) {
          const selectedFriend = friends.find(f => f._id === initialFriendId);
          friendSearchText = selectedFriend?.fullName || selectedFriend?.name || '';
        }
        
        setFormData({
          title: '',
          description: '',
          startTime: `${dateStr}T${timeStr}`,
          endTime: `${dateStr}T${timeStr}`,
          friendId: initialFriendId || '',
          friendSearch: friendSearchText,
          showFriendDropdown: false,
          meetingType: 'Video Call',
          duration: 30,
          location: '',
          reminder: 15,
        });
      }
    }
  }, [appointment, initialDate, initialTime, initialFriendId, isOpen, friends]);

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
            
            // Set default time to friend's start availability, or current time if it has passed
            if (data?.availability?.start && formData.startTime) {
              const dateStr = formData.startTime.split('T')[0];
              const friendStartTime = data.availability.start;
              const slotDuration = data.availability.slotDuration || 30;
              const isSelectedToday = isToday(parseISO(`${dateStr}T00:00`));
              
              let defaultTime = friendStartTime;
              
              // If it's today, check if friend's start time has already passed
              if (isSelectedToday) {
                const now = new Date();
                const currentTimeStr = format(now, 'HH:mm');
                const friendStartMinutes = parseInt(friendStartTime.split(':')[0]) * 60 + parseInt(friendStartTime.split(':')[1]);
                const currentMinutes = parseInt(currentTimeStr.split(':')[0]) * 60 + parseInt(currentTimeStr.split(':')[1]);
                
                // If friend's start time has passed, use current time rounded to next slot
                if (currentMinutes > friendStartMinutes) {
                  // Round current time to the next slot boundary
                  const remainder = currentMinutes % slotDuration;
                  let roundedMinutes = currentMinutes;
                  if (remainder > 0) {
                    roundedMinutes = currentMinutes + (slotDuration - remainder);
                  }
                  const roundedHours = Math.floor(roundedMinutes / 60);
                  const roundedMins = roundedMinutes % 60;
                  defaultTime = `${String(roundedHours).padStart(2, '0')}:${String(roundedMins).padStart(2, '0')}`;
                }
              }
              
              // Use formData.duration for end time calculation (the selected duration in the form)
              setFormData(prev => ({
                ...prev,
                startTime: `${dateStr}T${defaultTime}`,
                endTime: format(addMinutes(parseISO(`${dateStr}T${defaultTime}`), prev.duration), 'yyyy-MM-dd\'T\'HH:mm')
              }));
            }
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

  // ✅ Get appointments for the selected date AND selected friend (MUST be before generateTimeSlots)
  const selectedDateAppointments = useMemo(() => {
    if (!formData.startTime || !formData.friendId || appointments.length === 0) return [];
    
    try {
      const selectedDateStr = formData.startTime.split('T')[0];
      return appointments.filter(appt => {
        if (!appt.startTime) return false;
        
        // Match date
        const apptDateStr = typeof appt.startTime === 'string' 
          ? appt.startTime.split('T')[0]
          : format(new Date(appt.startTime), 'yyyy-MM-dd');
        
        if (apptDateStr !== selectedDateStr) return false;
        
        // Match friend - check if this appointment involves the selected friend
        const apptUserId = appt.userId?._id || appt.userId;
        const apptFriendId = appt.friendId?._id || appt.friendId;
        
        return apptFriendId === formData.friendId || apptUserId === formData.friendId;
      });
    } catch (e) {
      return [];
    }
  }, [formData.startTime, formData.friendId, appointments]);

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
    const appointmentDuration = formData.duration || 30; // Use selected duration, not max from backend
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

      // ✅ NEW: Check if this time slot is booked
      let isBooked = false;
      if (formData.friendId && selectedDateAppointments.length > 0) {
        isBooked = selectedDateAppointments.some(appt => {
          const apptStart = typeof appt.startTime === 'string' 
            ? parseISO(appt.startTime)
            : new Date(appt.startTime);
          const apptEnd = typeof appt.endTime === 'string'
            ? parseISO(appt.endTime)
            : new Date(appt.endTime);
          
          const slotStart = new Date(current);
          const slotEnd = addMinutes(slotStart, appointmentDuration);
          
          // Check if slot overlaps with existing appointment
          return isBefore(slotStart, apptEnd) && isAfter(slotEnd, apptStart);
        });
      }
      
      const isDisabled = isPast || !fitsInAvailableTime || !meetsLeadTime || isInBreakTime || isBooked;
      
      let disabledReason = '';
      if (isPast) disabledReason = '(Past)';
      else if (!fitsInAvailableTime) disabledReason = '(Too late)';
      else if (!meetsLeadTime) disabledReason = `(Need ${minLeadTime}h notice)`;
      else if (isInBreakTime) disabledReason = '(Break time)';
      else if (isBooked) disabledReason = '(Booked)';
      
      slots.push({ 
        time: slotTime24, 
        display: slotTime12, 
        disabled: isDisabled,
        reason: disabledReason
      });
      current = addMinutes(current, duration);
    }

    return slots;
  }, [availability, formData.startTime, initialDate, selectedFriendAvailability, formData.duration, formData.friendId, selectedDateAppointments]);

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
    
    // Get current user ID for conflict checking
    const currentUserId = currentUser?._id || currentUser?.id;
    
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
      const [startHour, startMin] = friendAvail.start.split(':').map(Number);
      const [endHour, endMin] = friendAvail.end.split(':').map(Number);
      
      const availStartTime = new Date(startDateTime);
      availStartTime.setHours(startHour, startMin, 0, 0);
      
      const availEndTime = new Date(startDateTime);
      availEndTime.setHours(endHour, endMin, 0, 0);
      
      // Check if start time is before available start time
      if (isBefore(startDateTime, availStartTime)) {
        toast.error(`Appointment starts before available time (${friendAvail.start})`);
        return;
      }
      
      // Check if end time is after available end time
      if (isAfter(endDateTime, availEndTime)) {
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

    // ✅ DOUBLE-BOOKING PREVENTION: Check for appointment time conflicts
    // Check conflicts with selected friend's appointments
    const friendConflict = selectedDateAppointments.some(existingAppt => {
      const existingStart = typeof existingAppt.startTime === 'string' 
        ? parseISO(existingAppt.startTime)
        : new Date(existingAppt.startTime);
      const existingEnd = typeof existingAppt.endTime === 'string'
        ? parseISO(existingAppt.endTime)
        : new Date(existingAppt.endTime);
      
      // Skip declined/cancelled appointments
      if (['declined', 'cancelled'].includes(existingAppt.status)) return false;
      
      // Check if new appointment overlaps with existing appointment
      // Overlap occurs if: new start < existing end AND new end > existing start
      return isBefore(startDateTime, existingEnd) && isAfter(endDateTime, existingStart);
    });

    if (friendConflict) {
      toast.error('This time slot is already booked by this friend. Please choose a different time.');
      return;
    }

    // Also check current user's appointments on the same day to prevent double-booking themselves
    const currentUserConflict = appointments.some(existingAppt => {
      // Skip if this is an appointment between these two users (update scenario)
      const apptUserId = existingAppt.userId?._id || existingAppt.userId;
      const apptFriendId = existingAppt.friendId?._id || existingAppt.friendId;
      if ((apptUserId === currentUserId && apptFriendId === formData.friendId) ||
          (apptUserId === formData.friendId && apptFriendId === currentUserId)) {
        return false; // Skip - this is the appointment being edited
      }

      // Only check current user's appointments
      if (apptUserId !== currentUserId && apptFriendId !== currentUserId) return false;
      
      // Skip declined/cancelled appointments
      if (['declined', 'cancelled'].includes(existingAppt.status)) return false;

      if (!existingAppt.startTime) return false;
      
      try {
        const existingStart = typeof existingAppt.startTime === 'string' 
          ? parseISO(existingAppt.startTime)
          : new Date(existingAppt.startTime);
        const existingEnd = typeof existingAppt.endTime === 'string'
          ? parseISO(existingAppt.endTime)
          : new Date(existingAppt.endTime);
        
        // Check overlap
        return isBefore(startDateTime, existingEnd) && isAfter(endDateTime, existingStart);
      } catch (e) {
        return false;
      }
    });

    if (currentUserConflict) {
      toast.error('You already have another appointment at this time. Please choose a different time.');
      return;
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
      reminder: 15,
    });
    setStep(1);
    onClose();
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
          <div className="sticky top-0 z-40 bg-gradient-to-r from-base-100 via-base-100 to-base-200/30 border-b border-base-300/40 px-8 py-6 flex items-center justify-between backdrop-blur-md shadow-sm">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h2 className="text-3xl font-bold text-base-content">
                  {showCancellation 
                    ? 'Cancel Appointment' 
                    : showDeclineForm 
                    ? 'Decline Appointment' 
                    : appointment ? 'Edit Appointment' : 'New Appointment'}
                </h2>
              </div>
              
              {!showCancellation && !showDeclineForm && (
                <div className="flex items-center gap-2 mt-3">
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step === 1 ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-base-200/50 text-base-content/60 border border-base-300/30'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-primary text-white' : 'bg-base-300 text-base-content/40'}`}>
                      1
                    </span>
                    Details
                  </div>
                  <div className={`text-xs ${step === 1 ? 'text-primary/40' : 'text-base-content/20'}`}>→</div>
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${step === 2 ? 'bg-primary/15 text-primary border border-primary/30' : 'bg-base-200/50 text-base-content/60 border border-base-300/30'}`}>
                    <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-primary text-white' : 'bg-base-300 text-base-content/40'}`}>
                      2
                    </span>
                    Review
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-base-300/60 rounded-lg transition-all text-base-content/60 hover:text-base-content hover:shadow-sm ml-4 flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          {!showCancellation && !showDeclineForm ? (
            step === 1 ? (
              // STEP 1: Form Entry
            <form onSubmit={handleSubmit} className="p-8 space-y-8">
              {/* Away Status Warning */}
              {currentUserStatus === 'away' && (
                <div className="p-4 bg-error/10 border-l-4 border-error rounded-lg shadow-sm">
                  <p className="text-error font-semibold text-sm flex items-start gap-3">
                    <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
                    <span>
                      You are currently away and cannot schedule appointments. Please update your status to continue.
                    </span>
                  </p>
                </div>
              )}

              {/* Title */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-base-content uppercase tracking-wide flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Appointment Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Project Discussion, Language Lesson"
                  className="w-full px-4 py-3 bg-base-100 border border-base-300/50 rounded-lg text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                />
              </div>

              {/* Friend Selection */}
              <div className="space-y-3">
                <label className="block text-xs font-bold text-base-content uppercase tracking-wide flex items-center gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                  Schedule With
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search or select a friend..."
                    className="w-full px-4 py-3 bg-base-100 border border-base-300/50 rounded-lg text-base-content placeholder-base-content/40 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                    onChange={(e) => {
                      setFormData(prev => ({...prev, friendSearch: e.target.value}));
                    }}
                    onFocus={() => {
                      setFormData(prev => ({...prev, showFriendDropdown: true}));
                    }}
                    value={formData.friendSearch || ''}
                  />
                  {formData.showFriendDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300/50 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
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
                              setFormData(prev => ({
                                ...prev,
                                friendId: friend._id,
                                friendSearch: '',
                                showFriendDropdown: false,
                              }));
                            }}
                            className={`w-full px-4 py-2.5 text-left flex items-center gap-3 border-b border-base-200 last:border-b-0 transition text-sm ${
                              isAway
                                ? 'opacity-50 cursor-not-allowed bg-base-200/30 hover:bg-base-200/30'
                                : formData.friendId === friend._id
                                ? 'bg-primary/10 hover:bg-primary/15 cursor-pointer'
                                : 'hover:bg-base-200/50 cursor-pointer'
                            }`}
                          >
                            {friend.profilePic ? (
                              <img
                                src={friend.profilePic}
                                alt={friend.fullName}
                                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {(friend.fullName || friend.name || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-base-content text-xs truncate">
                                {friend.fullName || friend.name}
                              </p>
                              <p className="text-xs text-base-content/50 truncate">
                                {friend.email}
                              </p>
                            </div>
                            <span className={`badge badge-xs ${config.badge} gap-0.5 flex-shrink-0`}>
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
                  <div className="space-y-3 pt-2">
                    {/* Away Status Warning */}
                    {(() => {
                      const selectedFriend = friends.find(f => f._id === formData.friendId);
                      const friendStatus = friendsAvailability[selectedFriend?._id] || 'available';
                      
                      if (friendStatus === 'away') {
                        return (
                          <div className="p-4 bg-error/10 border-l-4 border-error rounded-lg shadow-sm">
                            <p className="text-error font-semibold text-sm flex items-start gap-3">
                              <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
                              <span>This friend is currently away and not accepting appointments.</span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Friend Profile Card */}
                    <div className="p-4 bg-base-100/50 rounded-lg border border-primary/20 flex items-center gap-3">
                      {(() => {
                        const selectedFriend = friends.find(f => f._id === formData.friendId);
                        if (!selectedFriend) return null;
                        
                        const friendStatus = friendsAvailability[selectedFriend._id] || 'available';
                        const statusConfig = {
                          available: { badge: 'badge-success', label: 'Available', icon: '✓' },
                          limited: { badge: 'badge-warning', label: 'Limited', icon: '⚠' },
                          away: { badge: 'badge-error', label: 'Away', icon: '✕' }
                        };
                        const config = statusConfig[friendStatus];

                        return (
                          <>
                            {selectedFriend.profilePic ? (
                              <img
                                src={selectedFriend.profilePic}
                                alt={selectedFriend.fullName}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0 text-sm">
                                {(selectedFriend.fullName || selectedFriend.name || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base-content text-sm">{selectedFriend.fullName || selectedFriend.name}</p>
                              <p className="text-xs text-base-content/60">{selectedFriend.email}</p>
                            </div>
                            <span className={`badge badge-sm ${config.badge} gap-0.5 flex-shrink-0`}>
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

                      const friendStatus = friendsAvailability[selectedFriend._id] || 'available';

                      if (loadingFriendAvailability) {
                        return (
                          <div className="p-4 bg-base-200/30 rounded-lg animate-pulse">
                            <div className="h-16 bg-base-300 rounded"></div>
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

              {/* SECTION 3: Schedule Details */}
              <div className="space-y-5 p-5 bg-base-100/40 rounded-lg border border-base-300/30">
                <div className="flex items-center gap-3 pb-3 border-b border-base-300/40">
                  <Calendar className="w-5 h-5 text-primary flex-shrink-0" />
                  <h3 className="text-sm font-bold text-base-content uppercase tracking-wide">Schedule Details</h3>
                </div>

                <div className="space-y-5">
                  {/* Date Picker */}
                  <div>
                    <label className="block text-xs font-bold text-base-content mb-2.5 uppercase tracking-wide">Date</label>
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
                      className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                    />
                  </div>

                  {/* Time Picker */}
                  <div>
                    <label className="block text-xs font-bold text-base-content mb-2.5 uppercase tracking-wide">Time</label>
                    <div className="space-y-2">
                      {/* Custom Time Button */}
                      <button
                        type="button"
                        onClick={() => {
                          const date = formData.startTime.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                          setFormData(prev => ({
                            ...prev,
                            startTime: `${date}Tcustom`,
                          }));
                        }}
                        className={`w-full px-4 py-2.5 rounded-lg font-semibold text-sm transition-all border ${
                          formData.startTime.split('T')[1] === 'custom'
                            ? 'bg-primary text-white border-primary shadow-sm'
                            : 'bg-base-100 text-base-content border-base-300/50 hover:border-primary/40 hover:bg-base-100/80'
                        }`}
                      >
                        ⚙ Enter Custom Time
                      </button>

                      {/* Suggested Times Grid - 2 columns */}
                      <div className="grid grid-cols-2 gap-2">
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
                            className={`px-3 py-2.5 rounded-lg font-semibold text-xs transition-all border ${
                              formData.startTime.split('T')[1] === slot.time
                                ? 'bg-primary text-white border-primary shadow-sm'
                                : slot.disabled
                                ? 'bg-base-200/50 text-base-content/40 border-base-300/40 cursor-not-allowed'
                                : 'bg-base-100 text-base-content border-base-300/50 hover:border-primary/40 hover:bg-base-100/80'
                            }`}
                          >
                            <div className="font-semibold">{slot.display}</div>
                            {slot.reason && <div className="text-xs opacity-60">{slot.reason}</div>}
                          </button>
                        ))}
                      </div>

                      {/* Custom Time Input */}
                      {formData.startTime.split('T')[1] === 'custom' && (
                        <div className="border-t border-base-300/40 pt-3 space-y-3 mt-3">
                          <label className="text-xs font-semibold text-base-content/70">Preferred Time:</label>
                          <input
                            type="time"
                            value={formData.startTime.split('T')[2] || '09:00'}
                            onChange={(e) => {
                              const customTime = e.target.value;
                              const date = formData.startTime.split('T')[0] || format(new Date(), 'yyyy-MM-dd');
                              
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
                                  toast.error('Time outside available hours');
                                }
                              }
                            }}
                            className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
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
                            className="w-full px-4 py-2 bg-base-200/50 text-base-content border border-base-300/40 rounded-lg font-semibold text-sm hover:bg-base-200 transition-all"
                          >
                            ← Back to Suggested
                          </button>
                        </div>
                      )}
                    </div>
                    {isToday(parseISO(formData.startTime || format(new Date(), 'yyyy-MM-dd'))) && (
                      <p className="text-xs text-base-content/60 mt-2.5 bg-warning/5 border border-warning/20 rounded-lg p-2">
                        ⏰ Some times may be disabled due to past times, breaks, or lead time requirements
                      </p>
                    )}
                  </div>

                  {/* Duration */}
                  <div>
                    <label className="block text-xs font-bold text-base-content mb-2.5 uppercase tracking-wide">Duration</label>
                    <select
                      value={formData.duration}
                      onChange={handleDurationChange}
                      className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none text-sm"
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
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                      <p className="text-xs text-base-content/60 mb-1 font-semibold uppercase tracking-wide">End Time</p>
                      <p className="text-base font-bold text-base-content">
                        {format(parseISO(formData.endTime), 'h:mm a')} • {format(parseISO(formData.endTime), 'MMM d')}
                      </p>
                    </div>
                  )}

                  {/* Existing Appointments on Selected Date */}
                  {selectedDateAppointments.length > 0 && formData.startTime && (
                    <div className="bg-info/5 border border-info/20 rounded-lg p-4 space-y-3">
                      <p className="text-xs font-semibold text-info uppercase tracking-wide flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5" />
                        Existing Appointments This Date
                      </p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedDateAppointments.map(appt => {
                          const apptStart = typeof appt.startTime === 'string' 
                            ? parseISO(appt.startTime)
                            : new Date(appt.startTime);
                          const apptEnd = appt.endTime
                            ? (typeof appt.endTime === 'string' 
                              ? parseISO(appt.endTime)
                              : new Date(appt.endTime))
                            : null;
                          
                          const apptFriendId = appt.friendId?._id || appt.friendId;
                          const friend = Array.isArray(friends) ? friends.find(f => f._id === apptFriendId) : null;

                          return (
                            <div key={appt._id || appt.id} className="bg-base-100/50 rounded-lg p-3 border border-info/15 text-sm">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1">
                                  <p className="font-semibold text-base-content text-xs">{appt.title || 'Appointment'}</p>
                                  <p className="text-xs text-base-content/60 mt-1">
                                    <Clock className="w-3 h-3 inline mr-1" />
                                    {format(apptStart, 'h:mm a')}
                                    {apptEnd && ` - ${format(apptEnd, 'h:mm a')}`}
                                  </p>
                                </div>
                                <span className={`badge badge-xs ${
                                  appt.status === 'confirmed' ? 'badge-success' :
                                  appt.status === 'pending' ? 'badge-warning' :
                                  appt.status === 'declined' ? 'badge-error' :
                                  'badge-info'
                                }`}>
                                  {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1) || 'Scheduled'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION 4: Additional Details */}
              <div className="space-y-5 p-5 bg-base-100/40 rounded-lg border border-base-300/30">
                <div className="flex items-center gap-3 pb-3 border-b border-base-300/40">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary"></div>
                  <h3 className="text-sm font-bold text-base-content uppercase tracking-wide">Meeting Details</h3>
                </div>

                {/* Meeting Type */}
                <div>
                  <label className="block text-xs font-bold text-base-content mb-2.5 uppercase tracking-wide">Type</label>
                  <select
                    name="meetingType"
                    value={formData.meetingType}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none text-sm"
                  >
                    <option>Video Call</option>
                    <option>Phone Call</option>
                    <option>In Person</option>
                  </select>
                </div>

                {/* Location - Only show for In Person meetings */}
                {formData.meetingType === 'In Person' && (
                  <div>
                    <label className="block text-xs font-bold text-base-content mb-2.5 uppercase tracking-wide">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="e.g., Coffee Shop, Library"
                      className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content placeholder-base-content/35 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all text-sm"
                    />
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-bold text-base-content mb-2.5 uppercase tracking-wide">Notes</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Add any additional details..."
                    rows="3"
                    className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content placeholder-base-content/35 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none text-sm"
                  />
                </div>

                {/* Reminder */}
                <div>
                  <label className="block text-xs font-bold text-base-content mb-2.5 uppercase tracking-wide">Reminder</label>
                  <select
                    name="reminder"
                    value={formData.reminder}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all appearance-none text-sm"
                  >
                    <option value={5}>5 minutes before</option>
                    <option value={10}>10 minutes before</option>
                    <option value={15}>15 minutes before</option>
                    <option value={30}>30 minutes before</option>
                    <option value={60}>1 hour before</option>
                    <option value={120}>2 hours before</option>
                    <option value={1440}>1 day before</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-base-300/40">
                {appointment && onDelete && (
                  <button
                    type="button"
                    onClick={() => setShowCancellation(true)}
                    className="px-4 py-2.5 bg-error/10 hover:bg-error/15 text-error font-semibold rounded-lg transition-all border border-error/20 text-sm"
                  >
                    Cancel
                  </button>
                )}
                <div className="flex-1 flex gap-3 justify-end">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-5 py-2.5 bg-base-200/60 hover:bg-base-200 text-base-content font-semibold rounded-lg transition-all text-sm"
                  >
                    Close
                  </button>
                  <button
                    type="submit"
                    disabled={currentUserStatus === 'away' || (formData.friendId && friendsAvailability[formData.friendId] === 'away')}
                    className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                  >
                    Next →
                  </button>
                </div>
              </div>
            </form>
            ) : (
              // STEP 2: Review/Summary
              <div className="p-8 space-y-7">
                <div className="bg-gradient-to-br from-success/8 to-base-100/40 border border-success/20 rounded-lg p-6 space-y-5">
                  <h4 className="text-lg font-bold text-base-content flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-success flex items-center justify-center text-white font-bold text-sm">✓</div>
                    Review Your Appointment
                  </h4>
                  
                  <div className="space-y-4">
                    {/* Title */}
                    {formData.title && (
                      <div className="pb-4 border-b border-base-300/40">
                        <p className="text-xs text-base-content/50 font-bold uppercase mb-2 tracking-wide">Title</p>
                        <p className="text-base font-bold text-base-content">{formData.title}</p>
                      </div>
                    )}

                    {/* Date & Time Info */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-base-100/60 rounded-lg p-4 border border-base-300/40">
                        <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wide">Date</p>
                        <p className="text-base font-bold text-base-content">{format(parseISO(formData.startTime), 'MMM d')}</p>
                        <p className="text-xs text-base-content/60 mt-1">{format(parseISO(formData.startTime), 'EEEE')}</p>
                      </div>
                      <div className="bg-base-100/60 rounded-lg p-4 border border-base-300/40">
                        <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wide">Time</p>
                        <p className="text-base font-bold text-base-content">{format(parseISO(formData.startTime), 'h:mm a')}</p>
                        <p className="text-xs text-base-content/60 mt-1">{formData.duration}m duration</p>
                      </div>
                    </div>

                    {/* Meeting Type & Location */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-base-100/60 rounded-lg p-4 border border-base-300/40">
                        <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wide">Type</p>
                        <p className="text-base font-bold text-base-content">{formData.meetingType}</p>
                      </div>
                      {formData.meetingType === 'In Person' && formData.location && (
                        <div className="bg-base-100/60 rounded-lg p-4 border border-base-300/40">
                          <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wide">Location</p>
                          <p className="text-base font-bold text-base-content truncate">{formData.location}</p>
                        </div>
                      )}
                    </div>

                    {/* With Whom */}
                    {formData.friendId && (
                      <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                        <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wide">Scheduled With</p>
                        <p className="text-base font-bold text-base-content">{friends.find(f => f._id === formData.friendId)?.fullName || 'Selected friend'}</p>
                      </div>
                    )}

                    {/* Notes */}
                    {formData.description && (
                      <div className="bg-base-100/60 rounded-lg p-4 border border-base-300/40">
                        <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wide">Notes</p>
                        <p className="text-sm text-base-content leading-relaxed whitespace-pre-wrap">{formData.description}</p>
                      </div>
                    )}

                    {/* Reminder */}
                    {formData.reminder > 0 && (
                      <div className="bg-warning/5 rounded-lg p-4 border border-warning/20">
                        <p className="text-xs text-base-content/50 font-bold mb-2 uppercase tracking-wide">Reminder</p>
                        <p className="text-base font-bold text-base-content">
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
                <div className="flex gap-3 pt-4 border-t border-base-300/40">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-5 py-2.5 bg-base-200/60 hover:bg-base-200 text-base-content font-semibold rounded-lg transition-all text-sm"
                  >
                    ← Back to Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAppointment}
                    className="flex-1 px-6 py-2.5 bg-success hover:bg-success/90 text-white font-semibold rounded-lg transition-all text-sm shadow-sm"
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
  <div className="p-8 space-y-6">
    <div className="bg-error/10 border-l-4 border-error rounded-lg p-4">
      <p className="text-error font-semibold text-sm flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
        <span>Cancelling this appointment will notify the other person. Please select a reason for cancellation.</span>
      </p>
    </div>

    <div className="space-y-3">
      <label className="block text-xs font-bold text-base-content uppercase tracking-wide flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-error"></span>
        Cancellation Reason
      </label>
      <div className="space-y-2">
        {CANCELLATION_REASONS.map((reason) => (
          <label key={reason} className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-100 cursor-pointer transition border border-base-300/40 hover:border-error/30">
            <input
              type="radio"
              name="cancellation"
              value={reason}
              checked={cancellationReason === reason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="radio radio-error radio-sm"
            />
            <span className="text-sm font-medium text-base-content">
              {reason}
            </span>
          </label>
        ))}
      </div>
    </div>

    {cancellationReason === 'Other (Please specify)' && (
      <div className="space-y-3">
        <label className="block text-xs font-bold text-base-content uppercase tracking-wide flex items-center gap-2.5">
          <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
          Explain Your Reason
        </label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Enter your cancellation reason..."
          rows="3"
          className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content placeholder-base-content/35 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all resize-none text-sm"
        />
      </div>
    )}
    <div className="flex gap-3 pt-4 border-t border-base-300/40">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-5 py-2.5 bg-base-200/60 hover:bg-base-200 text-base-content font-semibold rounded-lg transition-all text-sm"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-5 py-2.5 bg-error hover:bg-error/90 text-white font-semibold rounded-lg transition-all text-sm shadow-sm"
      >
        Confirm Cancellation
      </button>
    </div>
  </div>
);

// Decline Form Component
const DeclineForm = ({ declineMessage, setDeclineMessage, onCancel, onSubmit }) => (
  <div className="p-8 space-y-6">
    <div className="bg-warning/10 border-l-4 border-warning rounded-lg p-4">
      <p className="text-warning font-semibold text-sm flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">ℹ️</span>
        <span>Declining this appointment will notify the requester. Please provide a clear reason in your message.</span>
      </p>
    </div>

    <div className="space-y-3">
      <label className="block text-xs font-bold text-base-content uppercase tracking-wide flex items-center gap-2.5">
        <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
        Your Message
      </label>
      <textarea
        value={declineMessage}
        onChange={(e) => setDeclineMessage(e.target.value)}
        placeholder="Explain why you're declining this appointment..."
        rows="4"
        className="w-full px-4 py-2.5 bg-base-100 border border-base-300/50 rounded-lg text-base-content placeholder-base-content/35 focus:outline-none focus:border-warning focus:ring-2 focus:ring-warning/10 transition-all resize-none text-sm"
      />
    </div>

    <div className="flex gap-3 pt-4 border-t border-base-300/40">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-5 py-2.5 bg-base-200/60 hover:bg-base-200 text-base-content font-semibold rounded-lg transition-all text-sm"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-5 py-2.5 bg-warning hover:bg-warning/90 text-white font-semibold rounded-lg transition-all text-sm shadow-sm"
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
  appointments: PropTypes.arrayOf(PropTypes.object),
  selectedDate: PropTypes.instanceOf(Date),
};

export default AppointmentModal;
