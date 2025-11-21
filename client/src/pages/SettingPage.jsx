import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ThemeSelector from "../components/ThemeSelector";
import useLogout from "../hooks/useLogout";
import { toast } from "react-hot-toast";
import { getMySettings, updateMySettings, changePassword, deleteMyAccount } from "../lib/api";

const SettingPage = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();

  // Account
  const [displayName, setDisplayName] = useState(authUser?.fullName || "");
  const [email, setEmail] = useState(authUser?.email || "");

  // Preferences
  const [language, setLanguage] = useState(localStorage.getItem("pref_language") || "English");
  const [timezone, setTimezone] = useState(localStorage.getItem("pref_timezone") || "(UTC+8) Manila");

  // Notifications (detailed)
  const [appointmentReminders, setAppointmentReminders] = useState(Boolean(localStorage.getItem("notify_appointment") === "true"));
  const [newMessages, setNewMessages] = useState(Boolean(localStorage.getItem("notify_messages") === "true"));
  const [appointmentRequests, setAppointmentRequests] = useState(Boolean(localStorage.getItem("notify_requests") === "true"));
  const [emailNotifications, setEmailNotifications] = useState(Boolean(localStorage.getItem("notify_email") === "true"));
  const [smsNotifications, setSmsNotifications] = useState(Boolean(localStorage.getItem("notify_sms") === "true"));
  const [reminderTiming, setReminderTiming] = useState(localStorage.getItem("notify_reminder_timing") || "15 minutes before");

  // Privacy
  const [profileVisible, setProfileVisible] = useState(Boolean(localStorage.getItem("privacy_profile_visible") !== "false"));
  const [onlineStatus, setOnlineStatus] = useState(Boolean(localStorage.getItem("privacy_online_status") === "true"));
  const [readReceipts, setReadReceipts] = useState(Boolean(localStorage.getItem("privacy_read_receipts") === "true"));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleteConfirmVisible, setIsDeleteConfirmVisible] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Video & Audio
  const [camera, setCamera] = useState(localStorage.getItem("va_camera") || "Default Camera");
  const [microphone, setMicrophone] = useState(localStorage.getItem("va_microphone") || "Default Microphone");
  const [speaker, setSpeaker] = useState(localStorage.getItem("va_speaker") || "Default Speaker");
  const [hdVideo, setHdVideo] = useState(Boolean(localStorage.getItem("va_hd") === "true"));
  const [noiseCancellation, setNoiseCancellation] = useState(Boolean(localStorage.getItem("va_noise") === "true"));
  const [autoStartVideo, setAutoStartVideo] = useState(Boolean(localStorage.getItem("va_autostart") === "true"));
  const [mirrorVideo, setMirrorVideo] = useState(Boolean(localStorage.getItem("va_mirror") === "true"));

  // Tabs
  const [activeTab, setActiveTab] = useState("Notifications");

  useEffect(() => {
    setDisplayName(authUser?.fullName || "");
    setEmail(authUser?.email || "");
  }, [authUser]);

  // load settings from backend on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const settings = await getMySettings();
        if (!settings || !mounted) return;

        if (settings.notifications) {
          setAppointmentReminders(Boolean(settings.notifications.appointmentReminders));
          setNewMessages(Boolean(settings.notifications.newMessages));
          setAppointmentRequests(Boolean(settings.notifications.appointmentRequests));
          setEmailNotifications(Boolean(settings.notifications.emailNotifications));
          setSmsNotifications(Boolean(settings.notifications.smsNotifications));
          setReminderTiming(settings.notifications.reminderTiming || reminderTiming);
        }

        if (settings.privacy) {
          setProfileVisible(Boolean(settings.privacy.profileVisible));
          setOnlineStatus(Boolean(settings.privacy.onlineStatus));
          setReadReceipts(Boolean(settings.privacy.readReceipts));
        }

        if (settings.videoAudio) {
          setCamera(settings.videoAudio.camera || camera);
          setMicrophone(settings.videoAudio.microphone || microphone);
          setSpeaker(settings.videoAudio.speaker || speaker);
          setHdVideo(Boolean(settings.videoAudio.hdVideo));
          setNoiseCancellation(Boolean(settings.videoAudio.noiseCancellation));
          setAutoStartVideo(Boolean(settings.videoAudio.autoStartVideo));
          setMirrorVideo(Boolean(settings.videoAudio.mirrorVideo));
        }
      } catch (err) {
        console.warn("Failed to load settings from server, falling back to local values", err?.message || err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const savePreferences = () => {
    try {
      localStorage.setItem("pref_language", language);
      localStorage.setItem("pref_timezone", timezone);
      toast.success("Preferences saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save preferences");
    }
  };

  const saveNotifications = () => {
    (async () => {
      try {
        const res = await updateMySettings({
          notifications: {
            appointmentReminders,
            newMessages,
            appointmentRequests,
            emailNotifications,
            smsNotifications,
            reminderTiming,
          },
        });
        // Optionally update local state from server response
        toast.success("Notification settings saved");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save notification settings");
      }
    })();
  };

  const savePrivacy = () => {
    (async () => {
      try {
        await updateMySettings({
          privacy: { profileVisible, onlineStatus, readReceipts },
        });
        toast.success("Privacy settings saved");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save privacy settings");
      }
    })();
  };

  const saveVideoAudio = () => {
    (async () => {
      try {
        await updateMySettings({
          videoAudio: {
            camera,
            microphone,
            speaker,
            hdVideo,
            noiseCancellation,
            autoStartVideo,
            mirrorVideo,
          },
        });
        toast.success("Video & Audio settings saved");
      } catch (err) {
        console.error(err);
        toast.error("Failed to save Video & Audio settings");
      }
    })();
  };

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
      await deleteMyAccount({ confirmation: deleteConfirmation });
      toast.success("Account deleted");
      logoutMutation();
      setTimeout(() => {
        window.location.href = "/login";
      }, 500);
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Failed to delete account";
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

        {/* Category tabs: Privacy | Notifications | Video & Audio */}
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => setActiveTab("Notifications")}
            aria-pressed={activeTab === "Notifications"}
            className={`btn btn-ghost btn-sm rounded-full ${activeTab === "Notifications" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Notifications
          </button>

          <button
            onClick={() => setActiveTab("Privacy")}
            aria-pressed={activeTab === "Privacy"}
            className={`btn btn-ghost btn-sm rounded-full ${activeTab === "Privacy" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Privacy
          </button>

          <button
            onClick={() => setActiveTab("Video & Audio")}
            aria-pressed={activeTab === "Video & Audio"}
            className={`btn btn-ghost btn-sm rounded-full ${activeTab === "Video & Audio" ? "bg-base-300 text-primary shadow" : ""}`}
          >
            Video & Audio
          </button>
        </div>

        {/* Account and Preferences removed per request */}

        {/* Tab content — render based on activeTab */}
        {activeTab === "Notifications" && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">Notification Preferences</h2>
            <div className="grid gap-4">
              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Appointment Reminders</div>
                  <div className="text-xs text-slate-400">Get reminded about upcoming appointments</div>
                </div>
                <input type="checkbox" className="toggle" checked={appointmentReminders} onChange={(e) => setAppointmentReminders(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">New Messages</div>
                  <div className="text-xs text-slate-400">Receive notifications for new messages</div>
                </div>
                <input type="checkbox" className="toggle" checked={newMessages} onChange={(e) => setNewMessages(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Appointment Requests</div>
                  <div className="text-xs text-slate-400">Get notified when someone books an appointment</div>
                </div>
                <input type="checkbox" className="toggle" checked={appointmentRequests} onChange={(e) => setAppointmentRequests(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Email Notifications</div>
                  <div className="text-xs text-slate-400">Receive notifications via email</div>
                </div>
                <input type="checkbox" className="toggle" checked={emailNotifications} onChange={(e) => setEmailNotifications(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">SMS Notifications</div>
                  <div className="text-xs text-slate-400">Receive notifications via SMS</div>
                </div>
                <input type="checkbox" className="toggle" checked={smsNotifications} onChange={(e) => setSmsNotifications(e.target.checked)} />
              </label>

              <div className="pt-2">
                <div className="text-sm text-slate-400 mb-1">Reminder Timing</div>
                <select value={reminderTiming} onChange={(e) => setReminderTiming(e.target.value)} className="select select-bordered w-60">
                  <option>5 minutes before</option>
                  <option>15 minutes before</option>
                  <option>30 minutes before</option>
                  <option>1 hour before</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button className="btn btn-primary" onClick={saveNotifications}>Save</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Privacy" && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">Privacy & Security</h2>
            <div className="grid gap-4">
              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Profile Visibility</div>
                  <div className="text-xs text-slate-400">Make your profile visible to other users</div>
                </div>
                <input type="checkbox" className="toggle" checked={profileVisible} onChange={(e) => setProfileVisible(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Online Status</div>
                  <div className="text-xs text-slate-400">Show when you're online</div>
                </div>
                <input type="checkbox" className="toggle" checked={onlineStatus} onChange={(e) => setOnlineStatus(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Read Receipts</div>
                  <div className="text-xs text-slate-400">Let others know when you've read their messages</div>
                </div>
                <input type="checkbox" className="toggle" checked={readReceipts} onChange={(e) => setReadReceipts(e.target.checked)} />
              </label>

              <div className="pt-4">
                <div className="text-sm font-medium mb-2">Change Password</div>
                <div className="mb-2 text-xs text-slate-400">Provide your current password and a new password to update.</div>
                <div className="grid gap-2">
                  <input type="password" placeholder="Current Password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="input input-bordered w-full" />
                  <input type="password" placeholder="New Password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input input-bordered w-full" />
                  <input type="password" placeholder="Confirm New Password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="input input-bordered w-full" />
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

              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">Two-Factor Authentication</div>
                    <div className="text-xs text-slate-400">Add an extra layer of security</div>
                  </div>
                  <button className="btn">Enable</button>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="btn btn-primary" onClick={savePrivacy}>Save</button>
              </div>
            </div>
          </section>
        )}

        {activeTab === "Video & Audio" && (
          <section className="mb-6">
            <h2 className="font-semibold mb-3">Video & Audio Settings</h2>
            <div className="grid gap-4">
              <label>
                <div className="text-sm text-slate-400 mb-1">Camera</div>
                <select value={camera} onChange={(e) => setCamera(e.target.value)} className="select select-bordered w-full mb-2">
                  <option>Default Camera</option>
                  <option>External Camera</option>
                </select>
              </label>

              <label>
                <div className="text-sm text-slate-400 mb-1">Microphone</div>
                <select value={microphone} onChange={(e) => setMicrophone(e.target.value)} className="select select-bordered w-full mb-2">
                  <option>Default Microphone</option>
                  <option>External Microphone</option>
                </select>
              </label>

              <label>
                <div className="text-sm text-slate-400 mb-1">Speaker</div>
                <select value={speaker} onChange={(e) => setSpeaker(e.target.value)} className="select select-bordered w-full mb-2">
                  <option>Default Speaker</option>
                  <option>External Speaker</option>
                </select>
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">HD Video</div>
                  <div className="text-xs text-slate-400">Enable high-definition video quality</div>
                </div>
                <input type="checkbox" className="toggle" checked={hdVideo} onChange={(e) => setHdVideo(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Noise Cancellation</div>
                  <div className="text-xs text-slate-400">Reduce background noise during calls</div>
                </div>
                <input type="checkbox" className="toggle" checked={noiseCancellation} onChange={(e) => setNoiseCancellation(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Auto-Start Video</div>
                  <div className="text-xs text-slate-400">Start with video enabled by default</div>
                </div>
                <input type="checkbox" className="toggle" checked={autoStartVideo} onChange={(e) => setAutoStartVideo(e.target.checked)} />
              </label>

              <label className="flex items-center justify-between py-3 border-b">
                <div>
                  <div className="font-medium">Mirror Video</div>
                  <div className="text-xs text-slate-400">Flip your video horizontally</div>
                </div>
                <input type="checkbox" className="toggle" checked={mirrorVideo} onChange={(e) => setMirrorVideo(e.target.checked)} />
              </label>

              <div className="pt-2">
                <button className="btn btn-primary" onClick={() => { saveVideoAudio(); }}>Test Audio & Video</button>
                <button className="btn btn-ghost ml-2" onClick={saveVideoAudio}>Save</button>
              </div>
            </div>
          </section>
        )}

        <section>
          <h2 className="font-semibold mb-3">Danger zone</h2>
          <div className="rounded-lg border border-error/50 p-4 space-y-3 bg-base-100">
            <p className="text-sm text-error">
              Permanently delete your account and all related data. This action cannot be undone.
            </p>
            {!isDeleteConfirmVisible ? (
              <button className="btn btn-outline btn-error" onClick={startDeleteProcess}>
                Delete account
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm">
                  Step 2: Type <span className="font-semibold">DELETE</span> to confirm you understand this is permanent.
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
                    {isDeletingAccount ? "Deleting..." : "Confirm delete"}
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
