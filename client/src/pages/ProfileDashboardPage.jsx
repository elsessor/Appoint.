import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import useAuthUser from '../hooks/useAuthUser';

const ProfileDashboardPage = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('home');
  const [isEditing, setIsEditing] = useState(false);
  const { authUser } = useAuthUser();
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
    const saved = localStorage.getItem('profile_draft');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProfile(parsed);
        setDraft(parsed);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!authUser) return;
    const perUserKey = `profile_draft_${authUser._id}`;
    const local = localStorage.getItem(perUserKey);
    const mapped = {
      name: authUser.fullName || profile.name,
      location: authUser.location || profile.location,
      about: authUser.bio || profile.about,
      phone: profile.phone,
      twitter: profile.twitter,
      github: profile.github,
      linkedin: profile.linkedin,
    };
    const next = local ? { ...mapped, ...JSON.parse(local) } : mapped;
    setProfile(next);
    setDraft(next);
  }, [authUser]);

  const recentActivities = [
    { id: 1, description: "Scheduled meeting with Larry", time: "1 hour ago" },
    { id: 2, description: "Connected with 3 new friends", time: "3 hrs ago" },
    { id: 3, description: "Completed appointment", time: "18 hrs ago" },
    { id: 4, description: "Scheduled meeting with Carl", time: "1 day ago" }
  ];

  const [skills] = useState(["Time Management", "Coordination", "Skills Management"]);

  const startEditing = () => {
    setDraft(profile);
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setDraft(profile);
  };

  const saveEditing = () => {
    const storageKey = authUser ? `profile_draft_${authUser._id}` : 'profile_draft';
    localStorage.setItem(storageKey, JSON.stringify(draft));
    setProfile(draft);
    setIsEditing(false);
  };

  const onFieldChange = (field) => (e) => {
    setDraft((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const sidebarItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'friends', label: 'Friends', icon: '👥' },
    { id: 'notifications', label: 'Notifications', icon: '🔔' }
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex">
      <div className="w-64 bg-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold">
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Appoint
            </span>
            <span className="text-white">.</span>
          </h1>
        </div>
        <nav className="flex-1 px-4">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                activeTab === item.id
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all"
                onClick={() => navigate('/profile')}
              />
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-slate-800"></div>
            </div>
            <div>
              <p className="text-white font-medium text-sm">Hans San Miguel</p>
              <p className="text-green-400 text-xs">Online</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-300">Profile Dashboard</h2>
            <div className="flex items-center space-x-4">
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-5a7.5 7.5 0 00-15 0v5h5l-5 5-5-5h5v-5a7.5 7.5 0 0115 0v5z" />
                </svg>
              </button>
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-cyan-400 transition-all"
                onClick={() => navigate('/profile')}
              />
              <button className="p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 p-6 space-y-6">
          <div className="bg-slate-800 rounded-xl border-t-4 border-cyan-400 p-6">
            <div className="flex items-start space-x-6">
              <img
                src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&h=120&fit=crop&crop=face"
                alt={profile.name}
                className="w-24 h-24 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-4 mb-4">
                  {isEditing ? (
                    <input
                      value={draft.name}
                      onChange={onFieldChange('name')}
                      className="text-3xl font-bold text-white bg-slate-700 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
                  )}
                  <div className="flex items-center space-x-2 text-green-400 bg-green-900/30 px-3 py-1 rounded-full">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Verified Profile</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 text-slate-400 mb-6">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {isEditing ? (
                    <input
                      value={draft.location}
                      onChange={onFieldChange('location')}
                      className="bg-slate-700 text-slate-200 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    <span>{profile.location}</span>
                  )}
                </div>

                <div className="flex space-x-3 mb-6">
                  {isEditing ? (
                    <>
                      <button
                        onClick={saveEditing}
                        className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span>Save</span>
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>Cancel</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={startEditing}
                      className="flex items-center space-x-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      <span>Edit Profile</span>
                    </button>
                  )}
                  <button className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                    </svg>
                    <span>Share Profile</span>
                  </button>
                  <button className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>View Schedule</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Contact Information</h3>
                    <div className="space-y-3">
                      <div className="flex items-center space-x-3 text-slate-300">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {isEditing ? (
                          <input
                            value={draft.phone}
                            onChange={onFieldChange('phone')}
                            className="bg-slate-700 text-slate-200 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        ) : (
                          <span>{profile.phone}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-slate-300">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                        </svg>
                        {isEditing ? (
                          <input
                            value={draft.twitter}
                            onChange={onFieldChange('twitter')}
                            className="bg-slate-700 text-slate-200 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        ) : (
                          <span>{profile.twitter}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-slate-300">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.746-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24.009c6.624 0 11.99-5.367 11.99-11.988C24.007 5.367 18.641.001.012.001z"/>
                        </svg>
                        {isEditing ? (
                          <input
                            value={draft.github}
                            onChange={onFieldChange('github')}
                            className="bg-slate-700 text-slate-200 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        ) : (
                          <span>{profile.github}</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-3 text-slate-300">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                        </svg>
                        {isEditing ? (
                          <input
                            value={draft.linkedin}
                            onChange={onFieldChange('linkedin')}
                            className="bg-slate-700 text-slate-200 rounded px-2 py-1 w-full max-w-md focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        ) : (
                          <span>{profile.linkedin}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-4">Statistics</h3>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400">107</div>
                        <div className="text-slate-400 text-sm">Friends</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400">107</div>
                        <div className="text-slate-400 text-sm">Appointments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-cyan-400">4.8</div>
                        <div className="text-slate-400 text-sm">Rating/s</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-8">
            <div className="flex-1">
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">About</h3>
                <div className="text-slate-300 space-y-4 mb-8">
                  {isEditing ? (
                    <textarea
                      value={draft.about}
                      onChange={onFieldChange('about')}
                      rows={6}
                      className="w-full bg-slate-700 text-slate-200 rounded p-3 leading-relaxed focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  ) : (
                    profile.about.split('\n\n').map((paragraph, idx) => (
                      <p key={idx} className="leading-relaxed">{paragraph}</p>
                    ))
                  )}
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">Skills & Interests</h3>
                  <div className="flex flex-wrap gap-3">
                    {skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 bg-slate-700 text-cyan-400 rounded-full text-sm font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <div className="bg-slate-800 rounded-xl p-6">
                <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
                <div className="space-y-4">
                  {recentActivities.map((activity, index) => (
                    <div key={activity.id} className="py-4 border-b border-slate-600 last:border-b-0">
                      <div className="flex items-center justify-between">
                        <p className="text-slate-300 text-base">{activity.description}</p>
                        <span className="text-slate-400 text-sm">{activity.time}</span>
                      </div>
                    </div>
                  ))}
                  <button className="text-slate-400 hover:text-cyan-400 text-sm font-medium mt-4 transition-colors">
                    See more...
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileDashboardPage;
