import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Clock, Save, X, Plus, Trash2, AlertCircle, Coffee } from 'lucide-react';
import toast from 'react-hot-toast';
import { axiosInstance } from '../lib/axios';

const AvailabilitySettings = ({ isOpen, onClose, currentUser }) => {
  const queryClient = useQueryClient();
  const [availability, setAvailability] = useState({
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
  });

  const [availabilityStatus, setAvailabilityStatus] = useState('available');
  const [customSlots, setCustomSlots] = useState([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddBreak, setShowAddBreak] = useState(false);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '', available: true });
  const [newBreak, setNewBreak] = useState({ start: '12:00', end: '13:00' });

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  // Fetch current availability
  const { data: currentAvailability, isLoading, refetch } = useQuery({
    queryKey: ['userAvailability', currentUser?._id],
    queryFn: async () => {
      console.log('🔄 Fetching availability for user:', currentUser._id);
      const res = await axiosInstance.get(`/appointments/availability/${currentUser._id}`);
      console.log('📥 Server returned:', {
        days: res.data.availability.days,
        start: res.data.availability.start,
        end: res.data.availability.end,
      });
      return res.data;
    },
    enabled: !!currentUser?._id,
    staleTime: 0,
    gcTime: 1000 * 60 * 10,
  });

  // Update state when fetched data changes
  useEffect(() => {
    if (currentAvailability?.availability) {
      console.log('✅ Updating state with fetched data:', currentAvailability.availability);
      setAvailability({
        days: currentAvailability.availability.days || [1, 2, 3, 4, 5],
        start: currentAvailability.availability.start || '09:00',
        end: currentAvailability.availability.end || '17:00',
        slotDuration: currentAvailability.availability.slotDuration || 30,
        buffer: currentAvailability.availability.buffer || 15,
        maxPerDay: currentAvailability.availability.maxPerDay || 5,
        breakTimes: currentAvailability.availability.breakTimes || [],
        minLeadTime: currentAvailability.availability.minLeadTime || 0,
        cancelNotice: currentAvailability.availability.cancelNotice || 0,
        appointmentDuration: currentAvailability.availability.appointmentDuration || {
          min: 15,
          max: 120,
        },
      });
      if (currentAvailability.availabilityStatus) {
        setAvailabilityStatus(currentAvailability.availabilityStatus);
      }
    }
  }, [currentAvailability]);

  // Refetch when modal opens
  useEffect(() => {
    if (isOpen && currentUser?._id) {
      console.log('🎯 Modal opened, fetching latest availability...');
      refetch();
    }
  }, [isOpen, currentUser?._id, refetch]);

  // Save availability mutation
  const saveAvailabilityMutation = useMutation({
    mutationFn: async (availabilityData) => {
      console.log('📤 Sending to server:', {
        days: availabilityData.days,
        start: availabilityData.start,
        end: availabilityData.end,
        status: availabilityStatus,
      });
      const res = await axiosInstance.post('/appointments/availability', {
        ...availabilityData,
        availabilityStatus,
      });
      console.log('📥 Server response:', res.data);
      return res.data;
    },
    onSuccess: (data) => {
      console.log('✅ Save successful, server returned:', {
        days: data.availability.days,
        start: data.availability.start,
      });
      
      // Update React Query cache with the server response
      queryClient.setQueryData(['userAvailability', currentUser._id], {
        availability: data.availability,
        availabilityStatus: data.availabilityStatus,
      });
      
      toast.success('Availability saved successfully!');
      
      // Close modal after a short delay
      setTimeout(() => {
        console.log('✋ Closing modal');
        onClose();
      }, 500);
    },
    onError: (error) => {
      console.error('❌ Save failed:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
      });
      toast.error(error.response?.data?.message || 'Failed to save availability');
    },
  });

  const handleDayToggle = (dayIndex) => {
    setAvailability(prev => ({
      ...prev,
      days: prev.days.includes(dayIndex)
        ? prev.days.filter(d => d !== dayIndex)
        : [...prev.days, dayIndex].sort(),
    }));
  };

  const handleAddBreak = () => {
    if (!newBreak.start || !newBreak.end) {
      toast.error('Please fill in break time details');
      return;
    }

    const [startHour, startMin] = newBreak.start.split(':').map(Number);
    const [endHour, endMin] = newBreak.end.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (startMinutes >= endMinutes) {
      toast.error('End time must be after start time');
      return;
    }

    setAvailability(prev => ({
      ...prev,
      breakTimes: [
        ...prev.breakTimes,
        {
          start: newBreak.start,
          end: newBreak.end,
        },
      ],
    }));

    setNewBreak({ start: '12:00', end: '13:00' });
    setShowAddBreak(false);
    toast.success('Break time added');
  };

  const handleRemoveBreak = (index) => {
    setAvailability(prev => ({
      ...prev,
      breakTimes: prev.breakTimes.filter((_, i) => i !== index),
    }));
  };

  const handleAddSlot = () => {
    if (!newSlot.date || !newSlot.startTime || !newSlot.endTime) {
      toast.error('Please fill in all slot details');
      return;
    }

    const startTime = new Date(`${newSlot.date}T${newSlot.startTime}`);
    const endTime = new Date(`${newSlot.date}T${newSlot.endTime}`);

    if (startTime >= endTime) {
      toast.error('End time must be after start time');
      return;
    }

    setCustomSlots(prev => [...prev, {
      id: Date.now(),
      date: newSlot.date,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      available: newSlot.available,
    }]);

    setNewSlot({ date: '', startTime: '', endTime: '', available: true });
    setShowAddSlot(false);
    toast.success('Slot added');
  };

  const handleRemoveSlot = (slotId) => {
    setCustomSlots(prev => prev.filter(slot => slot.id !== slotId));
  };

  const handleSave = () => {
    saveAvailabilityMutation.mutate(availability);
  };

  if (!isOpen) return null;

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-base-100 rounded-lg p-6 w-full max-w-2xl mx-4">
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-base-100 rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-base-200 border-b border-base-300 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-xl font-bold text-base-content">Availability Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm btn-circle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Availability Status Quick Toggle */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-base-content">Availability Status</h3>
            <div className="grid grid-cols-3 gap-3">
              {[
                { status: 'available', label: 'Available', icon: '✓', color: 'success' },
                { status: 'limited', label: 'Limited', icon: '⚠', color: 'warning' },
                { status: 'away', label: 'Away', icon: '✕', color: 'error' },
              ].map(({ status, label, icon, color }) => (
                <button
                  key={status}
                  onClick={() => setAvailabilityStatus(status)}
                  className={`btn btn-outline gap-2 transition-all ${
                    availabilityStatus === status
                      ? `btn-${color} border-${color} btn-active`
                      : 'btn-ghost'
                  }`}
                >
                  <span className="text-lg">{icon}</span>
                  {label}
                </button>
              ))}
            </div>
            <p className="text-sm text-base-content/70">
              {availabilityStatus === 'available' && 'Friends can book appointments with you'}
              {availabilityStatus === 'limited' && 'Limited availability - show as partially available'}
              {availabilityStatus === 'away' && 'Friends cannot book appointments while away'}
            </p>
          </div>

          {/* Working Hours Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-base-content">Working Hours</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Start Time</span>
                </label>
                <input
                  type="time"
                  value={availability.start}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    start: e.target.value,
                  }))}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">End Time</span>
                </label>
                <input
                  type="time"
                  value={availability.end}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    end: e.target.value,
                  }))}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>

          {/* Available Days Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-base-content">Available Days</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {dayNames.map((day, index) => (
                <label
                  key={index}
                  className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                    availability.days.includes(index)
                      ? 'border-primary bg-primary/10'
                      : 'border-base-300 bg-base-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={availability.days.includes(index)}
                    onChange={() => handleDayToggle(index)}
                    className="checkbox accent-primary"
                  />
                  <span className="text-sm font-medium">{day}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Break Times Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coffee className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-base-content">Break Times</h3>
              </div>
              <button
                onClick={() => setShowAddBreak(!showAddBreak)}
                className="btn btn-sm btn-outline gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Break
              </button>
            </div>

            {/* Add Break Form */}
            {showAddBreak && (
              <div className="bg-base-200 p-4 rounded-lg space-y-3 border-2 border-base-300">
                <p className="text-sm text-base-content/70">Set daily recurring break times (e.g., lunch hour)</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-sm">Start Time</span>
                    </label>
                    <input
                      type="time"
                      value={newBreak.start}
                      onChange={(e) => setNewBreak(prev => ({ ...prev, start: e.target.value }))}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-sm">End Time</span>
                    </label>
                    <input
                      type="time"
                      value={newBreak.end}
                      onChange={(e) => setNewBreak(prev => ({ ...prev, end: e.target.value }))}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddBreak}
                    className="btn btn-sm btn-primary"
                  >
                    Add
                  </button>
                  <button
                    onClick={() => setShowAddBreak(false)}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Break Times List */}
            {availability.breakTimes.length > 0 && (
              <div className="space-y-2">
                {availability.breakTimes.map((breakTime, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-warning/10 rounded-lg border border-warning"
                  >
                    <div className="text-sm">
                      <p className="font-medium text-base-content">Daily Break</p>
                      <p className="text-base-content/70">{breakTime.start} - {breakTime.end}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveBreak(index)}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {availability.breakTimes.length === 0 && !showAddBreak && (
              <p className="text-sm text-base-content/60 text-center py-4">
                No break times set. Click "Add Break" to set recurring break times.
              </p>
            )}
          </div>

          {/* Slot Configuration Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-base-content">Slot Configuration</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Slot Duration (min)</span>
                </label>
                <input
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={availability.slotDuration}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    slotDuration: parseInt(e.target.value),
                  }))}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">Buffer Time (min)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="60"
                  step="5"
                  value={availability.buffer}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    buffer: parseInt(e.target.value),
                  }))}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">Max Per Day</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={availability.maxPerDay}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    maxPerDay: parseInt(e.target.value),
                  }))}
                  className="input input-bordered w-full"
                />
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">Max Duration (min)</span>
                </label>
                <input
                  type="number"
                  min="30"
                  max="480"
                  step="15"
                  value={availability.appointmentDuration?.max || 120}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    appointmentDuration: {
                      ...prev.appointmentDuration,
                      max: parseInt(e.target.value),
                    },
                  }))}
                  className="input input-bordered w-full"
                />
              </div>
            </div>
          </div>

          {/* Lead Time & Cancel Notice Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-base-content">Booking Rules</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">Minimum Lead Time (hours)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  step="1"
                  value={availability.minLeadTime || 0}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    minLeadTime: parseInt(e.target.value),
                  }))}
                  className="input input-bordered w-full"
                />
                <p className="text-xs text-base-content/60 mt-1">
                  {availability.minLeadTime === 0
                    ? 'Bookings available anytime'
                    : `Bookings require ${availability.minLeadTime}h notice`}
                </p>
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">Cancel Notice (hours)</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="168"
                  step="1"
                  value={availability.cancelNotice || 0}
                  onChange={(e) => setAvailability(prev => ({
                    ...prev,
                    cancelNotice: parseInt(e.target.value),
                  }))}
                  className="input input-bordered w-full"
                />
                <p className="text-xs text-base-content/60 mt-1">
                  {availability.cancelNotice === 0
                    ? 'Cancel anytime'
                    : `Cancel with ${availability.cancelNotice}h notice`}
                </p>
              </div>
            </div>
          </div>

          {/* Custom Slots Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-base-content">Custom Slots (Optional)</h3>
              <button
                onClick={() => setShowAddSlot(!showAddSlot)}
                className="btn btn-sm btn-outline gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Slot
              </button>
            </div>

            {/* Add Slot Form */}
            {showAddSlot && (
              <div className="bg-base-200 p-4 rounded-lg space-y-3 border-2 border-base-300">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-sm">Date</span>
                    </label>
                    <input
                      type="date"
                      value={newSlot.date}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, date: e.target.value }))}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-sm">Start Time</span>
                    </label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, startTime: e.target.value }))}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text font-medium text-sm">End Time</span>
                    </label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, endTime: e.target.value }))}
                      className="input input-bordered input-sm w-full"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newSlot.available}
                      onChange={(e) => setNewSlot(prev => ({ ...prev, available: e.target.checked }))}
                      className="checkbox accent-primary"
                    />
                    <span className="text-sm">Available</span>
                  </label>

                  <div className="flex gap-2">
                    <button
                      onClick={handleAddSlot}
                      className="btn btn-sm btn-primary"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => setShowAddSlot(false)}
                      className="btn btn-sm btn-ghost"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Custom Slots List */}
            {customSlots.length > 0 && (
              <div className="space-y-2">
                {customSlots.map(slot => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 bg-base-200 rounded-lg border border-base-300"
                  >
                    <div className="text-sm">
                      <p className="font-medium text-base-content">
                        {new Date(slot.date).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-base-content/70">
                        {slot.startTime} - {slot.endTime}
                        {slot.available && <span className="ml-2 text-success text-xs font-medium">(Available)</span>}
                        {!slot.available && <span className="ml-2 text-error text-xs font-medium">(Unavailable)</span>}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveSlot(slot.id)}
                      className="btn btn-ghost btn-sm btn-circle text-error"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {customSlots.length === 0 && !showAddSlot && (
              <p className="text-sm text-base-content/60 text-center py-4">
                No custom slots added yet. Add specific dates/times for custom availability.
              </p>
            )}
          </div>

          {/* Info Banner */}
          <div className="bg-info/10 border border-info rounded-lg p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-info flex-shrink-0 mt-0.5" />
            <div className="text-sm text-info-content">
              <p className="font-semibold">Settings Overview:</p>
              <ul className="list-disc list-inside mt-1 space-y-0.5">
                <li><strong>Status:</strong> Control overall availability</li>
                <li><strong>Break Times:</strong> Daily recurring breaks (e.g., lunch)</li>
                <li><strong>Lead Time:</strong> Minimum hours before booking</li>
                <li><strong>Cancel Notice:</strong> Hours required to cancel</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-base-200 border-t border-base-300 px-6 py-4 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="btn btn-ghost"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveAvailabilityMutation.isPending}
            className="btn btn-primary gap-2"
          >
            {saveAvailabilityMutation.isPending ? (
              <>
                <span className="loading loading-spinner loading-sm"></span>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvailabilitySettings;

