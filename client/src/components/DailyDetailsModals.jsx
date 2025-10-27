import { ClockIcon, MessageSquareIcon, UserIcon } from "lucide-react";

function formatTimeTo12Hour(timeStr) {
    if (!timeStr) return "";
    // accept formats like "HH:MM" or "HH:MM:SS"
    const parts = timeStr.split(":");
    if (parts.length < 1) return timeStr;
    const hour = parseInt(parts[0], 10);
    const minute = parts[1] ? parts[1].padStart(2, "0") : "00";
    if (Number.isNaN(hour)) return timeStr;
    const ampm = hour >= 12 ? "pm" : "am";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return `${hour12}:${minute} ${ampm}`;
}

const DayDetailsModal = ({ date, appointments = [], onClose }) => {
    if (!appointments?.length) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>
            
            <div className="relative bg-base-100 rounded-lg shadow-xl w-full max-w-2xl mx-4 p-6">
                <button
                    className="absolute right-3 top-3 btn btn-ghost btn-sm"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    ✕
                </button>

                <h3 className="text-xl font-semibold mb-4">
                    Appointments for {date.toLocaleDateString(undefined, { 
                        weekday: 'long',
                        month: 'long',
                        day: 'numeric',
                        year: 'numeric'
                    })}
                </h3>

                <div className="space-y-4">
                    {appointments.map((apt, idx) => (
                        <div 
                            key={idx}
                            className="p-4 bg-base-200 rounded-lg hover:bg-base-300 transition-colors"
                        >
                            <div className="flex items-start justify-between">
                                <div>
                                    <h4 className="font-semibold text-lg">{apt.title}</h4>
                                    <div className="flex items-center gap-4 mt-2">
                                        <div className="flex items-center gap-2 text-sm">
                                            <ClockIcon size={16} className="opacity-70" />
                                            <span>{formatTimeTo12Hour(apt.time)}</span>
                                            <span className="opacity-70">({apt.duration})</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <UserIcon size={16} className="opacity-70" />
                                            <span>{apt.user?.fullName || 'Anonymous'}</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {apt.status && (
                                    <span className={`badge ${
                                        apt.status === 'confirmed' ? 'badge-success' :
                                        apt.status === 'pending' ? 'badge-warning' :
                                        'badge-error'
                                    }`}>
                                        {apt.status}
                                    </span>
                                )}
                            </div>

                            {apt.message && (
                                <div className="mt-3 flex items-start gap-2">
                                    <MessageSquareIcon size={16} className="opacity-70 mt-1" />
                                    <p className="text-sm opacity-70">{apt.message}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default DayDetailsModal;