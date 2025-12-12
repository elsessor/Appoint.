import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, ShipWheelIcon } from "lucide-react";
import { resetPassword, verifyResetToken } from "../lib/api";
import { useThemeStore } from "../store/useThemeStore";
import ThemeSelector from "../components/ThemeSelector";

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { theme } = useThemeStore();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);

  // Verify token on mount
  useEffect(() => {
    const verifyToken = async () => {
      try {
        if (!token) {
          setError("No reset token provided");
          setTokenValid(false);
          return;
        }

        await verifyResetToken(token);
        setTokenValid(true);
      } catch (err) {
        setError(err.response?.data?.message || "Invalid or expired reset token");
        setTokenValid(false);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.password.trim() || !formData.confirmPassword.trim()) {
      setError("Both fields are required");
      return;
    }

    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(token, formData.password);
      setSuccess(true);

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to reset password. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div
        className="h-screen flex items-center justify-center bg-base-100 overflow-hidden"
        data-theme={theme}
      >
        <div className="text-center space-y-4">
          <span className="loading loading-spinner loading-lg"></span>
          <p>Verifying reset link...</p>
        </div>
      </div>
    );
  }

  if (!tokenValid) {
    return (
      <div
        className="h-screen flex items-center justify-center bg-base-100 overflow-hidden"
        data-theme={theme}
      >
        <div className="border border-primary/25 w-full max-w-md mx-auto bg-base-100 rounded-xl shadow-lg p-8 relative">
          <button
            onClick={() => navigate("/")}
            className="absolute top-4 left-4 z-10 btn btn-ghost btn-sm gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="absolute top-4 right-4 z-10">
            <ThemeSelector />
          </div>

          <div className="mt-8 space-y-4">
            <div className="alert alert-error">
              <span>{error || "Invalid or expired reset link"}</span>
            </div>

            <p className="text-center">
              This password reset link has expired or is invalid.
            </p>

            <button
              onClick={() => navigate("/login")}
              className="btn btn-primary w-full"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

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
            <span className="text-3xl font-bold font-mono bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary tracking-wider">
              Appoint.
            </span>
          </div>

          {error && (
            <div className="alert alert-error mb-4">
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="alert alert-success mb-4">
              <span>Password reset successfully! Redirecting to login...</span>
            </div>
          )}

          <div className="w-full">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Reset Your Password</h2>
                  <p className="text-sm opacity-70">
                    Enter your new password below
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">New Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      disabled={isLoading || success}
                      required
                    />
                  </div>

                  <div className="form-control w-full space-y-2">
                    <label className="label">
                      <span className="label-text">Confirm Password</span>
                    </label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      className="input input-bordered w-full"
                      value={formData.confirmPassword}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          confirmPassword: e.target.value,
                        })
                      }
                      disabled={isLoading || success}
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-full"
                    disabled={isLoading || success}
                  >
                    {isLoading ? (
                      <>
                        <span className="loading loading-spinner loading-xs"></span>
                        Resetting...
                      </>
                    ) : success ? (
                      "Password Reset Successfully!"
                    ) : (
                      "Reset Password"
                    )}
                  </button>

                  <div className="text-center mt-4">
                    <p className="text-sm">
                      Remember your password?{" "}
                      <button
                        type="button"
                        onClick={() => navigate("/login")}
                        className="text-primary hover:underline"
                      >
                        Sign in
                      </button>
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
              <img
                src="/Video call-rafiki.png"
                alt="Language connection illustration"
                className="w-full h-full"
              />
            </div>
            <div className="text-center space-y-3 mt-6">
              <h2 className="text-xl font-semibold">
                Secure Your Account
              </h2>
              <p className="opacity-70">
                Create a strong password to keep your account secure and protected
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
