import { Link, useNavigate } from "react-router";
import { Home, Users, Bell, LogOut, Calendar as CalendarIcon } from "lucide-react";
import useAuthUser from "../hooks/useAuthUser";

const Layout = ({ children, showSidebar = false }) => {
  const navigate = useNavigate();
  const { authUser } = useAuthUser();
  return (
    <div className="min-h-screen flex bg-base-100" data-theme="night">
      {/* Sidebar */}
      {showSidebar && (
        <aside className="w-64 bg-base-200 text-white flex flex-col justify-between p-6 hidden lg:flex">
          <div>
            <Link to="/homepage" className="flex items-center gap-3 mb-8">
              <span className="text-3xl font-extrabold text-primary">Appoint.</span>
            </Link>

            <nav className="space-y-3">
              <Link to="/homepage" className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300">
                <Home className="size-5 text-primary" />
                <span className="font-medium">Home</span>
              </Link>

              <Link to="/friends" className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300">
                <Users className="size-5 text-primary" />
                <span className="font-medium">Friends</span>
              </Link>

              <Link to="/calendar" className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300">
                <CalendarIcon className="size-5 text-primary" />
                <span className="font-medium">Calendar</span>
              </Link>

              <Link to="/notifications" className="flex items-center gap-3 p-3 rounded-lg hover:bg-base-300">
                <Bell className="size-5 text-primary" />
                <span className="font-medium">Notifications</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/profile")}>
            <div className="relative">
               <div className="w-12 h-12 rounded-full overflow-hidden">
                 <img src={authUser?.profilePicture || "/profile.jpg"} alt="user" className="w-full h-full object-cover" />
               </div>
            </div>
            <div>
              <div className="font-semibold">{authUser?.name || "User"}</div>
              <div className="text-xs text-success">Online</div>
            </div>
          </div>
        </aside>
      )}

      {/* Main content area */}
      <div className="flex-1">
        {/* Top bar */}
        <header className="flex items-center justify-between px-6 py-4 bg-transparent">
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-2xl">
              <input
                className="input input-sm input-bordered w-full bg-base-200"
                placeholder="Search appointments, chats, or meeting notes..."
              />
            </div>
          </div>

          <div className="flex items-center gap-4 px-4">
            <button className="btn btn-ghost btn-circle">
              <Bell />
            </button>
            <div className="w-12 h-12 rounded-full overflow-hidden">
                 <img src="/profile.jpg" alt="user" className="w-full h-full object-cover" />
               </div>
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => {
                localStorage.removeItem("token");
                navigate("/login");
              }}
            >
              <LogOut />
            </button>
          </div>
        </header>

            {children}
      </div>
    </div>
  );
};

export default Layout;
