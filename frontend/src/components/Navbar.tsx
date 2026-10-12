"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import {
  FileText,
  LogOut,
  User,
  Settings,
  Shield,
  ChevronDown,
} from "lucide-react";

export function Navbar() {
  const { user, logout } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="border-b border-stone-200/80 bg-white/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2.5 font-semibold text-sm tracking-tight text-stone-900">
          <div className="bg-stone-900 text-white p-1.5 rounded-md shadow-xs">
            <FileText className="w-4 h-4" />
          </div>
          <span>DraftEngine</span>
        </Link>

        {user ? (
          <div className="relative" ref={dropdownRef}>
            {/* Clickable Profile Button with Name and Avatar */}
            <button
              onClick={() => setDropdownOpen((prev) => !prev)}
              className="flex items-center gap-2 p-1 pl-2 hover:bg-stone-100 rounded-lg transition border border-transparent hover:border-stone-200 cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-full bg-stone-900 text-white flex items-center justify-center font-medium text-xs shadow-2xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-medium text-stone-800 hidden sm:inline max-w-[140px] truncate">
                {user.name}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {/* Profile Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-60 bg-white rounded-xl border border-stone-200 shadow-lg py-1.5 z-50 animate-in fade-in-50 zoom-in-95 duration-100">
                <div className="px-3.5 py-2.5 border-b border-stone-100">
                  <p className="text-xs font-semibold text-stone-900 truncate">{user.name}</p>
                  <p className="text-[11px] text-stone-500 font-mono truncate mt-0.5">{user.email}</p>
                </div>

                <div className="py-1">
                  <div className="px-3.5 py-1.5 text-[10px] font-mono uppercase text-stone-400 font-semibold tracking-wider">
                    Author Workspace
                  </div>
                  <Link
                    href="/dashboard"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 hover:bg-stone-50 hover:text-stone-900 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-stone-400" />
                    <span>My Documents</span>
                  </Link>

                  <div className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 hover:bg-stone-50 cursor-pointer transition">
                    <User className="w-3.5 h-3.5 text-stone-400" />
                    <span>Profile & Account</span>
                  </div>

                  <div className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 hover:bg-stone-50 cursor-pointer transition">
                    <Settings className="w-3.5 h-3.5 text-stone-400" />
                    <span>Editor Settings</span>
                  </div>

                  <div className="flex items-center gap-2.5 px-3.5 py-2 text-xs text-stone-700 hover:bg-stone-50 cursor-pointer transition">
                    <Shield className="w-3.5 h-3.5 text-stone-400" />
                    <span>Security & Keys</span>
                  </div>
                </div>

                <div className="border-t border-stone-100 pt-1 mt-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition font-medium cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-medium text-stone-600 hover:text-stone-900"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white text-xs font-medium rounded-md transition shadow-xs"
            >
              Get Started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
