"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { supabase, syncUserProfile } from "@/lib/supabase";
import { Lock, Mail, User, AlertCircle, CheckCircle2, ArrowRight, ShieldCheck, LogOut, Loader2, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

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

  // Authenticated User Session
  const [activeSession, setActiveSession] = useState<any | null>(null);
  const [imgError, setImgError] = useState(false);

  // Listen to Supabase Auth State on load
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setActiveSession(session);
        syncUserProfile(session.user);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setActiveSession(session);
      if (session?.user) {
        await syncUserProfile(session.user);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
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

  // ==========================================
  // IF USER IS ALREADY AUTHENTICATED -> SHOW WELCOME & DATABASE STATUS
  // ==========================================
  if (activeSession) {
    const usr = activeSession.user;
    const name = usr.user_metadata?.full_name || usr.user_metadata?.name || usr.email?.split("@")[0] || "User";
    const avatar = usr.user_metadata?.avatar_url || usr.user_metadata?.picture || usr.user_metadata?.avatar || usr.identities?.[0]?.identity_data?.avatar_url || usr.identities?.[0]?.identity_data?.picture;

    return (
      <div className="h-screen w-full bg-[#0B0909] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="max-w-xl w-full p-8 sm:p-10 rounded-3xl border border-[#2E4540] bg-[#2E4540]/30 shadow-2xl relative z-10 space-y-8 text-center animate-fadeIn">
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="w-20 h-20 rounded-full border-2 border-[#408175] p-1 flex items-center justify-center bg-[#0B0909] shadow-xl overflow-hidden">
              {avatar && !imgError ? (
                <img 
                  src={avatar} 
                  alt={name} 
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover rounded-full" 
                />
              ) : (
                <span className="text-2xl font-black text-[#B5B9F0]">{name.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#408175]/20 border border-[#408175]/40 text-[#B5B9F0] text-xs font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-4 h-4 text-[#408175]" /> Authenticated via Supabase
              </span>
              <h1 className="text-3xl font-black text-white">Welcome back, {name}!</h1>
              <p className="text-sm text-[#B5B9F0]/80 mt-1">{usr.email}</p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-[#0B0909] border border-[#2E4540] text-left space-y-3 text-xs text-[#B5B9F0]">
            <div className="flex items-center justify-between border-b border-[#2E4540] pb-2">
              <span className="text-[#B5B9F0]/70 font-extrabold uppercase">Database Status</span>
              <span className="text-[#408175] font-bold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#408175] animate-pulse" /> Connected & Synced
              </span>
            </div>
            <p className="text-[#B5B9F0]/90 leading-relaxed">
              Your profile records and authentication tokens have been securely registered in the <strong>Supabase Postgres DB (`public.profiles`)</strong> without error.
            </p>
          </div>

          <div className="pt-4 border-t border-[#2E4540] flex items-center justify-between">
            <button
              onClick={() => alert("Proceeding to WordNest core application tools...")}
              className="px-6 py-3.5 rounded-2xl bg-[#408175] hover:opacity-90 text-white font-extrabold text-sm shadow-lg transition-all flex items-center gap-2"
            >
              <span>Launch Study Portal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleSignOut}
              className="px-5 py-3 rounded-2xl bg-[#0B0909] border border-[#2E4540] hover:border-[#408175] text-[#B5B9F0] hover:text-white font-bold text-sm transition-all flex items-center gap-2"
            >
              <LogOut className="w-4 h-4 text-[#408175]" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // MAIN SPLIT-SCREEN AUTHENTICATION PORTAL (STATIC & NON-SCROLLABLE)
  // ==========================================
  return (
    <div className="h-screen w-full flex flex-col md:flex-row bg-[#0B0909] relative overflow-hidden">
      
      {/* Floating 2-second Toast Notifications */}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="px-4 py-3 rounded-2xl bg-[#0B0909]/95 border border-rose-500/60 text-rose-200 text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-sm pointer-events-auto"
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
              className="px-4 py-3 rounded-2xl bg-[#0B0909]/95 border border-[#408175] text-white text-xs shadow-2xl backdrop-blur-md flex items-center gap-3 max-w-sm pointer-events-auto"
            >
              <CheckCircle2 className="w-4 h-4 text-[#408175] shrink-0" />
              <span className="font-semibold">{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LEFT HEMISPHERE (60% WIDTH): FULL-SCREEN COVER ARTWORK */}
      <div className="hidden md:block md:w-[60%] relative h-full bg-[#0B0909] overflow-hidden">
        <ImageSlideshow />
        {/* Blending Edge to merge seamlessly into the right side */}
        <div className="absolute inset-y-0 right-0 w-32 md:w-48 lg:w-64 bg-gradient-to-r from-transparent via-[#0B0909]/80 to-[#0B0909] pointer-events-none z-20 backdrop-blur-[2px] mask-image-linear-gradient" style={{ maskImage: 'linear-gradient(to right, transparent, black)' }} />
      </div>

      {/* RIGHT HEMISPHERE (40% WIDTH): AUTHENTICATION CONSOLE */}
      <div className="w-full md:w-[40%] h-full flex flex-col justify-center px-6 sm:px-10 lg:px-16 py-4 bg-[#0B0909] relative z-10 overflow-hidden">
        
        <div className="w-full max-w-sm mx-auto flex flex-col justify-center h-full">
          
          {/* Static Brand Header */}
          <WordNestLogoHeader />

          {/* Form Header */}
          <div className="space-y-1 mb-5">
            <h2 className="text-xl sm:text-2xl font-black text-white">
              {authMode === "signin" ? "Sign in to your account" : "Create your WordNest account"}
            </h2>
            <p className="text-xs text-[#B5B9F0]/80 font-semibold">
              {authMode === "signin"
                ? "Welcome back! Please enter your details below."
                : "Join WordNest and enhance your learning experience."}
            </p>
          </div>

          {/* Tab Switcher (Sign In vs Sign Up) */}
          <div className="p-1 rounded-xl bg-[#2E4540]/40 border border-[#2E4540] grid grid-cols-2 text-center text-xs font-black mb-4">
            <button
              type="button"
              onClick={() => { setAuthMode("signin"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all duration-200 ${
                authMode === "signin"
                  ? "bg-[#408175] text-white shadow-md"
                  : "text-[#B5B9F0]/70 hover:text-white"
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode("signup"); setErrorMsg(null); setSuccessMsg(null); }}
              className={`py-2 rounded-lg transition-all duration-200 ${
                authMode === "signup"
                  ? "bg-[#408175] text-white shadow-md"
                  : "text-[#B5B9F0]/70 hover:text-white"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* EMAIL & PASSWORD FORM */}
          <form onSubmit={handleEmailAuthSubmit} className="space-y-3">
            {authMode === "signup" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#B5B9F0]">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-[#B5B9F0]/60 pointer-events-none" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your name"
                    disabled={isLoading}
                    style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0909] border border-[#2E4540] hover:border-[#408175] focus:border-[#408175] focus:outline-none text-xs text-white placeholder-[#B5B9F0]/40 transition-all font-medium"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-xs font-bold text-[#B5B9F0]">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-[#B5B9F0]/60 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  disabled={isLoading}
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B0909] border border-[#2E4540] hover:border-[#408175] focus:border-[#408175] focus:outline-none text-xs text-white placeholder-[#B5B9F0]/40 transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#B5B9F0]">Password</label>
                {authMode === "signin" && (
                  <button
                    type="button"
                    onClick={() => alert("Password recovery instruction: Contact administration or reset via Supabase email OTP link.")}
                    className="text-[11px] text-[#408175] hover:underline font-semibold"
                  >
                    Forgot Password?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-[#B5B9F0]/60 pointer-events-none" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={authMode === "signup" ? "Create password (min 6 chars)" : "Enter your password"}
                  required
                  disabled={isLoading}
                  style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-[#0B0909] border border-[#2E4540] hover:border-[#408175] focus:border-[#408175] focus:outline-none text-xs text-white placeholder-[#B5B9F0]/40 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3 text-[#B5B9F0]/60 hover:text-white transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <Eye className="w-4 h-4 text-[#408175]" /> : <EyeOff className="w-4 h-4" />}
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
                  className="w-4 h-4 rounded border-[#2E4540] bg-[#0B0909] text-[#408175] focus:ring-[#408175]"
                />
                <label htmlFor="remember" className="text-xs font-semibold text-[#B5B9F0]/80 cursor-pointer select-none">
                  Remember me
                </label>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isOAuthLoading}
              className="w-full py-3 rounded-xl bg-[#408175] hover:opacity-90 text-white font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-1 active:scale-98"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
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
            <div className="flex-grow border-t border-[#2E4540]"></div>
            <span className="flex-shrink mx-4 text-[#B5B9F0]/60 text-[10px] font-bold uppercase tracking-widest">
              Or {authMode === "signin" ? "sign in" : "register"} with
            </span>
            <div className="flex-grow border-t border-[#2E4540]"></div>
          </div>

          {/* OTHER SIGN-IN OPTIONS (BELOW SUBMIT BUTTON, ROUNDED CIRCLE WITH GOOGLE LOGO ONLY) */}
          <div className="flex justify-center items-center">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isOAuthLoading || isLoading}
              title="Continue with Google"
              aria-label="Continue with Google"
              className="w-12 h-12 rounded-full bg-[#2E4540] hover:bg-[#408175] text-white flex items-center justify-center transition-all duration-300 shadow-md hover:shadow-lg disabled:opacity-50 active:scale-95 group border border-[#408175]/40"
            >
              {isOAuthLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-white" />
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
          <p className="text-[11px] text-center text-[#B5B9F0]/60 leading-relaxed mt-5">
            By accessing WordNest, you agree to our <a href="#" className="underline text-[#B5B9F0] hover:text-white">Terms of Service</a> and <a href="#" className="underline text-[#B5B9F0] hover:text-white">Privacy Policy</a>.
          </p>

        </div>
      </div>
    </div>
  );
}
