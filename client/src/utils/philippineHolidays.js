/**
 * List of fixed and special non-working holidays in the Philippines
 * Fixed dates are based on Proclamation No. 368, s. 2023
 * Special non-working days are also included
 */

export const getPhilippineHolidays = (year = new Date().getFullYear()) => {
  // Fixed date holidays
  const fixedHolidays = [
    { name: "New Year's Day", month: 0, day: 1 }, // January 1
    { name: "Araw ng Kagitingan", month: 3, day: 9 }, // April 9
    { name: "Labor Day", month: 4, day: 1 }, // May 1
    { name: "Independence Day", month: 5, day: 12 }, // June 12
    { name: "National Heroes' Day", month: 7, day: 26 }, // Last Monday of August
    { name: "Bonifacio Day", month: 10, day: 30 }, // November 30
    { name: "Christmas Day", month: 11, day: 25 }, // December 25
    { name: "Rizal Day", month: 11, day: 30 }, // December 30
  ];

  // Calculate movable holidays (Easter-based)
  const easter = calculateEaster(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);

  // Add movable holidays
  const movableHolidays = [
    { name: "Maundy Thursday", date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 3) },
    { name: "Good Friday", date: goodFriday },
    { name: "Easter Sunday", date: easter },
  ];

  // Special non-working days
  const specialNonWorkingDays = [
    { name: "Chinese New Year", month: 1, day: 1, lunar: true }, // January/February based on lunar calendar
    { name: "EDSA Revolution Anniversary", month: 1, day: 25 }, // February 25
    { name: "Black Saturday", date: new Date(easter.getFullYear(), easter.getMonth(), easter.getDate() - 1) },
    { name: "Ninoy Aquino Day", month: 7, day: 21 }, // August 21
    { name: "All Saints' Day", month: 10, day: 1 }, // November 1
    { name: "Feast of the Immaculate Conception", month: 11, day: 8 }, // December 8
    { name: "Christmas Eve", month: 11, day: 24 }, // December 24
    { name: "New Year's Eve", month: 11, day: 31 }, // December 31
  ];

  // Process fixed holidays
  const holidays = fixedHolidays.map(holiday => ({
    name: holiday.name,
    date: new Date(year, holiday.month, holiday.day),
    isRegular: true,
  }));

  // Add movable holidays
  movableHolidays.forEach(holiday => {
    holidays.push({
      name: holiday.name,
      date: new Date(holiday.date),
      isRegular: true,
    });
  });

  // Add special non-working days
  specialNonWorkingDays.forEach(holiday => {
    if (holiday.lunar) {
      // For lunar new year, we'll use a fixed date for simplicity
      // In a real app, you might want to calculate the actual lunar date
      holidays.push({
        name: holiday.name,
        date: new Date(year, 0, 22), // Approximate date for Chinese New Year
        isSpecial: true,
      });
    } else if (holiday.date) {
      holidays.push({
        name: holiday.name,
        date: new Date(holiday.date),
        isSpecial: true,
      });
    } else {
      holidays.push({
        name: holiday.name,
        date: new Date(year, holiday.month, holiday.day),
        isSpecial: true,
      });
    }
  });

  // Sort holidays by date
  return holidays.sort((a, b) => a.date - b.date);
};

// Helper function to calculate Easter Sunday (Meeus/Jones/Butcher algorithm)
function calculateEaster(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  
  return new Date(year, month, day);
}

// Helper function to check if a date is a holiday
export const isHoliday = (date, holidays) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  return holidays.some(holiday => {
    const holidayDate = new Date(holiday.date);
    return (
      holidayDate.getDate() === date.getDate() &&
      holidayDate.getMonth() === date.getMonth()
    );
  });
};

// Helper function to get holiday name for a specific date
export const getHolidayName = (date, holidays) => {
  if (!(date instanceof Date)) {
    date = new Date(date);
  }
  
  const holiday = holidays.find(h => {
    const holidayDate = new Date(h.date);
    return (
      holidayDate.getDate() === date.getDate() &&
      holidayDate.getMonth() === date.getMonth()
    );
  });
  
  return holiday ? holiday.name : null;
};
