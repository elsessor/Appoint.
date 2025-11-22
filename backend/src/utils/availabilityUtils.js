/**
 * Availability utility functions for appointment scheduling
 */

/**
 * Check if a time slot is within a break time
 * @param {string} slotStart - Time in HH:MM format
 * @param {string} slotEnd - Time in HH:MM format
 * @param {array} breakTimes - Array of {start, end} times
 * @returns {boolean} - True if slot overlaps with break time
 */
export function isWithinBreakTime(slotStart, slotEnd, breakTimes = []) {
  if (!breakTimes || breakTimes.length === 0) return false;

  const convertToMinutes = (time) => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const slotStartMin = convertToMinutes(slotStart);
  const slotEndMin = convertToMinutes(slotEnd);

  return breakTimes.some((breakTime) => {
    const breakStartMin = convertToMinutes(breakTime.start);
    const breakEndMin = convertToMinutes(breakTime.end);

    // Check if slot overlaps with break time
    return !(slotEndMin <= breakStartMin || slotStartMin >= breakEndMin);
  });
}

/**
 * Check if booking respects minimum lead time
 * @param {Date} appointmentStart - Appointment start time
 * @param {number} minLeadHours - Minimum hours required before booking
 * @returns {boolean} - True if appointment is far enough in the future
 */
export function checkLeadTime(appointmentStart, minLeadHours = 0) {
  if (minLeadHours === 0) return true;

  const now = new Date();
  const minLeadMs = minLeadHours * 60 * 60 * 1000;
  const appointmentTime = new Date(appointmentStart).getTime();

  return appointmentTime - now.getTime() >= minLeadMs;
}

/**
 * Check if appointment can be cancelled (respects cancel notice)
 * @param {Date} appointmentStart - Appointment start time
 * @param {number} cancelNoticeHours - Hours notice required to cancel
 * @returns {boolean} - True if cancellation is allowed
 */
export function canCancelAppointment(appointmentStart, cancelNoticeHours = 0) {
  if (cancelNoticeHours === 0) return true;

  const now = new Date();
  const cancelNoticeMs = cancelNoticeHours * 60 * 60 * 1000;
  const appointmentTime = new Date(appointmentStart).getTime();

  return appointmentTime - now.getTime() >= cancelNoticeMs;
}

/**
 * Validate appointment duration against rules
 * @param {number} durationMinutes - Duration in minutes
 * @param {object} durationRules - {min, max} in minutes
 * @returns {object} - {isValid: boolean, error: string}
 */
export function validateAppointmentDuration(durationMinutes, durationRules = {}) {
  const minDuration = durationRules.min || 15;
  const maxDuration = durationRules.max || 120;

  if (durationMinutes < minDuration) {
    return {
      isValid: false,
      error: `Appointment duration must be at least ${minDuration} minutes`,
    };
  }

  if (durationMinutes > maxDuration) {
    return {
      isValid: false,
      error: `Appointment duration cannot exceed ${maxDuration} minutes`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Calculate available time slots for a day
 * @param {Date} date - The date to check
 * @param {object} availability - Availability settings
 * @param {array} existingAppointments - Appointments on that day
 * @returns {array} - Array of available slots {start, end}
 */
export function getAvailableSlots(date, availability = {}, existingAppointments = []) {
  const dayOfWeek = date.getDay();

  // Check if day is available
  if (!availability.days || !availability.days.includes(dayOfWeek)) {
    return [];
  }

  const slots = [];
  const dayStart = new Date(date);
  const dayEnd = new Date(date);

  const [startHour, startMin] = (availability.start || '09:00').split(':');
  const [endHour, endMin] = (availability.end || '17:00').split(':');

  dayStart.setHours(parseInt(startHour), parseInt(startMin), 0, 0);
  dayEnd.setHours(parseInt(endHour), parseInt(endMin), 0, 0);

  const slotDuration = availability.slotDuration || 30;
  const buffer = availability.buffer || 15;
  const breakTimes = availability.breakTimes || [];

  let currentTime = new Date(dayStart);

  while (currentTime < dayEnd) {
    const slotEnd = new Date(currentTime.getTime() + slotDuration * 60 * 1000);

    if (slotEnd > dayEnd) break;

    // Format times for break time check
    const slotStartStr = `${currentTime.getHours().toString().padStart(2, '0')}:${currentTime
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;
    const slotEndStr = `${slotEnd.getHours().toString().padStart(2, '0')}:${slotEnd
      .getMinutes()
      .toString()
      .padStart(2, '0')}`;

    // Check if within break time
    if (!isWithinBreakTime(slotStartStr, slotEndStr, breakTimes)) {
      // Check if overlaps with existing appointments
      const hasConflict = existingAppointments.some((appt) => {
        const apptStart = new Date(appt.startTime);
        const apptEnd = new Date(appt.endTime);

        return !(slotEnd <= apptStart || currentTime >= apptEnd);
      });

      if (!hasConflict) {
        slots.push({
          start: new Date(currentTime),
          end: new Date(slotEnd),
        });
      }
    }

    // Move to next slot with buffer
    currentTime = new Date(slotEnd.getTime() + buffer * 60 * 1000);
  }

  return slots;
}

/**
 * Get lead time message for user
 * @param {number} minLeadHours - Minimum lead hours
 * @returns {string} - User-friendly message
 */
export function getLeadTimeMessage(minLeadHours) {
  if (minLeadHours === 0) return 'Bookings available anytime';

  if (minLeadHours < 24) {
    return `Bookings require ${minLeadHours} hour${minLeadHours > 1 ? 's' : ''} notice`;
  }

  const days = Math.floor(minLeadHours / 24);
  const hours = minLeadHours % 24;

  let message = `Bookings require ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) {
    message += ` and ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  message += ' notice';

  return message;
}

/**
 * Get cancel notice message for user
 * @param {number} cancelNoticeHours - Cancel notice hours
 * @returns {string} - User-friendly message
 */
export function getCancelNoticeMessage(cancelNoticeHours) {
  if (cancelNoticeHours === 0) return 'Cancel anytime';

  if (cancelNoticeHours < 24) {
    return `Cancel with ${cancelNoticeHours} hour${cancelNoticeHours > 1 ? 's' : ''} notice`;
  }

  const days = Math.floor(cancelNoticeHours / 24);
  const hours = cancelNoticeHours % 24;

  let message = `Cancel with ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) {
    message += ` and ${hours} hour${hours > 1 ? 's' : ''}`;
  }
  message += ' notice';

  return message;
}
