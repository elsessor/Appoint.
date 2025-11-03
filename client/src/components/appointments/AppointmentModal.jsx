import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isBefore, addMinutes } from 'date-fns';
import TimeSlotPicker from './TimeSlotPicker';

const AppointmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate = new Date(),
  initialTime,
  friends = [],
  currentUser,
  availability = {
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
    buffer: 15,
  },
}) => {
  const [formData, setFormData] = useState({
    title: '',
    date: format(initialDate, 'yyyy-MM-dd'),
    time: initialTime ? format(initialTime, 'HH:mm') : '',
    duration: 30,
    message: '',
    participant: friends[0]?._id || '',
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: '',
        date: format(initialDate, 'yyyy-MM-dd'),
        time: initialTime ? format(initialTime, 'HH:mm') : '',
        duration: 30,
        message: '',
        participant: friends[0]?._id || '',
      });
      setError('');
      // Load available slots when modal opens
      fetchAvailableSlots(format(initialDate, 'yyyy-MM-dd'));
    }
  }, [isOpen, initialDate, initialTime, friends]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const fetchAvailableSlots = async (date) => {
    try {
      setIsLoading(true);
      // In a real app, you would fetch this from your API
      // const response = await fetch(`/api/availability?date=${date}`);
      // const data = await response.json();
      // setAvailableSlots(data.availableSlots);
      
      // Mock data for demonstration
      const mockSlots = generateMockSlots(date);
      setAvailableSlots(mockSlots);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setIsLoading(false);
    }
  };

  const generateMockSlots = (date) => {
    const slots = [];
    const [startHour, startMinute] = availability.start.split(':').map(Number);
    const [endHour] = availability.end.split(':').map(Number);
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += availability.slotDuration) {
        // All slots are available by default
        // In a real app, you would check against existing appointments
        slots.push({
          hour,
          minute,
          available: true,
        });
      }
    }
    return slots;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    if (name === 'date') {
      fetchAvailableSlots(value);
      setFormData(prev => ({
        ...prev,
        time: '', // Reset time when date changes
      }));
    }
  };

  const handleTimeSelect = (dateTime) => {
    setFormData(prev => ({
      ...prev,
      time: format(dateTime, 'HH:mm'),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      setError('Please enter a title for the appointment');
      return;
    }

    if (!formData.time) {
      setError('Please select a time slot');
      return;
    }

    if (!formData.participant) {
      setError('Please select a participant');
      return;
    }

    const [hours, minutes] = formData.time.split(':').map(Number);
    const startDate = new Date(formData.date);
    startDate.setHours(hours, minutes, 0, 0);
    
    const endDate = addMinutes(new Date(startDate), formData.duration);

    const appointment = {
      ...formData,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      userId: currentUser?._id,
      status: 'scheduled',
    };

    onSubmit(appointment);
    onClose();
  };

  if (!isOpen) return null;

  const selectedDate = formData.date ? new Date(formData.date) : new Date();
  const selectedTime = formData.time 
    ? parseISO(`${formData.date}T${formData.time}`) 
    : null;

  return (
    <div
      className={`fixed inset-0 z-50 overflow-hidden transition-all duration-300 ease-in-out transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-labelledby="slide-over-title"
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0" aria-hidden="true">
          <div 
            className="absolute inset-0 bg-black bg-opacity-75 transition-opacity"
            onClick={onClose}
          ></div>
        </div>

        <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
          <div className="w-screen max-w-md">
            <div className="h-full flex flex-col bg-gray-900 shadow-xl overflow-y-scroll">
              <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                <div className="flex items-start justify-between">
                  <h2 className="text-lg font-medium text-gray-100" id="slide-over-title">
                    {formData._id ? 'Edit Appointment' : 'New Appointment'}
                  </h2>
                  <div className="ml-3 h-7 flex items-center">
                    <button
                      type="button"
                      className="bg-gray-800 rounded-md text-gray-400 hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onClick={onClose}
                    >
                      <span className="sr-only">Close panel</span>
                      <svg
                        className="h-6 w-6"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="mt-4 p-3 bg-red-900 text-red-200 rounded-md text-sm">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Title *
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                      placeholder="E.g., Language Practice"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Date *
                      </label>
                      <input
                        type="date"
                        name="date"
                        value={formData.date}
                        onChange={handleInputChange}
                        min={format(new Date(), 'yyyy-MM-dd')}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-1">
                        Duration *
                      </label>
                      <select
                        name="duration"
                        value={formData.duration}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="30">30 mins</option>
                        <option value="60">60 mins</option>
                        <option value="90">90 mins</option>
                        <option value="120">120 mins</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      With
                    </label>
                    <select
                      name="participant"
                      value={formData.participant}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {friends.map(friend => (
                        <option key={friend._id} value={friend._id}>
                          {friend.name || friend.email}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-1">
                      Message (Optional)
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                      placeholder="Add any additional details..."
                    />
                  </div>

                  <div className="pt-2">
                    <h4 className="text-sm font-medium text-gray-300 mb-2">Select Time Slot</h4>
                    <div className="border border-gray-700 rounded-md p-3 bg-gray-800">
                      <TimeSlotPicker
                        selectedDate={selectedDate}
                        selectedTime={selectedTime}
                        onTimeSelect={handleTimeSelect}
                        availableSlots={availableSlots}
                        workingHours={{
                          start: parseInt(availability.start.split(':')[0]),
                          end: parseInt(availability.end.split(':')[0]),
                        }}
                        slotDuration={availability.slotDuration}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-700 mt-6">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-200 bg-gray-800 border border-gray-600 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      {isLoading ? 'Saving...' : 'Save Appointment'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
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
  friends: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string,
      email: PropTypes.string.isRequired,
    })
  ),
  currentUser: PropTypes.shape({
    _id: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string.isRequired,
  }),
  availability: PropTypes.shape({
    days: PropTypes.arrayOf(PropTypes.number),
    start: PropTypes.string,
    end: PropTypes.string,
    slotDuration: PropTypes.number,
    buffer: PropTypes.number,
  }),
};

export default AppointmentModal;
