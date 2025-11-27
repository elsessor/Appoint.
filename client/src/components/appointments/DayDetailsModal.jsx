import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { format, parseISO, isToday, isBefore } from 'date-fns';
import { Clock, User, MessageSquare, Calendar, X } from 'lucide-react';
import AppointmentModal from './AppointmentModal';

const DayDetailsModal = ({
  date,
  appointments = [],
  onClose,
  onCreateAppointment,
  isHoliday,
  currentUser,
  friends = [],
  availability = {},
  onAppointmentSubmit,
  friendsAvailability = {},
  viewingFriendId = null,
}) => {
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);

  const formatTime = (timeString) => {
    if (!timeString) return '';
    try {
      return format(parseISO(timeString), 'h:mm a');
    } catch (e) {
      return timeString;
    }
  };

  const formatDuration = (start, end) => {
    if (!start || !end) return '';
    try {
      const startDate = typeof start === 'string' ? parseISO(start) : start;
      const endDate = typeof end === 'string' ? parseISO(end) : end;
      const diffInMinutes = Math.round((endDate - startDate) / (1000 * 60));
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes} min`;
      }
      
      const hours = Math.floor(diffInMinutes / 60);
      const minutes = diffInMinutes % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    } catch (e) {
      return '';
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      scheduled: { bg: 'bg-blue-900 text-blue-200', label: 'Scheduled' },
      confirmed: { bg: 'bg-green-900 text-green-200', label: 'Confirmed' },
      cancelled: { bg: 'bg-red-900 text-red-200', label: 'Cancelled' },
      completed: { bg: 'bg-gray-700 text-gray-200', label: 'Completed' },
    };
    
    const config = statusConfig[status?.toLowerCase()] || { bg: 'bg-gray-700 text-gray-200', label: status || 'Scheduled' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}>
        {config.label}
      </span>
    );
  };

  const handleCreateAppointment = () => {
    setShowAppointmentModal(true);
  };

  const handleAppointmentModalClose = () => {
    setShowAppointmentModal(false);
  };

  const handleAppointmentSubmit = (formData) => {
    // Call the same handler as in Calendar/AppointmentBookingPage
    if (onCreateAppointment) {
      onCreateAppointment(formData);
    }
    
    // Close the appointment modal after submission
    setShowAppointmentModal(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-black opacity-75" onClick={onClose}></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">
          &#8203;
        </span>

        <div className="inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg leading-6 font-medium text-gray-100">
                  {format(date, 'EEEE, MMMM d, yyyy')}
                </h3>
                {isHoliday && (
                  <p className="mt-1 text-sm text-yellow-400">{isHoliday}</p>
                )}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-300 focus:outline-none"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="mt-6 text-center py-8 bg-gray-900 rounded-lg">
                <Calendar className="mx-auto h-12 w-12 text-gray-500" />
                <h3 className="mt-2 text-sm font-medium text-gray-200">No appointments</h3>
                <p className="mt-1 text-sm text-gray-400">
                  You don't have any appointments scheduled for this day.
                </p>
                <div className="mt-6">
                  <button
                    type="button"
                    onClick={handleCreateAppointment}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Schedule Appointment
                  </button>
                </div>
              </div>
            ) : (
              <div className="mt-6 flow-root">
                <ul className="-my-5 divide-y divide-gray-700">
                  {appointments.map((appointment) => (
                    <li key={appointment._id || appointment.id} className="py-4">
                      <div className="flex items-center space-x-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <p className="text-sm font-medium text-gray-200 truncate">
                              {appointment.title}
                            </p>
                            {getStatusBadge(appointment.status)}
                          </div>
                          <div className="mt-1 flex flex-col sm:flex-row sm:flex-wrap sm:mt-0 sm:space-x-6">
                            <div className="mt-2 flex items-center text-sm text-gray-400">
                              <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                              {formatTime(appointment.startTime)}
                              {appointment.endTime && (
                                <>
                                  <span className="mx-1">-</span>
                                  {formatTime(appointment.endTime)}
                                  <span className="text-gray-500 mx-1">•</span>
                                  <span>{formatDuration(appointment.startTime, appointment.endTime)}</span>
                                </>
                              )}
                            </div>
                            {appointment.participant && (
                              <div className="mt-2 flex items-center text-sm text-gray-400">
                                <User className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500" />
                                {appointment.participant.name || appointment.participant.email}
                              </div>
                            )}
                          </div>
                          {appointment.message && (
                            <div className="mt-2 flex items-start text-sm text-gray-400">
                              <MessageSquare className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-500 mt-0.5" />
                              <p className="whitespace-pre-line">{appointment.message}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          
          {appointments.length > 0 && (
            <div className="bg-gray-900 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={handleCreateAppointment}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
              >
                New Appointment
              </button>
              <button
                type="button"
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-600 shadow-sm px-4 py-2 bg-gray-800 text-base font-medium text-gray-200 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={handleAppointmentModalClose}
        onSubmit={handleAppointmentSubmit}
        initialDate={date}
        initialTime={undefined}
        initialFriendId={viewingFriendId}
        friends={friends}
        currentUser={currentUser}
        availability={availability}
        friendsAvailability={friendsAvailability}
        currentUserStatus={currentUser?.availabilityStatus || 'available'}
      />
    </div>
  );
};

DayDetailsModal.propTypes = {
  date: PropTypes.instanceOf(Date).isRequired,
  appointments: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      id: PropTypes.string,
      title: PropTypes.string.isRequired,
      startTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      endTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
      status: PropTypes.string,
      message: PropTypes.string,
      participant: PropTypes.shape({
        _id: PropTypes.string,
        name: PropTypes.string,
        email: PropTypes.string,
      }),
    })
  ),
  onClose: PropTypes.func.isRequired,
  onCreateAppointment: PropTypes.func,
  onAppointmentSubmit: PropTypes.func,
  isHoliday: PropTypes.string,
  currentUser: PropTypes.shape({
    _id: PropTypes.string,
    name: PropTypes.string,
    email: PropTypes.string,
    availabilityStatus: PropTypes.string,
  }),
  friends: PropTypes.arrayOf(PropTypes.object),
  availability: PropTypes.object,
  friendsAvailability: PropTypes.object,
  viewingFriendId: PropTypes.string,
};

export default DayDetailsModal;