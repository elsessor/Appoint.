import { useState, useEffect, useRef } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { updateProfilePicture, getMyProfile, updateMyProfile } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { LANGUAGE_TO_FLAG } from "../constants";

const getLanguageFlag = (language) => {
  if (!language) return null;
  const langLower = language.toLowerCase();
  const countryCode = LANGUAGE_TO_FLAG[langLower];
  if (countryCode) {
    return (
      <img
        src={`https://flagcdn.com/24x18/${countryCode}.png`}
        alt={`${langLower} flag`}
        className="h-3.5 w-5 rounded-sm object-cover inline-block mr-1"
      />
    );
  }
  return null;
};

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isAboutExpanded, setIsAboutExpanded] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    location: '',
    phone: '',
    email: '',
    portfolio: '',
    twitter: '',
    github: '',
    pinterest: '',
    linkedin: '',
    about: '',
    jobTitle: '',
    company: '',
    yearsExperience: 0,
    appointmentsCompleted: 0,
    rating: 0,
    successRate: 0,
    birthDate: '',
    nationality: '',
    languagesKnown: [],
    occupation: '',
    profilePic: '',
    skills: [],
    interests: [],
  });
  const [draft, setDraft] = useState(profile);
  const draftRef = useRef(draft);

  useEffect(() => {
    if (!authUser) return;
    console.log('authUser:', authUser);
    
    let cancelled = false;
    
    (async () => {
      try {
        const profileData = await getMyProfile();
        console.log('Profile data from API:', profileData);
        if (cancelled) return;

        const profileUpdate = {
          name: profileData.fullName || authUser?.fullName || '',
          profilePic: profileData.profilePic || authUser?.profilePic || '',
          about: profileData.bio || '',
          location: profileData.location || '',
          phone: profileData.phone || '',
          email: authUser?.email || '',
          portfolio: profileData.portfolio || '',
          twitter: profileData.twitter || '',
          github: profileData.github || '',
          pinterest: profileData.pinterest || '',
          linkedin: profileData.linkedin || '',
          skills: profileData.skills || [],
          jobTitle: profileData.jobTitle || '',
          company: profileData.company || '',
          yearsExperience: profileData.yearsExperience || 0,
          appointmentsCompleted: profileData.appointmentsCompleted || 0,
          rating: profileData.rating || 0,
          successRate: profileData.successRate || 0,
          birthDate: profileData.birthDate || '',
          nationality: profileData.nationality || '',
          languagesKnown: profileData.languagesKnown || [],
          occupation: profileData.occupation || '',
          interests: profileData.interests || [],
        };

        setProfile(prev => ({ ...prev, ...profileUpdate }));
        setDraft(prev => ({ ...prev, ...profileUpdate }));
        if (Array.isArray(profileData.skills)) {
          setSkills(profileData.skills);
        }

        try {
          const key = `profile_${authUser._id}`;
          localStorage.setItem(key, JSON.stringify(profileUpdate));
        } catch (e) {
          console.warn('Failed to cache profile in localStorage', e);
        }
      } catch (err) {
        console.warn('Failed to load profile from server, using authUser data', err);
        const authName = authUser?.fullName || '';
        const authPic = authUser?.profilePic || '';
        const authBio = authUser?.bio || '';
        const authLoc = authUser?.location || '';
        
        // Generate avatar for old accounts without profilePic
        const defaultAvatar = `https://api.dicebear.com/7.x/avataaars/svg?seed=${authUser?._id || 'default'}`;
        
        const fallback = {
          name: authName,
          profilePic: authPic || defaultAvatar,
          about: authBio,
          location: authLoc,
          phone: '',
          email: authUser?.email || '',
          portfolio: '',
          twitter: '',
          github: '',
          pinterest: '',
          linkedin: '',
          skills: [],
          jobTitle: '',
          company: '',
          yearsExperience: 0,
          appointmentsCompleted: 0,
          rating: 0,
          successRate: 0,
          birthDate: '',
          nationality: '',
          languagesKnown: [],
          occupation: '',
          interests: [],
        };
        
        setProfile(prev => ({ ...prev, ...fallback }));
        setDraft(prev => ({ ...prev, ...fallback }));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [authUser]);
  const [skills, setSkills] = useState(["Time Management", "Coordination", "Skills Management"]);
  const [interests, setInterests] = useState([]);

  useEffect(() => {
    if (Array.isArray(profile.skills)) setSkills(profile.skills);
  }, [profile]);

  const suggestedSkills = [
    "Time Management",
    "Communication",
    "Leadership",
    "Coordination",
    "Problem Solving",
    "Organization",
    "Customer Service",
    "Programming",
    "Design",
    "Marketing",
    "Sales",
    "Project Management",
    "Public Speaking",
    "Data Analysis",
    "Skills Management",
    "Web Development",
    "UI/UX Design",
    "Data Analysis",
    "Graphic Design",
    "Copywriting"
  ];

  const suggestedInterests = [
    "Baking",
    "Cooking",
    "Photography",
    "Video Editing",
    "Writing",
    "Content Creation",
    "Social Media Management",
    "Event Planning",
    "Teaching",
    "Tutoring",
    "Travel",
    "Gaming",
    "Music",
    "Sports",
    "Reading",
    "Blogging"
  ];

  const [selectedSuggested, setSelectedSuggested] = useState(suggestedSkills[0]);
  const [skillSearch, setSkillSearch] = useState("");
  const [interestSearch, setInterestSearch] = useState("");
  const [customSkillInput, setCustomSkillInput] = useState("");

  const filteredSuggestions = skillSearch
    ? suggestedSkills.filter((s) => {
        const query = skillSearch.toLowerCase();
        const inText = s.toLowerCase().includes(query);
        const current = (draft.skills || skills || []);
        const alreadyAdded = current.includes(s);
        return inText && !alreadyAdded;
      })
    : [];

  const filteredInterestSuggestions = interestSearch
    ? suggestedInterests.filter((s) => {
        const query = interestSearch.toLowerCase();
        const current = (draft.skills || skills || []);
        const alreadyAdded = current.includes(s);
        return s.toLowerCase().includes(query) && !alreadyAdded;
      })
    : [];


  const [stats, setStats] = useState({ friends: 107, appointments: 107, rating: 4.8 });

  const startEditing = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft(profile);
  };

  const saveEditing = async () => {
    if (!authUser) {
      toast.error("Please log in to save your profile");
      return;
    }

    const toSave = draftRef.current || draft;
    console.log('=== SAVING PROFILE ===');
    console.log('Draft data:', toSave);
    console.log('GitHub in draft:', toSave.github);
    
    try {
      setIsEditing(false);
      
      const updatePayload = {
        fullName: toSave.name || authUser.fullName,
        bio: toSave.about || '',
        location: toSave.location || '',
        phone: toSave.phone || '',
        portfolio: toSave.portfolio || '',
        twitter: toSave.twitter || '',
        github: toSave.github || '',
        pinterest: toSave.pinterest || '',
        linkedin: toSave.linkedin || '',
        skills: Array.isArray(toSave.skills) ? toSave.skills : skills,
        jobTitle: toSave.jobTitle || '',
        company: toSave.company || '',
        yearsExperience: toSave.yearsExperience || 0,
        appointmentsCompleted: toSave.appointmentsCompleted || 0,
        rating: toSave.rating || 0,
        successRate: toSave.successRate || 0,
        birthDate: toSave.birthDate || '',
        nationality: toSave.nationality || '',
        languagesKnown: Array.isArray(toSave.languagesKnown) ? toSave.languagesKnown : [],
        occupation: toSave.occupation || '',
        interests: Array.isArray(toSave.interests) ? toSave.interests : [],
      };
      
      console.log('Payload being sent:', updatePayload);
      console.log('GitHub in payload:', updatePayload.github);

      await updateMyProfile(updatePayload);
      
      // Reload profile from backend to ensure we have the saved data
      const updatedProfileData = await getMyProfile();
      console.log('Profile data from backend:', updatedProfileData);
      console.log('GitHub from backend:', updatedProfileData.github);
      
      const profileUpdate = {
        name: updatedProfileData.fullName || authUser?.fullName || '',
        profilePic: updatedProfileData.profilePic || authUser?.profilePic || '',
        about: updatedProfileData.bio || '',
        location: updatedProfileData.location || '',
        phone: updatedProfileData.phone || '',
        email: authUser?.email || '',
        portfolio: updatedProfileData.portfolio || '',
        twitter: updatedProfileData.twitter || '',
        github: updatedProfileData.github || '',
        pinterest: updatedProfileData.pinterest || '',
        linkedin: updatedProfileData.linkedin || '',
        skills: updatedProfileData.skills || [],
        jobTitle: updatedProfileData.jobTitle || '',
        company: updatedProfileData.company || '',
        yearsExperience: updatedProfileData.yearsExperience || 0,
        appointmentsCompleted: updatedProfileData.appointmentsCompleted || 0,
        rating: updatedProfileData.rating || 0,
        successRate: updatedProfileData.successRate || 0,
        birthDate: updatedProfileData.birthDate || '',
        nationality: updatedProfileData.nationality || '',
        languagesKnown: updatedProfileData.languagesKnown || [],
        occupation: updatedProfileData.occupation || '',
        interests: updatedProfileData.interests || [],
      };
      
      setProfile(profileUpdate);
      setDraft(profileUpdate);
      if (Array.isArray(updatedProfileData.skills)) setSkills(updatedProfileData.skills);
      
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      try {
        const key = `profile_${authUser._id}`;
        localStorage.setItem(key, JSON.stringify(profileUpdate));
      } catch (e) {
        console.warn('Failed to cache profile in localStorage', e);
      }
      
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error('Failed to save profile', err);
      toast.error(err?.response?.data?.message || "Failed to update profile");
      setIsEditing(true);
    }
  };

  const onFieldChange = (field) => (e) => {
    const value = e?.target?.value;
    const nextDraft = { ...draft, [field]: value };
    setDraft(nextDraft);
    draftRef.current = nextDraft;
    setProfile(prev => ({ ...prev, [field]: value }));
    
    try {
      const key = authUser ? `profile_${authUser._id}` : 'profile_guest';
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, ...nextDraft };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (err) {
      console.warn('Failed to cache profile field change', err);
    }
  };

  const fileInputRef = useRef(null);

  const compressImage = (file, maxWidth = 800, maxHeight = 800, quality = 0.8) => {
    return new Promise((resolve, reject) => {
      if (!file.type.startsWith('image/')) {
        reject(new Error('File must be an image'));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to compress image'));
                return;
              }
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            },
            file.type,
            quality
          );
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleImageSelect = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (!authUser) {
      toast.error("Please log in to update your profile picture");
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 5MB. The image will be compressed.");
    }

    try {
      setIsUploadingPhoto(true);
      
      const compressedDataUrl = await compressImage(file);
      
      setProfile(prev => ({ ...prev, profilePic: compressedDataUrl }));
      const next = { ...draftRef.current, profilePic: compressedDataUrl };
      setDraft(next);
      draftRef.current = next;

      await updateProfilePicture({ profilePic: compressedDataUrl });
      console.log('Profile picture updated, invalidating queries');
      
      // Refetch both authUser and profile data
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      // Also manually refetch the profile to get latest data
      const updatedProfile = await getMyProfile();
      console.log('Refetched profile:', updatedProfile);
      setProfile(prev => ({ ...prev, profilePic: updatedProfile.profilePic }));
      
      const key = authUser ? `profile_${authUser._id}` : 'profile_guest';
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, profilePic: compressedDataUrl };
      localStorage.setItem(key, JSON.stringify(merged));
      
      toast.success("Profile picture updated successfully");
    } catch (err) {
      console.error('Failed to save profile picture', err);
      const errorMessage = err?.response?.data?.message || err?.message || "Failed to update profile picture";
      toast.error(errorMessage);
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const addSkillToDraft = (skill) => {
    if (!skill) return;
    const current = Array.isArray(draft.skills) ? draft.skills.slice() : (Array.isArray(profile.skills) ? profile.skills.slice() : skills.slice());
    if (current.includes(skill)) return;
    const updated = [...current, skill];
    const next = { ...draftRef.current, skills: updated };
    setDraft(next);
    draftRef.current = next;
    setSkills(updated);
    setProfile(prev => ({ ...prev, skills: updated }));
    
    try {
      const key = authUser ? `profile_${authUser._id}` : 'profile_guest';
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, ...(draftRef.current || profile), skills: updated };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (err) {
      console.warn('Failed to cache skills in localStorage', err);
    }
  };

  const removeSkillFromDraft = (idx) => {
    const current = Array.isArray(draft.skills) ? draft.skills.slice() : skills.slice();
    current.splice(idx, 1);
    const next = { ...draftRef.current, skills: current };
    setDraft(next);
    draftRef.current = next;
    setSkills(current);
    setProfile(prev => ({ ...prev, skills: current }));
    
    try {
      const key = authUser ? `profile_${authUser._id}` : 'profile_guest';
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, ...(draftRef.current || profile), skills: current };
      localStorage.setItem(key, JSON.stringify(merged));
    } catch (err) {
      console.warn('Failed to cache skills in localStorage', err);
    }
  };
 
  useEffect(() => { draftRef.current = draft; }, [draft]);

  return (
    <div className="min-h-screen bg-base-100 pt-2 lg:pt-16 pb-16 lg:pb-8 px-2 sm:px-4">
      <div className="w-full max-w-full lg:max-w-6xl mx-auto">
        {/* Hero Section with Profile Card */}
        <div className="relative rounded-2xl overflow-hidden backdrop-blur-sm border border-base-300/50 shadow-2xl mb-6 sm:mb-8">
          {/* Gradient Background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-base-100 to-secondary/10" />
          
          <div className="relative px-4 sm:px-6 py-6 sm:py-8 lg:px-8">
            <div className="flex flex-col sm:flex-row sm:items-end gap-4 sm:gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <img
                  src={authUser?.profilePic || profile.profilePic || "/profile.jpg"}
                  alt={authUser?.fullName || profile.name}
                  className="w-20 sm:w-32 h-20 sm:h-32 rounded-full object-cover border-4 border-base-200 shadow-xl"
                  onError={(e) => {
                    e.target.src = '/default-profile.svg';
                  }}
                />
                <div className="absolute bottom-0 right-0 w-4 sm:w-6 h-4 sm:h-6 bg-success rounded-full border-2 border-base-200"></div>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={isUploadingPhoto} />
              </div>

              {/* Name and Title */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center space-x-3 mb-1">
                      <h1 className="text-3xl font-bold">{authUser?.fullName || profile.name}</h1>
                      {authUser?.isVerified && (
                        <div className="flex items-center space-x-1 text-success bg-success/10 px-2 py-1 rounded-full text-xs">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Verified</span>
                        </div>
                      )}
                    </div>
                    {isEditing ? (
                  <div className="flex flex-col space-y-2">
                    <input
                      value={draft.occupation}
                      onChange={onFieldChange('occupation')}
                      placeholder="Occupation"
                      className="bg-base-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      value={draft.jobTitle}
                      onChange={onFieldChange('jobTitle')}
                      placeholder="Job Title"
                      className="bg-base-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <input
                      value={draft.company}
                      onChange={onFieldChange('company')}
                      placeholder="Company"
                      className="bg-base-300 rounded px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <p className="text-base-content/70">
                    {profile.occupation ? profile.occupation : 
                     (profile.jobTitle && profile.company ? `${profile.jobTitle} at ${profile.company}` : 
                     profile.jobTitle || profile.company || 'Add your job title and company')}
                  </p>
                )}
                <div className="flex items-center space-x-2 mt-2 text-sm text-base-content/70">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.location}
                      onChange={onFieldChange('location')}
                      placeholder="Location"
                      className="bg-base-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <span>{profile.location || 'Add location'}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 mt-4 md:mt-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="btn btn-sm btn-outline"
                  disabled={isUploadingPhoto}
                >
                  {isUploadingPhoto ? "Uploading..." : "Change Photo"}
                </button>
                <button
                  onClick={!isEditing ? startEditing : saveEditing}
                  className="btn btn-sm btn-primary"
                >
                  {isEditing ? 'Save Changes' : 'Edit Profile'}
                </button>
                {isEditing && (
                  <button
                    onClick={cancelEditing}
                    className="btn btn-sm btn-ghost"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pt-6 border-t border-base-300">
          <div className="text-center p-4 bg-base-100 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {isEditing ? (
                <input
                  type="number"
                  value={draft.yearsExperience}
                  onChange={onFieldChange('yearsExperience')}
                  className="w-16 bg-base-300 rounded px-2 py-1 text-center text-2xl font-bold focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <span className="text-2xl font-bold text-primary">{profile.yearsExperience}+</span>
              )}
            </div>
            <p className="text-sm text-base-content/70">Years Experience</p>
          </div>

          <div className="text-center p-4 bg-base-100 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-2xl font-bold text-secondary">{profile.appointmentsCompleted}</span>
            </div>
            <p className="text-sm text-base-content/70">Appointments Completed</p>
          </div>

          <div className="text-center p-4 bg-base-100 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <svg className="w-5 h-5 text-warning" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-2xl font-bold text-warning">{profile.rating}</span>
            </div>
            <p className="text-sm text-base-content/70">Rating</p>
          </div>

          <div className="text-center p-4 bg-base-100 rounded-lg">
            <div className="flex items-center justify-center space-x-2 mb-1">
              <svg className="w-5 h-5 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="text-2xl font-bold text-success">{profile.successRate}%</span>
            </div>
            <p className="text-sm text-base-content/70">Success Rate</p>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Contact & Languages/Nationality */}
          <div className="space-y-6">
            <div className="bg-base-100 rounded-xl p-5 shadow-md border border-base-300/50 hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-semibold mb-4 flex items-center text-primary">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Contact
              </h3>
              <div className="space-y-3">
                {/* Email */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="text-base-content/80">{profile.email || 'No email'}</span>
                </div>

                {/* Phone */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.phone}
                      onChange={onFieldChange('phone')}
                      placeholder="+63 976 789 1329"
                      className="bg-base-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <span className="text-base-content/80">{profile.phone || 'Add phone'}</span>
                  )}
                </div>

                {/* Birth Date */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {isEditing ? (
                    <input
                      type="date"
                      value={draft.birthDate}
                      onChange={onFieldChange('birthDate')}
                      className="bg-base-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : (
                    <span className="text-base-content/80">
                      {profile.birthDate ? new Date(profile.birthDate).toLocaleDateString() : 'Add birth date'}
                    </span>
                  )}
                </div>

                {/* Divider */}
                <div className="border-t border-base-300/50 my-3"></div>

                {/* Portfolio/Website */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.portfolio}
                      onChange={onFieldChange('portfolio')}
                      placeholder="Portfolio URL"
                      className="bg-base-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : profile.portfolio ? (
                    <a href={profile.portfolio} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      Portfolio
                    </a>
                  ) : (
                    <span className="text-sm text-base-content/50">Add portfolio</span>
                  )}
                </div>

                {/* LinkedIn */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065z" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.linkedin}
                      onChange={onFieldChange('linkedin')}
                      placeholder="LinkedIn URL"
                      className="bg-base-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : profile.linkedin ? (
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {profile.linkedin.replace(/^https?:\/\/(www\.)?(linkedin\.com\/)?(in\/)?/, '').split('/')[0] || 'LinkedIn'}
                    </a>
                  ) : (
                    <span className="text-sm text-base-content/50">Add LinkedIn</span>
                  )}
                </div>

                {/* GitHub */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.github}
                      onChange={onFieldChange('github')}
                      placeholder="GitHub URL"
                      className="bg-base-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : profile.github ? (
                    <a href={profile.github} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {(() => {
                        try {
                          let cleaned = profile.github.replace(/^https?:\/\/(www\.)?/, '');
                          cleaned = cleaned.replace(/^github\.com\//, '');
                          const username = cleaned.split('/')[0];
                          return username || 'GitHub';
                        } catch {
                          return 'GitHub';
                        }
                      })()}
                    </a>
                  ) : (
                    <span className="text-sm text-base-content/50">Add GitHub</span>
                  )}
                </div>

                {/* Pinterest */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 4.99 3.05 9.26 7.43 11.03-.1-.94-.19-2.39.04-3.42.21-.94 1.36-5.98 1.36-5.98s-.35-.7-.35-1.73c0-1.62.94-2.83 2.12-2.83 1 .07 1.53.75 1.53 1.65 0 1.01-.64 2.52-.97 3.92-.28 1.18.6 2.14 1.78 2.14 2.13 0 3.77-2.23 3.77-5.46 0-2.85-2.06-4.85-5-4.85-3.4 0-5.48 2.56-5.48 5.21 0 1.05.4 2.18.9 2.8.1.12.11.23.08.35-.09.4-.29 1.21-.32 1.38-.05.24-.17.29-.4.17-1.5-.7-2.44-2.89-2.44-4.66 0-3.79 2.76-7.29 8-7.29 4.2 0 7.3 3 7.3 6.99 0 4.28-2.69 7.71-6.42 7.71-1.25 0-2.43-.65-2.83-1.42l-.77 2.92C9.6 22.9 10.6 23 11.65 23 18.28 23 24 17.63 24 11 24 5.37 18.63 0 12 0z" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.pinterest}
                      onChange={onFieldChange('pinterest')}
                      placeholder="Pinterest URL"
                      className="bg-base-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : profile.pinterest ? (
                    <a href={profile.pinterest} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {(() => {
                        try {
                          let cleaned = profile.pinterest.replace(/^https?:\/\/(www\.)?/, '');
                          cleaned = cleaned.replace(/^[a-z]{2}\.pinterest\.com\/|^pinterest\.com\//, '');
                          const username = cleaned.split('/')[0];
                          return username || 'Pinterest';
                        } catch {
                          return 'Pinterest';
                        }
                      })()}
                    </a>
                  ) : (
                    <span className="text-sm text-base-content/50">Add Pinterest</span>
                  )}
                </div>

                {/* Twitter */}
                <div className="flex items-center space-x-3 text-sm">
                  <svg className="w-4 h-4 text-base-content/60" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 001.88-2.36 8.52 8.52 0 01-2.7 1.03 4.24 4.24 0 00-7.23 3.86A12.04 12.04 0 013 4.79a4.24 4.24 0 001.31 5.66 4.2 4.2 0 01-1.92-.53v.05c0 2.05 1.46 3.76 3.4 4.15a4.27 4.27 0 01-1.91.07 4.25 4.25 0 003.96 2.95A8.51 8.51 0 012 19.54 12.02 12.02 0 008.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.53A8.36 8.36 0 0022.46 6z" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.twitter}
                      onChange={onFieldChange('twitter')}
                      placeholder="Twitter URL"
                      className="bg-base-300 rounded px-2 py-1 flex-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  ) : profile.twitter ? (
                    <a href={profile.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline">
                      {profile.twitter.replace(/^https?:\/\/(www\.)?(twitter\.com\/|x\.com\/)?/, '').split('/')[0] || 'Twitter'}
                    </a>
                  ) : (
                    <span className="text-sm text-base-content/50">Add Twitter</span>
                  )}
                </div>
              </div>
            </div>

            {/* Languages & Nationality Combined */}
            {(profile.languagesKnown?.length > 0 || profile.nationality) && (
              <div className="bg-base-200 rounded-xl p-5 border border-base-300">
                {/* Languages Known */}
                {profile.languagesKnown && profile.languagesKnown.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-secondary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                      </svg>
                      Languages
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {profile.languagesKnown.slice(0, 2).map((language) => (
                        <div key={language} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-secondary/15 border border-secondary/25 text-secondary rounded-full text-xs font-medium">
                          {getLanguageFlag(language)}
                          <span>{language}</span>
                        </div>
                      ))}
                      {profile.languagesKnown.length > 2 && (
                        <div className="inline-flex items-center px-2.5 py-1 bg-secondary/20 border border-secondary/30 text-secondary rounded-full text-xs font-semibold">
                          +{profile.languagesKnown.length - 2}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Divider */}
                {profile.languagesKnown?.length > 0 && profile.nationality && (
                  <div className="border-t border-base-300/50 my-4"></div>
                )}

                {/* Nationality */}
                {profile.nationality && (
                  <div>
                    <h3 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                      </svg>
                      Nationality
                    </h3>
                    {isEditing ? (
                      <input
                        value={draft.nationality}
                        onChange={onFieldChange('nationality')}
                        placeholder="e.g., United States, Canada..."
                        className="bg-base-300 rounded px-3 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                        {getLanguageFlag(profile.nationality)}
                        <span className="text-sm font-semibold text-base-content">{profile.nationality}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}


          </div>

          {/* Right Column - About & Skills */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-base-100 rounded-xl p-6 shadow-md border border-base-300/50 hover:shadow-lg transition-shadow h-[342px]">
              <h3 className="text-xl font-bold mb-4 text-primary">About</h3>
              {isEditing ? (
                <textarea
                  value={draft.about}
                  onChange={onFieldChange('about')}
                  placeholder="Write something about yourself..."
                  className="w-full h-[300px] bg-base-300 rounded p-3 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              ) : (
                <div className="h-[300px] overflow-y-auto">
                  <div className={`text-base-content/80 leading-relaxed whitespace-pre-wrap ${!isAboutExpanded && 'line-clamp-none'}`}>
                    {profile.about || 'Add information about yourself'}
                  </div>
                  {profile.about && profile.about.length > 150 && (
                    <button
                      onClick={() => setIsAboutExpanded(!isAboutExpanded)}
                      className="mt-3 text-primary text-sm font-medium hover:text-primary-focus transition-colors"
                    >
                      {isAboutExpanded ? 'See less' : 'See more'}
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Skills & Interests Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Skills Column */}
              <div className="bg-base-200 rounded-xl p-5 border border-base-300">
                <h3 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  Skills
                </h3>
                {isEditing ? (
                  <div>
                    {/* Skills search box */}
                    <div className="mb-3">
                      <div className="w-full">
                        <input
                          placeholder="Search skill (e.g. Programming)"
                          value={skillSearch}
                          onChange={(e) => setSkillSearch(e.target.value)}
                          className="input input-bordered input-sm w-full text-sm"
                        />
                        {filteredSuggestions.length > 0 && (
                          <div className="mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                            {filteredSuggestions.map((s) => (
                              <button
                                type="button"
                                key={s}
                                onClick={() => { addSkillToDraft(s); setSkillSearch(''); }}
                                className="w-full text-left px-2 py-1.5 hover:bg-base-200 text-sm"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Display skills */}
                    <div className="flex flex-wrap gap-2">
                      {(draft.skills || skills || []).map((skill, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold hover:bg-primary/20 transition-colors">
                          <span>{skill}</span>
                          <button type="button" onClick={() => removeSkillFromDraft(index)} className="ml-1.5 text-xs text-error hover:opacity-70">×</button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {(skills && skills.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {skills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 bg-primary/10 text-primary border border-primary/30 rounded-full text-xs font-semibold hover:bg-primary/20 transition-colors"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base-content/50 text-sm">No skills added yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Interests Column */}
              <div className="bg-base-200 rounded-xl p-5 border border-base-300">
                <h3 className="text-base font-bold text-base-content mb-3 flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  Interests
                </h3>
                {isEditing ? (
                  <div>
                    {/* Interests search box */}
                    <div className="mb-3">
                      <div className="w-full">
                        <input
                          placeholder="Search interest (e.g. Baking)"
                          value={interestSearch}
                          onChange={(e) => setInterestSearch(e.target.value)}
                          className="input input-bordered input-sm w-full text-sm"
                        />
                        {filteredInterestSuggestions.length > 0 && (
                          <div className="mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                            {filteredInterestSuggestions.map((s) => (
                              <button
                                type="button"
                                key={s}
                                onClick={() => { addSkillToDraft(s); setInterestSearch(''); }}
                                className="w-full text-left px-2 py-1.5 hover:bg-base-200 text-sm"
                              >
                                {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Display interests */}
                    <div className="flex flex-wrap gap-2">
                      {(profile.interests || []).map((interest, index) => (
                        <span key={index} className="inline-flex items-center px-3 py-1.5 bg-secondary/10 text-secondary border border-secondary/30 rounded-full text-xs font-semibold hover:bg-secondary/20 transition-colors">
                          <span>{interest}</span>
                          <button 
                            type="button" 
                            onClick={() => {
                              const updated = (profile.interests || []).filter((_, i) => i !== index);
                              setProfile(prev => ({ ...prev, interests: updated }));
                              setDraft(prev => ({ ...prev, interests: updated }));
                            }} 
                            className="ml-1.5 text-xs text-error hover:opacity-70"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    {(profile.interests && profile.interests.length > 0) ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((interest, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1.5 bg-secondary/10 text-secondary border border-secondary/30 rounded-full text-xs font-semibold hover:bg-secondary/20 transition-colors"
                          >
                            {interest}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base-content/50 text-sm">No interests added yet</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
      </div>
    </div>
  );
};

export default ProfilePage;
