import React, { useState, useEffect } from 'react';
import { Phone, X, Clock } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useThemeStore } from '../store/useThemeStore';

const AppointmentDueModal = ({ appointment, isOpen, onJoin, onDecline, otherUserName = 'Your Friend' }) => {
  const { theme } = useThemeStore();
  const [timeRemaining, setTimeRemaining] = useState('00:00');

  useEffect(() => {
    if (!isOpen || !appointment) return;

    const interval = setInterval(() => {
      const now = new Date();
      const apptTime = new Date(appointment.startTime);
      const diff = apptTime - now;

      if (diff <= 0) {
        setTimeRemaining('00:00');
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, appointment]);

  if (!isOpen || !appointment) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-theme={theme}>
      <div className="bg-base-100 rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden border border-primary/20">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/20 to-secondary/20 px-6 py-6 border-b border-primary/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-primary/20 p-3 rounded-lg">
                <Phone className="w-6 h-6 text-primary animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-base-content">Appointment Due</h2>
                <p className="text-sm text-base-content/60">It's time for your call</p>
              </div>
            </div>
            <button
              onClick={onDecline}
              className="btn btn-ghost btn-sm btn-circle"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-4">
          {/* Appointment Details */}
          <div className="space-y-3">
            <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-base-content">Title</p>
              <p className="text-base text-base-content/80">{appointment.title || 'Untitled Appointment'}</p>
            </div>

            {appointment.description && (
              <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-base-content">Description</p>
                <p className="text-sm text-base-content/70">{appointment.description}</p>
              </div>
            )}

            {/* With */}
            <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
              <p className="text-sm font-semibold text-base-content">With</p>
              <p className="text-base text-base-content/80">{otherUserName}</p>
            </div>

            {/* Time Info */}
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium text-base-content">Starting in</span>
                </div>
                <span className="text-lg font-bold text-primary font-mono">{timeRemaining}</span>
              </div>
            </div>

            {/* Meeting Type */}
            {appointment.meetingType && (
              <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-base-content">Meeting Type</p>
                <p className="text-base text-base-content/80">{appointment.meetingType}</p>
              </div>
            )}

            {/* Location */}
            {appointment.location && (
              <div className="bg-base-200/50 rounded-lg p-4 space-y-2">
                <p className="text-sm font-semibold text-base-content">Location</p>
                <p className="text-base text-base-content/80">{appointment.location}</p>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-6 bg-base-200/30 border-t border-base-300/50 flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 btn btn-outline btn-sm gap-2"
          >
            <X className="w-4 h-4" />
            Decline Call
          </button>
          <button
            onClick={onJoin}
            className="flex-1 btn btn-primary btn-sm gap-2"
          >
            <Phone className="w-4 h-4" />
            Join Meeting
          </button>
        </div>
      </div>
    </div>
  );
};

export default AppointmentDueModal;
