import { useState } from "react";
import { ShipWheelIcon, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router";
import useLogin from "../hooks/useLogin";
import { useThemeStore } from "../store/useThemeStore";
import ThemeSelector from "../components/ThemeSelector";

const LoginPage = () => {
  const [loginData, setLoginData] = useState({
    email: "",
    password: "",
  });

  const { isPending, error, loginMutation } = useLogin();
  const { theme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    loginMutation(loginData);
  };

  return (
    <div
      className="h-screen flex items-center justify-center bg-base-100 overflow-hidden"
      data-theme={theme}
    >
      {/* Back Button - Outside Card */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 z-10 btn btn-ghost btn-sm gap-2"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      {/* Main Content - Centered */}
      <div className="border border-primary/25 flex flex-col lg:flex-row w-full max-w-5xl mx-auto bg-base-100 rounded-xl shadow-lg overflow-hidden relative">
        {/* Theme Selector - Absolute Top Right */}
        <div className="absolute top-4 right-4 z-10">
          <ThemeSelector />
        </div>

        <div className="w-full lg:w-1/2 p-4 sm:p-8 flex flex-col">
          <div className="mb-8 flex items-center justify-start gap-2">
            <ShipWheelIcon className="size-9 text-primary" />
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary  tracking-wider">
              Appoint.
            </span>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error.response?.data?.message || error.message || "An error occurred"}</span>
            </div>
          )}

          <div className="w-full">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Welcome Back</h2>
                  <p className="text-sm opacity-70">
                    Sign in to your Appoint. account to continue
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">Email</span>
                    </label>
                    <input
                      type="email"
                      placeholder="Lebron_James@gmail.com"
                      className="input input-bordered w-full"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                    />
                  </div>

                  <button type="submit" className="btn btn-primary w-full" disabled={isPending}>
                    {isPending ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Signing in...
                      </>
                    ) : (
                      "Sign In"
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-sm">
                      Don't have an account?{" "}
                      <Link to="/signup" className="text-primary hover:underline">
                        Create one
                      </Link>
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>

        <div className="hidden lg:flex w-full lg:w-1/2 bg-primary/10 items-center justify-center">
          <div className="max-w-md p-8">
            <div className="relative aspect-square max-w-sm mx-auto">
              <img src="/Video call-rafiki.png" alt="Language connection illustration" className="w-full h-full" />
            </div>
            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">Schedule meetings with ease and efficiency</h2>
              <p className="opacity-70">
                Streamline your calendar, manage appointments, and stay organized with our intuitive platform
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
