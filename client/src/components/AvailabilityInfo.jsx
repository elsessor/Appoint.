import React from 'react';
import { AlertCircle, Coffee, Clock, CalendarX } from 'lucide-react';

const AvailabilityInfo = ({ availability = {}, availabilityStatus = 'available' }) => {
  if (availabilityStatus === 'away') {
    return (
      <div className="p-5 rounded-xl border-2 border-error/30 bg-gradient-to-r from-error/15 to-error/10 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">✕</span>
          <div>
            <p className="font-bold text-error text-lg">Currently Away</p>
            <p className="text-sm text-base-content/80 mt-1">
              This person is not accepting appointments at the moment. Please check back later.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!availability || Object.keys(availability).length === 0) return null;

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const statusConfig = {
    available: {
      icon: '✓',
      color: 'text-success',
      bgColor: 'bg-success/10',
      borderColor: 'border-success',
      label: 'Available',
    },
    limited: {
      icon: '⚠',
      color: 'text-warning',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning',
      label: 'Limited Availability',
    },
  };

  const config = statusConfig[availabilityStatus] || statusConfig.available;

  // Get available days list
  const availableDays = availability.days && availability.days.length > 0 
    ? availability.days.map(day => dayNames[day]).join(', ')
    : 'No days set';

  return (
    <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor} border-2`}>
      <div className="flex items-start gap-2 mb-3">
        <span className={`text-lg ${config.color}`}>{config.icon}</span>
        <p className={`font-semibold ${config.color}`}>{config.label}</p>
      </div>

      <div className="space-y-2 text-sm text-base-content/70">
        {/* Working Hours */}
        {(availability.start || availability.end) && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="font-medium">
              {availability.start || '09:00'} - {availability.end || '17:00'}
            </span>
          </div>
        )}

        {/* Available Days */}
        {availability.days && availability.days.length > 0 && (
          <div className="flex items-start gap-2">
            <span className="text-lg">📅</span>
            <div>
              <p className="font-medium text-base-content text-xs mb-1">Available Days:</p>
              <p className="text-xs leading-relaxed">{availableDays}</p>
            </div>
          </div>
        )}

        {/* Break Times */}
        {availability.breakTimes && availability.breakTimes.length > 0 && (
          <div className="flex items-start gap-2">
            <Coffee className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium text-base-content mb-1 text-xs">Break Times:</p>
              <div className="space-y-0.5">
                {availability.breakTimes.map((breakTime, idx) => (
                  <div key={idx} className="text-xs">
                    {breakTime.start} - {breakTime.end}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lead Time */}
        {availability.minLeadTime > 0 && (
          <div className="flex items-center gap-2">
            <CalendarX className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">
              {availability.minLeadTime}h advance notice required
            </span>
          </div>
        )}

        {/* Cancel Notice */}
        {availability.cancelNotice > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">
              {availability.cancelNotice}h notice to cancel
            </span>
          </div>
        )}

        {/* Appointment Duration */}
        {availability.appointmentDuration && (availability.appointmentDuration.min || availability.appointmentDuration.max) && (
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 flex-shrink-0" />
            <span className="text-xs">
              Duration: {availability.appointmentDuration.min || 15}m - {availability.appointmentDuration.max || 120}m
            </span>
          </div>
        )}

        {/* Max Appointments Per Day */}
        {(() => {
          let displayValue = availability.maxPerDay || 5;
          if (availabilityStatus === 'limited') {
            displayValue = availability.minPerDay || 1;
          }
          return (
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <span className="text-xs font-medium">
                {availabilityStatus === 'limited' ? 'Limited to ' : 'Max '}{displayValue} appointment{displayValue !== 1 ? 's' : ''} per day
              </span>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default AvailabilityInfo;
