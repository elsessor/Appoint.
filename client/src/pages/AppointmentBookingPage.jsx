import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, addHours, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, addMonths, subMonths, isSameMonth, isSameDay, getDay } from 'date-fns';
import { CheckCircle2, Calendar as CalendarIcon, Clock, Video, Mail, Phone, Loader2, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { useThemeStore } from '../store/useThemeStore';
import { createAppointment, getMyFriends } from '../lib/api';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import useAuthUser from '../hooks/useAuthUser';

const AppointmentBookingPage = () => {
  const queryClient = useQueryClient();
  const { theme } = useThemeStore();
  const [step, setStep] = useState(1);
  const [selectedProfessional, setSelectedProfessional] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const { isLoading: loadingUser, authUser: currentUser } = useAuthUser();
  
  // Fetch friends list
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: getMyFriends,
    onError: (error) => {
      toast.error('Failed to load professionals. Please try again.');
      console.error('Error fetching friends:', error);
    }
  });

  // Handle booking mutation
  const { mutate: bookAppointment, isLoading: isBooking } = useMutation({
    mutationFn: createAppointment,
    onSuccess: () => {
      toast.success('Appointment booked successfully!');
      queryClient.invalidateQueries(['appointments']);
      handleClose();
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to book appointment');
      console.error('Booking error:', error);
    }
  });

  const [bookingDetails, setBookingDetails] = useState({
    firstName: currentUser?.fullName?.split(' ')[0] || '',
    lastName: currentUser?.fullName?.split(' ')[1] || '',
    email: currentUser?.email || '',
    phoneNumber: currentUser?.phoneNumber || '',
    meetingType: 'Video Call',
    duration: 30, // Duration in minutes
    subject: '',
    notes: '',
  });

  // Generate time slots from 9 AM to 5 PM with 30-minute intervals
  const generateTimeSlots = () => {
    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip lunch time
      if (hour === 12) continue;
      
      // Add full hour slot
      const time12h = hour > 12 ? hour - 12 : hour;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      
      slots.push({
        time: `${time12h}:00 ${ampm}`,
        value: `${hour}:00`
      });
      
      // Add half hour slot
      if (hour < endHour - 1) {
        slots.push({
          time: `${time12h}:30 ${ampm}`,
          value: `${hour}:30`
        });
      }
    }
    
    return slots;
  };
  
  const timeSlots = generateTimeSlots();

  // Update calendar month when selected date changes
  useEffect(() => {
    if (selectedDate) {
      setCalendarMonth(selectedDate);
    }
  }, [selectedDate]);

  const handleReset = () => {
    setStep(1);
    setSelectedProfessional(null);
    setSelectedDate(new Date());
    setSelectedTime('');
    setCalendarMonth(new Date());
    setBookingDetails({
      firstName: currentUser?.fullName?.split(' ')[0] || '',
      lastName: currentUser?.fullName?.split(' ')[1] || '',
      email: currentUser?.email || '',
      phoneNumber: currentUser?.phoneNumber || '',
      meetingType: 'Video Call',
      duration: 30,
      subject: '',
      notes: '',
    });
  };

  // For a page, you may want to navigate away or show a message instead of closing
  const handleClose = () => {
    handleReset();
    // Optionally, navigate to another page here
  };

  const handleBooking = () => {
    if (!selectedProfessional || !selectedTime) {
      toast.error('Please select a professional and time slot');
      return;
    }
    if (!bookingDetails.subject || bookingDetails.subject.trim() === '') {
      toast.error('Please enter a subject for the appointment');
      return;
    }
    if (!currentUser || !currentUser._id) {
      toast.error('Could not find current user. Please log in again.');
      return;
    }

    const [hours, minutes] = selectedTime.split(':').map(Number);
    const startTime = new Date(selectedDate);
    startTime.setHours(hours, minutes, 0, 0);
    
    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + bookingDetails.duration);

    const appointment = {
      friendId: selectedProfessional._id,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      meetingType: bookingDetails.meetingType,
      title: bookingDetails.subject,
      description: bookingDetails.notes,
      bookedBy: {
        ...bookingDetails,
        userId: currentUser._id
      },
    };

    bookAppointment(appointment);
  };



  if (loadingFriends || loadingUser) {
    return <PageLoader />;
  }

  if (!currentUser || !currentUser._id) {
    return <div className="text-error text-center py-10">You must be logged in to book an appointment.</div>;
  }

  return (
    <div className="bg-base-100 min-h-screen" data-theme={theme}>
      <div className="max-w-5xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="p-2 hover:bg-base-200 rounded-lg transition"
            >
              <ArrowLeft className="w-5 h-5 text-base-content/70" />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-bold text-base-content">Book New Appointment</h2>
            <p className="text-sm text-base-content/60 mt-1">Step {step} of 3</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center gap-2">
            {[1, 2, 3].map((num) => (
              <React.Fragment key={num}>
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all flex-shrink-0 ${
                    step >= num
                      ? 'bg-primary text-white'
                      : 'bg-base-300 text-base-content/40'
                  }`}
                >
                  {step > num ? <CheckCircle2 className="w-5 h-5" /> : num}
                </div>
                {num < 3 && (
                  <div 
                    className="flex-1 h-1 rounded-full transition-all" 
                    style={{
                      backgroundColor: step > num ? 'hsl(var(--p))' : 'hsl(var(--nc) / 0.2)'
                    }} 
                  />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Content */}
        {/* Step 1: Select Professional */}
        {step === 1 && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-base-content mb-4">Select a Professional</h3>
            {(!Array.isArray(friends) || friends.length === 0) ? (
              <div className="text-warning text-center py-4">No professionals found. Try adding friends who are learners!</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {friends.map((friend, idx) => {
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
                      className={`card bg-base-200 hover:shadow-lg transition-all duration-300 cursor-pointer border-2 ${
                        selectedProfessional?._id === friend._id 
                          ? 'border-primary bg-primary/10' 
                          : 'border-transparent hover:border-primary/40'
                      }`}
                    >
                      <div className="card-body p-4">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="avatar size-14 rounded-full flex-shrink-0">
                            <img 
                              src={friend.profilePic || '/default-profile.png'} 
                              alt={friend.fullName}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-base truncate">{friend.fullName || 'Unknown Name'}</h3>
                            <p className="text-sm text-base-content/60 truncate">{friend.learningLanguage || 'Unknown'} Learner</p>
                          </div>
                          {selectedProfessional?._id === friend._id && (
                            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-success mt-1">Available Today</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="mt-6">
              <button
                onClick={() => setStep(2)}
                disabled={!selectedProfessional}
                className="w-full sm:w-auto px-6 py-2.5 btn btn-primary disabled:btn-disabled text-white font-semibold"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Date Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-base-content mb-3">Select Date</h3>
              <div className="border border-base-300 rounded-lg p-4 bg-base-100 w-fit">
                {/* Calendar Widget */}
                <div>
                  {/* Month Navigation */}
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => setCalendarMonth(subMonths(calendarMonth, 1))}
                      className="p-1 hover:bg-base-200 rounded transition"
                    >
                      <ChevronLeft className="w-5 h-5 text-base-content/70" />
                    </button>
                    <h4 className="text-base font-semibold text-base-content">
                      {format(calendarMonth, 'MMMM yyyy')}
                    </h4>
                    <button
                      onClick={() => setCalendarMonth(addMonths(calendarMonth, 1))}
                      className="p-1 hover:bg-base-200 rounded transition"
                    >
                      <ChevronRight className="w-5 h-5 text-base-content/70" />
                    </button>
                  </div>

                  {/* Calendar Grid */}
                  <div className="grid grid-cols-7 gap-1">
                    {/* Day Headers */}
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
                      <div key={day} className="text-center text-xs font-medium text-base-content/60 py-1.5">
                        {day}
                      </div>
                    ))}

                    {/* Calendar Days */}
                    {(() => {
                      const monthStart = startOfMonth(calendarMonth);
                      const monthEnd = endOfMonth(calendarMonth);
                      const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
                      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
                      const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

                      return days.map((day, dayIdx) => {
                        const isCurrentMonth = isSameMonth(day, calendarMonth);
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, new Date());

                        return (
                          <button
                            key={dayIdx}
                            onClick={() => {
                              setSelectedDate(day);
                              if (!isSameMonth(day, calendarMonth)) {
                                setCalendarMonth(day);
                              }
                            }}
                            className={`
                              w-9 h-9 text-sm rounded transition-all flex items-center justify-center
                              ${!isCurrentMonth ? 'text-base-content/30' : 'text-base-content'}
                              ${isSelected 
                                ? 'bg-primary text-white font-semibold' 
                                : isToday
                                ? 'bg-base-200 font-semibold hover:bg-base-300'
                                : 'hover:bg-base-200'
                              }
                            `}
                          >
                            {format(day, 'd')}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Time Slot Selection */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-base-content mb-3">Select Time Slot</h3>
              <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto pr-2">
                {(!Array.isArray(timeSlots) || timeSlots.length === 0) ? (
                  <div className="text-warning text-center col-span-3 py-4">No time slots available.</div>
                ) : (
                  timeSlots.map((slot, idx) => {
                    let timeVal = '';
                    let displayVal = '';
                    if (typeof slot === 'string') {
                      timeVal = slot;
                      displayVal = slot;
                    } else if (typeof slot === 'object') {
                      timeVal = slot.value || slot.time || idx;
                      displayVal = slot.time || slot.value || JSON.stringify(slot);
                      if (!slot.value && !slot.time && process.env.NODE_ENV !== 'production') {
                        console.warn("Time slot object missing .time/.value:", slot);
                      }
                    } else {
                      displayVal = timeVal = idx;
                      if (process.env.NODE_ENV !== 'production') {
                        console.warn('Unexpected slot type:', slot);
                      }
                    }
                    return (
                      <button
                        key={timeVal}
                        onClick={() => setSelectedTime(timeVal)}
                        className={`py-2 px-2 rounded-lg font-medium transition text-xs ${selectedTime === timeVal ? 'btn btn-primary btn-sm' : 'btn btn-outline btn-sm'}`}
                      >
                        {displayVal}
                      </button>
                    );
                  })
                )}
              </div>
              {/* Continue Button */}
              <button
                onClick={() => setStep(3)}
                disabled={!selectedTime}
                className="w-full py-2.5 btn btn-primary disabled:btn-disabled text-white font-semibold mt-4"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Appointment Details */}
        {step === 3 && (
          <div className="space-y-5">
            <h3 className="text-lg font-semibold text-base-content mb-4">Appointment Details</h3>

            <div className="space-y-4 max-w-2xl">
              <div>
                <label className="block text-sm font-semibold text-base-content mb-2">Appointment Type</label>
                <select
                  value={bookingDetails.meetingType}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, meetingType: e.target.value })}
                  className="w-full p-2.5 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary select select-bordered"
                >
                  <option>Video Call</option>
                  <option>Phone Call</option>
                  <option>In Person</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-base-content mb-2">Duration</label>
                <select
                  value={bookingDetails.duration}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, duration: parseInt(e.target.value) })}
                  className="w-full p-2.5 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary select select-bordered"
                >
                  <option value={15}>15 minutes</option>
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={90}>1.5 hours</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-base-content mb-2">
                  Subject <span className="text-error">*</span>
                </label>
                <input
                  type="text"
                  value={bookingDetails.subject}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, subject: e.target.value })}
                  placeholder="Enter appointment subject..."
                  required
                  className="w-full p-2.5 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary input input-bordered"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-base-content mb-2">Notes (Optional)</label>
                <textarea
                  value={bookingDetails.notes}
                  onChange={(e) => setBookingDetails({ ...bookingDetails, notes: e.target.value })}
                  placeholder="Add any relevant notes or information..."
                  className="w-full p-2.5 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary textarea textarea-bordered resize-none"
                  rows="4"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6 max-w-2xl">
              <button
                onClick={() => setStep(2)}
                className="flex-1 btn btn-outline py-2.5"
              >
                Back
              </button>
              <button
                onClick={() => {
                  if (!bookingDetails.subject || bookingDetails.subject.trim() === '') {
                    toast.error('Please enter a subject for the appointment');
                    return;
                  }
                  setStep(4);
                }}
                className="flex-1 btn btn-primary py-2.5"
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
                    <span>{selectedTime} ({bookingDetails.duration === 60 ? '1 hour' : bookingDetails.duration > 60 ? `${bookingDetails.duration / 60} hours` : `${bookingDetails.duration} minutes`})</span>
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
                  className="btn btn-primary w-full mt-6"
                  disabled={!selectedTime || isBooking}
                >
                  {isBooking ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    'Book Appointment'
                  )}
                </button>
              </div>
            </div>
          )}
      </div>
    </div>
  );
};

AppointmentBookingPage.propTypes = {
  currentUser: PropTypes.object,
};

export default AppointmentBookingPage;
