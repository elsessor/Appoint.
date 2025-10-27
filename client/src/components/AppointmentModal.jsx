import { useEffect, useState } from "react";

const AppointmentModal = ({ isOpen, onClose, onCreate }) => {
    const [title, setTitle] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [duration, setDuration] = useState("1 hour");
    const [message, setMessage] = useState("");

    useEffect(() => {
        if (isOpen) {
            // reset form when opened
            setTitle("");
            setDate("");
            setTime("");
            setDuration("1 hour");
            setMessage("");
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        const payload = { title, date, time, duration, message };
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
