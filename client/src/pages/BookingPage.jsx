import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppointmentBookingModal from '../components/appointments/AppointmentBookingModal';
import { getMyFriends, getAuthUser, createAppointment } from '../lib/api';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router';

const BookingPage = () => {
  const [showBookingModal, setShowBookingModal] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const friendIdParam = searchParams.get('friendId');

  // Get current user
  const { data: currentUser, isLoading: loadingUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
  });

  // Get friends list
  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ['friends'],
    queryFn: getMyFriends,
  });

  // Handle booking submission
  const handleBookingSubmit = async (appointmentData) => {
    try {
      await createAppointment(appointmentData);
      toast.success('Appointment booked successfully!');
      setShowBookingModal(false);
    } catch (error) {
      toast.error(error.message || 'Failed to book appointment');
    }
  };

  if (loadingUser || loadingFriends) {
    return <PageLoader />;
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <AppointmentBookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        friends={friends}
        currentUser={currentUser}
        onSubmit={handleBookingSubmit}
      />
    </div>
  );
};

export default BookingPage;
