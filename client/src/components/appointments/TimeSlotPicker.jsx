import React from 'react';
import PropTypes from 'prop-types';
import { format, parse, isToday, isBefore, addMinutes } from 'date-fns';

const TimeSlotPicker = ({
  selectedDate,
  selectedTime,
  onTimeSelect,
  availableSlots = [],
  workingHours = { start: 9, end: 17 },
  slotDuration = 30,
}) => {
  const generateTimeSlots = () => {
    if (!selectedDate) return [];
    
    const slots = [];
    const startDate = new Date(selectedDate);
    startDate.setHours(workingHours.start, 0, 0, 0);
    
    const endDate = new Date(selectedDate);
    endDate.setHours(workingHours.end, 0, 0, 0);
    
    let currentTime = new Date(startDate);
    
    while (currentTime < endDate) {
      const slotTime = new Date(currentTime);
      const time24 = format(slotTime, 'HH:mm');
      const time12 = format(slotTime, 'h:mma').toLowerCase();
      
      const isAvailable = availableSlots.some(slot => {
        const slotHour = slotTime.getHours();
        const slotMinute = slotTime.getMinutes();
        return (
          slot.hour === slotHour && 
          slot.minute === slotMinute && 
          slot.available
        );
      });
      
      slots.push({
        time24,
        time12,
        dateTime: slotTime,
        isAvailable,
      });
      
      currentTime = addMinutes(currentTime, slotDuration);
    }
    
    return slots;
  };

  const slots = generateTimeSlots();
  const selectedTime24 = selectedTime ? format(selectedTime, 'HH:mm') : null;

  return (
    <div className="w-full">
      <h3 className="text-lg font-medium text-gray-700 mb-3">Available Time Slots</h3>
      <div className="grid grid-cols-4 gap-2">
        {slots.map((slot, index) => {
          const isSelected = selectedTime24 === slot.time24;
          const isDisabled = !slot.isAvailable;
          
          return (
            <button
              key={index}
              type="button"
              onClick={() => !isDisabled && onTimeSelect(slot.dateTime)}
              disabled={isDisabled}
              className={`
                py-2 px-1 text-sm rounded-md transition-colors duration-200
                ${isSelected 
                  ? 'bg-blue-500 text-white' 
                  : isDisabled 
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                    : 'bg-white border border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700'}
              `}
              title={isDisabled ? 'This slot is not available' : `Select ${slot.time12}`}
            >
              {slot.time12}
            </button>
          );
        })}
      </div>
    </div>
  );
};

TimeSlotPicker.propTypes = {
  selectedDate: PropTypes.instanceOf(Date),
  selectedTime: PropTypes.instanceOf(Date),
  onTimeSelect: PropTypes.func.isRequired,
  availableSlots: PropTypes.arrayOf(
    PropTypes.shape({
      hour: PropTypes.number.isRequired,
      minute: PropTypes.number.isRequired,
      available: PropTypes.bool.isRequired,
    })
  ),
  workingHours: PropTypes.shape({
    start: PropTypes.number,
    end: PropTypes.number,
  }),
  slotDuration: PropTypes.number,
};

export default TimeSlotPicker;
