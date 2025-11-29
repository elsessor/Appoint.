import { 
  format, 
  parseISO, 
  isToday, 
  isBefore, 
  addMinutes, 
  isAfter, 
  isEqual, 
  parse
} from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';

export const PH_TZ = 'Asia/Manila';

// Cache for parsed dates to improve performance
const dateCache = new Map();

/**
 * Safely parse a date with caching for better performance
 * @param {Date|string|number} date - The date to parse
 * @returns {Date|null} Parsed date or null if invalid
 */
const safeParseDate = (date) => {
  if (!date) return null;
  
  // Return cached date if available
  const cacheKey = date instanceof Date ? date.getTime() : String(date);
  if (dateCache.has(cacheKey)) {
    return dateCache.get(cacheKey);
  }

  try {
    let parsedDate;
    
    if (date instanceof Date) {
      parsedDate = new Date(date);
    } else if (typeof date === 'string') {
      // Try parsing ISO string first, then custom formats
      parsedDate = isNaN(Date.parse(date)) 
        ? parse(date, 'yyyy-MM-dd HH:mm:ss', new Date())
        : parseISO(date);
    } else if (typeof date === 'number') {
      parsedDate = new Date(date);
    } else {
      return null;
    }

    // Validate the parsed date
    if (isNaN(parsedDate.getTime())) {
      throw new Error('Invalid date');
    }

    // Cache the valid date
    dateCache.set(cacheKey, parsedDate);
    return parsedDate;
  } catch (e) {
    console.error('Error parsing date:', date, e);
    return null;
  }
};

/**
 * Convert any date to Philippine Time (GMT+8)
 * @param {Date|string|number} date - The date to convert
 * @returns {Date|null} Date in Philippine Time or null if invalid
 */
export const toPhTime = (date) => {
  const dateObj = safeParseDate(date);
  if (!dateObj) return null;
  
  try {
    // Since we're already in Philippine timezone, we just need to ensure proper date object
    const phTime = new Date(dateObj);
    
    // Cache the converted time
    dateCache.set(phTime.getTime(), phTime);
    
    return phTime;
  } catch (e) {
    console.error('Error converting to PH time:', date, e);
    return null;
  }
};

/**
 * Convert Philippine Time to UTC
 * @param {Date|string|number} date - The date to convert (in PH time)
 * @returns {Date|null} Date in UTC or null if invalid
 */
export const toUTC = (date) => {
  const dateObj = safeParseDate(date);
  if (!dateObj) return null;
  
  try {
    // If the date is already in UTC, return it directly
    if (dateObj.tz === 'UTC') {
      return new Date(dateObj);
    }
    
    // Convert to UTC
    const utcDate = zonedTimeToUtc(dateObj, PH_TZ);
    
    // Cache the converted time
    dateCache.set(utcDate.getTime(), utcDate);
    
    return utcDate;
  } catch (e) {
    console.error('Error converting to UTC:', date, e);
    return null;
  }
};

/**
 * Check if a date is within working hours
 * @param {Date} date - The date to check
 * @param {Object} options - Options
 * @param {number} [options.startHour=9] - Start hour (0-23)
 * @param {number} [options.endHour=17] - End hour (0-23)
 * @returns {boolean} True if within working hours
 */
export const isWithinWorkingHours = (date, { startHour = 9, endHour = 17 } = {}) => {
  const phTime = toPhTime(date);
  if (!phTime) return false;
  
  const hour = phTime.getHours();
  return hour >= startHour && hour < endHour;
};

/**
 * Format a date in Philippine Time
 * @param {Date|string|number} date - The date to format
 * @param {string} [formatStr='h:mm a'] - Format string (see date-fns format)
 * @returns {string} Formatted date string or empty string if invalid
 */
export const formatPhTime = (date, formatStr = 'h:mm a') => {
  try {
    if (!date) return '';
    const dateObj = date instanceof Date ? date : new Date(date);
    if (isNaN(dateObj.getTime())) return '';
    
    return format(dateObj, formatStr);
  } catch (e) {
    console.error('Error formatting PH time:', date, e);
    return '';
  }
};

/**
 * Format a date range in Philippine Time
 * @param {Date|string|number} start - Start date
 * @param {Date|string|number} end - End date
 * @param {Object} options - Formatting options
 * @param {boolean} [options.showDate=true] - Whether to show the date
 * @param {boolean} [options.showTime=true] - Whether to show the time
 * @param {string} [options.separator=' - '] - Separator between start and end
 * @returns {string} Formatted date range
 */
export const formatPhTimeRange = (start, end, {
  showDate = true,
  showTime = true,
  separator = ' - ',
} = {}) => {
  try {
    if (!start || !end) return '';
    
    const startPh = toPhTime(start);
    const endPh = toPhTime(end);
    
    if (!startPh || !endPh) return '';
    
    const isSameDay = startPh.getDate() === endPh.getDate() &&
                     startPh.getMonth() === endPh.getMonth() &&
                     startPh.getFullYear() === endPh.getFullYear();
    
    let startFormat = [];
    let endFormat = [];
    
    if (showDate) {
      startFormat.push('MMM d, yyyy');
      if (!isSameDay) endFormat.push('MMM d, yyyy');
    }
    
    if (showTime) {
      startFormat.push('h:mm a');
      endFormat.push('h:mm a');
    }
    
    const startStr = format(startPh, startFormat.join(' '));
    const endStr = format(endPh, endFormat.join(' '));
    
    return `${startStr}${separator}${endStr}`;
  } catch (e) {
    console.error('Error formatting time range:', e);
    return '';
  }
};

/**
 * Format a duration in a human-readable format
 * @param {number} minutes - Duration in minutes
 * @returns {string} Formatted duration (e.g., "2h 30m")
 */
export const formatDuration = (minutes) => {
  if (isNaN(minutes) || minutes < 0) return '0m';
  
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
};

/**
 * Calculate duration in minutes between two dates
 * @param {Date|string|number} start - Start date
 * @param {Date|string|number} end - End date
 * @returns {number} Duration in minutes (rounded)
 */
export const getDurationInMinutes = (start, end) => {
  try {
    const startDate = safeParseDate(start);
    const endDate = safeParseDate(end);
    
    if (!startDate || !endDate || isBefore(endDate, startDate)) {
      return 0;
    }
    
    const diffMs = endDate - startDate;
    return Math.round(diffMs / (1000 * 60));
  } catch (e) {
    console.error('Error calculating duration:', e);
    return 0;
  }
};

/**
 * Add minutes to a date
 * @param {Date|string|number} date - Base date
 * @param {number} minutes - Minutes to add (can be negative)
 * @returns {Date} New date with minutes added
 */
export const addMinutesToDate = (date, minutes) => {
  const dateObj = safeParseDate(date);
  if (!dateObj) return null;
  
  return addMinutes(dateObj, minutes);
};

/**
 * Check if a time slot is available
 * @param {Date|string|number} slotTime - The time slot to check
 * @param {Array} availableSlots - Array of available slots
 * @param {Array} existingAppointments - Array of existing appointments
 * @returns {boolean} True if the slot is available
 */
export const isSlotAvailable = (slotTime, availableSlots = [], existingAppointments = []) => {
  try {
    const slotDate = safeParseDate(slotTime);
    if (!slotDate) return false;
    
    // Check if the slot is in the available slots
    const slotTimestamp = slotDate.getTime();
    const isAvailable = availableSlots.some(slot => {
      if (!slot || !slot.startTime) return false;
      const slotStart = safeParseDate(slot.startTime)?.getTime();
      return slotStart === slotTimestamp && slot.available !== false;
    });
    
    if (!isAvailable) return false;
    
    // Check if the slot is already booked
    const isBooked = existingAppointments.some(appt => {
      if (!appt || !appt.startTime) return false;
      const apptTime = safeParseDate(appt.startTime)?.getTime();
      return apptTime === slotTimestamp;
    });
    
    return !isBooked;
  } catch (e) {
    console.error('Error checking slot availability:', e);
    return false;
  }
};

/**
 * Generate available time slots based on working hours and existing appointments
 * @param {Date|string} date - The date to generate slots for
 * @param {Object} options - Configuration options
 * @param {number} [options.start=9] - Start hour (0-23) in PH time
 * @param {number} [options.end=17] - End hour (0-23) in PH time
 * @param {number} [options.duration=30] - Duration of each slot in minutes
 * @param {Array} [options.availableSlots=[]] - Array of available slots from the database
 * @param {Array} [options.existingAppointments=[]] - Array of existing appointments
 * @param {boolean} [options.includeUnavailable=false] - Whether to include unavailable slots in the results
 * @param {number} [options.timezoneOffset=480] - Timezone offset in minutes (default: +08:00)
 * @returns {Array} Array of time slot objects
 */
export const generateTimeSlots = (date, { 
  start = 9, 
  end = 17, 
  duration = 30,
  availableSlots = [],
  existingAppointments = [],
  includeUnavailable = false,
  timezoneOffset = 480 // +08:00 in minutes
} = {}) => {
  // Input validation
  if (start < 0 || start > 23 || end < 0 || end > 23) {
    console.error('Invalid start/end hours. Must be between 0 and 23.');
    return [];
  }
  
  if (duration <= 0 || duration > 1440) {
    console.error('Invalid duration. Must be between 1 and 1440 minutes.');
    return [];
  }
  
  try {
    const dateObj = safeParseDate(date);
    if (!dateObj) {
      console.error('Invalid date provided');
      return [];
    }
    
    // Convert to PH time
    const phDate = toPhTime(dateObj);
    if (!phDate) {
      console.error('Failed to convert date to PH time');
      return [];
    }
    
    // Set start and end times in PH time
    const startDate = new Date(phDate);
    startDate.setHours(start, 0, 0, 0);
    
    const endDate = new Date(phDate);
    endDate.setHours(end, 0, 0, 0);
    
    // Use timestamps for calculations
    const startTime = startDate.getTime();
    const endTime = endDate.getTime();
    
    // Pre-process available slots for faster lookup
    const availableSlotsMap = new Map();
    const slotCache = new Map();
    
    availableSlots.forEach(slot => {
      if (!slot?.startTime) return;
      
      const slotDate = safeParseDate(slot.startTime);
      if (!slotDate) return;
      
      // Align to the nearest slot based on duration
      const slotTime = new Date(slotDate);
      const minutes = slotTime.getMinutes();
      const alignedMinutes = Math.floor(minutes / duration) * duration;
      slotTime.setMinutes(alignedMinutes, 0, 0);
      
      const slotKey = slotTime.getTime();
      availableSlotsMap.set(slotKey, slot.available !== false);
    });
    
    // Pre-process existing appointments
    const bookedTimes = new Set();
    existingAppointments.forEach(appt => {
      if (!appt?.startTime) return;
      
      const apptTime = safeParseDate(appt.startTime);
      if (!apptTime) return;
      
      // Align to the nearest slot based on duration
      const slotTime = new Date(apptTime);
      const minutes = slotTime.getMinutes();
      const alignedMinutes = Math.floor(minutes / duration) * duration;
      slotTime.setMinutes(alignedMinutes, 0, 0);
      
      bookedTimes.add(slotTime.getTime());
    });
    
    // Generate time slots
    const slots = [];
    let currentTime = startTime;
    const slotDurationMs = duration * 60 * 1000;
    
    while (currentTime < endTime) {
      const slotTime = new Date(currentTime);
      const phTime = toPhTime(slotTime);
      
      if (!phTime) {
        currentTime += slotDurationMs;
        continue;
      }
      
      // Check slot availability
      const isAvailable = availableSlotsMap.get(currentTime) === true;
      const isBooked = bookedTimes.has(currentTime);
      
      // Skip unavailable slots unless explicitly requested
      if (!includeUnavailable && (!isAvailable || isBooked)) {
        currentTime += slotDurationMs;
        continue;
      }
      
      // Format times
      const time24 = format(phTime, 'HH:mm');
      const time12 = format(phTime, 'h:mma').toLowerCase();
      
      // Cache formatted times
      const formattedTime = { time24, time12 };
      slotCache.set(currentTime, formattedTime);
      
      slots.push({
        ...formattedTime,
        dateTime: new Date(slotTime), // Local time
        phTime: new Date(phTime),     // PH time
        timestamp: currentTime,       // Unix timestamp (ms)
        isAvailable,
        isBooked,
        isSelectable: isAvailable && !isBooked
      });
      
      currentTime += slotDurationMs;
    }
    
    return slots;
  } catch (e) {
    console.error('Error generating time slots:', e);
    return [];
  }
};

/**
 * Get the next available time slot
 * @param {Date|string} date - The date to check
 * @param {Object} options - Same as generateTimeSlots options
 * @returns {Object|null} Next available time slot or null if none found
 */
export const getNextAvailableSlot = (date, options = {}) => {
  const slots = generateTimeSlots(date, { ...options, includeUnavailable: false });
  return slots.length > 0 ? slots[0] : null;
};

/**
 * Check if a specific time slot is available
 * @param {Date|string|number} dateTime - The date and time to check
 * @param {Object} options - Configuration options
 * @param {Array} [options.availableSlots=[]] - Array of available slots
 * @param {Array} [options.existingAppointments=[]] - Array of existing appointments
 * @param {number} [options.duration=30] - Duration of the slot in minutes
 * @param {number} [options.timezoneOffset=480] - Timezone offset in minutes (default: +08:00)
 * @returns {boolean} True if the time slot is available
 */
export const isTimeSlotAvailable = (dateTime, options = {}) => {
  const {
    availableSlots = [],
    existingAppointments = [],
    duration = 30,
    timezoneOffset = 480
  } = options;

  // Parse and validate the input date
  const slotTime = safeParseDate(dateTime);
  if (!slotTime) return false;

  // Convert to PH time for consistent comparison
  const phTime = toPhTime(slotTime);
  if (!phTime) return false;

  // Check if the time aligns with slot duration
  const minutes = phTime.getMinutes();
  const seconds = phTime.getSeconds();
  const milliseconds = phTime.getMilliseconds();
  
  // If time doesn't align with slot duration, it's not a valid slot
  if (minutes % (duration % 60) !== 0 || seconds !== 0 || milliseconds !== 0) {
    return false;
  }

  // Create a timestamp for the slot start time
  const slotTimestamp = phTime.getTime();
  const slotEndTime = new Date(slotTimestamp + duration * 60 * 1000);

  // Check against existing appointments
  const isBooked = existingAppointments.some(appt => {
    if (!appt?.startTime) return false;
    
    const apptTime = safeParseDate(appt.startTime);
    if (!apptTime) return false;
    
    const apptPhTime = toPhTime(apptTime);
    if (!apptPhTime) return false;
    
    const apptStart = apptPhTime.getTime();
    const apptEnd = apptStart + (appt.duration || duration) * 60 * 1000;
    
    // Check for overlap
    return slotTimestamp < apptEnd && slotEndTime.getTime() > apptStart;
  });

  if (isBooked) return false;

  // Check against available slots if provided
  if (availableSlots.length > 0) {
    const isAvailable = availableSlots.some(slot => {
      if (!slot?.startTime) return false;
      
      const slotStart = safeParseDate(slot.startTime);
      if (!slotStart) return false;
      
      const slotPhTime = toPhTime(slotStart);
      if (!slotPhTime) return false;
      
      const slotStartTime = slotPhTime.getTime();
      const slotEndTime = slotStartTime + (slot.duration || duration) * 60 * 1000;
      
      // Check if the requested slot is within an available slot
      return slotTimestamp >= slotStartTime && 
             slotTimestamp < slotEndTime &&
             (slot.available !== false);
    });
    
    if (!isAvailable) return false;
  }

  // If we have working hours, check if the slot is within them
  if (options.start !== undefined && options.end !== undefined) {
    const startHour = typeof options.start === 'number' ? options.start : 9;
    const endHour = typeof options.end === 'number' ? options.end : 17;
    
    const slotHour = phTime.getHours();
    const slotMinute = phTime.getMinutes();
    
    // Check if slot starts before working hours end
    if (slotHour > endHour || (slotHour === endHour && slotMinute > 0)) {
      return false;
    }
    
    // Check if slot ends after working hours start
    const slotEndHour = slotEndTime.getHours();
    const slotEndMinute = slotEndTime.getMinutes();
    
    if (slotEndHour < startHour || (slotEndHour === startHour && slotEndMinute === 0)) {
      return false;
    }
  }

  return true;
};
