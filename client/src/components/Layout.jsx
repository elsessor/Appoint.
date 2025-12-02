import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

const Layout = ({ children, showSidebar = false }) => {
  return (
    <div className="min-h-screen bg-base-100">
      {showSidebar && <Sidebar />}

      <div className={`flex flex-col bg-base-100 min-h-screen ${showSidebar ? 'lg:ml-64' : ''}`}>
        <Navbar />

        <main className="flex-1 bg-base-100">{children}</main>
      </div>
    </div>
  );
};
export default Layout;
