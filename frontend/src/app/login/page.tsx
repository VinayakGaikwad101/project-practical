"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { FileText, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("Please provide email and password.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/login", { email, password });
      if (res.data.success) {
        toast.success("Signed in.");
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Invalid credentials.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#fbfbfd]">
      <div className="max-w-sm w-full bg-white border border-stone-200/90 rounded-xl p-8 shadow-xs space-y-6">
        <div className="text-center space-y-1.5">
          <div className="w-9 h-9 bg-stone-900 text-white rounded-md mx-auto flex items-center justify-center shadow-2xs">
            <FileText className="w-5 h-5" />
          </div>
          <h1 className="text-lg font-bold tracking-tight text-stone-900">
            Sign In
          </h1>
          <p className="text-xs text-stone-500">
            Enter your credentials to continue to your documents
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1 font-mono">
              Email
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

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider font-mono">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-[11px] text-stone-500 hover:text-stone-900"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
            disabled={submitting}
            className="w-full py-2 bg-stone-900 hover:bg-stone-800 disabled:opacity-50 text-white font-medium rounded-md text-xs transition shadow-2xs flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <Spinner size="sm" />
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-stone-500">
          New author?{" "}
          <Link href="/register" className="text-stone-900 font-medium hover:underline">
            Create account
          </Link>
        </p>
      </div>
    </div>
  );
}
