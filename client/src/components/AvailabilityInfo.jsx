import React from 'react';
import { AlertCircle, Coffee, Clock, CalendarX } from 'lucide-react';

const AvailabilityInfo = ({ availability = {}, availabilityStatus = 'available' }) => {
  if (!availability) return null;

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
    away: {
      icon: '✕',
      color: 'text-error',
      bgColor: 'bg-error/10',
      borderColor: 'border-error',
      label: 'Away',
    },
  };

  const config = statusConfig[availabilityStatus] || statusConfig.available;

  return (
    <div className={`p-3 rounded-lg border ${config.bgColor} ${config.borderColor} border-2`}>
      <div className="flex items-start gap-2 mb-2">
        <span className={`text-lg ${config.color}`}>{config.icon}</span>
        <p className={`font-semibold ${config.color}`}>{config.label}</p>
      </div>

      <div className="space-y-2 text-sm text-base-content/70">
        {/* Working Hours */}
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span>
            {availability.start || '09:00'} - {availability.end || '17:00'}
          </span>
        </div>

        {/* Break Times */}
        {availability.breakTimes && availability.breakTimes.length > 0 && (
          <div className="flex items-start gap-2">
            <Coffee className="w-4 h-4 mt-0.5" />
            <div>
              <p className="font-medium text-base-content mb-1">Break Times:</p>
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
            <CalendarX className="w-4 h-4" />
            <span>
              {availability.minLeadTime}h advance notice required
            </span>
          </div>
        )}

        {/* Cancel Notice */}
        {availability.cancelNotice > 0 && (
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>
              {availability.cancelNotice}h notice to cancel
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvailabilityInfo;
