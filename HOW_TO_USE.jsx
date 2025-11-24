// ============================================
// HOW TO USE THE AVAILABILITY FEATURES
// ============================================

// ============================================
// 1. IMPORT THE COMPONENTS
// ============================================

// In your main page or component:
import AvailabilityStatusToggle from '../components/AvailabilityStatusToggle';
import AvailabilitySettings from '../components/AvailabilitySettings';
import AvailabilityInfo from '../components/AvailabilityInfo';
import axios from '../lib/axios';


// ============================================
// 2. QUICK STATUS TOGGLE (Easiest)
// ============================================

export function YourNavbar({ currentUser }) {
  const handleStatusChange = (newStatus) => {
    console.log('Status changed to:', newStatus);
    // Status is automatically saved via the component
  };

  return (
    <nav>
      {/* Add this anywhere in your navbar or header */}
      <AvailabilityStatusToggle 
        currentUser={currentUser}
        onStatusChange={handleStatusChange}
      />
    </nav>
  );
}

// Usage:
// Click the button → Select Available/Limited/Away → Saved automatically!


// ============================================
// 3. FULL SETTINGS DIALOG
// ============================================

export function YourSettingsPage({ currentUser }) {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div>
      <button 
        onClick={() => setShowSettings(true)}
        className="btn btn-primary"
      >
        ⚙️ Availability Settings
      </button>

      {/* Full availability configuration */}
      <AvailabilitySettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
      />
    </div>
  );
}

// In AvailabilitySettings modal, users can:
// ✓ Set working hours (9:00-17:00)
// ✓ Choose available days (Mon-Fri)
// ✓ Add break times (12:00-13:00)
// ✓ Set lead time (2 hours)
// ✓ Set cancel notice (24 hours)
// ✓ Configure slot duration & buffer


// ============================================
// 4. DISPLAY AVAILABILITY INFO
// ============================================

export function FriendProfile({ friend }) {
  return (
    <div>
      <h2>{friend.fullName}</h2>
      
      {/* Show friend's availability summary */}
      <AvailabilityInfo
        availability={friend.availability}
        availabilityStatus={friend.availabilityStatus}
      />
    </div>
  );
}

// Shows:
// ✓ Status (Available/Limited/Away)
// ✓ Working hours
// ✓ Break times
// ✓ Lead time requirement
// ✓ Cancel notice requirement


// ============================================
// 5. VALIDATE BEFORE BOOKING
// ============================================

import {
  checkLeadTime,
  isWithinBreakTime,
  validateAppointmentDuration,
  getLeadTimeMessage,
  getCancelNoticeMessage,
} from '../utils/availabilityUtils';

export function BookingForm({ friendId, friendData }) {
  const [selectedTime, setSelectedTime] = useState(null);
  const [duration, setDuration] = useState(30);
  const [error, setError] = useState(null);

  const validateBooking = () => {
    const availability = friendData.availability || {};

    // Check 1: Lead time
    if (!checkLeadTime(selectedTime, availability.minLeadTime)) {
      const msg = getLeadTimeMessage(availability.minLeadTime);
      setError(msg);
      return false;
    }

    // Check 2: Break times
    const appointmentStart = new Date(selectedTime);
    const appointmentEnd = new Date(appointmentStart.getTime() + duration * 60000);
    
    const startStr = appointmentStart.getHours().toString().padStart(2, '0') + ':' +
                     appointmentStart.getMinutes().toString().padStart(2, '0');
    const endStr = appointmentEnd.getHours().toString().padStart(2, '0') + ':' +
                   appointmentEnd.getMinutes().toString().padStart(2, '0');

    if (isWithinBreakTime(startStr, endStr, availability.breakTimes)) {
      setError('This time is during break time. Choose another time.');
      return false;
    }

    // Check 3: Duration
    const durationValidation = validateAppointmentDuration(duration, {
      min: availability.appointmentDuration?.min || 15,
      max: availability.appointmentDuration?.max || 120,
    });
    
    if (!durationValidation.isValid) {
      setError(durationValidation.error);
      return false;
    }

    // Check 4: Status
    if (availability.availabilityStatus === 'away') {
      setError('This friend is currently away.');
      return false;
    }

    setError(null);
    return true;
  };

  const handleBook = async () => {
    if (!validateBooking()) return;

    try {
      const response = await axios.post('/appointments', {
        friendId,
        startTime: selectedTime,
        endTime: new Date(new Date(selectedTime).getTime() + duration * 60000),
        duration,
      });
      console.log('Booked:', response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <div>
      <input
        type="datetime-local"
        onChange={(e) => setSelectedTime(e.target.value)}
      />
      <input
        type="number"
        value={duration}
        onChange={(e) => setDuration(parseInt(e.target.value))}
        min="15"
        max="480"
      />
      {error && <div className="alert alert-error">{error}</div>}
      <button onClick={handleBook}>Book Appointment</button>
    </div>
  );
}


// ============================================
// 6. API USAGE EXAMPLES
// ============================================

// GET user's availability
async function getUserAvailability(userId) {
  const response = await axios.get(`/appointments/availability/${userId}`);
  return response.data;
  // Returns: { availability: {...}, availabilityStatus: 'available' }
}

// Example output:
/*
{
  "availability": {
    "days": [1, 2, 3, 4, 5],
    "start": "09:00",
    "end": "17:00",
    "slotDuration": 30,
    "buffer": 15,
    "maxPerDay": 5,
    "breakTimes": [
      { "start": "12:00", "end": "13:00" },
      { "start": "15:00", "end": "15:30" }
    ],
    "minLeadTime": 2,
    "cancelNotice": 24,
    "appointmentDuration": { "min": 15, "max": 120 }
  },
  "availabilityStatus": "available"
}
*/


// SAVE availability
async function saveAvailability(settings) {
  const response = await axios.post('/appointments/availability', {
    days: [1, 2, 3, 4, 5],
    start: '09:00',
    end: '17:00',
    slotDuration: 30,
    buffer: 15,
    maxPerDay: 5,
    breakTimes: [
      { start: '12:00', end: '13:00' },
      { start: '15:00', end: '15:30' }
    ],
    minLeadTime: 2,
    cancelNotice: 24,
    appointmentDuration: {
      min: 15,
      max: 120
    },
    availabilityStatus: 'available'
  });
  return response.data;
}


// ============================================
// 7. REAL WORLD EXAMPLE
// ============================================

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

export function AppointmentBookingPage() {
  const [selectedFriend, setSelectedFriend] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);

  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: async () => {
      const res = await axios.get('/auth/me');
      return res.data;
    },
  });

  // Get friends
  const { data: friends = [] } = useQuery({
    queryKey: ['friends'],
    queryFn: async () => {
      const res = await axios.get('/user/friends');
      return res.data;
    },
  });

  const handleBookAppointment = async () => {
    if (!selectedFriend || !selectedTime) return;

    try {
      // Validation happens automatically in API
      await axios.post('/appointments', {
        friendId: selectedFriend._id,
        startTime: selectedTime,
        endTime: new Date(new Date(selectedTime).getTime() + 30 * 60000),
      });
      alert('Appointment booked!');
    } catch (error) {
      alert(error.response?.data?.message || 'Booking failed');
    }
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header with quick status toggle */}
      <div className="flex justify-between items-center mb-6">
        <h1>Book Appointment</h1>
        <AvailabilityStatusToggle currentUser={currentUser} />
        <button 
          onClick={() => setShowSettings(true)}
          className="btn btn-outline"
        >
          ⚙️ Settings
        </button>
      </div>

      {/* Full settings modal */}
      <AvailabilitySettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        currentUser={currentUser}
      />

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Friends list */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-bold mb-4">Friends</h2>
          <div className="space-y-2">
            {friends.map(friend => (
              <button
                key={friend._id}
                onClick={() => setSelectedFriend(friend)}
                className={`btn btn-block text-left ${
                  selectedFriend?._id === friend._id ? 'btn-primary' : 'btn-outline'
                }`}
              >
                {friend.fullName}
              </button>
            ))}
          </div>
        </div>

        {/* Booking details */}
        <div className="lg:col-span-2">
          {selectedFriend ? (
            <div className="card bg-base-200 p-6 space-y-6">
              <h2 className="text-xl font-bold">{selectedFriend.fullName}</h2>

              {/* Show friend's availability */}
              <AvailabilityInfo
                availability={selectedFriend.availability}
                availabilityStatus={selectedFriend.availabilityStatus}
              />

              {/* Check if friend is away */}
              {selectedFriend.availabilityStatus === 'away' && (
                <div className="alert alert-warning">
                  ⚠️ This friend is currently away and not accepting bookings.
                </div>
              )}

              {selectedFriend.availabilityStatus !== 'away' && (
                <>
                  {/* Time picker */}
                  <div>
                    <label className="label">
                      <span className="label-text">Select Time</span>
                    </label>
                    <input
                      type="datetime-local"
                      value={selectedTime}
                      onChange={(e) => setSelectedTime(e.target.value)}
                      className="input input-bordered w-full"
                    />
                    {selectedFriend.availability?.minLeadTime > 0 && (
                      <p className="text-sm text-gray-500 mt-2">
                        ⏰ Requires {selectedFriend.availability.minLeadTime} hour advance notice
                      </p>
                    )}
                  </div>

                  {/* Book button */}
                  <button
                    onClick={handleBookAppointment}
                    disabled={!selectedTime}
                    className="btn btn-primary"
                  >
                    Book Appointment
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="card bg-base-200 p-6">
              <p className="text-gray-500">Select a friend to book an appointment</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


// ============================================
// 8. COMMON PATTERNS
// ============================================

// Pattern 1: Check availability before showing time slots
export function TimeSlotPicker({ friend }) {
  const availability = friend.availability || {};

  // Don't show time picker if away
  if (friend.availabilityStatus === 'away') {
    return <p>Friend is away</p>;
  }

  // Calculate minimum bookable time
  const minLeadHours = availability.minLeadTime || 0;
  const minBookingTime = new Date(Date.now() + minLeadHours * 3600000);

  return (
    <input
      type="datetime-local"
      min={minBookingTime.toISOString().slice(0, 16)}
    />
  );
}

// Pattern 2: Display cancel deadline
export function AppointmentDetails({ appointment, friend }) {
  const cancelNotice = friend.availability?.cancelNotice || 0;
  const cancelDeadline = new Date(
    new Date(appointment.startTime).getTime() - cancelNotice * 3600000
  );

  return (
    <div>
      <p>Appointment: {appointment.title}</p>
      <p>Start: {appointment.startTime}</p>
      <p className="text-sm text-red-500">
        ❌ Must cancel by: {cancelDeadline.toLocaleString()}
      </p>
    </div>
  );
}

// Pattern 3: Show why booking failed
export function BookingError({ error, friend }) {
  const availability = friend.availability || {};

  if (error.includes('away')) {
    return <p>Friend is currently away</p>;
  }

  if (error.includes('advance notice')) {
    return (
      <p>
        Need {availability.minLeadTime} hour(s) advance notice to book
      </p>
    );
  }

  if (error.includes('break time')) {
    return (
      <div>
        <p>This time is during a break:</p>
        {availability.breakTimes?.map((bt, i) => (
          <p key={i}>{bt.start} - {bt.end}</p>
        ))}
      </div>
    );
  }

  return <p>{error}</p>;
}
