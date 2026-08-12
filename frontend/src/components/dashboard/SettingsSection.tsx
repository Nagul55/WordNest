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
  ChevronRight,
  ChevronsRight,
  Brain,
  HardDrive,
  Pencil,
  AlertCircle,
  Compass
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import CustomSelect from "../ui/CustomSelect";

interface SettingsProps {
  user: any;
  onSignOut: () => void;
  onSignOutDirect?: () => void;
  userName: string;
  prefetchedSessions?: any[] | null;
  prefetchedFlashcards?: any[] | null;
}

export default function SettingsSection({ 
  user, 
  onSignOut, 
  onSignOutDirect,
  userName,
  prefetchedSessions,
  prefetchedFlashcards
}: SettingsProps) {
  const userEmail = user?.email || "";
  const [dailyTarget, setDailyTarget] = useState("30");
  const [notifications, setNotifications] = useState(true);
  const [streakReminders, setStreakReminders] = useState(true);
  const [age, setAge] = useState("");
  const [occupation, setOccupation] = useState("Student");
  const [referralSource, setReferralSource] = useState("Social Media");
  const [avatarError, setAvatarError] = useState(false);

  // Sidebar Sub-tabs active state
  const [activeSubTab, setActiveSubTab] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("settings_tab") || "general";
    }
    return "general";
  });

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (activeSubTab && activeSubTab !== "general") {
        params.set("settings_tab", activeSubTab);
      } else {
        params.delete("settings_tab");
      }
      const newUrl = "?" + params.toString() + window.location.hash;
      window.history.replaceState(null, "", newUrl);
    }
  }, [activeSubTab]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Account Deletion States
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);



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
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Dynamic Academic Usage Stats
  const [usageStats, setUsageStats] = useState({
    cardsCount: 0,
    aiEvaluationsCount: 0,
    audioSynthesesCount: 0
  });

  React.useEffect(() => {
    const fetchUsageData = async () => {
      if (!user?.id) return;
      try {
        const flashcardCount = (prefetchedFlashcards !== undefined && prefetchedFlashcards !== null)
          ? prefetchedFlashcards.length
          : ((await supabase
              .from("flashcards")
              .select("*", { count: "exact", head: true })
              .eq("user_id", user.id)).count || 0);

        const sessions = (prefetchedSessions !== undefined && prefetchedSessions !== null)
          ? prefetchedSessions
          : (await supabase
              .from("practice_sessions")
              .select("mode")
              .eq("user_id", user.id)).data;

        let aiCount = 0;
        let audioCount = 0;
        if (sessions) {
          sessions.forEach(s => {
            if (s.mode === "aigrader" || s.mode === "quiz") aiCount++;
            if (s.mode === "spelling" || s.mode === "flashcards") audioCount += 2;
          });
        }

        setUsageStats({
          cardsCount: flashcardCount || 0,
          aiEvaluationsCount: aiCount,
          audioSynthesesCount: audioCount
        });
      } catch (err) {
        console.warn("Notice: Failed to fetch usage stats", err);
      }
    };

    fetchUsageData();
  }, [user?.id, prefetchedSessions, prefetchedFlashcards]);
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
          .select("username, avatar_url, daily_target, notifications_enabled, streak_reminders_enabled, age, occupation, referral_source")
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
          if (data.age) setAge(data.age);
          if (data.occupation) setOccupation(data.occupation);
          if (data.referral_source) setReferralSource(data.referral_source);

          // Update local cache
          localStorage.setItem(profileKey, JSON.stringify({
            avatar_url: data.avatar_url,
            username: data.username,
            daily_target: data.daily_target?.toString(),
            notifications_enabled: data.notifications_enabled,
            streak_reminders_enabled: data.streak_reminders_enabled,
            age: data.age,
            occupation: data.occupation,
            referral_source: data.referral_source
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
          .select("id, username")
          .ilike("username", username);

        const isTaken = data?.some(
          (profile) => profile.username.toLowerCase() === username.toLowerCase() && profile.id !== user.id
        );

        if (isTaken) {
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

    try {
      // 1. Double check case-insensitive uniqueness one last time
      const { data: duplicateCheck } = await supabase
        .from("profiles")
        .select("id, username")
        .ilike("username", username);

      const isTaken = duplicateCheck?.some(
        (profile) => profile.username.toLowerCase() === username.toLowerCase() && profile.id !== user.id
      );

      if (isTaken) {
        setUsernameError("Username is already taken.");
        setUsernameSuccess(false);
        setIsSavingUsername(false);
        (window as any).wordnestNotify?.("Username Taken", "This display name is already registered by another scholar.", "error");
        return;
      }

      // 2. Perform database update and check error
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ username, updated_at: new Date().toISOString() })
        .eq("id", user.id);

      if (updateError) {
        console.error("Database update error:", updateError);
        (window as any).wordnestNotify?.("Update Failed", "This username is already taken. Please try another.", "error");
        setIsSavingUsername(false);
        return;
      }

      // 3. Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { username }
      });

      if (authError) {
        console.warn("Auth metadata update warning:", authError);
      }

      // 4. Update local storage only after database successfully updates!
      const profileKey = `wordnest_profile_${user?.id}`;
      const existing = localStorage.getItem(profileKey);
      const parsed = existing ? JSON.parse(existing) : {};
      localStorage.setItem(profileKey, JSON.stringify({ ...parsed, username }));

      setInitialUsername(username);
      setUsernameSuccess(false);
      setIsEditingName(false);
      (window as any).wordnestNotify?.("Profile Updated", "Scholar display name updated successfully.", "success");
    } catch (err: any) {
      console.warn("Notice: Error updating username:", err);
      (window as any).wordnestNotify?.("Update Failed", "An unexpected error occurred while updating profile.", "error");
    } finally {
      setIsSavingUsername(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== "DELETE" || !user?.id) return;

    setIsDeletingAccount(true);
    try {
      // 1. Get the current user session token
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      
      if (!token) throw new Error("No active session token found");

      // 2. Call the backend API to delete the user completely from auth.users (which cascade deletes profiles and data)
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/auth/delete`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to delete account securely");
      }

      // 3. Clear all local storage caches related to this user
      localStorage.removeItem(`wordnest_profile_${user.id}`);
      localStorage.removeItem(`wordnest_decks_${user.id}`);
      
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes(user.id) || key.includes("wordnest_"))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));

      (window as any).wordnestNotify?.("Account Deleted", "Your profile and study history have been cleared.", "success");

      // Close modal
      setShowDeleteConfirm(false);

      // 4. Sign out Supabase auth session client-side immediately
      await supabase.auth.signOut();

      // 5. Execute direct sign out navigation
      if (onSignOutDirect) {
        onSignOutDirect();
      } else {
        onSignOut();
      }

    } catch (err: any) {
      console.error("Account deletion exception:", err);
      (window as any).wordnestNotify?.("Deletion Failed", err.message || "An unexpected error occurred during account deletion.", "error");
    } finally {
      setIsDeletingAccount(false);
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

  const handleUpdatePassword = async () => {
    if (!newPassword.trim()) {
      (window as any).wordnestNotify?.("Error", "Password cannot be empty.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      (window as any).wordnestNotify?.("Error", "Passwords do not match.", "error");
      return;
    }
    if (newPassword.length < 6) {
      (window as any).wordnestNotify?.("Error", "Password must be at least 6 characters.", "error");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword.trim()
      });

      if (error) throw error;

      (window as any).wordnestNotify?.("Password Updated", "Your account password has been updated successfully.", "success");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      console.error("Failed to update password:", err);
      (window as any).wordnestNotify?.("Update Failed", err.message || "Failed to update password. Please try again.", "error");
    } finally {
      setIsUpdatingPassword(false);
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

  const scrollTabsRef = React.useRef<HTMLDivElement>(null);
  const [canScrollRight, setCanScrollRight] = React.useState(true);

  const checkTabScroll = () => {
    if (scrollTabsRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollTabsRef.current;
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 12);
    }
  };

  React.useEffect(() => {
    checkTabScroll();
    window.addEventListener("resize", checkTabScroll);
    return () => window.removeEventListener("resize", checkTabScroll);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const newName = username.trim();
    if (!newName) return;

    try {
      if (user?.id) {
        // 1. Save to local storage for instant offline loading
        localStorage.setItem(`wordnest_username_${user.id}`, newName);

        // 2. Upsert to Supabase profiles table
        await supabase.from("profiles").upsert({
          id: user.id,
          username: newName,
          full_name: newName,
          updated_at: new Date().toISOString()
        }, { onConflict: "id" });

        // 3. Update Supabase auth user metadata
        await supabase.auth.updateUser({
          data: { full_name: newName, name: newName, username: newName }
        });
      }

      // 4. Dispatch global real-time event to sync Welcome back banner instantly across app
      window.dispatchEvent(new CustomEvent("wordnest-profile-updated", {
        detail: { name: newName }
      }));

      (window as any).wordnestNotify?.(
        "Profile Updated",
        `Scholar name successfully updated to ${newName}.`,
        "success"
      );
      setIsEditingName(false);
    } catch (err: any) {
      console.warn("Notice: Profile saved locally:", err);
      window.dispatchEvent(new CustomEvent("wordnest-profile-updated", {
        detail: { name: newName }
      }));
      (window as any).wordnestNotify?.(
        "Profile Updated",
        `Scholar name updated to ${newName}.`,
        "success"
      );
      setIsEditingName(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Sidebar structures - filtered options based on user feedback
  interface SettingsTabItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const configTabs: SettingsTabItem[] = [
    { id: "general", label: "General Settings", icon: Settings },
    { id: "security", label: "Security and Sessions", icon: Lock }
  ];

  const integrationTabs: SettingsTabItem[] = [
    { id: "vault", label: "AI Prompt Vault", icon: ShieldCheck, badge: "BETA" }
  ];

  const billingTabs: SettingsTabItem[] = [
    { id: "subscription", label: "Study Tier", icon: CreditCard }
  ];

  const allSettingsTabs: SettingsTabItem[] = [...configTabs, ...integrationTabs, ...billingTabs];

  const handleTabClick = (tabId: string, e: React.MouseEvent<HTMLButtonElement>) => {
    setActiveSubTab(tabId);
    const container = scrollTabsRef.current;
    const button = e.currentTarget;
    if (container && button) {
      const containerWidth = container.clientWidth;
      const buttonLeft = button.offsetLeft;
      const buttonWidth = button.clientWidth;
      const targetScrollLeft = buttonLeft - (containerWidth / 2) + (buttonWidth / 2);
      
      container.scrollTo({
        left: Math.max(0, targetScrollLeft),
        behavior: "smooth"
      });
    }
    setTimeout(checkTabScroll, 350);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 pb-12 w-full max-w-full overflow-x-hidden scrollbar-hide no-scrollbar text-[#0D0D0D] relative min-h-[600px] animate-fadeIn">
      
      {/* MOBILE SCROLLABLE TAB STRIP (AUTOMATIC CENTER ALIGNMENT) */}
      <div className="lg:hidden w-full max-w-full flex items-center gap-2 pb-2 px-0">
        <div
          ref={scrollTabsRef}
          onScroll={checkTabScroll}
          className="flex items-center gap-2 overflow-x-auto no-scrollbar flex-1 scroll-smooth"
        >
          {allSettingsTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={(e) => handleTabClick(tab.id, e)}
                className={`px-4 py-2.5 rounded-2xl text-xs font-black shrink-0 transition-all duration-300 flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? "bg-[#433075] text-[#FAFAFA] border-[#A58CF4] shadow-md"
                    : "bg-white/90 text-[#4B5563] border-[#C8CED6]/60 hover:bg-white hover:text-[#433075]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {"badge" in tab && tab.badge && (
                  <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-[#0D0D0D]">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* CLEVER ">>" SCROLL SYMBOL BUTTON INLINE */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => {
              if (scrollTabsRef.current) {
                scrollTabsRef.current.scrollBy({ left: 160, behavior: "smooth" });
              }
            }}
            className="shrink-0 p-2.5 rounded-2xl bg-[#433075] text-[#FAFAFA] border border-[#A58CF4] shadow-md hover:bg-[#352560] active:scale-90 transition-all cursor-pointer flex items-center justify-center"
            title="Scroll tabs right"
          >
            <ChevronsRight className="w-4 h-4 text-[#A58CF4]" />
          </button>
        )}
      </div>

      {/* LEFT COLUMN: THE SIDEBAR (DESKTOP ONLY) */}
      <div className="hidden lg:block w-72 shrink-0 bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 rounded-[2rem] p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8 self-start lg:sticky lg:top-6 z-10 overflow-hidden relative">
        {/* Subtle Background SVG Accents */}
        <Settings className="absolute -top-10 -right-10 w-40 h-40 text-[#433075]/5 pointer-events-none rotate-45" />

        <div className="space-y-8 relative z-10">
          
          {/* Section 1: CONFIGURATION */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-[#A58CF4] tracking-widest px-3 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#A58CF4]" />
              Configuration
            </h4>
            <div className="space-y-1.5">
              {configTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-3 cursor-pointer group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-[#433075] to-[#272A3B] text-[#FAFAFA] shadow-md shadow-[#433075]/20"
                        : "bg-transparent text-[#736A86] hover:bg-white hover:text-[#433075] hover:shadow-sm"
                    }`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />}
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: INTEGRATIONS */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-[#A58CF4] tracking-widest px-3 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#A58CF4]" />
              Integrations
            </h4>
            <div className="space-y-1.5">
              {integrationTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black transition-all duration-300 flex items-center justify-between cursor-pointer group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-[#433075] to-[#272A3B] text-[#FAFAFA] shadow-md shadow-[#433075]/20"
                        : "bg-transparent text-[#736A86] hover:bg-white hover:text-[#433075] hover:shadow-sm"
                    }`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />}
                    <div className="flex items-center gap-3 relative z-10">
                      <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className={`text-[9px] font-black px-2 py-1 rounded-md leading-none shadow-sm relative z-10 transition-colors duration-300 ${
                        isActive ? "bg-amber-400 text-[#0D0D0D]" : "bg-indigo-50 border border-indigo-100 text-[#433075]"
                      }`}>
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: BILLING */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-black uppercase text-[#A58CF4] tracking-widest px-3 flex items-center gap-2">
              <div className="w-1 h-1 rounded-full bg-[#A58CF4]" />
              Billing
            </h4>
            <div className="space-y-1.5">
              {billingTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeSubTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSubTab(tab.id)}
                    className={`w-full text-left px-4 py-3 rounded-2xl text-xs font-black transition-all duration-300 flex items-center gap-3 cursor-pointer group relative overflow-hidden ${
                      isActive
                        ? "bg-gradient-to-r from-[#433075] to-[#272A3B] text-[#FAFAFA] shadow-md shadow-[#433075]/20"
                        : "bg-transparent text-[#736A86] hover:bg-white hover:text-[#433075] hover:shadow-sm"
                    }`}
                  >
                    {isActive && <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-50" />}
                    <Icon className={`w-4 h-4 shrink-0 transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`} />
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sign Out */}
          <div className="pt-6 border-t border-[#C8CED6]/40 mt-4">
            <button
              onClick={onSignOut}
              className="w-full px-4 py-3.5 rounded-2xl bg-red-50 hover:bg-red-500 text-red-600 hover:text-white font-black text-xs transition-all duration-300 flex items-center gap-3 cursor-pointer group shadow-sm hover:shadow-md hover:shadow-red-500/20"
            >
              <LogOut className="w-4 h-4 shrink-0 group-hover:-translate-x-1 transition-transform duration-300" />
              <span>Sign Out Session</span>
            </button>
          </div>

        </div>
      </div>

      {/* RIGHT COLUMN: DYNAMIC PANEL DISPLAY */}
      <div className="flex-1 min-w-0 w-full max-w-full space-y-6 overflow-x-hidden">
        
        {/* ==========================================
            TAB 1: GENERAL SETTINGS
            ========================================== */}
        {activeSubTab === "general" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 relative w-full"
          >
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <Settings className="hidden sm:block absolute top-20 right-0 w-64 h-64 text-[#433075]/5 rotate-12 z-0" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <h1 className="text-xl xs:text-2xl sm:text-4xl lg:text-5xl font-black text-[#0D0D0D] tracking-tight uppercase flex flex-wrap items-center gap-2 sm:gap-3">
                Scholar <span className="text-[#A58CF4]">Settings</span>
              </h1>
              <p className="text-xs sm:text-base lg:text-lg text-[#736A86] font-extrabold leading-relaxed">
                Profile details, daily learning target, and retention preferences.
              </p>
            </div>


            {/* Profile Avatar configuration Card */}
            <div className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 p-6 sm:p-8 space-y-6 relative z-10">
              <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                <User className="w-6 h-6 text-[#A58CF4]" />
                <span>Scholar Profile Details</span>
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
                    <Camera className="w-3.5 h-3.5" />
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
                      <span className="text-xs sm:text-sm uppercase font-black text-[#736A86] tracking-wider">Scholar Username</span>
                      <p className="text-sm sm:text-base font-black text-[#0D0D0D] flex items-center gap-1.5 mt-1">
                        <User className="w-4.5 h-4.5 text-[#A58CF4]" />
                        <span>{initialUsername || userName || "Scholar"}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm uppercase font-black text-[#736A86] tracking-wider">Email Address</span>
                      <p className="text-sm sm:text-base font-black text-[#0D0D0D] flex items-center gap-1.5 mt-1">
                        <Mail className="w-4.5 h-4.5 text-[#A58CF4]" />
                        <span>{userEmail}</span>
                      </p>
                    </div>
                    <div>
                      <span className="text-xs sm:text-sm uppercase font-black text-[#736A86] tracking-wider">Authorization Status</span>
                      <p className="text-sm sm:text-base font-black text-[#0D0D0D] flex items-center gap-1.5 mt-1">
                        <ShieldCheck className="w-4.5 h-4.5 text-[#A58CF4]" />
                        <span className="text-indigo-600 font-black">Verified Owner Scholar</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* General settings Card */}
            <form onSubmit={handleSaveProfile} className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 overflow-hidden relative z-10">
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-lg sm:text-xl lg:text-2xl font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                  <User className="w-6 h-6 text-[#A58CF4]" />
                  <span>Scholar profile settings</span>
                </h3>

                {/* Grid Inputs */}
                <div className="space-y-5">
                  {/* Row 1: Scholar Name */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <div className="space-y-0.5">
                      <span className="text-sm sm:text-base font-black text-[#0D0D0D] block">Scholar name</span>
                      <span className="text-xs sm:text-sm text-[#736A86] font-extrabold block">Displayed throughout the WordNest app.</span>
                    </div>
                    <div className="md:col-span-2">
                      <div className="relative flex items-center">
                        <input
                          type="text"
                          value={username}
                          readOnly={!isEditingName}
                          onChange={(e) => setUsername(e.target.value)}
                          className={`w-full p-3.5 sm:p-4 pr-10 rounded-2xl border text-[#0D0D0D] font-black text-sm sm:text-base outline-none focus:border-[#433075] placeholder:text-[#C8CED6] transition-all ${
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
                          className="absolute right-3.5 p-1 rounded-lg text-[#736A86] hover:text-[#433075] transition-colors cursor-pointer"
                          title={isEditingName ? "Editing Enabled" : "Edit Scholar Name"}
                        >
                          <Pencil className={`w-4 h-4 ${isEditingName ? "text-[#433075] scale-110" : ""}`} />
                        </button>
                      </div>
                      {isCheckingUsername && (
                        <p className="text-xs text-[#736A86] font-black mt-1 animate-pulse">Checking availability...</p>
                      )}
                      {usernameError && (
                        <p className="text-xs text-red-500 font-black mt-1">{usernameError}</p>
                      )}
                      {usernameSuccess && (
                        <p className="text-xs text-green-600 font-black mt-1">Username is available!</p>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Scholar ID */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                    <div className="space-y-0.5">
                      <span className="text-sm sm:text-base font-black text-[#0D0D0D] block">Scholar ID</span>
                      <span className="text-xs sm:text-sm text-[#736A86] font-extrabold block">Unique ID for Each Scholars</span>
                    </div>
                    <div className="md:col-span-2 flex gap-2">
                      <input
                        type="text"
                        value={user?.id || ""}
                        readOnly
                        className="flex-1 p-3.5 sm:p-4 rounded-2xl bg-[#F7F7F7]/60 border border-[#C8CED6] text-[#736A86] font-black text-xs sm:text-sm select-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleCopyText(user?.id || "", "scholar_id")}
                        className="px-5 py-3 sm:py-3.5 rounded-2xl border border-[#C8CED6] bg-white hover:bg-[#F7F7F7] text-xs sm:text-sm font-black text-[#0D0D0D] transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 shadow-sm"
                      >
                        {copiedId === "scholar_id" ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
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
                  className="px-6 py-3 sm:py-3.5 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 border border-transparent hover:border-[#0D0D0D]"
                >
                  {isSavingUsername ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving changes...</span>
                    </>
                  ) : (
                    <span>Save changes</span>
                  )}
                </button>
              </div>
            </form>



            {/* Interactive preferences pane inside General tab */}
            <form onSubmit={handleSavePreferences} className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 p-6 sm:p-8 space-y-6 relative z-10">
              <h3 className="text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                <Globe className="w-5 h-5 text-[#A58CF4]" />
                <span>Learning Preferences and Streaks</span>
              </h3>

              <div className="space-y-4">
                {/* Daily Goal Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                  <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-black text-[#0D0D0D] flex items-center gap-1.5">
                      <Clock className="w-4.5 h-4.5 text-[#433075]" />
                      <span>Daily Learning Target</span>
                    </div>
                    <div className="text-xs sm:text-sm text-[#736A86] font-extrabold">Consolidates study metrics and streak reminders.</div>
                  </div>
                  <CustomSelect
                    value={dailyTarget}
                    onChange={(val) => setDailyTarget(val)}
                    options={[
                      { value: "15", label: "15 mins/day (Casual)" },
                      { value: "30", label: "30 mins/day (Regular)" },
                      { value: "60", label: "60 mins/day (Intensive)" }
                    ]}
                    className="w-full sm:w-64"
                  />
                </div>

                {/* Notification Toggles */}
                <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                  <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-black text-[#0D0D0D] flex items-center gap-1.5">
                      <Bell className="w-4.5 h-4.5 text-[#433075]" />
                      <span>Memory Spaced-Repetition Alerts</span>
                    </div>
                     <div className="text-xs sm:text-sm text-[#736A86] font-extrabold">Notify when vocabulary study session consolidations are ready.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNotifications(!notifications)}
                    className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                      notifications ? "bg-[#433075]" : "bg-[#C8CED6]"
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-transform left-1 ${
                        notifications ? "transform translate-x-5.5" : ""
                      }`}
                    />
                  </button>
                </div>

                {/* Streak Reminders */}
                <div className="flex items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6]">
                  <div className="space-y-0.5">
                    <div className="text-sm sm:text-base font-black text-[#0D0D0D] flex items-center gap-1.5">
                      <Flame className="w-4.5 h-4.5 text-[#433075]" />
                      <span>Streak Defense Reminders</span>
                    </div>
                    <div className="text-xs sm:text-sm text-[#736A86] font-extrabold">Send alerts before streak expiration timelines.</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStreakReminders(!streakReminders)}
                    className={`w-12 h-6.5 rounded-full transition-colors relative focus:outline-none shrink-0 ${
                      streakReminders ? "bg-[#433075]" : "bg-[#C8CED6]"
                    }`}
                  >
                    <span
                      className={`w-4.5 h-4.5 rounded-full bg-white absolute top-1 transition-transform left-1 ${
                        streakReminders ? "transform translate-x-5.5" : ""
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 sm:py-3.5 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer border border-transparent hover:border-[#0D0D0D]"
                >
                  Save preferences
                </button>
              </div>
            </form>

            {/* Account Session & Sign Out Card */}
            <div className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-rose-500/30 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-rose-500/60 transition-all duration-300 p-6 sm:p-8 space-y-4 relative z-10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h3 className="text-lg sm:text-xl font-black text-[#0D0D0D] flex items-center gap-2">
                    <LogOut className="w-5 h-5 text-rose-500" />
                    <span>Account Session Sign Out</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-[#736A86] font-medium">
                    Securely sign out of your WordNest scholar account session on this device.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onSignOut}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-xs sm:text-sm shadow-md transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-2 border border-rose-600 shrink-0"
                >
                  <LogOut className="w-4 h-4 text-white" />
                  <span>Sign Out Account</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==========================================
            TAB 2: SECURITY & SESSIONS
            ========================================== */}
        {activeSubTab === "security" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 relative w-full"
          >
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <ShieldCheck className="hidden sm:block absolute top-20 right-0 w-64 h-64 text-[#433075]/5 rotate-12 z-0" />
            </div>
            
            <div className="space-y-2 relative z-10">
              <h1 className="text-xl xs:text-2xl sm:text-4xl font-extrabold text-[#0D0D0D] tracking-tight uppercase flex flex-wrap items-center gap-2 sm:gap-3">
                Security and <span className="text-[#A58CF4]">Sessions</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Manage account passwords, caching permissions, and authorized access keys.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 p-6 sm:p-8 space-y-6 relative z-10">
              <h3 className="text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                <Key className="w-5 h-5 text-[#A58CF4]" />
                <span>Account Security</span>
              </h3>

              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-black text-[#0D0D0D] block">Update password</span>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-xs outline-none focus:border-[#433075]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-black text-[#0D0D0D] block">Confirm password</span>
                    <input
                      type="password"
                      placeholder="Confirm new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-xs outline-none focus:border-[#433075]"
                    />
                  </div>
                </div>

                <div className="pt-2 flex justify-between items-center border-t border-[#C8CED6]/40">
                  <span className="text-[10px] text-[#736A86] font-semibold">Active Session: Chrome on Windows 10 (IP: 192.168.1.41)</span>
                  <button
                    type="button"
                    onClick={handleUpdatePassword}
                    disabled={isUpdatingPassword}
                    className="px-4 py-2 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] text-xs font-black cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {isUpdatingPassword ? "Updating..." : "Update Password"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-red-50/50 backdrop-blur-xl border border-red-200 shadow-sm hover:shadow-md hover:border-red-400 transition-all duration-300 p-6 sm:p-8 space-y-4 relative z-10">
              <h4 className="text-xs sm:text-sm font-black uppercase text-red-600 tracking-wider flex items-center gap-1.5">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>Danger Zone</span>
              </h4>
              <p className="text-xs text-[#736A86] font-semibold leading-relaxed">
                Delete your scholar profile, all custom decks, and study logs forever. This action is permanent and irreversible.
              </p>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(true);
                  setDeleteConfirmText("");
                }}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all shadow-md active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                <span>Delete Profile and Data</span>
              </button>
            </div>
            </motion.div>
        )}



        {/* ==========================================
            TAB 4: AI PROMPT VAULT
            ========================================== */}
        {activeSubTab === "vault" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 relative w-full"
          >
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <Brain className="hidden sm:block absolute top-20 right-0 w-64 h-64 text-[#433075]/5 rotate-12 z-0" />
            </div>

            <div className="space-y-2 relative z-10">
              <h1 className="text-xl xs:text-2xl sm:text-4xl font-extrabold text-[#0D0D0D] tracking-tight uppercase flex flex-wrap items-center gap-2 sm:gap-3">
                AI Prompt <span className="text-[#A58CF4]">Vault</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Customize prompts used by the AI Grader to evaluate sentence structure and grammar.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 p-6 sm:p-8 space-y-6 relative z-10">
              <h3 className="text-lg font-black text-[#0D0D0D] border-b border-[#C8CED6]/40 pb-3 flex items-center gap-2">
                <Terminal className="w-5 h-5 text-[#A58CF4]" />
                <span>Grader Prompt Customization</span>
              </h3>

              <div className="space-y-4">
                <span className="text-sm sm:text-base font-black text-[#0D0D0D] block">System Evaluator Prompts</span>
                <textarea
                  readOnly
                  rows={6}
                  className="w-full p-4 sm:p-5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] font-mono text-xs sm:text-sm font-black outline-none resize-none cursor-not-allowed leading-relaxed select-all shadow-inner"
                  value={`You are the WordNest AI Sentence Evaluator. The user is learning a vocabulary word. 
Evaluate if the sentence is grammatically correct and contextually appropriate.
Grade their usage out of 100, analyze parts of speech, and provide suggestions.`}
                />
                <span className="text-xs sm:text-sm text-[#736A86] font-extrabold block">Custom prompt edits are locked in Beta.</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* ==========================================
            TAB 5: STUDY TIER SUBSCRIPTION
            ========================================== */}
        {activeSubTab === "subscription" && (
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 relative w-full"
          >
            <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
              <CreditCard className="hidden sm:block absolute top-20 right-0 w-64 h-64 text-[#433075]/5 rotate-12 z-0" />
            </div>

            <div className="space-y-2 relative z-10">
              <h1 className="text-xl xs:text-2xl sm:text-4xl font-extrabold text-[#0D0D0D] tracking-tight uppercase flex flex-wrap items-center gap-2 sm:gap-3">
                Study Tier <span className="text-[#A58CF4]">Subscription</span>
              </h1>
              <p className="text-xs sm:text-sm text-[#736A86] font-semibold leading-relaxed">
                Billing details, study tier ceilings, and premium upgrade paths.
              </p>
            </div>

            <div className="rounded-[2rem] bg-white/70 backdrop-blur-xl border border-[#C8CED6]/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:border-[#A58CF4]/40 transition-all duration-300 p-6 sm:p-8 space-y-6 relative z-10">
              <div className="flex items-center justify-between border-b border-[#C8CED6]/40 pb-3">
                <h3 className="text-lg font-black text-[#0D0D0D] flex items-center gap-2">
                  <Flame className="w-5 h-5 text-[#A58CF4]" />
                  <span>Current study tier</span>
                </h3>
                <span className="px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-[#433075] text-[10px] font-black uppercase tracking-wider">
                  Active tier
                </span>
              </div>

              <div className="flex justify-center">
                {/* Free Tier Card */}
                <div className="p-6 rounded-2xl bg-[#F7F7F7] border-2 border-[#433075] space-y-4 max-w-md w-full">
                  <div className="space-y-1">
                    <span className="text-xs font-black text-[#433075] uppercase block">Scholar Free Tier</span>
                    <h4 className="text-2xl font-black text-[#0D0D0D]">$0 <span className="text-xs font-bold text-[#736A86]">/ month</span></h4>
                  </div>
                  <p className="text-[11px] text-[#736A86] leading-relaxed font-semibold">
                     Access custom learning decks, memory spaced recall arena, and spelling tests.
                  </p>
                  <div className="pt-2 text-[10px] text-green-600 font-extrabold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    <span>Free Lifetime Account Active</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
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

      {/* Account Deletion Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <div 
            onClick={(e) => {
              if (e.target === e.currentTarget && !isDeletingAccount) {
                setShowDeleteConfirm(false);
              }
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fadeIn"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 sm:p-8 rounded-3xl shadow-2xl max-w-md w-full border border-red-200 text-center space-y-5 max-h-[90vh] overflow-y-auto relative"
            >
              {/* Close Button */}
              <button
                type="button"
                disabled={isDeletingAccount}
                onClick={() => setShowDeleteConfirm(false)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-red-50 text-[#736A86] hover:text-red-600 transition-colors cursor-pointer disabled:opacity-30"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="mx-auto w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center shadow-inner">
                <Lock className="w-7 h-7 text-red-600" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base sm:text-lg font-black text-red-600 uppercase tracking-tight">Confirm Account Deletion</h3>
                <p className="text-xs text-[#736A86] leading-relaxed font-semibold">
                  This action is permanent and irreversible. Your profile, custom study decks, learning history, and AI session logs will be completely wiped from the system.
                </p>
              </div>
              
              <div className="space-y-3 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black uppercase text-[#736A86] block text-left">
                    Type <span className="text-red-600 font-extrabold select-all">DELETE</span> to confirm:
                  </label>
                  <button
                    type="button"
                    disabled={isDeletingAccount}
                    onClick={() => setDeleteConfirmText("DELETE")}
                    className="text-[10px] font-black text-[#433075] bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-lg transition-all active:scale-95 cursor-pointer disabled:opacity-50"
                  >
                    Tap to fill DELETE
                  </button>
                </div>
                
                <input
                  type="text"
                  value={deleteConfirmText}
                  disabled={isDeletingAccount}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="Type DELETE"
                  autoCapitalize="characters"
                  autoCorrect="off"
                  spellCheck={false}
                  className="w-full p-3.5 rounded-xl border border-[#C8CED6] text-[#0D0D0D] font-black text-sm outline-none focus:border-red-500 text-center placeholder:text-[#C8CED6] transition-all bg-[#FAFAFA] disabled:opacity-50"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-3">
                <button
                  type="button"
                  disabled={isDeletingAccount}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="w-full sm:w-1/2 py-3 rounded-xl border border-[#C8CED6] hover:bg-[#F7F7F7] text-[#736A86] font-black text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText.trim().toUpperCase() !== "DELETE" || isDeletingAccount}
                  className="w-full sm:w-1/2 py-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all cursor-pointer shadow-lg disabled:opacity-40 disabled:cursor-not-allowed border border-transparent hover:border-red-700 flex items-center justify-center gap-2"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Delete Account</span>
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
