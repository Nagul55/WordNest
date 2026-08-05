"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import { 
  Flame
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
import StaggeredMenu from "./StaggeredMenu";

interface DashboardProps {
  user: any;
  onSignOut: () => void;
}

type NavSection = "home" | "decks" | "practice" | "progress" | "settings";

export default function Dashboard({ user, onSignOut }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<NavSection>("home");
  const [practiceSubTab, setPracticeSubTab] = useState<"vocabulary" | "ailabs" | "flashcards">("vocabulary");
  const [isScrolled, setIsScrolled] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const mainRef = useRef<HTMLDivElement>(null);

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

  // Derive display names safely from Supabase user object or defaults
  const userEmail = user?.email || "nagulaadhi08@gmail.com";
  const userName = user?.user_metadata?.full_name || user?.user_metadata?.name || userEmail.split("@")[0] || "Nagul";

  // Menu items list
  const menuItems = [
    { id: "home", label: "Home", ariaLabel: "Switch to Home" },
    { id: "decks", label: "Decks", ariaLabel: "Switch to Decks" },
    { id: "practice", label: "Practice", ariaLabel: "Switch to Practice" },
    { id: "progress", label: "Progress", ariaLabel: "Switch to Progress" },
    { id: "settings", label: "Settings", ariaLabel: "Switch to Settings" },
  ];

  return (
    <div className="flex h-screen w-full bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6] text-[#0D0D0D] overflow-hidden righteous-regular relative">
      
      {/* ==========================================
          MAIN AREA (FLOATING HEADER + SCROLLABLE CONTENT)
          ========================================== */}
      <div className="flex-1 flex flex-col h-full w-full min-w-0 bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6] overflow-hidden relative">
        
        {/* Floating header with dynamic background on scroll */}
        <header className={`absolute top-0 left-0 right-0 px-6 z-30 transition-all duration-300 flex items-center justify-between ${
          isScrolled 
            ? "bg-white/95 backdrop-blur-md border-b border-[#C8CED6]/60 shadow-sm py-4" 
            : "bg-transparent py-7 border-b border-transparent shadow-none"
        }`}>
          
          {/* LEFT: Brand Logo & Aligned Title */}
          <div 
            onClick={scrollToTop}
            className="flex items-center gap-2.5 select-none cursor-pointer"
          >
            <div className="w-10 h-10 relative shrink-0">
              <Image src="/Wordnest.svg" alt="WordNest Application Logo" fill className="object-contain" priority />
            </div>
            <div className="flex items-center tracking-tight leading-none pt-0.5 font-sans font-black">
              <span className="text-2xl sm:text-[1.8rem] text-[#3B153A]">Word</span>
              <span className="text-2xl sm:text-[1.8rem] text-[#F0C987]">Nest</span>
            </div>
          </div>

          {/* RIGHT: Staggered Menu Toggle */}
          <div className="flex items-center gap-4">
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
                <div className="pt-6 border-t border-[#C8CED6]/40 text-left font-sans select-none w-full">
                  <span className="text-sm font-semibold text-[#4f46e5] block mb-3 tracking-wide">Socials</span>
                  <div className="flex items-center gap-6 text-base font-medium">
                    <a
                      href="https://github.com/Nagul55"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8E97A6] hover:text-[#4f46e5] transition-colors duration-200"
                    >
                      GitHub
                    </a>
                    <a
                      href="https://x.com/Nagul_55"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8E97A6] hover:text-[#4f46e5] transition-colors duration-200"
                    >
                      Twitter
                    </a>
                    <a
                      href="https://www.linkedin.com/in/nagul-g"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#8E97A6] hover:text-[#4f46e5] transition-colors duration-200"
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
          className="flex-1 overflow-y-auto pt-24 pb-8 px-6 relative z-10 bg-gradient-to-br from-[#F7F7F7] via-[#DFE3E8] to-[#C8CED6]">
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
                    userName={userName} 
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
                      }
                    }} 
                  />
                )}
                {activeTab === "decks" && <DecksSection user={user} />}
                {activeTab === "practice" && (
                  <div className="space-y-6">
                    {/* Sub-tab navigation selector for Practice */}
                    <div className="flex items-center gap-2 border-b border-[#C8CED6] pb-3 mb-6">
                      <button
                        onClick={() => setPracticeSubTab("vocabulary")}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          practiceSubTab === "vocabulary"
                            ? "bg-[#433075] text-white shadow-md border border-[#A58CF4]"
                            : "text-[#736A86] hover:bg-white border border-transparent hover:border-[#C8CED6]"
                        }`}
                      >
                        AI Lexicon Vault
                      </button>
                      <button
                        onClick={() => setPracticeSubTab("ailabs")}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          practiceSubTab === "ailabs"
                            ? "bg-[#433075] text-white shadow-md border border-[#A58CF4]"
                            : "text-[#736A86] hover:bg-white border border-transparent hover:border-[#C8CED6]"
                        }`}
                      >
                        AI Neural Lab
                      </button>
                      <button
                        onClick={() => setPracticeSubTab("flashcards")}
                        className={`px-5 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer ${
                          practiceSubTab === "flashcards"
                            ? "bg-[#433075] text-white shadow-md border border-[#A58CF4]"
                            : "text-[#736A86] hover:bg-white border border-transparent hover:border-[#C8CED6]"
                        }`}
                      >
                        Smart Flashcards
                      </button>
                    </div>
                    {practiceSubTab === "vocabulary" && <VocabularySection />}
                    {practiceSubTab === "ailabs" && <AILabsSection />}
                    {practiceSubTab === "flashcards" && <FlashcardsSection />}
                  </div>
                )}
                {activeTab === "progress" && <AnalyticsSection />}
                {activeTab === "settings" && <SettingsSection user={user} onSignOut={() => setShowSignOutConfirm(true)} userName={userName} />}
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
