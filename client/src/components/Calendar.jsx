import { useMemo, useState } from "react";
import DayDetailsModal from "./DayDetailsModal";

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


const Calendar = ({ onNewAppointment, appointments = [], friends = [], selectedFriendId, onSelectFriend, currentUser }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(null);
    const [showMonthPicker, setShowMonthPicker] = useState(false);
    
    const selectedFriend = friends.find(f => String(f._id) === String(selectedFriendId));

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
        // Build YYYY-MM-DD in local time to avoid timezone shifts caused by toISOString()
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth() + 1; // months are 0-indexed
        const dayNum = day;
        const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;

        return filteredAppointments.filter(a => a.date === dateStr);
    };

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
                    <button className="btn btn-primary btn-sm" onClick={onNewAppointment}>
                        + New Appointment
                    </button>
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

                    const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
                    const isToday = new Date().toDateString() === date.toDateString();
                    const dayAppointments = getAppointmentsForDay(day);
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

                            {isSelected && dayAppointments.length > 0 && (
                                <DayDetailsModal
                                    date={date}
                                    appointments={dayAppointments}
                                    onClose={() => setSelectedDate(null)}
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
