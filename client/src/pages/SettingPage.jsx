import { useState, useEffect } from "react";
import useAuthUser from "../hooks/useAuthUser";
import ThemeSelector from "../components/ThemeSelector";
import useLogout from "../hooks/useLogout";
import { toast } from "react-hot-toast";

const SettingPage = () => {
  const { authUser } = useAuthUser();
  const { logoutMutation } = useLogout();

  const [displayName, setDisplayName] = useState(authUser?.fullName || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [language, setLanguage] = useState(localStorage.getItem("pref_language") || "English");
  const [timezone, setTimezone] = useState(localStorage.getItem("pref_timezone") || "(UTC+8) Manila");
  const [notifyEmail, setNotifyEmail] = useState(Boolean(localStorage.getItem("notify_email") === "true"));
  const [notifyPush, setNotifyPush] = useState(Boolean(localStorage.getItem("notify_push") === "true"));

  useEffect(() => {
    setDisplayName(authUser?.fullName || "");
    setEmail(authUser?.email || "");
  }, [authUser]);

  const savePreferences = () => {
    try {
      localStorage.setItem("pref_language", language);
      localStorage.setItem("pref_timezone", timezone);
      localStorage.setItem("notify_email", notifyEmail ? "true" : "false");
      localStorage.setItem("notify_push", notifyPush ? "true" : "false");
      toast.success("Settings saved");
    } catch (err) {
      console.error(err);
      toast.error("Failed to save settings");
    }
  };

  return (
    <div className="p-6">
      <div className="bg-base-200 rounded-xl border-t-4 border-primary p-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <div className="flex items-center gap-3">
            <ThemeSelector />
            <button className="btn btn-ghost" onClick={() => logoutMutation()}>Logout</button>
          </div>
        </div>

        <section className="mb-6">
          <h2 className="font-semibold mb-3">Account</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Display name</div>
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="input input-bordered w-full" />
            </label>

            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Email</div>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className="input input-bordered w-full" />
            </label>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-3">Preferences</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Language</div>
              <select value={language} onChange={(e) => setLanguage(e.target.value)} className="select select-bordered w-full">
                <option>English</option>
                <option>Filipino</option>
                <option>Spanish</option>
                <option>Mandarin</option>
              </select>
            </label>

            <label className="block">
              <div className="text-sm text-slate-400 mb-1">Timezone</div>
              <select value={timezone} onChange={(e) => setTimezone(e.target.value)} className="select select-bordered w-full">
                <option>(UTC+8) Manila</option>
                <option>(UTC+0) GMT</option>
                <option>(UTC-5) Eastern</option>
              </select>
            </label>

            <div className="flex flex-col justify-end">
              <button onClick={savePreferences} className="btn btn-primary">Save Preferences</button>
            </div>
          </div>
        </section>

        <section className="mb-6">
          <h2 className="font-semibold mb-3">Notifications</h2>
          <div className="flex flex-col gap-3">
            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email notifications</div>
                <div className="text-xs text-slate-400">Receive updates and messages via email</div>
              </div>
              <input type="checkbox" className="toggle" checked={notifyEmail} onChange={(e) => setNotifyEmail(e.target.checked)} />
            </label>

            <label className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push notifications</div>
                <div className="text-xs text-slate-400">Quick alerts in the browser or mobile</div>
              </div>
              <input type="checkbox" className="toggle" checked={notifyPush} onChange={(e) => setNotifyPush(e.target.checked)} />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-semibold mb-3">Danger zone</h2>
          <div className="flex items-center gap-3">
            <button className="btn btn-outline btn-error" onClick={() => toast("Account removal is not implemented in this demo")}>Delete account</button>
            <button className="btn" onClick={() => toast("Export profile not implemented")}>Export profile</button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingPage;
