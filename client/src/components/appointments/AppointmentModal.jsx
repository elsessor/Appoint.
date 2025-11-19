import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, addMinutes } from 'date-fns';
import TimeSlotPicker from './TimeSlotPicker';
import BookingDetailsForm from './BookingDetailsForm';

const AppointmentModal = ({
  isOpen,
  onClose,
  onSubmit,
  initialDate = new Date(),
  initialTime,
  friends = [],
  currentUser,
  calendarOwner, // The owner of the calendar being viewed
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
  const [step, setStep] = useState(1); // 1 for TimeSlotPicker, 2 for BookingDetailsForm

  // Check if current user is the calendar owner
  const isOwner = currentUser?._id === calendarOwner?._id;

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
      fetchAvailableSlots(format(initialDate, 'yyyy-MM-dd'));
    }
  }, [isOpen, initialDate, initialTime, friends]);

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
      const parsedDate = new Date(date);
      // Get available slots based on availability settings
      const availableSlots = [];
      const [startHour] = availability.start.split(':').map(Number);
      const [endHour] = availability.end.split(':').map(Number);

      // Check if the date is within available days
      const dayOfWeek = parsedDate.getDay();
      if (!availability.days.includes(dayOfWeek)) {
        setAvailableSlots([]);
        return;
      }

      for (let hour = startHour; hour < endHour; hour++) {
        for (let minute = 0; minute < 60; minute += availability.slotDuration) {
          const slotDate = new Date(parsedDate);
          slotDate.setHours(hour, minute, 0, 0);

          // Don't add slots in the past
          if (slotDate < new Date()) {
            continue;
          }

          availableSlots.push({
            hour,
            minute,
            available: true,
            dateTime: slotDate
          });
        }
      }

      setAvailableSlots(availableSlots);
    } catch (err) {
      console.error('Error fetching available slots:', err);
      setError('Failed to load available time slots');
    } finally {
      setIsLoading(false);
    }
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
        time: '',
      }));
    }
  };

  const handleTimeSelect = (dateTime) => {
    setFormData(prev => ({
      ...prev,
      time: format(dateTime, 'HH:mm'),
    }));
  };

  const handleSaveCustomAvailability = async (customData) => {
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/availability', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //     'Authorization': `Bearer ${localStorage.getItem('token')}`,
      //   },
      //   body: JSON.stringify({
      //     date: customData.date,
      //     slots: customData.slots,
      //     userId: customData.userId,
      //   }),
      // });
      
      // if (!response.ok) {
      //   throw new Error('Failed to save custom availability');
      // }
      
      // const data = await response.json();
      
      // Update local state with saved data
      setAvailableSlots(customData.slots);
      
      console.log('Custom availability saved:', customData);
      return Promise.resolve();
    } catch (err) {
      console.error('Error saving custom availability:', err);
      throw err;
    }
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

    // Validate selected time slot is available
    const [selectedHour, selectedMinute] = formData.time.split(':').map(Number);
    const selectedSlot = availableSlots.find(
      slot => slot.hour === selectedHour && slot.minute === selectedMinute
    );

    if (!selectedSlot || !selectedSlot.available) {
      setError('The selected time slot is no longer available');
      return;
    }

    const startDate = new Date(formData.date);
    startDate.setHours(selectedHour, selectedMinute, 0, 0);
    
    // Calculate end time based on selected duration
    const endDate = addMinutes(new Date(startDate), formData.duration);

    // Validate end time is within available hours
    const endHour = endDate.getHours();
    const [maxHour] = availability.end.split(':').map(Number);
    if (endHour > maxHour) {
      setError('Appointment duration exceeds available hours');
      return;
    }

    const appointment = {
      ...formData,
      startTime: startDate.toISOString(),
      endTime: endDate.toISOString(),
      userId: currentUser?._id,
      calendarOwnerId: calendarOwner?._id,
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
          <div className="w-screen max-w-3xl">
            <div className="h-full flex flex-col bg-gray-900 shadow-xl">
              <div className="flex-1 py-6 overflow-y-auto px-6 sm:px-8">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-lg font-medium text-gray-100" id="slide-over-title">
                      {formData._id ? 'Edit Appointment' : 'New Appointment'}
                    </h2>
                    {calendarOwner && (
                      <p className="text-sm text-gray-400 mt-1">
                        {isOwner ? 'Your Calendar' : `With ${calendarOwner.name || calendarOwner.email}`}
                      </p>
                    )}
                  </div>
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
                      placeholder="E.g., Magvalorant sa Meeting Room"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
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
                        <option value="60">1 hour</option>
                        <option value="90">1.5 hours</option>
                        <option value="120">2 hrs</option>
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

                  <div className="pt-4">
                    {step === 1 ? (
                      <div className="border border-gray-700 rounded-lg p-4 bg-gray-800/50">
                        <TimeSlotPicker
                          selectedDate={selectedDate}
                          selectedTime={selectedTime}
                          onTimeSelect={() => {
                            handleTimeSelect(selectedTime);
                            setStep(2);
                          }}
                          availableSlots={availableSlots}
                          workingHours={{
                            start: parseInt(availability.start.split(':')[0]),
                            end: parseInt(availability.end.split(':')[0]),
                          }}
                          slotDuration={availability.slotDuration}
                          isOwner={isOwner}
                          userId={currentUser?._id}
                          calendarOwnerId={calendarOwner?._id}
                        />
                      </div>
                    ) : (
                      <BookingDetailsForm
                        onSubmit={handleSubmit}
                        onBack={() => setStep(1)}
                        selectedSlot={{
                          date: selectedDate,
                          time: formData.time
                        }}
                      />
                    )}
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
  calendarOwner: PropTypes.shape({
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