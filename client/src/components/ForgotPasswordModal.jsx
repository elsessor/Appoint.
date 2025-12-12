import { useState } from "react";
import { X } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

const ForgotPasswordModal = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState("email"); // email or reset
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleFindEmail = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setIsLoading(true);
      // Verify email exists in database
      const response = await axiosInstance.post("/auth/verify-email", { email });
      setStep("reset");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to process request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError("");

    if (!newPassword.trim()) {
      setError("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      const response = await axiosInstance.post("/auth/reset-password-simple", { email, newPassword });

      toast.success("Password reset successfully! Please log in.");
      setTimeout(() => {
        resetForm();
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setNewPassword("");
    setConfirmPassword("");
    setStep("email");
    setError("");
    setSuccess(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <dialog open className="modal modal-open">
      <div className="modal-box w-full max-w-md">
        <button
          type="button"
          onClick={handleClose}
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2"
        >
          <X className="w-4 h-4" />
        </button>

        <h3 className="font-bold text-lg mb-4">Reset Password</h3>

        <div className="space-y-4">
          {error && <div className="alert alert-error text-sm">{error}</div>}
          {success && <div className="alert alert-success text-sm">{success}</div>}

          {step === "email" ? (
            <form onSubmit={handleFindEmail} className="space-y-4">
              <p className="text-sm opacity-70">
                Enter your email to reset your password.
              </p>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Email Address</span>
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  className="input input-bordered w-full"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="modal-action flex gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn btn-ghost flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Checking...
                    </>
                  ) : (
                    "Continue"
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="bg-base-200 p-3 rounded text-sm">
                <p className="opacity-70">Resetting password for:</p>
                <p className="font-semibold">{email}</p>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className="input input-bordered w-full"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                <label className="label">
                  <span className="label-text-alt text-xs opacity-70">
                    Minimum 6 characters
                  </span>
                </label>
              </div>

              <div className="form-control w-full">
                <label className="label">
                  <span className="label-text">Confirm New Password</span>
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  className={`input input-bordered w-full ${
                    confirmPassword && newPassword !== confirmPassword
                      ? "input-error"
                      : ""
                  }`}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                  required
                />
                {confirmPassword && newPassword !== confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error text-xs">
                      Passwords do not match
                    </span>
                  </label>
                )}
              </div>

              <div className="modal-action flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setStep("email");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                  className="btn btn-ghost flex-1"
                  disabled={isLoading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      Resetting...
                    </>
                  ) : (
                    "Reset Password"
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="modal-backdrop" onClick={handleClose}></div>
    </dialog>
  );
};

export default ForgotPasswordModal;

