import { useState, useEffect, useRef } from "react";
import useAuthUser from "../hooks/useAuthUser";

const ProfileDashboardPage = () => {
  const { authUser } = useAuthUser();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: 'Hans San Miguel',
    location: 'Camarines Sur, Philippines',
    phone: '09479067912',
    twitter: '@loremipsum',
    github: '@loremipsum',
    linkedin: 'loremipsum',
    about:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  });
  const [draft, setDraft] = useState(profile);

  useEffect(() => {
    if (authUser) {
      const key = `profile_${authUser._id}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          setProfile(prev => ({ ...prev, ...parsed }));
          setDraft(prev => ({ ...prev, ...parsed }));
        } catch (err) {
          setProfile(prev => ({ ...prev, name: authUser.name || prev.name, profilePicture: authUser.profilePicture || prev.profilePicture }));
        }
      } else {
        setProfile(prev => ({ ...prev, name: authUser.name || prev.name, profilePicture: authUser.profilePicture || prev.profilePicture }));
      }
    }
  }, [authUser]);

  const [recentActivities, setRecentActivities] = useState([
    { id: 1, description: "Scheduled meeting with Larry", time: "1 hour ago" },
    { id: 2, description: "Connected with 3 new friends", time: "3 hrs ago" },
    { id: 3, description: "Completed appointment", time: "18 hrs ago" },
    { id: 4, description: "Scheduled meeting with Carl", time: "1 day ago" }
  ]);

  const [skills, setSkills] = useState(["Time Management", "Coordination", "Skills Management"]);

  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`/api/users/${authUser._id}/profile`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('No combined profile endpoint');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        if (Array.isArray(data.skills)) setSkills(data.skills);
        if (Array.isArray(data.recentActivities)) setRecentActivities(data.recentActivities);
      })
      .catch(() => {
        Promise.all([
          fetch(`/api/users/${authUser._id}/skills`, { headers }).then((r) => r.ok ? r.json() : null).catch(() => null),
          fetch(`/api/users/${authUser._id}/activities`, { headers }).then((r) => r.ok ? r.json() : null).catch(() => null),
        ])
          .then(([skillsRes, activitiesRes]) => {
            if (cancelled) return;
            if (skillsRes && Array.isArray(skillsRes.skills)) setSkills(skillsRes.skills);
            else if (skillsRes && Array.isArray(skillsRes)) setSkills(skillsRes);

            if (activitiesRes && Array.isArray(activitiesRes.recentActivities)) setRecentActivities(activitiesRes.recentActivities);
            else if (activitiesRes && Array.isArray(activitiesRes)) setRecentActivities(activitiesRes);
          })
          .catch((err) => {
            console.warn('Could not load skills or activities:', err);
          });
      });

    return () => { cancelled = true; };
  }, [authUser]);

  const [stats, setStats] = useState({ friends: 107, appointments: 107, rating: 4.8 });
  useEffect(() => {
    if (!authUser) return;
    let cancelled = false;
    const token = localStorage.getItem('token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers.Authorization = `Bearer ${token}`;

    fetch(`/api/users/${authUser._id}/stats`, { headers })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch stats');
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        setStats((prev) => ({
          friends: data.friends ?? prev.friends,
          appointments: data.appointments ?? prev.appointments,
          rating: data.rating ?? prev.rating,
        }));
      })
      .catch((err) => {
        console.warn('Could not load stats:', err);
      });

    return () => {
      cancelled = true;
    };
  }, [authUser]);

  const startEditing = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft(profile);
  };

  const saveEditing = () => {
    setProfile(draft);
    setIsEditing(false);
    try {
      const key = authUser ? `profile_${authUser._id}` : 'profile_guest';
      localStorage.setItem(key, JSON.stringify(draft));
    } catch (err) {
      console.error('Failed to save profile to localStorage', err);
    }
  };

  const onFieldChange = (field) => (e) => {
    setDraft({ ...draft, [field]: e.target.value });
  };

  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setProfile(prev => ({ ...prev, profilePicture: dataUrl }));
      setDraft(prev => ({ ...prev, profilePicture: dataUrl }));
      // persist immediately
      try {
        const key = authUser ? `profile_${authUser._id}` : 'profile_guest';
        const saved = localStorage.getItem(key);
        const parsed = saved ? JSON.parse(saved) : {};
        const merged = { ...parsed, profilePicture: dataUrl };
        localStorage.setItem(key, JSON.stringify(merged));
      } catch (err) {
        console.error('Failed to save profile picture', err);
      }
    };
    reader.readAsDataURL(file);
    // clear input so same file can be re-selected later if desired
    e.target.value = '';
  };

  return (
    <div className="p-6">
      <div className="bg-base-200 rounded-xl border-t-4 border-primary p-6">
        <div className="flex items-start space-x-6">
          <div className="relative">
            <img
              src={authUser?.profilePicture || profile.profilePicture || "/profile.jpg"}
              alt={profile.name}
              className="w-24 h-24 rounded-full object-cover"
            />
            <div className="mt-2 text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="text-sm text-primary hover:underline"
              >
                Change photo
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-4 mb-4">
              <h1 className="text-3xl font-bold">{profile.name}</h1>
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

            <div className="grid grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
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
                      <span>{profile.phone}</span>
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
                    <div key={item.id} className="flex items-center space-x-3">
                      <span className="text-slate-300">{item.svg}</span>
                      {isEditing ? (
                        <input
                          value={draft[item.field]}
                          onChange={onFieldChange(item.field)}
                          className="bg-base-300 rounded px-2 py-1 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      ) : (
                        <span>{profile[item.field]}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                <div className="grid grid-cols-3 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary">{stats.friends}</div>
                    <div className="text-sm opacity-75">Friends</div>
                  </div>
                  <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{stats.appointments}</div>
                    <div className="text-sm opacity-75">Appointments</div>
                  </div>
                  <div className="text-center">
                      <div className="text-3xl font-bold text-primary">{stats.rating}</div>
                    <div className="text-sm opacity-75">Rating/s</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-8 mt-6">
        <div className="flex-1">
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
            <div>
              <h3 className="text-2xl font-bold mb-4">Skills & Interests</h3>
              <div className="flex flex-wrap gap-3">
                {skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-base-300 text-primary rounded-full text-sm font-medium"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="bg-base-200 rounded-xl p-6">
            <h3 className="text-2xl font-bold mb-6">Recent Activity</h3>
            <div className="space-y-4">
              {recentActivities.map((activity) => (
                <div key={activity.id} className="py-4 border-b border-base-300 last:border-b-0">
                  <div className="flex items-center justify-between">
                    <p className="text-base">{activity.description}</p>
                    <span className="text-sm opacity-75">{activity.time}</span>
                  </div>
                </div>
              ))}
              <button className="text-primary hover:text-primary-focus text-sm font-medium mt-4 transition-colors">
                See more...
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboardPage;