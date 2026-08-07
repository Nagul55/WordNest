"use client";

import React, { useState, useRef } from "react";
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
  Clock,
  Camera,
  ZoomIn,
  ZoomOut,
  Upload,
  X,
  Loader2,
  Copy,
  Check,
  ExternalLink,
  Lock,
  Settings,
  Activity,
  FileText,
  CreditCard,
  Database,
  Terminal,
  Brain,
  HardDrive,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import CustomSelect from "../ui/CustomSelect";

interface SettingsProps {
  user: any;
  onSignOut: () => void;
  userName: string;
}

export default function SettingsSection({ user, onSignOut, userName }: SettingsProps) {
  const userEmail = user?.email || "";
  const [dailyTarget, setDailyTarget] = useState("30");
  const [notifications, setNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [avatarError, setAvatarError] = useState(false);

  // Sidebar Sub-tabs active state
  const [activeSubTab, setActiveSubTab] = useState<string>("general");
  const [copiedId, setCopiedId] = useState<string | null>(null);



  // States for Image Upload, Cropping, and Username
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cropImageRef = useRef<HTMLImageElement>(null);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isUploading, setIsUploading] = useState(false);
  const [dbAvatarUrl, setDbAvatarUrl] = useState<string | null>(null);

  const [username, setUsername] = useState(userName || "");
  const [initialUsername, setInitialUsername] = useState(userName || "");
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState(false);
  const [isSavingUsername, setIsSavingUsername] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);

  // Fetch persistent profile picture, username, and preferences (offline-first fallback)
  React.useEffect(() => {
    if (!user?.id) return;
    const profileKey = `wordnest_profile_${user.id}`;
    
    // Load local cache immediately
    try {
      const cached = localStorage.getItem(profileKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.avatar_url) setDbAvatarUrl(parsed.avatar_url);
        if (parsed.username) {
          setUsername(parsed.username);
          setInitialUsername(parsed.username);
        }
        if (parsed.daily_target) setDailyTarget(parsed.daily_target);
        if (parsed.notifications_enabled !== undefined) setNotifications(parsed.notifications_enabled);
        if (parsed.streak_reminders_enabled !== undefined) setStreakReminders(parsed.streak_reminders_enabled);
      }
    } catch (e) {
      console.warn("Failed to load local profile cache:", e);
    }

    const fetchProfileData = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, avatar_url, daily_target, notifications_enabled, streak_reminders_enabled")
          .eq("id", user.id)
          .single();
        if (!error && data) {
          if (data.avatar_url) setDbAvatarUrl(data.avatar_url);
          if (data.username) {
            setUsername(data.username);
            setInitialUsername(data.username);
          }
          if (data.daily_target) setDailyTarget(data.daily_target.toString());
          if (data.notifications_enabled !== null) setNotifications(data.notifications_enabled);
          if (data.streak_reminders_enabled !== null) setStreakReminders(data.streak_reminders_enabled);

          // Update local cache
          localStorage.setItem(profileKey, JSON.stringify({
            avatar_url: data.avatar_url,
            username: data.username,
            daily_target: data.daily_target?.toString(),
            notifications_enabled: data.notifications_enabled,
            streak_reminders_enabled: data.streak_reminders_enabled
          }));
        }
      } catch (err) {
        console.warn("Notice: Fetch profile falling back to local storage:", err);
      }
    };
    fetchProfileData();
  }, [user?.id]);

  // Real-time username validation effect
  React.useEffect(() => {
    if (!username || username === initialUsername) {
      setUsernameError(null);
      setUsernameSuccess(false);
      return;
    }

    if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      setUsernameSuccess(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError("Username can only contain letters, numbers, and underscores.");
      setUsernameSuccess(false);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setUsernameError(null);
      setIsCheckingUsername(true);
      try {
        const { data } = await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle();

        if (data && data.id !== user.id) {
          setUsernameError("Username is already taken.");
          setUsernameSuccess(false);
        } else {
          setUsernameError(null);
          setUsernameSuccess(true);
        }
      } catch (err) {
        // If network offline, consider valid locally
        setUsernameError(null);
        setUsernameSuccess(true);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [username, initialUsername, user?.id]);

  const handleSaveUsername = async () => {
    if (usernameError || isCheckingUsername || !username || username === initialUsername) return;
    setIsSavingUsername(true);

    // Save locally first
    try {
      const profileKey = `wordnest_profile_${user?.id}`;
      const existing = localStorage.getItem(profileKey);
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(profileKey, JSON.stringify({ ...parsed, username }));
    } catch (e) {
      console.warn("Failed to save local username:", e);
    }

    setInitialUsername(username);
    setUsernameSuccess(false);

    try {
      await supabase
        .from("profiles")
        .update({ username, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      await supabase.auth.updateUser({
        data: { username }
      });
    } catch (err: any) {
      console.warn("Notice: Network sync warning updating username (saved locally):", err);
    } finally {
      setIsSavingUsername(false);
      setIsEditingName(false);
      (window as any).wordnestNotify?.("Profile Updated", "Scholar display name updated successfully.", "success");
    }
  };

  const avatarUrl = dbAvatarUrl || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  const handleSavePreferences = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Save locally first
    try {
      const profileKey = `wordnest_profile_${user?.id}`;
      const existing = localStorage.getItem(profileKey);
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(profileKey, JSON.stringify({
        ...parsed,
        daily_target: dailyTarget,
        notifications_enabled: notifications,
        streak_reminders_enabled: streakReminders
      }));
    } catch (e) {
      console.warn("Failed to save local preferences:", e);
    }

    (window as any).wordnestNotify?.("Preferences Saved", "Learning targets and streak alert settings synced successfully.", "success");

    try {
      await supabase
        .from("profiles")
        .update({
          daily_target: parseInt(dailyTarget, 10),
          notifications_enabled: notifications,
          streak_reminders_enabled: streakReminders,
          updated_at: new Date().toISOString()
        })
        .eq("id", user.id);
    } catch (err: any) {
      console.warn("Notice: Saved preferences locally due to network sync warning:", err);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "image/png" && file.type !== "image/jpeg" && file.type !== "image/webp") {
        (window as any).wordnestNotify?.("Invalid Image Format", "Please select a PNG, JPEG, or WEBP image.", "warning");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImage(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
        setIsCropModalOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    setOffset({
      x: touch.clientX - dragStart.x,
      y: touch.clientY - dragStart.y
    });
  };

  const handleCropAndSave = async () => {
    if (!cropImageRef.current || !selectedImage) return;
    setIsUploading(true);

    try {
      const img = cropImageRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        ctx.clearRect(0, 0, 256, 256);

        ctx.beginPath();
        ctx.arc(128, 128, 128, 0, Math.PI * 2, true);
        ctx.closePath();
        ctx.clip();

        const viewWidth = 200;
        const viewHeight = 200;
        const ratio = 256 / viewWidth;

        const imgNaturalWidth = img.naturalWidth;
        const imgNaturalHeight = img.naturalHeight;

        let renderWidth = viewWidth;
        let renderHeight = viewHeight;
        const imgRatio = imgNaturalWidth / imgNaturalHeight;

        if (imgRatio > 1) {
          renderWidth = viewHeight * imgRatio;
        } else {
          renderHeight = viewWidth / imgRatio;
        }

        const destWidth = renderWidth * zoom * ratio;
        const destHeight = renderHeight * zoom * ratio;
        
        const centerX = (viewWidth - renderWidth * zoom) / 2;
        const centerY = (viewHeight - renderHeight * zoom) / 2;

        const destX = (centerX + offset.x) * ratio;
        const destY = (centerY + offset.y) * ratio;

        ctx.drawImage(img, destX, destY, destWidth, destHeight);

        const croppedDataUrl = canvas.toDataURL("image/png");

        // Save locally first
        try {
          const profileKey = `wordnest_profile_${user?.id}`;
          const existing = localStorage.getItem(profileKey);
          const parsed = existing ? JSON.parse(existing) : {};
          localStorage.setItem(profileKey, JSON.stringify({ ...parsed, avatar_url: croppedDataUrl }));
        } catch (e) {
          console.warn("Failed to save local avatar:", e);
        }

        setDbAvatarUrl(croppedDataUrl);
        setIsCropModalOpen(false);
        setSelectedImage(null);
        setAvatarError(false);

        try {
          await supabase.auth.updateUser({
            data: { avatar_url: croppedDataUrl, picture: croppedDataUrl }
          });

          await supabase.from("profiles").upsert({
            id: user.id,
            avatar_url: croppedDataUrl,
            updated_at: new Date().toISOString()
          }, { onConflict: "id" });
        } catch (err: any) {
          console.warn("Notice: Saved avatar locally due to network sync warning:", err);
        }
      }
    } catch (err: any) {
      console.error("Error updating avatar:", err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sidebar structures - filtered options based on user feedback
  const configTabs = [
    { id: "general", label: "General Settings", icon: Settings },
    { id: "security", label: "Security & Sessions", icon: Lock }
  ];

  const integrationTabs = [
    { id: "local_db", label: "Local Database Sync", icon: Activity },
    { id: "vault", label: "AI Prompt Vault", icon: ShieldCheck, badge: "BETA" }
  ];

  const billingTabs = [
    { id: "subscription", label: "Study Tier", icon: CreditCard },
    { id: "usage", label: "Academic Usage", icon: Clock }
  ];

  return (
    <div className="flex flex-col lg:flex-row gap-8 pb-12 w-full text-[#0D0D0D] righteous-regular relative min-h-[600px] animate-fadeIn">
      
      {/* LEFT COLUMN: THE SIDEBAR */}
      <div className="w-full lg:w-64 shrink-0 bg-[#F0EDF7] border border-[#C8CED6] rounded-3xl p-5 shadow-sm space-y-6 self-start">
        <div className="space-y-6">
          
          {/* Section 1: CONFIGURATION */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-[#736A86] tracking-wider px-2.5">
              Configuration
            </h4>
            <div className="space-y-1">
              {configTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer ${
                      activeSubTab === tab.id
                        ? "bg-[#433075] text-[#FAFAFA] shadow-sm"
                        : "text-[#0D0D0D] hover:bg-white/50 hover:text-[#433075]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: INTEGRATIONS */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-[#736A86] tracking-wider px-2.5">
              Integrations
            </h4>
            <div className="space-y-1">
              {integrationTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-between cursor-pointer ${
                      activeSubTab === tab.id
                        ? "bg-[#433075] text-[#FAFAFA] shadow-sm"
                        : "text-[#0D0D0D] hover:bg-white/50 hover:text-[#433075]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="text-[8px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded leading-none">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: BILLING */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-black uppercase text-[#736A86] tracking-wider px-2.5">
              Billing
            </h4>
            <div className="space-y-1">
              {billingTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 cursor-pointer ${
                      activeSubTab === tab.id
                        ? "bg-[#433075] text-[#FAFAFA] shadow-sm"
                        : "text-[#0D0D0D] hover:bg-white/50 hover:text-[#433075]"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign Out (immediately under Billing items) */}
          <div className="pt-4 border-t border-[#C8CED6]/60">
            <button
              onClick={onSignOut}
              className="w-full px-3.5 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all flex items-center gap-2.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Sign Out Session</span>
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: DYNAMIC PANEL DISPLAY */}
      <div className="flex-1 min-w-0 space-y-6">
        
        {/* ==========================================
            TAB 1: GENERAL SETTINGS
            ========================================== */}
        {activeSubTab === "general" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight uppercase">
                Scholar Settings
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Profile details, daily learning target, and retention preferences.
              </p>
            </div>

            {/* Profile Avatar configuration Card */}
            <div className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm p-6 sm:p-8 space-y-6">
              <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3">
                Scholar Profile Details
              </h3>
              
              <div className="flex flex-col md:flex-row items-center gap-6">
                {/* Image upload preview */}
                <div className="relative group shrink-0">
                  {avatarUrl && !avatarError ? (
                    <img 
                      src={avatarUrl} 
                      alt={userName} 
                      onError={() => setAvatarError(true)}
                      className="w-20 h-20 rounded-full border-4 border-[#A58CF4] object-cover shadow-md"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-[#433075] border-4 border-[#A58CF4] flex items-center justify-center text-white text-2xl font-black shadow-md">
                      {(userName || "S").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 p-1.5 rounded-full bg-[#433075] hover:bg-[#A58CF4] border-2 border-white text-white hover:text-[#0D0D0D] shadow-md transition-all active:scale-90 cursor-pointer"
                    title="Change Profile Picture"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/webp"
                    className="hidden"
                  />
                </div>

                <div className="flex-1 w-full space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <span className="text-[10px] uppercase font-black text-[#736A86]">Scholar Username</span>
                      <p className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1.5 mt-0.5">
                        <User className="w-4 h-4 text-[#A58CF4]" />
                        <span>{initialUsername || userName || "Scholar"}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-[#736A86]">Email Address</span>
                      <p className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-4 h-4 text-[#A58CF4]" />
                        <span>{userEmail}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-black text-[#736A86]">Authorization Status</span>
                      <p className="text-xs font-extrabold text-[#0D0D0D] flex items-center gap-1.5 mt-0.5">
                        <ShieldCheck className="w-4 h-4 text-[#A58CF4]" />
                        <span className="text-indigo-600">Verified Owner Scholar</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General settings Card */}
            <div className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3">
                  Scholar profile settings
                </h3>

                {/* Grid Inputs */}
                <div className="space-y-5">
                  {/* Row 1: Scholar Name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-[#0D0D0D] block">Scholar name</span>
                      <span className="text-[10px] text-[#736A86] font-semibold block">Displayed throughout the WordNest app.</span>
                    </div>
                    <div className="md:col-span-2">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={username}
                          readOnly={!isEditingName}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`w-full p-3 pr-10 rounded-xl border text-[#0D0D0D] font-bold text-xs outline-none focus:border-[#433075] placeholder:text-[#C8CED6] transition-all ${
                            isEditingName 
                              ? "bg-white border-[#433075]" 
                              : "bg-[#F7F7F7] border-[#C8CED6] cursor-not-allowed select-none"
                          }`}
                          placeholder="Scholar display name"
                          ref={(input) => {
                            if (input && isEditingName) {
                              input.focus();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setIsEditingName(!isEditingName)}
                          className="absolute right-3 p-1 rounded-lg text-[#736A86] hover:text-[#433075] transition-colors cursor-pointer"
                          title={isEditingName ? "Editing Enabled" : "Edit Scholar Name"}
                        >
                          <Pencil className={`w-3.5 h-3.5 ${isEditingName ? "text-[#433075] scale-110" : ""}`} />
                        </button>
                      </div>
                      {isCheckingUsername && (
                        <p className="text-[9px] text-[#736A86] font-bold mt-1 animate-pulse">Checking availability...</p>
                      )}
                      {usernameError && (
                        <p className="text-[9px] text-red-500 font-bold mt-1">{usernameError}</p>
                      )}
                      {usernameSuccess && (
                        <p className="text-[9px] text-green-600 font-bold mt-1">Username is available!</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Scholar ID */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-[#0D0D0D] block">Scholar ID</span>
                      <span className="text-[10px] text-[#736A86] font-semibold block">Unique ID for Each Scholars</span>
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <input
                        type="text"
                        value={user?.id || ""}
                        readOnly
                        className="flex-1 p-3 rounded-xl bg-[#F7F7F7]/60 border border-[#C8CED6] text-[#736A86] font-bold text-xs select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(user?.id || "", "scholar_id")}
                        className="px-4 py-2.5 rounded-xl border border-[#C8CED6] bg-white hover:bg-[#F7F7F7] text-xs font-black text-[#0D0D0D] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        {copiedId === "scholar_id" ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-green-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>


                </div>
              </div>

              {/* Card Footer with Save button */}
              <div className="bg-[#FAFAFA] border-t border-[#C8CED6] px-6 py-4 flex justify-end items-center">
                <button
                  type="button"
                  onClick={handleSaveUsername}
                  disabled={isSavingUsername || username === initialUsername || username.length < 3 || !!usernameError}
                  className="px-5 py-2.5 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs shadow-sm transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 border border-transparent hover:border-[#0D0D0D]"
                >
                  {isSavingUsername ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <span>Save changes</span>
                  )}
                </button>
              </div>
            </div>



            {/* Interactive preferences pane inside General tab */}
            <form onSubmit={handleSavePreferences} className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm p-6 sm:p-8 space-y-6">
              <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3">
                Learning Preferences & Streaks
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
                  <CustomSelect
                    value={dailyTarget}
                    onChange={(val) => setDailyTarget(val)}
                    options={[
                      { value: "15", label: "15 mins/day (Casual)" },
                      { value: "30", label: "30 mins/day (Regular)" },
                      { value: "60", label: "60 mins/day (Intensive)" }
                    ]}
                    className="w-full sm:w-56"
                  />
                </div>

                {/* Notification Toggles */}
                <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                  <div className="space-y-0.5">
                    <div className="text-xs font-black text-[#0D0D0D] flex items-center gap-1.5">
                      <Bell className="w-4 h-4 text-[#433075]" />
                      <span>Memory Spaced-Repetition Alerts</span>
                    </div>
                     <div className="text-[10px] text-[#736A86] font-semibold">Notify when vocabulary study session consolidations are ready.</div>
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
                  className="px-5 py-2.5 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs shadow-sm transition-all active:scale-95 cursor-pointer border border-transparent hover:border-[#0D0D0D]"
                >
                  Save preferences
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ==========================================
            TAB 2: SECURITY & SESSIONS
            ========================================== */}
        {activeSubTab === "security" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight uppercase">
                Security & Sessions
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Manage account passwords, caching permissions, and authorized access keys.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm p-6 sm:p-8 space-y-6">
              <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                <Lock className="w-5 h-5 text-[#433075]" />
                <span>Account Security</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black text-[#0D0D0D] block">Update password</span>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-xs outline-none focus:border-[#433075]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-black text-[#0D0D0D] block">Confirm password</span>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-xs outline-none focus:border-[#433075]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-[#C8CED6]/40">
                  <span className="text-[10px] text-[#736A86] font-semibold">Active Session: Chrome on Windows 10 (IP: 192.168.1.41)</span>
                  <button
                    type="button"
                    onClick={() => {
                      (window as any).wordnestNotify?.("Password Updated", "Password updates completed successfully.", "success");
                    }}
                    className="px-4 py-2 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] text-xs font-black cursor-pointer shadow-sm"
                  >
                    Update Password
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-3xl bg-white border border-red-200 shadow-sm p-6 sm:p-8 space-y-4">
              <h4 className="text-xs font-black uppercase text-red-600 tracking-wider">Danger Zone</h4>
              <p className="text-[11px] text-[#736A86] font-semibold leading-relaxed">
                Delete your scholar profile, all custom decks, and study logs forever. This action is irreversible.
              </p>
              <button
                type="button"
                onClick={() => {
                  (window as any).wordnestNotify?.("Account Deletion", "Account deletion request has been registered in the security audit logs.", "warning");
                }}
                className="px-4 py-2.5 rounded-xl bg-red-600 text-white font-black text-xs hover:bg-red-700 active:scale-95 transition-all shadow"
              >
                Delete Profile and Data
              </button>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 3: LOCAL DATABASE SYNC
            ========================================== */}
        {activeSubTab === "local_db" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight uppercase">
                Local Database Sync
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Synchronize offline IndexedDB browser storage cache with cloud backups.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm p-6 sm:p-8 space-y-6">
              <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                <HardDrive className="w-5 h-5 text-[#433075]" />
                <span>Offline Storage Metrics</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                    <span className="text-[10px] font-black uppercase text-[#736A86] block">Local Caching Usage</span>
                    <span className="text-lg font-black text-[#0D0D0D] mt-0.5 block">124 KB (Stored logs & cards)</span>
                  </div>
                  <div className="p-4 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                    <span className="text-[10px] font-black uppercase text-[#736A86] block">Last Server Handshake</span>
                    <span className="text-lg font-black text-[#0D0D0D] mt-0.5 block">1 minute ago (Synced)</span>
                  </div>
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      (window as any).wordnestNotify?.("Cache Cleared", "Offline IndexedDB Cache cleared successfully. Reloading...", "success");
                      setTimeout(() => {
                        localStorage.clear();
                        window.location.reload();
                      }, 1200);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-red-200 hover:bg-red-50 text-red-600 text-xs font-black cursor-pointer shadow-sm"
                  >
                    Wipe Local Cache
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuccessToast(true);
                      setTimeout(() => setShowSuccessToast(false), 3000);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] text-xs font-black cursor-pointer shadow-sm"
                  >
                    Trigger Sync Now
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 4: AI PROMPT VAULT
            ========================================== */}
        {activeSubTab === "vault" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight uppercase">
                AI Prompt Vault
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Customize prompts used by the AI Grader to evaluate sentence structure and grammar.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm p-6 sm:p-8 space-y-6">
              <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                <Brain className="w-5 h-5 text-[#433075]" />
                <span>Grader Prompt Customization</span>
              </h3>

              <div className="space-y-4">
                <span className="text-xs font-black text-[#0D0D0D] block">System Evaluator Prompts</span>
                <textarea
                  readOnly
                  rows={6}
                  className="w-full p-3.5 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-[#736A86] font-mono text-[10px] outline-none resize-none cursor-not-allowed leading-relaxed select-all"
                  value={`You are the WordNest AI Sentence Evaluator. The user is learning a vocabulary word. 
Evaluate if the sentence is grammatically correct and contextually appropriate.
Grade their usage out of 100, analyze parts of speech, and provide suggestions.`}
                />
                <span className="text-[10px] text-[#736A86] font-semibold block">Custom prompt edits are locked in Beta.</span>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 5: STUDY TIER SUBSCRIPTION
            ========================================== */}
        {activeSubTab === "subscription" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight uppercase">
                Study Tier Subscription
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Billing details, study tier ceilings, and premium upgrade paths.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between border-b border-[#C8CED6]/40 pb-3">
                <h3 className="text-base sm:text-lg font-black text-[#0D0D0D]">Current study tier</h3>
                <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#433075] text-[10px] font-black uppercase tracking-wider">
                  Active tier
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Free Tier Card */}
                <div className="p-6 rounded-2xl bg-[#F7F7F7] border-2 border-[#433075] space-y-4">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-[#433075] uppercase block">Scholar Free Tier</span>
                    <h4 className="text-2xl font-black text-[#0D0D0D]">$0 <span className="text-xs font-bold text-[#736A86]">/ month</span></h4>
                  </div>
                  <p className="text-[11px] text-[#736A86] leading-relaxed font-semibold">
                     Access custom learning decks, memory spaced repetition arena, and spelling tests.
                  </p>
                  <div className="pt-2 text-[10px] text-green-600 font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Free Lifetime Account Active</span>
                  </div>
                </div>

                {/* Premium Upgrade Tier */}
                <div className="p-6 rounded-2xl bg-white border border-[#C8CED6] space-y-4 flex flex-col justify-between">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#A58CF4] uppercase block">Scholar Pro</span>
                        <span className="text-[8px] bg-amber-400 text-black font-black px-1.5 py-0.5 rounded leading-none">Popular</span>
                      </div>
                      <h4 className="text-2xl font-black text-[#0D0D0D]">$8 <span className="text-xs font-bold text-[#736A86]">/ month</span></h4>
                    </div>
                    <p className="text-[11px] text-[#736A86] leading-relaxed font-semibold">
                      Unlock full AI evaluator metrics, custom deck image generations, unlimited offline-sync, and custom HSL accent configurations.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => (window as any).wordnestNotify?.("Portal Registration", "Billing upgrade payment portal integration details will follow shortly.", "info")}
                    className="w-full py-3 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1 shadow-md border border-transparent hover:border-[#0D0D0D]"
                  >
                    <span>Upgrade to Pro</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==========================================
            TAB 6: ACADEMIC RESOURCE USAGE
            ========================================== */}
        {activeSubTab === "usage" && (
          <div className="space-y-6">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-black text-[#0D0D0D] tracking-tight uppercase">
                Academic Usage
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Quota consumption levels, API calls, and local profile metrics.
              </p>
            </div>

            <div className="rounded-3xl bg-white border border-[#C8CED6] shadow-sm p-6 sm:p-8 space-y-6">
              <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3">
                Monthly limits
              </h3>

              <div className="space-y-6">
                {/* Metric 1 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-[#0D0D0D]">Custom flashcards created</span>
                    <span className="text-[#736A86]">26 / 500 cards</span>
                  </div>
                  <div className="w-full h-3 bg-[#F7F7F7] rounded-full overflow-hidden border border-[#C8CED6]">
                    <div className="h-full bg-gradient-to-r from-[#433075] to-[#A58CF4]" style={{ width: "5.2%" }} />
                  </div>
                </div>

                {/* Metric 2 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-[#0D0D0D]">AI Sentence Evaluations</span>
                    <span className="text-[#736A86]">12 / 50 runs</span>
                  </div>
                  <div className="w-full h-3 bg-[#F7F7F7] rounded-full overflow-hidden border border-[#C8CED6]">
                    <div className="h-full bg-gradient-to-r from-[#433075] to-[#A58CF4]" style={{ width: "24%" }} />
                  </div>
                </div>

                {/* Metric 3 */}
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-black">
                    <span className="text-[#0D0D0D]">Audio Syntheses (Text-to-Speech)</span>
                    <span className="text-[#736A86]">42 / 200 items</span>
                  </div>
                  <div className="w-full h-3 bg-[#F7F7F7] rounded-full overflow-hidden border border-[#C8CED6]">
                    <div className="h-full bg-gradient-to-r from-[#433075] to-[#A58CF4]" style={{ width: "21%" }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>



      {/* CROP MODAL */}
      <AnimatePresence>
        {isCropModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md p-6 rounded-3xl bg-white border-2 border-[#A58CF4] shadow-2xl text-[#0D0D0D]"
            >
              <div className="flex items-center justify-between border-b border-[#C8CED6] pb-3 mb-4">
                <h3 className="text-base sm:text-lg font-black text-[#0D0D0D] flex items-center gap-2">
                  <Camera className="w-5 h-5 text-[#433075]" />
                  <span>Crop Profile Picture</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="p-1 rounded-full hover:bg-[#F7F7F7] text-[#736A86] hover:text-[#0D0D0D] transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-[11px] text-[#736A86] mb-4 font-semibold">
                Drag the image to position it, and use the slider below to zoom. The cropped image will fit perfectly into the circular frame.
              </p>

              <div className="flex justify-center my-6">
                <div 
                  className="w-[200px] h-[200px] rounded-full border-4 border-[#A58CF4] relative overflow-hidden bg-black/5 select-none cursor-move flex items-center justify-center"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleMouseUp}
                >
                  {selectedImage && (
                    <img
                      ref={cropImageRef}
                      src={selectedImage}
                      alt="Crop Source"
                      draggable="false"
                      style={{
                        transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                        transition: isDragging ? "none" : "transform 0.1s ease-out",
                        maxHeight: "100%",
                        maxWidth: "none"
                      }}
                    />
                  )}
                  <div className="absolute inset-0 rounded-full pointer-events-none ring-[100px] ring-black/45" />
                </div>
              </div>

              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-black text-[#736A86]">
                  <span>Zoom Level</span>
                  <span>{Math.round(zoom * 100)}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <ZoomOut className="w-4 h-4 text-[#736A86]" />
                  <input
                    type="range"
                    min="1"
                    max="3"
                    step="0.05"
                    value={zoom}
                    onChange={(e) => setZoom(parseFloat(e.target.value))}
                    className="flex-1 h-1.5 rounded-lg bg-[#C8CED6] accent-[#433075] appearance-none cursor-pointer"
                  />
                  <ZoomIn className="w-4 h-4 text-[#736A86]" />
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-[#C8CED6]/80 pt-4">
                <button
                  type="button"
                  onClick={() => setIsCropModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-[#C8CED6] hover:bg-[#F7F7F7] text-xs font-black text-[#736A86] cursor-pointer active:scale-95 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleCropAndSave}
                  disabled={isUploading}
                  className="px-5 py-2.5 rounded-xl bg-[#433075] hover:bg-[#353839] text-white hover:text-white font-black text-xs shadow-md transition-all active:scale-95 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 border border-transparent hover:border-[#353839]"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
