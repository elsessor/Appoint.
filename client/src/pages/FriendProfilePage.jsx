import React from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, MessageCircle, Calendar, Phone, Mail, MapPin, Globe, Briefcase, Star } from 'lucide-react';
import { getFriendProfile } from '../lib/api';
import PageLoader from '../components/PageLoader';
import { useThemeStore } from '../store/useThemeStore';

const FriendProfilePage = () => {
  const { theme } = useThemeStore();
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: friend, isLoading, isError } = useQuery({
    queryKey: ['friendProfile', id],
    queryFn: () => getFriendProfile(id),
    enabled: Boolean(id),
  });

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
    : 'btn-error';

  return (
    <div className="min-h-screen bg-base-100" data-theme={theme}>
      {/* Header with Back Button */}
      <div className="bg-gradient-to-r from-primary/20 to-secondary/20 border-b-2 border-primary sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <button
            onClick={() => navigate(-1)}
            className="btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Profile Header Section */}
        <div className="bg-base-200 rounded-2xl border-2 border-primary/30 p-8 mb-8 shadow-lg">
          <div className="flex flex-col md:flex-row gap-8 items-start md:items-center">
            {/* Avatar with Badge */}
            <div className="relative flex-shrink-0">
              <div className="w-40 h-40 rounded-full bg-base-100 p-2">
                <img
                  src={friend.profilePic || '/default-profile.png'}
                  alt={friend.fullName}
                  className="w-full h-full rounded-full object-cover border-4 border-base-100 shadow-lg hover:shadow-xl transition-all duration-300"
                />
              </div>
              {friend.availabilityStatus && (
                <div className={`absolute bottom-2 right-2 w-5 h-5 rounded-full border-4 border-base-100 shadow-lg ${
                  friend.availabilityStatus === 'available' ? 'bg-success' : 
                  friend.availabilityStatus === 'limited' ? 'bg-warning' : 'bg-error'
                }`} />
              )}
            </div>

            {/* Name, Location, and Actions */}
            <div className="flex-1 w-full">
              <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
                <div>
                  <h1 className="text-5xl font-bold text-base-content mb-2">{friend.fullName}</h1>
                  <div className="flex items-center gap-2 text-base-content/70 text-lg">
                    <MapPin className="w-5 h-5 text-primary" />
                    <span>{friend.location || 'Location not specified'}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 flex-wrap">
                <button className="btn btn-primary gap-2 shadow-md hover:shadow-lg transition-all">
                  <MessageCircle className="w-5 h-5" />
                  Message
                </button>
                <button className="btn btn-secondary gap-2 shadow-md hover:shadow-lg transition-all">
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </button>
                <button className={`btn gap-2 shadow-md hover:shadow-lg transition-all ${
                  friend.availabilityStatus === 'available' ? 'btn-success' : 
                  friend.availabilityStatus === 'limited' ? 'btn-warning' : 'btn-error'
                }`}>
                  <Star className="w-5 h-5" />
                  <span>{friend.availabilityStatus?.charAt(0).toUpperCase() + friend.availabilityStatus?.slice(1) || 'Available'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Contact & About */}
          <div className="lg:col-span-2 space-y-6">
            {/* Contact Information */}
            <div className="card bg-base-200 p-6 shadow-lg border border-base-300">
              <h2 className="text-2xl font-bold text-base-content mb-6 flex items-center gap-3">
                <Globe className="w-6 h-6 text-primary" />
                Contact Information
              </h2>
              <div className="space-y-4">
                {friend.phone ? (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-base-100 hover:bg-base-100/80 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60">Phone</p>
                      <span className="text-base-content/80 text-lg font-medium">{friend.phone}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-base-100/50">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-base-300/50 flex items-center justify-center">
                      <Phone className="w-6 h-6 text-base-content/30" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60">Phone</p>
                      <span className="text-base-content/40 text-sm italic">Not provided</span>
                    </div>
                  </div>
                )}
                {friend.twitter ? (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-base-100 hover:bg-base-100/80 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-sky-500/10 flex items-center justify-center">
                      <svg className="w-6 h-6 text-sky-500" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60">Twitter</p>
                      <span className="text-base-content/80 text-lg font-medium">{friend.twitter}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-base-100/50">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-base-300/50 flex items-center justify-center">
                      <svg className="w-6 h-6 text-base-content/30" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7"/>
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60">Twitter</p>
                      <span className="text-base-content/40 text-sm italic">Not provided</span>
                    </div>
                  </div>
                )}
                {friend.linkedin ? (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-base-100 hover:bg-base-100/80 transition-colors">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-blue-600/10 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60">LinkedIn</p>
                      <span className="text-base-content/80 text-lg font-medium">{friend.linkedin}</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4 p-3 rounded-lg bg-base-100/50">
                    <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-base-300/50 flex items-center justify-center">
                      <Briefcase className="w-6 h-6 text-base-content/30" />
                    </div>
                    <div>
                      <p className="text-xs text-base-content/60">LinkedIn</p>
                      <span className="text-base-content/40 text-sm italic">Not provided</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* About Section */}
            {friend.about ? (
              <div className="card bg-base-200 p-6 shadow-lg border border-base-300">
                <h2 className="text-2xl font-bold text-base-content mb-4 flex items-center gap-3">
                  <Star className="w-6 h-6 text-secondary" />
                  About
                </h2>
                <p className="text-base-content/80 leading-relaxed text-lg">{friend.about}</p>
              </div>
            ) : (
              <div className="card bg-base-200/50 p-6 shadow-lg border border-base-300">
                <h2 className="text-2xl font-bold text-base-content/50 mb-4 flex items-center gap-3">
                  <Star className="w-6 h-6 text-base-content/30" />
                  About
                </h2>
                <p className="text-base-content/40 leading-relaxed text-lg italic">No bio added yet</p>
              </div>
            )}
          </div>

          {/* Right Column: Languages & Skills */}
          <div className="space-y-6">
            {/* Languages */}
            {(friend.nativeLanguage || friend.learningLanguage) && (
              <div className="card bg-base-200 p-6 shadow-lg border border-base-300">
                <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-3">
                  <Globe className="w-5 h-5 text-success" />
                  Languages
                </h3>
                <div className="space-y-3 flex flex-col">
                  {friend.nativeLanguage && (
                    <div className="badge badge-lg badge-success w-full justify-start text-base py-4 px-4 font-semibold">
                      <span>🇵🇭 Native: {friend.nativeLanguage}</span>
                    </div>
                  )}
                  {friend.learningLanguage && (
                    <div className="badge badge-lg badge-info w-full justify-start text-base py-4 px-4 font-semibold">
                      <span>📚 Learning: {friend.learningLanguage}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Skills & Interests */}
            {friend.skills && friend.skills.length > 0 && (
              <div className="card bg-base-200 p-6 shadow-lg border border-base-300">
                <h3 className="text-xl font-bold text-base-content mb-4 flex items-center gap-3">
                  <Briefcase className="w-5 h-5 text-warning" />
                  Skills & Interests
                </h3>
                <div className="flex flex-col gap-2">
                  {friend.skills.map((skill, index) => (
                    <div key={index} className="badge badge-outline badge-lg text-base py-4 px-4 justify-start font-medium hover:badge-warning transition-all cursor-default">
                      ✨ {skill}
                    </div>
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
