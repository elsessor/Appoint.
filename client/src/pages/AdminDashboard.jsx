import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAdminDashboardStats,
  getAdminUsers,
  updateAdminUserRole,
  deleteAdminUser,
  getAdminAppointments,
  deleteAdminAppointment,
} from "../lib/api";
import {
  Shield,
  Users,
  CalendarCheck,
  Bell,
  Trash2,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

const AdminDashboard = () => {
  const queryClient = useQueryClient();
  const [userPage, setUserPage] = useState(1);
  const [appointmentPage, setAppointmentPage] = useState(1);
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");

  const { data: dashboardData, isLoading: isLoadingDashboard } = useQuery({
    queryKey: ["adminDashboard"],
    queryFn: getAdminDashboardStats,
  });

  const { data: usersData, isLoading: isLoadingUsers } = useQuery({
    queryKey: ["adminUsers", userPage, userSearch, userRoleFilter],
    queryFn: () =>
      getAdminUsers({
        page: userPage,
        limit: 8,
        search: userSearch,
        role: userRoleFilter,
      }),
  });

  const { data: appointmentsData, isLoading: isLoadingAppointments } = useQuery({
    queryKey: ["adminAppointments", appointmentPage],
    queryFn: () =>
      getAdminAppointments({
        page: appointmentPage,
        limit: 6,
      }),
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ userId, role }) => updateAdminUserRole(userId, role),
    onSuccess: () => {
      toast.success("User role updated");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to update role");
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: deleteAdminUser,
    onSuccess: () => {
      toast.success("User deleted");
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete user");
    },
  });

  const deleteAppointmentMutation = useMutation({
    mutationFn: deleteAdminAppointment,
    onSuccess: () => {
      toast.success("Appointment deleted");
      queryClient.invalidateQueries({ queryKey: ["adminAppointments"] });
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to delete appointment");
    },
  });

  const handleRoleToggle = (userId, currentRole) => {
    const nextRole = currentRole === "admin" ? "user" : "admin";
    updateRoleMutation.mutate({ userId, role: nextRole });
  };

  const stats = dashboardData?.stats || {};

  return (
    <div className="p-6 sm:p-8 bg-base-100 min-h-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-wide text-primary">Control Center</p>
            <h1 className="text-3xl font-bold">Admin Dashboard</h1>
            <p className="text-base-content/70 mt-1">
              Monitor platform activity, manage users, and keep everything running smoothly.
            </p>
          </div>
          <div className="badge badge-primary gap-2 p-4 text-base">
            <Shield className="w-4 h-4" />
            Admin Mode
          </div>
        </div>

        {isLoadingDashboard ? (
          <div className="flex justify-center py-16">
            <span className="loading loading-spinner loading-lg" />
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers || 0}
                icon={<Users className="w-6 h-6 text-primary" />}
              />
              <StatCard
                title="Admins"
                value={stats.totalAdmins || 0}
                icon={<Shield className="w-6 h-6 text-warning" />}
              />
              <StatCard
                title="Appointments"
                value={stats.totalAppointments || 0}
                icon={<CalendarCheck className="w-6 h-6 text-success" />}
              />
              <StatCard
                title="Notifications"
                value={stats.totalNotifications || 0}
                icon={<Bell className="w-6 h-6 text-info" />}
              />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 card bg-base-200 shadow-sm">
                <div className="card-body space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm uppercase text-base-content/60">Users</p>
                      <h2 className="text-xl font-semibold">Manage Learners</h2>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="input input-bordered flex items-center gap-2">
                        <Search className="w-4 h-4 opacity-70" />
                        <input
                          className="grow"
                          placeholder="Search by name or email"
                          value={userSearch}
                          onChange={(e) => {
                            setUserSearch(e.target.value);
                            setUserPage(1);
                          }}
                        />
                      </label>
                      <select
                        className="select select-bordered"
                        value={userRoleFilter}
                        onChange={(e) => {
                          setUserRoleFilter(e.target.value);
                          setUserPage(1);
                        }}
                      >
                        <option value="">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                  </div>

                  {isLoadingUsers ? (
                    <div className="flex justify-center py-12">
                      <span className="loading loading-spinner loading-lg" />
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {usersData?.users?.length ? (
                          usersData.users.map((user) => (
                            <div
                              key={user._id}
                              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-base-300 p-4 bg-base-100/70"
                            >
                              <div className="flex items-center gap-3">
                                <div className="avatar">
                                  <div className="w-12 rounded-full ring ring-primary/10 ring-offset-base-100">
                                    <img
                                      src={user.profilePic || "/default-profile.png"}
                                      alt={user.fullName}
                                      onError={(e) => {
                                        e.target.src = "/default-profile.png";
                                      }}
                                    />
                                  </div>
                                </div>
                                <div>
                                  <p className="font-semibold">{user.fullName}</p>
                                  <p className="text-sm text-base-content/70">{user.email}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                <span
                                  className={`badge ${user.role === "admin" ? "badge-warning" : "badge-secondary"}`}
                                >
                                  {user.role || "user"}
                                </span>
                                <span
                                  className={`badge ${user.isOnboarded ? "badge-success" : "badge-ghost"}`}
                                >
                                  {user.isOnboarded ? "Onboarded" : "Pending"}
                                </span>
                              </div>

                              <div className="flex items-center gap-2">
                                <button
                                  className="btn btn-sm btn-outline"
                                  onClick={() => handleRoleToggle(user._id, user.role)}
                                >
                                  {user.role === "admin" ? "Remove Admin" : "Make Admin"}
                                </button>
                                <button
                                  className="btn btn-sm btn-error btn-outline"
                                  onClick={() => deleteUserMutation.mutate(user._id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Remove
                                </button>
                              </div>
                            </div>
                          ))
                        ) : (
                          <EmptyState label="No users found" />
                        )}
                      </div>

                      {usersData?.pagination?.pages > 1 && (
                        <Pagination
                          page={usersData.pagination.page}
                          totalPages={usersData.pagination.pages}
                          onPrev={() => setUserPage((p) => Math.max(1, p - 1))}
                          onNext={() => setUserPage((p) => Math.min(usersData.pagination.pages, p + 1))}
                        />
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="card bg-base-200 shadow-sm">
                <div className="card-body space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm uppercase text-base-content/60">Recent Activity</p>
                      <h2 className="text-xl font-semibold">Appointments</h2>
                    </div>
                    <Filter className="w-5 h-5 opacity-60" />
                  </div>

                  {isLoadingAppointments ? (
                    <div className="flex justify-center py-12">
                      <span className="loading loading-spinner loading-lg" />
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {appointmentsData?.appointments?.length ? (
                        appointmentsData.appointments.map((appointment) => (
                          <div
                            key={appointment._id}
                            className="rounded-xl border border-base-300 p-4 bg-base-100/70 space-y-2"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <p className="font-semibold">{appointment.title || "Language Session"}</p>
                                <p className="text-sm text-base-content/70">
                                  {new Date(appointment.startTime).toLocaleString()}
                                </p>
                              </div>
                              <span className="badge badge-primary capitalize">{appointment.status}</span>
                            </div>
                            <div className="text-sm text-base-content/70 space-y-1">
                              <p>
                                With <span className="font-semibold">{appointment.userId?.fullName || "N/A"}</span>
                              </p>
                              <p>
                                Partner <span className="font-semibold">{appointment.friendId?.fullName || "N/A"}</span>
                              </p>
                            </div>
                            <button
                              className="btn btn-sm btn-error btn-outline w-full"
                              onClick={() => deleteAppointmentMutation.mutate(appointment._id)}
                            >
                              <Trash2 className="w-4 h-4" />
                              Remove Appointment
                            </button>
                          </div>
                        ))
                      ) : (
                        <EmptyState label="No appointments scheduled" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon }) => (
  <div className="card bg-base-200 shadow-sm border border-base-300/60">
    <div className="card-body">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-base-content/70">{title}</p>
          <p className="text-3xl font-semibold mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-base-100 border border-base-300/60">{icon}</div>
      </div>
    </div>
  </div>
);

const EmptyState = ({ label }) => (
  <div className="text-center py-6 text-base-content/60 border border-dashed border-base-300 rounded-xl">
    {label}
  </div>
);

const Pagination = ({ page, totalPages, onPrev, onNext }) => (
  <div className="flex items-center justify-center gap-3 pt-2">
    <button className="btn btn-sm btn-outline" onClick={onPrev} disabled={page === 1}>
      <ChevronLeft className="w-4 h-4" />
      Prev
    </button>
    <span className="text-sm">
      Page {page} / {totalPages}
    </span>
    <button className="btn btn-sm btn-outline" onClick={onNext} disabled={page === totalPages}>
      Next
      <ChevronRight className="w-4 h-4" />
    </button>
  </div>
);

export default AdminDashboard;

