import { useState, useEffect, useRef } from "react";
import useAuthUser from "../hooks/useAuthUser";
import { updateProfilePicture, getMyProfile, updateMyProfile } from "../lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

const ProfilePage = () => {
  const { authUser } = useAuthUser();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    location: '',
    phone: '',
    twitter: '',
    github: '',
    linkedin: '',
    about: '',
  });
  const [draft, setDraft] = useState(profile);
  const draftRef = useRef(draft);

  useEffect(() => {
    if (!authUser) return;
    
    let cancelled = false;
    
    (async () => {
      try {
        const profileData = await getMyProfile();
        if (cancelled) return;

        const profileUpdate = {
          name: profileData.fullName || authUser?.fullName || '',
          profilePicture: profileData.profilePic || authUser?.profilePic || '',
          about: profileData.bio || '',
          location: profileData.location || '',
          phone: profileData.phone || '',
          twitter: profileData.twitter || '',
          github: profileData.github || '',
          linkedin: profileData.linkedin || '',
          skills: profileData.skills || [],
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
        
        const fallback = {
          name: authName,
          profilePicture: authPic,
          about: authBio,
          location: authLoc,
          phone: '',
          twitter: '',
          github: '',
          linkedin: '',
          skills: [],
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
    
    try {
      setIsEditing(false);
      
      const updatePayload = {
        fullName: toSave.name || authUser.fullName,
        bio: toSave.about || '',
        location: toSave.location || '',
        phone: toSave.phone || '',
        twitter: toSave.twitter || '',
        github: toSave.github || '',
        linkedin: toSave.linkedin || '',
        skills: Array.isArray(toSave.skills) ? toSave.skills : skills,
      };

      await updateMyProfile(updatePayload);
      
      setProfile(toSave);
      if (Array.isArray(toSave.skills)) setSkills(toSave.skills);
      
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      try {
        const key = `profile_${authUser._id}`;
        localStorage.setItem(key, JSON.stringify(toSave));
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
      
      setProfile(prev => ({ ...prev, profilePicture: compressedDataUrl }));
      const next = { ...draftRef.current, profilePicture: compressedDataUrl };
      setDraft(next);
      draftRef.current = next;

      await updateProfilePicture({ profilePic: compressedDataUrl });
      
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      const key = authUser ? `profile_${authUser._id}` : 'profile_guest';
      const saved = localStorage.getItem(key);
      const parsed = saved ? JSON.parse(saved) : {};
      const merged = { ...parsed, profilePicture: compressedDataUrl };
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
    <div className="p-6">
      <div className="bg-base-200 rounded-xl border-t-4 border-primary p-6">
        <div className="flex items-start space-x-6">
          <div className="relative">
            <img
              src={authUser?.profilePic || profile.profilePicture || "/profile.jpg"}
              alt={authUser?.fullName || profile.name}
              className="w-24 h-24 rounded-full object-cover"
              onError={(e) => {
                e.target.src = '/default-profile.svg';
              }}
            />
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="text-sm text-primary hover:underline"
                disabled={isUploadingPhoto}
              >
                {isUploadingPhoto ? "Uploading..." : "Change photo"}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} disabled={isUploadingPhoto} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-3xl font-bold">{authUser?.name || profile.name}</h1>
              {authUser?.isVerified && (
                <div className="flex items-center space-x-2 text-success bg-success/10 px-3 py-1 rounded-full">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Verified Profile</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2 mb-6">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {isEditing ? (
                <input
                  value={draft.location}
                  onChange={onFieldChange('location')}
                  className="bg-base-300 rounded px-2 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              ) : (
                <span>{profile.location}</span>
              )}
            </div>

            <div className="flex space-x-3 mb-6">
              <button
                onClick={!isEditing ? startEditing : saveEditing}
                className="flex items-center space-x-2 bg-primary hover:bg-primary-focus text-white px-4 py-2 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isEditing ? "M5 13l4 4L19 7" : "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"} />
                </svg>
                <span>{isEditing ? 'Save Changes' : 'Edit Profile'}</span>
              </button>
              {isEditing && (
                <button
                  onClick={cancelEditing}
                  className="flex items-center space-x-2 bg-base-300 hover:bg-base-200 px-4 py-2 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <span>Cancel</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-2">
                  <div className="flex items-center space-x-3 p-2 bg-base-100 rounded-lg shadow-sm w-full">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {isEditing ? (
                      <input
                        value={draft.phone}
                        onChange={onFieldChange('phone')}
                        className="bg-base-300 rounded px-2 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    ) : (
                      <span className="w-full">{profile.phone}</span>
                    )}
                  </div>
                  {[
                    { id: 'twitter', field: 'twitter', svg: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.27 4.27 0 001.88-2.36 8.52 8.52 0 01-2.7 1.03 4.24 4.24 0 00-7.23 3.86A12.04 12.04 0 013 4.79a4.24 4.24 0 001.31 5.66 4.2 4.2 0 01-1.92-.53v.05c0 2.05 1.46 3.76 3.4 4.15a4.27 4.27 0 01-1.91.07 4.25 4.25 0 003.96 2.95A8.51 8.51 0 012 19.54 12.02 12.02 0 008.29 21c7.55 0 11.68-6.26 11.68-11.68 0-.18-.01-.36-.02-.53A8.36 8.36 0 0022.46 6z" />
                      </svg>
                    )},
                    { id: 'pinterest', field: 'github', svg: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M12 0C5.37 0 0 5.37 0 12c0 4.99 3.05 9.26 7.43 11.03-.1-.94-.19-2.39.04-3.42.21-.94 1.36-5.98 1.36-5.98s-.35-.7-.35-1.73c0-1.62.94-2.83 2.12-2.83 1 .07 1.53.75 1.53 1.65 0 1.01-.64 2.52-.97 3.92-.28 1.18.6 2.14 1.78 2.14 2.13 0 3.77-2.23 3.77-5.46 0-2.85-2.06-4.85-5-4.85-3.4 0-5.48 2.56-5.48 5.21 0 1.05.4 2.18.9 2.8.1.12.11.23.08.35-.09.4-.29 1.21-.32 1.38-.05.24-.17.29-.4.17-1.5-.7-2.44-2.89-2.44-4.66 0-3.79 2.76-7.29 8-7.29 4.2 0 7.3 3 7.3 6.99 0 4.28-2.69 7.71-6.42 7.71-1.25 0-2.43-.65-2.83-1.42l-.77 2.92C9.6 22.9 10.6 23 11.65 23 18.28 23 24 17.63 24 11 24 5.37 18.63 0 12 0z" />
                      </svg>
                    )},
                    { id: 'linkedin', field: 'linkedin', svg: (
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065z" />
                      </svg>
                    )}
                  ].map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center space-x-3 p-2 bg-base-100 rounded-lg shadow-sm w-full"
                    >
                      <span className="text-slate-300">{item.svg}</span>
                      {isEditing ? (
                        <input
                          value={draft[item.field]}
                          onChange={onFieldChange(item.field)}
                          className="bg-base-300 rounded px-2 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <span className="w-full">{profile[item.field]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Skills & Interests</h3>
                <div className="p-4 bg-base-100 rounded-lg">
                  {isEditing ? (
                    <div>
                      {/* Skills box with dropdown mechanics */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2">Skills</h4>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 relative">
                          <div className="w-full max-w-xs">
                            <input
                              placeholder="Search skill (e.g. Programming) and click from dropdown"
                              value={skillSearch}
                              onChange={(e) => setSkillSearch(e.target.value)}
                              className="input input-bordered w-full"
                            />
                            {filteredSuggestions.length > 0 && (
                              <div className="mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                                {filteredSuggestions.map((s) => (
                                  <button
                                    type="button"
                                    key={s}
                                    onClick={() => { addSkillToDraft(s); setSkillSearch(''); }}
                                    className="w-full text-left px-3 py-2 hover:bg-base-200"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-base-content/70">
                            Start typing to see matching skills, then click to add.
                          </span>
                        </div>
                      </div>

                      {/* Interests box with its own dropdown */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold mb-2">Interests</h4>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 relative">
                          <div className="w-full max-w-xs">
                            <input
                              placeholder="Search interest (e.g. Baking) and click from dropdown"
                              value={interestSearch}
                              onChange={(e) => setInterestSearch(e.target.value)}
                              className="input input-bordered w-full"
                            />
                            {filteredInterestSuggestions.length > 0 && (
                              <div className="mt-1 w-full bg-base-100 border border-base-300 rounded-lg shadow-lg max-h-48 overflow-y-auto z-10">
                                {filteredInterestSuggestions.map((s) => (
                                  <button
                                    type="button"
                                    key={s}
                                    onClick={() => { addSkillToDraft(s); setInterestSearch(''); }}
                                    className="w-full text-left px-3 py-2 hover:bg-base-200"
                                  >
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                          <span className="text-sm text-base-content/70">
                            Start typing to see matching interests, then click to add.
                          </span>
                        </div>
                      </div>

                      {/* Separate box for custom skills/interests without dropdown */}
                      <div className="flex flex-col md:flex-row items-start md:items-center gap-2 mb-4">
                        <input
                          placeholder="Add custom skill or interest"
                          value={customSkillInput}
                          onChange={(e) => setCustomSkillInput(e.target.value)}
                          className="input input-bordered w-full max-w-xs"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const trimmed = customSkillInput.trim();
                            if (trimmed) {
                              addSkillToDraft(trimmed);
                              setCustomSkillInput('');
                            }
                          }}
                          className="btn btn-sm btn-primary"
                        >
                          Add
                        </button>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {(draft.skills || skills || []).map((skill, index) => (
                          <span key={index} className="inline-flex items-center gap-2 px-4 py-2 bg-base-300 text-primary rounded-full text-base font-medium">
                            <span>{skill}</span>
                            <button type="button" onClick={() => removeSkillFromDraft(index)} className="text-xs text-error ml-2">×</button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-3">
                      {(skills || []).map((skill, index) => (
                        <span
                          key={index}
                          className="px-5 py-3 bg-base-300 text-primary rounded-full text-base font-medium"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="bg-base-200 rounded-xl p-6">
          <h3 className="text-2xl font-bold mb-6">About</h3>
          <div className="space-y-4 mb-8">
            {isEditing ? (
              <textarea
                value={draft.about}
                onChange={onFieldChange('about')}
                rows={6}
                className="w-full bg-base-300 rounded p-3 leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary"
              />
            ) : (
              profile.about.split('\n\n').map((paragraph, idx) => (
                <p key={idx} className="leading-relaxed">{paragraph}</p>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
