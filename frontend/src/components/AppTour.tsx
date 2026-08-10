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
  ArrowDown
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
  fallbackTab?: NavSection;
}

const INTERACTIVE_STEPS: StepTargetConfig[] = [
  {
    stepIndex: 1,
    targetId: "tour-menu-toggle-btn",
    title: "1. Open Main Menu",
    instruction: "Click the menu button in the top-right corner to open navigation."
  },
  {
    stepIndex: 2,
    targetId: "tour-menu-item-decks",
    title: "2. Select Decks",
    instruction: "Click 'Decks' in the menu to open your study library."
  },
  {
    stepIndex: 3,
    targetId: "tour-create-deck-btn",
    title: "3. Create First Deck",
    instruction: "Click the 'Create New Deck' button to start building your first study folder.",
    fallbackTab: "decks"
  },
  {
    stepIndex: 4,
    targetId: "tour-deck-name-input",
    title: "4. Name Your Deck",
    instruction: "Type a title for your deck (e.g. My First Deck) and click 'Create Deck'."
  },
  {
    stepIndex: 5,
    targetId: "tour-add-word-btn",
    title: "5. Add Your First Word",
    instruction: "Click 'Add Word' to save your first vocabulary term in this deck."
  }
];

export default function AppTour({ isOpen, onClose, onNavigateTab, userName }: AppTourProps) {
  const [showPrompt, setShowPrompt] = useState(true);
  const [stepIndex, setStepIndex] = useState(1);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  // Compute exact coordinates of targeted element
  const updateTargetCoordinates = useCallback(() => {
    if (showPrompt || isCompleted) return;
    const stepConfig = INTERACTIVE_STEPS.find(s => s.stepIndex === stepIndex);
    if (!stepConfig) return;

    const el = document.getElementById(stepConfig.targetId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect(rect);
    } else {
      if (stepConfig.fallbackTab) {
        onNavigateTab(stepConfig.fallbackTab);
      }
      setTargetRect(null);
    }
  }, [stepIndex, showPrompt, isCompleted, onNavigateTab]);

  useEffect(() => {
    updateTargetCoordinates();
    const interval = setInterval(updateTargetCoordinates, 250);
    window.addEventListener("resize", updateTargetCoordinates);
    window.addEventListener("scroll", updateTargetCoordinates, true);

    return () => {
      clearInterval(interval);
      window.removeEventListener("resize", updateTargetCoordinates);
      window.removeEventListener("scroll", updateTargetCoordinates, true);
    };
  }, [updateTargetCoordinates]);

  // Elevate active step's target element z-index so it sits above backdrop blur, 100% visible & unblurred!
  useEffect(() => {
    if (!isOpen || showPrompt || isCompleted) return;

    const stepConfig = INTERACTIVE_STEPS.find(s => s.stepIndex === stepIndex);
    if (!stepConfig) return;

    const el = document.getElementById(stepConfig.targetId);
    if (!el) return;

    const originalZIndex = el.style.zIndex;
    const originalPosition = el.style.position;

    // Elevate target element
    el.style.position = "relative";
    el.style.zIndex = "9995";

    return () => {
      el.style.zIndex = originalZIndex;
      el.style.position = originalPosition;
    };
  }, [isOpen, showPrompt, isCompleted, stepIndex]);

  // STRICT CLICK LOCKOUT & TARGET ACTION EXECUTION
  useEffect(() => {
    if (!isOpen || showPrompt || isCompleted) return;

    const handlePointerInteraction = (e: MouseEvent | TouchEvent) => {
      const stepConfig = INTERACTIVE_STEPS.find(s => s.stepIndex === stepIndex);
      if (!stepConfig) return;

      const targetEl = document.getElementById(stepConfig.targetId);
      const cardEl = document.getElementById("tour-floating-card");

      const clientX = 'touches' in e ? e.touches[0]?.clientX : (e as MouseEvent).clientX;
      const clientY = 'touches' in e ? e.touches[0]?.clientY : (e as MouseEvent).clientY;

      let isInsideTarget = false;
      if (targetEl) {
        const rect = targetEl.getBoundingClientRect();
        if (
          clientX >= rect.left - 12 &&
          clientX <= rect.right + 12 &&
          clientY >= rect.top - 12 &&
          clientY <= rect.bottom + 12
        ) {
          isInsideTarget = true;
        }
      }

      const isInsideCard = cardEl && cardEl.contains(e.target as Node);

      // If user clicks on/near active target, trigger action and advance step
      if (isInsideTarget) {
        if (targetEl) {
          targetEl.click();
        }
        setTimeout(() => {
          if (stepIndex < INTERACTIVE_STEPS.length) {
            setStepIndex(prev => prev + 1);
          } else {
            setIsCompleted(true);
            try {
              confetti({
                particleCount: 160,
                spread: 90,
                origin: { y: 0.3 }
              });
            } catch (err) {
              console.warn("Confetti bypass:", err);
            }
          }
        }, 300);
        return;
      }

      // If user clicks outside active target & outside tour card, block the click!
      if (!isInsideCard) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener("click", handlePointerInteraction, true);
    window.addEventListener("mousedown", handlePointerInteraction, true);
    window.addEventListener("touchstart", handlePointerInteraction, true);

    return () => {
      window.removeEventListener("click", handlePointerInteraction, true);
      window.removeEventListener("mousedown", handlePointerInteraction, true);
      window.removeEventListener("touchstart", handlePointerInteraction, true);
    };
  }, [isOpen, showPrompt, stepIndex, isCompleted]);

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
    }
  };

  const handlePrevStep = () => {
    if (stepIndex > 1) {
      setStepIndex(prev => prev - 1);
    }
  };

  // Dimensions for rounded cutout spotlight
  const pad = 6;
  const left = targetRect ? Math.max(0, targetRect.left - pad) : 0;
  const top = targetRect ? Math.max(0, targetRect.top - pad) : 0;
  const width = targetRect ? targetRect.width + pad * 2 : 0;
  const height = targetRect ? targetRect.height + pad * 2 : 0;

  return (
    <AnimatePresence>
      {/* 1. STARTING TOUR PROMPT MODAL */}
      {showPrompt ? (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 xs:p-4 bg-[#09090c]/85 backdrop-blur-md select-none">
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
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-[#09090c]/85 backdrop-blur-md select-none">
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
        /* 2. REAL-TIME SMOOTH BACKDROP BLUR MASK WITH SMOOTH ROUNDED CORNER CUTOUT & ELEVATED TARGET */
        <div className="fixed inset-0 z-[9985] select-none pointer-events-none">
          
          {/* SVG MASK BACKDROP WITH ROUNDED RECTANGLE CUTOUT FOR UNBLURRED VISIBILITY */}
          <svg className="fixed inset-0 w-full h-full z-[9980] pointer-events-none">
            <defs>
              <mask id="tour-spotlight-mask">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {targetRect && (
                  <rect
                    x={left}
                    y={top}
                    width={width}
                    height={height}
                    rx={20}
                    ry={20}
                    fill="black"
                  />
                )}
              </mask>
            </defs>

            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="rgba(9, 9, 12, 0.65)"
              mask="url(#tour-spotlight-mask)"
              className="backdrop-blur-md"
            />
          </svg>

          {/* SOFT ROUNDED SPOTLIGHT GLOW HALO AROUND TARGET BUTTON */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              style={{
                position: "fixed",
                left: left,
                top: top,
                width: width,
                height: height,
                borderRadius: 20,
                border: "2px solid #5227FF",
                boxShadow: "0 0 30px 6px rgba(82, 39, 255, 0.7), inset 0 0 12px rgba(82, 39, 255, 0.3)",
                pointerEvents: "none",
                zIndex: 9992
              }}
            />
          )}

          {/* ANIMATED PULSING ARROW POINTING TO TARGET */}
          {targetRect && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ repeat: Infinity, repeatType: "reverse", duration: 0.6 }}
              style={{
                position: "fixed",
                left: targetRect.left + targetRect.width / 2 - 18,
                top: Math.max(8, targetRect.top - 48),
                zIndex: 9996,
                pointerEvents: "none"
              }}
              className="flex flex-col items-center text-[#5227FF] drop-shadow-[0_4px_16px_rgba(82,39,255,0.9)]"
            >
              <div className="p-2 rounded-full bg-[#5227FF] text-white shadow-2xl">
                <ArrowDown className="w-5 h-5 text-white" />
              </div>
            </motion.div>
          )}

          {/* FLOATING TOUR CONTROL CARD */}
          <div className="fixed inset-x-3 bottom-4 sm:bottom-6 z-[9999] flex justify-center pointer-events-auto">
            <motion.div
              id="tour-floating-card"
              key={stepIndex}
              initial={{ opacity: 0, y: 20, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.96 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="w-full max-w-[calc(100vw-2rem)] sm:max-w-md bg-[#0b0b0e] border border-[#1e1e24] rounded-2xl sm:rounded-[2rem] p-4 sm:p-5 shadow-2xl text-white relative"
            >
              {/* TOP STEPPER CIRCLE INDICATORS */}
              <div className="flex items-center w-full mb-3 sm:mb-4 px-0.5">
                {INTERACTIVE_STEPS.map((s, idx) => {
                  const sNum = idx + 1;
                  const isDone = stepIndex > sNum;
                  const isCurrent = stepIndex === sNum;
                  const isNotLast = idx < totalSteps - 1;

                  return (
                    <React.Fragment key={s.stepIndex}>
                      <div className="relative flex items-center justify-center shrink-0">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 font-semibold text-[11px] sm:text-xs ${
                            isDone
                              ? "bg-[#5227FF] text-white"
                              : isCurrent
                              ? "bg-[#5227FF] text-white"
                              : "bg-[#1f1f24] text-[#a3a3a3]"
                          }`}
                        >
                          {isDone ? (
                            <Check className="w-3.5 h-3.5 text-white" />
                          ) : isCurrent ? (
                            <div className="w-2 h-2 rounded-full bg-white animate-ping" />
                          ) : (
                            <span>{sNum}</span>
                          )}
                        </div>
                      </div>

                      {isNotLast && (
                        <div className="flex-1 h-[2px] mx-1 sm:mx-2 bg-[#27272a] relative overflow-hidden rounded">
                          <div
                            className="h-full bg-[#5227FF] transition-all duration-300"
                            style={{ width: isDone ? "100%" : "0%" }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* END TOUR X BUTTON */}
                <button
                  type="button"
                  onClick={onClose}
                  className="ml-2 text-[#a3a3a3] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1f1f24] cursor-pointer"
                  title="End Tour"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* INSTRUCTION TEXT */}
              <div className="text-left mb-4">
                <h4 className="text-sm sm:text-base font-bold text-[#5227FF] mb-1">
                  {currentStepConfig?.title}
                </h4>
                <p className="text-zinc-200 text-xs sm:text-sm leading-relaxed">
                  {currentStepConfig?.instruction}
                </p>
              </div>

              {/* FOOTER NAV CONTROLS */}
              <div className="flex items-center justify-between pt-2 border-t border-[#1e1e24]">
                {stepIndex > 1 ? (
                  <button
                    type="button"
                    onClick={handlePrevStep}
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

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="px-4 sm:px-5 py-1.5 sm:py-2 rounded-full bg-[#5227FF] hover:bg-[#5227FF]/90 text-white text-xs font-semibold tracking-wide transition-all shadow-md cursor-pointer flex items-center gap-1 active:scale-95"
                >
                  <span>Skip Step</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );
}
