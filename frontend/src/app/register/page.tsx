"use client";

import React, { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import { toast } from "sonner";
import { FileText, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Spinner } from "@/components/ui/Spinner";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post("/auth/register", { name, email, password });
      if (res.data.success) {
        toast.success("Account created.");
        login(res.data.token, res.data.user);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Registration failed.");
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
            Create Account
          </h1>
          <p className="text-xs text-stone-500">
            Set up your author workspace
          </p>
        </div>

        <form onSubmit={handleRegister} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1 font-mono">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Vinayak Gaikwad"
              className="w-full px-3 py-2 rounded-md border border-stone-200 bg-white text-xs focus:outline-none focus:border-stone-800"
            />
          </div>

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
            <label className="block text-[11px] font-semibold text-stone-700 uppercase tracking-wider mb-1 font-mono">
              Password (min. 6 chars)
            </label>
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
                <span>Create Account</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-xs text-stone-500">
          Already have an account?{" "}
          <Link href="/login" className="text-stone-900 font-medium hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}
