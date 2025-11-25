import { Link, useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, LogOutIcon, ShipWheelIcon } from "lucide-react";
import ThemeSelector from "./ThemeSelector";
import useLogout from "../hooks/useLogout";
import { getFriendRequests, getNotifications } from "../lib/api";

const Navbar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const isChatPage = location.pathname?.startsWith("/chat");
  const isOnboarded = authUser?.isOnboarded;

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

          <div className="flex items-center gap-3 sm:gap-4 ml-auto">
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
          </div>

          <ThemeSelector />

          <Link to="/profile" className="avatar">
            <div className="w-9 rounded-full cursor-pointer">
              <img src={authUser?.profilePic || '/default-profile.png'} alt="User Avatar" />
            </div>
          </Link>

          <button className="btn btn-ghost btn-circle" onClick={logoutMutation}>
            <LogOutIcon className="h-6 w-6 text-base-content opacity-70" />
          </button>
        </div>
      </div>
    </nav>
  );
};
export default Navbar;