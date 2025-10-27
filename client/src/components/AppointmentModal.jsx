import { useEffect, useState } from "react";

const AppointmentModal = ({ isOpen, onClose, onCreate, initialDate = new Date(), appointments = [], friends = [] }) => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState("1 hour");
    const [message, setMessage] = useState("");
    const [participant, setParticipant] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        if (isOpen) {
            // reset form when opened and set initial date
            setError("");
            setTitle("");
            setDate(initialDate ? initialDate.toISOString().split('T')[0] : "");
            setTime("09:00");
            setDuration("1 hour");
            setMessage("");
            setParticipant(friends.length ? friends[0].id : "");
        }
    }, [isOpen, initialDate, friends]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        setError("");

        // Basic validation: participant must be a friend
        if (friends.length && !friends.find(f => String(f.id) === String(participant))) {
            setError("Selected participant is not in your friends list. Only friends can schedule an appointment.");
            return;
        }

        // Conflict check: same date and time already exists
        const conflict = appointments.some(a => a.date === date && a.time === time);
        if (conflict) {
            setError("This schedule has been taken. Please pick another time.");
            return;
        }

        const payload = { title, date, time, duration, message, participant };
        if (onCreate) onCreate(payload);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/50" onClick={onClose}></div>

            <div className="relative bg-base-100 rounded-lg shadow-lg w-full max-w-2xl p-6 mx-4">
                <button
                    className="absolute right-3 top-3 btn btn-ghost btn-sm"
                    onClick={onClose}
                    aria-label="Close modal"
                >
                    ✕
                </button>

                <h3 className="text-lg font-semibold mb-4">Create Appointment</h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="alert alert-error">
                            <span>{error}</span>
                        </div>
                    )}
                    <div>
                        <label className="label">
                            <span className="label-text">Appointment Name</span>
                        </label>
                        <input
                            className="input input-bordered w-full"
                            placeholder="Add title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="label">
                                <span className="label-text">Date</span>
                            </label>
                            <input
                                type="date"
                                className="input input-bordered w-full"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text">Time</span>
                            </label>
                            <input
                                type="time"
                                className="input input-bordered w-full"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <label className="label">
                                <span className="label-text">Duration</span>
                            </label>
                            <select
                                className="select select-bordered w-full"
                                value={duration}
                                onChange={(e) => setDuration(e.target.value)}
                            >
                                <option>15 mins</option>
                                <option>30 mins</option>
                                <option>45 mins</option>
                                <option>1 hour</option>
                                <option>2 hours</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="label">
                            <span className="label-text">With (choose friend)</span>
                        </label>
                        <select
                            className="select select-bordered w-full"
                            value={participant}
                            onChange={(e) => setParticipant(e.target.value)}
                        >
                            <option value="">Select a friend</option>
                            {friends.map(f => (
                                <option key={f.id} value={f.id}>{f.fullName}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="label">
                            <span className="label-text">Message</span>
                        </label>
                        <textarea
                            className="textarea textarea-bordered w-full h-32"
                            placeholder="Write a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                    </div>

                    <div className="mt-2">
                        <button type="submit" className="btn btn-primary w-full">
                            Create Appointment
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AppointmentModal;
