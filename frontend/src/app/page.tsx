"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase, syncUserProfile } from "@/lib/supabase";
import { Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, LogOut, Loader2, Eye, EyeOff, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Dashboard from "@/components/Dashboard";
import OnboardingFlow from "@/components/OnboardingFlow";

const WordNestLogoHeader = () => {
  return (
    <div className="relative flex justify-center items-center mb-8 h-24 w-full">
      <div className="flex items-end -space-x-1.5 pt-2 select-none z-20">
        <span className="text-[3.25rem] sm:text-6xl heavy-text-pink tracking-wider transform -rotate-3 leading-none drop-shadow-xl">Word</span>
        <span className="text-[3.25rem] sm:text-6xl heavy-text-yellow tracking-wider transform rotate-3 leading-none relative top-1 drop-shadow-xl">Nest</span>
      </div>
    </div>
  );
};

const ImageSlideshow = () => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = [
    "/Login page img.png",
    "/graffiti-2.png",
    "/graffiti-3.jpg",
    "/graffiti-4.png",
    "/graffiti-5.jpg"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {images.map((src, index) => (
        <Image
          key={src}
          src={src}
          alt={`Graffiti Art ${index + 1}`}
          fill
          priority={index === 0}
          className={`object-cover object-center w-full h-full select-none transition-opacity duration-1000 ease-in-out ${
            index === currentImageIndex ? "opacity-100 z-10" : "opacity-0 z-0"
          }`}
        />
      ))}
    </>
  );
};

export default function AuthPortalPage() {
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [showAuthModal, setShowAuthModal] = useState(false);
  
  // Form State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  // UX & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [isOAuthLoading, setIsOAuthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Authenticated User Session & Profile Onboarding State
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);
  const [imgError, setImgError] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  const checkUserProfileAndOnboarding = async (user: any) => {
    if (!user) {
      setUserProfile(null);
      setNeedsOnboarding(false);
      return;
    }
    try {
      await syncUserProfile(user);
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profile) {
        setUserProfile(profile);
        if (!profile.onboarding_completed) {
          setNeedsOnboarding(true);
        } else {
          setNeedsOnboarding(false);
        }
      } else {
        setNeedsOnboarding(true);
      }
    } catch (e) {
      console.warn("Notice: Error checking user profile onboarding state:", e);
      setNeedsOnboarding(false);
    }
  };

  // Listen to Supabase Auth State on load
  useEffect(() => {
    let sessionChecked = false;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        setActiveSession(session);
        await checkUserProfileAndOnboarding(session.user);
      }
      sessionChecked = true;
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setActiveSession(session);
      if (session?.user) {
        await checkUserProfileAndOnboarding(session.user);
      } else {
        setUserProfile(null);
        setNeedsOnboarding(false);
      }
      sessionChecked = true;
    });

    // Ensure initial splash screen loader displays for at least 1800ms,
    // and stays visible until the initial session check has completed.
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        if (sessionChecked) {
          setIsInitialLoading(false);
          clearInterval(interval);
        }
      }, 50);
    }, 1800);

    return () => {
      authListener.subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  // Auto-dismiss Toast Notifications after 2 seconds
  useEffect(() => {
    if (successMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [successMsg]);

  useEffect(() => {
    if (errorMsg) {
      const timer = setTimeout(() => {
        setErrorMsg(null);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [errorMsg]);

  // Handle Google OAuth Direct Authentication
  const handleGoogleSignIn = async () => {
    setIsOAuthLoading(true);
    setErrorMsg(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        if (error.message.includes("provider is not enabled")) {
          setErrorMsg("Google OAuth is disabled in Supabase! Please go to your Supabase Dashboard -> Authentication -> Providers -> Google, toggle ON 'Enable Google provider', and click Save.");
        } else if (error.message.includes("fetch") || error.message.includes("Invalid")) {
          setErrorMsg("To launch Google OAuth, please verify your Supabase Project URL in .env.local and enable the Google provider in your Supabase Auth dashboard.");
        } else {
          setErrorMsg(error.message);
        }
      }
    } catch (e: any) {
      setErrorMsg("Google Authentication connection issue. Ensure your credentials are active in Supabase.");
    } finally {
      setIsOAuthLoading(false);
    }
  };

  // Handle Email & Password Submit
  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please enter both your email and password.");
      return;
    }

    if (authMode === "signup" && password.length < 6) {
      setErrorMsg("For security, passwords must be at least 6 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      if (authMode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim() || email.split("@")[0],
            },
          },
        });

        if (error) throw error;
        if (data.user) {
          // Save profile credentials in database ONLY if 'Remember me' is checked
          if (rememberMe) {
            await syncUserProfile(data.user);
          }
          if (data.session) {
            setActiveSession(data.session);
          } else {
            // Automatically sign in user after signup to enter dashboard immediately
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password,
            });
            if (signInData?.session) {
              setActiveSession(signInData.session);
            }
          }
          setSuccessMsg("Account created successfully! Welcome to your dashboard.");
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
        if (data.user) {
          await syncUserProfile(data.user);
          setSuccessMsg("Welcome back to WordNest!");
        }
      }
    } catch (err: any) {
      if (err.message?.toLowerCase().includes("rate limit")) {
        setErrorMsg("Email rate limit reached! In Supabase Dashboard -> Project Settings (⚙️) -> Authentication -> Rate Limits, change 'Email rate limit' to 300, or use Google Sign-In!");
      } else {
        setErrorMsg(err.message || "Authentication attempt failed. Please check your credentials.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setActiveSession(null);
    setSuccessMsg("You have been signed out safely.");
  };

  return (
    <>
      <AnimatePresence mode="wait">
        {isInitialLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed inset-0 z-[9999] bg-[#0d0d0d] flex items-center justify-center"
          >
            <div className="relative w-64 h-64 select-none">
              <Image
                src="/loading.svg"
                alt="Loading WordNest..."
                fill
                priority
                className="object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {!isInitialLoading && (
        activeSession ? (
          <AnimatePresence mode="wait">
            {needsOnboarding ? (
              <motion.div
                key="onboarding-stepper"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.97,
                  filter: "blur(10px) brightness(0.2)",
                  transition: { duration: 0.9, ease: [0.4, 0, 0.2, 1] } 
                }}
                className="w-full h-full min-h-screen"
              >
                <OnboardingFlow
                  user={activeSession.user}
                  initialProfile={userProfile}
                  onComplete={async () => {
                    setNeedsOnboarding(false);
                    await checkUserProfileAndOnboarding(activeSession.user);
                  }}
                />
              </motion.div>
            ) : (
              <motion.div
                key="dashboard-view"
                initial={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="w-full h-full min-h-screen"
              >
                <Dashboard user={activeSession.user} onSignOut={handleSignOut} />
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="min-h-screen bg-gradient-to-br from-[#0D0D0D] via-[#1A1A24] to-[#0D0D0D] text-[#FAFAFA] flex flex-col justify-between overflow-x-hidden relative">
            
            {/* BACKGROUND DECORATIVE GLOWS */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-[#433075]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

            {/* HEADER */}
            <header className="w-full px-6 py-5 flex items-center justify-between border-b border-[#736A86]/20 relative z-20 bg-black/25 backdrop-blur-md">
              <div className="flex items-center gap-2 select-none cursor-pointer">
                <div className="w-8 h-8 sm:w-10 sm:h-10 relative shrink-0">
                  <Image src="/Wordnest.svg" alt="WordNest Logo" fill className="object-contain" />
                </div>
                <div className="flex items-center tracking-tight leading-none righteous-regular font-black text-xl sm:text-2xl">
                  <span className="text-[#FAFAFA]">Word</span>
                  <span className="text-[#F0C987]">Nest</span>
                </div>
              </div>
              <button
                onClick={() => { setAuthMode("signin"); setShowAuthModal(true); }}
                className="px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs uppercase tracking-wider shadow-md transition-all active:scale-95 cursor-pointer"
              >
                Sign In
              </button>
            </header>

            {/* HERO SECTION */}
            <main className="flex-1 max-w-5xl mx-auto px-6 py-12 sm:py-20 flex flex-col items-center text-center justify-center space-y-8 relative z-20">
              
              <div className="space-y-4">
                <span className="text-[10px] sm:text-xs bg-[#433075] text-[#FAFAFA] border border-[#A58CF4]/60 px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-inner">
                  Next-Gen Language Accelerator
                </span>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight uppercase leading-none max-w-4xl">
                  Build Masterful Vocabulary with <span className="text-[#A58CF4] block sm:inline">WordNest</span>
                </h1>
                <p className="text-sm sm:text-xl text-[#C8CED6] font-medium leading-relaxed max-w-2xl mx-auto">
                  An AI-powered academic vocabulary spaced-repetition training system designed to accelerate language retention, spelling mastery, and contextual sentence masteries.
                </p>
              </div>

              {/* ACTION BUTTON */}
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center pt-2">
                <button
                  onClick={() => { setAuthMode("signup"); setShowAuthModal(true); }}
                  className="px-8 py-4 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-sm uppercase tracking-wider transition-all duration-300 shadow-xl shadow-[#433075]/40 hover:shadow-[#A58CF4]/30 active:scale-95 cursor-pointer flex items-center gap-2 border border-[#A58CF4]/30"
                >
                  <span>Start Learning Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* FEATURES GRID */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 pt-12 w-full">
                <div className="p-6 rounded-3xl bg-[#272A3B]/40 border border-[#736A86]/30 space-y-2 text-left">
                  <h3 className="text-base font-black text-[#A58CF4] uppercase tracking-wider">AI Grading</h3>
                  <p className="text-xs text-[#C8CED6]/90 font-medium leading-relaxed">
                    Instant sentence evaluation scoring out of 100 with personalized grammar correction cards.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-[#272A3B]/40 border border-[#736A86]/30 space-y-2 text-left">
                  <h3 className="text-base font-black text-[#A58CF4] uppercase tracking-wider">Spaced Recall</h3>
                  <p className="text-xs text-[#C8CED6]/90 font-medium leading-relaxed">
                    Custom vocabulary decks utilizing smart flashcards for verified long-term recall.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-[#272A3B]/40 border border-[#736A86]/30 space-y-2 text-left">
                  <h3 className="text-base font-black text-[#A58CF4] uppercase tracking-wider">Dictation tests</h3>
                  <p className="text-xs text-[#C8CED6]/90 font-medium leading-relaxed">
                    Built-in TTS voice dictation to test your pronunciation and spelling speed.
                  </p>
                </div>
                <div className="p-6 rounded-3xl bg-[#272A3B]/40 border border-[#736A86]/30 space-y-2 text-left">
                  <h3 className="text-base font-black text-[#A58CF4] uppercase tracking-wider">Analytics</h3>
                  <p className="text-xs text-[#C8CED6]/90 font-medium leading-relaxed">
                    Log daily targets, streaks, and progress curves directly from the database.
                  </p>
                </div>
              </div>

              {/* GOOGLE COMPLIANCE NOTE */}
              <div className="p-5 rounded-2xl bg-[#272A3B]/30 border border-[#736A86]/20 max-w-2xl mx-auto mt-8 text-center space-y-2">
                <span className="text-[10px] font-black text-[#F0C987] uppercase tracking-widest block">Google Integration Transparency</span>
                <p className="text-[10px] sm:text-xs text-[#C8CED6]/90 leading-relaxed font-semibold">
                  WordNest requests access to your Google account details (email and name) solely to securely identify your profile, authenticate your access, and synchronize your custom vocabulary study decks across devices.
                </p>
              </div>

            </main>

            {/* PUBLIC COMPLIANT FOOTER */}
            <footer className="w-full py-6 border-t border-[#736A86]/20 text-center relative z-20 bg-black/25 backdrop-blur-md">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-xs font-black text-[#C8CED6]/70 uppercase tracking-widest">
                <span>© {new Date().getFullYear()} WordNest</span>
                <Link href="/privacy" className="hover:text-[#A58CF4] transition-colors underline">Privacy Policy</Link>
                <Link href="/terms" className="hover:text-[#A58CF4] transition-colors underline">Terms of Service</Link>
              </div>
            </footer>

            {/* SMOOTH AUTH MODAL OVERLAY */}
            <AnimatePresence>
              {showAuthModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                  {/* Backdrop */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setShowAuthModal(false)}
                    className="absolute inset-0 bg-black/85 backdrop-blur-md"
                  />

                  {/* Auth Modal Container */}
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative w-full max-w-md bg-[#0D0D0D] border-2 border-[#736A86]/50 rounded-[2rem] p-6 sm:p-8 overflow-y-auto max-h-[90vh] shadow-2xl z-10 custom-scrollbar"
                  >
                    {/* Close button */}
                    <button
                      onClick={() => setShowAuthModal(false)}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-[#272A3B] hover:bg-rose-500 hover:text-white text-[#C8CED6] shadow-md transition-colors cursor-pointer"
                      title="Close modal"
                    >
                      <X className="w-4 h-4" />
                    </button>

                    <div className="w-full pt-4">
                      {/* Logo */}
                      <div className="flex justify-center items-center mb-6">
                        <div className="w-10 h-10 relative shrink-0">
                          <Image src="/Wordnest.svg" alt="WordNest Logo" fill className="object-contain" />
                        </div>
                        <div className="flex items-center tracking-tight leading-none righteous-regular font-black text-2xl ml-2">
                          <span className="text-[#FAFAFA]">Word</span>
                          <span className="text-[#F0C987]">Nest</span>
                        </div>
                      </div>

                      {/* Header */}
                      <div className="space-y-1 mb-5 text-center">
                        <h2 className="text-lg sm:text-xl font-black text-[#FAFAFA] tracking-tight">
                          {authMode === "signin" ? "Sign in to your account" : "Create your WordNest account"}
                        </h2>
                        <p className="text-xs text-[#C8CED6] font-normal">
                          {authMode === "signin"
                            ? "Welcome back! Please enter your details below."
                            : "Join WordNest and enhance your learning experience."}
                        </p>
                      </div>

                      {/* Switcher */}
                      <div className="p-1 rounded-xl bg-gradient-to-r from-[#272A3B] to-[#272A3B]/80 border border-[#736A86]/60 grid grid-cols-2 text-center text-xs font-black mb-4 shadow-inner">
                        <button
                          type="button"
                          onClick={() => { setAuthMode("signin"); setErrorMsg(null); setSuccessMsg(null); }}
                          className={`py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                            authMode === "signin"
                              ? "bg-[#433075] text-[#FAFAFA] shadow-md border border-[#A58CF4]/50"
                              : "text-[#C8CED6] hover:text-[#A58CF4]"
                          }`}
                        >
                          Sign In
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAuthMode("signup"); setErrorMsg(null); setSuccessMsg(null); }}
                          className={`py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                            authMode === "signup"
                              ? "bg-[#433075] text-[#FAFAFA] shadow-md border border-[#A58CF4]/50"
                              : "text-[#C8CED6] hover:text-[#A58CF4]"
                          }`}
                        >
                          Sign Up
                        </button>
                      </div>

                      {/* Auth Form */}
                      <form onSubmit={handleEmailAuthSubmit} className="space-y-4">
                        {authMode === "signup" && (
                          <div className="space-y-1.5">
                            <span className="text-[10px] uppercase font-black text-[#C8CED6] tracking-wider block">Full Name</span>
                            <div className="relative">
                              <User className="absolute left-3.5 top-3 w-4 h-4 text-[#736A86]" />
                              <input
                                type="text"
                                required
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter full name"
                                disabled={isLoading}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#272A3B]/40 border border-[#736A86] hover:border-[#A58CF4] focus:border-[#A58CF4] focus:outline-none focus:ring-1 focus:ring-[#A58CF4] text-xs text-[#FAFAFA] placeholder-[#C8CED6]/50 transition-all font-semibold"
                              />
                            </div>
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-black text-[#C8CED6] tracking-wider block">Email Address</span>
                          <div className="relative">
                            <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#736A86]" />
                            <input
                              type="email"
                              required
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Enter email address"
                              disabled={isLoading}
                              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#272A3B]/40 border border-[#736A86] hover:border-[#A58CF4] focus:border-[#A58CF4] focus:outline-none focus:ring-1 focus:ring-[#A58CF4] text-xs text-[#FAFAFA] placeholder-[#C8CED6]/50 transition-all font-semibold"
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase font-black text-[#C8CED6] tracking-wider block">Password</span>
                          <div className="relative">
                            <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-[#736A86]" />
                            <input
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              placeholder={authMode === "signin" ? "Enter password" : "Create password (6+ chars)"}
                              disabled={isLoading}
                              className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#272A3B]/40 border border-[#736A86] hover:border-[#A58CF4] focus:border-[#A58CF4] focus:outline-none focus:ring-1 focus:ring-[#A58CF4] text-xs text-[#FAFAFA] placeholder-[#C8CED6]/50 transition-all font-semibold"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className="absolute right-3.5 top-3 text-[#C8CED6] hover:text-[#A58CF4] transition-colors cursor-pointer"
                              title={showPassword ? "Hide password" : "Show password"}
                            >
                              {showPassword ? <Eye className="w-4 h-4 text-[#A58CF4]" /> : <EyeOff className="w-4 h-4 text-[#736A86]" />}
                            </button>
                          </div>
                        </div>

                        {authMode === "signup" && (
                          <div className="flex items-center gap-2 pt-1">
                            <input
                              type="checkbox"
                              id="remember"
                              checked={rememberMe}
                              onChange={(e) => setRememberMe(e.target.checked)}
                              className="w-4 h-4 rounded border-[#736A86] bg-[#272A3B] text-[#433075] focus:ring-[#A58CF4]"
                            />
                            <label htmlFor="remember" className="text-xs font-semibold text-[#C8CED6] cursor-pointer select-none">
                              Remember me
                            </label>
                          </div>
                        )}

                        <button
                          type="submit"
                          disabled={isLoading || isOAuthLoading}
                          className="w-full py-3 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-[#FAFAFA] hover:text-[#0D0D0D] font-black text-xs shadow-lg shadow-[#433075]/40 hover:shadow-[#A58CF4]/30 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 mt-1 active:scale-95 cursor-pointer border border-[#A58CF4]/30 hover:border-[#0D0D0D]/20"
                        >
                          {isLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin text-current" />
                              <span>{authMode === "signin" ? "Authenticating..." : "Registering..."}</span>
                            </>
                          ) : (
                            <>
                              <span>{authMode === "signin" ? "Sign In to WordNest" : "Create WordNest Account"}</span>
                              <ArrowRight className="w-4 h-4" />
                            </>
                          )}
                        </button>
                      </form>

                      {/* Divider */}
                      <div className="relative flex py-4 items-center">
                        <div className="flex-grow border-t border-[#736A86]/50"></div>
                        <span className="flex-shrink mx-4 text-[#C8CED6]/70 text-[10px] font-bold uppercase tracking-widest">
                          Or login with
                        </span>
                        <div className="flex-grow border-t border-[#736A86]/50"></div>
                      </div>

                      {/* Google login */}
                      <div className="flex justify-center items-center">
                        <button
                          type="button"
                          onClick={handleGoogleSignIn}
                          disabled={isOAuthLoading || isLoading}
                          title="Continue with Google"
                          aria-label="Continue with Google"
                          className="w-12 h-12 rounded-full bg-[#272A3B] hover:bg-[#A58CF4] text-[#FAFAFA] flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-xl disabled:opacity-50 active:scale-95 group border border-[#736A86] hover:border-[#0D0D0D] cursor-pointer"
                        >
                          {isOAuthLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-current" />
                          ) : (
                            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z" />
                              <path fill="#34A853" d="M12 24c3.3 0 6.08-1.09 8.1-2.95l-3.88-3.05c-1.1.74-2.52 1.18-4.22 1.18-3.25 0-6.01-2.2-7-5.17H1.01v3.2A12.002 12.002 0 0 0 12 24Z" />
                              <path fill="#FBBC05" d="M5 14.01a7.222 7.222 0 0 1 0-4.02v-3.2H1.01c-1.63 3.25-1.63 7.12 0 10.42l3.99-3.2Z" />
                              <path fill="#EA4335" d="M12 4.75c1.77-.03 3.49.63 4.78 1.86l3.58-3.58C18.06 1.05 15.11-.05 12 0 7.42 0 3.39 2.59 1.01 6.79l3.99 3.2c.99-2.97 3.75-5.17 7-5.24Z" />
                            </svg>
                          )}
                        </button>
                      </div>

                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

          </div>
        )
      )}
    </>
  );
}
