import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Calendar, Phone, Mail, MapPin, Globe, Briefcase, Star, Clock, TrendingUp, Video, CheckCircle, Heart, Linkedin, Twitter, UserPlusIcon, XIcon, Github, Link as LinkIcon } from 'lucide-react';
import { getFriendProfile, getRecentMeetings, getUpcomingAppointmentsCount, toggleFavorite, sendFriendRequest, cancelFriendRequest, getOutgoingFriendReqs, unfriendUser, getAuthUser, createAppointment, getUserAvailability } from '../lib/api';
import { isOnline } from '../lib/presence';
import PageLoader from '../components/PageLoader';
import AppointmentModal from '../components/appointments/AppointmentModal';
import { useThemeStore } from '../store/useThemeStore';
import { formatLastOnline } from '../lib/utils';
import { getSocket } from '../lib/socket';
import toast from 'react-hot-toast';

const FriendProfilePage = () => {
  const { theme } = useThemeStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingUserId, setLoadingUserId] = useState(null);
  const [outgoingRequestMap, setOutgoingRequestMap] = useState(new Map());
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [friendAvailability, setFriendAvailability] = useState(null);

  const { data: friend, isLoading, isError } = useQuery({
    queryKey: ['friendProfile', id],
    queryFn: () => getFriendProfile(id),
    enabled: Boolean(id),
  });

  const { data: recentMeetings = [] } = useQuery({
    queryKey: ['recentMeetings', id],
    queryFn: () => getRecentMeetings(id),
    enabled: Boolean(id),
  });

  const { data: appointmentCounts } = useQuery({
    queryKey: ['upcomingAppointments', id],
    queryFn: () => getUpcomingAppointmentsCount(id),
    enabled: Boolean(id),
  });

  const { data: outgoingFriendReqs } = useQuery({
    queryKey: ['outgoingFriendReqs'],
    queryFn: getOutgoingFriendReqs,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['authUser'],
    queryFn: getAuthUser,
  });

  const favoriteMutation = useMutation({
    mutationFn: (friendId) => toggleFavorite(friendId),
    onSuccess: (data) => {
      setIsFavorite(data.isFavorite);
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
    },
  });

  const { mutate: sendRequestMutation } = useMutation({
    mutationFn: sendFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendReqs'] });
      setLoadingUserId(null);
      toast.success('Friend request sent!');
    },
    onError: (error) => {
      setLoadingUserId(null);
      toast.error(error.response?.data?.message || 'Failed to send friend request');
    },
  });

  const { mutate: cancelRequestMutation } = useMutation({
    mutationFn: cancelFriendRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendReqs'] });
      setLoadingUserId(null);
      toast.success('Friend request cancelled!');
    },
    onError: (error) => {
      setLoadingUserId(null);
      toast.error(error.response?.data?.message || 'Failed to cancel friend request');
    },
  });

  const { mutate: unfriendMutation } = useMutation({
    mutationFn: unfriendUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['friendProfile', id] });
      queryClient.invalidateQueries({ queryKey: ['friendsList'] });
      queryClient.invalidateQueries({ queryKey: ['outgoingFriendReqs'] });
      setLoadingUserId(null);
      toast.success('Friend removed!');
    },
    onError: (error) => {
      setLoadingUserId(null);
      toast.error(error.response?.data?.message || 'Failed to remove friend');
    },
  });

  const handleToggleFavorite = () => {
    favoriteMutation.mutate(id);
  };

  // Initialize isFavorite state from friend data
  useEffect(() => {
    if (friend?.isFavorite !== undefined) {
      setIsFavorite(friend.isFavorite);
    }
  }, [friend]);

  // Track outgoing friend requests
  useEffect(() => {
    const requestMap = new Map();
    if (outgoingFriendReqs && outgoingFriendReqs.length > 0) {
      outgoingFriendReqs.forEach((req) => {
        requestMap.set(req.recipient._id, req._id);
      });
      setOutgoingRequestMap(requestMap);
    } else {
      setOutgoingRequestMap(new Map());
    }
  }, [outgoingFriendReqs]);

  // Fetch friend's availability for appointment modal
  useEffect(() => {
    if (friend?._id) {
      getUserAvailability(friend._id)
        .then((response) => {
          setFriendAvailability({
            status: response?.availabilityStatus || 'available',
            maxPerDay: response?.availability?.maxPerDay || 5,
            minPerDay: response?.availability?.minPerDay || 1,
            ...response?.availability
          });
          console.log('📊 [FriendProfilePage] Fetched friend availability:', {
            status: response?.availabilityStatus,
            maxPerDay: response?.availability?.maxPerDay,
            minPerDay: response?.availability?.minPerDay,
          });
        })
        .catch((error) => console.error('Failed to fetch friend availability:', error));
    }
  }, [friend?._id]);

  // Listen for real-time availability changes via Socket.io
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !friend?._id) return;

    const handleAvailabilityChanged = ({ userId, availabilityStatus, availability }) => {
      // Only update if this event is for the friend we're viewing
      if (userId === friend._id) {
        console.log('📊 [FriendProfilePage] Real-time availability change received:', { availabilityStatus, availability });
        setFriendAvailability({
          status: availabilityStatus || 'available',
          maxPerDay: availability?.maxPerDay || 5,
          minPerDay: availability?.minPerDay || 1,
          ...availability
        });
        // Refetch calendar data to update indicators
        queryClient.invalidateQueries({ queryKey: ['upcomingAppointments', friend._id] });
      }
    };

    socket.on('availability:changed', handleAvailabilityChanged);

    return () => {
      socket.off('availability:changed', handleAvailabilityChanged);
    };
  }, [friend?._id, queryClient]);

  // Listen for appointment changes to refresh calendar
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !friend?._id) return;

    const handleAppointmentEvent = () => {
      console.log('[FriendProfilePage] Appointment event received - refreshing calendar');
      // Refetch calendar data when appointments are created/updated/deleted
      queryClient.invalidateQueries({ queryKey: ['upcomingAppointments', friend._id] });
    };

    socket.on('appointment:created', handleAppointmentEvent);
    socket.on('appointment:updated', handleAppointmentEvent);
    socket.on('appointment:deleted', handleAppointmentEvent);
    socket.on('appointment:statusChanged', handleAppointmentEvent);

    return () => {
      socket.off('appointment:created', handleAppointmentEvent);
      socket.off('appointment:updated', handleAppointmentEvent);
      socket.off('appointment:deleted', handleAppointmentEvent);
      socket.off('appointment:statusChanged', handleAppointmentEvent);
    };
  }, [friend?._id, queryClient]);

  if (isLoading) return <PageLoader />;

  if (isError || !friend) {
    return (
      <div className="min-h-screen bg-base-100" data-theme={theme}>
        <div className="max-w-6xl mx-auto px-6 py-8">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="alert alert-error mt-4">
            <span>Failed to load friend profile. Please try again.</span>
          </div>
        </div>
      </div>
    );
  }

  const availabilityBadgeColor = (friendAvailability?.status || friend.availabilityStatus) === 'available'
    ? 'btn-success'
    : (friendAvailability?.status || friend.availabilityStatus) === 'limited'
    ? 'btn-warning'
    : (friendAvailability?.status || friend.availabilityStatus) === 'offline'
    ? 'btn-neutral'
    : 'btn-error';

  // Live presence check (used to disable booking when user is offline)
  const online = isOnline(friend._id);

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      {/* Decorative Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 -left-40 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 -right-40 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="btn btn-ghost btn-sm gap-2 mb-6"
          aria-label="Go back"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        {/* Hero Section with Profile Card */}
        <div className="mb-8">
          <div className="relative rounded-2xl overflow-hidden backdrop-blur-sm border border-base-300/50 shadow-2xl">
            {/* Gradient Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10" />
            
            <div className="relative px-6 py-8 lg:px-8">
              <div className="flex flex-col lg:flex-row gap-6 items-center lg:items-start">
                {/* Avatar Section */}
                <div className="relative flex-shrink-0">
                  <div className="relative">
                    {/* Decorative Ring */}
                    <div className="absolute inset-0 -m-3 rounded-full border-2 border-primary/20 animate-pulse" />
                    
                    {/* Avatar */}
                    <div className="w-28 h-28 rounded-full bg-base-100 overflow-hidden border-4 border-primary/40 shadow-2xl ring-4 ring-base-100">
                      <img
                        src={friend.profilePic || '/default-profile.svg'}
                        alt={friend.fullName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    {/* Status Indicator */}
                    {(() => {
                      const online = isOnline(friend._id);
                      const currentStatus = friendAvailability?.status || friend.availabilityStatus;
                      const colorClass = online
                        ? (currentStatus === 'available' ? 'bg-success shadow-lg shadow-success/50' : currentStatus === 'limited' ? 'bg-warning shadow-lg shadow-warning/50' : 'bg-error shadow-lg shadow-error/50')
                        : 'bg-neutral-500';
                      return (
                        <div className={`absolute bottom-1 right-1 w-5 h-5 rounded-full border-3 border-base-100 ${colorClass} flex items-center justify-center`}>
                          <div className="w-1.5 h-1.5 bg-white rounded-full" />
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Profile Info */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="text-center lg:text-left">
                      <div className="flex items-start justify-between gap-3 mb-2 lg:block">
                        <h1 className="text-3xl lg:text-4xl font-bold text-base-content leading-tight">{friend.fullName}</h1>
                      </div>
                      
                      {friend.location && (
                        <p className="text-base text-base-content/70 flex items-center justify-center lg:justify-start gap-2 mb-1 font-medium">
                          <MapPin className="w-4 h-4 text-primary" />
                          {friend.location}
                        </p>
                      )}

                      {friend.createdAt && (
                        <p className="text-xs text-base-content/60 flex items-center justify-center lg:justify-start gap-2 mb-4">
                          <Clock className="w-3 h-3" />
                          Joined {new Date(friend.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}
                        </p>
                      )}

                      {/* Languages */}
                      {(friend.nativeLanguage || friend.learningLanguage) && (
                        <div className="flex flex-wrap gap-2 mb-5 justify-center lg:justify-start">
                          {friend.nativeLanguage && (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-primary-content rounded-full text-xs font-bold shadow-lg">
                              {friend.nativeLanguage}
                            </span>
                          )}
                          {friend.learningLanguage && (
                            <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-secondary text-secondary-content rounded-full text-xs font-bold shadow-lg">
                              {friend.learningLanguage}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right Side: Favorite Button and Action Buttons */}
                    <div className="flex flex-col items-center lg:items-end gap-9 lg:justify-between h-full">
                      {friend?.isFriend && (
                        <div className="flex gap-3 items-center">
                          <button
                            onClick={handleToggleFavorite}
                            disabled={favoriteMutation.isPending}
                            className="flex-shrink-0 p-2 rounded-full hover:bg-base-200 transition-all duration-300 disabled:opacity-50"
                            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                          >
                            <Heart 
                              className={`w-6 h-6 transition-all duration-300 ${isFavorite ? 'fill-error text-error' : 'text-base-content/40 hover:text-error'}`} 
                            />
                          </button>

                          <button
                            onClick={() => {
                              setLoadingUserId(friend._id);
                              unfriendMutation(friend._id);
                            }}
                            className="flex-shrink-0 p-2 rounded-full hover:bg-error/20 transition-all duration-300 disabled:opacity-50"
                            aria-label={`Remove ${friend.fullName} as friend`}
                            disabled={loadingUserId === friend._id}
                            title="Unfriend"
                          >
                            {loadingUserId === friend._id ? (
                              <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                              <svg className="w-6 h-6 text-error" fill="none" stroke="currentColor" viewBox="0 0 28 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M24 13h-6" />
                              </svg>
                            )}
                          </button>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {friend?.isFriend ? (
                        <div className="flex flex-col gap-2 w-full lg:w-auto">
                          <button
                            type="button"
                            onClick={() => navigate(`/chats/${friend._id}`)}
                            className="group relative px-4 py-2 font-semibold text-primary rounded-md overflow-hidden transition-all duration-300 hover:scale-105 border-2 border-primary backdrop-blur-md bg-primary/10 hover:bg-primary/20 shadow-lg hover:shadow-xl text-xs whitespace-nowrap"
                            aria-label={`Message ${friend.fullName}`}
                          >
                            <span className="relative flex items-center gap-1.5 justify-center">
                              <MessageCircle className="w-4 h-4" />
                              <span>Message</span>
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => navigate(`/booking?friendId=${friend._id}`)}
                            className="group relative px-4 py-2 font-semibold text-secondary rounded-md overflow-hidden transition-all duration-300 hover:scale-105 border-2 border-secondary backdrop-blur-md bg-secondary/10 hover:bg-secondary/20 shadow-lg hover:shadow-xl text-xs whitespace-nowrap"
                            aria-label={`Book appointment with ${friend.fullName}`}
                          >
                            <span className="relative flex items-center gap-1.5 justify-center">
                              <Calendar className="w-4 h-4" />
                              <span>Book</span>
                            </span>
                          </button>
                        </div>
                      ) : (
                        <button
                          className={`btn text-xs whitespace-nowrap ${
                            outgoingRequestMap.has(friend._id) ? "btn-outline btn-error" : "btn-primary"
                          }`}
                          onClick={() => {
                            setLoadingUserId(friend._id);
                            if (outgoingRequestMap.has(friend._id)) {
                              const requestId = outgoingRequestMap.get(friend._id);
                              if (requestId) {
                                cancelRequestMutation(requestId);
                              }
                            } else {
                              sendRequestMutation(friend._id);
                            }
                          }}
                          disabled={loadingUserId === friend._id}
                        >
                          {loadingUserId === friend._id ? (
                            <span className="loading loading-spinner loading-sm"></span>
                          ) : outgoingRequestMap.has(friend._id) ? (
                            <>
                              <XIcon className="size-4 mr-2" />
                              Cancel Request
                            </>
                          ) : (
                            <>
                              <UserPlusIcon className="size-4 mr-2" />
                              Add Friend
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 lg:gap-4 mb-12">
          <div className="text-center p-3 lg:p-4 bg-base-200 rounded-lg border border-base-300/50">
            <div className="flex items-center justify-center space-x-1.5 mb-2">
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xl lg:text-2xl font-bold text-primary">{friend?.yearsExperience || 0}+</span>
            </div>
            <p className="text-xs lg:text-sm text-base-content/70">Years Experience</p>
          </div>

          <div className="text-center p-3 lg:p-4 bg-base-200 rounded-lg border border-base-300/50">
            <div className="flex items-center justify-center space-x-1.5 mb-2">
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-xl lg:text-2xl font-bold text-secondary">{friend?.appointmentsCompleted || 0}</span>
            </div>
            <p className="text-xs lg:text-sm text-base-content/70">Appointments</p>
          </div>

          <div className="text-center p-3 lg:p-4 bg-base-200 rounded-lg border border-base-300/50">
            <div className="flex items-center justify-center space-x-1.5 mb-2">
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-xl lg:text-2xl font-bold text-warning">{friend?.rating || 0}</span>
            </div>
            <p className="text-xs lg:text-sm text-base-content/70">Rating</p>
          </div>

          <div className="text-center p-3 lg:p-4 bg-base-200 rounded-lg border border-base-300/50">
            <div className="flex items-center justify-center space-x-1.5 mb-2">
              <svg className="w-4 h-4 lg:w-5 lg:h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-xl lg:text-2xl font-bold text-success">{friend?.successRate || 0}%</span>
            </div>
            <p className="text-xs lg:text-sm text-base-content/70">Success Rate</p>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact & About */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information - Only visible for friends */}
            {friend?.isFriend && (
              <div className="rounded-2xl overflow-hidden border border-base-300/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-8 py-6 border-b border-base-300/50">
                  <h2 className="text-xl font-bold text-base-content flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg">
                      <Mail className="w-5 h-5 text-primary" />
                    </div>
                    Contact Information
                  </h2>
                </div>
                <div className="p-8 space-y-4">
                  {friend.phone ? (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                      <span className="text-base-content/80 text-sm">{friend.phone}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                      <span className="text-base-content/40 text-sm italic">Phone - Not provided</span>
                    </div>
                  )}
                  {friend.portfolio ? (
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                      <a href={friend.portfolio} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">{friend.portfolio}</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <LinkIcon className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                      <span className="text-base-content/40 text-sm italic">Portfolio - Not provided</span>
                    </div>
                  )}
                  {friend.github ? (
                    <div className="flex items-center gap-3">
                      <Github className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                      <a href={`https://github.com/${friend.github}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">{friend.github}</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Github className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                      <span className="text-base-content/40 text-sm italic">GitHub - Not provided</span>
                    </div>
                  )}
                  {friend.twitter ? (
                    <div className="flex items-center gap-3">
                      <Twitter className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                      <a href={`https://twitter.com/${friend.twitter}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">@{friend.twitter}</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Twitter className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                      <span className="text-base-content/40 text-sm italic">Twitter - Not provided</span>
                    </div>
                  )}
                  {friend.pinterest ? (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-base-content/60 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 4.99 3.05 9.26 7.43 11.03-.1-.94-.19-2.39.04-3.42.21-.94 1.36-5.98 1.36-5.98s-.35-.7-.35-1.73c0-1.62.94-2.83 2.12-2.83 1 .07 1.53.75 1.53 1.65 0 1.01-.64 2.52-.97 3.92-.28 1.18.6 2.14 1.78 2.14 2.13 0 3.77-2.23 3.77-5.46 0-2.85-2.06-4.85-5-4.85-3.4 0-5.48 2.56-5.48 5.21 0 1.05.4 2.18.9 2.8.1.12.11.23.08.35-.09.4-.29 1.21-.32 1.38-.05.24-.17.29-.4.17-1.5-.7-2.44-2.89-2.44-4.66 0-3.79 2.76-7.29 8-7.29 4.2 0 7.3 3 7.3 6.99 0 4.28-2.69 7.71-6.42 7.71-1.25 0-2.43-.65-2.83-1.42l-.77 2.92C9.6 22.9 10.6 23 11.65 23 18.28 23 24 17.63 24 11 24 5.37 18.63 0 12 0z" />
                      </svg>
                      <a href={`https://pinterest.com/${friend.pinterest}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">{friend.pinterest}</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <svg className="w-4 h-4 text-base-content/30 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 4.99 3.05 9.26 7.43 11.03-.1-.94-.19-2.39.04-3.42.21-.94 1.36-5.98 1.36-5.98s-.35-.7-.35-1.73c0-1.62.94-2.83 2.12-2.83 1 .07 1.53.75 1.53 1.65 0 1.01-.64 2.52-.97 3.92-.28 1.18.6 2.14 1.78 2.14 2.13 0 3.77-2.23 3.77-5.46 0-2.85-2.06-4.85-5-4.85-3.4 0-5.48 2.56-5.48 5.21 0 1.05.4 2.18.9 2.8.1.12.11.23.08.35-.09.4-.29 1.21-.32 1.38-.05.24-.17.29-.4.17-1.5-.7-2.44-2.89-2.44-4.66 0-3.79 2.76-7.29 8-7.29 4.2 0 7.3 3 7.3 6.99 0 4.28-2.69 7.71-6.42 7.71-1.25 0-2.43-.65-2.83-1.42l-.77 2.92C9.6 22.9 10.6 23 11.65 23 18.28 23 24 17.63 24 11 24 5.37 18.63 0 12 0z" />
                      </svg>
                      <span className="text-base-content/40 text-sm italic">Pinterest - Not provided</span>
                    </div>
                  )}
                  {friend.linkedin ? (
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                      <a href={`https://linkedin.com/in/${friend.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-primary text-sm hover:underline">{friend.linkedin}</a>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3">
                      <Linkedin className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                      <span className="text-base-content/40 text-sm italic">LinkedIn - Not provided</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* About Section */}
            <div className="bg-base-200 rounded-xl p-5 border border-base-300">
              <h2 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                About
              </h2>
              {friend.bio ? (
                <div>
                  <p className={`text-base-content/80 text-sm leading-relaxed ${!isAboutExpanded && 'line-clamp-3'}`}>
                    {friend.bio}
                  </p>
                  {friend.bio.length > 150 && (
                    <button
                      onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                      className="mt-2 text-primary text-sm font-medium hover:text-primary-focus transition-colors"
                    >
                      {isAboutExpanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </div>
              ) : (
                <p className="text-base-content/40 text-sm italic">No bio added yet</p>
              )}
            </div>

            {/* Recent Meetings Section - Only visible for friends */}
            {friend?.isFriend && (
              <div className="bg-base-200 rounded-xl p-5 border border-base-200">
                <h2 className="text-base font-bold text-base-content mb-4 flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  Recent Meetings
                </h2>
                {recentMeetings && recentMeetings.length > 0 ? (
                  <div className="grid grid-cols-3 gap-4">
                    {recentMeetings.slice(0, 3).map((meeting, index) => {
                      const meetingDate = new Date(meeting.startTime);
                      const duration = Math.round((new Date(meeting.endTime) - new Date(meeting.startTime)) / (1000 * 60));
                      
                      // Determine the other user in the meeting
                      const otherUser = meeting.userId._id === friend._id ? meeting.friendId : meeting.userId;
                      const otherUserPhoto = otherUser.profilePic || '/default-profile.svg';
                      
                      const timeString = meetingDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                      const dateString = meetingDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

                      return (
                        <div key={meeting._id} className="p-4 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border border-primary/20 hover:border-primary/40 transition-all flex flex-col items-center text-center gap-3">
                          <img
                            src={otherUserPhoto}
                            alt={otherUser.fullName}
                            className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
                            onError={(e) => {
                              e.target.src = '/default-profile.svg';
                            }}
                          />
                          <div>
                            <p className="text-sm font-bold text-base-content truncate">{otherUser.fullName}</p>
                            <p className="text-xs text-base-content/60 mt-0.5">{meeting.title || 'Appointment'}</p>
                          </div>
                          <div className="w-full border-t border-primary/20 pt-3">
                            <p className="text-xs text-base-content/50 mb-2">{dateString} {timeString}</p>
                            <span className="inline-block text-xs font-semibold text-primary bg-primary/20 px-3 py-1 rounded-full">{duration}m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Video className="w-8 h-8 text-base-content/20 mx-auto mb-2" />
                    <p className="text-sm text-base-content/50">No meetings yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column - Languages & Skills */}
          <div className="space-y-6">
            {/* Availability & Rating - Only visible for friends */}
            {friend?.isFriend && (
              <div className="bg-base-200 rounded-xl p-5 border border-base-300">
                <h3 className="text-base font-bold text-base-content mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary" />
                  Availability
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                    <span className="text-base-content/70 font-medium text-sm">Status</span>
                    <span className={`badge font-semibold py-2 px-3 text-xs ${
                      (friendAvailability?.status || friend.availabilityStatus) === 'available' 
                        ? 'badge-success' 
                        : (friendAvailability?.status || friend.availabilityStatus) === 'limited' 
                        ? 'badge-warning' 
                        : 'badge-error'
                    }`}>
                      {(friendAvailability?.status || friend.availabilityStatus)?.charAt(0).toUpperCase() + (friendAvailability?.status || friend.availabilityStatus)?.slice(1) || 'Offline'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                    <span className="text-base-content/70 font-medium text-sm">Last Online</span>
                    <span className="text-xs font-semibold text-primary">{online ? 'Now' : formatLastOnline(friend.lastOnline)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Mini Calendar - Only visible for friends */}
            {friend?.isFriend && (
              <div className="rounded-2xl overflow-hidden border border-base-300/50 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 px-6 py-4 border-b border-base-300/50">
                  <h3 className="text-base font-bold text-base-content flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Next 7 Days
                  </h3>
                </div>
              <div className="p-6">
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 7 }, (_, i) => {
                    const date = new Date();
                    date.setDate(date.getDate() + i);
                    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                    const dayNum = date.getDate();
                    
                    // Check if this day is in the availability days array
                    const availableDays = friend.availability?.days || [1, 2, 3, 4, 5];
                    const isAvailable = availableDays.includes(dayOfWeek);
                    
                    // Get max bookings per day from availability settings
                    let maxPerDay = friend.availability?.maxPerDay || friendAvailability?.maxPerDay || 5;
                    
                    // Apply status-based logic: if limited, use minPerDay instead
                    if ((friendAvailability?.status || friend.availabilityStatus) === 'limited') {
                      maxPerDay = friend.availability?.minPerDay || friendAvailability?.minPerDay || 1;
                    }
                    
                    // For now, use a consistent pattern based on day number
                    // Use real booking data from backend
                    const bookingArray = appointmentCounts?.bookingsByDay || [];
                    const bookingCount = isAvailable ? (bookingArray[i] || 0) : 0;
                    const isFullyBooked = bookingCount >= maxPerDay;
                    const hasBookings = bookingCount > 0 && bookingCount < maxPerDay;
                    const isAway = (friendAvailability?.status || friend.availabilityStatus) === 'away';
                    
                    // Determine status
                    let status = 'not-scheduled'; // Default
                    let bgColor = 'bg-base-200 border-base-300/30 hover:bg-base-300 opacity-60';
                    let dotColor = 'bg-base-content/20';
                    
                    if (isAvailable) {
                      if (isAway) {
                        status = 'away';
                        bgColor = 'bg-error/20 border-error/40 hover:bg-error/30';
                        dotColor = 'bg-error';
                      } else if (isFullyBooked) {
                        status = 'fully-booked';
                        bgColor = 'bg-error/20 border-error/40 hover:bg-error/30';
                        dotColor = 'bg-error';
                      } else if (hasBookings) {
                        status = 'partial';
                        bgColor = 'bg-warning/20 border-warning/40 hover:bg-warning/30';
                        dotColor = 'bg-warning';
                      } else {
                        status = 'available';
                        bgColor = 'bg-success/20 border-success/40 hover:bg-success/30';
                        dotColor = 'bg-success';
                      }
                    }
                    
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          const dateToSelect = new Date();
                          dateToSelect.setDate(dateToSelect.getDate() + i);
                          setSelectedDate(dateToSelect);
                          setShowAppointmentModal(true);
                        }}
                        className={`p-2 rounded-lg text-center transition-all duration-300 cursor-pointer border ${bgColor}`}
                        title={status === 'available' ? 'Click to book' : status === 'partial' ? `${bookingCount}/${maxPerDay} bookings - Click to book` : status === 'fully-booked' ? 'Fully booked' : status === 'away' ? 'Away' : 'Not scheduled'}
                        role="button"
                        tabIndex="0"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            const dateToSelect = new Date();
                            dateToSelect.setDate(dateToSelect.getDate() + i);
                            setSelectedDate(dateToSelect);
                            setShowAppointmentModal(true);
                          }
                        }}
                      >
                        <p className="text-xs font-semibold text-base-content/70 leading-tight">{dayName}</p>
                        <p className="text-sm font-bold text-base-content leading-tight">{dayNum}</p>
                        <div className="mt-1.5 flex justify-center">
                          <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-1.5">
                  <p className="text-xs text-base-content/50 font-medium">Legend:</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-success"></span>
                      <span className="text-xs text-base-content/60">Available - No bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-warning"></span>
                      <span className="text-xs text-base-content/60">Available - Some bookings</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-error"></span>
                      <span className="text-xs text-base-content/60">Fully booked / Away</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-block w-2 h-2 rounded-full bg-base-content/20"></span>
                      <span className="text-xs text-base-content/60">Not scheduled</span>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            )}

            {/* Languages Sidebar */}
            {(friend.nativeLanguage || friend.learningLanguage) && (
              <div className="bg-base-200 rounded-xl p-5 border border-base-300">
                <h3 className="text-base font-bold text-base-content mb-4 flex items-center gap-2">
                  <Globe className="w-5 h-5 text-primary" />
                  Languages
                </h3>
                <div className="space-y-2">
                  {friend.nativeLanguage && (
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-xs font-semibold text-primary">Native Speaker</p>
                      <p className="text-sm font-bold text-base-content mt-1">{friend.nativeLanguage}</p>
                    </div>
                  )}
                  {friend.learningLanguage && (
                    <div className="p-3 bg-secondary/10 rounded-lg border border-secondary/20">
                      <p className="text-xs font-semibold text-secondary">Learning</p>
                      <p className="text-sm font-bold text-base-content mt-1">{friend.learningLanguage}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills & Interests */}
            {friend.skills && friend.skills.length > 0 && (
              <div className="bg-base-200 rounded-xl p-5 border border-base-300">
                <h3 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Skills
                </h3>
                <div className="flex flex-wrap gap-2">
                  {friend.skills.map((skill, index) => (
                    <span key={index} className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold hover:bg-primary/20 transition-colors">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Appointment Modal */}
      {friend && (
        <AppointmentModal
          isOpen={showAppointmentModal}
          onClose={() => {
            setShowAppointmentModal(false);
            setSelectedDate(null);
          }}
          friends={[friend]}
          currentUser={currentUser}
          onSubmit={async (appointmentData) => {
            try {
              await createAppointment(appointmentData);
              setShowAppointmentModal(false);
              setSelectedDate(null);
              queryClient.invalidateQueries({ queryKey: ['friendProfile', id] });
              toast.success('Appointment booked successfully!');
            } catch (error) {
              toast.error(error.message || 'Failed to book appointment');
            }
          }}
          initialFriendId={friend._id}
          initialDate={selectedDate}
          friendsAvailability={friend._id ? { [friend._id]: friendAvailability } : {}}
        />
      )}
    </div>
  );
};

export default FriendProfilePage;
