import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, AlertCircle, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
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
        minPerDay: 1,
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
      icon: CheckCircle,
      color: 'success',
      label: 'Available',
      tooltip: 'Friends can book appointments',
      description: 'Friends can book appointments with you',
    },
    limited: {
      icon: AlertTriangle,
      color: 'warning',
      label: 'Limited',
      tooltip: 'Show limited availability',
      description: 'Show limited availability',
    },
    away: {
      icon: XCircle,
      color: 'error',
      label: 'Away',
      tooltip: 'Not accepting bookings',
      description: 'Not accepting bookings',
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
        <config.icon className="w-4 h-4" />
        <span className="hidden sm:inline text-xs">{config.label}</span>
      </button>

      {isDropdownOpen && (
        <ul
          className="absolute bottom-full right-0 mb-2 z-50 menu p-2 shadow bg-base-100 rounded-lg w-56 border border-base-300"
        >
        {Object.entries(statusConfig).map(([status, { icon: IconComponent, color, label, tooltip, description }]) => (
          <li key={status}>
            <a
              onClick={() => handleStatusChange(status)}
              className={`flex items-start gap-3 py-2.5 px-3 text-sm rounded-md transition-all ${
                currentStatus === status ? `bg-${color}/10 border-l-4 border-${color}` : 'hover:bg-base-200'
              } ${updateStatusMutation.isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={updateStatusMutation.isPending}
            >
              <IconComponent className={`w-5 h-5 flex-shrink-0 mt-0.5 text-${color}`} />
              <div className="flex-1">
                <div className="font-semibold text-sm text-base-content">{label}</div>
                <div className="text-xs text-base-content/60 mt-0.5">{description}</div>
              </div>
              {currentStatus === status && (
                <span className={`badge badge-${color} badge-sm text-white`}>Active</span>
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
