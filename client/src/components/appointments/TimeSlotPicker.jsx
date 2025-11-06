import React, { useState, useCallback, useEffect } from 'react';
import { Clock, Plus, X, Copy, Trash2 } from 'lucide-react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import {
  generateTimeSlots,
  formatPhTime,
  formatPhTimeRange,
  isTimeSlotAvailable,
  toPhTime,
  PH_TZ
} from '../../utils/dateUtils';

const TimeSlotPicker = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  availableSlots = [],
  workingHours: defaultWorkingHours = { start: 9, end: 17 },
  slotDuration: defaultSlotDuration = 30,
  isOwner = false,
  onSaveCustomAvailability,
  userId,
  calendarOwnerId,
}) => {
  const [duration, setDuration] = useState(defaultSlotDuration);
  const [repeatMode, setRepeatMode] = useState('weekly');
  const [timezone, setTimezone] = useState('GMT+08:00');
  const [showEndTimeDropdown, setShowEndTimeDropdown] = useState(null);
  const [weekSchedule, setWeekSchedule] = useState({
    0: { available: false, slots: [] }, // Sunday
    1: { available: true, slots: [{ start: '09:00', end: '17:00' }] }, // Monday
    2: { available: true, slots: [{ start: '09:00', end: '17:00' }] }, // Tuesday
    3: { available: true, slots: [{ start: '09:00', end: '17:00' }] }, // Wednesday
    4: { available: true, slots: [{ start: '09:00', end: '17:00' }] }, // Thursday
    5: { available: true, slots: [{ start: '09:00', end: '17:00' }] }, // Friday
    6: { available: false, slots: [] }, // Saturday
  });

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const durations = [15, 30, 45, 60, 90, 120];

  // Time utilities
  const toMinutes = useCallback((time) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  }, []);

  const toHHMM = useCallback((minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }, []);

  // Click outside handler for dropdowns
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showEndTimeDropdown && !event.target.closest('.time-dropdown-container')) {
        setShowEndTimeDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showEndTimeDropdown]);

  const formatTimeForDisplay = (time24) => {
    try {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'pm' : 'am';
      const hour12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
      return `${hour12}:${String(minutes).padStart(2, '0')}${period}`;
    } catch (e) {
      console.error('Error formatting time:', e);
      return time24;
    }
  };

  const generateTimeOptions = useCallback(() => {
    const times = [];
    for (let h = defaultWorkingHours.start; h <= defaultWorkingHours.end; h++) {
      for (let m = 0; m < 60; m += 30) {
        const time24 = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        times.push({ 
          value: time24,
          display: formatTimeForDisplay(time24).toLowerCase(),
          dateTime: new Date(new Date().setHours(h, m, 0, 0))
        });
      }
    }
    return times;
  }, [defaultWorkingHours]);

  const [timeOptions, setTimeOptions] = useState(() => {
    const options = generateTimeOptions();
    console.log('Initial time options:', options);
    return options;
  });

  useEffect(() => {
    const options = generateTimeOptions();
    console.log('Updated time options:', options);
    setTimeOptions(options);
  }, [generateTimeOptions]);

  // Initialize available slots
  useEffect(() => {
    if (availableSlots.length > 0) {
      const daySchedule = { ...weekSchedule };
      const selectedDay = new Date(selectedDate).getDay();

      // Group slots by availability
      const groupedSlots = availableSlots.reduce((acc, slot) => {
        const time = toHHMM(slot.hour * 60 + slot.minute);
        if (!acc[slot.available]) {
          acc[slot.available] = [];
        }
        acc[slot.available].push(time);
        return acc;
      }, {});

      // Convert to time ranges
      const slots = [];
      Object.entries(groupedSlots).forEach(([available, times]) => {
        let start = times[0];
        let end = times[0];
        
        for (let i = 1; i < times.length; i++) {
          if (toMinutes(times[i]) === toMinutes(end) + duration) {
            end = times[i];
          } else {
            slots.push({ start, end, available: available === 'true' });
            start = times[i];
            end = times[i];
          }
        }
        slots.push({ start, end, available: available === 'true' });
      });

      daySchedule[selectedDay] = {
        available: slots.some(s => s.available),
        slots: slots.length > 0 ? slots : [{
          start: toHHMM(defaultWorkingHours.start * 60),
          end: toHHMM(defaultWorkingHours.end * 60)
        }]
      };

      setWeekSchedule(daySchedule);
    }
  }, [availableSlots, selectedDate, duration]);

  const toggleDayAvailability = (dayIndex) => {
    if (!isOwner) return;
    
    setWeekSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        available: !prev[dayIndex].available,
        slots: !prev[dayIndex].available && prev[dayIndex].slots.length === 0
          ? [{ 
              start: toHHMM(defaultWorkingHours.start * 60),
              end: toHHMM(defaultWorkingHours.end * 60)
            }]
          : prev[dayIndex].slots
      }
    }));
  };

  const updateSlotTime = (dayIndex, slotIndex, field, value) => {
    if (!isOwner) return;

    setWeekSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        slots: prev[dayIndex].slots.map((slot, idx) =>
          idx === slotIndex ? { ...slot, [field]: value } : slot
        )
      }
    }));
    if (field === 'end') {
      setShowEndTimeDropdown(null);
    }
  };

  const addTimeSlot = (dayIndex) => {
    if (!isOwner) return;

    const lastSlot = weekSchedule[dayIndex].slots[weekSchedule[dayIndex].slots.length - 1];
    const newStart = lastSlot ? lastSlot.end : toHHMM(defaultWorkingHours.start * 60);
    
    setWeekSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        slots: [...prev[dayIndex].slots, {
          start: newStart,
          end: toHHMM(defaultWorkingHours.end * 60),
          available: true
        }]
      }
    }));
  };

  const removeTimeSlot = (dayIndex, slotIndex) => {
    if (!isOwner) return;

    setWeekSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        slots: prev[dayIndex].slots.filter((_, idx) => idx !== slotIndex)
      }
    }));
  };

  const duplicateTimeSlot = (dayIndex, slotIndex) => {
    if (!isOwner) return;

    const slotToDuplicate = weekSchedule[dayIndex].slots[slotIndex];
    setWeekSchedule(prev => ({
      ...prev,
      [dayIndex]: {
        ...prev[dayIndex],
        slots: [...prev[dayIndex].slots, { ...slotToDuplicate }]
      }
    }));
  };

  const handleSave = async () => {
    if (!onSaveCustomAvailability || !isOwner) return;

    try {
      const selectedDay = new Date(selectedDate).getDay();
      const daySchedule = weekSchedule[selectedDay];
      const phDate = toPhTime(selectedDate);
      
      // Generate all possible slots for the day
      const allSlots = generateTimeSlots(phDate, {
        start: defaultWorkingHours.start,
        end: defaultWorkingHours.end,
        duration: duration,
        includeUnavailable: true
      });
      
      // Convert time slots to individual minute slots
      const slots = allSlots
        .filter(slot => {
          // Check if this slot falls within any of our defined available slots
          const slotTime = slot.phTime.getHours() * 60 + slot.phTime.getMinutes();
          return daySchedule.slots.some(availableSlot => {
            const startMinutes = toMinutes(availableSlot.start);
            const endMinutes = toMinutes(availableSlot.end);
            return slotTime >= startMinutes && slotTime < endMinutes;
          });
        })
        .map(slot => ({
          hour: slot.phTime.getHours(),
          minute: slot.phTime.getMinutes(),
          available: daySchedule.available
        }));

      await onSaveCustomAvailability({
        date: format(selectedDate, 'yyyy-MM-dd'),
        slots,
        userId,
        calendarOwnerId
      });

      // Show success message
      const messageElement = document.createElement('div');
      messageElement.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg';
      messageElement.textContent = 'Schedule saved successfully!';
      document.body.appendChild(messageElement);
      setTimeout(() => messageElement.remove(), 3000);

    } catch (error) {
      console.error('Failed to save schedule:', error);
      // Show error message
      const messageElement = document.createElement('div');
      messageElement.className = 'fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg';
      messageElement.textContent = 'Failed to save schedule. Please try again.';
      document.body.appendChild(messageElement);
      setTimeout(() => messageElement.remove(), 3000);
    }
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl mx-auto">
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-semibold text-gray-200">
              BOOKABLE APPOINTMENT SCHEDULE
            </h1>
          </div>
        </div>

        <div className="space-y-6">
            {/* Duration Picker */}
            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-gray-200 font-medium mb-1">Appointment duration</h3>
                <p className="text-sm text-gray-400 mb-3">How long should each appointment last?</p>
                <div className="relative">
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-48 bg-gray-700/50 text-gray-200 px-4 py-2 rounded-lg border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none cursor-pointer appearance-none hover:bg-gray-700 transition-colors"
                  >
                    {durations.map(d => (
                      <option key={d} value={d}>
                        {d < 60 ? `${d} minutes` : `${d / 60} hour${d > 60 ? 's' : ''}`}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Schedule Editor */}
            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-gray-400 mt-1" />
              <div className="flex-1">
                <h3 className="text-gray-200 font-medium mb-1">Daily availability</h3>
                <p className="text-sm text-gray-400 mb-3">Set your available hours for appointments</p>

                <div className="space-y-3 rounded-lg border border-gray-700 p-4 bg-gray-800/50">
                  {days.map((day, dayIndex) => {
                    const daySchedule = weekSchedule[dayIndex];
                    const isCurrentDay = dayIndex === new Date(selectedDate).getDay();

                    return (
                      <div key={dayIndex} 
                           className={`flex items-center gap-2 py-3 hover:bg-gray-800/50 rounded-lg px-4 transition-colors
                                    ${isCurrentDay ? 'bg-gray-800/50 ring-1 ring-blue-500' : ''}`}>
                        <div className="w-10 text-gray-300 text-sm font-medium">{day}</div>
                        
                        {!daySchedule.available ? (
                          <div className="flex-1 flex items-center justify-between">
                            <span className="text-gray-500 text-sm">Unavailable</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => toggleDayAvailability(dayIndex)}
                                className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                                title="Set available hours"
                              >
                                <Plus className="w-5 h-5 text-gray-400" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 space-y-2">
                            {daySchedule.slots.map((slot, slotIndex) => (
                              <div key={slotIndex} className="flex items-center gap-2">
                                <div className="relative time-dropdown-container">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowEndTimeDropdown(
                                        showEndTimeDropdown === `start-${dayIndex}-${slotIndex}` 
                                          ? null 
                                          : `start-${dayIndex}-${slotIndex}`
                                      );
                                    }}
                                    className="bg-gray-700/50 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm w-32 text-left flex items-center justify-between hover:bg-gray-700 transition-colors"
                                  >
                                    {formatTimeForDisplay(slot.start)}
                                    <svg className="w-3 h-3 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                  {showEndTimeDropdown === `start-${dayIndex}-${slotIndex}` && (
                                    <div className="absolute z-50 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto w-32">
                                      {timeOptions.map((time) => (
                                        <button
                                          key={time.value}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            updateSlotTime(dayIndex, slotIndex, 'start', time.value);
                                            setShowEndTimeDropdown(null);
                                          }}
                                          type="button"
                                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
                                        >
                                          {time.display}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                
                                <span className="text-gray-500">-</span>
                                
                                <div className="relative time-dropdown-container">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      setShowEndTimeDropdown(
                                        showEndTimeDropdown === `end-${dayIndex}-${slotIndex}` 
                                          ? null 
                                          : `end-${dayIndex}-${slotIndex}`
                                      );
                                    }}
                                    className="bg-gray-700/50 text-gray-200 px-3 py-1.5 rounded-lg border border-gray-600 hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-sm w-32 text-left flex items-center justify-between hover:bg-gray-700 transition-colors"
                                  >
                                    {formatTimeForDisplay(slot.end)}
                                    <svg className="w-3 h-3 text-gray-400 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </button>
                                  
                                  {showEndTimeDropdown === `end-${dayIndex}-${slotIndex}` && (
                                    <div className="absolute z-50 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg max-h-48 overflow-y-auto w-32">
                                      {timeOptions.map((time) => (
                                        <button
                                          key={time.value}
                                          onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            updateSlotTime(dayIndex, slotIndex, 'end', time.value);
                                            setShowEndTimeDropdown(null);
                                          }}
                                          type="button"
                                          className="w-full text-left px-3 py-2 text-sm text-gray-200 hover:bg-gray-600 transition-colors"
                                          disabled={toMinutes(time.value) <= toMinutes(slot.start)}
                                        >
                                          {time.display}
                                        </button>
                                      ))}
                                    </div>
                                  )}
                                </div>

                                <div className="flex items-center gap-1">
                                  {daySchedule.slots.length > 1 && (
                                    <button
                                      onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                                      className="p-1.5 hover:bg-red-500/20 rounded-full transition-colors"
                                      title="Remove time slot"
                                    >
                                      <X className="w-4 h-4 text-red-400" />
                                    </button>
                                  )}
                                  
                                  <button
                                    onClick={() => duplicateTimeSlot(dayIndex, slotIndex)}
                                    className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                                    title="Duplicate time slot"
                                  >
                                    <Copy className="w-4 h-4 text-gray-400" />
                                  </button>
                                  
                                  <button
                                    onClick={() => addTimeSlot(dayIndex)}
                                    className="p-1.5 hover:bg-gray-700 rounded-full transition-colors"
                                    title="Add another time slot"
                                  >
                                    <Plus className="w-4 h-4 text-gray-400" />
                                  </button>
                                </div>
                              </div>
                            ))}

                            {/* Unavailable button - moved outside time slot loop */}
                            <button
                              onClick={() => toggleDayAvailability(dayIndex)}
                              className={`mt-2 px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                daySchedule.available
                                  ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-700'
                                  : 'bg-red-500/20 text-red-300 hover:bg-red-500/30'
                              }`}
                            >
                              Unavailable
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-700">
        <div className="text-sm text-gray-400">
          Step 1 of 2: Select Time Slot
        </div>
        <button
          onClick={onTimeSelect}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors inline-flex items-center gap-2"
        >
          Next: Booking Details
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

TimeSlotPicker.propTypes = {
  selectedDate: PropTypes.instanceOf(Date).isRequired,
  selectedTime: PropTypes.string,
  onTimeSelect: PropTypes.func.isRequired,
  availableSlots: PropTypes.arrayOf(
    PropTypes.shape({
      hour: PropTypes.number.isRequired,
      minute: PropTypes.number.isRequired,
      available: PropTypes.bool.isRequired
    })
  ),
  workingHours: PropTypes.shape({
    start: PropTypes.number,
    end: PropTypes.number
  }),
  slotDuration: PropTypes.number,
  isOwner: PropTypes.bool,
  onSaveCustomAvailability: PropTypes.func,
  userId: PropTypes.string,
  calendarOwnerId: PropTypes.string
};

export default TimeSlotPicker;