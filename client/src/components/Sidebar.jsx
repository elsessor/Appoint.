import { Link, useLocation, useNavigate } from "react-router";
import useAuthUser from "../hooks/useAuthUser";
import { BellIcon, HomeIcon, ShipWheelIcon, UsersIcon, Settings as SettingsIcon, CalendarIcon, CalendarCheckIcon, FileText, MessageCircle } from "lucide-react";
import AvailabilityStatusToggle from "./AvailabilityStatusToggle";

const Sidebar = () => {
  const { authUser } = useAuthUser();
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;

  const handleHomeClick = (e) => {
    e.preventDefault();
    navigate("/homepage");
  };

  return (
    <aside className="w-64 bg-base-200 border-r border-base-300 hidden lg:flex flex-col h-screen sticky top-0">
      <div className="p-5 border-b border-base-300">
        <Link to="/" className="flex items-center gap-2.5">
          <ShipWheelIcon className="size-9 text-primary" />
          <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
            Appoint.
          </span>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        <button
          onClick={handleHomeClick}
          className={`btn btn-ghost justify-start w-full gap-3 px-3 normal-case ${
            currentPath === "/homepage" ? "btn-active" : ""
          }`}
        >
          <HomeIcon className="size-5 text-base-content opacity-70" />
          <span>Home</span>
        </button>

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
    currentPath.startsWith("/chats") ? "btn-active" : ""  // ✅ Highlight if on /chats
  }`}
>
  <MessageCircle className="size-5 text-base-content opacity-70" />
  <span>Messages</span>
</Link>
      </nav>

      <div className="p-4 border-t border-base-300 mt-auto">
        <div className="flex items-center gap-3">
          <Link to="/profile" className="avatar">
            <div className="w-10 rounded-full cursor-pointer">
              <img 
                src={authUser?.profilePic || '/default-profile.svg'} 
                alt="User Avatar"
                onError={(e) => {
                  e.target.src = '/default-profile.svg';
                }}
              />
            </div>
          </Link>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{authUser?.fullName}</p>
            <p className="text-xs text-success flex items-center gap-1 mt-1">
              <span className="size-2 rounded-full bg-success inline-block" />
              Online
            </p>
          </div>
          
          {/* Availability Status Toggle */}
          <AvailabilityStatusToggle currentUser={authUser} />
        </div>
      </div>
    </aside>
  );
};
export default Sidebar;
