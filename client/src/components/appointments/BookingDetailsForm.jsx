import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Video, Phone, Users } from 'lucide-react';

const MEETING_TYPES = [
  { id: 'video', label: 'Video Call', icon: Video },
  { id: 'call', label: 'Phone Call', icon: Phone },
  { id: 'in-person', label: 'In Person', icon: Users },
];

const BookingDetailsForm = ({ onSubmit, onBack, selectedSlot }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    meetingType: 'video',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="bg-gray-900 rounded-lg shadow-2xl max-w-4xl mx-auto flex flex-col h-full">
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-200">Complete Your Booking</h2>
          <p className="text-sm text-gray-400 mt-1">
            Please provide your details to confirm the appointment
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Contact Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                First Name *
              </label>
              <input
                type="text"
                name="firstName"
                required
                value={formData.firstName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                name="lastName"
                required
                value={formData.lastName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Phone Number *
              </label>
              <input
                type="tel"
                name="phoneNumber"
                required
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              />
            </div>
          </div>

          {/* Meeting Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">
              How would you like to meet? *
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MEETING_TYPES.map(({ id, label, icon: Icon }) => {
                const isSelected = formData.meetingType === id;
                return (
                  <label
                    key={id}
                    className="relative w-full"
                  >
                    <input
                      type="radio"
                      name="meetingType"
                      value={id}
                      checked={isSelected}
                      onChange={handleInputChange}
                      className="peer sr-only"
                    />
                    <div className={`
                      flex items-center justify-center gap-3 p-4 rounded-lg border 
                      cursor-pointer transition-all duration-200
                      peer-checked:border-blue-500 peer-checked:bg-blue-500/10 
                      peer-checked:ring-2 peer-checked:ring-blue-500/50
                      ${isSelected 
                        ? 'border-blue-500 bg-blue-500/10' 
                        : 'border-gray-700 bg-gray-800 hover:bg-gray-700 hover:border-gray-600'
                      }
                    `}>
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-400' : 'text-gray-400'}`} />
                      <span className={`text-sm font-medium ${isSelected ? 'text-blue-400' : 'text-gray-300'}`}>
                        {label}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Additional Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              rows="3"
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
              placeholder="Any special requests or information you'd like to share..."
            />
          </div>
        </form>
      </div>

      {/* Footer - Fixed at bottom */}
      <div className="mt-auto border-t border-gray-700 bg-gray-900">
        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="text-sm text-gray-400">
            Step 2 of 2: Booking Details
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2 text-gray-300 hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              type="submit"
              onClick={handleSubmit}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded transition-colors"
            >
              Confirm Booking
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

BookingDetailsForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
  selectedSlot: PropTypes.shape({
    date: PropTypes.instanceOf(Date),
    time: PropTypes.string,
  }).isRequired,
};

export default BookingDetailsForm;