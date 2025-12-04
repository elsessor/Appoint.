import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, addMonths, subMonths, addWeeks, subWeeks, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, isWeekend, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import DayDetailsModal from './DayDetailsModal';
import { getPhilippineHolidays, isHoliday, getHolidayName } from '../../utils/philippineHolidays';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const Calendar = ({
  appointments = [],
  friends = [],
  currentUser,
  onAppointmentCreate,
  onAppointmentUpdate,
  onAppointmentDelete,
  availability = {
    days: [1, 2, 3, 4, 5], // Monday to Friday
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
    buffer: 15,
  },
  holidays = {},
  visibleFriends = [],
  isMultiCalendarMode = false,
  isViewingFriendAway = false,
  viewingFriendId = null,
  friendsAvailability = {},
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [phHolidays, setPhHolidays] = useState([]);
  const [viewMode, setViewMode] = useState('month'); // 'month' or 'week'

  // Color palette for multi-calendar display
  const colorPalette = [
    { name: 'blue', apptBg: 'bg-blue-100', apptText: 'text-blue-700', apptBorder: 'border-blue-300', badge: 'bg-blue-500' },
    { name: 'purple', apptBg: 'bg-purple-100', apptText: 'text-purple-700', apptBorder: 'border-purple-300', badge: 'bg-purple-500' },
    { name: 'emerald', apptBg: 'bg-emerald-100', apptText: 'text-emerald-700', apptBorder: 'border-emerald-300', badge: 'bg-emerald-500' },
    { name: 'rose', apptBg: 'bg-rose-100', apptText: 'text-rose-700', apptBorder: 'border-rose-300', badge: 'bg-rose-500' },
    { name: 'amber', apptBg: 'bg-amber-100', apptText: 'text-amber-700', apptBorder: 'border-amber-300', badge: 'bg-amber-500' },
    { name: 'cyan', apptBg: 'bg-cyan-100', apptText: 'text-cyan-700', apptBorder: 'border-cyan-300', badge: 'bg-cyan-500' },
    { name: 'pink', apptBg: 'bg-pink-100', apptText: 'text-pink-700', apptBorder: 'border-pink-300', badge: 'bg-pink-500' },
    { name: 'indigo', apptBg: 'bg-indigo-100', apptText: 'text-indigo-700', apptBorder: 'border-indigo-300', badge: 'bg-indigo-500' },
  ];

  // Get color for a specific friend
  const getColorForFriend = (friendId) => {
    const friendIndex = friends.findIndex(f => f._id === friendId);
    return friendIndex >= 0 ? colorPalette[(friendIndex + 1) % colorPalette.length] : colorPalette[0];
  };

  // Get owner name for appointment
  const getAppointmentOwner = (appointment) => {
    const userId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    const currentUserId = currentUser?._id || currentUser?.id;

    if (userId === currentUserId) return currentUser?.name || currentUser?.fullName || 'You';
    if (friendId === currentUserId) return currentUser?.name || currentUser?.fullName || 'You';

    const friend = friends.find(f => f._id === userId || f._id === friendId);
    return friend?.name || friend?.fullName || 'Friend';
  };

  // Get owner IDs for appointment (both participants in multi-calendar mode)
  const getAppointmentOwnerIds = (appointment) => {
    const userId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    return [userId, friendId].filter(id => id); // Return both participant IDs
  };

  // Get the friend ID from an appointment (for filtering in multi-calendar mode)
  const getAppointmentFriendId = (appointment) => {
    const userId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    const currentUserId = currentUser?._id || currentUser?.id;
    
    // Return the friend ID (whoever is NOT the current user)
    if (userId === currentUserId) {
      return friendId;
    } else {
      return userId;
    }
  };

  // Get primary owner ID for coloring
  const getAppointmentOwnerId = (appointment) => {
    const userId = appointment.userId?._id || appointment.userId;
    return userId; // Return the person who booked it
  };

  // Get status badge colors only (not card colors)
  const getStatusBadgeColor = (status) => {
    const statusColorMap = {
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-700' },
      confirmed: { bg: 'bg-green-100', text: 'text-green-700' },
      completed: { bg: 'bg-gray-200', text: 'text-gray-700' },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-700' },
      declined: { bg: 'bg-red-100', text: 'text-red-700' },
    };
    return statusColorMap[status?.toLowerCase()] || { bg: 'bg-gray-200', text: 'text-gray-700' };
  };

  // Check if friend is visible
  const isFriendVisible = (friendId) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    if (friendId === currentUserId) return true; // Always show current user
    return isMultiCalendarMode ? visibleFriends.includes(friendId) : true;
  };

  // Check if current user is a participant in an appointment
  const isUserParticipant = (appointment) => {
    const currentUserId = currentUser?._id || currentUser?.id;
    const userId = appointment.userId?._id || appointment.userId;
    const friendId = appointment.friendId?._id || appointment.friendId;
    return userId === currentUserId || friendId === currentUserId;
  };

  // Load Philippine holidays for the current year
  useEffect(() => {
    const year = currentMonth.getFullYear();
    setPhHolidays(getPhilippineHolidays(year));
  }, [currentMonth]);

  // Navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const nextWeek = () => setCurrentMonth(addWeeks(currentMonth, 1));
  const prevWeek = () => setCurrentMonth(subWeeks(currentMonth, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  // Get days for the current view
  let daysInView = [];
  let displayStart = new Date();
  let displayEnd = new Date();

  if (viewMode === 'month') {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const startDate = new Date(monthStart);
    startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
    
    const endDate = new Date(monthEnd);
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday
    
    daysInView = eachDayOfInterval({ start: startDate, end: endDate });
    displayStart = startDate;
    displayEnd = endDate;
  } else {
    // Week view
    const weekStart = startOfWeek(currentMonth);
    const weekEnd = endOfWeek(currentMonth);
    daysInView = eachDayOfInterval({ start: weekStart, end: weekEnd });
    displayStart = weekStart;
    displayEnd = weekEnd;
  }

  const daysInMonth = daysInView;

  // Group appointments by date for easy lookup
  const appointmentsByDate = useMemo(() => {
    const map = new Map();
    
    appointments.forEach(appointment => {
      // Don't filter any appointments here - show all for calendar reference
      if (!appointment.startTime) return;
      
      try {
        const date = typeof appointment.startTime === 'string' 
          ? parseISO(appointment.startTime.split('T')[0])
          : new Date(appointment.startTime);
          
        if (isNaN(date.getTime())) return;
        
        const dateStr = format(date, 'yyyy-MM-dd');
        
        if (!map.has(dateStr)) {
          map.set(dateStr, []);
        }
        
        map.get(dateStr).push(appointment);
      } catch (e) {
        console.error('Error processing appointment date:', e);
      }
    });
    
    return map;
  }, [appointments]);

  // Check if a date has appointments
  const hasAppointments = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointmentsByDate.has(dateStr) && appointmentsByDate.get(dateStr).length > 0;
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return appointmentsByDate.get(dateStr) || [];
  };

  // Handle date selection
  const handleDateClick = (day) => {
    if (!isDateAvailable(day)) {
      const holidayName = getHolidayName(day, phHolidays);
      if (holidayName) {
        toast.error(`Cannot book on ${holidayName} - service not available`);
      }
      return;
    }
    setSelectedDate(day);
  };

  // Handle creating a new appointment
  const handleCreateAppointment = (date, time) => {
    if (isViewingFriendAway) {
      toast.error('Cannot book when the user is away');
      return;
    }
    if (!isDateAvailable(date)) {
      const holidayName = getHolidayName(date, phHolidays);
      if (holidayName) {
        toast.error(`Cannot book on ${holidayName} - service not available`);
      }
      return;
    }
    if (onAppointmentCreate) {
      onAppointmentCreate({ date, time });
    }
  };

  // Check if a date is available for booking
  const isDateAvailable = (date) => {
    // Check if it's a Philippine holiday
    if (isHoliday(date, phHolidays)) return false;
    
    // Check if it's in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isBefore(date, today)) return false;
    
    // Check if it's within available days (based on friend's availability)
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const friendAvailableDays = availability?.days || [1, 2, 3, 4, 5];
    if (!friendAvailableDays.includes(dayOfWeek)) return false;
    
    // Check if it's within working hours
    if (availability?.start && availability?.end) {
      // We'll allow any date within available days, but time validation happens during booking
    }
    
    return true;
  };

  // Check if a specific time slot is available
  const isTimeSlotAvailable = (date, time) => {
    // In a real app, you would check against existing appointments and business rules
    return true;
  };

  // Get the currently viewed user (either current user or selected friend)
  const viewedUser = useMemo(() => {
    return currentUser;
  }, [currentUser]);

  return (
    <div className="bg-base-100 rounded-lg shadow-2xl overflow-hidden border border-base-300">
      {/* Away Status Banner */}
      {isViewingFriendAway && viewingFriendId && (
        <div className="bg-error/20 border-b-2 border-error px-6 py-3 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-error flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-error">Cannot book appointment</p>
            <p className="text-xs text-error/80">This user is currently away and not accepting bookings</p>
          </div>
        </div>
      )}
      {/* Calendar Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 px-6 py-4 border-b border-base-300 bg-base-200">
        <h2 className="text-lg font-semibold text-base-content">
          {viewMode === 'month' 
            ? format(currentMonth, 'MMMM yyyy')
            : `${format(displayStart, 'MMM d')} - ${format(displayEnd, 'MMM d, yyyy')}`
          }
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={resetToToday}
            className="btn btn-outline btn-xs md:btn-sm"
          >
            Today
          </button>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={() => setViewMode('month')}
              className={`btn btn-xs md:btn-sm rounded-r-none ${
                viewMode === 'month' 
                  ? 'btn-primary' 
                  : 'btn-outline'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`btn btn-xs md:btn-sm rounded-l-none ${
                viewMode === 'week' 
                  ? 'btn-primary' 
                  : 'btn-outline'
              }`}
            >
              Week
            </button>
          </div>
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={viewMode === 'month' ? prevMonth : prevWeek}
              className="btn btn-outline btn-xs md:btn-sm rounded-r-none"
              title="Previous"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={viewMode === 'month' ? nextMonth : nextWeek}
              className="btn btn-outline btn-xs md:btn-sm rounded-l-none"
              title="Next"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          {!viewingFriendId && (
            <button
              onClick={() => {
                if (onAppointmentCreate) {
                  onAppointmentCreate({ date: new Date() });
                }
              }}
              className="btn btn-primary btn-xs md:btn-sm"
            >
              New +
            </button>
          )}
        </div>
      </div>
      {/* Friend Search Modal */}
      {/* Legend */}
      <div className="px-3 sm:px-6 py-1 sm:py-2 bg-base-200 border-b border-base-300">
        <div className="flex items-center justify-center gap-2 sm:gap-3 text-xs flex-wrap">
          <div className="flex items-center gap-1">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-info"></div>
            <span className="text-base-content/70 hidden sm:inline">Today</span>
            <span className="text-base-content/70 sm:hidden">T</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded-full bg-success"></div>
            <span className="text-base-content/70 hidden sm:inline">Available</span>
            <span className="text-base-content/70 sm:hidden">A</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded bg-primary/70"></div>
            <span className="text-base-content/70 hidden sm:inline">Has Appts</span>
            <span className="text-base-content/70 sm:hidden">Ap</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-1.5 sm:w-2 h-1.5 sm:h-2 rounded bg-error"></div>
            <span className="text-base-content/70 hidden sm:inline">Holiday</span>
            <span className="text-base-content/70 sm:hidden">H</span>
          </div>
        </div>
      </div>

      {/* Availability Schedule Info */}
      <div className="px-3 sm:px-6 py-2 sm:py-4 bg-base-100 border-b border-base-300">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
          {/* Working Hours */}
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xs font-semibold text-base-content/60 uppercase">Hours</p>
            <p className="text-xs sm:text-sm font-medium text-base-content">
              {availability?.start || '09:00'} - {availability?.end || '17:00'}
            </p>
          </div>

          {/* Available Days */}
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xs font-semibold text-base-content/60 uppercase">Days</p>
            <div className="flex flex-wrap gap-0.5 sm:gap-1">
              {(() => {
                const dayNames = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
                const availableDays = availability?.days || [1, 2, 3, 4, 5];
                return dayNames.map((day, idx) => (
                  <span
                    key={idx}
                    className={`text-xs px-1.5 sm:px-2 py-0.5 sm:py-1 rounded font-medium ${
                      availableDays.includes(idx)
                        ? 'bg-success text-success-content'
                        : 'bg-base-300 text-base-content/50 line-through'
                    }`}
                  >
                    {day}
                  </span>
                ));
              })()}
            </div>
          </div>

          {/* Slot Duration */}
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xs font-semibold text-base-content/60 uppercase">Duration</p>
            <p className="text-xs sm:text-sm font-medium text-base-content">
              {availability?.slotDuration || 30} min
            </p>
          </div>

          {/* Lead Time */}
          <div className="space-y-0.5 sm:space-y-1">
            <p className="text-xs font-semibold text-base-content/60 uppercase hidden lg:block">Lead Time</p>
            <p className="text-xs font-semibold text-base-content/60 uppercase lg:hidden">Lead</p>
            <p className="text-xs sm:text-sm font-medium text-base-content">
              {availability?.minLeadTime || 0}h
            </p>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-base-300 border-b border-base-300 overflow-x-auto">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-base-200 py-1 md:py-2 text-center text-xs font-medium text-base-content/70 uppercase tracking-wider">
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{day[0]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-base-300 overflow-x-auto">
        {daysInMonth.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isDateAvailableNow = isDateAvailable(day);
          const hasAppts = hasAppointments(day);
          const isDayToday = isToday(day);
          const dayHoliday = isHoliday(day, phHolidays) ? getHolidayName(day, phHolidays) : null;
          
          // Get max appointments for the current user (or viewed friend if applicable)
          const maxPerDay = viewingFriendId 
            ? (friendsAvailability[viewingFriendId]?.maxPerDay || 5)
            : (currentUser?.availability?.maxPerDay || 5);
          
          // Get appointments for this specific day and filter correctly
          const dayAppointments = getAppointmentsForDate(day);
          
          // Filter by the viewed user if viewing a friend's calendar, and show only CONFIRMED
          const relevantAppointments = viewingFriendId 
            ? dayAppointments.filter(appt => {
                // ✅ Only count CONFIRMED appointments for capacity
                if (appt.status !== 'confirmed') return false;
                const apptUserId = String(appt.userId?._id || appt.userId);
                const apptFriendId = String(appt.friendId?._id || appt.friendId);
                return apptUserId === viewingFriendId || apptFriendId === viewingFriendId;
              })
            : dayAppointments.filter(appt => appt.status === 'confirmed');
          
          const dayAppointmentsCount = relevantAppointments.length;
          const isAtCapacity = dayAppointmentsCount >= maxPerDay;
          const capacityPercentage = Math.min((dayAppointmentsCount / maxPerDay) * 100, 100);
          
          return (
            <div 
              key={i}
              className={`relative ${viewMode === 'month' ? 'min-h-20 sm:min-h-24 md:min-h-28' : 'min-h-32'} p-0.5 sm:p-1 md:p-2 bg-base-100 ${
                isViewingFriendAway ? 'opacity-50 cursor-not-allowed' : (
                  !isDateAvailableNow && isCurrentMonth ? 'opacity-60 cursor-not-allowed bg-base-300' : (
                    isAtCapacity ? 'bg-error/5 border border-error/20' : 'hover:bg-base-200'
                  )
                )
              } cursor-pointer ${
                !isCurrentMonth ? 'bg-base-300 text-base-content/30' : ''
              } ${isSelected ? 'ring-2 ring-primary z-10' : ''} transition-all touch-manipulation`}
              onClick={() => isDateAvailableNow && !isViewingFriendAway && handleDateClick(day)}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-1">
                  <span 
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                      isDayToday 
                        ? 'bg-info text-info-content font-semibold' 
                        : 'text-base-content'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {/* Capacity indicator */}
                  {isCurrentMonth && isDateAvailableNow && (
                    <div className="flex items-center gap-1">
                      {isAtCapacity && (
                        <span className="text-xs font-bold text-error" title="Day is fully booked">🔴</span>
                      )}
                      {!isAtCapacity && dayAppointmentsCount > 0 && (
                        <span className="text-xs font-semibold text-warning" title={`${dayAppointmentsCount}/${maxPerDay} booked`}>
                          {dayAppointmentsCount}/{maxPerDay}
                        </span>
                      )}
                      {!hasAppts && !dayHoliday && (
                        <span className="w-1.5 h-1.5 rounded-full bg-success" title="Available"></span>
                      )}
                    </div>
                  )}
                  
                  {dayHoliday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-error" title="Holiday - No bookings available"></span>
                  )}
                </div>

                {/* Capacity bar under the day number */}
                {isCurrentMonth && isDateAvailableNow && dayAppointmentsCount > 0 && (
                  <div className="w-full bg-base-300 rounded-full h-1 mb-1 overflow-hidden">
                    <div 
                      className={`h-full transition-all ${
                        isAtCapacity ? 'bg-error' : 'bg-warning'
                      }`}
                      style={{ width: `${capacityPercentage}%` }}
                    ></div>
                  </div>
                )}
                
                <div className="flex-1 overflow-hidden">
                  {dayHoliday && (
                    <div className="text-xs text-error font-bold truncate mb-1 bg-error/10 px-1 py-0.5 rounded">
                      {dayHoliday}
                    </div>
                  )}
                  
                  {hasAppts && (
                    <div className="space-y-1">
                      {getAppointmentsForDate(day)
                        .filter(appt => {
                          // ✅ Only show CONFIRMED appointments in calendar view
                          if (appt.status !== 'confirmed') return false;
                          
                          // In multi-calendar mode, show appointment if the friend is visible
                          if (isMultiCalendarMode) {
                            const friendId = getAppointmentFriendId(appt);
                            return isFriendVisible(friendId);
                          }
                          // In single calendar mode:
                          // - If viewing friend's calendar, show ALL their appointments
                          // - Otherwise, show only appointments where current user is a participant
                          if (viewingFriendId) {
                            const apptUserId = String(appt.userId?._id || appt.userId);
                            const apptFriendId = String(appt.friendId?._id || appt.friendId);
                            const viewingFriendIdStr = String(viewingFriendId);
                            return apptUserId === viewingFriendIdStr || apptFriendId === viewingFriendIdStr;
                          }
                          return isUserParticipant(appt);
                        })
                        .slice(0, 3)
                        .map((appt) => {
                          const ownerId = getAppointmentOwnerId(appt);
                          const ownerColor = isMultiCalendarMode ? getColorForFriend(ownerId) : null;
                          const statusBadgeColor = getStatusBadgeColor(appt.status);
                          
                          // Check if current user is involved in this appointment
                          const currentUserId = currentUser?._id || currentUser?.id;
                          const apptUserId = String(appt.userId?._id || appt.userId);
                          const apptFriendId = String(appt.friendId?._id || appt.friendId);
                          const currentUserIdStr = String(currentUserId);
                          const isCurrentUserInvolved = apptUserId === currentUserIdStr || apptFriendId === currentUserIdStr;
                          
                          // Use owner color for multi-calendar mode background, theme colors for single mode
                          const apptBgClass = isMultiCalendarMode && ownerColor ? ownerColor.apptBg : 'bg-base-100';
                          const apptTextClass = isMultiCalendarMode && ownerColor ? ownerColor.apptText : 'text-base-content';
                          const apptBorderClass = isMultiCalendarMode && ownerColor ? ownerColor.apptBorder : 'border-base-300';
                          
                          // Determine display text based on viewing context
                          let displayText = appt.title;
                          let tooltipText = appt.title;
                          
                          if (viewingFriendId && !isCurrentUserInvolved) {
                            // Appointment between other people - show title with participant info in tooltip
                            const userName = appt.userId?.fullName || appt.userId?.name || 'User';
                            const friendName = appt.friendId?.fullName || appt.friendId?.name || 'Friend';
                            displayText = appt.title; // Show the appointment title
                            tooltipText = `${appt.title} (${userName} with ${friendName})`;
                          } else if (isMultiCalendarMode) {
                            tooltipText = `${appt.title} (${getAppointmentOwner(appt)})`;
                          }
                          
                          return (
                            <div 
                              key={appt._id || appt.id}
                              className={`px-1 py-0.5 text-xs truncate rounded border ${apptBgClass} ${apptTextClass} ${apptBorderClass} border-l-2 hover:shadow-sm cursor-pointer`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedAppointment(appt);
                                setSelectedDate(day);
                              }}
                              title={tooltipText}
                            >
                              {isMultiCalendarMode && (
                                <span className="font-semibold">{getAppointmentOwner(appt)[0]}</span>
                              )}
                              {isMultiCalendarMode && ' '}{displayText}
                            </div>
                          );
                        })}
                      
                      {getAppointmentsForDate(day).filter(appt => {
                        // ✅ Only show CONFIRMED appointments in calendar view
                        if (appt.status !== 'confirmed') return false;
                        
                        if (isMultiCalendarMode) {
                          const friendId = getAppointmentFriendId(appt);
                          return isFriendVisible(friendId);
                        }
                        // Use same filtering logic as above
                        if (viewingFriendId) {
                          const apptUserId = String(appt.userId?._id || appt.userId);
                          const apptFriendId = String(appt.friendId?._id || appt.friendId);
                          const viewingFriendIdStr = String(viewingFriendId);
                          return apptUserId === viewingFriendIdStr || apptFriendId === viewingFriendIdStr;
                        }
                        return isUserParticipant(appt);
                      }).length > 3 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{getAppointmentsForDate(day).filter(appt => {
                            // ✅ Only show CONFIRMED appointments in calendar view
                            if (appt.status !== 'confirmed') return false;
                            
                            if (isMultiCalendarMode) {
                              const friendId = getAppointmentFriendId(appt);
                              return isFriendVisible(friendId);
                            }
                            // Use same filtering logic as above
                            if (viewingFriendId) {
                              const apptUserId = String(appt.userId?._id || appt.userId);
                              const apptFriendId = String(appt.friendId?._id || appt.friendId);
                              const viewingFriendIdStr = String(viewingFriendId);
                              return apptUserId === viewingFriendIdStr || apptFriendId === viewingFriendIdStr;
                            }
                            return isUserParticipant(appt);
                          }).length - 3} more
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Day Details Modal */}
      {selectedDate && (
        <DayDetailsModal
          date={selectedDate}
          appointments={getAppointmentsForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onCreateAppointment={onAppointmentCreate}
          isHoliday={getHolidayName(selectedDate, phHolidays)}
          currentUser={currentUser}
          friends={friends}
          availability={availability}
          friendsAvailability={friendsAvailability}
          viewingFriendId={viewingFriendId}
        />
      )}

    </div>
  );
};

Calendar.propTypes = {
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]).isRequired,
      endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      status: PropTypes.string,
      message: PropTypes.string,
      participant: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
      }),
      userId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      friendId: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
    })
  ),
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      fullName: PropTypes.string,
      email: PropTypes.string.isRequired,
      profilePic: PropTypes.string,
    })
  ),
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
    id: PropTypes.string,
    name: PropTypes.string,
    fullName: PropTypes.string,
    email: PropTypes.string.isRequired,
    profilePic: PropTypes.string,
  }),
  onAppointmentCreate: PropTypes.func,
  onAppointmentUpdate: PropTypes.func,
  onAppointmentDelete: PropTypes.func,
  availability: PropTypes.shape({
    days: PropTypes.arrayOf(PropTypes.number),
    start: PropTypes.string,
    end: PropTypes.string,
    slotDuration: PropTypes.number,
    buffer: PropTypes.number,
  }),
  holidays: PropTypes.object,
  visibleFriends: PropTypes.arrayOf(PropTypes.string),
  isMultiCalendarMode: PropTypes.bool,
};

Calendar.defaultProps = {
  appointments: [],
  friends: [],
  availability: {
    days: [1, 2, 3, 4, 5], // Monday to Friday
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
    buffer: 15,
  },
  holidays: {},
};

export default Calendar;
