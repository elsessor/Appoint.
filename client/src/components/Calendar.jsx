import { useMemo, useState } from "react";
import DayDetailsModal from "./DayDetailsModal";
import { formatYMD } from "../lib/date";

// Philippine Holidays 2024 (month-day)
const PH_HOLIDAYS = {
    // Regular Holidays
    '01-01': "New Year's Day",
    '03-28': 'Maundy Thursday',
    '03-29': 'Good Friday',
    '04-09': 'Araw ng Kagitingan',
    '05-01': 'Labor Day',
    '06-12': 'Independence Day',
    '08-26': 'National Heroes Day',
    '11-30': 'Bonifacio Day',
    '12-25': 'Christmas Day',
    '12-30': 'Rizal Day',
    
    // Special Non-Working Holidays
    '02-10': 'Chinese New Year',
    '03-30': 'Black Saturday',
    '08-21': 'Ninoy Aquino Day',
    '11-01': "All Saints' Day",
    '12-08': 'Feast of the Immaculate Conception',
    '12-31': 'Last Day of the Year',
    
    // Special movable holidays
    '2024-05-13': 'National Elections Day'
};

const isPhilippineHoliday = (date) => {
    if (!date) return null;
    const ymd = formatYMD(date); // YYYY-MM-DD
    const mmdd = ymd.slice(5);
    // Check both MM-DD and YYYY-MM-DD formats
    return PH_HOLIDAYS[mmdd] || PH_HOLIDAYS[ymd] || null;
}

const PH_HOLIDAYS_MD = Object.keys(PH_HOLIDAYS).filter(k => k.length === 5); // Only MM-DD keys

const MonthPicker = ({ currentDate, onSelect, onClose }) => {
    const [year, setYear] = useState(currentDate.getFullYear());

    const months = [
        'January','February','March','April','May','June','July','August','September','October','November','December'
    ];

    const handleMonthClick = (mIndex) => {
        onSelect(new Date(year, mIndex, 1));
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
            <div className="relative bg-base-100 rounded-lg shadow-lg w-full max-w-md p-4 mx-4">
                <div className="flex items-center justify-between mb-3">
                    <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y - 1)}>‹</button>
                    <div className="font-medium">Select month — {year}</div>
                    <button className="btn btn-ghost btn-sm" onClick={() => setYear(y => y + 1)}>›</button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {months.map((m, i) => (
                        <button key={m} onClick={() => handleMonthClick(i)} className="btn btn-outline btn-sm text-sm">
                            {m.slice(0,3)}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};


const Calendar = ({ onOpenCreate, appointments = [], friends = [], selectedFriendId, onSelectFriend, currentUser, availability }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    
    const selectedFriend = friends.find(f => String(f._id) === String(selectedFriendId));

    // fallback availability
    const avail = availability || { days: [1,2,3,4,5], start: '09:00', end: '16:30', slotMinutes: 30, maxPerDay: 5, bufferMinutes: 15 };

    // Filter appointments based on selected friend
    const filteredAppointments = useMemo(() => {
        if (!selectedFriendId) {
            // Show my appointments (where I'm the creator or participant)
            return appointments.filter(apt => 
                apt.userId === currentUser?._id || 
                apt.participant === currentUser?._id
            );
        }
        // Show appointments with the selected friend
        return appointments.filter(apt => 
            (apt.participant === selectedFriendId) || 
            (apt.userId === selectedFriendId)
        );
    }, [appointments, selectedFriendId, currentUser]);

    // Get first day of month and total days
    const firstDayOfMonth = useMemo(() => {
        const first = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        return first.getDay(); // 0-6 (Sunday-Saturday)
    }, [currentDate]);

    const totalDays = useMemo(() => {
        return new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    }, [currentDate]);

    // Generate calendar days with padding for first week
    const calendarDays = useMemo(() => {
        const days = [];
        // Add empty cells for days before the first of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            days.push(null);
        }
        // Add actual days
        for (let i = 1; i <= totalDays; i++) {
            days.push(i);
        }
        return days;
    }, [firstDayOfMonth, totalDays]);

    const handlePrevMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
        setSelectedDate(null);
    };

    const handleNextMonth = () => {
        setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
        setSelectedDate(null);
    };

    // Get appointments for a specific day
    const getAppointmentsForDay = (day) => {
        // Use centralized util to produce local YYYY-MM-DD
        const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        const dateStr = formatYMD(d);
        return filteredAppointments.filter(a => a.date === dateStr);
    };

    // generate available slots for the given day respecting availability, buffer and existing appointments
    const getAvailableSlotsForDay = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const dateObj = new Date(year, month, day);
        // if this weekday isn't available, return []
        if (!avail.days.includes(dateObj.getDay())) return [];

    const dateStr = formatYMD(dateObj);

        const [sH, sM] = avail.start.split(':').map(Number);
        const [eH, eM] = avail.end.split(':').map(Number);
        const startDate = new Date(year, month, day, sH, sM);
        const endDate = new Date(year, month, day, eH, eM);

        const slots = [];
        for (let t = new Date(startDate); t < endDate; t.setMinutes(t.getMinutes() + avail.slotMinutes)) {
            slots.push(new Date(t));
        }

        // helper to format time to HH:MM
        const fmt = (d) => `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;

        // filter out slots that conflict with existing appointments (buffer considered)
        const dayApts = appointments.filter(a => a.date === dateStr);

        const slotStrings = slots.map(s => fmt(s)).filter(slot => {
            // count total bookings on this day (for maxPerDay enforcement)
            if (dayApts.length >= (avail.maxPerDay || Infinity)) return false;

            // buffer check: no appointment within bufferMinutes of slot
            const slotTime = new Date(year, month, day, Number(slot.split(':')[0]), Number(slot.split(':')[1]));
            const buffer = (avail.bufferMinutes || 0);
            const conflicts = dayApts.some(a => {
                if (!a.time) return false;
                const [ah, am] = a.time.split(':').map(Number);
                const aptDate = new Date(year, month, day, ah, am);
                const diff = Math.abs(aptDate - slotTime) / 60000; // minutes
                return diff < buffer;
            });

            return !conflicts;
        });

        return slotStrings;
    }

    return (
        <div className="p-3 sm:p-4 md:p-5 lg:p-6 bg-base-200 rounded-lg shadow-md">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 sm:mb-6 gap-3">
                <div className="w-full sm:w-auto">
                    <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg sm:text-xl font-semibold">
                            {!selectedFriendId 
                                ? 'My Schedule' 
                                : `${selectedFriend?.fullName || 'Friend'}'s Schedule`
                            }
                        </h2>
                        <select 
                            className="select select-bordered select-sm" 
                            value={selectedFriendId || ''}
                            onChange={(e) => onSelectFriend(e.target.value)}
                        >
                            <option value="">My Schedule</option>
                            {friends.map(friend => (
                                <option key={friend._id} value={friend._id}>
                                    {friend.fullName}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="h-px bg-base-300 mt-3 w-full" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-base-300 rounded-full p-1">
                        <button onClick={handlePrevMonth} className="btn btn-ghost btn-xs px-2">◀</button>
                        <div
                            onClick={() => setShowMonthPicker(true)}
                            role="button"
                            className="text-sm font-medium px-3 cursor-pointer"
                            title="Click to pick month"
                        >
                            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </div>
                        <button onClick={handleNextMonth} className="btn btn-ghost btn-xs px-2">▶</button>
                    </div>
                    {/* Check if current time is within availability */}
                    {(() => {
                        const now = new Date();
                        const withinHours = (() => {
                            const [startH, startM] = avail.start.split(':').map(Number);
                            const [endH, endM] = avail.end.split(':').map(Number);
                            const timeNow = now.getHours() * 60 + now.getMinutes();
                            const startTime = startH * 60 + startM;
                            const endTime = endH * 60 + endM;
                            return timeNow >= startTime && timeNow < endTime;
                        })();
                        
                        const isAvailableDay = avail.days.includes(now.getDay());
                        const canSchedule = isAvailableDay && withinHours;

                        return (
                            <button 
                                className={`btn btn-sm ${canSchedule ? 'btn-primary' : 'btn-disabled opacity-50'}`}
                                onClick={() => canSchedule && onOpenCreate && onOpenCreate(new Date())}
                                title={!canSchedule ? "New appointments can only be created during available hours" : ""}
                                disabled={!canSchedule}
                            >
                                + New Appointment
                            </button>
                        );
                    })()}
                </div>
            </div>

            <div className="grid grid-cols-7 gap-2 sm:gap-3 md:gap-4 lg:gap-6">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                    <div key={d} className="text-[10px] sm:text-xs text-center font-medium opacity-70">{d}</div>
                ))}

                {calendarDays.map((day, idx) => {
                    if (day === null) {
                        return <div key={`empty-${idx}`} className="h-12 sm:h-14 md:h-16 lg:h-20" />;
                    }
                    const currentDateObj = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const holidayName = isPhilippineHoliday(currentDateObj);
                    const dayAppointments = getAppointmentsForDay(day);
                    const isHoliday = !!holidayName;
                    const availableSlots = getAvailableSlotsForDay(day);
                    const isAvailable = availableSlots.length > 0;
                    const hasAppointments = dayAppointments.length > 0;
                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const isSelected = selectedDate?.toDateString() === date.toDateString();

                    return (
                        <div key={day} className="relative flex items-center justify-center">
                            <button
                                onClick={() => setSelectedDate(isSelected ? null : date)}
                                className={`w-full h-10 sm:h-11 md:h-12 lg:h-14 flex items-center justify-center rounded-full transition-colors select-none text-xs sm:text-sm font-medium
                                    ${isToday ? 'ring-2 ring-primary bg-primary/5' : ''}
                                    ${dayAppointments.length ? 'bg-green-600 text-white' : 'bg-base-300 text-gray-700'}
                                    ${isSelected ? 'ring-2 ring-primary/30' : ''}
                                `}
                            >
                                <span className={`${isToday ? 'text-primary' : ''}`}>
                                    {day}
                                </span>
                            </button>

                            {/* appointment dots below the pill */}
                            {dayAppointments.length > 0 && (
                                <div className="absolute -bottom-3 flex gap-1">
                                    {Array.from({ length: Math.min(dayAppointments.length, 3) }).map((_, i) => (
                                        <div key={i} className="w-2 h-2 rounded-full bg-green-500" />
                                    ))}
                                </div>
                            )}

                            {isSelected && (
                                <DayDetailsModal
                                    date={new Date(currentDate.getFullYear(), currentDate.getMonth(), day)}
                                    appointments={dayAppointments}
                                    onClose={() => setSelectedDate(null)}
                                    availableSlots={availableSlots}
                                    onCreateSlot={(time) => {
                                        // forward to parent create handler with specific date/time
                                        if (onOpenCreate) {
                                            const d = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                                            onOpenCreate(d, time);
                                        }
                                    }}
                                    isHoliday={holidayName}
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 mt-4 sm:mt-6 text-xs sm:text-sm">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded bg-green-600" />
                    <span className="opacity-70">Has appointments</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded bg-primary/50" />
                    <span className="opacity-70">Today</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded bg-base-300" />
                    <span className="opacity-70">Available</span>
                </div>
            </div>
            {showMonthPicker && (
                <MonthPicker
                    currentDate={currentDate}
                    onSelect={(d) => setCurrentDate(d)}
                    onClose={() => setShowMonthPicker(false)}
                />
            )}
        </div>
    );
};

export default Calendar;
