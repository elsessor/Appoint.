import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon, LayoutDashboard } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { getFriendRequests, getNotifications } from "../lib/api";
import ConfirmDialog from "./ConfirmDialog";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const isChatPage = location.pathname?.startsWith("/chat/") && !location.pathname?.startsWith("/chats");
  const isOnboarded = authUser?.isOnboarded;

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const { logoutMutation } = useLogout();

  const { data: friendRequests } = useQuery({
    queryKey: ["friendRequests"],
    queryFn: getFriendRequests,
    enabled: Boolean(isOnboarded),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: Boolean(isOnboarded),
  });

  const friendRequestsCount =
    (friendRequests?.incomingReqs?.filter((req) => !req.recipientSeen).length || 0) +
    (friendRequests?.acceptedReqs?.filter((req) => !req.senderSeen).length || 0);

  const unreadNotificationsCount = notifications.filter((notif) => !notif.isRead).length || 0;

  const notificationsCount = friendRequestsCount + unreadNotificationsCount;

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate("/homepage");
  };

  const handleLogout = () => {
    logoutMutation();
    setShowLogoutConfirm(false);
  };

  return (
    <nav className="bg-base-200 border-b border-base-300 sticky top-0 z-30 h-16 flex items-center">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
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
            <Link to={"/notifications"}>
              <div className="indicator">
                {notificationsCount > 0 && (
                  <span className="indicator-item badge badge-error badge-xs" aria-label="new notifications" />
                )}
                <button className="btn btn-ghost btn-circle">
                  <BellIcon className="h-6 w-6 text-base-content opacity-70" />
                </button>
              </div>
            </Link>

            <ThemeSelector />

            <Link to="/profile" className="avatar">
              <div className="w-9 rounded-full cursor-pointer">
                <img 
                src={authUser?.profilePic || '/default-profile.svg'} 
                alt="User Avatar"
                onError={(e) => {
                  e.target.src = '/default-profile.svg';
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
    </nav>
  );
};
export default Navbar;
