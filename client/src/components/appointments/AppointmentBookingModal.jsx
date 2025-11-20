import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, CheckCircle2, Calendar as CalendarIcon, Clock, Video, Mail, Phone } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

const AppointmentBookingModal = ({
  isOpen,
  onClose,
  friends = [],
  currentUser,
  onSubmit,
}) => {
  const { theme } = useThemeStore();
  const [step, setStep] = useState(1);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [bookingDetails, setBookingDetails] = useState({
    firstName: currentUser?.fullName?.split(' ')[0] || '',
    lastName: currentUser?.fullName?.split(' ')[1] || '',
    email: currentUser?.email || '',
    phoneNumber: '',
    meetingType: 'Video Call',
    subject: '',
    notes: '',
  });

  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
  ];

  const handleReset = () => {
    setStep(1);
    setSelectedProfessional(null);
    setSelectedDate(new Date());
    setSelectedTime('');
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleBooking = () => {
    if (onSubmit) {
      const appointment = {
        friendId: selectedProfessional._id,
        startTime: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          parseInt(selectedTime.split(':')[0]),
          parseInt(selectedTime.split(':')[1])
        ),
        endTime: new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          parseInt(selectedTime.split(':')[0]) + 1,
          parseInt(selectedTime.split(':')[1])
        ),
        meetingType: bookingDetails.meetingType,
        title: bookingDetails.subject,
        description: bookingDetails.notes,
        bookedBy: bookingDetails,
      };
      onSubmit(appointment);
      handleClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" data-theme={theme}>
      <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-base-100 border-b border-base-300 sticky top-0 z-10">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => step > 1 ? setStep(step - 1) : handleClose()}
                className="p-2 hover:bg-base-200 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-base-content/70" />
              </button>
              <div>
                <h2 className="text-xl font-bold text-base-content">Book New Appointment</h2>
                <p className="text-sm text-base-content/60 mt-1">Step {step} of 3</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="text-base-content/40 hover:text-base-content/70 text-2xl"
            >
              ✕
            </button>
          </div>

          {/* Progress Bar */}
          <div className="px-6 pb-6">
            <div className="flex items-center justify-between gap-2">
              {[1, 2, 3].map((num) => (
                <div key={num} className="flex items-center gap-2 flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                      step >= num
                        ? 'bg-primary text-white'
                        : 'bg-base-300 text-base-content/40'
                    }`}
                  >
                    {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                  </div>
                  {num < 3 && (
                    <div className="flex-1 h-1 rounded-full transition-all" style={{
                      backgroundColor: step > num ? 'hsl(var(--p))' : 'hsl(var(--nc) / 0.2)'
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Select Professional */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-base-content mb-4">Select a Professional</h3>
              <div className="space-y-3">
                {(!Array.isArray(friends) || friends.length === 0) ? (
                  <div className="text-warning text-center py-4">No professionals found. Try adding friends who are learners!</div>
                ) : (
                  friends.map((friend, idx) => {
                    const keyVal = typeof friend._id === 'string' || typeof friend._id === 'number' ? friend._id : idx;
                    if (process.env.NODE_ENV !== 'production') {
                      if (!friend._id || (typeof keyVal !== 'string' && typeof keyVal !== 'number')) {
                        console.warn("Friend is missing unique _id (or it's not string/number):", friend);
                      }
                    }
                    return (
                      <div
                        key={keyVal}
                        onClick={() => setSelectedProfessional(friend)}
                        className={`flex items-center gap-4 p-4 border-2 rounded-lg cursor-pointer transition-all ${selectedProfessional?._id === friend._id ? 'border-primary bg-primary/10' : 'border-base-300 hover:border-primary/40'}`}
                      >
                        <div className="w-16 h-16 rounded-full overflow-hidden flex-shrink-0">
                          <img
                            src={friend.profilePic || '/default-profile.png'}
                            alt={friend.fullName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-base-content">{friend.fullName || 'Unknown Name'}</h4>
                          <p className="text-sm text-base-content/60 truncate">{friend.learningLanguage || 'Unknown'} Learner</p>
                          <p className="text-sm text-success mt-1">Available Today</p>
                        </div>
                        {selectedProfessional?._id === friend._id && (
                          <CheckCircle2 className="w-6 h-6 text-primary flex-shrink-0" />
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedProfessional}
                className="w-full py-3 btn btn-primary disabled:btn-disabled text-white font-semibold mt-6"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 2: Select Date & Time */}
          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Date Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-base-content">Select Date</h3>
                <div className="border border-base-300 rounded-lg p-4">
                  <input
                    type="date"
                    value={format(selectedDate, 'yyyy-MM-dd')}
                    onChange={(e) => setSelectedDate(new Date(e.target.value))}
                    className="w-full p-2 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary input input-bordered"
                  />
                  <div className="mt-4 p-3 bg-base-200 rounded-lg text-sm text-base-content/70">
                    <p className="font-semibold text-base-content mb-2">Calendar</p>
                    <p>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                  </div>
                </div>
              </div>

              {/* Time Slot Selection */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-base-content">Select Time Slot</h3>
                <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                  {(!Array.isArray(timeSlots) || timeSlots.length === 0) ? (
                    <div className="text-warning text-center col-span-3 py-4">No time slots available.</div>
                  ) : (
                    timeSlots.map((time, idx) => {
                      const timeVal = typeof time === 'string' ? time : (time.time || time.value || idx);
                      if (typeof time === 'object' && process.env.NODE_ENV !== 'production') {
                        if (!time.time && !time.value) {
                          console.warn("Time slot is object but missing .time/.value:", time);
                        }
                      }
                      return (
                        <button
                          key={timeVal}
                          onClick={() => setSelectedTime(typeof time === 'string' ? time : (time.time || ''))}
                          className={`py-2 px-3 rounded-lg font-medium transition text-sm ${selectedTime === (typeof time === 'string' ? time : (time.time || '')) ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}`}
                        >
                          {typeof time === 'string' ? time : (time.time || JSON.stringify(time))}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Step 2 Actions */}
          {step === 2 && (
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep(1)}
                className="flex-1 btn btn-outline"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!selectedTime}
                className="flex-1 btn btn-primary disabled:btn-disabled"
              >
                Continue
              </button>
            </div>
          )}

          {/* Step 3: Appointment Details */}
          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-base-content mb-4">Appointment Details</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">Appointment Type</label>
                  <select
                    value={bookingDetails.meetingType}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, meetingType: e.target.value })}
                    className="w-full p-3 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary select select-bordered"
                  >
                    <option>Video Call</option>
                    <option>Phone Call</option>
                    <option>In Person</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">Duration</label>
                  <select
                    value="30"
                    disabled
                    className="w-full p-3 border border-base-300 rounded-lg bg-base-200 cursor-not-allowed select select-bordered"
                  >
                    <option>30 minutes</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">Subject</label>
                  <input
                    type="text"
                    value={bookingDetails.subject}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, subject: e.target.value })}
                    placeholder="Enter appointment subject..."
                    className="w-full p-3 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary input input-bordered"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-base-content mb-2">Notes (Optional)</label>
                  <textarea
                    value={bookingDetails.notes}
                    onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
                    placeholder="Add any relevant notes or information..."
                    className="w-full p-3 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary textarea textarea-bordered resize-none"
                    rows="4"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 btn btn-outline"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(4)}
                  className="flex-1 btn btn-primary"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {step === 4 && (
            <div className="text-center space-y-6 py-6">
              <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>

              <div>
                <h3 className="text-xl font-bold text-base-content mb-2">Appointment Booked Successfully!</h3>
                <p className="text-base-content/60">
                  Your appointment has been scheduled and a confirmation has been sent to your email.
                </p>
              </div>

              {/* Confirmation Card */}
              <div className="bg-base-200 border border-base-300 rounded-lg p-6 text-left space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0">
                    <img
                      src={selectedProfessional?.profilePic || '/default-profile.png'}
                      alt={selectedProfessional?.fullName}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <p className="font-semibold text-base-content">{selectedProfessional?.fullName}</p>
                    <p className="text-sm text-base-content/60">{selectedProfessional?.learningLanguage} Learner</p>
                  </div>
                </div>

                <hr className="border-base-300 my-4" />

                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-base-content/70">
                    <CalendarIcon className="w-5 h-5 text-primary" />
                    <span>{format(selectedDate, 'EEEE, MMMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-base-content/70">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>{selectedTime} (30 minutes)</span>
                  </div>
                  <div className="flex items-center gap-3 text-base-content/70">
                    <Video className="w-5 h-5 text-primary" />
                    <span>{bookingDetails.meetingType}</span>
                  </div>
                  {bookingDetails.subject && (
                    <div className="flex items-start gap-3 text-base-content/70">
                      <span className="text-primary mt-1">📋</span>
                      <div>
                        <p className="text-sm font-semibold text-base-content">Subject</p>
                        <p className="text-sm">{bookingDetails.subject}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleClose}
                  className="flex-1 btn btn-outline"
                >
                  Close
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 btn btn-primary"
                >
                  Confirm & Save
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

AppointmentBookingModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  friends: PropTypes.array,
  currentUser: PropTypes.object,
  onSubmit: PropTypes.func,
};

export default AppointmentBookingModal;
