import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

const AvailabilityStatusToggle = ({ currentUser, onStatusChange }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const queryClient = useQueryClient();

  // Get current status
  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ['availabilityStatus', currentUser?._id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/appointments/availability/${currentUser._id}`);
      return res.data;
    },
    enabled: !!currentUser?._id,
  });

  const currentStatus = statusData?.availabilityStatus || 'available';

  // Debug logging
  useEffect(() => {
    console.log('🔍 Current Status Data:', statusData);
    console.log('🔍 Current Status:', currentStatus);
  }, [statusData, currentStatus]);

  // Update status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus) => {
      // Get the current availability data structure
      const availabilityData = statusData?.availability || {
        days: [1, 2, 3, 4, 5],
        start: '09:00',
        end: '17:00',
        slotDuration: 30,
        buffer: 15,
        maxPerDay: 5,
        breakTimes: [],
        minLeadTime: 0,
        cancelNotice: 0,
        appointmentDuration: {
          min: 15,
          max: 120,
        },
      };

      const res = await axiosInstance.post('/appointments/availability', {
        availabilityStatus: newStatus,
        // Spread the availability data to keep all settings
        ...availabilityData,
      });
      console.log('✅ Status update response:', res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log('✅ Mutation success, received data:', data);
      const newStatus = data.availabilityStatus;
      const messages = {
        available: 'You are now available for bookings',
        limited: 'You have limited availability',
        away: 'You are away and not accepting bookings',
      };
      toast.success(messages[newStatus] || 'Status updated');
      
      // IMPORTANT: Update the cache immediately with the full response data
      // This prevents the old data from flashing before refetch completes
      queryClient.setQueryData(['availabilityStatus', currentUser?._id], {
        availability: data.availability,
        availabilityStatus: data.availabilityStatus,
      });
      
      // Then invalidate to ensure we have the latest from server
      queryClient.invalidateQueries({ queryKey: ['availabilityStatus', currentUser?._id] });
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
    console.log('🔄 Changing status from', currentStatus, 'to', newStatus);
    if (newStatus !== currentStatus) {
      updateStatusMutation.mutate(newStatus);
      setIsDropdownOpen(false);
    } else {
      console.log('⚠️ Status is already', newStatus);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // Get the proper button classes based on status
  const getButtonClasses = () => {
    const baseClasses = 'btn btn-xs gap-1 btn-outline';
    switch (currentStatus) {
      case 'available':
        return `${baseClasses} btn-success`;
      case 'limited':
        return `${baseClasses} btn-warning`;
      case 'away':
        return `${baseClasses} btn-error`;
      default:
        return `${baseClasses} btn-success`;
    }
  };

  // Get text color classes for dropdown items
  const getTextColorClass = (status) => {
    switch (status) {
      case 'available':
        return 'text-success';
      case 'limited':
        return 'text-warning';
      case 'away':
        return 'text-error';
      default:
        return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className={getButtonClasses()}
        title={config.tooltip}
      >
        <span className="text-sm">{config.icon}</span>
        <span className="hidden sm:inline text-xs">{config.label}</span>
      </button>

      {isDropdownOpen && (
        <ul
          className="absolute bottom-full right-0 mb-2 z-50 menu p-1.5 shadow bg-base-100 rounded-box w-48 border border-base-300"
        >
        {Object.entries(statusConfig).map(([status, { icon, color, label, tooltip }]) => (
          <li key={status}>
            <a
              onClick={() => handleStatusChange(status)}
              className={`flex items-center gap-2 py-1.5 px-2 text-sm ${
                currentStatus === status ? getTextColorClass(status) : ''
              } ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={updateStatusMutation.isPending}
            >
              <span className="text-base">{icon}</span>
              <div className="flex-1">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs opacity-70">{tooltip}</div>
              </div>
              {currentStatus === status && (
                <span className="badge badge-primary badge-xs">Active</span>
              )}
            </a>
          </li>
        ))}
      </ul>
      )}
    </div>
  );
};

export default AvailabilityStatusToggle;
