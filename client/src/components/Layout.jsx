import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen bg-base-100" style={{ '--navbar-left': showSidebar ? '80px' : '0' }}>
      {showSidebar && <Sidebar />}

      <div className={`flex flex-col bg-base-100 min-h-screen ${showSidebar ? 'lg:ml-20' : ''}`}>
        <div className="h-16"></div>
        <Navbar />

        <main className="flex-1 bg-base-100 pb-16 lg:pb-0">{children}</main>
      </div>
    </div>
  );
};
export default Layout;
