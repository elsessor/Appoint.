import { useState, useEffect, useCallback } from 'react';
import { getSocket } from '../lib/socket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAuthUser } from '../lib/api';
import toast from 'react-hot-toast';

export const useAppointmentReminder = () => {
  const [upcomingAppointment, setUpcomingAppointment] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
  });

  // Listen for appointment reminders via socket
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleAppointmentReminder = (appointment) => {
      console.log('[AppointmentReminder] Received reminder:', appointment);
      setUpcomingAppointment(appointment);
      setShowModal(true);
      
      // Play a notification sound
      try {
        const audio = new Audio('/notification.mp3');
        audio.play().catch(err => console.log('Could not play sound:', err));
      } catch (err) {
        console.log('Audio notification not available');
      }
    };

    const handleAppointmentStarted = (appointment) => {
      console.log('[AppointmentReminder] Appointment started:', appointment);
      // Automatically hide modal when appointment starts
      setShowModal(false);
    };

    socket.on('appointment:reminder', handleAppointmentReminder);
    socket.on('appointment:started', handleAppointmentStarted);

    return () => {
      socket.off('appointment:reminder', handleAppointmentReminder);
      socket.off('appointment:started', handleAppointmentStarted);
    };
  }, []);

  const handleJoinCall = useCallback(() => {
    if (!upcomingAppointment) return;

    console.log('[AppointmentReminder] User joining call for appointment:', upcomingAppointment._id);
    
    // Emit socket event to notify other participant
    const socket = getSocket();
    if (socket) {
      socket.emit('appointment:joined', {
        appointmentId: upcomingAppointment._id,
        userId: currentUser?._id,
      });
    }

    // TODO: Redirect to call/video page or open video call
    // For now, show success message
    toast.success('Connecting to call...');
    setShowModal(false);

    // You can redirect to a call page here
    // window.location.href = `/call/${upcomingAppointment._id}`;
  }, [upcomingAppointment, currentUser]);

  const handleDeclineCall = useCallback(() => {
    if (!upcomingAppointment) return;

    console.log('[AppointmentReminder] User declining appointment:', upcomingAppointment._id);

    // Emit socket event to notify other participant
    const socket = getSocket();
    if (socket) {
      socket.emit('appointment:declined', {
        appointmentId: upcomingAppointment._id,
        userId: currentUser?._id,
      });
    }

    toast.info('Appointment declined');
    setShowModal(false);
    setUpcomingAppointment(null);
  }, [upcomingAppointment, currentUser]);

  return {
    upcomingAppointment,
    showModal,
    setShowModal,
    handleJoinCall,
    handleDeclineCall,
  };
};
