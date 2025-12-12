import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ThemeSelector from "../components/ThemeSelector";
import useLogout from "../hooks/useLogout";
import { toast } from "react-hot-toast";
import { getMySettings, updateMySettings, changePassword, deleteMyAccount } from "../lib/api";
import { axiosInstance } from "../lib/axios";
import { useQueryClient } from "@tanstack/react-query";
import AvailabilitySettings from "../components/AvailabilitySettings";
import { Settings } from "lucide-react";

const SettingPage = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();
  const queryClient = useQueryClient();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [showAvailabilitySettings, setShowAvailabilitySettings] = useState(false);

  const [activeTab, setActiveTab] = useState("Privacy Controls");

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    appointmentRequestsFrom: "everyone",
    showAvailability: "everyone",
    profileVisibility: "public",
  });
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  // Reminder Settings State
  const [defaultReminderTime, setDefaultReminderTime] = useState(15);
  const [isUpdatingReminder, setIsUpdatingReminder] = useState(false);

  // Load user preferences
  useEffect(() => {
    if (authUser?.preferences?.privacy) {
      setPrivacySettings(prev => ({ ...prev, ...authUser.preferences.privacy }));
    }
    if (authUser?.availability?.defaultReminderTime !== undefined) {
      setDefaultReminderTime(authUser.availability.defaultReminderTime);
    }
  }, [authUser]);

  const updatePassword = async () => {
    if (!currentPassword || !newPassword) return toast.error("Please fill passwords");
    if (newPassword.length < 6) return toast.error("New password must be at least 6 characters");
    if (newPassword !== confirmNewPassword) return toast.error("New passwords do not match");
    if (currentPassword === newPassword) return toast.error("New password must be different");

    try {
      setIsUpdatingPassword(true);
      await changePassword({ currentPassword, newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      toast.success("Password updated");
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Failed to update password";
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const updatePrivacySettings = async () => {
    try {
      setIsUpdatingPrivacy(true);
      const response = await axiosInstance.put("/users/preferences/privacy", privacySettings);
      
      // Invalidate and refetch the authUser query to get updated data
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      
      toast.success("Privacy settings updated");
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to update privacy settings";
      toast.error(message);
    } finally {
      setIsUpdatingPrivacy(false);
    }
  };

  const updateReminderTime = async () => {
    try {
      setIsUpdatingReminder(true);
      const response = await axiosInstance.put("/appointments/availability", {
        ...authUser.availability,
        defaultReminderTime: defaultReminderTime,
      });
      
      // Invalidate and refetch the authUser query to get updated data
      await queryClient.invalidateQueries({ queryKey: ["authUser"] });
      await queryClient.invalidateQueries({ queryKey: ["userAvailability"] });
      
      toast.success("Reminder time updated");
    } catch (err) {
      console.error(err);
      const message = err.response?.data?.message || "Failed to update reminder time";
      toast.error(message);
    } finally {
      setIsUpdatingReminder(false);
    }
  };

  const startDeleteProcess = () => {
    setIsDeleteConfirmVisible(true);
    setDeleteConfirmation("");
  };

  const cancelDeleteProcess = () => {
    setIsDeleteConfirmVisible(false);
    setDeleteConfirmation("");
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      return toast.error('Type "DELETE" to confirm');
    }

    try {
      setIsDeletingAccount(true);
      // Backend should interpret this as: schedule deletion in 14 days, not immediate delete
      await deleteMyAccount({ confirmation: deleteConfirmation, gracePeriodDays: 14 });
      toast.success(
        "Your account is scheduled for deletion in 14 days. You can sign back in before then to cancel."
      );
      logoutMutation();
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Failed to schedule account deletion";
      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-100 pt-2 lg:pt-16 pb-16 lg:pb-8 px-2 sm:px-4 animate-fade-in">
      <div className="w-full max-w-full lg:max-w-4xl mx-auto bg-base-200 rounded-xl border-t-4 border-primary p-3 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0 mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">Settings</h1>
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <ThemeSelector />
            {/* Desktop logout button */}
            <button className="btn btn-ghost btn-sm hidden sm:flex" onClick={() => logoutMutation()}>Logout</button>
          </div>
        </div>

        {/* Mobile logout button */}
        <div className="sm:hidden mb-4">
          <button 
            className="btn btn-outline btn-error btn-sm w-full" 
            onClick={() => logoutMutation()}
          >
            Logout
          </button>
        </div>

        <div className="flex items-center gap-1 sm:gap-2 mb-4 sm:mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("Privacy Controls")}
            aria-pressed={activeTab === "Privacy Controls"}
            className={`btn btn-ghost btn-xs sm:btn-sm rounded-full ${activeTab === "Privacy Controls" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Privacy Controls
          </button>

          <button
            onClick={() => setActiveTab("Availability")}
            aria-pressed={activeTab === "Availability"}
            className={`btn btn-ghost btn-xs sm:btn-sm rounded-full ${activeTab === "Availability" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Availability
          </button>

          <button
            onClick={() => setActiveTab("Security")}
            aria-pressed={activeTab === "Security"}
            className={`btn btn-ghost btn-xs sm:btn-sm rounded-full ${activeTab === "Security" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Security
          </button>
        </div>

        {activeTab === "Availability" && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">Availability Settings</h2>
            <div className="text-xs text-slate-400 mb-4">
              Manage your availability schedule and booking preferences
            </div>
            <div className="grid gap-4">
              <div className="py-3">
                <button
                  onClick={() => setShowAvailabilitySettings(true)}
                  className="btn btn-primary gap-2"
                >
                  <Settings className="w-4 h-4" />
                  Configure Availability
                </button>
                <div className="text-xs text-slate-400 mt-2">
                  Set your working hours, availability status, break times, and appointment limits
                </div>
              </div>

              <div className="py-3 border-t">
                <label className="font-medium block mb-2">Default Appointment Reminder</label>
                <select 
                  className="select select-bordered w-full max-w-xs" 
                  value={defaultReminderTime}
                  onChange={(e) => setDefaultReminderTime(Number(e.target.value))}
                >
                  <option value={0}>No reminder</option>
                  <option value={5}>5 minutes before</option>
                  <option value={10}>10 minutes before</option>
                  <option value={15}>15 minutes before</option>
                  <option value={30}>30 minutes before</option>
                  <option value={60}>1 hour before</option>
                  <option value={120}>2 hours before</option>
                  <option value={1440}>1 day before</option>
                </select>
                <div className="text-xs text-slate-400 mt-1">
                  Default reminder time for your appointments
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    className={`btn btn-primary btn-sm ${isUpdatingReminder ? "loading" : ""}`} 
                    onClick={updateReminderTime}
                    disabled={isUpdatingReminder}
                  >
                    {isUpdatingReminder ? "Saving..." : "Save Reminder Time"}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Privacy Controls" && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">Privacy Controls</h2>
            <div className="text-xs text-slate-400 mb-4">
              Control who can see your profile
            </div>
            <div className="grid gap-4">
              <div className="py-3 border-b">
                <label className="font-medium block mb-2">Profile Visibility</label>
                <select 
                  className="select select-bordered w-full max-w-xs" 
                  value={privacySettings.profileVisibility}
                  onChange={(e) => setPrivacySettings({ ...privacySettings, profileVisibility: e.target.value })}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                </select>
                <div className="text-xs text-slate-400 mt-1">
                  {privacySettings.profileVisibility === "public" 
                    ? "Anyone can view your profile" 
                    : "Only friends can view your profile"}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button 
                  className={`btn btn-primary ${isUpdatingPrivacy ? "loading" : ""}`} 
                  onClick={updatePrivacySettings}
                  disabled={isUpdatingPrivacy}
                >
                  {isUpdatingPrivacy ? "Saving..." : "Save Privacy Settings"}
                </button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Security" && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">Security Settings</h2>
            <div className="grid gap-4">
              <div className="py-3">
                <div className="text-sm font-medium mb-2">Change Password</div>
                <div className="mb-3 text-xs text-slate-400">Provide your current password and a new password to update.</div>
                <div className="grid gap-3">
                  <input 
                    type="password" 
                    placeholder="Current Password" 
                    value={currentPassword} 
                    onChange={(e) => setCurrentPassword(e.target.value)} 
                    className="input input-bordered w-full" 
                  />
                  <input 
                    type="password" 
                    placeholder="New Password" 
                    value={newPassword} 
                    onChange={(e) => setNewPassword(e.target.value)} 
                    className="input input-bordered w-full" 
                  />
                  <input 
                    type="password" 
                    placeholder="Confirm New Password" 
                    value={confirmNewPassword} 
                    onChange={(e) => setConfirmNewPassword(e.target.value)} 
                    className="input input-bordered w-full" 
                  />
                  <div className="pt-2">
                    <button
                      className={`btn btn-primary ${isUpdatingPassword ? "loading" : ""}`}
                      onClick={updatePassword}
                      disabled={isUpdatingPassword}
                    >
                      {isUpdatingPassword ? "Updating..." : "Update Password"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold mb-3">Danger zone</h2>
          <div className="rounded-lg border border-error/50 p-4 space-y-3 bg-base-100">
            <p className="text-sm text-error">
              Deactivate your account and schedule it for permanent deletion in 14 days. You can still
              sign in again within 14 days to cancel. After that, your data will be permanently deleted
              and cannot be recovered.
            </p>
            {!isDeleteConfirmVisible ? (
              <button className="btn btn-outline btn-error" onClick={startDeleteProcess}>
                Delete account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">
                  Step 2: Type <span className="font-semibold">DELETE</span> to confirm you understand
                  your account will be permanently deleted after 14 days.
                </p>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder='Type "DELETE"'
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value.toUpperCase())}
                  disabled={isDeletingAccount}
                />
                <div className="flex gap-2">
                  <button
                    className={`btn btn-error ${isDeletingAccount ? "loading" : ""}`}
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount || deleteConfirmation !== "DELETE"}
                  >
                    {isDeletingAccount ? "Scheduling..." : "Delete Account"}
                  </button>
                  <button className="btn btn-ghost" onClick={cancelDeleteProcess} disabled={isDeletingAccount}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>

      <AvailabilitySettings
        isOpen={showAvailabilitySettings}
        onClose={() => setShowAvailabilitySettings(false)}
        currentUser={authUser}
      />
    </div>
  );
};

export default SettingPage;
