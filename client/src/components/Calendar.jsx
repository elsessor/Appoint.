import { useMemo } from "react";

const Calendar = ({ onNewAppointment, appointments = [] }) => {
    const today = new Date();
    const monthName = today.toLocaleString(undefined, { month: "long", year: "numeric" });

    const days = useMemo(() => {
        // simple placeholder: 1..31
        const arr = Array.from({ length: 31 }, (_, i) => i + 1);
        return arr;
    }, []);

    return (
        <div className="p-6 bg-base-200 rounded-lg shadow-md">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Schedule</h2>
                <div className="flex items-center gap-2">
                    <div className="text-sm opacity-70 mr-2">{monthName}</div>
                    <button className="btn btn-primary btn-sm" onClick={onNewAppointment}>
                        + New Appointment
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-7 gap-3">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
                    <div key={d} className="text-xs text-center opacity-70">{d}</div>
                ))}

                {days.map((day) => {
                    const has = appointments.some(a => a.date && Number(a.date.split('-')[2]) === day);
                    return (
                        <div key={day} className="flex items-center justify-center">
                            <div className={`w-14 h-10 rounded-lg flex items-center justify-center ${has ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                                {day}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Calendar;
