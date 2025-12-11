import React, { useState, useEffect, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { X, Calendar, Clock, Zap, CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, isToday, isBefore, isAfter, addMinutes, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isSameDay } from 'date-fns';
import { toast } from 'react-hot-toast';
import { getUserAvailability, getFriendAppointments } from '../../lib/api';
import { getPhilippineHolidays, isHoliday, getHolidayName } from '../../utils/philippineHolidays';
import AvailabilityInfo from '../AvailabilityInfo';
import { useThemeStore } from '../../store/useThemeStore';

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
  });

  const [showCancellation, setShowCancellation] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [declineMessage, setDeclineMessage] = useState('');
  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [selectedFriendAvailability, setSelectedFriendAvailability] = useState(null);
  const [loadingFriendAvailability, setLoadingFriendAvailability] = useState(false);
  const [friendAppointments, setFriendAppointments] = useState([]);
  const [loadingFriendAppointments, setLoadingFriendAppointments] = useState(false);
  const [step, setStep] = useState(1);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [phHolidays, setPhHolidays] = useState([]);
  const [isClosing, setIsClosing] = useState(false);
  const { theme } = useThemeStore();

  // Initialize calendar month and set selected date from initialDate
  useEffect(() => {
    if (initialDate) {
      setCalendarMonth(new Date(initialDate));
    } else if (appointment?.startTime) {
      // For reschedule, set calendar to appointment date
      const apptDate = typeof appointment.startTime === 'string'
        ? parseISO(appointment.startTime)
        : new Date(appointment.startTime);
      setCalendarMonth(new Date(apptDate));
    }
  }, [initialDate, appointment?.startTime]);
  
  // Reset step when opening/closing
  useEffect(() => {
    if (isOpen) {
      setStep(1);
    }
  }, [isOpen]);
  // Detect if we're in edit mode (reschedule)
  const isEditMode = !!appointment;

  // Handle close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  // Load holidays on component mount
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    setPhHolidays(getPhilippineHolidays(currentYear));
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.documentElement.style.overflow = 'auto';
    }
    return () => {
      document.documentElement.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      if (appointment) {
        const startTime = typeof appointment.startTime === 'string' 
          ? appointment.startTime 
          : appointment.startTime?.toISOString?.() || '';
        const endTime = typeof appointment.endTime === 'string' 
          ? appointment.endTime 
          : appointment.endTime?.toISOString?.() || '';
        
        // For reschedule, we need to identify the correct friendId
        const currentUserId = currentUser?._id || currentUser?.id;
        const appointmentUserId = appointment.userId?._id || appointment.userId;
        const appointmentFriendId = appointment.friendId?._id || appointment.friendId;
        
        // If current user is the creator, friend is the other person
        // If current user is the recipient, friend is the creator
        const friendId = appointmentUserId === currentUserId ? appointmentFriendId : appointmentUserId;
        
        setFormData({
          title: appointment.title || '',
          description: appointment.description || appointment.message || '',
          startTime,
          endTime,
          friendId: friendId || '',
          friendSearch: '',
          showFriendDropdown: false,
          meetingType: appointment.meetingType || 'Video Call',
          duration: appointment.duration || 30,
          location: appointment.location || '',
          reminder: appointment.reminder || 15,
        });
      } else if (initialDate || selectedDate) {
        const dateToUse = initialDate || selectedDate;
        if (dateToUse) {
          const date = format(dateToUse, 'yyyy-MM-dd');
          const time = initialTime ? format(initialTime, 'HH:mm') : '09:00';
          const startTime = `${date}T${time}`;
          const endTime = format(addMinutes(parseISO(startTime), 30), 'yyyy-MM-dd\'T\'HH:mm');
          
          setFormData(prev => ({
            ...prev,
            startTime,
            endTime,
            friendId: initialFriendId || '',
          }));
        }
      }
    }
  }, [appointment, initialDate, selectedDate, initialTime, initialFriendId, isOpen, currentUser]);

  useEffect(() => {
    if (formData.friendId) {
      setLoadingFriendAvailability(true);
      setLoadingFriendAppointments(true);
      const selectedFriend = friends.find(f => f._id === formData.friendId);
      
      if (selectedFriend) {
        // Fetch friend's availability
        getUserAvailability(selectedFriend._id)
          .then((availabilityData) => {
            setSelectedFriendAvailability(availabilityData);
            setLoadingFriendAvailability(false);
          })
          .catch(error => {
            console.error('Error fetching friend availability:', error);
            setLoadingFriendAvailability(false);
          });

        // Fetch friend's appointments
        getFriendAppointments(selectedFriend._id)
          .then((appointmentsData) => {
            console.log('[AppointmentModal] Fetched friend appointments:', {
              friendId: selectedFriend._id,
              friendName: selectedFriend.fullName || selectedFriend.name,
              count: appointmentsData.length,
              appointments: appointmentsData
            });
            setFriendAppointments(appointmentsData);
            setLoadingFriendAppointments(false);
          })
          .catch(error => {
            console.error('Error fetching friend appointments:', error);
            setFriendAppointments([]);
            setLoadingFriendAppointments(false);
          });
      }
    } else {
      setSelectedFriendAvailability(null);
      setFriendAppointments([]);
    }
  }, [formData.friendId, friends]);

  const selectedDateAppointments = useMemo(() => {
    if (!formData.startTime || !formData.friendId) return [];
    
    try {
      const selectedDateStr = formData.startTime.split('T')[0];
      
      // Use appointments from prop (parent already provides correct data)
      return appointments.filter(appt => {
        if (!appt.startTime) return false;
        
        // Match Calendar.jsx status filtering - show confirmed, scheduled, completed (hide pending, cancelled, declined)
        const status = appt.status?.toLowerCase();
        if (!['confirmed', 'scheduled', 'completed'].includes(status)) return false;
        
        const apptDateStr = typeof appt.startTime === 'string' 
          ? appt.startTime.split('T')[0]
          : format(new Date(appt.startTime), 'yyyy-MM-dd');
        
        if (apptDateStr !== selectedDateStr) return false;
        
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
    const effectiveAvailability = selectedFriendAvailability?.availability || availability;
    
    if (!effectiveAvailability || !effectiveAvailability.start || !effectiveAvailability.end) {
      return slots;
    }
    
    const [startHour, startMin] = effectiveAvailability.start.split(':').map(Number);
    const [endHour, endMin] = effectiveAvailability.end.split(':').map(Number);
    const duration = effectiveAvailability.slotDuration || 30;
    const appointmentDuration = formData.duration || 30;
    const minLeadTime = effectiveAvailability.minLeadTime || 0;
    const breakTimes = effectiveAvailability.breakTimes || [];
    const now = new Date();

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

    let current = new Date(selectedDate);
    current.setHours(startHour, startMin, 0, 0);
    
    let end = new Date(selectedDate);
    end.setHours(endHour, endMin, 0, 0);

    while (current < end) {
      const slotTime24 = format(current, 'HH:mm');
      const slotTime12 = format(current, 'h:mm a');
      
      const slotStart = new Date(current);
      const slotEnd = addMinutes(slotStart, appointmentDuration);
      const fitsInAvailableTime = slotEnd <= end;
      const isPast = isSelectedToday && isBefore(current, now);
      
      let meetsLeadTime = true;
      if (minLeadTime > 0 && isSelectedToday) {
        const leadTimeDeadline = addMinutes(now, minLeadTime * 60);
        meetsLeadTime = !isBefore(current, leadTimeDeadline);
      }
      
      let isInBreakTime = false;
      for (const breakTime of breakTimes) {
        const [bStartHour, bStartMin] = breakTime.start.split(':').map(Number);
        const [bEndHour, bEndMin] = breakTime.end.split(':').map(Number);
        const breakStart = new Date(selectedDate);
        breakStart.setHours(bStartHour, bStartMin, 0, 0);
        const breakEnd = new Date(selectedDate);
        breakEnd.setHours(bEndHour, bEndMin, 0, 0);
        
        // Check if the appointment overlaps with break time
        // Break blocks appointment if: slotStart < breakEnd AND slotEnd > breakStart
        const overlapsWithBreak = slotStart < breakEnd && slotEnd > breakStart;
        
        if (overlapsWithBreak) {
          isInBreakTime = true;
          break;
        }
      }

      let isBooked = false;
      let nextApptStart = null;
      let bufferViolation = false;
      const buffer = effectiveAvailability?.buffer || 0;
      
      if (formData.friendId && selectedDateAppointments.length > 0) {
        isBooked = selectedDateAppointments.some(appt => {
          const apptStart = typeof appt.startTime === 'string' 
            ? parseISO(appt.startTime)
            : new Date(appt.startTime);
          const apptEnd = typeof appt.endTime === 'string'
            ? parseISO(appt.endTime)
            : new Date(appt.endTime);
          
          // More precise overlap check: appointment blocks slot if they overlap
          // Slots are blocked only if there's a true time conflict
          // Two times conflict if: slotStart < apptEnd AND slotEnd > apptStart
          const hasConflict = slotStart < apptEnd && slotEnd > apptStart;
          
          // Check buffer time: if appointment ends, next appointment can't start within buffer minutes
          const bufferEnd = addMinutes(apptEnd, buffer);
          if (slotStart < bufferEnd && slotStart >= apptEnd && buffer > 0) {
            bufferViolation = true;
          }
          
          // Track the next appointment start time for better UX
          if (slotStart < apptStart && !nextApptStart) {
            nextApptStart = apptStart;
          }
          
          return hasConflict;
        });
      }
      
      const isDisabled = isPast || !fitsInAvailableTime || !meetsLeadTime || isInBreakTime || isBooked || bufferViolation;
      
      let disabledReason = '';
      if (isPast) disabledReason = '(Past)';
      else if (!fitsInAvailableTime) disabledReason = '(Too late)';
      else if (!meetsLeadTime) disabledReason = `(${minLeadTime}h notice)`;
      else if (isInBreakTime) disabledReason = '(Break time)';
      else if (bufferViolation) disabledReason = `(${buffer}min buffer)`;
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
      endTime: newStartTime ? format(addMinutes(parseISO(newStartTime), formData.duration), 'yyyy-MM-dd\'T\'HH:mm') : '',
    }));
  };

  const handleDurationChange = (e) => {
    const newDuration = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      duration: newDuration,
      endTime: prev.startTime ? format(addMinutes(parseISO(prev.startTime), newDuration), 'yyyy-MM-dd\'T\'HH:mm') : '',
    }));
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(calendarMonth);
    selectedDate.setDate(day);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const time = formData.startTime.split('T')[1] || '09:00';
    setFormData(prev => ({
      ...prev,
      startTime: `${dateStr}T${time}`,
      endTime: format(addMinutes(parseISO(`${dateStr}T${time}`), prev.duration), 'yyyy-MM-dd\'T\'HH:mm')
    }));
  };

  const getCalendarDays = () => {
    const monthStart = startOfMonth(calendarMonth);
    const monthEnd = endOfMonth(calendarMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    const startDate = monthStart.getDay();
    const padding = Array(startDate).fill(null);
    
    return [...padding, ...days];
  };

  const getAppointmentsForDate = (date) => {
    const friendId = appointment?.friendId?._id || appointment?.friendId || formData.friendId;
    if (!date) return [];
    
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const friendIdStr = friendId ? String(friendId) : null;
      
      // Use fetched friend appointments if available, otherwise fall back to prop
      const appointmentsToUse = friendAppointments.length > 0 ? friendAppointments : appointments;
      
      return appointmentsToUse.filter(appt => {
        if (!appt.startTime) return false;
        
        // Show confirmed, scheduled, and completed appointments in mini calendar (align with main calendar)
        if (!['confirmed', 'scheduled', 'completed'].includes(appt.status)) return false;
        
        const apptDateStr = typeof appt.startTime === 'string' 
          ? appt.startTime.split('T')[0]
          : format(new Date(appt.startTime), 'yyyy-MM-dd');
        
        if (apptDateStr !== dateStr) return false;
        
        // If no friend is selected, show all appointments on that date
        if (!friendIdStr) return true;
        
        const apptUserId = String(appt.userId?._id || appt.userId);
        const apptFriendId = String(appt.friendId?._id || appt.friendId);
        
        return apptFriendId === friendIdStr || apptUserId === friendIdStr;
      });
    } catch (e) {
      console.error('Error in getAppointmentsForDate:', e);
      return [];
    }
  };

  // Get ALL appointments for the selected friend (not just on a specific date)
  const getAllAppointmentsForFriend = () => {
    const friendId = formData.friendId;
    if (!friendId) return [];
    
    try {
      const friendIdStr = String(friendId);
      
      // Use fetched friend appointments if available, otherwise fall back to prop
      const appointmentsToUse = friendAppointments.length > 0 ? friendAppointments : appointments;
      
      const filtered = appointmentsToUse.filter(appt => {
        if (!appt.startTime) return false;
        
        // Show all statuses
        const apptUserId = String(appt.userId?._id || appt.userId);
        const apptFriendId = String(appt.friendId?._id || appt.friendId);
        
        return apptFriendId === friendIdStr || apptUserId === friendIdStr;
      });
      
      console.log('[AppointmentModal] getAllAppointmentsForFriend:', {
        friendId: friendIdStr,
        source: friendAppointments.length > 0 ? 'friendAppointments' : 'appointments prop',
        totalAvailable: appointmentsToUse.length,
        filtered: filtered.length,
        appointments: filtered
      });
      
      return filtered;
    } catch (e) {
      console.error('Error in getAllAppointmentsForFriend:', e);
      return [];
    }
  };

  // Get ALL appointments on a date (regardless of friend) for maxPerDay validation
  const getAllAppointmentsForDate = (date) => {
    if (!date) return [];
    
    try {
      const dateStr = format(date, 'yyyy-MM-dd');
      const friendId = formData.friendId;
      
      // Use fetched friend appointments when scheduling with a friend, otherwise use own appointments
      const appointmentsToUse = friendId && friendAppointments.length > 0 ? friendAppointments : appointments;
      
      return appointmentsToUse.filter(appt => {
        if (!appt.startTime) return false;
        
        // Count CONFIRMED, SCHEDULED, and PENDING appointments for daily capacity
        // (All take up appointment slots)
        const status = appt.status?.toLowerCase();
        if (!['confirmed', 'scheduled', 'pending'].includes(status)) return false;
        
        const apptDateStr = typeof appt.startTime === 'string' 
          ? appt.startTime.split('T')[0]
          : format(new Date(appt.startTime), 'yyyy-MM-dd');
        
        if (apptDateStr !== dateStr) return false;
        
        // When checking friend's capacity, count all their appointments
        if (friendId) {
          const friendIdStr = String(friendId);
          const apptUserId = String(appt.userId?._id || appt.userId);
          const apptFriendId = String(appt.friendId?._id || appt.friendId);
          return apptFriendId === friendIdStr || apptUserId === friendIdStr;
        }
        
        return true;
      });
    } catch (e) {
      return [];
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const currentUserId = currentUser?._id || currentUser?.id;
    
    if (currentUserStatus === 'away') {
      toast.error('You are currently away. Please update your status.');
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

    // friendId is required for new appointments but already set for reschedule
    if (!isEditMode && !formData.friendId) {
      toast.error('Please select a friend');
      return;
    }

    const selectedFriend = friends.find(f => f._id === formData.friendId);
    const friendStatus = friendsAvailability[selectedFriend?._id] || 'available';
    
    if (friendStatus === 'away') {
      toast.error('This friend is currently away');
      return;
    }

    const friendAvail = selectedFriendAvailability?.availability;
    
    if (formData.meetingType === 'In Person' && !formData.location.trim()) {
      toast.error('Please enter a location for in-person appointments');
      return;
    }

    const startDateTime = parseISO(formData.startTime);
    const endDateTime = parseISO(formData.endTime);
    const now = new Date();
    
    // Check if appointment is on a holiday
    if (isHoliday(startDateTime, phHolidays)) {
      const holidayName = getHolidayName(startDateTime, phHolidays);
      toast.error(`Cannot book on ${holidayName} - service not available`);
      return;
    }
    
    if (isBefore(startDateTime, now)) {
      toast.error('Cannot schedule an appointment in the past');
      return;
    }

    if (friendAvail && friendAvail.minLeadTime > 0) {
      const leadTimeDeadline = addMinutes(now, friendAvail.minLeadTime * 60);
      if (isBefore(startDateTime, leadTimeDeadline)) {
        toast.error(`This friend requires ${friendAvail.minLeadTime} hour${friendAvail.minLeadTime > 1 ? 's' : ''} advance notice`);
        return;
      }
    }

    const friendConflict = selectedDateAppointments.some(existingAppt => {
      const existingStart = typeof existingAppt.startTime === 'string' 
        ? parseISO(existingAppt.startTime)
        : new Date(existingAppt.startTime);
      const existingEnd = typeof existingAppt.endTime === 'string'
        ? parseISO(existingAppt.endTime)
        : new Date(existingAppt.endTime);
      
      if (['declined', 'cancelled'].includes(existingAppt.status)) return false;
      
      return isBefore(startDateTime, existingEnd) && isAfter(endDateTime, existingStart);
    });

    if (friendConflict) {
      toast.error('This time slot is already booked. Please choose another time.');
      return;
    }

    setStep(2);
  };

  const handleConfirmAppointment = () => {
    if (isEditMode) {
      // For reschedule: include appointmentId
      onSubmit({
        appointmentId: appointment._id || appointment.id,
        title: formData.title,
        description: formData.description,
        startTime: formData.startTime,
        endTime: formData.endTime,
        meetingType: formData.meetingType,
        location: formData.location,
        duration: formData.duration,
      });
    } else {
      // For new appointment: pass all formData
      onSubmit(formData);
    }
    
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
    handleClose();
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
      handleClose();
    }
  };

  const durationOptions = [15, 30, 45, 60, 90, 120];

  useEffect(() => {
    console.log('[AppointmentModal] Rendering with props:', { isOpen, appointment: !!appointment, step });
  }, [isOpen, appointment, step]);

  if (!isOpen) {
    console.log('[AppointmentModal] isOpen is false, returning null');
    return null;
  }

  // Provide default values for availability if missing
  const effectiveAvailability = availability || {
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
  };

  return (
    <div className={`fixed inset-0 z-[80] overflow-hidden ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ease-out ${isClosing ? 'opacity-0' : 'opacity-100'}`}
        onClick={handleClose}
      ></div>

      {/* Sliding Modal */}
      <div className={`absolute inset-y-0 right-0 pl-2 sm:pl-10 max-w-full flex ${isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
        <div className="w-full sm:w-screen max-w-md sm:max-w-2xl bg-base-100 shadow-2xl overflow-y-auto transform transition-transform duration-300 ease-out">
          {/* Header */}
          <div className="sticky top-0 z-40 bg-base-100 border-b border-base-300 px-4 sm:px-8 py-3 sm:py-5 flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg sm:text-2xl font-semibold text-base-content">
                {showCancellation 
                  ? 'Cancel' 
                  : showDeclineForm 
                  ? 'Decline' 
                  : appointment ? 'Reschedule' : 'New'}
                <span className="hidden sm:inline"> Appointment</span>
              </h2>
              
              {!showCancellation && !showDeclineForm && (
                <div className="flex items-center gap-1 sm:gap-3 mt-2 sm:mt-3 overflow-x-auto">
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${step === 1 ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-base-200 text-base-content/60 border border-base-300'}`}>
                    <span className={`w-4 sm:w-5 h-4 sm:h-5 rounded-full flex items-center justify-center text-xs font-semibold ${step === 1 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'}`}>
                      1
                    </span>
                    <span className="hidden sm:inline">Details</span>
                  </div>
                  <div className={`text-xs ${step === 1 ? 'text-primary/50' : 'text-base-300'}`}>→</div>
                  <div className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium transition-all flex-shrink-0 ${step === 2 ? 'bg-primary/10 text-primary border border-primary/30' : 'bg-base-200 text-base-content/60 border border-base-300'}`}>
                    <span className={`w-4 sm:w-5 h-4 sm:h-5 rounded-full flex items-center justify-center text-xs font-semibold ${step === 2 ? 'bg-primary text-primary-content' : 'bg-base-300 text-base-content/50'}`}>
                      2
                    </span>
                    <span className="hidden sm:inline">Review</span>
                  </div>
                </div>
              )}
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 sm:p-2 hover:bg-base-200 rounded-lg transition-all text-base-content/60 hover:text-base-content ml-2 flex-shrink-0"
            >
              <X className="w-4 sm:w-5 h-4 sm:h-5" />
            </button>
          </div>

          {/* Content */}
          {!showCancellation && !showDeclineForm ? (
            step === 1 ? (
              // STEP 1: Form Entry
              <form onSubmit={handleSubmit} className="p-4 sm:p-8 space-y-4 sm:space-y-7">
                {/* Away Status Warning */}
                {currentUserStatus === 'away' && (
                  <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 font-medium text-xs sm:text-sm flex items-start gap-2 sm:gap-3">
                      <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
                      <span>You are currently away. Please update your status to schedule appointments.</span>
                    </p>
                  </div>
                )}

                {/* Title */}
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-medium text-base-content">Appointment Title *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g., Project Discussion"
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-base-200 border border-base-300 rounded-lg text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-xs sm:text-sm shadow-sm hover:border-base-400"
                  />
                </div>

                {/* Friend Selection - Only show when creating new appointment */}
                {!appointment && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-base-content">Schedule With *</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search or select a friend..."
                      className="w-full px-4 py-3 bg-base-200 border border-base-300 rounded-lg text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm shadow-sm hover:border-base-400"
                      onChange={(e) => {
                        setFormData(prev => ({...prev, friendSearch: e.target.value}));
                      }}
                      onFocus={() => {
                        setFormData(prev => ({...prev, showFriendDropdown: true}));
                      }}
                      value={formData.friendSearch || ''}
                    />
                    {formData.showFriendDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
                        {friends.filter(f => {
                          const search = (formData.friendSearch || '').toLowerCase();
                          return (f.fullName || f.name || '').toLowerCase().includes(search) ||
                                 (f.email || '').toLowerCase().includes(search);
                        }).map(friend => {
                          const friendStatus = friendsAvailability[friend._id]?.status || 'available';
                          const isAway = friendStatus === 'away';
                          const statusConfig = {
                            available: { badge: 'badge badge-success', label: 'Available' },
                            limited: { badge: 'badge badge-warning', label: 'Limited' },
                            away: { badge: 'badge badge-error', label: 'Away' }
                          };
                          
                          const config = statusConfig[friendStatus] || statusConfig.available;
                          
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
                              className={`w-full px-4 py-3 text-left flex items-center gap-3 border-b border-base-200 last:border-b-0 transition text-sm ${
                                isAway
                                  ? 'opacity-50 cursor-not-allowed bg-base-100 hover:bg-base-100'
                                  : formData.friendId === friend._id
                                  ? 'bg-primary/10 hover:bg-primary/20 cursor-pointer'
                                  : 'hover:bg-base-200 cursor-pointer'
                              }`}
                            >
                              {friend.profilePic ? (
                                <img
                                  src={friend.profilePic}
                                  alt={friend.fullName}
                                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
                                  {(friend.fullName || friend.name || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-base-content text-sm truncate">
                                  {friend.fullName || friend.name}
                                </p>
                                <p className="text-xs text-base-content/60 truncate">
                                  {friend.email}
                                </p>
                              </div>
                              <span className={`${config.badge} badge-sm flex-shrink-0`}>
                                {config.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Selected Friend Card */}
                  {formData.friendId && (
                    <div className="space-y-3 pt-3">
                      {(() => {
                        const selectedFriend = friends.find(f => f._id === formData.friendId);
                        const friendStatus = friendsAvailability[selectedFriend?._id] || 'available';
                        
                        if (friendStatus === 'away') {
                          return (
                            <div className="p-4 bg-error/10 border border-error/30 rounded-lg">
                              <p className="text-error font-medium text-sm flex items-start gap-3">
                                <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
                                <span>This friend is currently away.</span>
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}

                      <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 flex items-center gap-3">
                        {(() => {
                          const selectedFriend = friends.find(f => f._id === formData.friendId);
                          if (!selectedFriend) return null;
                          
                          const friendStatus = friendsAvailability[selectedFriend._id]?.status || 'available';
                          const statusConfig = {
                            available: { badge: 'badge badge-success', label: 'Available' },
                            limited: { badge: 'badge badge-warning', label: 'Limited' },
                            away: { badge: 'badge badge-error', label: 'Away' }
                          };
                          const config = statusConfig[friendStatus] || statusConfig.available;

                          return (
                            <>
                              {selectedFriend.profilePic ? (
                                <img
                                  src={selectedFriend.profilePic}
                                  alt={selectedFriend.fullName}
                                  className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                                />
                              ) : (
                                <div className="w-10 h-10 rounded-full bg-primary/30 text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                                  {(selectedFriend.fullName || selectedFriend.name || 'U')[0].toUpperCase()}
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold text-base-content text-sm">{selectedFriend.fullName || selectedFriend.name}</p>
                                <p className="text-xs text-base-content/70">{selectedFriend.email}</p>
                              </div>
                              <span className={`${config.badge} badge-sm flex-shrink-0`}>
                                {config.label}
                              </span>
                            </>
                          );
                        })()}
                      </div>

                      {loadingFriendAvailability ? (
                        <div className="p-4 bg-base-200 rounded-lg animate-pulse">
                          <div className="h-16 bg-base-300 rounded"></div>
                        </div>
                      ) : (
                        <AvailabilityInfo 
                          availability={selectedFriendAvailability?.availability || {}} 
                          availabilityStatus={selectedFriendAvailability?.availabilityStatus || friendsAvailability[formData.friendId] || 'available'}
                        />
                      )}
                    </div>
                  )}
                </div>
                )}

                {/* Show Friend Info in Reschedule Mode */}
                {appointment && (
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-base-content">Rescheduling with</label>
                    <div className="p-4 bg-primary/10 rounded-lg border border-primary/30 flex items-center gap-3">
                      {(() => {
                        // Get the OTHER person in the appointment (not the current user)
                        const currentUserId = currentUser?._id || currentUser?.id;
                        const appointmentUserId = appointment.userId?._id || appointment.userId;
                        const appointmentFriendId = appointment.friendId?._id || appointment.friendId;
                        
                        // If current user is userId, the friend is friendId, and vice versa
                        const otherPersonId = appointmentUserId === currentUserId ? appointmentFriendId : appointmentUserId;
                        const otherPersonObj = appointmentUserId === currentUserId ? appointment.friendId : appointment.userId;
                        
                        // Try to find in friends list, otherwise use the appointment object
                        const selectedFriend = friends.find(f => f._id === otherPersonId) || otherPersonObj;
                        
                        if (!selectedFriend) return null;
                        
                        const friendStatus = friendsAvailability[selectedFriend._id || otherPersonId]?.status || 'available';
                        const statusConfig = {
                          available: { badge: 'badge badge-success', label: 'Available' },
                          limited: { badge: 'badge badge-warning', label: 'Limited' },
                          away: { badge: 'badge badge-error', label: 'Away' }
                        };
                        const config = statusConfig[friendStatus] || statusConfig.available;

                        return (
                          <>
                            {(selectedFriend.profilePic || selectedFriend.image) ? (
                              <img
                                src={selectedFriend.profilePic || selectedFriend.image}
                                alt={selectedFriend.fullName || selectedFriend.name}
                                className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-primary/30 text-primary flex items-center justify-center font-semibold flex-shrink-0 text-sm">
                                {(selectedFriend.fullName || selectedFriend.name || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-base-content text-sm">{selectedFriend.fullName || selectedFriend.name}</p>
                              <p className="text-xs text-base-content/70">{selectedFriend.email}</p>
                            </div>
                            <span className={`${config.badge} badge-sm flex-shrink-0`}>
                              {config.label}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                )}

                {/* Schedule Details */}
                <div className="space-y-4 p-5 bg-base-200 rounded-lg border border-base-300">
                  <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                    <Calendar className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold text-base-content">When</h3>
                  </div>

                  <div className="space-y-3">
                    {/* Date Display with Day and Calendar */}
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-base-content">Date *</label>
                      
                      {/* Current Selection Display */}
                      {formData.startTime && (
                        <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 space-y-3">
                          <div>
                            <p className="text-xs text-primary font-semibold mb-2 uppercase">Selected</p>
                            <div className="flex items-baseline gap-2">
                              <p className="text-2xl font-bold text-primary">
                                {format(parseISO(formData.startTime), 'd')}
                              </p>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-base-content">
                                  {format(parseISO(formData.startTime), 'EEEE')}
                                </p>
                                <p className="text-xs text-base-content/70">
                                  {format(parseISO(formData.startTime), 'MMMM yyyy')}
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {/* Max Appointments & Current Count */}
                          {(() => {
                            const selectedFriend = friends.find(f => f._id === formData.friendId);
                            // Use the FRIEND's maxPerDay setting when scheduling with them
                            const friendAvailability = formData.friendId ? friendsAvailability[formData.friendId] : null;
                            const maxPerDay = friendAvailability?.maxPerDay || availability?.maxPerDay || 5;
                            // Use ALL appointments for maxPerDay validation (not filtered by friend)
                            const allApptsOnDate = getAllAppointmentsForDate(parseISO(formData.startTime));
                            const isFull = allApptsOnDate.length >= maxPerDay;
                            
                            return (
                              <div className="pt-3 border-t border-primary/20 space-y-2">
                                {/* Max appointments capacity bar - Shows total confirmed appointments on this date */}
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between">
                                    <p className="text-xs text-base-content/70 font-medium uppercase">Daily Capacity</p>
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                      isFull 
                                        ? 'bg-error/20 text-error' 
                                        : 'bg-success/20 text-success'
                                    }`}>
                                      {allApptsOnDate.length} / {maxPerDay}
                                    </span>
                                  </div>
                                  {/* Capacity bar */}
                                  <div className="w-full bg-base-300 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className={`h-full transition-all ${
                                        allApptsOnDate.length === 0 ? 'bg-success' :
                                        isFull ? 'bg-error' : 'bg-warning'
                                      }`}
                                      style={{ width: `${Math.min((allApptsOnDate.length / maxPerDay) * 100, 100)}%` }}
                                    ></div>
                                  </div>
                                  {isFull && (
                                    <p className="text-xs text-error font-medium">❌ This day is fully booked. Please select another date.</p>
                                  )}
                                </div>

                                {/* Appointments on selected date (filtered by friend) */}
                                {(() => {
                                  const selectedDateAppts = getAppointmentsForDate(parseISO(formData.startTime));
                                  return selectedDateAppts.length > 0 ? (
                                    <div className="space-y-1">
                                      <p className="text-xs text-base-content/70 font-medium uppercase">Appointments on this date</p>
                                      <div className="space-y-1 max-h-32 overflow-y-auto">
                                        {selectedDateAppts.map((appt, idx) => {
                                          const startTime = typeof appt.startTime === 'string' ? parseISO(appt.startTime) : new Date(appt.startTime);
                                          const endTime = typeof appt.endTime === 'string' ? parseISO(appt.endTime) : new Date(appt.endTime);
                                          const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
                                          const durationDisplay = durationMinutes < 60 
                                            ? `${durationMinutes}m` 
                                            : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
                                          
                                          return (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-white/50 dark:bg-base-300/50 rounded text-xs">
                                              <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                                                appt.status === 'confirmed' ? 'bg-success' :
                                                appt.status === 'pending' ? 'bg-warning' :
                                                appt.status === 'cancelled' ? 'bg-error' : 'bg-base-content/30'
                                              }`}></div>
                                              <span className="text-base-content/80 truncate flex-1">{appt.title || 'Untitled'}</span>
                                              <span className="text-base-content/60 flex-shrink-0 whitespace-nowrap">
                                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')} ({durationDisplay})
                                              </span>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  ) : null;
                                })()}
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* Mini Calendar */}
                      <div className="bg-base-100 border border-base-300 rounded-lg p-4 shadow-sm">
                        {/* Calendar Header */}
                        <div className="flex items-center justify-between mb-4">
                          <button
                            type="button"
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))}
                            className="p-1.5 hover:bg-base-300 rounded-lg transition-all text-base-content/60"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                          <p className="text-sm font-semibold text-base-content">
                            {format(calendarMonth, 'MMMM yyyy')}
                          </p>
                          <button
                            type="button"
                            onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))}
                            className="p-1.5 hover:bg-base-300 rounded-lg transition-all text-base-content/60"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Weekday Headers */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                            <div key={i} className="text-center text-xs font-semibold text-base-content/60 py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Days */}
                        <div className="grid grid-cols-7 gap-1">
                          {getCalendarDays().map((day, index) => {
                            const isCurrentMonth = day && isSameMonth(day, calendarMonth);
                            const isSelected = day && formData.startTime && isSameDay(day, parseISO(formData.startTime));
                            const isDisabled = day && (isBefore(day, new Date().setHours(0, 0, 0, 0)) || isHoliday(day, phHolidays));
                            const dayAppointments = day ? getAppointmentsForDate(day) : [];
                            const hasAppointments = dayAppointments.length > 0;
                            const dayHoliday = day ? getHolidayName(day, phHolidays) : null;
                            
                            return (
                              <button
                                key={index}
                                type="button"
                                disabled={!day || isDisabled || !isCurrentMonth}
                                onClick={() => day && handleDateSelect(day.getDate())}
                                className={`py-2 text-xs font-medium rounded transition-all relative ${
                                  !day
                                    ? 'text-transparent'
                                    : !isCurrentMonth
                                    ? 'text-base-content/30 cursor-default'
                                    : isDisabled
                                    ? `text-base-content/30 cursor-not-allowed ${dayHoliday ? 'bg-error/20 border border-error/30' : ''}`
                                    : isSelected
                                    ? 'bg-primary text-primary-content shadow-sm'
                                    : 'text-base-content hover:bg-base-300 border border-base-300 hover:border-primary cursor-pointer'
                                }`}
                                title={dayHoliday || (isDisabled ? 'Not available' : '')}
                              >
                                <div className="flex flex-col items-center gap-0.5">
                                  {day ? format(day, 'd') : ''}
                                  {hasAppointments && !isSelected && !dayHoliday && (
                                    <div className="flex gap-0.5 justify-center">
                                      {dayAppointments.slice(0, 2).map((appt, idx) => (
                                        <div key={idx} className={`w-1 h-1 rounded-full ${
                                          appt.status === 'confirmed' ? 'bg-success' :
                                          appt.status === 'pending' ? 'bg-warning' :
                                          appt.status === 'cancelled' ? 'bg-error' : 'bg-base-content/30'
                                        }`}></div>
                                      ))}
                                      {dayAppointments.length > 2 && <span className="text-xs leading-none">+</span>}
                                    </div>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Time Picker */}
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">Time *</label>
                      <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-2">
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
                            className={`px-3 py-2.5 rounded-lg font-medium text-xs transition-all border ${
                              formData.startTime.split('T')[1] === slot.time
                                ? 'bg-primary text-primary-content border-primary shadow-sm'
                                : slot.disabled
                                ? 'bg-base-300 text-base-content/50 border-base-300 cursor-not-allowed'
                                : 'bg-base-100 text-base-content border-base-300 hover:border-primary hover:bg-base-200'
                            }`}
                          >
                            <div className="font-medium">{slot.display}</div>
                            {slot.reason && <div className="text-xs opacity-60">{slot.reason}</div>}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">Duration</label>
                      <select
                        value={formData.duration}
                        onChange={handleDurationChange}
                        className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-lg text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none text-sm shadow-sm hover:border-base-400"
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
                      <div className="bg-base-100 border border-base-300 rounded-lg p-4">
                        <p className="text-xs text-base-content/60 mb-2 font-medium">End Time</p>
                        <p className="text-base font-semibold text-base-content">
                          {format(parseISO(formData.endTime), 'h:mm a')} • {format(parseISO(formData.endTime), 'MMM d')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meeting Details */}
                <div className="space-y-4 p-5 bg-base-200 rounded-lg border border-base-300">
                  <div className="flex items-center gap-3 pb-3 border-b border-base-300">
                    <Zap className="w-5 h-5 text-primary" />
                    <h3 className="text-sm font-semibold text-base-content">Details</h3>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">Meeting Type</label>
                    <select
                      name="meetingType"
                      value={formData.meetingType}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-lg text-base-content focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all appearance-none text-sm shadow-sm hover:border-base-400"
                    >
                      <option>Video Call</option>
                      <option>Phone Call</option>
                      <option>In Person</option>
                    </select>
                  </div>

                  {formData.meetingType === 'In Person' && (
                    <div>
                      <label className="block text-sm font-medium text-base-content mb-2">Location *</label>
                      <input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Coffee Shop, Library"
                        className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-lg text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all text-sm shadow-sm hover:border-base-400"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-base-content mb-2">Notes</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Add any additional details..."
                      rows="3"
                      className="w-full px-4 py-3 bg-base-100 border border-base-300 rounded-lg text-base-content placeholder-base-content/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none text-sm shadow-sm hover:border-base-400"
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4 border-t border-base-300">
                  {appointment && onDelete && (
                    <button
                      type="button"
                      onClick={() => setShowCancellation(true)}
                      className="px-4 py-2.5 rounded-lg transition-all border text-sm font-medium bg-error/10 hover:bg-error/20 text-error border-error/30"
                    >
                      Cancel
                    </button>
                  )}
                  <div className="flex-1 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={handleClose}
                      className="px-5 py-2.5 font-medium rounded-lg transition-all border text-sm bg-base-200 hover:bg-base-300 border-base-300 text-base-content"
                    >
                      Close
                    </button>
                    <button
                      type="submit"
                      disabled={currentUserStatus === 'away' || (formData.friendId && friendsAvailability[formData.friendId]?.status === 'away') || (() => {
                        if (!formData.startTime || !formData.friendId) return false;
                        const maxPerDay = availability?.maxPerDay || 5;
                        const allApptsOnDate = getAllAppointmentsForDate(parseISO(formData.startTime));
                        return allApptsOnDate.length >= maxPerDay;
                      })()}
                      className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-primary-content font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm"
                    >
                      Next →
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              // STEP 2: Review/Summary
              <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
                <div className="bg-success/10 border border-success/30 rounded-lg p-3 sm:p-5 space-y-3 sm:space-y-4">
                  <h4 className="text-sm sm:text-lg font-semibold text-base-content flex items-center gap-2 sm:gap-3">
                    <div className="w-6 sm:w-7 h-6 sm:h-7 rounded-full bg-success flex items-center justify-center text-success-content font-semibold text-xs">✓</div>
                    <span className="hidden sm:inline">Review</span>
                    <span className="sm:hidden">Check</span>
                  </h4>
                  
                  <div className="space-y-2 sm:space-y-3">
                    {/* Title */}
                    {formData.title && (
                      <div className="pb-2 sm:pb-3 border-b border-success/20">
                        <p className="text-xs text-base-content/60 font-medium mb-0.5 sm:mb-1 uppercase">Title</p>
                        <p className="text-xs sm:text-sm font-semibold text-base-content truncate">{formData.title}</p>
                      </div>
                    )}

                    {/* Date & Time - responsive grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2">
                      <div className="bg-base-100 border border-base-300 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-base-content/60 font-medium mb-0.5 sm:mb-1 uppercase">Date</p>
                        <p className="text-xs sm:text-sm font-semibold text-base-content">{format(parseISO(formData.startTime), 'MMM d')}</p>
                        <p className="text-xs text-base-content/60 mt-0.5">{format(parseISO(formData.startTime), 'EEE')}</p>
                      </div>
                      <div className="bg-base-100 border border-base-300 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-base-content/60 font-medium mb-0.5 sm:mb-1 uppercase">Time</p>
                        <p className="text-xs sm:text-sm font-semibold text-base-content">{format(parseISO(formData.startTime), 'h:mm a')}</p>
                        <p className="text-xs text-base-content/60 mt-0.5">{formData.duration}m</p>
                      </div>
                      <div className="bg-base-100 border border-base-300 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-base-content/60 font-medium mb-0.5 sm:mb-1 uppercase">Type</p>
                        <p className="text-xs sm:text-sm font-semibold text-base-content truncate">{formData.meetingType}</p>
                      </div>
                    </div>

                    {/* With & Location (if applicable) */}
                    <div className="bg-base-100 border border-base-300 rounded-lg p-2 sm:p-3">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-base-content/60 font-medium uppercase mb-0.5 sm:mb-1">With</p>
                          <p className="text-xs sm:text-sm font-semibold text-base-content truncate">{friends.find(f => f._id === formData.friendId)?.fullName || 'Selected friend'}</p>
                        </div>
                        {formData.meetingType === 'In Person' && formData.location && (
                          <div className="text-left sm:text-right flex-shrink-0">
                            <p className="text-xs text-base-content/60 font-medium uppercase mb-0.5 sm:mb-1">Location</p>
                            <p className="text-xs sm:text-sm font-semibold text-base-content">{formData.location}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Notes if present */}
                    {formData.description && (
                      <div className="bg-base-100 border border-base-300 rounded-lg p-2 sm:p-3">
                        <p className="text-xs text-base-content/60 font-medium mb-0.5 sm:mb-1 uppercase">Notes</p>
                        <p className="text-xs text-base-content leading-relaxed line-clamp-2">{formData.description}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Buttons - responsive */}
                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-2 border-t border-base-300">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2 font-medium rounded-lg transition-all border text-xs sm:text-sm bg-base-200 hover:bg-base-300 border-base-300 text-base-content"
                  >
                    <span className="hidden sm:inline">← Back</span>
                    <span className="sm:hidden">Back</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmAppointment}
                    className="flex-1 px-3 sm:px-4 py-2 sm:py-2 bg-success hover:bg-success/90 text-success-content font-medium rounded-lg transition-all text-xs sm:text-sm shadow-sm"
                  >
                    <span className="hidden sm:inline">✓ {isEditMode ? 'Update' : 'Confirm'}</span>
                    <span className="sm:hidden">✓ Ok</span>
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

      {/* All Appointments Modal */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
            onClick={() => setShowAppointmentsModal(false)}
          ></div>

          {/* Modal */}
          <div className="relative z-50 bg-base-100 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
            {/* Header */}
            <div className="bg-base-200 border-b border-base-300 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-base-content">
                  All Scheduled Appointments
                </h3>
                <p className="text-xs text-base-content/60 mt-1">
                  with {friends.find(f => f._id === formData.friendId)?.fullName || 'Selected friend'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAppointmentsModal(false)}
                className="p-2 hover:bg-base-300 rounded-lg transition-all text-base-content/60 hover:text-base-content"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const allFriendAppts = getAllAppointmentsForFriend();
                return allFriendAppts.length > 0 ? (
                  <div className="space-y-2">
                    {allFriendAppts.map((appt, idx) => {
                      const startTime = typeof appt.startTime === 'string' ? parseISO(appt.startTime) : new Date(appt.startTime);
                      const endTime = typeof appt.endTime === 'string' ? parseISO(appt.endTime) : new Date(appt.endTime);
                      const durationMinutes = Math.round((endTime - startTime) / (1000 * 60));
                      const durationDisplay = durationMinutes < 60 
                        ? `${durationMinutes}m` 
                        : `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
                      
                      return (
                        <div key={idx} className="flex items-center gap-3 p-4 bg-base-100 border border-base-300 rounded-lg hover:border-primary/50 transition">
                          <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                            appt.status === 'confirmed' ? 'bg-green-500' :
                            appt.status === 'pending' ? 'bg-yellow-500' :
                            appt.status === 'declined' ? 'bg-red-500' :
                            appt.status === 'completed' ? 'bg-gray-500' :
                            appt.status === 'cancelled' ? 'bg-red-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-semibold text-base-content truncate">{appt.title || 'Untitled'}</p>
                            <p className="text-sm text-base-content/60 mt-1">
                              {format(startTime, 'MMM d, yyyy')} • {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')} ({durationDisplay})
                            </p>
                            {appt.description && (
                              <p className="text-xs text-base-content/50 mt-1 line-clamp-1">{appt.description}</p>
                            )}
                          </div>
                          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0 whitespace-nowrap ${
                            appt.status === 'confirmed' ? 'bg-green-100 text-green-700' :
                            appt.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            appt.status === 'declined' ? 'bg-red-100 text-red-700' :
                            appt.status === 'completed' ? 'bg-gray-200 text-gray-700' :
                            appt.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {appt.status?.charAt(0).toUpperCase() + appt.status?.slice(1) || 'Scheduled'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <p className="text-base-content/60">No appointments found</p>
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="border-t border-base-300 px-6 py-3">
              <button
                type="button"
                onClick={() => setShowAppointmentsModal(false)}
                className="w-full px-4 py-2 bg-base-200 hover:bg-base-300 text-base-content font-medium rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
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
    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
      <p className="text-red-700 font-medium text-sm flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">⚠️</span>
        <span>Cancelling will notify the other person. Please select a reason.</span>
      </p>
    </div>

    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900">Cancellation Reason *</label>
      <div className="space-y-2">
        {CANCELLATION_REASONS.map((reason) => (
          <label key={reason} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 cursor-pointer transition border border-gray-200 hover:border-red-300">
            <input
              type="radio"
              name="cancellation"
              value={reason}
              checked={cancellationReason === reason}
              onChange={(e) => setCancellationReason(e.target.value)}
              className="w-4 h-4 accent-red-600"
            />
            <span className="text-sm font-medium text-gray-900">
              {reason}
            </span>
          </label>
        ))}
      </div>
    </div>

    {cancellationReason === 'Other (Please specify)' && (
      <div className="space-y-3">
        <label className="block text-sm font-semibold text-gray-900">Explain Your Reason *</label>
        <textarea
          value={customReason}
          onChange={(e) => setCustomReason(e.target.value)}
          placeholder="Enter your cancellation reason..."
          rows="3"
          className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all resize-none text-sm shadow-sm hover:border-gray-400"
        />
      </div>
    )}

    <div className="flex gap-3 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all border border-gray-300 text-sm"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-all text-sm shadow-sm"
      >
        Confirm Cancellation
      </button>
    </div>
  </div>
);

// Decline Form Component
const DeclineForm = ({ declineMessage, setDeclineMessage, onCancel, onSubmit }) => (
  <div className="p-8 space-y-6">
    <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
      <p className="text-yellow-800 font-medium text-sm flex items-start gap-3">
        <span className="text-lg flex-shrink-0 mt-0.5">ℹ️</span>
        <span>Declining will notify the requester. Please provide a clear reason.</span>
      </p>
    </div>

    <div className="space-y-3">
      <label className="block text-sm font-semibold text-gray-900">Your Message *</label>
      <textarea
        value={declineMessage}
        onChange={(e) => setDeclineMessage(e.target.value)}
        placeholder="Explain why you're declining this appointment..."
        rows="4"
        className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent transition-all resize-none text-sm shadow-sm hover:border-gray-400"
      />
    </div>

    <div className="flex gap-3 pt-4 border-t border-gray-200">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 px-5 py-2.5 bg-white hover:bg-gray-50 text-gray-900 font-medium rounded-lg transition-all border border-gray-300 text-sm"
      >
        Keep Appointment
      </button>
      <button
        type="button"
        onClick={onSubmit}
        className="flex-1 px-5 py-2.5 bg-yellow-600 hover:bg-yellow-700 text-white font-medium rounded-lg transition-all text-sm shadow-sm"
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
