"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { getStoredUserContext } from "@/lib/api";
import { 
  Layers, 
  RotateCw, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  Flame, 
  Award, 
  Volume2, 
  Zap, 
  BrainCircuit, 
  SpellCheck, 
  Send, 
  RefreshCcw, 
  Trophy, 
  Timer, 
  Target, 
  HelpCircle, 
  Check, 
  X, 
  Loader2,
  ImageIcon,
  Undo2,
  RotateCcw,
  Keyboard
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import SpotlightCard from "../SpotlightCard";
import BorderGlow from "../BorderGlow";
import CustomSelect from "../ui/CustomSelect";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  meaning?: string;
  example: string;
  category: string;
  image?: string;
  sourceId?: string; // Used to identify which deck/vault the word came from
}

const playFeedbackSound = (isCorrect: boolean) => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    if (isCorrect) {
      // Uplifting positive major double-chime
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.12, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playNote(523.25, now, 0.15); // C5
      playNote(659.25, now + 0.08, 0.35); // E5
      playNote(783.99, now + 0.16, 0.45); // G5
    } else {
      // Disappointing warning buzz sound
      const playNote = (freq: number, start: number, duration: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.linearRampToValueAtTime(0.001, start + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + duration);
      };
      playNote(180, now, 0.2); // Low G#3
      playNote(120, now + 0.1, 0.35); // Lower B2
    }
  } catch (err) {
    console.warn("Audio Context feedback sound bypass:", err);
  }
};

export default function PracticeSection({ 
  user,
  prefetchedDecks,
  prefetchedSessions,
  prefetchedFlashcards
}: { 
  user?: any;
  prefetchedDecks?: any[] | null;
  prefetchedSessions?: any[] | null;
  prefetchedFlashcards?: any[] | null;
}) {
  const [activeTab, setActiveTab] = useState<"flashcards" | "speedmatch" | "quiz" | "spelling" | "aigrader" | null>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return (params.get("practice_tab") as any) || null;
    }
    return null;
  });

  const isInitialMount = useRef(true);

  // New Practice Setup States
  const [practiceState, setPracticeState] = useState<"setup" | "playing">("setup");
  const [userDecks, setUserDecks] = useState<{id: string, title: string}[]>([]);
  const [selectedDeckIds, setSelectedDeckIds] = useState<string[]>([]);
  const [shuffleWords, setShuffleWords] = useState(false);
  const [practiceWords, setPracticeWords] = useState<WordItem[]>([]);

  // Memoized deck names to prevent unneeded re-renders
  const selectedDeckNames = useMemo(() => {
    return selectedDeckIds.map(id => {
      if (id === "vault") return "Lexicon Vault";
      if (id === "direct") return "General Terms";
      return userDecks.find(d => d.id === id)?.title || id;
    });
  }, [selectedDeckIds, userDecks]);

  // Reset to setup whenever activeTab changes
  useEffect(() => {
    setPracticeState("setup");
  }, [activeTab]);

  // Sync activeTab state with URL query parameters (enables browser back/forward buttons)
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const currentPracticeTab = params.get("practice_tab");

      if (activeTab !== currentPracticeTab) {
        if (activeTab) {
          params.set("practice_tab", activeTab);
        } else {
          params.delete("practice_tab");
        }
        const newUrl = "?" + params.toString() + window.location.hash;
        
        if (isInitialMount.current) {
          window.history.replaceState(null, "", newUrl);
          isInitialMount.current = false;
        } else {
          window.history.pushState(null, "", newUrl);
        }
      } else if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    }
  }, [activeTab]);

  // Listen to popstate event to update activeTab state when back/forward is clicked
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const practiceTab = (params.get("practice_tab") as any) || null;
      setActiveTab(practiceTab);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const [words, setWords] = useState<WordItem[]>([]);

  // Individual section XP tracking
  const [flashcardsXp, setFlashcardsXp] = useState(0);
  const [speedmatchXp, setSpeedmatchXp] = useState(0);
  const [quizXp, setQuizXp] = useState(0);
  const [spellingXp, setSpellingXp] = useState(0);
  const [aigraderXp, setAigraderXp] = useState(0);

  // Session duration tracking refs
  const sessionStartTimeRef = useRef<number | null>(null);

  useEffect(() => {
    if (activeTab !== null) {
      sessionStartTimeRef.current = Date.now();
    } else {
      sessionStartTimeRef.current = null;
    }
  }, [activeTab]);

  // Load section XP and database cards
  useEffect(() => {
    const fetchUserCardsAndXp = async () => {
      if (!user?.id) return;

      // 1. Fetch user-created vocabulary cards from Supabase flashcards and vocabulary_vault
      try {
        let userSets = prefetchedDecks !== null
          ? prefetchedDecks
          : (await supabase
              .from("study_sets")
              .select("id, title")
              .eq("user_id", user.id)).data;
          
        if (userSets) {
          setUserDecks(userSets.map((s: any) => ({ id: s.id, title: s.title || "Untitled Deck" })));
        }

        const setIds = (userSets || []).map((s: any) => s.id);
        let cardResults: any[] = [];

        // Direct user_id query backup if user_id column exists
        const directCards = prefetchedDecks !== null 
          ? null 
          : (await supabase
              .from("flashcards")
              .select("*")
              .eq("user_id", user.id)
              .limit(50)).data;

        if (prefetchedDecks !== null && prefetchedFlashcards !== undefined && prefetchedFlashcards !== null) {
          cardResults = prefetchedFlashcards;
        }

        if (setIds.length > 0 && prefetchedDecks === null) {
          const { data: cardsBySets } = await supabase
            .from("flashcards")
            .select("*")
            .in("set_id", setIds)
            .limit(50);
          if (cardsBySets) cardResults = [...cardResults, ...cardsBySets];
        }

        if (directCards) {
          const existingIds = new Set(cardResults.map(c => c.id));
          directCards.forEach(dc => {
            if (!existingIds.has(dc.id)) {
              cardResults.push(dc);
            }
          });
        }
          
        const { data: vaultWords } = await supabase
          .from("vocabulary_vault")
          .select("*")
          .eq("user_id", user.id)
          .limit(50);

        let combined: WordItem[] = [];

        if (cardResults && cardResults.length > 0) {
          const formatted = cardResults.map((c: any) => ({
            id: c.id,
            word: c.term,
            phonetic: "/" + c.term.toLowerCase() + "/",
            definition: c.definition,
            meaning: c.definition,
            image: c.image_url || undefined,
            example: `The word "${c.term}" is essential for mastery.`,
            category: "Custom Deck",
            sourceId: c.set_id || "direct"
          }));
          combined = [...combined, ...formatted];
        }
        
        if (vaultWords && vaultWords.length > 0) {
          const formattedVault = vaultWords.map((v: any) => ({
            id: v.id,
            word: v.word,
            phonetic: v.phonetic || "/" + v.word.toLowerCase() + "/",
            definition: v.definition,
            meaning: v.definition,
            example: v.example || "",
            category: v.category || "Lexicon Vault",
            sourceId: "vault"
          }));
          
          // merge without duplicates by word
          const existingWords = new Set(combined.map(c => c.word.toLowerCase()));
          formattedVault.forEach(v => {
            if (!existingWords.has(v.word.toLowerCase())) {
              combined.push(v);
            }
          });
        }
        
        setWords(combined);
      } catch (e) {
        console.warn("Error fetching practice words:", e);
      }

      // 2. Fetch real XP from practice_sessions table
      try {
        const xpData = prefetchedSessions !== null
          ? prefetchedSessions
          : (await supabase
              .from("practice_sessions")
              .select("mode, xp_earned")
              .eq("user_id", user.id)).data;
        
        const xpMap: Record<string, number> = { flashcards: 0, speedmatch: 0, quiz: 0, spelling: 0, aigrader: 0 };
        if (xpData) {
          xpData.forEach(row => {
            if (row.mode && xpMap[row.mode] !== undefined) {
              xpMap[row.mode] += row.xp_earned || 0;
            }
          });
        }
        
        setFlashcardsXp(xpMap.flashcards);
        setSpeedmatchXp(xpMap.speedmatch);
        setQuizXp(xpMap.quiz);
        setSpellingXp(xpMap.spelling);
        setAigraderXp(xpMap.aigrader);
      } catch (e) {
        console.warn("Error fetching XP:", e);
      }
    };

    fetchUserCardsAndXp();
  }, [user, prefetchedDecks, prefetchedFlashcards, prefetchedSessions]);

  // Section specific reward helper
  const handleRewardXp = async (amount: number, durationSeconds: number = 0) => {
    if (!activeTab || !user?.id) return;

    const updateXpStateMap: Record<string, React.Dispatch<React.SetStateAction<number>>> = {
      flashcards: setFlashcardsXp,
      speedmatch: setSpeedmatchXp,
      quiz: setQuizXp,
      spelling: setSpellingXp,
      aigrader: setAigraderXp
    };

    const updater = updateXpStateMap[activeTab];
    if (updater) {
      updater((prev) => prev + amount);
    }
    
    // Save real DB entry
    try {
      await supabase.from("practice_sessions").insert({
        user_id: user.id,
        mode: activeTab,
        xp_earned: amount,
        duration_seconds: durationSeconds
      });
    } catch (err) {
      console.warn("Notice: Failed to sync XP to database", err);
    }
  };

  // Sum total XP
  const totalXp = flashcardsXp + speedmatchXp + quizXp + spellingXp + aigraderXp;

  // Speech helper
  const handleSpeak = (text: string, forcePlay: boolean = false) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        if (!forcePlay) return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  const practiceModes = [
    {
      id: "flashcards" as const,
      title: "Smart Flashcards",
      description: "Interactive 3D card flips with audio, memory aids, and Anki-calibrated spaced repetition.",
      icon: Layers,
      color: "text-[#433075]",
      badge: "Spaced Repetition",
      difficulty: "All Levels",
      xp: flashcardsXp
    },
    {
      id: "speedmatch" as const,
      title: "Speed Match Blitz",
      description: "Race against the clock! Drag and match terms with their correct definitions to hit high-score combo multipliers.",
      icon: Zap,
      color: "text-amber-500",
      badge: "Time Attack",
      difficulty: "Intermediate",
      xp: speedmatchXp
    },
    {
      id: "quiz" as const,
      title: "AI Quiz Challenge",
      description: "Test your comprehension with custom multiple-choice questions and detailed feedback explanation panels.",
      icon: BrainCircuit,
      color: "text-indigo-600",
      badge: "Assessment",
      difficulty: "All Levels",
      xp: quizXp
    },
    {
      id: "spelling" as const,
      title: "Spelling and Dictation",
      description: "Listen to audio pronunciations and write down exact spelling. Improve phonetic transcription and orthography.",
      icon: SpellCheck,
      color: "text-emerald-600",
      badge: "Audio Mastery",
      difficulty: "Advanced",
      xp: spellingXp
    },
    {
      id: "aigrader" as const,
      title: "AI Sentence Evaluator",
      description: "Input a written sentence using your target words and get scored in real-time by a contextual grading AI engine.",
      icon: Sparkles,
      color: "text-fuchsia-600",
      badge: "AI Feedback",
      difficulty: "Expert",
      xp: aigraderXp
    }
  ];

  return (
    <div className="space-y-8 pb-12 animate-fadeIn w-full max-w-full overflow-x-hidden text-[#0D0D0D]">
      <AnimatePresence mode="wait">
        {activeTab === null ? (
          // ==========================================
          // HUB LANDING PAGE
          // ==========================================
          <motion.div
            key="hub"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6 sm:space-y-8"
          >
            {/* HERO BANNER */}
            <div className="relative p-5 sm:p-10 rounded-[1.75rem] sm:rounded-[2rem] bg-gradient-to-br from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4]/40 shadow-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 sm:gap-8">
              {/* Animated Glowing Mesh Background */}
              <div className="absolute top-0 right-0 w-[45rem] h-[45rem] bg-gradient-to-tr from-[#A58CF4]/10 to-transparent rounded-full blur-[100px] pointer-events-none -mr-32 -mt-32" />
              <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-gradient-to-tr from-pink-500/10 to-transparent rounded-full blur-[80px] pointer-events-none -ml-20 -mb-20" />
              
              <div className="relative z-10 w-full md:flex-1 space-y-3 sm:space-y-4 text-center md:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/40 text-[#FAFAFA] text-[11px] sm:text-xs font-black uppercase tracking-widest shadow-inner mx-auto md:mx-0">
                  <Target className="w-3.5 h-3.5 text-[#A58CF4]" />
                  <span>Interactive Training Ground</span>
                </div>
                <h1 className="text-2xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  Practice <span className="bg-clip-text bg-gradient-to-r from-[#A58CF4] to-pink-300 text-transparent">Arena</span>
                </h1>
                <p className="text-xs sm:text-base text-[#C8CED6] mt-1 font-medium max-w-xl mx-auto md:mx-0 leading-relaxed">
                  Select a module to reinforce memory pathways, check spellings, play match-blitz, or get intelligently evaluated by the WordNest AI engine.
                </p>
              </div>

              {/* Enhanced XP Badge */}
              <div className="relative z-10 flex shrink-0 items-center gap-4 sm:gap-5 bg-black/40 backdrop-blur-xl px-5 sm:px-6 py-4 sm:py-5 rounded-[1.5rem] sm:rounded-[2rem] border border-white/10 shadow-[0_0_40px_rgba(165,140,244,0.15)] w-full md:w-auto justify-center">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)] shrink-0">
                  <Trophy className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                </div>
                <div>
                  <div className="text-[10px] text-[#A58CF4] font-black uppercase tracking-widest opacity-90">Arena Mastery XP</div>
                  <div className="text-2xl sm:text-4xl font-black text-white">{totalXp}</div>
                </div>
              </div>
            </div>

            {/* SECTIONS GRID - Asymmetrical Masonry Layout style */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-6">
              {practiceModes.map((mode, index) => {
                const IconComponent = mode.icon;
                
                // Determine spanning logic for a creative layout
                // Flashcards (first) spans 3 cols, Speedmatch spans 3 cols
                // Quiz (2 cols), Spelling (2 cols), AI Grader (2 cols)
                const isLarge = index < 2;
                const colSpanClass = isLarge ? "lg:col-span-3" : "lg:col-span-2";

                return (
                  <motion.div
                    key={mode.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className={`flex ${colSpanClass}`}
                  >
                    <SpotlightCard
                      onClick={() => setActiveTab(mode.id)}
                      spotlightColor="rgba(165, 140, 244, 0.15)"
                      className="group cursor-pointer flex flex-col justify-between w-full h-full rounded-[2rem] bg-white border border-[#C8CED6]/60 overflow-hidden shadow-md hover:shadow-[0_15px_40px_rgba(0,0,0,0.1)] hover:border-[#A58CF4]/50 transition-all duration-500 relative"
                    >
                      {/* Oversized SVG Watermark */}
                      <IconComponent className="absolute -right-8 -bottom-8 w-48 h-48 text-[#F0EDF7] group-hover:text-[#A58CF4]/5 group-hover:rotate-12 group-hover:scale-110 transition-all duration-700 pointer-events-none" />

                      <div className="p-6 sm:p-8 w-full h-full flex flex-col justify-between relative z-10">
                        <div className="space-y-6">
                          {/* Top Row: Icon + Badge */}
                          <div className="flex items-start justify-between">
                            <div className={`p-3 rounded-[1.25rem] bg-[#F7F7F7] border border-[#C8CED6]/60 ${mode.color} group-hover:bg-[#433075] group-hover:text-white group-hover:border-transparent transition-colors duration-500 shadow-sm`}>
                              <IconComponent className="w-7 h-7 group-hover:scale-110 transition-transform duration-500" />
                            </div>
                            <span className="text-xs sm:text-sm bg-[#F7F7F7] border border-[#C8CED6]/40 text-[#433075] px-3.5 py-1.5 rounded-full font-black uppercase tracking-widest shadow-sm group-hover:bg-[#433075] group-hover:text-white group-hover:border-transparent transition-all duration-500">
                              {mode.badge}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div className="space-y-3">
                            <h3 className="text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[#0D0D0D] group-hover:text-[#433075] transition-colors duration-500">
                              {mode.title}
                            </h3>
                            <p className="text-sm sm:text-base text-[#736A86] leading-relaxed font-extrabold">
                              {mode.description}
                            </p>
                          </div>
                        </div>

                        {/* Bottom details & Button */}
                        <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#C8CED6]/40 transition-colors duration-500">
                          <div className="flex flex-col">
                            <span className="text-xs uppercase font-black text-[#A58CF4] tracking-widest mb-0.5">Total XP</span>
                            <span className="text-base sm:text-lg font-black text-[#0D0D0D] group-hover:text-[#433075] transition-colors">{mode.xp}</span>
                          </div>
                          <span className="text-xs sm:text-sm font-black text-[#433075] group-hover:text-[#A58CF4] uppercase tracking-wider flex items-center gap-1.5 transition-colors duration-500 bg-[#F7F7F7] group-hover:bg-indigo-50/50 px-4 py-2 rounded-xl">
                            <span>Start Module</span>
                            <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1.5 transition-transform duration-500" />
                          </span>
                        </div>
                      </div>
                    </SpotlightCard>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          // ==========================================
          // ACTIVE PRACTICE INTERFACE
          // ==========================================
          <motion.div
            key="active"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* STATIC PILL NAVIGATION BAR */}
            <div className="flex items-center justify-between p-2.5 sm:p-4 rounded-[2rem] bg-white/80 backdrop-blur-xl border border-[#C8CED6]/60 shadow-lg w-full relative gap-2">
              <button 
                onClick={() => {
                  if (practiceState === "playing") setPracticeState("setup");
                  else setActiveTab(null);
                }}
                className="flex items-center gap-1.5 px-3 sm:px-5 py-2 sm:py-3 rounded-full bg-[#F7F7F7] hover:bg-[#E2E8F0] text-[#433075] text-xs font-black transition-all cursor-pointer border border-[#C8CED6]/60 shadow-sm hover:shadow active:scale-95 group shrink-0 relative z-20"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                <span className="hidden sm:inline">{practiceState === "playing" ? "Back to Setup" : "Exit Arena"}</span>
              </button>
              
              <div className="flex items-center gap-1.5 truncate px-1 max-w-[50%] sm:max-w-none justify-center">
                {(() => {
                  const activeMode = practiceModes.find(m => m.id === activeTab);
                  const Icon = activeMode?.icon || Target;
                  return (
                    <>
                      <Icon className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 ${activeMode?.color || 'text-[#433075]'}`} />
                      <span className="text-xs sm:text-base font-black uppercase tracking-wider text-[#0D0D0D] truncate">
                        {activeMode?.title} {practiceState === "setup" && "SETUP"}
                      </span>
                    </>
                  );
                })()}
              </div>

              <div className="flex items-center gap-1.5 sm:gap-3 bg-gradient-to-r from-[#433075] to-[#272A3B] px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full border border-[#433075] shadow-inner text-white shrink-0 relative z-20">
                <Trophy className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />
                <span className="text-[10px] sm:text-xs font-bold whitespace-nowrap">
                  <span className="text-amber-400 font-black">
                    {activeTab === "flashcards" ? flashcardsXp : 
                     activeTab === "speedmatch" ? speedmatchXp : 
                     activeTab === "quiz" ? quizXp : 
                     activeTab === "spelling" ? spellingXp : 
                     aigraderXp}
                  </span> XP
                </span>
              </div>
            </div>

            {/* Active module content rendered inside focused centered pane */}
            <div className="w-full flex justify-center py-4">
              <div className="w-full max-w-5xl lg:max-w-6xl">
                {practiceState === "setup" ? (
                  <PracticeSetupModule 
                    userDecks={userDecks}
                    selectedDeckIds={selectedDeckIds}
                    setSelectedDeckIds={setSelectedDeckIds}
                    shuffleWords={shuffleWords}
                    setShuffleWords={setShuffleWords}
                    allWords={words}
                    activeTab={activeTab}
                    onStart={(wordsToPractice) => {
                      setPracticeWords(wordsToPractice);
                      setPracticeState("playing");
                    }}
                  />
                ) : practiceWords.length < 1 ? (
                  <div className="p-10 rounded-3xl bg-white border border-[#C8CED6] text-center space-y-4 shadow-sm">
                    <Layers className="w-12 h-12 text-[#736A86] mx-auto opacity-60" />
                    <h3 className="text-2xl font-black text-[#433075]">Not Enough Vocabulary</h3>
                    <p className="text-sm text-[#736A86]">Please select decks containing at least 1 flashcard or vocabulary word to start practicing!</p>
                  </div>
                ) : (
                  <>
                    {activeTab === "flashcards" && (
                      <SmartFlashcardsModule 
                        words={practiceWords} 
                        onSpeak={handleSpeak} 
                        onRewardXp={handleRewardXp} 
                        onRetryWrong={(wrongWords) => setPracticeWords(wrongWords)}
                        onExit={() => setPracticeState("setup")}
                      />
                    )}
                    {activeTab === "speedmatch" && (
                      <SpeedMatchModule 
                        words={practiceWords} 
                        onRewardXp={handleRewardXp} 
                        onRetryWrong={(wrongWords) => setPracticeWords(wrongWords)}
                        onExit={() => setPracticeState("setup")}
                        selectedDeckNames={selectedDeckNames}
                      />
                    )}
                    {activeTab === "quiz" && (
                      <QuizChallengeModule 
                        words={practiceWords} 
                        onRewardXp={handleRewardXp} 
                        onRetryWrong={(wrongWords) => setPracticeWords(wrongWords)}
                        onExit={() => setPracticeState("setup")}
                      />
                    )}
                    {activeTab === "spelling" && (
                      <SpellingDictationModule 
                        words={practiceWords} 
                        onSpeak={handleSpeak} 
                        onRewardXp={handleRewardXp} 
                        onRetryWrong={(wrongWords) => setPracticeWords(wrongWords)}
                        onExit={() => setPracticeState("setup")}
                      />
                    )}
                    {activeTab === "aigrader" && (
                      <AISentenceEvaluatorModule 
                        words={practiceWords} 
                        onRewardXp={handleRewardXp} 
                        onRetryWrong={(wrongWords) => setPracticeWords(wrongWords)}
                        onExit={() => setPracticeState("setup")}
                      />
                    )}
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ====================================================================
   0. PRACTICE SETUP MODULE
   ==================================================================== */
function PracticeSetupModule({ 
  userDecks, 
  selectedDeckIds, 
  setSelectedDeckIds, 
  shuffleWords, 
  setShuffleWords, 
  allWords, 
  activeTab, 
  onStart 
}: { 
  userDecks: {id: string, title: string}[]; 
  selectedDeckIds: string[]; 
  setSelectedDeckIds: React.Dispatch<React.SetStateAction<string[]>>; 
  shuffleWords: boolean; 
  setShuffleWords: React.Dispatch<React.SetStateAction<boolean>>; 
  allWords: WordItem[]; 
  activeTab: string;
  onStart: (words: WordItem[]) => void;
}) {
  
  // Calculate total words available per source
  const wordsPerSource = React.useMemo(() => {
    const counts: Record<string, number> = {};
    allWords.forEach(w => {
      if (w.sourceId) counts[w.sourceId] = (counts[w.sourceId] || 0) + 1;
    });
    return counts;
  }, [allWords]);

  const toggleDeck = (id: string) => {
    if (selectedDeckIds.includes(id)) {
      setSelectedDeckIds(prev => prev.filter(d => d !== id));
    } else {
      setSelectedDeckIds(prev => [...prev, id]);
    }
  };

  const handleStart = () => {
    let subset = allWords.filter(w => w.sourceId && selectedDeckIds.includes(w.sourceId));
    
    // If no decks are explicitly selected, we could either prevent starting or just select all. 
    // Let's require at least one deck.
    if (selectedDeckIds.length === 0) return;

    if (shuffleWords) {
      subset = [...subset].sort(() => Math.random() - 0.5);
    }

    onStart(subset);
  };

  const totalSelectedWords = allWords.filter(w => w.sourceId && selectedDeckIds.includes(w.sourceId)).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#C8CED6] shadow-sm space-y-8">
        
        <div className="space-y-2 text-center">
          <h2 className="text-2xl font-black text-[#433075]">PRACTICE SETUP</h2>
          <p className="text-sm text-[#736A86]">Select the decks you want to practice and configure your session.</p>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#433075]" /> Select Decks
          </h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {userDecks.map(deck => {
              const count = wordsPerSource[deck.id] || 0;
              const isSelected = selectedDeckIds.includes(deck.id);
              return (
                <button
                  key={deck.id}
                  onClick={() => toggleDeck(deck.id)}
                  disabled={count === 0}
                  className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#433075] bg-[#F7F7F7] shadow-sm' : count === 0 ? 'border-transparent bg-slate-50 opacity-50 cursor-not-allowed' : 'border-[#C8CED6] hover:border-[#433075]/50 bg-white'}`}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="font-bold text-sm text-[#0D0D0D] truncate pr-2">{deck.title}</span>
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${isSelected ? 'bg-[#433075] border-[#433075] text-white' : 'border-[#C8CED6] bg-white'}`}>
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
                  <span className="text-xs text-[#736A86] mt-1 font-medium">{count} terms</span>
                </button>
              );
            })}
            
            {/* Lexicon Vault Option */}
            {wordsPerSource["vault"] > 0 && (
              <button
                onClick={() => toggleDeck("vault")}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedDeckIds.includes("vault") ? 'border-[#433075] bg-[#F7F7F7] shadow-sm' : 'border-[#C8CED6] hover:border-[#433075]/50 bg-white'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-[#0D0D0D] truncate pr-2 flex items-center gap-2">
                    <Sparkles className="w-3 h-3 text-amber-500" /> Lexicon Vault
                  </span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${selectedDeckIds.includes("vault") ? 'bg-[#433075] border-[#433075] text-white' : 'border-[#C8CED6] bg-white'}`}>
                    {selectedDeckIds.includes("vault") && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs text-[#736A86] mt-1 font-medium">{wordsPerSource["vault"]} terms</span>
              </button>
            )}

            {/* Direct Flashcards Option (Orphans) */}
            {wordsPerSource["direct"] > 0 && (
              <button
                onClick={() => toggleDeck("direct")}
                className={`flex flex-col text-left p-4 rounded-2xl border-2 transition-all cursor-pointer ${selectedDeckIds.includes("direct") ? 'border-[#433075] bg-[#F7F7F7] shadow-sm' : 'border-[#C8CED6] hover:border-[#433075]/50 bg-white'}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="font-bold text-sm text-[#0D0D0D] truncate pr-2">General Terms</span>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border transition-colors ${selectedDeckIds.includes("direct") ? 'bg-[#433075] border-[#433075] text-white' : 'border-[#C8CED6] bg-white'}`}>
                    {selectedDeckIds.includes("direct") && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                </div>
                <span className="text-xs text-[#736A86] mt-1 font-medium">{wordsPerSource["direct"]} terms</span>
              </button>
            )}
          </div>
        </div>

        {activeTab !== "speedmatch" && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-[#0D0D0D] uppercase tracking-wider flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-[#433075]" /> Session Settings
            </h3>
            
            <div className="bg-[#F7F7F7] p-4 rounded-2xl border border-[#C8CED6] flex items-center justify-between">
              <div>
                <div className="font-bold text-sm text-[#0D0D0D]">Shuffle Words</div>
                <div className="text-xs text-[#736A86]">Randomize the order of practice items</div>
              </div>
              <button
                onClick={() => setShuffleWords(!shuffleWords)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${shuffleWords ? 'bg-[#433075]' : 'bg-[#C8CED6]'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${shuffleWords ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
        )}

        <button
          onClick={handleStart}
          disabled={selectedDeckIds.length === 0 || totalSelectedWords === 0}
          className="w-full flex items-center justify-center gap-2 bg-[#433075] hover:bg-[#34255C] disabled:bg-[#736A86] text-white p-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {selectedDeckIds.length === 0 ? "Select a deck to start" : `Let's Practice (${totalSelectedWords} words)`}
          <ArrowRight className="w-4 h-4" />
        </button>

      </div>
    </motion.div>
  );
}

/* ====================================================================
   0.5 SESSION SUMMARY MODULE
   ==================================================================== */
export function SessionSummaryView({
  totalWords,
  correctCount,
  wrongWords,
  xpEarned,
  onRetryWrong,
  onExit,
  mode = "standard"
}: {
  totalWords: number;
  correctCount: number;
  wrongWords: WordItem[];
  xpEarned: number;
  onRetryWrong: (words: WordItem[]) => void;
  onExit: () => void;
  mode?: "standard" | "speedmatch";
}) {
  const isPerfect = mode === "speedmatch" ? false : wrongWords.length === 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="max-w-2xl mx-auto"
    >
      <div className="bg-white p-8 sm:p-10 rounded-[2rem] border-2 border-[#C8CED6] shadow-xl text-center space-y-8 relative overflow-hidden">
        {/* Background Decorative Flare */}
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-400/20 blur-3xl rounded-full pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#433075]/10 blur-3xl rounded-full pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg mb-4">
            <Trophy className="w-12 h-12 text-white" />
          </div>
          
          <h2 className="text-4xl font-black text-[#0D0D0D] uppercase tracking-tight">
            {mode === "speedmatch" 
              ? "Blitz Complete!" 
              : isPerfect 
                ? "Perfect Session!" 
                : "Session Complete"}
          </h2>
          <p className="text-[#736A86] text-sm">
            {mode === "speedmatch" 
              ? `You made ${correctCount} matches before time ran out.`
              : `You've completed all ${totalWords} words in this set.`}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 relative z-10">
          <div className="bg-[#F7F7F7] p-6 rounded-3xl border border-[#C8CED6]">
            <div className={`text-3xl font-black mb-1 ${mode === "speedmatch" ? "text-blue-600" : "text-emerald-600"}`}>{correctCount}</div>
            <div className="text-xs font-bold text-[#736A86] uppercase tracking-wider">{mode === "speedmatch" ? "Matches Made" : "Known Words"}</div>
          </div>
          <div className="bg-[#F7F7F7] p-6 rounded-3xl border border-[#C8CED6]">
            <div className="text-3xl font-black text-amber-500 mb-1">+{xpEarned}</div>
            <div className="text-xs font-bold text-[#736A86] uppercase tracking-wider">XP Earned</div>
          </div>
        </div>

        <div className="space-y-3 relative z-10 pt-4">
          {mode === "standard" && !isPerfect && (
            <button
              onClick={() => onRetryWrong(wrongWords)}
              className="w-full flex items-center justify-center gap-2 bg-[#433075] hover:bg-[#34255C] text-white p-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-colors shadow-md"
            >
              <RotateCcw className="w-4 h-4" />
              Practice {wrongWords.length} Wrong Words
            </button>
          )}
          
          <button
            onClick={onExit}
            className={`w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-black text-sm uppercase tracking-wider transition-colors ${
              mode === "standard" && isPerfect 
                ? "bg-[#433075] hover:bg-[#34255C] text-white shadow-md" 
                : "bg-white border-2 border-[#C8CED6] text-[#433075] hover:bg-[#F7F7F7]"
            }`}
          >
            {mode === "standard" && isPerfect ? "Back to Setup" : "Finish & Exit"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ====================================================================
   1. SMART FLASHCARDS MODULE (3D Flip & Anki SRS Buttons)
   ==================================================================== */
function SmartFlashcardsModule({ 
  words, 
  onSpeak, 
  onRewardXp,
  onRetryWrong,
  onExit
}: { 
  words: WordItem[]; 
  onSpeak: (word: string, forcePlay?: boolean) => void; 
  onRewardXp: (amount: number, durationSeconds?: number) => void;
  onRetryWrong: (words: WordItem[]) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stillLearningCount, setStillLearningCount] = useState(words.length);
  const [knowCount, setKnowCount] = useState(0);
  const [knownCardIds, setKnownCardIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<{ index: number; knownCount: number; stillLearningCount: number; knownCardIds: Set<string>; wasFlipped: boolean }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [trackProgress, setTrackProgress] = useState(true);
  const [isAutoFlipping, setIsAutoFlipping] = useState(false);

  // Reset state if words prop changes (e.g. when retrying wrong words)
  useEffect(() => {
    setIndex(0);
    setIsFlipped(false);
    setStillLearningCount(words.length);
    setKnowCount(0);
    setKnownCardIds(new Set());
    setHistory([]);
    setIsComplete(false);
    setXpEarned(0);
    setIsAutoFlipping(false);
  }, [words]);

  const currentCard = words[index];

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [index]);

  if (isComplete) {
    const wrongWords = words.filter(w => !knownCardIds.has(w.id));
    return (
      <SessionSummaryView 
        totalWords={words.length}
        correctCount={knownCardIds.size}
        wrongWords={wrongWords}
        xpEarned={xpEarned}
        onRetryWrong={onRetryWrong}
        onExit={onExit}
      />
    );
  }
  const handleRating = (quality: "again" | "easy") => {
    if (!currentCard || isAutoFlipping) return;

    // 1. Record history for undoing
    setHistory(prev => [
      ...prev,
      {
        index,
        knownCount: knowCount,
        stillLearningCount,
        knownCardIds: new Set(knownCardIds),
        wasFlipped: isFlipped
      }
    ]);

    // 2. Process rating logic
    const cardId = currentCard.id;
    let nextKnowCount = knowCount;
    let nextStillLearningCount = stillLearningCount;
    const nextKnownCardIds = new Set(knownCardIds);
    let earned = 0;

    if (quality === "easy") {
      if (!knownCardIds.has(cardId)) {
        nextKnownCardIds.add(cardId);
        nextKnowCount += 1;
        if (nextStillLearningCount > 0) {
          nextStillLearningCount -= 1;
        }
      }
      earned = 15;
    } else {
      if (knownCardIds.has(cardId)) {
        nextKnownCardIds.delete(cardId);
        if (nextKnowCount > 0) {
          nextKnowCount -= 1;
        }
        nextStillLearningCount += 1;
      }
      earned = 5;
    }

    onRewardXp(earned);
    setXpEarned(prev => prev + earned);
    setKnowCount(nextKnowCount);
    setStillLearningCount(nextStillLearningCount);
    setKnownCardIds(nextKnownCardIds);

    // 3. Move to next card or complete
    const proceedToNext = () => {
      setIsFlipped(false);
      setTimeout(() => {
        setIsAutoFlipping(false);
        if (index + 1 >= words.length) {
          setIsComplete(true);
        } else {
          setIndex(prev => prev + 1);
        }
      }, 400);
    };

    if (!isFlipped) {
      setIsAutoFlipping(true);
      setIsFlipped(true);
      onSpeak(currentCard.word);
      setTimeout(() => {
        proceedToNext();
      }, 1500); // creative delay to let user see and hear the word
    } else {
      proceedToNext();
    }
  };

  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    setIndex(lastState.index);
    setKnowCount(lastState.knownCount);
    setStillLearningCount(lastState.stillLearningCount);
    setKnownCardIds(lastState.knownCardIds);
    setIsFlipped(lastState.wasFlipped);
  };

  const handleRestart = () => {
    setIndex(0);
    setIsFlipped(false);
    setStillLearningCount(words.length);
    setKnowCount(0);
    setKnownCardIds(new Set());
    setHistory([]);
  };

  if (!currentCard) {
    return (
      <div className="p-8 rounded-3xl bg-[#1E2235] text-white text-center">
        No words found in this deck. Add some words first!
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {/* 1. COUNTER BAR */}
      <div className="flex items-center justify-between px-2">
        <div className="flex items-center gap-2.5">
          <span className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-orange-500 text-orange-500 font-black text-xs bg-orange-500/10">
            {stillLearningCount}
          </span>
          <span className="text-xs font-black text-[#A58CF4] uppercase tracking-wider">Still learning</span>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-black text-[#A58CF4] uppercase tracking-wider">Know</span>
          <span className="w-7 h-7 flex items-center justify-center rounded-full border-2 border-emerald-500 text-emerald-500 font-black text-xs bg-emerald-500/10">
            {knowCount}
          </span>
        </div>
      </div>

      {/* 2. THE CARD GRID */}
      <div
        onClick={() => {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          setIsFlipped(!isFlipped);
        }}
        className={`w-full h-[380px] xs:h-[420px] sm:h-[460px] md:h-[480px] cursor-pointer perspective-1000 select-none relative ${isFlipped ? "flipped" : ""}`}
      >
        <div className="relative w-full h-full flip-card-inner">
          {/* FRONT (Split-screen or stacked image & definition) */}
          <div className="flip-card-front rounded-3xl">
            <BorderGlow
              edgeSensitivity={10}
              glowColor="268 100 76"
              backgroundColor="#0F0F14"
              borderRadius={24}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={35}
              animated={true}
              colors={['#c084fc', '#f472b6', '#38bdf8']}
              className="w-full h-full border-2 border-[#A58CF4]/30 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full flex flex-col md:flex-row items-center justify-between overflow-hidden relative">
                {/* Speaker icon at top left */}
                <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak(currentCard.definition || currentCard.meaning || "");
                    }}
                    className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-[#FAFAFA] transition-all backdrop-blur-sm"
                    title="Pronounce Definition"
                  >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Definition Column (Full width on mobile, 50% on desktop) */}
                <div className={`w-full ${currentCard.image ? "h-1/2 md:h-full md:w-1/2" : "h-full"} p-5 sm:p-8 flex items-center justify-center text-center relative z-10 pt-12 md:pt-8`}>
                  <p className="text-sm sm:text-xl md:text-2xl font-bold text-[#FAFAFA] leading-relaxed tracking-wide max-w-full break-words">
                    {currentCard.definition || currentCard.meaning}
                  </p>
                </div>

                {/* Image Column (Bottom half on mobile, right half on desktop) */}
                {currentCard.image && (
                  <div className="w-full md:w-1/2 h-1/2 md:h-full relative overflow-hidden flex items-center justify-center shrink-0">
                    <img 
                      src={currentCard.image} 
                      alt="Visual Clue" 
                      className="w-full h-full object-cover rounded-b-[24px] md:rounded-b-none md:rounded-r-[24px]"
                    />
                    {/* Middle Blend Gradient - Desktop (Left Edge Fade) */}
                    <div className="hidden md:block absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-[#0F0F14] via-[#0F0F14]/70 to-transparent pointer-events-none z-10" />
                    {/* Middle Blend Gradient - Mobile (Top Edge Fade) */}
                    <div className="block md:hidden absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-[#0F0F14] via-[#0F0F14]/70 to-transparent pointer-events-none z-10" />
                  </div>
                )}
              </div>
            </BorderGlow>
          </div>

          {/* BACK (Centered vocabulary word) */}
          <div className="flip-card-back rounded-3xl">
            <BorderGlow
              edgeSensitivity={10}
              glowColor="268 100 76"
              backgroundColor="#0F0F14"
              borderRadius={24}
              glowRadius={40}
              glowIntensity={1}
              coneSpread={35}
              animated={true}
              colors={['#c084fc', '#f472b6', '#38bdf8']}
              className="w-full h-full border-2 border-[#A58CF4]/30 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="w-full h-full p-5 sm:p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
                {/* Top row with pronunciation of the Word */}
                <div className="flex justify-end w-full z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak(currentCard.word);
                    }}
                    className="p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-[#FAFAFA] transition-all backdrop-blur-sm"
                    title="Pronounce Word"
                  >
                    <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>

                {/* Large centered Word */}
                <div className="my-auto space-y-2 sm:space-y-3 px-2">
                  <span className="text-[9px] sm:text-[10px] text-[#A58CF4] font-black uppercase tracking-widest block">
                    The Vocabulary Word
                  </span>
                  <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-[#FAFAFA] tracking-tight uppercase select-text break-words">
                    {currentCard.word}
                  </h2>
                  {currentCard.phonetic && (
                    <p className="text-xs sm:text-sm font-semibold text-[#A58CF4] italic">{currentCard.phonetic}</p>
                  )}
                </div>

                <div className="text-[9px] text-[#A58CF4]/50 uppercase tracking-widest font-black mb-1">
                  Spaced Repetition mode
                </div>
              </div>
            </BorderGlow>
          </div>
        </div>
      </div>

      {/* 3. CONTROLS BELOW THE CARD */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 sm:pt-4 px-2">
        {/* Track progress toggle */}
        <div className="flex items-center justify-between sm:justify-start w-full sm:w-auto gap-3">
          <span className="text-[11px] sm:text-xs font-black text-[#A58CF4] uppercase tracking-wider">Track progress</span>
          <button
            onClick={() => setTrackProgress(!trackProgress)}
            className={`w-11 h-6 rounded-full p-1 transition-all duration-300 ${trackProgress ? "bg-indigo-600" : "bg-[#282E47]"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${trackProgress ? "translate-x-5" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Action Buttons Row */}
        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-3 sm:gap-6">
          {/* Center: Rating buttons */}
          <div className="flex items-center gap-3 sm:gap-5">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRating("again");
              }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1E2235] border-2 border-rose-500/40 hover:border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer shrink-0"
              title="Still learning"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleRating("easy");
              }}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#1E2235] border-2 border-emerald-500/40 hover:border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer shrink-0"
              title="Know"
            >
              <Check className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Right: Undo / Restart buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleUndo}
              disabled={history.length === 0}
              className="p-2.5 sm:p-3 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-[#A58CF4] hover:text-white border border-[#A58CF4]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
              title="Undo"
            >
              <Undo2 className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handleRestart}
              className="p-2.5 sm:p-3 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-[#A58CF4] hover:text-white border border-[#A58CF4]/10 transition-all cursor-pointer"
              title="Restart Deck"
            >
              <RotateCcw className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ====================================================================
   2. SPEED MATCH BLITZ MODULE (Interactive Grid Matching)
   ==================================================================== */
function SpeedMatchModule({ 
  words, 
  onRewardXp,
  onRetryWrong,
  onExit,
  selectedDeckNames
}: { 
  words: WordItem[]; 
  onRewardXp: (amount: number, durationSeconds?: number) => void;
  onRetryWrong: (words: WordItem[]) => void;
  onExit: () => void;
  selectedDeckNames: string[];
}) {
  const initialTime = Math.min(words.length, 6) * 4;
  const [cards, setCards] = useState<{ id: string; content: string; matchId: string; type: "word" | "meaning" }[]>([]);
  const [selectedFirst, setSelectedFirst] = useState<{ id: string; matchId: string } | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);

  // Reset state if words prop changes (e.g. when retrying wrong words)
  useEffect(() => {
    setCards([]);
    setSelectedFirst(null);
    setMatchedIds([]);
    setScore(0);
    setTimeLeft(initialTime);
    setIsPlaying(false);
    setIsComplete(false);
    setXpEarned(0);
  }, [words, initialTime]);


  const startGame = () => {
    const selected = words.slice(0, 6);
    const grid: { id: string; content: string; matchId: string; type: "word" | "meaning" }[] = [];
    
    selected.forEach(w => {
      grid.push({ id: `w_${w.id}`, content: w.word, matchId: w.id, type: "word" });
      grid.push({ id: `m_${w.id}`, content: w.definition, matchId: w.id, type: "meaning" });
    });

    // Shuffle grid
    grid.sort(() => Math.random() - 0.5);

    setCards(grid);
    setMatchedIds([]);
    setSelectedFirst(null);
    setScore(0);
    setTimeLeft(initialTime);
    setIsPlaying(true);
    setIsComplete(false);
    setXpEarned(0);
  };

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft]);

  useEffect(() => {
    if (isPlaying && timeLeft === 0) {
      setIsPlaying(false);
      const earned = score * 10;
      onRewardXp(earned);
      setXpEarned(earned);
      setIsComplete(true);
    }
  }, [isPlaying, timeLeft, score, onRewardXp]);

  const handleTileClick = (card: { id: string; matchId: string }) => {
    if (!isPlaying || matchedIds.includes(card.id)) return;

    if (!selectedFirst) {
      setSelectedFirst(card);
    } else {
      if (selectedFirst.id !== card.id && selectedFirst.matchId === card.matchId) {
        // MATCH!
        playFeedbackSound(true);
        setMatchedIds(prev => [...prev, selectedFirst.id, card.id]);
        setScore(prev => prev + 1);
        setSelectedFirst(null);

        if (matchedIds.length + 2 >= cards.length) {
          setIsPlaying(false);
          const earned = (score + 1) * 15 + 50;
          onRewardXp(earned);
          setXpEarned(earned);
          setIsComplete(true);
        }
      } else {
        // MISMATCH
        playFeedbackSound(false);
        setSelectedFirst(null);
      }
    }
  };

  if (isComplete) {
    return (
      <SessionSummaryView 
        totalWords={words.slice(0, 6).length}
        correctCount={score}
        wrongWords={[]} // SpeedMatch doesn't track specific wrong words for retry
        xpEarned={xpEarned}
        onRetryWrong={onRetryWrong}
        onExit={onExit}
        mode="speedmatch"
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
      {cards.length > 0 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#C8CED6]">
          <div className="flex items-center gap-2 text-xs font-black text-[#433075]">
            <Timer className="w-4 h-4 text-amber-500" />
            <span>Time Remaining: <strong className="text-base">{timeLeft}s</strong></span>
          </div>
          <div className="text-xs font-black text-emerald-600">
            Matches: {score} / {words.slice(0, 6).length}
          </div>
          {!isPlaying ? (
            <button
              onClick={startGame}
              className="px-5 py-2.5 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs transition-all cursor-pointer active:scale-95 shadow-md"
            >
              {timeLeft === 0 ? "Restart Blitz" : "Start Speed Blitz"}
            </button>
          ) : (
            <span className="text-xs font-bold text-[#736A86] animate-pulse">Game in progress...</span>
          )}
        </div>
      )}

      {cards.length === 0 ? (
        <div className="bg-white p-8 sm:p-10 rounded-[2rem] border-2 border-dashed border-[#C8CED6] text-center space-y-8 max-w-lg mx-auto relative overflow-hidden shadow-sm transform-gpu">
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-400/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-[#433075]/5 rounded-full pointer-events-none" />

          <div className="relative z-10">
            <Zap className="w-14 h-14 text-amber-500 mx-auto mb-4 drop-shadow-md" />
            <h3 className="text-3xl font-black text-[#0D0D0D] tracking-tight mb-2">Ready to Test Your Speed?</h3>
            <p className="text-sm text-[#736A86]">
              Match words to their correct definitions as fast as you can before the timer runs out.
            </p>
          </div>

          <div className="bg-[#F7F7F7] p-6 rounded-3xl border border-[#C8CED6] text-left space-y-4 relative z-10 shadow-inner">
            <div className="flex justify-between items-center border-b border-[#C8CED6]/50 pb-3">
              <span className="text-xs font-bold text-[#736A86] uppercase tracking-wider">Selected Decks</span>
              <span className="text-sm font-black text-[#433075] text-right truncate max-w-[180px]">{selectedDeckNames.length > 0 ? selectedDeckNames.join(", ") : "None"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#C8CED6]/50 pb-3">
              <span className="text-xs font-bold text-[#736A86] uppercase tracking-wider">Total Time Allotted</span>
              <span className="text-sm font-black text-[#433075]">{initialTime}s</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#736A86] uppercase tracking-wider">Number of Words</span>
              <span className="text-sm font-black text-[#433075]">{Math.min(words.length, 6)}</span>
            </div>
          </div>

          <button
            onClick={startGame}
            className="w-full py-4 rounded-2xl bg-[#433075] text-white font-black text-sm uppercase tracking-wider hover:bg-[#34255C] transition-all cursor-pointer shadow-lg relative z-10"
          >
            Begin Speed Blitz
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {cards.map(card => {
            const isMatched = matchedIds.includes(card.id);
            const isSelected = selectedFirst?.id === card.id;

            return (
              <motion.button
                key={card.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleTileClick(card)}
                disabled={isMatched || !isPlaying}
                className={`p-4 rounded-2xl text-center border-2 transition-all transform-gpu will-change-transform min-h-[100px] flex flex-col items-center justify-center cursor-pointer ${
                  isMatched
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 opacity-40 cursor-not-allowed"
                    : isSelected
                    ? "bg-[#433075] text-white border-[#A58CF4] shadow-lg scale-105"
                    : "bg-white hover:bg-[#F7F7F7] border-[#C8CED6] text-[#0D0D0D]"
                }`}
              >
                <div className={`font-black text-xs uppercase tracking-tight text-center ${card.type === "word" ? "text-base font-black" : "text-[11px] font-medium leading-tight"}`}>
                  {card.content}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

/* ====================================================================
   3. AI QUIZ CHALLENGE MODULE (Multiple Choice Arena)
   ==================================================================== */
function QuizChallengeModule({ 
  words, 
  onRewardXp,
  onRetryWrong,
  onExit
}: { 
  words: WordItem[]; 
  onRewardXp: (amount: number) => void;
  onRetryWrong: (words: WordItem[]) => void;
  onExit: () => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [aiExample, setAiExample] = useState<string | null>(null);
  const [isGeneratingExample, setIsGeneratingExample] = useState(false);
  
  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [wrongWordsIds, setWrongWordsIds] = useState<Set<string>>(new Set());

  // Reset state if words prop changes (e.g. when retrying wrong words)
  useEffect(() => {
    setCurrentStep(0);
    setSelectedAnswer(null);
    setScore(0);
    setShowExplanation(false);
    setAiExample(null);
    setIsGeneratingExample(false);
    setIsComplete(false);
    setXpEarned(0);
    setWrongWordsIds(new Set());
  }, [words]);

  const currentWord = words[currentStep] || words[0];

  // Pre-fetch AI example as soon as question reveals
  useEffect(() => {
    setAiExample(null);
    if (!currentWord) return;

    if (!currentWord.example || currentWord.example.includes("essential for mastery")) {
      setIsGeneratingExample(true);
      let isMounted = true;

      fetch(`${API_BASE_URL}/api/ai/example`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: currentWord.word })
      })
        .then(res => res.json())
        .then(data => {
          if (isMounted && data.status === "success" && data.example) {
            setAiExample(data.example);
          }
        })
        .catch(err => {
          console.warn("Failed to pre-fetch AI example:", err);
        })
        .finally(() => {
          if (isMounted) setIsGeneratingExample(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setIsGeneratingExample(false);
    }
  }, [currentWord]);

  // Generate 4 choices (memoized per word to avoid reshuffling during re-renders)
  const choices = React.useMemo(() => {
    if (!currentWord) return [];
    const wrong = words.filter(w => w.id !== currentWord.id).map(w => w.definition);
    const shuffledWrong = wrong.sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...shuffledWrong, currentWord.definition];
    return allOptions.sort(() => Math.random() - 0.5);
  }, [currentWord?.id, words]);

  if (isComplete) {
    const wrongWords = words.filter(w => wrongWordsIds.has(w.id));
    return (
      <SessionSummaryView 
        totalWords={words.length}
        correctCount={score}
        wrongWords={wrongWords}
        xpEarned={xpEarned}
        onRetryWrong={onRetryWrong}
        onExit={onExit}
      />
    );
  }

  const handleSelect = (choice: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
    setShowExplanation(true);
    
    if (choice === currentWord.definition) {
      playFeedbackSound(true);
      setScore(prev => prev + 1);
      onRewardXp(20);
      setXpEarned(prev => prev + 20);
    } else {
      playFeedbackSound(false);
      setWrongWordsIds(prev => new Set(prev).add(currentWord.id));
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setAiExample(null);
    setIsGeneratingExample(false);
    
    if (currentStep + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-3xl mx-auto"
    >
      <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-[#C8CED6]">
        <div className="text-xs font-bold text-[#736A86]">
          Question <span className="text-[#433075] font-black">{currentStep + 1}</span> of {words.length}
        </div>
        <div className="text-xs font-black text-emerald-600">
          Score: {score} Correct
        </div>
      </div>

      <div className="bg-white p-8 rounded-3xl border-2 border-[#C8CED6] shadow-md space-y-6">
        <div className="space-y-2 text-center">
          <span className="text-[10px] bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] px-3 py-1 rounded-full font-black uppercase">
            Vocabulary Comprehension
          </span>
          <h2 className="text-3xl font-black text-[#0D0D0D] uppercase tracking-tight">
            What is the meaning of "<span className="text-[#433075]">{currentWord.word}</span>"?
          </h2>
        </div>

        <div className="space-y-3">
          {choices.map((option, idx) => {
            const isCorrect = option === currentWord.definition;
            const isChosen = selectedAnswer === option;

            let btnStyle = "bg-[#F7F7F7] hover:bg-[#DFE3E8] border-[#C8CED6] text-[#0D0D0D]";
            if (selectedAnswer !== null) {
              if (isCorrect) btnStyle = "bg-emerald-500 text-white border-emerald-600 shadow-md";
              else if (isChosen) btnStyle = "bg-rose-500 text-white border-rose-600";
              else btnStyle = "bg-[#F7F7F7] opacity-50 border-[#C8CED6]";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(option)}
                disabled={selectedAnswer !== null}
                className={`w-full p-4 rounded-2xl text-left font-bold text-xs border-2 transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
              >
                <span>{option}</span>
                {selectedAnswer !== null && (
                  isCorrect ? <Check className="w-5 h-5" /> : isChosen ? <X className="w-5 h-5" /> : null
                )}
              </button>
            );
          })}
        </div>

        {showExplanation && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="p-4 rounded-2xl bg-[#433075]/10 border border-[#433075]/30 space-y-2 text-xs"
          >
            <div className="font-black text-[#433075] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[#A58CF4]" />
              <span>Contextual Usage Example</span>
            </div>
            
            {isGeneratingExample ? (
              <div className="flex items-center gap-2 text-[#736A86] italic py-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#433075]" /> 
                <span>AI is generating a contextual example...</span>
              </div>
            ) : (
              <p className="text-[#736A86] italic">"{aiExample || currentWord.example}"</p>
            )}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-[#433075] text-white font-black text-xs hover:bg-[#A58CF4] transition-all cursor-pointer"
              >
                {currentStep + 1 >= words.length ? "Finish Quiz" : "Next Question \u2192"}
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/* ====================================================================
   4. SPELLING & DICTATION MODULE (Audio Pronunciation & Input)
   ==================================================================== */
function SpellingDictationModule({ 
  words, 
  onSpeak, 
  onRewardXp,
  onRetryWrong,
  onExit
}: { 
  words: WordItem[]; 
  onSpeak: (word: string, forcePlay?: boolean) => void; 
  onRewardXp: (amount: number, durationSeconds?: number) => void;
  onRetryWrong: (words: WordItem[]) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);

  // Auto-read word when index changes
  useEffect(() => {
    if (words.length > 0 && words[index]) {
      // Small timeout to ensure browser is ready and user interaction context is preserved
      setTimeout(() => {
        onSpeak(words[index].word, true);
      }, 300);
    }
  }, [index, words]);

  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [wrongWordsIds, setWrongWordsIds] = useState<Set<string>>(new Set());
  const [hasGuessedWrong, setHasGuessedWrong] = useState(false);

  // Reset state if words prop changes (e.g. when retrying wrong words)
  useEffect(() => {
    setIndex(0);
    setInputVal("");
    setStatus("idle");
    setShowHint(false);
    setIsComplete(false);
    setXpEarned(0);
    setWrongWordsIds(new Set());
    setHasGuessedWrong(false);
  }, [words]);

  const currentWord = words[index] || words[0];

  if (isComplete) {
    const wrongWords = words.filter(w => wrongWordsIds.has(w.id));
    return (
      <SessionSummaryView 
        totalWords={words.length}
        correctCount={words.length - wrongWordsIds.size}
        wrongWords={wrongWords}
        xpEarned={xpEarned}
        onRetryWrong={onRetryWrong}
        onExit={onExit}
      />
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || status !== "idle") return;

    if (inputVal.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      playFeedbackSound(true);
      setStatus("correct");
      onRewardXp(25);
      setXpEarned(prev => prev + 25);
      (window as any).wordnestNotify?.("Dictation Completed", `Perfect spelling verification for "${currentWord.word}". +25 XP`, "success");
    } else {
      playFeedbackSound(false);
      setStatus("wrong");
      setHasGuessedWrong(true);
      setWrongWordsIds(prev => new Set(prev).add(currentWord.id));
      (window as any).wordnestNotify?.("Dictation Failed", `Incorrect spelling.`, "warning");
    }
  };

  const handleNext = () => {
    setInputVal("");
    setStatus("idle");
    setShowHint(false);
    setHasGuessedWrong(false);
    
    if (index + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setIndex(prev => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-xl mx-auto"
    >
      <div className="bg-white p-8 rounded-3xl border-2 border-[#C8CED6] shadow-md space-y-6 text-center">
        <div className="space-y-2">
          <span className="text-[10px] bg-[#433075] text-white px-3 py-1 rounded-full font-black uppercase">
            Dictation Mastery Mode
          </span>
          <h2 className="text-xl font-black text-[#0D0D0D]">Listen and Type the Correct Spelling</h2>
          <div className="text-xs font-bold text-[#736A86]">
            Word <span className="text-[#433075] font-black">{index + 1}</span> of {words.length}
          </div>
        </div>

        {/* Audio Button */}
        <button
          onClick={() => onSpeak(currentWord.word)}
          className="p-6 rounded-full bg-[#433075] hover:bg-[#A58CF4] text-white transition-all transform hover:scale-110 shadow-lg mx-auto flex items-center justify-center cursor-pointer"
        >
          <Volume2 className="w-8 h-8 animate-pulse" />
        </button>
        <p className="text-xs text-[#736A86] font-bold">Click audio button to pronounce term</p>

        {/* Hint toggle */}
        {showHint && (
          <div className="p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] text-xs font-semibold text-[#736A86] space-y-1">
            <div>Phonetic: {currentWord.phonetic?.replace(new RegExp(currentWord.word, 'gi'), "_".repeat(currentWord.word.length))}</div>
            <div>Definition: "{currentWord.definition?.replace(new RegExp(currentWord.word, 'gi'), "_".repeat(currentWord.word.length))}"</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type spelling here..."
            disabled={status !== "idle"}
            className="w-full p-4 rounded-2xl bg-[#F7F7F7] border-2 border-[#C8CED6] focus:border-[#433075] outline-none text-center font-black text-lg text-[#0D0D0D] disabled:opacity-70 disabled:bg-gray-100"
          />

          {status === "idle" && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowHint(!showHint)}
                className="flex-1 py-3 rounded-xl border border-[#C8CED6] hover:bg-[#F7F7F7] font-black text-xs text-[#736A86] cursor-pointer"
              >
                {showHint ? "Hide Hint" : "Show Hint"}
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-[#433075] text-white font-black text-xs hover:bg-[#A58CF4] cursor-pointer shadow-md"
              >
                Verify Spelling
              </button>
            </div>
          )}
        </form>

        {status === "correct" && (
          <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-3">
            <div className="font-black text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Perfect! "{currentWord.word}" is spelled correctly.</span>
            </div>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-emerald-600 text-white font-black text-xs rounded-xl hover:bg-emerald-700 transition-all cursor-pointer"
            >
              {index + 1 >= words.length ? "Finish Dictation" : "Next Dictation Term \u2192"}
            </button>
          </div>
        )}

        {status === "wrong" && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
            <div className="font-black text-sm flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5 text-rose-600" />
              <span>Incorrect! The correct spelling is "{currentWord.word}".</span>
            </div>
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-rose-600 text-white font-black text-xs rounded-xl hover:bg-rose-700 transition-all cursor-pointer w-full"
            >
              {index + 1 >= words.length ? "Finish Dictation" : "Next Dictation Term \u2192"}
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ====================================================================
   5. AI SENTENCE EVALUATOR MODULE (Groq AI Context Grading)
   ==================================================================== */
function AISentenceEvaluatorModule({ 
  words, 
  onRewardXp,
  onRetryWrong,
  onExit
}: { 
  words: WordItem[]; 
  onRewardXp: (amount: number) => void;
  onRetryWrong: (words: WordItem[]) => void;
  onExit: () => void;
}) {
  const [index, setIndex] = useState(0);
  const [userSentence, setUserSentence] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

  const [isComplete, setIsComplete] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [wrongWordsIds, setWrongWordsIds] = useState<Set<string>>(new Set());

  // Reset state if words prop changes (e.g. when retrying wrong words)
  useEffect(() => {
    setIndex(0);
    setUserSentence("");
    setEvaluationResult(null);
    setIsComplete(false);
    setXpEarned(0);
    setWrongWordsIds(new Set());
  }, [words]);

  const selectedWord = words[index] || words[0];

  if (isComplete) {
    const wrongWords = words.filter(w => wrongWordsIds.has(w.id));
    return (
      <SessionSummaryView 
        totalWords={words.length}
        correctCount={words.length - wrongWordsIds.size}
        wrongWords={wrongWords}
        xpEarned={xpEarned}
        onRetryWrong={onRetryWrong}
        onExit={onExit}
      />
    );
  }

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userSentence.trim() || isEvaluating) return;

    setIsEvaluating(true);
    setEvaluationResult(null);

    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/grade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          term: selectedWord.word,
          expected_definition: selectedWord.definition,
          user_response: userSentence.trim(),
          user_context: getStoredUserContext()
        })
      });
      const result = await res.json();
      if (result.status === "success" && result.data) {
        setEvaluationResult(result.data);
        if (result.data.score >= 70) {
          playFeedbackSound(true);
          onRewardXp(30);
          setXpEarned(prev => prev + 30);
          (window as any).wordnestNotify?.("AI Evaluation Passed", `Sentence using "${selectedWord.word}" scored ${result.data.score}/100. +30 XP`, "success");
        } else {
          playFeedbackSound(false);
          setWrongWordsIds(prev => new Set(prev).add(selectedWord.id));
          (window as any).wordnestNotify?.("AI Evaluation Failed", `Sentence using "${selectedWord.word}" scored ${result.data.score}/100. Try again!`, "warning");
        }
      }
    } catch (err) {
      console.warn("AI grading notice (fallback local assessment):", err);
      // Local fallback evaluation if backend fails
      const hasWord = userSentence.toLowerCase().includes(selectedWord.word.toLowerCase());
      const fallbackScore = hasWord ? 85 : 40;
      const userCtx = getStoredUserContext();
      const studentName = userCtx?.username || "Scholar";
      setEvaluationResult({
        score: fallbackScore,
        feedback: hasWord
          ? `You tried well ${studentName}! But there are some small changes needed.`
          : `Ensure you include the exact term "${selectedWord.word}" in your written sentence.`,
        corrected_sentence: userSentence.trim()
      });
      if (fallbackScore >= 70) {
        playFeedbackSound(true);
        onRewardXp(30);
        setXpEarned(prev => prev + 30);
        (window as any).wordnestNotify?.("Evaluation Passed (Local)", `Sentence using "${selectedWord.word}" scored ${fallbackScore}/100. +30 XP`, "success");
      } else {
        playFeedbackSound(false);
        setWrongWordsIds(prev => new Set(prev).add(selectedWord.id));
        (window as any).wordnestNotify?.("Evaluation Failed (Local)", `Sentence using "${selectedWord.word}" scored ${fallbackScore}/100. Try again!`, "warning");
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleNext = () => {
    setUserSentence("");
    setEvaluationResult(null);
    if (index + 1 >= words.length) {
      setIsComplete(true);
    } else {
      setIndex(prev => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 w-full max-w-5xl mx-auto"
    >
      <div className="flex items-center justify-between bg-white p-4 sm:p-5 rounded-2xl border border-[#C8CED6] shadow-sm">
        <div className="text-xs sm:text-sm font-bold text-[#736A86]">
          Sentence <span className="text-[#433075] font-black">{index + 1}</span> of {words.length}
        </div>
      </div>

      <div className="bg-white p-6 sm:p-10 rounded-3xl border-2 border-[#C8CED6] shadow-md space-y-6 w-full">
        <div className="space-y-2">
          <span className="text-[10px] bg-[#433075] text-white px-3.5 py-1 rounded-full font-black uppercase tracking-wider">
            AI Contextual Sentence Evaluator
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-[#0D0D0D]">Demonstrate Active Vocabulary Mastery</h2>
          <p className="text-xs sm:text-sm text-[#736A86]">
            Write a complete sentence using the term <strong className="text-[#433075]">"{selectedWord.word}"</strong>. Our AI model will evaluate your contextual usage, syntax, and clarity.
          </p>
        </div>

        <form onSubmit={handleEvaluate} className="space-y-4">
          <div className="space-y-2">
            <textarea
              rows={3}
              value={userSentence}
              onChange={(e) => setUserSentence(e.target.value)}
              disabled={evaluationResult && evaluationResult.score >= 70}
              placeholder={`Write a sentence using "${selectedWord.word}" in context...`}
              className="w-full p-4.5 rounded-2xl bg-[#F7F7F7] border-2 border-[#C8CED6] focus:border-[#433075] outline-none text-sm font-semibold text-[#0D0D0D] transition-all"
            />
          </div>

          {!evaluationResult || evaluationResult.score < 70 ? (
            <button
              type="submit"
              disabled={isEvaluating || !userSentence.trim()}
              className="w-full py-4 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs sm:text-sm transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {isEvaluating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Evaluating with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-purple-300" />
                  <span>Evaluate Sentence Usage</span>
                </>
              )}
            </button>
          ) : null}
        </form>

        {/* Evaluation Output */}
        {evaluationResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-6 sm:p-8 rounded-2xl bg-[#F7F7F7] border-2 space-y-5 ${evaluationResult.score >= 70 ? 'border-emerald-500' : 'border-rose-500'}`}
          >
            <div className="flex items-center justify-between pb-1 border-b border-[#C8CED6]/50">
              <div className="font-black text-sm text-[#433075] flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#A58CF4]" />
                <span>AI Evaluation Score</span>
              </div>
              <span className={`px-4 py-1.5 rounded-full font-black text-xs sm:text-sm text-white shadow-sm ${
                evaluationResult.score >= 80 ? "bg-emerald-600" : evaluationResult.score >= 70 ? "bg-amber-500" : "bg-rose-500"
              }`}>
                {evaluationResult.score} / 100
              </span>
            </div>

            {/* Direct Feedback Paragraph */}
            <p className="text-xs sm:text-sm text-[#0D0D0D] font-semibold leading-relaxed">
              {evaluationResult.feedback || evaluationResult.explanation}
            </p>

            {/* Primary Natural Correction */}
            {(evaluationResult.natural_correction || evaluationResult.corrected_sentence) && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-[#433075]">A natural correction is:</div>
                <div className="pl-3.5 border-l-4 border-[#433075] py-2.5 text-xs sm:text-sm font-bold text-[#0D0D0D] bg-white rounded-r-xl shadow-sm">
                  {evaluationResult.natural_correction || evaluationResult.corrected_sentence}
                </div>
              </div>
            )}

            {/* Alternative Correction if dynamically provided for THIS term */}
            {evaluationResult.alternative_correction && 
             evaluationResult.alternative_correction !== evaluationResult.natural_correction &&
             !evaluationResult.alternative_correction.includes("shoulder of the road") && (
              <div className="space-y-2 pt-1">
                <div className="text-xs font-bold text-[#736A86]">
                  {evaluationResult.alternative_label || "Or, an alternative phrasing:"}
                </div>
                <div className="pl-3.5 border-l-4 border-[#A58CF4] py-2.5 text-xs sm:text-sm font-bold text-[#0D0D0D] bg-white rounded-r-xl shadow-sm">
                  {evaluationResult.alternative_correction}
                </div>
              </div>
            )}

            {evaluationResult.score >= 70 && (
              <div className="pt-3 flex justify-end">
                <button
                  onClick={handleNext}
                  className="px-6 py-3 rounded-xl bg-[#433075] text-white font-black text-xs sm:text-sm hover:bg-[#A58CF4] hover:text-[#0D0D0D] transition-all cursor-pointer shadow-md active:scale-95"
                >
                  {index + 1 >= words.length ? "Finish Evaluation" : "Next Word \u2192"}
                </button>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
