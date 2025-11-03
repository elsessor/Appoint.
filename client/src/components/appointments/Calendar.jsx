import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, isWeekend, parseISO } from 'date-fns';
import DayDetailsModal from './DayDetailsModal';
import AppointmentModal from './AppointmentModal';
import { getPhilippineHolidays, isHoliday, getHolidayName } from '../../utils/philippineHolidays';

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
  viewingFriendId = null,
  onViewingFriendChange,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [phHolidays, setPhHolidays] = useState([]);
  const [showFriendDropdown, setShowFriendDropdown] = useState(false);

  // Load Philippine holidays for the current year
  useEffect(() => {
    const year = currentMonth.getFullYear();
    setPhHolidays(getPhilippineHolidays(year));
  }, [currentMonth]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showFriendDropdown && !event.target.closest('.friend-dropdown-container')) {
        setShowFriendDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFriendDropdown]);

  // Navigation functions
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const resetToToday = () => setCurrentMonth(new Date());

  // Get days for the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const startDate = new Date(monthStart);
  startDate.setDate(startDate.getDate() - startDate.getDay()); // Start from Sunday
  
  const endDate = new Date(monthEnd);
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay())); // End on Saturday

  const daysInMonth = eachDayOfInterval({ start: startDate, end: endDate });

  // Group appointments by date for easy lookup
  const appointmentsByDate = useMemo(() => {
    const map = new Map();
    
    appointments.forEach(appointment => {
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
    setSelectedDate(day);
  };

  // Handle creating a new appointment
  const handleCreateAppointment = (date, time) => {
    setSelectedDate(date);
    setSelectedTime(time);
    setSelectedAppointment(null);
    setShowAppointmentModal(true);
  };

  // Handle form submission
  const handleAppointmentSubmit = (appointmentData) => {
    if (selectedAppointment) {
      // Update existing appointment
      onAppointmentUpdate && onAppointmentUpdate({
        ...selectedAppointment,
        ...appointmentData,
      });
    } else {
      // Create new appointment
      onAppointmentCreate && onAppointmentCreate(appointmentData);
    }
    
    setShowAppointmentModal(false);
    setSelectedAppointment(null);
  };

  // Check if a date is available for booking
  const isDateAvailable = (date) => {
    // Check if it's a weekend
    if (isWeekend(date)) return false;
    
    // Check if it's a Philippine holiday
    if (isHoliday(date, phHolidays)) return false;
    
    // Check if it's in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (isBefore(date, today)) return false;
    
    // Check if it's within available days
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
    return availability.days.includes(dayOfWeek);
  };

  // Check if a specific time slot is available
  const isTimeSlotAvailable = (date, time) => {
    // In a real app, you would check against existing appointments and business rules
    return true;
  };

  // Get the currently viewed user (either current user or selected friend)
  const viewedUser = useMemo(() => {
    if (viewingFriendId && friends.length > 0) {
      return friends.find(f => f._id === viewingFriendId) || currentUser;
    }
    return currentUser;
  }, [viewingFriendId, friends, currentUser]);

  // Check if viewing own calendar
  const isViewingOwnCalendar = !viewingFriendId || viewingFriendId === currentUser?._id;

  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl overflow-hidden">
      {/* Calendar Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-100">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            {!isViewingOwnCalendar && (
              <span className="px-2 py-1 text-xs font-medium bg-purple-900 text-purple-200 rounded-md">
                Viewing: {viewedUser?.name || viewedUser?.email}
              </span>
            )}
          </div>
          <p className="text-sm text-gray-400">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          {/* Friend Calendar Selector */}
          <div className="relative friend-dropdown-container">
            <button
              onClick={() => setShowFriendDropdown(!showFriendDropdown)}
              className="px-3 py-1.5 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              View Calendar
            </button>
            
            {showFriendDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-gray-800 border border-gray-600 rounded-md shadow-lg z-50 max-h-96 overflow-y-auto">
                <div className="py-1">
                  <button
                    onClick={() => {
                      onViewingFriendChange && onViewingFriendChange(null);
                      setShowFriendDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${
                      isViewingOwnCalendar ? 'bg-gray-700 text-blue-400' : 'text-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                      <div>
                        <div className="font-medium">My Calendar</div>
                        <div className="text-xs text-gray-400">{currentUser?.email}</div>
                      </div>
                    </div>
                  </button>
                  
                  {friends.length > 0 && (
                    <>
                      <div className="border-t border-gray-700 my-1"></div>
                      <div className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                        Friends' Calendars
                      </div>
                      {friends.map((friend) => (
                        <button
                          key={friend._id}
                          onClick={() => {
                            onViewingFriendChange && onViewingFriendChange(friend._id);
                            setShowFriendDropdown(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-700 ${
                            viewingFriendId === friend._id ? 'bg-gray-700 text-purple-400' : 'text-gray-200'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <div className="font-medium">{friend.name || 'Friend'}</div>
                              <div className="text-xs text-gray-400">{friend.email}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </>
                  )}
                  
                  {friends.length === 0 && (
                    <div className="px-4 py-3 text-sm text-gray-400 text-center">
                      No friends added yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <button
            onClick={resetToToday}
            className="px-3 py-1 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Today
          </button>
          
          <div className="flex rounded-md shadow-sm">
            <button
              onClick={prevMonth}
              className="px-2 py-1 text-gray-300 bg-gray-800 border border-r-0 border-gray-600 rounded-l-md hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="sr-only">Previous month</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            <button
              onClick={nextMonth}
              className="px-2 py-1 text-gray-300 bg-gray-800 border border-l-0 border-gray-600 rounded-r-md hover:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            >
              <span className="sr-only">Next month</span>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
          
          {isViewingOwnCalendar && (
            <button
              onClick={() => handleCreateAppointment(new Date())}
              className="px-4 py-1.5 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              New Appointment +
            </button>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="px-6 py-3 bg-gray-850 border-b border-gray-700">
        <div className="flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-gray-300">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-gray-300">Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-blue-900"></div>
            <span className="text-gray-300">Has Appointments</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-red-900"></div>
            <span className="text-gray-300">Holiday</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-gray-700 border border-gray-600"></div>
            <span className="text-gray-300">Unavailable</span>
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-700 border-b border-gray-700">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="bg-gray-800 py-2 text-center text-xs font-medium text-gray-400 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-px bg-gray-700">
        {daysInMonth.map((day, i) => {
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const isDateAvailableNow = isDateAvailable(day);
          const hasAppts = hasAppointments(day);
          const isDayToday = isToday(day);
          const dayHoliday = isHoliday(day, phHolidays) ? getHolidayName(day, phHolidays) : null;
          
          return (
            <div 
              key={i}
              className={`relative min-h-24 p-1 bg-gray-800 hover:bg-gray-700 cursor-pointer ${
                !isCurrentMonth ? 'bg-gray-900 text-gray-600' : ''
              } ${isSelected ? 'ring-2 ring-blue-400 z-10' : ''}`}
              onClick={() => handleDateClick(day)}
            >
              <div className="flex flex-col h-full">
                <div className="flex justify-between items-center mb-1">
                  <span 
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-sm ${
                      isDayToday 
                        ? 'bg-blue-500 text-white font-semibold' 
                        : 'text-gray-200'
                    }`}
                  >
                    {format(day, 'd')}
                  </span>
                  
                  {isDateAvailableNow && !hasAppts && !dayHoliday && (
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  )}
                </div>
                
                <div className="flex-1 overflow-hidden">
                  {dayHoliday && (
                    <div className="text-xs text-red-400 font-medium truncate mb-1">
                      {dayHoliday}
                    </div>
                  )}
                  
                  {hasAppts && (
                    <div className="space-y-1">
                      {getAppointmentsForDate(day)
                        .slice(0, 2)
                        .map((appt) => (
                          <div 
                            key={appt._id || appt.id}
                            className="px-1 py-0.5 text-xs truncate rounded bg-blue-900 text-blue-200 hover:bg-blue-800"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedAppointment(appt);
                              setSelectedDate(day);
                            }}
                          >
                            {appt.title}
                          </div>
                      ))}
                      
                      {getAppointmentsForDate(day).length > 2 && (
                        <div className="text-xs text-gray-400 text-center">
                          +{getAppointmentsForDate(day).length - 2} more
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
      {selectedDate && !showAppointmentModal && (
        <DayDetailsModal
          date={selectedDate}
          appointments={getAppointmentsForDate(selectedDate)}
          onClose={() => setSelectedDate(null)}
          onCreateAppointment={handleCreateAppointment}
          isHoliday={getHolidayName(selectedDate, phHolidays)}
          currentUser={currentUser}
        />
      )}

      {/* Appointment Modal */}
      {showAppointmentModal && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedAppointment(null);
            setSelectedTime(null);
            setSelectedDate(null);
          }}
          onSubmit={handleAppointmentSubmit}
          initialDate={selectedDate || new Date()}
          initialTime={selectedTime}
          friends={friends}
          currentUser={currentUser}
          availability={availability}
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
    })
  ),
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      email: PropTypes.string.isRequired,
    })
  ),
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string.isRequired,
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
  viewingFriendId: PropTypes.string,
  onViewingFriendChange: PropTypes.func,
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
