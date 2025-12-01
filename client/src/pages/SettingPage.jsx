import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ThemeSelector from "../components/ThemeSelector";
import useLogout from "../hooks/useLogout";
import { toast } from "react-hot-toast";
import { getMySettings, updateMySettings, changePassword, deleteMyAccount } from "../lib/api";
import { axiosInstance } from "../lib/axios";
import { useQueryClient } from "@tanstack/react-query";

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

  const [activeTab, setActiveTab] = useState("Privacy Controls");

  // Privacy Settings State
  const [privacySettings, setPrivacySettings] = useState({
    appointmentRequestsFrom: "everyone",
    showAvailability: "everyone",
    profileVisibility: "public",
  });
  const [isUpdatingPrivacy, setIsUpdatingPrivacy] = useState(false);

  // Load user preferences
  useEffect(() => {
    if (authUser?.preferences?.privacy) {
      setPrivacySettings(prev => ({ ...prev, ...authUser.preferences.privacy }));
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
    <div className="p-6">
      <div className="bg-base-200 rounded-xl border-t-4 border-primary p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="flex items-center gap-3">
            <ThemeSelector />
            <button className="btn btn-ghost" onClick={() => logoutMutation()}>Logout</button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <button
            onClick={() => setActiveTab("Privacy Controls")}
            aria-pressed={activeTab === "Privacy Controls"}
            className={`btn btn-ghost btn-sm rounded-full ${activeTab === "Privacy Controls" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Privacy Controls
          </button>

          <button
            onClick={() => setActiveTab("Security")}
            aria-pressed={activeTab === "Security"}
            className={`btn btn-ghost btn-sm rounded-full ${activeTab === "Security" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Security
          </button>
        </div>

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
    </div>
  );
};

export default SettingPage;
