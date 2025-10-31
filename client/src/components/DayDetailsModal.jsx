import React from 'react';
import { formatTime12 } from "../lib/date";

const DayDetailsModal = ({ date, appointments = [], onClose, availableSlots = [], onCreateSlot, isHoliday = false }) => {
    const formatTimeTo12Hour = (time) => formatTime12(time);

    // Check if a time slot is in the past
    const isTimeSlotPast = (timeStr) => {
        if (!timeStr || !date) return false;
        const now = new Date();
        const [hours, minutes] = timeStr.split(':').map(Number);
        const slotTime = new Date(date);
        slotTime.setHours(hours, minutes, 0, 0);
        return slotTime <= now;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
            <div className="relative bg-base-100 rounded-lg shadow-lg w-full max-w-md p-4 mx-4">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium">
                        Appointments for {date.toLocaleDateString()}
                    </h3>
                    <button onClick={onClose} className="btn btn-ghost btn-sm">×</button>
                </div>

                {isHoliday && (
                    <div className="mb-3 p-3 bg-yellow-100 text-yellow-800 rounded">
                        <div className="font-medium">🎉 {isHoliday}</div>
                        <div className="text-sm">Public Holiday</div>
                    </div>
                )}

                {(!appointments || appointments.length === 0) ? (
                    <div className="space-y-3">
                        <div className="p-3 bg-base-200 rounded-lg">No appointments for this day.</div>

                        {availableSlots && availableSlots.length > 0 ? (
                            <div>
                                <div className="text-sm font-medium mb-2">Available slots</div>
                                <div className="grid grid-cols-3 gap-2">
                                    {availableSlots.map((t) => (
                                        <button 
                                            key={t} 
                                            onClick={() => !isTimeSlotPast(t) && onCreateSlot && onCreateSlot(t)} 
                                            className={`btn btn-sm ${isTimeSlotPast(t) 
                                                ? 'btn-disabled opacity-50 cursor-not-allowed' 
                                                : 'btn-outline'}`}
                                            title={isTimeSlotPast(t) ? "This time has already passed" : ""}
                                            disabled={isTimeSlotPast(t)}
                                        >
                                            {formatTimeTo12Hour(t)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="text-sm opacity-70">No available slots on this day.</div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-3">
                        {appointments.map((apt) => (
                            <div key={apt.id || apt._id || apt.time} className="p-3 bg-base-200 rounded-lg">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{apt.title}</div>
                                        <div className="text-sm opacity-70">
                                            with {apt.user?.fullName || 'Friend'}
                                        </div>
                                    </div>
                                    <div className="text-sm opacity-70">
                                        {formatTimeTo12Hour(apt.time)}
                                    </div>
                                </div>
                                {apt.message && (
                                    <div className="mt-2 text-sm opacity-70">{apt.message}</div>
                                )}
                                <div className="mt-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${
                                        apt.status === 'confirmed' ? 'bg-success/20 text-success' :
                                        apt.status === 'pending' ? 'bg-warning/20 text-warning' :
                                        'bg-error/20 text-error'
                                    }`}>
                                        {apt.status ? (apt.status.charAt(0).toUpperCase() + apt.status.slice(1)) : 'Pending'}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DayDetailsModal;