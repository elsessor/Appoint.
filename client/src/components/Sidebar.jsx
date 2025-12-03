import { Link, useLocation } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";
import {
  BellIcon,
  LayoutDashboard,
  ShipWheelIcon,
  UsersIcon,
  Settings as SettingsIcon,
  CalendarIcon,
  CalendarCheckIcon,
  FileText,
  MessageCircle,
  Shield,
} from "lucide-react";
import AvailabilityStatusToggle from "./AvailabilityStatusToggle";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const currentPath = location.pathname;

  const isAdmin = authUser?.role === "admin";

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen fixed top-0 left-0 z-30">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            Appoint.
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {/* Home intentionally hidden from sidebar menu */}
        {isAdmin ? (
          <Link
            to="/admin"
            className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
              currentPath === "/admin" ? "btn-active" : ""
            }`}
          >
            <Shield className="size-5 text-base-content opacity-70" />
            <span>Admin Dashboard</span>
          </Link>
        ) : (
          <>
            {/* Root/home link removed from menu */}

            <Link
              to="/friends"
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                currentPath === "/friends" ? "btn-active" : ""
              }`}
            >
              <UsersIcon className="size-5 text-base-content opacity-70" />
              <span>Friends</span>
            </Link>

            <Link
              to="/appointments"
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                currentPath === "/appointments" ? "btn-active" : ""
              }`}
            >
              <CalendarCheckIcon className="size-5 text-base-content opacity-70" />
              <span>Appointments</span>
            </Link>

            <Link
              to="/booking"
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                currentPath === "/booking" ? "btn-active" : ""
              }`}
            >
              <CalendarIcon className="size-5 text-base-content opacity-70" />
              <span>Book Appointment</span>
            </Link>

            <Link
              to="/notifications"
              className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
                currentPath === "/notifications" ? "btn-active" : ""
              }`}
            >
              <BellIcon className="size-5 text-base-content opacity-70" />
              <span>Notifications</span>
            </Link>

        <Link
          to="/settings"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/settings" ? "btn-active" : ""
          }`}
        >
          <SettingsIcon className="size-5 text-base-content opacity-70" />
          <span>Settings</span>
        </Link>

        <Link
         to="/meeting-minutes" className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300">
        <FileText className="size-5 text-base-content opacity-70" />
        <span className="font-medium">Meeting Log</span>
        </Link>
        <Link
          to="/chats"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath.startsWith("/chats") ? "btn-active" : ""
          }`}
        >
          <MessageCircle className="size-5 text-base-content opacity-70" />
          <span>Messages</span>
        </Link>
          </>
        )}
      </nav>

      <div className="p-4 border-t border-base-300 mt-auto space-y-2">
        <Link
          to="/settings"
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/settings" ? "btn-active" : ""
          }`}
        >
          <SettingsIcon className="size-5 text-base-content opacity-70" />
          <span>Settings</span>
        </Link>
        
        <div className="flex items-center gap-3 pt-2">
          <Link to="/profile" className="avatar">
            <div className="w-10 rounded-full cursor-pointer">
              {authUser?.profilePic && authUser.profilePic.trim() ? (
                <img src={authUser.profilePic} alt="User Avatar" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold">
                  {(authUser?.fullName || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{authUser?.fullName}</p>
            <p className="text-xs text-base-content/70 flex items-center gap-1 mt-1">
              {isAdmin ? (
                <>
                  <Shield className="size-3" />
                  Admin
                </>
              ) : (
                <>
                  <span className="size-2 rounded-full bg-success inline-block" />
                  Online
                </>
              )}
            </p>
          </div>

          {!isAdmin && <AvailabilityStatusToggle currentUser={authUser} />}
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
