import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon, LayoutDashboard, HelpCircle, Settings, PaletteIcon } from "lucide-react";
import useLogout from "../hooks/useLogout";
import { getFriendRequests, getNotifications } from "../lib/api";
import ConfirmDialog from './ConfirmDialog';
import FAQsModal from './FAQsModal';
import ThemeSelector from './ThemeSelector';
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useThemeStore();
  const isChatPage = location.pathname?.startsWith("/chat/") && !location.pathname?.startsWith("/chats");
  const isOnboarded = authUser?.isOnboarded;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFAQs, setShowFAQs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { logoutMutation } = useLogout();

  // Fetch friend requests
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    enabled: Boolean(isOnboarded),
  });

  // Fetch notifications (for appointments)
  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: Boolean(isOnboarded),
  });

  // Count unread appointment notifications
  const unreadAppointments = notifications.filter(
    (notif) => notif.type === 'appointment' && !notif.isRead
  ).length;

  // Count unseen incoming friend requests
  const unseenFriendRequests = friendRequests?.incomingReqs?.filter(
    (req) => !req.recipientSeen
  ).length || 0;

  // Count unseen accepted friend requests (new connections)
  const unseenNewConnections = friendRequests?.acceptedReqs?.filter(
    (req) => !req.senderSeen
  ).length || 0;

  // Total notification count
  const notificationsCount = unreadAppointments + unseenFriendRequests + unseenNewConnections;

  const unreadNotificationsCount = notifications.filter((notif) => !notif.isRead).length || 0;


  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate("/homepage");
  };

  const handleLogout = () => {
    logoutMutation();
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="hidden lg:flex bg-base-200 border-b border-base-300 fixed top-0 right-0 z-40 h-16 items-center" style={{ left: 'var(--navbar-left, 0)' }}>
      <div className="w-full px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between w-full h-16">
          {/* Right: Actions */}
          <div className="flex items-center gap-1 sm:gap-2 lg:gap-4 ml-auto pr-2">
            {/* Notifications - Always visible */}
            <Link to={"/notifications"}>
              <div className="indicator">
                {notificationsCount > 0 && (
                  <span className="indicator-item badge badge-error text-white font-semibold text-xs min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 translate-x-[-2px] translate-y-[2px]">
                    {notificationsCount}
                  </span>
                )}
                <button className="btn btn-ghost btn-circle btn-sm sm:btn-md">
                  <BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-base-content opacity-70" />
                </button>
              </div>
            </Link>

            {/* Profile Dropdown - All Devices */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowProfileMenu(!showProfileMenu);
                  setShowThemeMenu(false);
                }}
                className="avatar cursor-pointer hover:opacity-80 transition-opacity"
                title="Profile menu"
                aria-label="Profile and settings menu"
              >
                <div className="w-9 sm:w-10 rounded-full ring-2 ring-offset-1 ring-base-300 hover:ring-primary transition-all">
                  <img
                    src={authUser?.profilePic && authUser.profilePic.trim() ? authUser.profilePic : '/default-profile.png'}
                    alt={`${authUser?.fullName || 'User'} avatar`}
                    onError={(e) => {
                      e.target.src = '/default-profile.png';
                    }}
                  />
                </div>
              </button>

              {/* Profile Dropdown Menu */}
              {showProfileMenu && (
                <div className="absolute right-0 top-12 bg-base-100 border border-base-300 rounded-xl shadow-2xl z-50 min-w-64 py-1 overflow-hidden">
                  {/* User Info Header */}
                  <div className="px-5 py-3 border-b border-base-300 bg-gradient-to-r from-base-100 to-base-200">
                    <p className="font-semibold text-sm text-base-content">{authUser?.fullName || 'User'}</p>
                    <p className="text-xs text-base-content/50 mt-0.5">{authUser?.email}</p>
                  </div>

                  {/* Profile Link */}
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-5 py-2 hover:bg-base-200 transition-colors group"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <div className="avatar">
                      <div className="w-8 rounded-full ring-2 ring-base-300 group-hover:ring-primary transition-all">
                        <img
                          src={authUser?.profilePic && authUser.profilePic.trim() ? authUser.profilePic : '/default-profile.png'}
                          alt={`${authUser?.fullName || 'User'} avatar`}
                          onError={(e) => {
                            e.target.src = '/default-profile.png';
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-base-content">View Profile</p>
                      <p className="text-xs text-base-content/50">Manage your account</p>
                    </div>
                  </Link>

                  {/* Settings Link */}
                  <Link
                    to="/settings"
                    className="flex items-center gap-3 px-5 py-2 hover:bg-base-200 transition-colors group"
                    onClick={() => setShowProfileMenu(false)}
                  >
                    <Settings className="h-5 w-5 text-base-content/60 group-hover:text-primary flex-shrink-0 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-base-content">Settings</p>
                      <p className="text-xs text-base-content/50">Preferences & security</p>
                    </div>
                  </Link>

                  {/* Theme Selector */}
                  <div className="relative">
                    <button
                      onClick={() => setShowThemeMenu(!showThemeMenu)}
                      className="w-full flex items-center gap-3 px-5 py-2 hover:bg-base-200 transition-colors group"
                    >
                      <PaletteIcon className="h-5 w-5 text-base-content/60 group-hover:text-primary flex-shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0 text-left">
                        <p className="text-sm font-medium text-base-content">Theme</p>
                        <p className="text-xs text-base-content/50">Change appearance</p>
                      </div>
                    </button>

                    {/* Theme Menu */}
                    {showThemeMenu && (
                      <div className="absolute left-0 right-0 top-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 p-2 max-h-60 overflow-y-auto">
                        {THEMES.map((themeOption) => (
                          <button
                            key={themeOption.name}
                            className={`w-full px-3 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm ${
                              theme === themeOption.name
                                ? "bg-primary/20 text-primary font-medium"
                                : "hover:bg-base-200"
                            }`}
                            onClick={() => {
                              setTheme(themeOption.name);
                              setShowThemeMenu(false);
                            }}
                          >
                            <span className="flex-1 text-left">{themeOption.label}</span>
                            <div className="flex gap-1">
                              {themeOption.colors.map((color, i) => (
                                <span
                                  key={i}
                                  className="size-2 rounded-full"
                                  style={{ backgroundColor: color }}
                                />
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* FAQ */}
                  <button
                    onClick={() => {
                      setShowFAQs(true);
                      setShowProfileMenu(false);
                    }}
                    className="w-full flex items-center gap-3 px-5 py-2 hover:bg-base-200 transition-colors text-left group"
                  >
                    <HelpCircle className="h-5 w-5 text-base-content/60 group-hover:text-primary flex-shrink-0 transition-colors" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-base-content">Help & FAQs</p>
                      <p className="text-xs text-base-content/50">Find answers fast</p>
                    </div>
                  </button>

                  {/* Logout */}
                  <div className="border-t border-base-300 mt-0 pt-0">
                    <button
                      onClick={() => {
                        setShowLogoutConfirm(true);
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-5 py-2 hover:bg-error/10 transition-colors group"
                    >
                      <LogOutIcon className="h-5 w-5 text-error/70 group-hover:text-error flex-shrink-0 transition-colors" />
                      <p className="text-sm font-medium text-error">Logout</p>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        onConfirm={handleLogout}
        title="Confirm Logout"
        message="Are you sure you want to log out? You will need to sign in again to access your account."
        confirmText="Logout"
        cancelText="Cancel"
        variant="warning"
      />

      <FAQsModal isOpen={showFAQs} onClose={() => setShowFAQs(false)} />
    </nav>
  );
};
export default Navbar;