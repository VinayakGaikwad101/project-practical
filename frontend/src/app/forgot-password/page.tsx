"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { KeyRound, ArrowRight, CheckCircle2, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<"request_otp" | "verify_reset">("request_otp");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/forgot-password", { email });
      if (res.data.success) {
        toast.success("Verification code sent to your email.");
        setStep("verify_reset");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to send reset OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || !newPassword) {
      toast.error("Please provide both OTP code and new password.");
      return;
    }

    if (newPassword.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email,
        otp,
        newPassword,
      });

      if (res.data.success) {
        toast.success("Password reset successfully.");
        router.push("/login");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid or expired OTP code.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbfbfd]">
      <div className="max-w-sm w-full bg-white border border-stone-200/90 rounded-xl p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-9 h-9 bg-stone-900 text-white rounded-md mx-auto flex items-center justify-center shadow-2xs">
            <KeyRound className="w-4 h-4" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-stone-900">
            Reset Password
          </h1>
          <p className="text-xs text-stone-500">
            {step === "request_otp"
              ? "Enter your email to receive a 6-digit one-time password"
              : "Enter the code received and choose a new password"}
          </p>
        </div>

        {step === "request_otp" ? (
          <form onSubmit={handleRequestOTP} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1 font-mono">
                Account Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full px-3 py-2 rounded-md border border-stone-200 bg-white text-xs focus:outline-none focus:border-stone-800"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium rounded-md text-xs transition shadow-2xs flex items-center justify-center gap-1.5"
            >
              {loading ? <Spinner size="sm" /> : <span>Dispatch OTP Code</span>}
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1 font-mono">
                6-Digit OTP Code
              </label>
              <input
                type="text"
                required
                maxLength={6}
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest font-mono text-base px-3 py-2 rounded-md border border-stone-200 bg-white focus:outline-none focus:border-stone-800"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1 font-mono">
                New Password (min. 6 chars)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 rounded-md border border-stone-200 bg-white text-xs focus:outline-none focus:border-stone-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-2.5 text-stone-400 hover:text-stone-700 transition"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium rounded-md text-xs transition shadow-2xs flex items-center justify-center gap-1.5"
            >
              {loading ? (
                <Spinner size="sm" />
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="text-center pt-1">
          <Link href="/login" className="text-xs text-stone-500 hover:text-stone-900 font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
