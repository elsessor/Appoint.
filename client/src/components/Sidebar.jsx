import { Link, useLocation } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  LayoutDashboard,
  ShipWheelIcon,
  UsersIcon,
  Settings as SettingsIcon,
  CalendarIcon,
  CalendarCheckIcon,
  FileText,
  MessageCircle,
  Shield,
  LogOutIcon,
  HelpCircle,
  PaletteIcon,
  BellIcon,
} from "lucide-react";
import AvailabilityStatusToggle from "./AvailabilityStatusToggle";
import { useThemeStore } from "../store/useThemeStore";
import { THEMES } from "../constants";
import useLogout from "../hooks/useLogout";
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getFriendRequests, getNotifications } from "../lib/api";
import { getSocket } from "../lib/socket";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;
  const isAdmin = authUser?.role === "admin";
  const { theme, setTheme } = useThemeStore();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const { logoutMutation } = useLogout();
  const isOnboarded = authUser?.isOnboarded;

  // Fetch friend requests
  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    enabled: Boolean(isOnboarded),
  });

  // Fetch notifications
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

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 lg:hidden bg-base-200 border-t border-base-300 z-50">
        <div className="flex items-center justify-around h-16 px-1">
          {isAdmin ? (
            <Link
              to="/admin"
              className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                currentPath === "/admin" 
                  ? "bg-primary/20 text-primary" 
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="text-xs">Admin</span>
            </Link>
          ) : (
            <>
              <Link
                to="/homepage"
                className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                  currentPath === "/homepage" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs">Home</span>
              </Link>

              <Link
                to="/friends"
                className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                  currentPath === "/friends" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <UsersIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs">Friends</span>
              </Link>

              <Link
                to="/appointments"
                className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                  currentPath === "/appointments" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <CalendarCheckIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs">Appts</span>
              </Link>

              <Link
                to="/chats"
                className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                  currentPath.startsWith("/chats") 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs">Chat</span>
              </Link>

              <Link
                to="/notifications"
                className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 relative ${
                  currentPath === "/notifications" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                {notificationsCount > 0 && (
                  <span className="absolute top-1 right-1 bg-error text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-semibold">
                    {notificationsCount}
                  </span>
                )}
                <BellIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs">Notifs</span>
              </Link>

              <Link
                to="/booking"
                className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                  currentPath === "/booking" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <CalendarIcon className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs">Booking</span>
              </Link>

              <Link
                to="/meeting-minutes"
                className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                  currentPath === "/meeting-minutes" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span className="text-xs">Logs</span>
              </Link>

              {/* Profile Dropdown Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileMenu(!showProfileMenu);
                    setShowThemeMenu(false);
                  }}
                  className={`flex flex-col items-center justify-center gap-1 px-1.5 py-2 rounded-lg flex-1 transition-colors duration-200 ${
                    showProfileMenu
                      ? "bg-primary/20 text-primary"
                      : "text-base-content/70 hover:text-base-content"
                  }`}
                >
                  <div className="avatar">
                    <div className="w-5 rounded-full">
                      <img
                        src={authUser?.profilePic && authUser.profilePic.trim() ? authUser.profilePic : '/default-profile.png'}
                        alt={`${authUser?.fullName || 'User'} avatar`}
                        onError={(e) => {
                          e.target.src = '/default-profile.png';
                        }}
                      />
                    </div>
                  </div>
                  <span className="text-xs">Profile</span>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileMenu && (
                  <div className="absolute bottom-20 right-0 bg-base-100 border border-base-300 rounded-xl shadow-2xl z-50 min-w-56 py-1 overflow-hidden">
                    {/* User Info Header */}
                    <div className="px-4 py-3 border-b border-base-300 bg-gradient-to-r from-base-100 to-base-200">
                      <p className="font-semibold text-sm text-base-content">{authUser?.fullName || 'User'}</p>
                      <p className="text-xs text-base-content/50 mt-0.5">{authUser?.email}</p>
                    </div>

                    {/* Profile Link */}
                    <Link
                      to="/profile"
                      className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors group"
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
                      className="flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors group"
                      onClick={() => setShowProfileMenu(false)}
                    >
                      <SettingsIcon className="h-5 w-5 text-base-content/60 group-hover:text-primary flex-shrink-0 transition-colors" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-base-content">Settings</p>
                        <p className="text-xs text-base-content/50">Preferences & security</p>
                      </div>
                    </Link>

                    {/* Theme Selector */}
                    <div className="relative">
                      <button
                        onClick={() => setShowThemeMenu(!showThemeMenu)}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors group"
                      >
                        <PaletteIcon className="h-5 w-5 text-base-content/60 group-hover:text-primary flex-shrink-0 transition-colors" />
                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-sm font-medium text-base-content">Theme</p>
                          <p className="text-xs text-base-content/50">Change appearance</p>
                        </div>
                      </button>

                      {/* Theme Menu */}
                      {showThemeMenu && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-base-100 border border-base-300 rounded-lg shadow-lg z-50 p-2 max-h-48 overflow-y-auto">
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
                        // You can implement FAQ modal here or navigate to a help page
                        setShowProfileMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2 hover:bg-base-200 transition-colors text-left group"
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
                          logoutMutation();
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2 hover:bg-error/10 transition-colors group"
                      >
                        <LogOutIcon className="h-5 w-5 text-error/70 group-hover:text-error flex-shrink-0 transition-colors" />
                        <p className="text-sm font-medium text-error">Logout</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="group w-20 hover:w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen fixed top-0 left-0 z-50 transition-all duration-300 ease-in-out overflow-hidden">
        <div className="p-4">
          <Link to="/" className="flex items-center gap-3 px-1 py-5 rounded-lg w-full hover:opacity-80 transition-opacity duration-200">
            <ShipWheelIcon className="w-10 h-10 text-primary flex-shrink-0" />
            <span className="block lg:opacity-0 lg:invisible lg:group-hover:opacity-100 lg:group-hover:visible whitespace-nowrap text-lg sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary transition-all duration-300 delay-75">
              Appoint.
            </span>
          </Link>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          {isAdmin ? (
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
                currentPath === "/admin" 
                  ? "bg-primary/20 text-primary" 
                  : "text-base-content/70 hover:text-base-content"
              }`}
            >
              <Shield className="w-5 h-5 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Admin Dashboard</span>
            </Link>
          ) : (
            <>
              <Link
                to="/homepage"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
                  currentPath === "/homepage" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <LayoutDashboard className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Dashboard</span>
              </Link>

              <Link
                to="/friends"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
                  currentPath === "/friends" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <UsersIcon className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Friends</span>
              </Link>

              <Link
                to="/appointments"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
                  currentPath === "/appointments" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <CalendarCheckIcon className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Appointments</span>
              </Link>

              <Link
                to="/booking"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
                  currentPath === "/booking" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <CalendarIcon className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Book Appointment</span>
              </Link>

              <Link
                to="/meeting-minutes"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
                  currentPath === "/meeting-minutes" 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <FileText className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Meeting Log</span>
              </Link>

              <Link
                to="/chats"
                className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
                  currentPath.startsWith("/chats") 
                    ? "bg-primary/20 text-primary" 
                    : "text-base-content/70 hover:text-base-content"
                }`}
              >
                <MessageCircle className="w-5 h-5 flex-shrink-0" />
                <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Messages</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-base-300 space-y-2 flex-shrink-0">
          <Link
            to="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-lg w-full whitespace-nowrap transition-colors duration-200 ${
              currentPath === "/settings" 
                ? "bg-primary/20 text-primary" 
                : "text-base-content/70 hover:text-base-content"
            }`}
          >
            <SettingsIcon className="w-5 h-5 flex-shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 invisible group-hover:visible text-sm transition-all duration-300 delay-75">Settings</span>
          </Link>

          <div className="flex items-center gap-3 pt-2">
            <Link to="/profile" className="avatar flex-shrink-0 relative">
              <div className="w-10 h-10 rounded-full cursor-pointer ring-2 ring-offset-2 ring-offset-base-200 ring-base-300">
                {authUser?.profilePic && authUser.profilePic.trim() ? (
                  <img src={authUser.profilePic} alt="User Avatar" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                    {(authUser?.fullName || 'U')[0].toUpperCase()}
                  </div>
                )}
              </div>
              {!isAdmin && (
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-success rounded-full ring-2 ring-base-200 flex-shrink-0"></span>
              )}
            </Link>
            <div className="flex-1 min-w-0 opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 delay-75">
              <p className="font-semibold text-sm truncate">{authUser?.fullName}</p>
              <p className="text-xs text-base-content/70 flex items-center gap-1 mt-1">
                {isAdmin ? (
                  <>
                    <Shield className="w-3 h-3 flex-shrink-0" />
                    <span>Admin</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-success inline-block flex-shrink-0" />
                    <span>Online</span>
                  </>
                )}
              </p>
            </div>

            {!isAdmin && (
              <div className="opacity-0 group-hover:opacity-100 invisible group-hover:visible transition-all duration-300 delay-75">
                <AvailabilityStatusToggle currentUser={authUser} />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
export default Sidebar;
