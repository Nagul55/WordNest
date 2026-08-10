"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  Sparkles, 
  Layers, 
  Target, 
  TrendingUp, 
  Settings as SettingsIcon, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  BookOpen, 
  Brain, 
  Zap, 
  Compass,
  GraduationCap
} from "lucide-react";

export type NavSection = "home" | "decks" | "practice" | "progress" | "settings";

interface AppTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavSection) => void;
  userName?: string;
}

interface TourStep {
  id: number;
  tab: NavSection;
  title: string;
  badge: string;
  icon: any;
  color: string;
  gradient: string;
  description: string;
  highlights: {
    icon: any;
    title: string;
    text: string;
  }[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    tab: "decks",
    title: "Create & Organize Decks",
    badge: "Step 1 of 4 • Decks",
    icon: Layers,
    color: "#5227FF",
    gradient: "from-[#5227FF] via-[#70389B] to-[#A58CF4]",
    description: "Your personalized study hub where you create custom flashcard decks, organize vocabulary by subjects, and generate AI flashcards instantly.",
    highlights: [
      {
        icon: Layers,
        title: "Custom Study Sets",
        text: "Create flashcard decks with tags, categories, and custom card flip views."
      },
      {
        icon: Sparkles,
        title: "AI Deck Generator",
        text: "Enter any topic or prompt to auto-generate comprehensive flashcard decks in seconds."
      }
    ]
  },
  {
    id: 2,
    tab: "practice",
    title: "Master 3 Interactive Practice Modules",
    badge: "Step 2 of 4 • Practice",
    icon: Target,
    color: "#FA4852",
    gradient: "from-[#FA4852] via-[#E3124D] to-[#FB7827]",
    description: "Accelerate your learning using our 3 specialized study modules designed for deep retention and active recall:",
    highlights: [
      {
        icon: BookOpen,
        title: "1. Vocabulary Vault",
        text: "Search & save rich dictionary terms with audio pronunciations, etymologies, and usage examples."
      },
      {
        icon: Zap,
        title: "2. Flashcards Arena",
        text: "Study with 3D card flips using Spaced Repetition (SM-2 memory algorithm) to boost recall."
      },
      {
        icon: Brain,
        title: "3. AI Labs & Quiz Arena",
        text: "Challenge yourself with AI-generated quizzes, AI tutor chat, and instant performance feedback."
      }
    ]
  },
  {
    id: 3,
    tab: "progress",
    title: "Track Analytics & Daily Streaks",
    badge: "Step 3 of 4 • Progress",
    icon: TrendingUp,
    color: "#F0C987",
    gradient: "from-[#FB8D1F] via-[#F0C987] to-[#A58CF4]",
    description: "Monitor your learning velocity! View daily study streaks, mastery accuracy rates, flashcard counts, and study duration breakdowns.",
    highlights: [
      {
        icon: TrendingUp,
        title: "Streak & Mastery Metrics",
        text: "Keep your daily streak alive and watch your vocabulary accuracy improve over time."
      },
      {
        icon: GraduationCap,
        title: "Study Performance Charts",
        text: "Detailed breakdown of cards mastered, review schedules, and AI interaction totals."
      }
    ]
  },
  {
    id: 4,
    tab: "settings",
    title: "Customize Profile & Settings",
    badge: "Step 4 of 4 • Settings",
    icon: SettingsIcon,
    color: "#A58CF4",
    gradient: "from-[#A58CF4] via-[#736A86] to-[#5227FF]",
    description: "Personalize your WordNest workspace! Update your profile details, occupation, sound preferences, data privacy, and account security.",
    highlights: [
      {
        icon: SettingsIcon,
        title: "Profile & Preferences",
        text: "Update your display name, username, occupation, and personalized AI learning options."
      },
      {
        icon: CheckCircle2,
        title: "Ready to Explore!",
        text: "You are all set to start building decks and mastering vocabulary with WordNest."
      }
    ]
  }
];

export default function AppTour({ isOpen, onClose, onNavigateTab, userName }: AppTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(true); // Initial prompt modal state

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleStartTour = () => {
    setShowPrompt(false);
    setCurrentStepIndex(0);
    onNavigateTab(TOUR_STEPS[0].tab);
  };

  const handleSkipTour = () => {
    onClose();
  };

  const triggerCompletionConfetti = () => {
    try {
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.25 },
        colors: ["#5227FF", "#A58CF4", "#FA4852", "#F0C987", "#00E5FF"]
      });
    } catch (e) {
      console.warn("Confetti trigger fallback:", e);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onNavigateTab(TOUR_STEPS[nextIndex].tab);
    } else {
      // Tour completed!
      triggerCompletionConfetti();
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onNavigateTab(TOUR_STEPS[prevIndex].tab);
    }
  };

  const StepIcon = currentStep.icon;

  return (
    <AnimatePresence>
      {/* INITIAL PROMPT MODAL: Ask user whether they want a tour or to skip */}
      {showPrompt ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#09090c]/85 backdrop-blur-md select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="w-full max-w-md bg-[#0D0D0D] border-2 border-[#5227FF]/50 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-[#5227FF]/30 text-white relative overflow-hidden"
          >
            {/* Background ambient glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#5227FF]/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#FA4852]/20 rounded-full blur-3xl pointer-events-none" />

            {/* Header Badge */}
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#5227FF]/20 border border-[#5227FF]/60 text-[#A58CF4] text-xs font-bold flex items-center gap-1.5 shadow-sm">
                <Compass className="w-3.5 h-3.5 text-[#A58CF4]" />
                Guided Tour
              </span>
            </div>

            {/* Title */}
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2 font-display">
              Welcome aboard, <span className="heavy-text-pink">{userName || "Scholar"}</span>! 🎉
            </h3>

            <p className="text-sm text-zinc-300 mb-6 leading-relaxed font-sans">
              Your profile setup is complete! Would you like a quick 1-minute interactive tour of WordNest to discover all features?
            </p>

            {/* Features preview pills */}
            <div className="grid grid-cols-2 gap-2.5 mb-6 text-xs text-zinc-300 font-semibold">
              <div className="p-2.5 rounded-xl bg-[#181824] border border-[#5227FF]/30 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#5227FF]" />
                <span>1. Decks</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181824] border border-[#FA4852]/30 flex items-center gap-2">
                <Target className="w-4 h-4 text-[#FA4852]" />
                <span>2. Practice</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181824] border border-[#F0C987]/30 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#F0C987]" />
                <span>3. Progress</span>
              </div>
              <div className="p-2.5 rounded-xl bg-[#181824] border border-[#A58CF4]/30 flex items-center gap-2">
                <SettingsIcon className="w-4 h-4 text-[#A58CF4]" />
                <span>4. Settings</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={handleStartTour}
                className="flex-1 py-3 px-5 rounded-xl bg-gradient-to-r from-[#5227FF] to-[#70389B] hover:from-[#70389B] hover:to-[#5227FF] text-white font-black text-xs uppercase tracking-wider shadow-lg shadow-[#5227FF]/40 transition-all duration-300 flex items-center justify-center gap-2 active:scale-95 cursor-pointer border border-[#A58CF4]/40"
              >
                <Compass className="w-4 h-4" />
                <span>Start Tour</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleSkipTour}
                className="py-3 px-4 rounded-xl bg-[#181824] hover:bg-[#272738] text-zinc-400 hover:text-white font-bold text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer border border-zinc-700/60 active:scale-95 text-center"
              >
                Skip Tour
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* INTERACTIVE TOUR OVERLAY & FLOATING CARD */
        <div className="fixed inset-0 z-[999] pointer-events-none select-none flex flex-col justify-end sm:justify-center items-center p-3 sm:p-6">
          {/* Subtle Dimmed Background Layer */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto transition-all" />

          {/* Floating Tour Step Card */}
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 25, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -25, scale: 0.96 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-lg bg-[#0D0D0D]/95 border-2 border-[#5227FF]/60 rounded-3xl p-5 sm:p-6 shadow-2xl shadow-[#5227FF]/40 text-white relative z-10 pointer-events-auto backdrop-blur-xl overflow-hidden mb-2 sm:mb-0"
          >
            {/* Top Bar: Badge + End Tour Button */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#5227FF]/25 border border-[#5227FF]/60 text-[#A58CF4] text-[11px] font-bold tracking-wide">
                  {currentStep.badge}
                </span>
              </div>

              {/* End Tour Button */}
              <button
                type="button"
                onClick={onClose}
                className="px-2.5 py-1 rounded-lg bg-zinc-800/80 hover:bg-rose-500/20 hover:border-rose-500/50 text-zinc-400 hover:text-rose-300 border border-zinc-700/60 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                title="Exit Tour"
              >
                <span>End Tour</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Step Header */}
            <div className="flex items-start gap-3 mb-3">
              <div className={`p-3 rounded-2xl bg-gradient-to-br ${currentStep.gradient} text-white shadow-lg shrink-0`}>
                <StepIcon className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-xl sm:text-2xl font-black text-white tracking-tight font-display">
                  {currentStep.title}
                </h4>
                <p className="text-xs text-zinc-300 mt-1 leading-relaxed font-sans">
                  {currentStep.description}
                </p>
              </div>
            </div>

            {/* Step Highlights */}
            <div className="space-y-2.5 mb-5 max-h-[200px] overflow-y-auto pr-1">
              {currentStep.highlights.map((h, i) => {
                const HIcon = h.icon;
                return (
                  <div 
                    key={i} 
                    className="p-3 rounded-2xl bg-[#14141e]/90 border border-zinc-800 hover:border-[#5227FF]/40 transition-all flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-[#5227FF]/20 text-[#A58CF4] shrink-0 mt-0.5">
                      <HIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-white mb-0.5">{h.title}</h5>
                      <p className="text-[11px] text-zinc-400 leading-snug">{h.text}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Controls: Previous, Next / Finish, Step Indicator */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800/80">
              {/* Step Progress Dots */}
              <div className="flex items-center gap-1.5">
                {TOUR_STEPS.map((step, idx) => (
                  <button
                    key={step.id}
                    type="button"
                    onClick={() => {
                      setCurrentStepIndex(idx);
                      onNavigateTab(step.tab);
                    }}
                    className={`h-2 rounded-full transition-all cursor-pointer ${
                      idx === currentStepIndex 
                        ? "w-6 bg-[#A58CF4]" 
                        : "w-2 bg-zinc-700 hover:bg-zinc-500"
                    }`}
                    title={`Jump to Step ${idx + 1}`}
                  />
                ))}
              </div>

              {/* Prev / Next Action buttons */}
              <div className="flex items-center gap-2">
                {currentStepIndex > 0 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-bold text-xs transition-all flex items-center gap-1 cursor-pointer active:scale-95 border border-zinc-700"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleNext}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-[#5227FF] to-[#70389B] hover:from-[#70389B] hover:to-[#5227FF] text-white font-extrabold text-xs uppercase tracking-wider shadow-md shadow-[#5227FF]/30 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 border border-[#A58CF4]/40"
                >
                  <span>{currentStepIndex === TOUR_STEPS.length - 1 ? "Finish Tour" : "Next"}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
