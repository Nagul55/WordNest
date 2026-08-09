"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { 
  Flame,
  Bell,
  CheckCircle2,
  Info,
  Sparkles,
  AlertTriangle,
  X,
  Trash2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Import modular feature sections & staggered menu navigation
import OverviewSection from "./dashboard/OverviewSection";
import VocabularySection from "./dashboard/VocabularySection";
import FlashcardsSection from "./dashboard/FlashcardsSection";
import AILabsSection from "./dashboard/AILabsSection";
import AnalyticsSection from "./dashboard/AnalyticsSection";
import SettingsSection from "./dashboard/SettingsSection";
import DecksSection from "./dashboard/DecksSection";
import PracticeSection from "./dashboard/PracticeSection";
import StaggeredMenu from "./StaggeredMenu";
import { supabase } from "@/lib/supabase";

interface DashboardProps {
  user: any;
  onSignOut: () => void;
}

type NavSection = "home" | "decks" | "practice" | "progress" | "settings";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "success" | "info" | "warning" | "error" | "update";
  timestamp: Date;
  read: boolean;
}

export default function Dashboard({ user, onSignOut }: DashboardProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [bellWiggle, setBellWiggle] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const playChimeSound = () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(start);
        osc.stop(start + duration);
      };
      
      const now = ctx.currentTime;
      playNote(523.25, now, 0.35); // C5
      playNote(659.25, now + 0.1, 0.45); // E5
    } catch (err) {
      console.warn("Audio Context alert sound bypass:", err);
    }
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleRemoveNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const formatRelativeTime = (date: Date) => {
    const diff = Date.now() - date.getTime();
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (seconds < 60) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  // Set up global notify function on window
  React.useEffect(() => {
    const handleNewNotification = (e: Event) => {
      const customEvent = e as CustomEvent<{ title: string; message: string; type: NotificationItem['type'] }>;
      if (!customEvent.detail) return;
      const { title, message, type } = customEvent.detail;
      
      const newNotif: NotificationItem = {
        id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title,
        message,
        type: type || "info",
        timestamp: new Date(),
        read: false
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      
      // Trigger wiggle animation on the bell icon
      setBellWiggle(true);
      setTimeout(() => setBellWiggle(false), 800);
      
      // Play chime alert
      playChimeSound();
    };

    window.addEventListener("wordnest-notification" as any, handleNewNotification);
    
    // Bind to window object for ease of global calling
    (window as any).wordnestNotify = (title: string, message: string, type?: NotificationItem['type']) => {
      window.dispatchEvent(new CustomEvent("wordnest-notification", {
        detail: { title, message, type: type || "info" }
      }));
    };

    // Push initial welcome notification once per session
    const welcomeSessionKey = `wordnest_welcome_${user?.id || "guest"}`;
    let welcomeTimer: any = null;
    
    if (!sessionStorage.getItem(welcomeSessionKey)) {
      welcomeTimer = setTimeout(() => {
        (window as any).wordnestNotify?.(
          "Welcome to WordNest!",
          "Your offline spaced-repetition dictionary is active and ready.",
          "update"
        );
        sessionStorage.setItem(welcomeSessionKey, "true");
      }, 1500);
    }

    return () => {
      window.removeEventListener("wordnest-notification" as any, handleNewNotification);
      delete (window as any).wordnestNotify;
      if (welcomeTimer) clearTimeout(welcomeTimer);
    };
  }, [user?.id]);

  const [activeTab, setActiveTab] = useState<NavSection>("home");
  const [practiceSubTab, setPracticeSubTab] = useState<"vocabulary" | "ailabs" | "flashcards">("vocabulary");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

  // Global Staggered Prefetching States
  const [prefetchedDecks, setPrefetchedDecks] = useState<any[] | null>(null);
  const [prefetchedSessions, setPrefetchedSessions] = useState<any[] | null>(null);
  const [prefetchedVocab, setPrefetchedVocab] = useState<any[] | null>(null);
  const [prefetchedFlashcards, setPrefetchedFlashcards] = useState<any[] | null>(null);

  const prefetchAllData = React.useCallback(async () => {
    if (!user?.id) return;
    try {
      const [decksRes, sessionsRes, vocabRes, flashcardsRes] = await Promise.all([
        supabase.from("study_sets").select("*").eq("user_id", user.id).order("created_at", { ascending: true }),
        supabase.from("practice_sessions").select("*").eq("user_id", user.id),
        supabase.from("vocabulary_vault").select("*").eq("user_id", user.id),
        supabase.from("flashcards").select("*").eq("user_id", user.id)
      ]);

      setPrefetchedDecks(decksRes.data || []);
      setPrefetchedSessions(sessionsRes.data || []);
      setPrefetchedVocab(vocabRes.data || []);
      setPrefetchedFlashcards(flashcardsRes.data || []);
    } catch (e) {
      console.warn("Notice: Staggered prefetch failed to load database records", e);
    }
  }, [user?.id]);

  useEffect(() => {
    prefetchAllData();

    const handleDataChanged = () => {
      prefetchAllData();
    };

    window.addEventListener("wordnest-data-changed", handleDataChanged);
    return () => {
      window.removeEventListener("wordnest-data-changed", handleDataChanged);
    };
  }, [user?.id, prefetchAllData]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setIsScrolled(e.currentTarget.scrollTop > 10);
  };

  const scrollToTop = () => {
    if (mainRef.current) {
      mainRef.current.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };

  const handleTabChange = (tab: NavSection) => {
    setActiveTab(tab);
    prefetchAllData(); // Re-sync latest database records on tab switch!
    const params = new URLSearchParams(window.location.search);
    params.set("tab", tab);
    window.history.pushState(null, "", "?" + params.toString() + window.location.hash);
  };

  // Sync tab state with URL search params (enables browser Back/Forward/Reload buttons)
  React.useEffect(() => {
    // Initial history replacement to clean auth redirects
    const params = new URLSearchParams(window.location.search);
    const tab = (params.get("tab") as NavSection) || "home";
    params.set("tab", tab);
    
    // Clear Google OAuth hashes but preserve deck details state hashes
    const hash = window.location.hash;
    const cleanHash = hash.startsWith("#deck-") ? hash : "";
    
    // replaceState pops login or OAuth redirect pages off the browser history stack!
    window.history.replaceState(null, "", "?" + params.toString() + cleanHash);
    setActiveTab(tab);

    // Push an initial history entry to serve as a safety buffer for trapping back button actions on the Home tab
    window.history.pushState(null, "", "?" + params.toString() + cleanHash);

    const handlePopState = () => {
      const currentParams = new URLSearchParams(window.location.search);
      const currentTab = currentParams.get("tab");
      
      // If the user goes back and loses the tab parameter (navigating back to login/auth), block it and trap them on the Home tab!
      if (!currentTab) {
        window.history.pushState(null, "", "?tab=home" + window.location.hash);
        setActiveTab("home");
      } else {
        setActiveTab(currentTab as NavSection);
      }
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Derive display names dynamically from Supabase profiles table, auth metadata, or local storage cache
  const userEmail = user?.email || "";
  const defaultName = user?.user_metadata?.full_name || user?.user_metadata?.name || (userEmail ? userEmail.split("@")[0] : "") || "Scholar";
  const [displayUserName, setDisplayUserName] = useState<string>(() => {
    if (typeof window !== "undefined" && user?.id) {
      const cached = localStorage.getItem(`wordnest_username_${user.id}`);
      if (cached) return cached;
    }
    return defaultName;
  });

  React.useEffect(() => {
    if (!user?.id) return;

    const syncProfileName = async () => {
      try {
        const { data } = await supabase.from("profiles").select("username, full_name").eq("id", user.id).maybeSingle();
        if (data?.username || data?.full_name) {
          const fetchedName = data.username || data.full_name;
          setDisplayUserName(fetchedName);
          localStorage.setItem(`wordnest_username_${user.id}`, fetchedName);
        }
      } catch (err) {
        console.warn("Notice: Profile name sync warning:", err);
      }
    };

    syncProfileName();

    const handleProfileUpdated = (e: any) => {
      if (e.detail?.name) {
        setDisplayUserName(e.detail.name);
        localStorage.setItem(`wordnest_username_${user.id}`, e.detail.name);
      }
    };

    window.addEventListener("wordnest-profile-updated" as any, handleProfileUpdated);
    return () => window.removeEventListener("wordnest-profile-updated" as any, handleProfileUpdated);
  }, [user?.id]);

  // Menu items list
  const menuItems = [
    { id: "home", label: "Home", ariaLabel: "Switch to Home" },
    { id: "decks", label: "Decks", ariaLabel: "Switch to Decks" },
    { id: "practice", label: "Practice", ariaLabel: "Switch to Practice" },
    { id: "progress", label: "Progress", ariaLabel: "Switch to Progress" },
    { id: "settings", label: "Settings", ariaLabel: "Switch to Settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6] text-[#0D0D0D] overflow-hidden relative">
      
      {/* ==========================================
          MAIN AREA (FLOATING HEADER + SCROLLABLE CONTENT)
          ========================================== */}
      <div className="flex-1 flex flex-col h-full w-full min-w-0 bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6] overflow-hidden relative">
        
        {/* Floating header with dynamic background on scroll */}
        <header className={`absolute top-0 left-0 right-0 px-4 xs:px-6 sm:px-8 lg:px-10 z-30 transition-all duration-300 flex items-center justify-between ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md border-b border-[#C8CED6]/60 shadow-sm py-3.5 sm:py-4" 
            : "bg-transparent py-5 sm:py-7 border-b border-transparent shadow-none"
        }`}>
          
          {/* LEFT: Brand Logo & Aligned Title */}
          <div 
            onClick={scrollToTop}
            className="flex items-center gap-2 sm:gap-2.5 select-none cursor-pointer shrink-0"
          >
            <div className="w-8 h-8 sm:w-10 sm:h-10 relative shrink-0">
              <Image src="/Wordnest.svg" alt="WordNest Application Logo" fill className="object-contain" priority />
            </div>
            <div className="flex items-center tracking-tight leading-none pt-0.5 righteous-regular font-black">
              <span className="text-lg xs:text-xl sm:text-[1.8rem] text-[#3B153A]">Word</span>
              <span className="text-lg xs:text-xl sm:text-[1.8rem] text-[#F0C987]">Nest</span>
            </div>
          </div>

          {/* RIGHT: Staggered Menu Toggle & Action Pair */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {/* Custom keyframes style inject */}
            <style>{`
              @keyframes wiggle {
                0% { transform: rotate(0); }
                15% { transform: rotate(15deg); }
                30% { transform: rotate(-15deg); }
                45% { transform: rotate(10deg); }
                60% { transform: rotate(-10deg); }
                75% { transform: rotate(5deg); }
                85% { transform: rotate(-5deg); }
                100% { transform: rotate(0); }
              }
              .animate-wiggle {
                animation: wiggle 0.8s ease-in-out;
              }
            `}</style>

            {/* Notification Bell & Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className={`p-2 sm:p-2.5 rounded-full sm:rounded-xl border border-[#C8CED6] bg-white/90 backdrop-blur-md hover:bg-[#F7F7F7] text-[#0D0D0D] transition-all cursor-pointer relative active:scale-95 shadow-sm flex items-center justify-center ${
                  showNotifications ? "bg-[#F0EDF7] border-[#433075] ring-2 ring-[#433075]/20" : ""
                }`}
                title="View Notifications"
              >
                <Bell className={`w-4 h-4 text-[#433075] ${bellWiggle ? "animate-wiggle text-amber-500" : ""}`} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 sm:-top-1.5 sm:-right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[9px] font-black border border-white animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <>
                    {/* Backdrop to close dropdown on click outside */}
                    <div 
                      className="fixed inset-0 z-40 bg-black/20 sm:bg-transparent backdrop-blur-[2px] sm:backdrop-blur-none" 
                      onClick={() => setShowNotifications(false)}
                    />
                    
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="fixed inset-x-4 top-16 sm:absolute sm:inset-auto sm:right-0 sm:top-auto sm:mt-2.5 w-auto sm:w-96 bg-white border-2 border-[#433075] rounded-3xl shadow-2xl z-50 overflow-hidden text-[#0D0D0D] flex flex-col max-h-[75vh] sm:max-h-[480px]"
                    >
                      {/* Header */}
                      <div className="p-4 bg-[#F0EDF7] border-b border-[#C8CED6]/60 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-[#433075]" />
                          <span className="text-sm font-black text-[#0D0D0D] uppercase tracking-wide">Notifications</span>
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-xs text-[#433075] hover:text-[#A58CF4] font-black uppercase cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* Notification List */}
                      <div className="overflow-y-auto flex-1 divide-y divide-[#C8CED6]/30 max-h-[360px] overflow-x-hidden">
                        <AnimatePresence mode="popLayout">
                          {notifications.length === 0 ? (
                            <motion.div 
                              key="empty-state"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="p-8 text-center space-y-2"
                            >
                              <div className="w-10 h-10 rounded-full bg-[#F7F7F7] flex items-center justify-center mx-auto text-[#736A86]">
                                <Info className="w-5 h-5" />
                              </div>
                              <p className="text-xs sm:text-sm font-black text-[#0D0D0D]">No notifications yet</p>
                              <p className="text-xs text-[#736A86] font-extrabold">Updates and sync event summaries will log here.</p>
                            </motion.div>
                          ) : (
                            notifications.map((notif) => {
                              const NotifIcon = notif.type === "success" 
                                ? CheckCircle2 
                                : notif.type === "update" 
                                ? Sparkles 
                                : notif.type === "warning" 
                                ? AlertTriangle 
                                : Info;
                              return (
                                <motion.div 
                                  layout
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: "100%", transition: { duration: 0.25, ease: "easeIn" } }}
                                  key={notif.id} 
                                  className={`p-4 transition-all flex gap-3 ${
                                    notif.read ? "bg-white opacity-85" : "bg-[#F0EDF7]/20 border-l-4 border-[#433075]"
                                  }`}
                                >
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                                    notif.type === "success" 
                                      ? "bg-emerald-50 text-emerald-600" 
                                      : notif.type === "update" 
                                      ? "bg-purple-50 text-[#A58CF4]" 
                                      : notif.type === "warning" 
                                      ? "bg-amber-50 text-amber-600" 
                                      : "bg-indigo-50 text-[#433075]"
                                  }`}>
                                    <NotifIcon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 min-w-0 space-y-1">
                                    <div className="flex items-start justify-between gap-2">
                                      <h4 className="text-xs font-black text-[#0D0D0D] truncate">{notif.title}</h4>
                                      <span className="text-[9px] text-[#736A86] font-bold shrink-0">
                                        {formatRelativeTime(notif.timestamp)}
                                      </span>
                                    </div>
                                    <p className="text-[10px] text-[#736A86] font-semibold leading-relaxed break-words">
                                      {notif.message}
                                    </p>
                                  </div>
                                  <button
                                    onClick={() => handleRemoveNotification(notif.id)}
                                    className="text-[#736A86] hover:text-rose-500 p-1 shrink-0 cursor-pointer self-start transition-colors"
                                    title="Delete item"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </motion.div>
                              );
                            })
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="p-3 bg-[#F7F7F7] border-t border-[#C8CED6]/40 flex justify-center">
                          <button
                            onClick={handleClearAll}
                            className="text-[9px] text-rose-500 hover:text-rose-700 font-black uppercase flex items-center gap-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear all history</span>
                          </button>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>

            <StaggeredMenu
              position="right"
              items={menuItems}
              menuLabel={menuItems.find(i => i.id === activeTab)?.label}
              displayItemNumbering={true}
              menuButtonColor="#0D0D0D"
              openMenuButtonColor="#4f46e5"
              changeMenuColorOnOpen={true}
              colors={['#A58CF4', '#736A86', '#433075']}
              accentColor="#4f46e5"
              activeItemId={activeTab}
              onSelectItem={(id) => handleTabChange(id as NavSection)}
              bottomContent={
                <div className="pt-6 border-t border-[#C8CED6]/40 text-left righteous-regular select-none w-full">
                  <span className="text-sm sm:text-base font-bold text-[#4f46e5] block mb-3 uppercase tracking-wider">Socials</span>
                  <div className="flex items-center gap-6 text-base sm:text-lg font-bold group/socials">
                    <a
                      href="https://github.com/Nagul55"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0D0D0D] group-hover/socials:opacity-40 hover:!opacity-100 hover:text-[#4f46e5] hover:-translate-y-0.5 transition-all duration-300 inline-block"
                    >
                      GitHub
                    </a>
                    <a
                      href="https://x.com/Nagul_55"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0D0D0D] group-hover/socials:opacity-40 hover:!opacity-100 hover:text-[#4f46e5] hover:-translate-y-0.5 transition-all duration-300 inline-block"
                    >
                      Twitter
                    </a>
                    <a
                      href="https://www.linkedin.com/in/nagul-g"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0D0D0D] group-hover/socials:opacity-40 hover:!opacity-100 hover:text-[#4f46e5] hover:-translate-y-0.5 transition-all duration-300 inline-block"
                    >
                      LinkedIn
                    </a>
                  </div>
                </div>
              }
            />
          </div>
        </header>

        {/* Main Content Area with Gradient 01 Background */}
        <main 
          ref={mainRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overflow-x-hidden pt-20 sm:pt-24 pb-8 px-4 xs:px-6 sm:px-8 lg:px-10 relative z-10 bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6]">
          <div className="w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                {activeTab === "home" && (
                  <OverviewSection 
                    userName={displayUserName} 
                    user={user}
                    onNavigate={(section) => {
                      if (section === "flashcards") {
                        handleTabChange("practice");
                        setPracticeSubTab("flashcards");
                      } else if (section === "decks") {
                        handleTabChange("decks");
                      } else if (section === "ailabs") {
                        handleTabChange("practice");
                        setPracticeSubTab("ailabs");
                      } else if (section === "vocabulary" || section === "practice") {
                        handleTabChange("practice");
                        setPracticeSubTab("vocabulary");
                      } else if (section === "progress" || section === "analytics") {
                        handleTabChange("progress");
                      }
                    }} 
                    prefetchedDecks={prefetchedDecks}
                    prefetchedSessions={prefetchedSessions}
                    prefetchedVocab={prefetchedVocab}
                  />
                )}
                {activeTab === "decks" && (
                  <DecksSection 
                    user={user} 
                    prefetchedDecks={prefetchedDecks}
                    prefetchedFlashcards={prefetchedFlashcards}
                  />
                )}
                {activeTab === "practice" && (
                  <PracticeSection 
                    user={user} 
                    prefetchedDecks={prefetchedDecks}
                    prefetchedSessions={prefetchedSessions}
                    prefetchedFlashcards={prefetchedFlashcards}
                  />
                )}
                {activeTab === "progress" && (
                  <AnalyticsSection 
                    user={user} 
                    prefetchedSessions={prefetchedSessions}
                    prefetchedVocab={prefetchedVocab}
                    prefetchedFlashcards={prefetchedFlashcards}
                  />
                )}
                {activeTab === "settings" && (
                  <SettingsSection 
                    user={user} 
                    onSignOut={() => setShowSignOutConfirm(true)} 
                    onSignOutDirect={onSignOut}
                    userName={displayUserName} 
                    prefetchedSessions={prefetchedSessions}
                    prefetchedFlashcards={prefetchedFlashcards}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      {/* Sign Out Confirmation Modal */}
      <AnimatePresence>
        {showSignOutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-2xl shadow-xl max-w-sm w-full border border-[#C8CED6]/40 text-center space-y-4 righteous-regular"
            >
              <h3 className="text-xl font-black text-[#433075] uppercase">Sign Out</h3>
              <p className="text-xs text-[#736A86]">Are you sure you want to sign out of your session?</p>
              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSignOutConfirm(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-[#C8CED6] hover:bg-[#F7F7F7] text-[#736A86] font-black text-xs transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowSignOutConfirm(false);
                    onSignOut();
                  }}
                  className="w-1/2 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-xs transition-all cursor-pointer shadow-lg"
                >
                  Sign Out
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
