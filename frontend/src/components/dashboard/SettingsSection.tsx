"use client";

import React, { useState } from "react";
import { 
  User, 
  Mail, 
  ShieldCheck, 
  LogOut, 
  Bell, 
  Flame, 
  Globe, 
  Key, 
  CheckCircle2,
  Clock
} from "lucide-react";
import { motion } from "framer-motion";

interface SettingsProps {
  user: any;
  onSignOut: () => void;
  userName: string;
}

export default function SettingsSection({ user, onSignOut, userName }: SettingsProps) {
  const userEmail = user?.email || "nagulaadhi08@gmail.com";
  const [dailyTarget, setDailyTarget] = useState("30");
  const [notifications, setNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn righteous-regular max-w-6xl mx-auto text-[#0D0D0D] relative">
      
      {/* HEADER BANNER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/50 text-[#FAFAFA] text-xs font-black uppercase tracking-wider mb-2 shadow-inner">
            <User className="w-3.5 h-3.5 text-[#A58CF4]" />
            <span>Scholar Profile Configuration</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Settings & Control Panel
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F7F7] mt-1 font-normal">
            Manage your academic profile settings, configuration parameters, notifications, and active session status.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: USER PROFILE DETAILS CARD */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] shadow-md flex flex-col items-center text-center space-y-6">
            
            {/* Big Avatar */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-[#433075] border-4 border-[#A58CF4] flex items-center justify-center text-white text-3xl font-black shadow-lg">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 p-1.5 rounded-full bg-green-500 border-2 border-white shadow-sm" title="Online" />
            </div>

            {/* Profile Info */}
            <div className="space-y-1 w-full">
              <h2 className="text-xl font-black text-[#0D0D0D] truncate">{userName}</h2>
              <p className="text-xs text-[#736A86] truncate flex items-center justify-center gap-1 font-semibold">
                <Mail className="w-3.5 h-3.5" />
                <span>{userEmail}</span>
              </p>
              
              <div className="pt-2 flex justify-center">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] text-[10px] font-black uppercase tracking-wider">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#A58CF4]" />
                  <span>Verified Scholar</span>
                </span>
              </div>
            </div>

            <span className="w-full h-[1px] bg-[#C8CED6]/80 block" />

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4 w-full text-left">
              <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                <div className="text-[10px] font-bold text-[#736A86] uppercase">Active Streak</div>
                <div className="text-base font-black text-[#0D0D0D] flex items-center gap-1 mt-0.5">
                  <Flame className="w-4 h-4 text-[#A58CF4] fill-[#A58CF4]" />
                  <span>14 Days</span>
                </div>
              </div>
              <div className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                <div className="text-[10px] font-bold text-[#736A86] uppercase">Sync Status</div>
                <div className="text-base font-black text-green-600 flex items-center gap-1 mt-0.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                  <span>Secure</span>
                </div>
              </div>
            </div>

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="w-full px-6 py-3.5 rounded-2xl bg-red-500 hover:bg-red-600 active:scale-95 text-white font-black text-xs shadow-md border border-transparent hover:border-red-600 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out Session</span>
            </button>

          </div>
        </div>

        {/* RIGHT COLUMN: PREFERENCES AND ACCOUNT EDIT FORMS */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Account Details Form */}
          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] shadow-md space-y-6">
            <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] flex items-center gap-2 border-b border-[#C8CED6]/80 pb-3">
              <Key className="w-5 h-5 text-[#433075]" />
              <span>Identity Profile Credentials</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-[#736A86]">Full Display Name</label>
                <input
                  type="text"
                  value={userName}
                  disabled
                  className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-[#736A86] font-bold cursor-not-allowed select-none opacity-80"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-black uppercase text-[#736A86]">Email Address</label>
                <input
                  type="email"
                  value={userEmail}
                  disabled
                  className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-[#736A86] font-bold cursor-not-allowed select-none opacity-80"
                />
              </div>
            </div>
            <p className="text-[10px] text-[#736A86] leading-relaxed font-semibold italic">
              * Profile details and email parameters are managed directly by your secure Supabase OAuth provider configuration.
            </p>
          </div>

          {/* Preferences Form */}
          <form onSubmit={handleSavePreferences} className="p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] shadow-md space-y-6">
            <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] flex items-center gap-2 border-b border-[#C8CED6]/80 pb-3">
              <Globe className="w-5 h-5 text-[#433075]" />
              <span>Learning Preferences & Cadence</span>
            </h3>

            <div className="space-y-4">
              {/* Daily Goal Dropdown */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-[#0D0D0D] flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#433075]" />
                    <span>Daily Learning Target</span>
                  </div>
                  <div className="text-[10px] text-[#736A86] font-semibold">Consolidates study metrics and streak reminders.</div>
                </div>
                <select
                  value={dailyTarget}
                  onChange={(e) => setDailyTarget(e.target.value)}
                  className="p-2.5 rounded-xl bg-white border border-[#C8CED6] text-xs font-black text-[#0D0D0D] outline-none cursor-pointer"
                >
                  <option value="15">15 mins/day (Casual)</option>
                  <option value="30">30 mins/day (Regular)</option>
                  <option value="60">60 mins/day (Intensive)</option>
                </select>
              </div>

              {/* Notification Toggles */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-[#0D0D0D] flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-[#433075]" />
                    <span>Memory Spaced-Repetition Alerts</span>
                  </div>
                  <div className="text-[10px] text-[#736A86] font-semibold">Notify when GRE/TOEFL flashcards consolidations are ready.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setNotifications(!notifications)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                    notifications ? "bg-[#433075]" : "bg-[#C8CED6]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform left-1 ${
                      notifications ? "transform translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>

              {/* Streak Reminders */}
              <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                <div className="space-y-0.5">
                  <div className="text-xs font-black text-[#0D0D0D] flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-[#433075]" />
                    <span>Streak Defense Reminders</span>
                  </div>
                  <div className="text-[10px] text-[#736A86] font-semibold">Send alerts before streak expiration timelines.</div>
                </div>
                <button
                  type="button"
                  onClick={() => setStreakReminders(!streakReminders)}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                    streakReminders ? "bg-[#433075]" : "bg-[#C8CED6]"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform left-1 ${
                      streakReminders ? "transform translate-x-5" : ""
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-6 py-3 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer border border-transparent hover:border-[#0D0D0D]"
              >
                Save Preference Configurations
              </button>
            </div>
          </form>

        </div>
      </div>

      {/* TOAST SUCCESS NOTIFICATION */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-white border-2 border-green-600 shadow-2xl flex items-center gap-3 animate-slideIn">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          <div className="text-xs font-black text-[#0D0D0D]">Preferences updated and synced successfully!</div>
        </div>
      )}
    </div>
  );
}
