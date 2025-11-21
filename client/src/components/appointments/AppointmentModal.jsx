import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns';
import { X, Clock, User, MessageSquare, Calendar } from 'lucide-react';

const AppointmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate,
  initialTime,
  friends = [],
  currentUser,
  availability = {
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
  },
  appointment = null,
  onDelete = null,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startTime: '',
    endTime: '',
    friendId: '',
    meetingType: 'Video Call',
  });

  useEffect(() => {
    if (appointment) {
      setFormData({
        title: appointment.title || '',
        description: appointment.description || appointment.message || '',
        startTime: appointment.startTime || '',
        endTime: appointment.endTime || '',
        friendId: appointment.friendId || appointment.participant?._id || '',
        meetingType: appointment.meetingType || 'Video Call',
      });
    } else if (initialDate) {
      const dateStr = format(initialDate, 'yyyy-MM-dd');
      const timeStr = initialTime ? format(initialTime, 'HH:mm') : '09:00';
      setFormData({
        ...formData,
        startTime: `${dateStr}T${timeStr}`,
        endTime: `${dateStr}T${timeStr}`,
      });
    }
  }, [appointment, initialDate, initialTime]);

  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMin] = availability.start.split(':').map(Number);
    const [endHour, endMin] = availability.end.split(':').map(Number);
    const duration = availability.slotDuration || 30;

    let current = new Date();
    current.setHours(startHour, startMin, 0, 0);
    const end = new Date();
    end.setHours(endHour, endMin, 0, 0);

    while (current < end) {
      slots.push(format(current, 'HH:mm'));
      current.setMinutes(current.getMinutes() + duration);
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('Please enter an appointment title');
      return;
    }

    if (!formData.startTime) {
      alert('Please select a start time');
      return;
    }

    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-100">
            {appointment ? 'Edit Appointment' : 'Create Appointment'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="Enter appointment title"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Friend Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              With Friend <span className="text-red-400">*</span>
            </label>
            <select
              name="friendId"
              value={formData.friendId}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a friend</option>
              {friends.map(friend => (
                <option key={friend._id} value={friend._id}>
                  {friend.fullName || friend.name}
                </option>
              ))}
            </select>
          </div>

          {/* Meeting Type */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Meeting Type
            </label>
            <select
              name="meetingType"
              value={formData.meetingType}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option>Video Call</option>
              <option>Phone Call</option>
              <option>In Person</option>
            </select>
          </div>

          {/* Start Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Start Time <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* End Time */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              End Time <span className="text-red-400">*</span>
            </label>
            <input
              type="datetime-local"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Notes
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add any notes or details..."
              rows="4"
              className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-700">
            {appointment && onDelete && (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this appointment?')) {
                    onDelete();
                    onClose();
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Delete
              </button>
            )}
            <div className="flex-1 flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-medium transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
              >
                {appointment ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

AppointmentModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  initialDate: PropTypes.instanceOf(Date),
  initialTime: PropTypes.instanceOf(Date),
  friends: PropTypes.arrayOf(PropTypes.object),
  currentUser: PropTypes.object,
  availability: PropTypes.object,
  appointment: PropTypes.object,
  onDelete: PropTypes.func,
};

export default AppointmentModal;
