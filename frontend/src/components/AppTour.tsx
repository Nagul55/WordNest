"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Layers, 
  Target, 
  TrendingUp, 
  Settings as SettingsIcon, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  Compass,
  BookOpen,
  Brain,
  Zap
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
  description: string;
  details: {
    icon: any;
    label: string;
    text: string;
  }[];
}

const TOUR_STEPS: TourStep[] = [
  {
    id: 1,
    tab: "decks",
    title: "Create and Organize Decks",
    description: "Your personalized study hub where you build custom flashcard decks, organize topics, and generate AI flashcards instantly.",
    details: [
      {
        icon: Layers,
        label: "Custom Decks",
        text: "Create and organize flashcards by subject or category."
      },
      {
        icon: Zap,
        label: "AI Generation",
        text: "Generate complete study decks automatically from any topic."
      }
    ]
  },
  {
    id: 2,
    tab: "practice",
    title: "Master Practice Modules",
    description: "Train your memory using 3 specialized interactive learning tools:",
    details: [
      {
        icon: BookOpen,
        label: "Vocabulary Vault",
        text: "Search terms with audio pronunciations, definitions, and examples."
      },
      {
        icon: Layers,
        label: "Flashcards Arena",
        text: "Study with 3D card flips using Spaced Repetition (SM-2 algorithm)."
      },
      {
        icon: Brain,
        label: "AI Labs & Quiz Arena",
        text: "Test knowledge with AI-generated quizzes and instant feedback."
      }
    ]
  },
  {
    id: 3,
    tab: "progress",
    title: "Track Analytics & Daily Streaks",
    description: "Monitor your learning velocity, daily study streak, accuracy rate, and overall vocabulary progress over time.",
    details: [
      {
        icon: TrendingUp,
        label: "Streak Tracking",
        text: "Maintain your active study streak and track daily study duration."
      },
      {
        icon: Target,
        label: "Mastery Metrics",
        text: "Review cards mastered, quiz accuracy, and AI interaction totals."
      }
    ]
  },
  {
    id: 4,
    tab: "settings",
    title: "Customize Profile & Settings",
    description: "Personalize your workspace, update display details, set daily study targets, and configure sound and security options.",
    details: [
      {
        icon: SettingsIcon,
        label: "Account Preferences",
        text: "Manage display name, occupation, themes, and study goals."
      }
    ]
  }
];

export default function AppTour({ isOpen, onClose, onNavigateTab, userName }: AppTourProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(true);

  if (!isOpen) return null;

  const currentStep = TOUR_STEPS[currentStepIndex];
  const totalSteps = TOUR_STEPS.length;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const handleStartTour = () => {
    setShowPrompt(false);
    setCurrentStepIndex(0);
    onNavigateTab(TOUR_STEPS[0].tab);
  };

  const handleSkipTour = () => {
    onClose();
  };

  const handleNext = () => {
    if (currentStepIndex < totalSteps - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      onNavigateTab(TOUR_STEPS[nextIndex].tab);
    } else {
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

  return (
    <AnimatePresence>
      {/* 1. STARTING TOUR PROMPT MODAL (Small, compact, matching Stepper style) */}
      {showPrompt ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#09090c]/80 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-sm bg-[#0b0b0e] border border-[#1e1e24] rounded-[2rem] p-6 shadow-2xl text-white relative overflow-hidden"
          >
            {/* Top icon */}
            <div className="w-10 h-10 rounded-full bg-[#5227FF]/20 border border-[#5227FF]/50 flex items-center justify-center mb-4 text-[#5227FF]">
              <Compass className="w-5 h-5 text-[#5227FF]" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-[#5227FF] mb-2 tracking-tight">
              Welcome, {userName || "Scholar"}
            </h3>

            {/* Subtitle */}
            <p className="text-zinc-300 text-xs leading-relaxed mb-6">
              Your profile is all set up. Would you like a quick step-by-step tour of WordNest to explore all features, or skip for now?
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSkipTour}
                className="text-xs text-[#a3a3a3] hover:text-white transition-colors cursor-pointer font-medium px-2 py-1"
              >
                Skip Tour
              </button>

              <button
                type="button"
                onClick={handleStartTour}
                className="px-5 py-2 rounded-full bg-[#5227FF] hover:bg-[#5227FF]/90 text-white text-xs font-semibold tracking-wide transition-all shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>Start Tour</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      ) : (
        /* 2. STEP BY STEP TOUR CARD WITH STEPPER INDICATORS */
        <div className="fixed inset-0 z-[999] pointer-events-none select-none flex items-center justify-center p-4">
          {/* Backdrop layer */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px] pointer-events-auto" />

          {/* Stepper Card Container (Exact styling as Onboarding Stepper) */}
          <motion.div
            key={currentStep.id}
            initial={{ opacity: 0, y: 15, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -15, scale: 0.96 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-md bg-[#0b0b0e] border border-[#1e1e24] rounded-[2rem] p-6 shadow-2xl text-white relative z-10 pointer-events-auto"
          >
            {/* TOP STEP INDICATOR ROW (Circles & Connector Lines) */}
            <div className="flex items-center w-full mb-6 px-1">
              {TOUR_STEPS.map((step, index) => {
                const stepNum = index + 1;
                const isComplete = currentStepIndex > index;
                const isActive = currentStepIndex === index;
                const isNotLast = index < totalSteps - 1;

                return (
                  <React.Fragment key={step.id}>
                    {/* Circle Indicator */}
                    <div className="relative flex items-center justify-center">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-xs ${
                          isComplete
                            ? "bg-[#5227FF] text-white"
                            : isActive
                            ? "bg-[#5227FF] text-white"
                            : "bg-[#1f1f24] text-[#a3a3a3]"
                        }`}
                      >
                        {isComplete ? (
                          <Check className="w-4 h-4 text-white" />
                        ) : isActive ? (
                          <div className="w-2.5 h-2.5 rounded-full bg-white" />
                        ) : (
                          <span>{stepNum}</span>
                        )}
                      </div>
                    </div>

                    {/* Connecting Line */}
                    {isNotLast && (
                      <div className="flex-1 h-[2px] mx-2 bg-[#27272a] relative overflow-hidden rounded">
                        <div
                          className="h-full bg-[#5227FF] transition-all duration-400"
                          style={{
                            width: isComplete ? "100%" : "0%"
                          }}
                        />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}

              {/* End Tour X Button */}
              <button
                type="button"
                onClick={onClose}
                className="ml-3 text-[#a3a3a3] hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-[#1f1f24]"
                title="End Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* STEP CONTENT */}
            <div className="text-left mb-6">
              <h2 className="text-xl font-bold text-[#5227FF] mb-2 tracking-tight">
                {currentStep.title}
              </h2>
              <p className="text-zinc-200 text-xs mb-4 leading-relaxed">
                {currentStep.description}
              </p>

              {/* Detail Items */}
              <div className="space-y-2.5">
                {currentStep.details.map((d, i) => {
                  const DIcon = d.icon;
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-[#0e0e13] border border-[#27272a] flex items-start gap-3"
                    >
                      <div className="p-1.5 rounded-lg bg-[#5227FF]/15 text-[#5227FF] shrink-0 mt-0.5">
                        <DIcon className="w-4 h-4 text-[#5227FF]" />
                      </div>
                      <div>
                        <h4 className="text-xs font-semibold text-white">{d.label}</h4>
                        <p className="text-[11px] text-zinc-400 leading-snug">{d.text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* FOOTER NAV CONTROLS */}
            <div className="flex items-center justify-between pt-2 border-t border-[#1e1e24]">
              {/* Back Button / End Tour Link */}
              {currentStepIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePrev}
                  className="text-xs text-[#a3a3a3] hover:text-white transition-colors cursor-pointer font-medium py-1 px-2 flex items-center gap-1"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onClose}
                  className="text-xs text-[#a3a3a3] hover:text-rose-400 transition-colors cursor-pointer font-medium py-1 px-2"
                >
                  End Tour
                </button>
              )}

              {/* Next / Complete Button */}
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2 rounded-full bg-[#5227FF] hover:bg-[#5227FF]/90 text-white text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>{isLastStep ? "Complete" : "Next"}</span>
                {!isLastStep && <ChevronRight className="w-3.5 h-3.5" />}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
