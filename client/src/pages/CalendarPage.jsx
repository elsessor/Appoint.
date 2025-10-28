import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Calendar from "../components/Calendar";
import AppointmentModal from "../components/AppointmentModal";
import { getMyFriends } from "../lib/api";
import PageLoader from "../components/PageLoader";

const CalendarPage = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [appointments, setAppointments] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedFriendId, setSelectedFriendId] = useState('');

  const { data: friends = [], isLoading: loadingFriends } = useQuery({
    queryKey: ["friends"],
    queryFn: getMyFriends
  });

  const handleCreateAppointment = (appointmentData) => {
    const normalized = {
      ...appointmentData,
      id: Date.now(),
      user: { fullName: "You" },
      status: "pending",
    };

    setAppointments((prev) => [...prev, normalized]);
  };

  return (
    <div className="p-6 lg:p-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Calendar</h1>
        </div>

        <Calendar
          onNewAppointment={() => setIsModalOpen(true)}
          appointments={appointments}
          friends={friends}
          selectedFriendId={selectedFriendId}
          onSelectFriend={setSelectedFriendId}
        />

        <div className="mt-6">
          <h3 className="text-md font-semibold">Today's Appointments ({new Date().toLocaleDateString()})</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3">
            {appointments.filter(a => a.date === new Date().toISOString().split('T')[0]).length ? (
              appointments
                .filter(a => a.date === new Date().toISOString().split('T')[0])
                .map((apt) => (
                  <div key={apt.id} className="p-3 bg-base-300 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{apt.title}</div>
                        <div className="text-sm opacity-70">with {friends.find(f => String(f.id) === String(apt.participant))?.fullName || apt.user?.fullName || 'Friend'}</div>
                      </div>
                      <div className="text-sm opacity-70">{apt.time}</div>
                    </div>
                  </div>
                ))
            ) : (
              <div className="col-span-full p-3 bg-base-300 rounded">No appointments for today</div>
            )}
          </div>
        </div>

        <AppointmentModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onCreate={handleCreateAppointment}
          initialDate={selectedDate}
          appointments={appointments}
          friends={friends}
        />
      </div>
    </div>
  );
};

export default CalendarPage;
