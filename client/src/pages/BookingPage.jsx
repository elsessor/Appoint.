import React, { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import AppointmentModal from '../components/appointments/AppointmentModal';
import { getMyFriends, getAuthUser, createAppointment } from '../lib/api';
import PageLoader from '../components/PageLoader';
import { toast } from 'react-hot-toast';
import { useSearchParams, useNavigate } from 'react-router';

const BookingPage = () => {
  const [showBookingModal, setShowBookingModal] = useState(true);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const friendIdParam = searchParams.get('friendId');
  const dateParam = searchParams.get('date');

  // Compute initial date and friend from URL params directly
  const initialDate = useMemo(() => {
    if (dateParam) {
      // Parse date string in YYYY-MM-DD format
      const [year, month, day] = dateParam.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    return null;
  }, [dateParam]);

  const initialFriendId = friendIdParam || null;

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
    <div className="min-h-screen bg-base-100 pt-2 lg:pt-16 pb-16 lg:pb-8 px-2 sm:px-4 animate-fade-in">
      <AppointmentModal
        isOpen={showBookingModal}
        onClose={() => {
          setShowBookingModal(false);
          navigate(-1);
        }}
        friends={friends}
        currentUser={currentUser}
        onSubmit={handleBookingSubmit}
        initialFriendId={initialFriendId}
        initialDate={initialDate}
      />
    </div>
  );
};

export default BookingPage;
