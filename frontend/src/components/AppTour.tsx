"use client";

import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import { 
  X, 
  ChevronRight, 
  ChevronLeft, 
  Check, 
  MousePointer, 
  Sparkles,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft
} from "lucide-react";

export type NavSection = "home" | "decks" | "practice" | "progress" | "settings";

interface AppTourProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tab: NavSection) => void;
  userName?: string;
}

interface StepTargetConfig {
  stepIndex: number;
  targetId: string;
  title: string;
  instruction: string;
  tooltipPosition?: "left" | "right" | "top" | "bottom";
  cardPositionClass?: string;
  fallbackTab?: NavSection;
}

const INTERACTIVE_STEPS: StepTargetConfig[] = [
  {
    stepIndex: 1,
    targetId: "tour-menu-toggle-btn",
    title: "1. Open Main Menu",
    instruction: "Click the menu button in the top-right corner to open navigation.",
    tooltipPosition: "bottom"
  },
  {
    stepIndex: 2,
    targetId: "tour-menu-item-decks",
    title: "2. Select Decks",
    instruction: "Click 'Decks' in the menu to open your study library.",
    tooltipPosition: "left",
    cardPositionClass: "inset-x-3 sm:inset-x-auto top-12 sm:top-16 sm:right-[400px] justify-center sm:justify-end"
  },
  {
    stepIndex: 3,
    targetId: "tour-create-deck-btn",
    title: "3. Create First Deck",
    instruction: "Click the 'Create New Deck' button to start building your first study folder.",
    tooltipPosition: "right",
    cardPositionClass: "inset-x-3 sm:inset-x-auto top-44 sm:top-[13.5rem] sm:right-8 justify-center sm:justify-end",
    fallbackTab: "decks"
  },
  {
    stepIndex: 4,
    targetId: "tour-deck-name-input",
    title: "4. Name Your Deck",
    instruction: "Type a title for your deck (e.g. My First Deck) and click 'Create Deck'.",
    tooltipPosition: "right",
    cardPositionClass: "inset-x-3 sm:inset-x-auto top-1/2 -translate-y-1/2 sm:right-10 justify-center sm:justify-end"
  },
  {
    stepIndex: 5,
    targetId: "tour-created-deck-card",
    title: "5. Open Your Deck",
    instruction: "Click on your newly created deck to open it and start adding words.",
    cardPositionClass: "inset-x-3 sm:inset-x-auto top-48 sm:top-[14.5rem] sm:left-[25rem] justify-center sm:justify-start"
  },
  {
    stepIndex: 6,
    targetId: "tour-add-word-btn",
    title: "6. Add Your First Word",
    instruction: "Click 'Add Word' to save your first vocabulary term in this deck.",
    tooltipPosition: "right",
    cardPositionClass: "inset-x-3 sm:inset-x-auto top-48 sm:top-[15.5rem] sm:right-10 justify-center sm:justify-end"
  },
  {
    stepIndex: 7,
    targetId: "tour-menu-toggle-btn",
    title: "7. Open Navigation Menu",
    instruction: "Click the menu button in the top-right corner to open navigation.",
    tooltipPosition: "bottom"
  },
  {
    stepIndex: 8,
    targetId: "tour-menu-item-practice",
    title: "8. Start Practice Session",
    instruction: "Click 'Practice' in the menu to start reviewing your flashcards.",
    tooltipPosition: "left",
    cardPositionClass: "inset-x-3 sm:inset-x-auto top-12 sm:top-16 sm:right-[400px] justify-center sm:justify-end",
    fallbackTab: "practice"
  },
  {
    stepIndex: 9,
    targetId: "tour-practice-overview",
    title: "9. Practice Your Words",
    instruction: "Now you can practice the words you created in your deck through various interactive modules like Smart Flashcards and Speed Match.",
    cardPositionClass: "fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm pointer-events-auto",
    fallbackTab: "practice"
  }
];

export default function AppTour({ isOpen, onClose, onNavigateTab, userName }: AppTourProps) {
  const [showPrompt, setShowPrompt] = useState(true);
  const [stepIndex, setStepIndex] = useState(1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasTypedDeckName, setHasTypedDeckName] = useState(false);
  const [wordStepState, setWordStepState] = useState<"initial" | "input" | "generating" | "ready">("initial");

  const fireConfettiRain = useCallback(() => {
    try {
      // Fire gentle confetti rain across full width of the screen (x: 0.05 to 0.95) from top edge (y: 0) down to bottom
      const xPositions = [0.05, 0.22, 0.4, 0.6, 0.78, 0.95];
      xPositions.forEach((x, i) => {
        setTimeout(() => {
          confetti({
            particleCount: 10,
            spread: 60,
            origin: { x, y: 0 },
            startVelocity: 18,
            gravity: 0.65,
            ticks: 400,
            colors: ["#5227FF", "#A58CF4", "#38ef7d", "#11998e", "#ff416c", "#ffd700"]
          });
        }, i * 40);
      });
    } catch (err) {
      console.warn("Confetti bypass:", err);
    }
  }, []);

  useEffect(() => {
    if (isCompleted) {
      fireConfettiRain();
    }
  }, [isCompleted, fireConfettiRain]);

  // Immediately clear rect & trigger tab navigation on step change
  useEffect(() => {
    if (!isOpen || showPrompt || isCompleted) return;
    setTargetRect(null);
    setHasTypedDeckName(false);
    setWordStepState("initial");

    // Close side menu when moving past step 2 (except step 7 & 8)
    if (stepIndex > 2 && stepIndex !== 7 && stepIndex !== 8 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("wordnest-close-menu"));
    }

    const stepConfig = INTERACTIVE_STEPS.find(s => s.stepIndex === stepIndex);
    if (stepConfig?.fallbackTab) {
      onNavigateTab(stepConfig.fallbackTab);
      if (stepConfig.fallbackTab === "decks" && stepIndex === 3) {
        if (typeof window !== "undefined" && window.location.hash.startsWith("#deck-")) {
          window.location.hash = "";
        }
      }
    }
  }, [stepIndex, isOpen, showPrompt, isCompleted, onNavigateTab]);

  // Update target element coordinates dynamically
  const updateTargetCoordinates = useCallback(() => {
    if (showPrompt || isCompleted) return;
    const stepConfig = INTERACTIVE_STEPS.find(s => s.stepIndex === stepIndex);
    if (!stepConfig) return;

    if (stepIndex === 9) {
      setTargetRect(null);
      return;
    }

    let targetId = stepConfig.targetId;

    if (stepIndex === 4) {
      const inputEl = document.getElementById("tour-deck-name-input") as HTMLInputElement | null;
      const isTyped = Boolean(inputEl && inputEl.value.trim().length > 0);
      setHasTypedDeckName(isTyped);
      if (isTyped) {
        targetId = "tour-create-deck-submit-btn";
      }
    } else if (stepIndex === 6) {
      const termInput = document.getElementById("tour-word-term-input") as HTMLInputElement | null;
      if (termInput) {
        const hasTerm = termInput.value.trim().length > 0;
        const meaningTextarea = document.querySelector('textarea[placeholder*="definition"]') as HTMLTextAreaElement | null;
        const hasMeaning = Boolean(meaningTextarea && meaningTextarea.value.trim().length > 0);

        if (hasTerm && hasMeaning) {
          targetId = "tour-add-word-submit-btn";
          setWordStepState("ready");
        } else if (hasTerm) {
          targetId = "tour-word-term-input";
          setWordStepState("generating");
        } else {
          targetId = "tour-word-term-input";
          setWordStepState("input");
        }
      } else {
        setWordStepState("initial");
        targetId = "tour-add-word-btn";
      }
    }

    const el = document.getElementById(`${targetId}-label`) || document.getElementById(targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setTargetRect(rect);
      } else {
        setTargetRect(null);
      }
    } else {
      // Fallback tab navigation if target isn't visible yet
      if (stepConfig.fallbackTab) {
        onNavigateTab(stepConfig.fallbackTab);
      }
      setTargetRect(null);
    }
  }, [stepIndex, showPrompt, isCompleted, onNavigateTab]);

  useEffect(() => {
    updateTargetCoordinates();
    const interval = setInterval(updateTargetCoordinates, 200);
    window.addEventListener("resize", updateTargetCoordinates);
    window.addEventListener("scroll", updateTargetCoordinates, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateTargetCoordinates);
      window.removeEventListener("scroll", updateTargetCoordinates, true);
    };
  }, [updateTargetCoordinates]);

  // Click listeners to auto-advance interactive steps
  useEffect(() => {
    if (!isOpen || showPrompt || isCompleted) return;

    const handleDocumentClick = (e: MouseEvent) => {
      // Allow clicks in the tour overlay itself
      const tourOverlay = document.getElementById("tour-overlay-card");
      if (tourOverlay && (tourOverlay.contains(e.target as Node) || e.target === tourOverlay)) {
        return;
      }

      const stepConfig = INTERACTIVE_STEPS.find(s => s.stepIndex === stepIndex);
      if (!stepConfig) return;

      const targetEl = document.getElementById(stepConfig.targetId);
      const submitEl = stepIndex === 4 
        ? document.getElementById("tour-create-deck-submit-btn") 
        : stepIndex === 6 
        ? document.getElementById("tour-add-word-submit-btn") 
        : null;
      
      const isTargetClick = targetEl && (targetEl.contains(e.target as Node) || e.target === targetEl);
      const isSubmitClick = submitEl && (submitEl.contains(e.target as Node) || e.target === submitEl);
      const isWordInputClick = stepIndex === 6 && (
        Boolean(document.getElementById("tour-word-term-input")?.contains(e.target as Node)) || e.target === document.getElementById("tour-word-term-input")
      );

      if (stepIndex === 9) {
        return;
      }

      if (!isTargetClick && !isSubmitClick && !isWordInputClick) {
        // Block clicks outside target
        e.stopPropagation();
        e.preventDefault();
        return;
      }

      // Special cases:
      // 1. For Step 4, clicking input allows typing without auto-advancing.
      // 2. For Step 6, clicking opening button or input field allows modal open/typing without completing tour.
      if ((stepIndex === 4 || (stepIndex === 6 && (isTargetClick || isWordInputClick))) && !isSubmitClick) {
        return;
      }

      if (isTargetClick || isSubmitClick) {
        // Auto-advance step after small delay for action execution
        setTimeout(() => {
          if (stepIndex < INTERACTIVE_STEPS.length) {
            setStepIndex(prev => prev + 1);
          } else {
            // Tour finished!
            setIsCompleted(true);
            fireConfettiRain();
          }
        }, 350);
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [isOpen, showPrompt, stepIndex, isCompleted, fireConfettiRain]);

  if (!isOpen) return null;

  const currentStepConfig = INTERACTIVE_STEPS.find(s => s.stepIndex === stepIndex);
  const totalSteps = INTERACTIVE_STEPS.length;

  const handleStartTour = () => {
    setShowPrompt(false);
    setStepIndex(1);
    setIsCompleted(false);
  };

  const handleSkipTour = () => {
    onClose();
  };

  const handleNextStep = () => {
    if (stepIndex < totalSteps) {
      setStepIndex(prev => prev + 1);
    } else {
      setIsCompleted(true);
      fireConfettiRain();
    }
  };

  return (
    <AnimatePresence>
      {/* 1. STARTING TOUR PROMPT MODAL (Small, compact, matching Stepper style with WordNest logo SVG) */}
      {showPrompt ? (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 xs:p-4 bg-[#09090c]/80 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="w-full max-w-[calc(100vw-2rem)] sm:max-w-sm bg-[#0b0b0e] border border-[#1e1e24] rounded-2xl sm:rounded-[2rem] p-5 sm:p-6 shadow-2xl text-white relative overflow-hidden"
          >
            {/* WordNest Logo SVG */}
            <div className="flex justify-start items-center mb-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 relative shrink-0">
                <Image
                  src="/Wordnest.svg"
                  alt="WordNest Logo"
                  width={48}
                  height={48}
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg sm:text-xl font-bold text-[#5227FF] mb-2 tracking-tight">
              Welcome, {userName || "Scholar"}
            </h3>

            {/* Subtitle */}
            <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed mb-5 sm:mb-6">
              Your profile is all set up. Would you like a step-by-step interactive tour to create your first deck and word, or skip for now?
            </p>

            {/* Action buttons */}
            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSkipTour}
                className="text-xs text-[#a3a3a3] hover:text-white transition-colors cursor-pointer font-medium px-2 py-1.5"
              >
                Skip Tour
              </button>

              <button
                type="button"
                onClick={handleStartTour}
                className="px-4 sm:px-5 py-2 sm:py-2.5 rounded-full bg-[#5227FF] hover:bg-[#5227FF]/90 text-white text-xs font-semibold tracking-wide transition-all shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <span>Start Tour</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </motion.div>
        </div>
      ) : isCompleted ? (
        /* 3. COMPLETION MODAL */
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 bg-[#09090c]/85 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 15 }}
            className="w-full max-w-sm bg-[#0b0b0e] border border-[#1e1e24] rounded-[2rem] p-6 text-center text-white shadow-2xl space-y-4"
          >
            <div className="w-12 h-12 rounded-full bg-[#5227FF]/20 border border-[#5227FF] text-[#5227FF] flex items-center justify-center mx-auto">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-[#5227FF]">Tour Complete!</h3>
            <p className="text-xs text-zinc-300 leading-relaxed">
              Congratulations! You have completed the guided tour and learned how to navigate WordNest, create study decks, and add vocabulary words.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 rounded-full bg-[#5227FF] hover:bg-[#5227FF]/90 text-white text-xs font-semibold tracking-wide shadow-md cursor-pointer transition-all active:scale-95"
            >
              Start Learning
            </button>
          </motion.div>
        </div>
      ) : (
        /* 2. REAL-TIME INTERACTIVE GUIDED STEP OVERLAY WITH ANIMATED TARGET ARROW */
        <div className="fixed inset-0 z-[999] pointer-events-none select-none">


          {/* ANIMATED PULSING ARROW POINTING TO TARGET */}
          {targetRect && (() => {
            const isNearTop = targetRect.top < 85;
            const arrowTop = isNearTop ? targetRect.bottom + 12 : Math.max(12, targetRect.top - 48);
            return (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.7 }}
                style={{
                  position: "fixed",
                  left: targetRect.left + targetRect.width / 2 - 16,
                  top: arrowTop,
                  zIndex: 9999,
                  pointerEvents: "none"
                }}
                className="flex flex-col items-center text-[#5227FF] drop-shadow-[0_4px_12px_rgba(82,39,255,0.8)]"
              >
                <div className="p-2 rounded-full bg-[#5227FF] text-white shadow-xl animate-bounce">
                  {isNearTop ? (
                    <ArrowUp className="w-5 h-5 text-white" />
                  ) : (
                    <ArrowDown className="w-5 h-5 text-white" />
                  )}
                </div>
              </motion.div>
            );
          })()}

          {/* FLOATING STEP CARD WITH INSTRUCTIONS */}
          <div 
            className={`fixed z-[9999] pointer-events-auto flex ${
              stepIndex === 9
                ? "inset-0 items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
                : stepIndex === 6 && wordStepState !== "initial"
                ? "inset-x-3 bottom-4 sm:bottom-auto sm:inset-x-auto sm:top-1/2 sm:-translate-y-1/2 sm:right-10 justify-center sm:justify-end"
                : currentStepConfig?.cardPositionClass
                ? `inset-x-3 bottom-4 sm:bottom-auto ${currentStepConfig.cardPositionClass}`
                : "inset-x-3 bottom-4 sm:bottom-6 justify-center"
            }`}
          >
            <motion.div
              id="tour-overlay-card"
              key={stepIndex}
              initial={{ opacity: 0, y: 15, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className={`w-full relative shadow-2xl text-white ${
                stepIndex === 9
                  ? "max-w-[calc(100vw-2rem)] sm:max-w-md bg-[#0b0b0e] border border-[#1e1e24] rounded-2xl sm:rounded-3xl p-6 sm:p-7 pr-7 sm:pr-8"
                  : "max-w-[calc(100vw-2rem)] sm:max-w-xs bg-[#0b0b0e]/95 backdrop-blur-md border border-[#1e1e24] rounded-xl sm:rounded-2xl p-3.5 sm:p-4 pr-8 sm:pr-9"
              }`}
            >
              {/* END TOUR X BUTTON */}
              <button
                type="button"
                onClick={onClose}
                className="absolute top-3.5 right-3.5 text-[#a3a3a3] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1f1f24] cursor-pointer"
                title="End Tour"
              >
                <X className="w-4 h-4" />
              </button>

              {/* INSTRUCTION TEXT */}
              <div className="text-left mb-4">
                <h4 className={`font-bold text-[#5227FF] tracking-tight ${stepIndex === 9 ? 'text-lg sm:text-xl mb-2' : 'text-xs sm:text-sm mb-0.5'}`}>
                  {currentStepConfig?.title}
                </h4>
                <p className={`text-zinc-300 leading-relaxed ${stepIndex === 9 ? 'text-xs sm:text-sm' : 'text-[11px] sm:text-xs'}`}>
                  {stepIndex === 4 && hasTypedDeckName
                    ? "Great! Now click the 'Create Deck' button to create your folder."
                    : stepIndex === 6 && wordStepState === "input"
                    ? "Type a vocabulary term (e.g. Ephemeral) to trigger AI generation."
                    : stepIndex === 6 && wordStepState === "generating"
                    ? "AI is fetching the definition and cover image... Please wait a moment."
                    : stepIndex === 6 && wordStepState === "ready"
                    ? "Great! AI fetched the details. Now click 'Add Word' to save it to your deck."
                    : currentStepConfig?.instruction}
                </p>
              </div>

              {/* FOOTER NAV CONTROLS */}
              {stepIndex === 9 ? (
                <div className="flex items-center justify-end pt-3 border-t border-[#1e1e24]/60">
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="px-5 py-2 sm:py-2.5 rounded-full bg-[#5227FF] hover:bg-[#5227FF]/90 text-white text-xs sm:text-sm font-semibold tracking-wide transition-all shadow-lg cursor-pointer flex items-center gap-1.5 active:scale-95"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-start pt-2 border-t border-[#1e1e24]/60">
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-[11px] sm:text-xs text-[#a3a3a3] hover:text-rose-400 transition-colors cursor-pointer font-medium py-0.5 px-1"
                  >
                    End Tour
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
