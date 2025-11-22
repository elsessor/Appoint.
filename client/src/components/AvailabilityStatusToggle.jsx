import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

const AvailabilityStatusToggle = ({ currentUser, onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  // Get current status
  const { data: statusData } = useQuery({
    queryKey: ['availabilityStatus', currentUser?._id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/appointments/availability/${currentUser._id}`);
      return res.data;
    },
    enabled: !!currentUser?._id,
  });

  const currentStatus = statusData?.availabilityStatus || 'available';

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      const res = await axiosInstance.post('/appointments/availability', {
        availabilityStatus: newStatus,
        // Keep existing availability data
        days: statusData?.availability?.days || [1, 2, 3, 4, 5],
        start: statusData?.availability?.start || '09:00',
        end: statusData?.availability?.end || '17:00',
        slotDuration: statusData?.availability?.slotDuration || 30,
        buffer: statusData?.availability?.buffer || 15,
        maxPerDay: statusData?.availability?.maxPerDay || 5,
        breakTimes: statusData?.availability?.breakTimes || [],
        minLeadTime: statusData?.availability?.minLeadTime || 0,
        cancelNotice: statusData?.availability?.cancelNotice || 0,
        appointmentDuration: statusData?.availability?.appointmentDuration || {
          min: 15,
          max: 120,
        },
      });
      return res.data;
    },
    onSuccess: (data) => {
      const newStatus = data.availabilityStatus;
      const messages = {
        available: 'You are now available for bookings',
        limited: 'You have limited availability',
        away: 'You are away and not accepting bookings',
      };
      toast.success(messages[newStatus] || 'Status updated');
      // Invalidate related queries to refetch data
      queryClient.invalidateQueries({ queryKey: ['availabilityStatus'] });
      queryClient.invalidateQueries({ queryKey: ['userAvailability'] });
      queryClient.invalidateQueries({ queryKey: ['authUser'] });
      if (onStatusChange) {
        onStatusChange(newStatus);
      }
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update status');
    },
  });

  const handleStatusChange = (newStatus) => {
    if (newStatus !== currentStatus) {
      updateStatusMutation.mutate(newStatus);
    }
  };

  const statusConfig = {
    available: {
      icon: '✓',
      color: 'success',
      label: 'Available',
      tooltip: 'Friends can book appointments',
    },
    limited: {
      icon: '⚠',
      color: 'warning',
      label: 'Limited',
      tooltip: 'Show limited availability',
    },
    away: {
      icon: '✕',
      color: 'error',
      label: 'Away',
      tooltip: 'Not accepting bookings',
    },
  };

  const config = statusConfig[currentStatus];

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        className={`btn btn-sm gap-2 btn-outline btn-${config.color}`}
        title={config.tooltip}
      >
        <span className="text-lg">{config.icon}</span>
        <span className="hidden sm:inline">{config.label}</span>
      </button>

      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 border border-base-300"
      >
        {Object.entries(statusConfig).map(([status, { icon, color, label, tooltip }]) => (
          <li key={status}>
            <a
              onClick={() => handleStatusChange(status)}
              className={`flex items-center gap-2 ${
                currentStatus === status ? `text-${color}` : ''
              } ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={updateStatusMutation.isPending}
            >
              <span className="text-lg">{icon}</span>
              <div className="flex-1">
                <div className="font-medium">{label}</div>
                <div className="text-xs opacity-70">{tooltip}</div>
              </div>
              {currentStatus === status && (
                <span className="badge badge-primary">Active</span>
              )}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AvailabilityStatusToggle;
