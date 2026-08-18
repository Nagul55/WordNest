"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase, syncUserProfile } from "@/lib/supabase";
import { Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, LogOut, Loader2, Eye, EyeOff } from "lucide-react";
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
      // 1. Verify with Supabase Auth server whether user still exists in database
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) {
        console.warn("User account removed from database. Redirecting to login page...", authError?.message);
        await supabase.auth.signOut();
        setActiveSession(null);
        setUserProfile(null);
        setNeedsOnboarding(false);
        setErrorMsg("Your account was removed or deleted from the database. Redirecting to login page...");
        return;
      }

      const validUser = authData.user;

      await syncUserProfile(validUser);
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", validUser.id)
        .maybeSingle();

      if (profileError && profileError.message?.toLowerCase().includes("not found")) {
        await supabase.auth.signOut();
        setActiveSession(null);
        setUserProfile(null);
        setNeedsOnboarding(false);
        setErrorMsg("Account profile deleted. Redirecting to login page...");
        return;
      }

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
    } catch (e: any) {
      console.warn("Notice: Error checking user profile onboarding state:", e);
      if (e?.message?.toLowerCase().includes("not found") || e?.message?.toLowerCase().includes("jwt")) {
        await supabase.auth.signOut();
        setActiveSession(null);
        setUserProfile(null);
        setNeedsOnboarding(false);
        setErrorMsg("Your account was removed from the database. Redirecting to login page...");
      } else {
        setNeedsOnboarding(false);
      }
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
          <div className="min-h-[100dvh] h-full w-full flex flex-col md:flex-row bg-[#0D0D0D] relative overflow-y-auto md:overflow-hidden">
      
      {/* Floating 2-second Toast Notifications */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50 flex flex-col gap-3 pointer-events-none max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="px-4 py-3 rounded-2xl bg-[#272A3B]/95 border border-rose-500/60 text-rose-200 text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-sm pointer-events-auto"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span className="font-semibold">{errorMsg}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="px-4 py-3 rounded-2xl bg-[#272A3B]/95 border border-[#A58CF4] text-[#FAFAFA] text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-sm pointer-events-auto"
            >
              <CheckCircle2 className="w-4 h-4 text-[#A58CF4] shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LEFT HEMISPHERE (60% WIDTH): FULL-SCREEN COVER ARTWORK */}
      <div className="hidden md:block md:w-[60%] relative h-full bg-[#0D0D0D] overflow-hidden">
        <ImageSlideshow />
        {/* Blending Edge to merge seamlessly into the right side */}
        <div className="absolute inset-y-0 right-0 w-32 md:w-48 lg:w-64 bg-gradient-to-r from-transparent via-[#0D0D0D]/80 to-[#0D0D0D] pointer-events-none z-20 backdrop-blur-[2px] mask-image-linear-gradient" style={{ maskImage: 'linear-gradient(to right, transparent, #0D0D0D)' }} />
      </div>

      {/* RIGHT HEMISPHERE (40% WIDTH): AUTHENTICATION CONSOLE */}
      <div className="w-full md:w-[40%] min-h-full flex flex-col justify-center px-5 sm:px-10 lg:px-16 py-6 bg-[#0D0D0D] relative z-10 overflow-y-auto">
        
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center h-full">
          
          {/* Static Brand Header */}
          <WordNestLogoHeader />

          {/* Form Header */}
          <div className="space-y-1 mb-5">
            <h2 className="text-xl sm:text-2xl font-black text-[#FAFAFA] tracking-tight">
              {authMode === "signin" ? "Sign in to your account" : "Create your WordNest account"}
            </h2>
            <p className="text-xs text-[#C8CED6] font-normal">
              {authMode === "signin"
                ? "Welcome back! Please enter your details below."
                : "Join WordNest and enhance your learning experience."}
            </p>
          </div>

          {/* Tab Switcher (Sign In vs Sign Up) */}
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

          {/* EMAIL & PASSWORD FORM */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
            {authMode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#FAFAFA]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#A58CF4] pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isLoading}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#272A3B]/40 border border-[#736A86] hover:border-[#A58CF4] focus:border-[#A58CF4] focus:outline-none focus:ring-1 focus:ring-[#A58CF4] text-xs text-[#FAFAFA] placeholder-[#C8CED6]/50 transition-all font-semibold"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#FAFAFA]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#A58CF4] pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#272A3B]/40 border border-[#736A86] hover:border-[#A58CF4] focus:border-[#A58CF4] focus:outline-none focus:ring-1 focus:ring-[#A58CF4] text-xs text-[#FAFAFA] placeholder-[#C8CED6]/50 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#FAFAFA]">Password</label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => alert("Password recovery instruction: Contact administration or reset via Supabase email OTP link.")}
                    className="text-[11px] text-[#A58CF4] hover:underline font-bold cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#A58CF4] pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === "signup" ? "Create password (min 6 chars)" : "Enter your password"}
                  required
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

            {/* Remember me Checkbox (ONLY FOR SIGN UP) */}
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
                  <span>{authMode === "signin" ? "Authenticating..." : "Registering Account..."}</span>
                </>
              ) : (
                <>
                  <span>{authMode === "signin" ? "Sign In to WordNest" : "Create WordNest Account"}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider BELOW Sign In button */}
          <div className="relative flex py-4 items-center">
            <div className="flex-grow border-t border-[#736A86]/50"></div>
            <span className="flex-shrink mx-4 text-[#C8CED6]/70 text-[10px] font-bold uppercase tracking-widest">
              Or {authMode === "signin" ? "sign in" : "register"} with
            </span>
            <div className="flex-grow border-t border-[#736A86]/50"></div>
          </div>

          {/* OTHER SIGN-IN OPTIONS */}
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

          {/* Footer Terms Note */}
          <p className="text-[11px] text-center text-[#C8CED6]/70 leading-relaxed mt-5">
            By accessing WordNest, you agree to our <a href="#" className="underline text-[#C8CED6] hover:text-[#A58CF4]">Terms of Service</a> and <a href="#" className="underline text-[#C8CED6] hover:text-[#A58CF4]">Privacy Policy</a>.
          </p>

        </div>
      </div>
    </div>
        )
      )}
    </>
  );
}
