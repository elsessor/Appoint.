import Sidebar from "./Sidebar";
import Navbar from "./Navbar";
import AppointmentDueModal from "./AppointmentDueModal";
import { useAppointmentReminder } from "../hooks/useAppointmentReminder";

const Layout = ({ children, showSidebar = false }) => {
  const { upcomingAppointment, showModal, handleJoinCall, handleDeclineCall } = useAppointmentReminder();

  return (
    <div className="min-h-screen bg-base-100" style={{ '--navbar-left': showSidebar ? '80px' : '0' }}>
      {showSidebar && <Sidebar />}

      <div className={`flex flex-col bg-base-100 min-h-screen ${showSidebar ? 'lg:ml-20' : ''}`}>
        <div className="h-16"></div>
        <Navbar />

        <main className="flex-1 bg-base-100 pb-16 lg:pb-0">{children}</main>
      </div>

      {/* Appointment Due Modal */}
      <AppointmentDueModal
        appointment={upcomingAppointment}
        isOpen={showModal}
        onJoin={handleJoinCall}
        onDecline={handleDeclineCall}
        otherUserName={upcomingAppointment?.friendId?.fullName || 'Your Friend'}
      />
    </div>
  );
};
export default Layout;
