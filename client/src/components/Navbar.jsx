import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon, LayoutDashboard, HelpCircle } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { getFriendRequests, getNotifications } from "../lib/api";
import ConfirmDialog from './ConfirmDialog';
import FAQsModal from './FAQsModal';

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname?.startsWith("/chat/") && !location.pathname?.startsWith("/chats");
  const isOnboarded = authUser?.isOnboarded;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showFAQs, setShowFAQs] = useState(false);
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
    <nav className="bg-base-200 border-b border-base-300 fixed top-0 right-0 z-40 h-16 flex items-center" style={{ left: 'var(--navbar-left, 0)' }}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex items-center justify-end w-full">
          {isChatPage && (
            <div className="pl-5">
              <Link to="/" className="flex items-center gap-2.5">
                <ShipWheelIcon className="size-9 text-primary" />
                <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
                  Appoint.
                </span>
              </Link>
            </div>
          )}

          <div className="flex items-center gap-6 sm:gap-4 ml-auto">
            <button
              onClick={() => setShowFAQs(true)}
              className="btn btn-ghost btn-circle"
              title="Help & FAQs"
              aria-label="Help and FAQs"
            >
              <HelpCircle className="h-6 w-6 text-base-content opacity-70" />
            </button>

            <Link to={"/notifications"}>
              <div className="indicator">
                {notificationsCount > 0 && (
                  <span className="indicator-item badge badge-error text-white font-semibold text-xs min-w-[1.25rem] h-5 flex items-center justify-center px-1.5 translate-x-[-2px] translate-y-[2px]">
                    {notificationsCount}
                  </span>
                )}
                <button className="btn btn-ghost btn-circle">
                  <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                </button>
              </div>
            </Link>

            <ThemeSelector />

            <Link to="/profile" className="avatar" aria-label="profile">
              <div className="w-9 rounded-full cursor-pointer">
                <img
                  src={authUser?.profilePic && authUser.profilePic.trim() ? authUser.profilePic : '/default-profile.png'}
                  alt={`${authUser?.fullName || 'User'} avatar`}
                  onError={(e) => {
                    e.target.src = '/default-profile.png';
                  }}
                />
              </div>
            </Link>

            <button className="btn btn-ghost btn-circle" onClick={() => setShowLogoutConfirm(true)}>
              <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
            </button>
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