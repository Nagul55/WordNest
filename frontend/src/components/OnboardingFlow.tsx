"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import Stepper, { Step } from "./ui/Stepper";
import { supabase } from "@/lib/supabase";
import { 
  GraduationCap, 
  Briefcase, 
  Laptop, 
  BookOpen, 
  Brain, 
  Zap, 
  Share2, 
  Users, 
  Search, 
  Tv, 
  Sparkles,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Check,
  X
} from "lucide-react";

interface OnboardingFlowProps {
  user: any;
  initialProfile?: any;
  onComplete: () => void;
}

const OCCUPATION_OPTIONS = [
  { id: "Student", label: "Student", desc: "High school, college, or university", icon: GraduationCap },
  { id: "Worker", label: "Working Professional", desc: "Career, business & skill building", icon: Briefcase },
  { id: "Freelancer", label: "Freelancer / Independent", desc: "Self-employed specialist", icon: Laptop },
  { id: "Educator", label: "Educator / Teacher", desc: "Teaching & designing courses", icon: BookOpen },
  { id: "Researcher", label: "Researcher / Academic", desc: "Deep diving into science & tech", icon: Brain },
  { id: "Other", label: "Other", desc: "Personal growth & custom path", icon: Zap }
];

const REFERRAL_OPTIONS = [
  { id: "Social Media", label: "Social Media", desc: "TikTok, Twitter/X, Instagram", icon: Share2 },
  { id: "Friend or Colleague", label: "Friend or Colleague", desc: "Recommended by someone", icon: Users },
  { id: "Search Engine", label: "Search Engine", desc: "Google, Bing, search web", icon: Search },
  { id: "School / University", label: "School / Campus", desc: "Classroom or professor", icon: GraduationCap },
  { id: "YouTube / Podcast", label: "YouTube / Podcast", desc: "Video review or feature", icon: Tv },
  { id: "Other", label: "Other Source", desc: "Discovered elsewhere", icon: Sparkles }
];

export default function OnboardingFlow({ user, initialProfile, onComplete }: OnboardingFlowProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [username, setUsername] = useState<string>(
    initialProfile?.username || user?.user_metadata?.username || user?.email?.split('@')[0] || ""
  );
  const [initialUsername] = useState<string>(
    initialProfile?.username || ""
  );
  const [age, setAge] = useState<string>(initialProfile?.age || "");
  
  // Occupation state
  const rawOccupation = initialProfile?.occupation || "Student";
  const isExistingOtherOccupation = rawOccupation.startsWith("Other");
  const [occupation, setOccupation] = useState<string>(isExistingOtherOccupation ? "Other" : rawOccupation);
  const [otherOccupation, setOtherOccupation] = useState<string>(
    isExistingOtherOccupation ? rawOccupation.replace("Other: ", "").replace("Other", "") : ""
  );

  // Referral Source state
  const rawReferral = initialProfile?.referral_source || "Social Media";
  const isExistingOtherReferral = rawReferral.startsWith("Other");
  const [referralSource, setReferralSource] = useState<string>(isExistingOtherReferral ? "Other" : rawReferral);
  const [otherReferral, setOtherReferral] = useState<string>(
    isExistingOtherReferral ? rawReferral.replace("Other: ", "").replace("Other", "") : ""
  );

  // Username validation & database uniqueness state
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<boolean>(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState<boolean>(false);

  const [isSaving, setIsSaving] = useState(false);
  const [isCelebrationFading, setIsCelebrationFading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Trigger party celebration confetti paper rain falling from top of browser
  const triggerPartyConfetti = () => {
    try {
      const count = 220;
      const defaults = {
        origin: { y: 0.15 },
        colors: ["#5227FF", "#A58CF4", "#FFD700", "#FF5757", "#00E5FF", "#FF007F", "#00FF66"]
      };

      const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
          ...defaults,
          ...opts,
          particleCount: Math.floor(count * particleRatio)
        });
      };

      fire(0.25, { spread: 35, startVelocity: 65 });
      fire(0.2, { spread: 75, startVelocity: 55 });
      fire(0.35, { spread: 110, decay: 0.91, scalar: 0.9 });
      fire(0.1, { spread: 130, startVelocity: 25, decay: 0.92, scalar: 1.2 });
      fire(0.1, { spread: 130, startVelocity: 45 });
    } catch (e) {
      console.warn("Party confetti animation bypass:", e);
    }
  };

  // Real-time username validation effect (matching Settings page)
  useEffect(() => {
    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setUsernameError("Username is required.");
      setUsernameSuccess(false);
      return;
    }

    if (cleanUsername.length < 3) {
      setUsernameError("Username must be at least 3 characters.");
      setUsernameSuccess(false);
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
      setUsernameError("Username can only contain letters, numbers, and underscores.");
      setUsernameSuccess(false);
      return;
    }

    // If username is unchanged from user's existing saved username
    if (initialUsername && cleanUsername.toLowerCase() === initialUsername.toLowerCase()) {
      setUsernameError(null);
      setUsernameSuccess(true);
      return;
    }

    const delayDebounceFn = setTimeout(async () => {
      setUsernameError(null);
      setIsCheckingUsername(true);
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, username")
          .ilike("username", cleanUsername);

        if (error) throw error;

        const isTaken = data?.some(
          (profile) => profile.username.toLowerCase() === cleanUsername.toLowerCase() && profile.id !== user?.id
        );

        if (isTaken) {
          setUsernameError("Username is already taken by another user.");
          setUsernameSuccess(false);
        } else {
          setUsernameError(null);
          setUsernameSuccess(true);
        }
      } catch (err) {
        // Fallback for network sync
        setUsernameError(null);
        setUsernameSuccess(true);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 450);

    return () => clearTimeout(delayDebounceFn);
  }, [username, initialUsername, user?.id]);

  const handleSaveAndFinish = async () => {
    if (usernameError || isCheckingUsername) return;

    setIsSaving(true);
    setErrorMsg(null);

    // Fire celebratory confetti party paper bumps immediately on click!
    triggerPartyConfetti();
    setIsCelebrationFading(true);

    try {
      const cleanUsername = username.trim() || user?.email?.split('@')[0] || "WordNest User";
      
      const finalOccupation = occupation === "Other" && otherOccupation.trim()
        ? `Other: ${otherOccupation.trim()}`
        : occupation;

      const finalReferral = referralSource === "Other" && otherReferral.trim()
        ? `Other: ${otherReferral.trim()}`
        : referralSource;

      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        username: cleanUsername,
        full_name: initialProfile?.full_name || user?.user_metadata?.full_name || cleanUsername,
        age: age.trim() || null,
        occupation: finalOccupation,
        referral_source: finalReferral,
        onboarding_completed: true,
        has_completed_tour: false,
        updated_at: new Date().toISOString()
      }, { onConflict: 'id' });

      if (error) {
        console.error("Supabase profile save error:", error);
        throw error;
      }

      // Update local storage cache so frontend AI helpers immediately pick up profile context
      try {
        const profileKey = `wordnest_profile_${user.id}`;
        localStorage.setItem(profileKey, JSON.stringify({
          username: cleanUsername,
          age: age.trim(),
          occupation: finalOccupation,
          referral_source: finalReferral,
          onboarding_completed: true,
          has_completed_tour: false
        }));
        localStorage.removeItem(`wordnest_tour_completed_${user.id}`);
        sessionStorage.setItem(`wordnest_show_tour_${user.id}`, "true");
      } catch (e) {
        console.warn("Failed to set local profile cache:", e);
      }

      // Allow 1300ms for party paper rain and dark shadowed transition before opening dashboard
      setTimeout(() => {
        onComplete();
      }, 1300);

    } catch (err: any) {
      console.error("Failed to update profile during onboarding:", err);
      setErrorMsg(err?.message || "Failed to save profile.");
      setTimeout(() => {
        onComplete();
      }, 1200);
    } finally {
      setIsSaving(false);
    }
  };

  // Step Validation logic
  const isStep2Valid = 
    username.trim().length >= 3 && 
    !usernameError && 
    !isCheckingUsername && 
    age.trim().length > 0;

  const isStep3Valid = occupation !== "Other" || otherOccupation.trim().length > 0;
  const isStep4Valid = referralSource !== "Other" || otherReferral.trim().length > 0;

  return (
    <div className="min-h-screen w-full bg-[#09090c] flex flex-col items-center justify-center p-4 select-none font-sans text-white relative overflow-hidden">
      
      {/* Celebration Transition Fade Overlay */}
      {isCelebrationFading && (
        <div className="fixed inset-0 z-50 bg-[#09090c]/90 backdrop-blur-md transition-opacity duration-1000 ease-in-out pointer-events-none flex flex-col items-center justify-center">
          <div className="text-center animate-bounce mb-3">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#5227FF]/20 border border-[#5227FF] flex items-center justify-center text-[#A58CF4] shadow-2xl shadow-[#5227FF]/50">
              <Check className="w-8 h-8 text-white" />
            </div>
          </div>
          <h3 className="text-2xl font-extrabold text-white mb-1 tracking-tight">Setup Complete</h3>
          <p className="text-xs text-zinc-400">Launching your WordNest Dashboard...</p>
        </div>
      )}

      {/* Error Toast */}
      {errorMsg && (
        <div className="mb-4 px-4 py-2 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 max-w-sm">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Stepper Component container matching exact snapshot */}
      <div className="w-full max-w-md">
        <Stepper
          initialStep={1}
          disableStepIndicators={true}
          onStepChange={(step) => setCurrentStep(step)}
          onFinalStepCompleted={handleSaveAndFinish}
          backButtonText="Previous"
          nextButtonText={currentStep === 5 ? (isSaving ? "Complete..." : "Complete") : "Next"}
          isNextDisabled={
            (currentStep === 2 && !isStep2Valid) ||
            (currentStep === 3 && !isStep3Valid) ||
            (currentStep === 4 && !isStep4Valid)
          }
        >
          {/* STEP 1: Welcome */}
          <Step>
            <div className="py-2 text-left">
              {/* Horizontally centered application logo SVG */}
              <div className="flex justify-center items-center mb-4">
                <Image
                  src="/Wordnest.svg"
                  alt="WordNest Logo"
                  width={52}
                  height={52}
                  className="object-contain drop-shadow-md"
                  priority
                />
              </div>

              <h2 className="text-2xl font-bold text-[#5227FF] mb-2 tracking-tight">
                Welcome to WordNest!
              </h2>
              <p className="text-zinc-200 text-sm mb-4 leading-normal">
                Your smart study & vocabulary assistant. Let's set up your profile in just a few quick steps!
              </p>
            </div>
          </Step>

          {/* STEP 2: Username & Age Input with Real-time Database Uniqueness Check */}
          <Step>
            <div className="py-2 text-left">
              <h2 className="text-xl font-bold text-[#5227FF] mb-3 tracking-tight">
                Welcome details
              </h2>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Your name or username?
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Your name?"
                      className={`w-full px-3.5 py-2.5 rounded-lg bg-[#0e0e13] border text-white placeholder-zinc-500 text-sm focus:outline-none transition-all font-sans ${
                        usernameError 
                          ? "border-rose-500/80 focus:border-rose-500" 
                          : usernameSuccess 
                          ? "border-emerald-500/80 focus:border-emerald-500" 
                          : "border-[#27272a] focus:border-[#5227FF]"
                      }`}
                    />
                    {isCheckingUsername && (
                      <div className="absolute right-3 top-3 text-zinc-400">
                        <Loader2 className="w-4 h-4 animate-spin text-[#5227FF]" />
                      </div>
                    )}
                  </div>

                  {/* Real-time Validation Message */}
                  {isCheckingUsername ? (
                    <p className="text-[11px] text-amber-400 mt-1 flex items-center gap-1">
                      <Loader2 className="w-3 h-3 animate-spin text-amber-400" /> Checking username availability...
                    </p>
                  ) : usernameError ? (
                    <p className="text-[11px] text-rose-400 mt-1 flex items-center gap-1">
                      <X className="w-3 h-3 text-rose-400 shrink-0" /> {usernameError}
                    </p>
                  ) : usernameSuccess ? (
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-400 shrink-0" /> Username is available!
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Your age?
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="120"
                    value={age}
                    onChange={(e) => setAge(e.target.value)}
                    placeholder="Your age?"
                    className="w-full px-3.5 py-2.5 rounded-lg bg-[#0e0e13] border border-[#27272a] text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-[#5227FF] transition-all font-sans"
                  />
                </div>
              </div>
            </div>
          </Step>

          {/* STEP 3: Occupation */}
          <Step>
            <div className="py-2 text-left">
              <h2 className="text-xl font-bold text-[#5227FF] mb-2 tracking-tight">
                What are you currently doing?
              </h2>
              <p className="text-xs text-zinc-300 mb-3">
                Select student, worker, or your current primary role:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                {OCCUPATION_OPTIONS.map((opt) => {
                  const isSelected = occupation === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setOccupation(opt.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between font-sans ${
                        isSelected
                          ? "bg-[#5227FF]/15 border-[#5227FF] text-white"
                          : "bg-[#0e0e13] border-[#27272a] text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-xs font-medium">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#5227FF] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic User Input Field when "Other" is selected */}
              {occupation === "Other" && (
                <div className="mt-3 animate-fadeIn">
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Please specify your occupation <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherOccupation}
                    onChange={(e) => setOtherOccupation(e.target.value)}
                    placeholder="e.g. Medical Student, Flight Cadet, Senior Analyst..."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0e0e13] border border-[#27272a] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#5227FF] transition-all font-sans"
                  />
                </div>
              )}
            </div>
          </Step>

          {/* STEP 4: How they heard about our site */}
          <Step>
            <div className="py-2 text-left">
              <h2 className="text-xl font-bold text-[#5227FF] mb-2 tracking-tight">
                How did you hear about us?
              </h2>
              <p className="text-xs text-zinc-300 mb-3">
                How did you discover our site?
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[190px] overflow-y-auto pr-1">
                {REFERRAL_OPTIONS.map((opt) => {
                  const isSelected = referralSource === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setReferralSource(opt.id)}
                      className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between font-sans ${
                        isSelected
                          ? "bg-[#5227FF]/15 border-[#5227FF] text-white"
                          : "bg-[#0e0e13] border-[#27272a] text-zinc-300 hover:border-zinc-700"
                      }`}
                    >
                      <span className="text-xs font-medium">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-[#5227FF] shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Dynamic User Input Field when "Other" referral is selected */}
              {referralSource === "Other" && (
                <div className="mt-3 animate-fadeIn">
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Please specify how you discovered us <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={otherReferral}
                    onChange={(e) => setOtherReferral(e.target.value)}
                    placeholder="e.g. Reddit thread, Tech Podcast, Newsletter..."
                    className="w-full px-3.5 py-2 rounded-lg bg-[#0e0e13] border border-[#27272a] text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-[#5227FF] transition-all font-sans"
                  />
                </div>
              )}
            </div>
          </Step>

          {/* STEP 5: Final Step */}
          <Step>
            <div className="py-2 text-left">
              <h2 className="text-2xl font-bold text-[#5227FF] mb-2 tracking-tight">
                Final Step
              </h2>
              <p className="text-white text-base font-normal mb-2 leading-normal">
                You made it!
              </p>

              {isSaving && (
                <div className="mt-4 flex items-center gap-2 text-xs text-[#5227FF]">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving details and redirecting to Dashboard...</span>
                </div>
              )}
            </div>
          </Step>
        </Stepper>
      </div>
    </div>
  );
}
