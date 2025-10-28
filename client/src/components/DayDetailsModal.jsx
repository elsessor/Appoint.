import React from 'react';

const DayDetailsModal = ({ date, appointments, onClose }) => {
    const formatTimeTo12Hour = (time) => {
        const [hours, minutes] = time.split(':').map(Number);
        const period = hours >= 12 ? 'pm' : 'am';
        const displayHours = hours % 12 || 12;
        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
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
                
                <div className="space-y-3">
                    {appointments.map((apt) => (
                        <div key={apt.id} className="p-3 bg-base-200 rounded-lg">
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
                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DayDetailsModal;