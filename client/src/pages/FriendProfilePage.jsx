import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Calendar, Phone, Mail, MapPin, Globe, Briefcase, Star, Clock, TrendingUp, Video, CheckCircle, Heart, Linkedin, Twitter } from 'lucide-react';
import { getFriendProfile, getRecentMeetings, getUpcomingAppointmentsCount, toggleFavorite } from '../lib/api';
import { isOnline } from '../lib/presence';
import PageLoader from '../components/PageLoader';
import { useThemeStore } from '../store/useThemeStore';

const FriendProfilePage = () => {
  const { theme } = useThemeStore();
  const { id } = useParams();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

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

  const favoriteMutation = useMutation({
    mutationFn: (friendId) => toggleFavorite(friendId),
    onSuccess: (data) => {
      setIsFavorite(data.isFavorite);
    },
    onError: (error) => {
      console.error('Error toggling favorite:', error);
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

  const availabilityBadgeColor = friend.availabilityStatus === 'available'
    ? 'btn-success'
    : friend.availabilityStatus === 'limited'
    ? 'btn-warning'
    : friend.availabilityStatus === 'offline'
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
                      const colorClass = online
                        ? (friend.availabilityStatus === 'available' ? 'bg-success shadow-lg shadow-success/50' : friend.availabilityStatus === 'limited' ? 'bg-warning shadow-lg shadow-warning/50' : 'bg-error shadow-lg shadow-error/50')
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

                      {/* Action Buttons */}
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
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Information Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact & About */}
          <div className="lg:col-span-2 space-y-8">
            {/* Contact Information */}
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
                {friend.twitter ? (
                  <div className="flex items-center gap-3">
                    <Twitter className="w-4 h-4 text-base-content/60 flex-shrink-0" />
                    <span className="text-base-content/80 text-sm">{friend.twitter}</span>
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
                    <span className="text-base-content/80 text-sm">{friend.pinterest}</span>
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
                    <span className="text-base-content/80 text-sm">{friend.linkedin}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Linkedin className="w-4 h-4 text-base-content/30 flex-shrink-0" />
                    <span className="text-base-content/40 text-sm italic">LinkedIn - Not provided</span>
                  </div>
                )}
              </div>
            </div>

            {/* About Section */}
            <div className="bg-base-200 rounded-xl p-5 border border-base-300">
              <h2 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" />
                About
              </h2>
              {friend.bio ? (
                <p className="text-base-content/80 text-sm leading-relaxed">{friend.bio}</p>
              ) : (
                <p className="text-base-content/40 text-sm italic">No bio added yet</p>
              )}
            </div>

            {/* Recent Meetings Section */}
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
          </div>

          {/* Right Column - Languages & Skills */}
          <div className="space-y-6">
            {/* Availability & Rating */}
            <div className="bg-base-200 rounded-xl p-5 border border-base-300">
              <h3 className="text-base font-bold text-base-content mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Availability
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                  <span className="text-base-content/70 font-medium text-sm">Status</span>
                  <span className={`badge font-semibold py-2 px-3 text-xs ${
                    friend.availabilityStatus === 'available' 
                      ? 'badge-success' 
                      : friend.availabilityStatus === 'limited' 
                      ? 'badge-warning' 
                      : 'badge-error'
                  }`}>
                    {friend.availabilityStatus?.charAt(0).toUpperCase() + friend.availabilityStatus?.slice(1) || 'Offline'}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-base-100 rounded-lg">
                  <span className="text-base-content/70 font-medium text-sm">Response Time</span>
                  <span className="text-xs font-semibold text-primary">Within 2 hours</span>
                </div>
              </div>
            </div>

            {/* Mini Calendar */}
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
                    const maxPerDay = friend.availability?.maxPerDay || 5;
                    
                    // For now, use a consistent pattern based on day number
                    // Use real booking data from backend
                    const bookingArray = appointmentCounts?.bookingsByDay || [];
                    const bookingCount = isAvailable ? (bookingArray[i] || 0) : 0;
                    const isFullyBooked = bookingCount >= maxPerDay;
                    const hasBookings = bookingCount > 0 && bookingCount < maxPerDay;
                    const isAway = friend.availabilityStatus === 'away';
                    
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
                        className={`p-2 rounded-lg text-center transition-all duration-300 cursor-pointer border ${bgColor}`}
                        title={status === 'available' ? 'Fully available' : status === 'partial' ? `${bookingCount}/${maxPerDay} bookings` : status === 'fully-booked' ? 'Fully booked' : status === 'away' ? 'Away' : 'Not scheduled'}
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
    </div>
  );
};

export default FriendProfilePage;
