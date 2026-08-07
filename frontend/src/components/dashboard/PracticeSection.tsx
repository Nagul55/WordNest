"use client";

import React, { useState, useEffect, useRef } from "react";
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
}

export default function PracticeSection({ user }: { user?: any }) {
  const [activeTab, setActiveTab] = useState<"flashcards" | "speedmatch" | "quiz" | "spelling" | "aigrader" | null>(null);
  const [words, setWords] = useState<WordItem[]>([]);

  // Individual section XP tracking
  const [flashcardsXp, setFlashcardsXp] = useState(0);
  const [speedmatchXp, setSpeedmatchXp] = useState(0);
  const [quizXp, setQuizXp] = useState(0);
  const [spellingXp, setSpellingXp] = useState(0);
  const [aigraderXp, setAigraderXp] = useState(0);

  // Load section XP and database cards
  useEffect(() => {
    const fetchUserCardsAndXp = async () => {
      if (!user?.id) return;

      // 1. Fetch user-created vocabulary cards from Supabase flashcards and vocabulary_vault
      try {
        const { data: cards } = await supabase
          .from("flashcards")
          .select("*")
          .limit(30);
          
        const { data: vaultWords } = await supabase
          .from("vocabulary_vault")
          .select("*")
          .eq("user_id", user.id)
          .limit(30);

        let combined: WordItem[] = [];

        if (cards && cards.length > 0) {
          const formatted = cards.map((c: any) => ({
            id: c.id,
            word: c.term,
            phonetic: "/" + c.term.toLowerCase() + "/",
            definition: c.definition,
            meaning: c.definition,
            image: c.image_url || undefined,
            example: `The word "${c.term}" is essential for mastery.`,
            category: "Custom Deck"
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
            category: v.category || "Lexicon Vault"
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
        const { data: xpData } = await supabase
          .from("practice_sessions")
          .select("mode, xp_earned")
          .eq("user_id", user.id);
        
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
  }, [user]);

  // Section specific reward helper
  const handleRewardXp = async (amount: number) => {
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
        xp_earned: amount
      });
    } catch (err) {
      console.warn("Notice: Failed to sync XP to database", err);
    }
  };

  // Sum total XP
  const totalXp = flashcardsXp + speedmatchXp + quizXp + spellingXp + aigraderXp;

  // Speech helper
  const handleSpeak = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        return;
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
      title: "Spelling & Dictation",
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
    <div className="space-y-8 pb-12 animate-fadeIn righteous-regular w-full text-[#0D0D0D]">
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
            className="space-y-8"
          >
            {/* HEADER BANNER */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] shadow-xl">
              <div>
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/50 text-[#FAFAFA] text-xs font-black uppercase tracking-wider mb-2 shadow-inner">
                  <Target className="w-3.5 h-3.5 text-[#A58CF4]" />
                  <span>Active Knowledge Reinforcement Arena</span>
                </div>
                <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight uppercase">
                  Practice Arena
                </h1>
                <p className="text-xs sm:text-sm text-[#F7F7F7] mt-1 font-normal">
                  Select a training section to reinforce vocabulary retention, check spellings, play match-blitz, or get evaluated by AI.
                </p>
              </div>

              {/* XP Badge */}
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20 shrink-0">
                <Trophy className="w-6 h-6 text-amber-400" />
                <div>
                  <div className="text-[10px] text-[#A58CF4] font-black uppercase tracking-wider">Practice Mastery XP</div>
                  <div className="text-xl font-black text-white">{totalXp} XP</div>
                </div>
              </div>
            </div>

            {/* SECTIONS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {practiceModes.map((mode) => {
                const IconComponent = mode.icon;
                return (
                  <motion.div
                    key={mode.id}
                    whileHover={{ scale: 1.02, y: -4 }}
                    className="flex"
                  >
                    <SpotlightCard
                      onClick={() => setActiveTab(mode.id)}
                      spotlightColor="rgba(165, 140, 244, 0.25)"
                      className="group cursor-pointer flex flex-col justify-between w-full h-full rounded-[28px] bg-white border border-[#C8CED6] overflow-hidden shadow-lg hover:shadow-2xl hover:border-[#A58CF4] transition-all duration-300"
                    >
                      <div className="p-6 w-full h-full flex flex-col justify-between relative overflow-hidden">
                        {/* Buttery Smooth Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[#736A86] to-[#272A3B] opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0" />

                        <div className="space-y-4 relative z-10">
                          {/* Top Row: Icon + Badge */}
                          <div className="flex items-center justify-between">
                            <div className={`p-2.5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] ${mode.color} group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent transition-all duration-300`}>
                              <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" />
                            </div>
                            <span className="text-[9px] bg-[#F7F7F7] border border-[#C8CED6]/40 text-[#433075] px-2.5 py-1 rounded-full font-black uppercase tracking-wider group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent transition-all duration-300">
                              {mode.badge}
                            </span>
                          </div>

                          {/* Title & Description */}
                          <div className="space-y-2">
                            <h3 className="text-xl font-black tracking-tight text-[#0D0D0D] group-hover:text-white transition-colors duration-300 uppercase">
                              {mode.title}
                            </h3>
                            <p className="text-xs text-[#736A86] group-hover:text-[#F7F7F7] leading-relaxed font-normal transition-colors duration-300">
                              {mode.description}
                            </p>
                          </div>
                        </div>

                        {/* Bottom details & Button */}
                        <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#C8CED6]/30 group-hover:border-white/20 transition-colors duration-300 relative z-10">
                          <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-[#433075] px-2.5 py-1 rounded font-black uppercase group-hover:bg-white/20 group-hover:text-white group-hover:border-transparent transition-all duration-300">
                            {mode.xp} XP Earned
                          </span>
                          <span className="text-[11px] font-black text-[#433075] group-hover:text-white uppercase tracking-wider flex items-center gap-1 transition-all duration-300">
                            <span>Start Practice</span>
                            <ArrowRight className="w-3.5 h-3.5 transform group-hover:translate-x-1 transition-transform duration-300" />
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
            {/* Focused Header */}
            <div className="flex items-center justify-between p-4 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] shadow-xl">
              <button
                onClick={() => setActiveTab(null)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-white border border-[#C8CED6]/60 hover:border-[#433075] text-[#433075] hover:bg-[#F7F7F7] text-xs font-black transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Exit Practice Arena</span>
              </button>
              <div className="flex items-center gap-3">
                <span className="text-xs font-black uppercase text-[#A58CF4] tracking-wider">
                  {practiceModes.find(m => m.id === activeTab)?.title}
                </span>
                <span className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-xl border border-white/20 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span>
                    {activeTab === "flashcards" ? flashcardsXp : 
                     activeTab === "speedmatch" ? speedmatchXp : 
                     activeTab === "quiz" ? quizXp : 
                     activeTab === "spelling" ? spellingXp : 
                     aigraderXp} XP
                  </span>
                </span>
              </div>
            </div>

            {/* Active module content rendered inside focused centered pane */}
            <div className="w-full flex justify-center py-4">
              <div className="w-full max-w-4xl">
                {words.length < 3 ? (
                  <div className="p-10 rounded-3xl bg-white border border-[#C8CED6] text-center space-y-4 shadow-sm">
                    <Layers className="w-12 h-12 text-[#736A86] mx-auto opacity-60" />
                    <h3 className="text-2xl font-black text-[#433075]">Not Enough Vocabulary</h3>
                    <p className="text-sm text-[#736A86]">Please add at least 3 flashcards or vocabulary words to your dictionary to start practicing!</p>
                  </div>
                ) : (
                  <>
                    {activeTab === "flashcards" && (
                      <SmartFlashcardsModule 
                        words={words} 
                        onSpeak={handleSpeak} 
                        onRewardXp={handleRewardXp} 
                      />
                    )}
                    {activeTab === "speedmatch" && (
                      <SpeedMatchModule 
                        words={words} 
                        onRewardXp={handleRewardXp} 
                      />
                    )}
                    {activeTab === "quiz" && (
                      <QuizChallengeModule 
                        words={words} 
                        onRewardXp={handleRewardXp} 
                      />
                    )}
                    {activeTab === "spelling" && (
                      <SpellingDictationModule 
                        words={words} 
                        onSpeak={handleSpeak} 
                        onRewardXp={handleRewardXp} 
                      />
                    )}
                    {activeTab === "aigrader" && (
                      <AISentenceEvaluatorModule 
                        words={words} 
                        onRewardXp={handleRewardXp} 
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
   1. SMART FLASHCARDS MODULE (3D Flip & Anki SRS Buttons)
   ==================================================================== */
function SmartFlashcardsModule({ words, onSpeak, onRewardXp }: { words: WordItem[]; onSpeak: (word: string) => void; onRewardXp: (amount: number) => void }) {
  const [index, setIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [stillLearningCount, setStillLearningCount] = useState(words.length);
  const [knowCount, setKnowCount] = useState(0);
  const [knownCardIds, setKnownCardIds] = useState<Set<string>>(new Set());
  const [history, setHistory] = useState<{ index: number; knownCount: number; stillLearningCount: number; knownCardIds: Set<string>; wasFlipped: boolean }[]>([]);
  const [trackProgress, setTrackProgress] = useState(true);

  const currentCard = words[index] || words[0];

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
  }, [isFlipped, index]);

  const handleRating = (quality: "again" | "easy") => {
    if (!currentCard) return;

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

    if (quality === "easy") {
      if (!knownCardIds.has(cardId)) {
        nextKnownCardIds.add(cardId);
        nextKnowCount += 1;
        if (nextStillLearningCount > 0) {
          nextStillLearningCount -= 1;
        }
      }
      onRewardXp(15);
    } else {
      if (knownCardIds.has(cardId)) {
        nextKnownCardIds.delete(cardId);
        if (nextKnowCount > 0) {
          nextKnowCount -= 1;
        }
        nextStillLearningCount += 1;
      }
      onRewardXp(5);
    }

    setKnowCount(nextKnowCount);
    setStillLearningCount(nextStillLearningCount);
    setKnownCardIds(nextKnownCardIds);

    // 3. Move to next card
    setIsFlipped(false);
    setTimeout(() => {
      setIndex(prev => (prev + 1) % words.length);
    }, 400);
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
        className={`w-full h-[460px] cursor-pointer perspective-1000 select-none relative ${isFlipped ? "flipped" : ""}`}
      >
        <div className="relative w-full h-full flip-card-inner">
          {/* FRONT (Split-screen image & definition) */}
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
              <div className="w-full h-full flex flex-row items-center justify-between overflow-hidden relative">
                {/* Speaker icon at top left */}
                <div className="absolute top-6 left-6 z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak(currentCard.definition || currentCard.meaning || "");
                    }}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-[#FAFAFA] transition-all"
                    title="Pronounce Definition"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Left Column: Meaning/Definition (occupies 50% size, padded) */}
                <div className="w-full md:w-1/2 h-full p-8 flex items-center justify-center text-center relative z-10">
                  <p className="text-xl sm:text-2xl font-bold text-[#FAFAFA] leading-relaxed tracking-wide righteous-regular">
                    {currentCard.definition || currentCard.meaning}
                  </p>
                </div>

                {/* Right Column: Image (occupies 50% size, covers to the border edge and blends on left) */}
                <div className="w-full md:w-1/2 h-full relative overflow-hidden flex items-center justify-center shrink-0">
                  {currentCard.image ? (
                    <img 
                      src={currentCard.image} 
                      alt="Visual Clue" 
                      style={{
                        maskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)',
                        WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1) 50%, rgba(0,0,0,0) 100%)'
                      }}
                      className="w-full h-full object-cover rounded-r-[24px]"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 text-[#A58CF4]">
                      <ImageIcon className="w-12 h-12 opacity-30 mb-2" />
                      <span className="text-[11px] font-black uppercase tracking-wider">No Image Association</span>
                    </div>
                  )}
                </div>
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
              <div className="w-full h-full p-8 flex flex-col justify-between items-center text-center relative overflow-hidden">
                {/* Top row with pronunciation of the Word */}
                <div className="flex justify-end w-full z-20">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSpeak(currentCard.word);
                    }}
                    className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-[#FAFAFA] transition-all"
                    title="Pronounce Word"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>

                {/* Large centered Word */}
                <div className="my-auto space-y-3">
                  <span className="text-[10px] text-[#A58CF4] font-black uppercase tracking-widest block">
                    The Vocabulary Word
                  </span>
                  <h2 className="text-4xl sm:text-6xl font-black text-[#FAFAFA] tracking-tight uppercase select-text">
                    {currentCard.word}
                  </h2>
                  {currentCard.phonetic && (
                    <p className="text-sm font-semibold text-[#A58CF4] italic">{currentCard.phonetic}</p>
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
      <div className="flex items-center justify-between pt-4 px-2">
        {/* Track progress toggle */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-black text-[#A58CF4] uppercase tracking-wider">Track progress</span>
          <button
            onClick={() => setTrackProgress(!trackProgress)}
            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 ${trackProgress ? "bg-indigo-600" : "bg-[#282E47]"}`}
          >
            <div className={`w-4 h-4 rounded-full bg-white transition-all duration-300 transform ${trackProgress ? "translate-x-6" : "translate-x-0"}`} />
          </button>
        </div>

        {/* Center: Rating buttons */}
        <div className="flex items-center gap-6">
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRating("again");
            }}
            className="w-14 h-14 rounded-full bg-[#1E2235] border-2 border-rose-500/40 hover:border-rose-500 text-rose-500 hover:bg-rose-500 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
            title="Still learning"
          >
            <X className="w-6 h-6" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRating("easy");
            }}
            className="w-14 h-14 rounded-full bg-[#1E2235] border-2 border-emerald-500/40 hover:border-emerald-500 text-emerald-500 hover:bg-emerald-500 hover:text-white flex items-center justify-center shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
            title="Know"
          >
            <Check className="w-6 h-6" />
          </button>
        </div>

        {/* Right: Undo / Restart buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleUndo}
            disabled={history.length === 0}
            className="p-3 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-[#A58CF4] hover:text-white border border-[#A58CF4]/10 transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleRestart}
            className="p-3 rounded-xl bg-[#1E2235] hover:bg-[#282E47] text-[#A58CF4] hover:text-white border border-[#A58CF4]/10 transition-all cursor-pointer"
            title="Restart Deck"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

/* ====================================================================
   2. SPEED MATCH BLITZ MODULE (Interactive Grid Matching)
   ==================================================================== */
function SpeedMatchModule({ words, onRewardXp }: { words: WordItem[]; onRewardXp: (amount: number) => void }) {
  const [cards, setCards] = useState<{ id: string; content: string; matchId: string; type: "word" | "meaning" }[]>([]);
  const [selectedFirst, setSelectedFirst] = useState<{ id: string; matchId: string } | null>(null);
  const [matchedIds, setMatchedIds] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(45);
  const [isPlaying, setIsPlaying] = useState(false);

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
    setTimeLeft(45);
    setIsPlaying(true);
  };

  useEffect(() => {
    if (!isPlaying || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsPlaying(false);
          onRewardXp(score * 10);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPlaying, timeLeft, score]);

  const handleTileClick = (card: { id: string; matchId: string }) => {
    if (!isPlaying || matchedIds.includes(card.id)) return;

    if (!selectedFirst) {
      setSelectedFirst(card);
    } else {
      if (selectedFirst.id !== card.id && selectedFirst.matchId === card.matchId) {
        // MATCH!
        setMatchedIds(prev => [...prev, selectedFirst.id, card.id]);
        setScore(prev => prev + 1);
        setSelectedFirst(null);

        if (matchedIds.length + 2 >= cards.length) {
          setIsPlaying(false);
          onRewardXp(score * 15 + 50);
        }
      } else {
        // MISMATCH
        setSelectedFirst(null);
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-4xl mx-auto"
    >
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

      {cards.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border-2 border-dashed border-[#C8CED6] text-center space-y-4">
          <Zap className="w-12 h-12 text-amber-500 mx-auto" />
          <h3 className="text-lg font-black text-[#0D0D0D]">Ready to Test Your Speed?</h3>
          <p className="text-xs text-[#736A86]">
            Match words to their correct definitions as fast as you can before the 45-second timer runs out.
          </p>
          <button
            onClick={startGame}
            className="px-6 py-3 rounded-2xl bg-[#433075] text-white font-black text-xs hover:bg-[#A58CF4] transition-all cursor-pointer"
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
                whileTap={{ scale: 0.95 }}
                onClick={() => handleTileClick(card)}
                disabled={isMatched || !isPlaying}
                className={`p-4 rounded-2xl text-left border-2 transition-all min-h-[100px] flex flex-col justify-center cursor-pointer ${
                  isMatched
                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 opacity-40 cursor-not-allowed"
                    : isSelected
                    ? "bg-[#433075] text-white border-[#A58CF4] shadow-lg scale-105"
                    : "bg-white hover:bg-[#F7F7F7] border-[#C8CED6] text-[#0D0D0D]"
                }`}
              >
                <div className={`font-black text-xs uppercase tracking-tight ${card.type === "word" ? "text-base font-black" : "text-[11px] font-medium leading-tight"}`}>
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
function QuizChallengeModule({ words, onRewardXp }: { words: WordItem[]; onRewardXp: (amount: number) => void }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);

  const currentWord = words[currentStep] || words[0];

  // Generate 4 choices
  const choices = React.useMemo(() => {
    const wrong = words.filter(w => w.id !== currentWord.id).map(w => w.definition);
    const shuffledWrong = wrong.sort(() => Math.random() - 0.5).slice(0, 3);
    const allOptions = [...shuffledWrong, currentWord.definition];
    return allOptions.sort(() => Math.random() - 0.5);
  }, [currentWord, words]);

  const handleSelect = (choice: string) => {
    if (selectedAnswer !== null) return;
    setSelectedAnswer(choice);
    setShowExplanation(true);
    if (choice === currentWord.definition) {
      setScore(prev => prev + 1);
      onRewardXp(20);
    }
  };

  const handleNext = () => {
    setSelectedAnswer(null);
    setShowExplanation(false);
    setCurrentStep(prev => (prev + 1) % words.length);
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
            <p className="text-[#736A86] italic">"{currentWord.example}"</p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleNext}
                className="px-5 py-2 rounded-xl bg-[#433075] text-white font-black text-xs hover:bg-[#A58CF4] transition-all cursor-pointer"
              >
                Next Question &rarr;
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
function SpellingDictationModule({ words, onSpeak, onRewardXp }: { words: WordItem[]; onSpeak: (word: string) => void; onRewardXp: (amount: number) => void }) {
  const [index, setIndex] = useState(0);
  const [inputVal, setInputVal] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [showHint, setShowHint] = useState(false);

  const currentWord = words[index] || words[0];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;

    if (inputVal.trim().toLowerCase() === currentWord.word.toLowerCase()) {
      setStatus("correct");
      onRewardXp(25);
      (window as any).wordnestNotify?.("Dictation Completed", `Perfect spelling verification for "${currentWord.word}". +25 XP`, "success");
    } else {
      setStatus("wrong");
      (window as any).wordnestNotify?.("Dictation Failed", `Incorrect spelling for "${currentWord.word}". Try again!`, "warning");
    }
  };

  const handleNext = () => {
    setInputVal("");
    setStatus("idle");
    setShowHint(false);
    setIndex(prev => (prev + 1) % words.length);
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
            <div>Phonetic: {currentWord.phonetic}</div>
            <div>Definition: "{currentWord.definition}"</div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            placeholder="Type spelling here..."
            disabled={status === "correct"}
            className="w-full p-4 rounded-2xl bg-[#F7F7F7] border-2 border-[#C8CED6] focus:border-[#433075] outline-none text-center font-black text-lg text-[#0D0D0D]"
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
              Next Dictation Term &rarr;
            </button>
          </div>
        )}

        {status === "wrong" && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 space-y-2">
            <div className="font-black text-sm flex items-center justify-center gap-2">
              <XCircle className="w-5 h-5 text-rose-500" />
              <span>Incorrect spelling. Try listening again!</span>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/* ====================================================================
   5. AI SENTENCE EVALUATOR MODULE (Groq AI Context Grading)
   ==================================================================== */
function AISentenceEvaluatorModule({ words, onRewardXp }: { words: WordItem[]; onRewardXp: (amount: number) => void }) {
  const [selectedWord, setSelectedWord] = useState<WordItem>(words[0]);
  const [userSentence, setUserSentence] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<any | null>(null);

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
          user_response: userSentence.trim()
        })
      });
      const result = await res.json();
      if (result.status === "success" && result.data) {
        setEvaluationResult(result.data);
        if (result.data.score >= 70) {
          onRewardXp(30);
          (window as any).wordnestNotify?.("AI Evaluation Passed", `Sentence using "${selectedWord.word}" scored ${result.data.score}/100. +30 XP`, "success");
        } else {
          (window as any).wordnestNotify?.("AI Evaluation Failed", `Sentence using "${selectedWord.word}" scored ${result.data.score}/100. Try again!`, "warning");
        }
      }
    } catch (err) {
      console.warn("AI grading notice (fallback local assessment):", err);
      // Local fallback evaluation if backend fails
      const hasWord = userSentence.toLowerCase().includes(selectedWord.word.toLowerCase());
      const fallbackScore = hasWord ? 85 : 40;
      setEvaluationResult({
        score: fallbackScore,
        feedback: hasWord
          ? `Great attempt! You included "${selectedWord.word}" accurately in your sentence context.`
          : `Ensure you include the exact term "${selectedWord.word}" in your written sentence.`
      });
      if (fallbackScore >= 70) {
        onRewardXp(30);
        (window as any).wordnestNotify?.("Evaluation Passed (Local)", `Sentence using "${selectedWord.word}" scored ${fallbackScore}/100. +30 XP`, "success");
      } else {
        (window as any).wordnestNotify?.("Evaluation Failed (Local)", `Sentence using "${selectedWord.word}" scored ${fallbackScore}/100. Try again!`, "warning");
      }
    } finally {
      setIsEvaluating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      className="space-y-6 max-w-2xl mx-auto"
    >
      <div className="bg-white p-8 rounded-3xl border-2 border-[#C8CED6] shadow-md space-y-6">
        <div className="space-y-2">
          <span className="text-[10px] bg-[#433075] text-white px-3 py-1 rounded-full font-black uppercase">
            AI Contextual Sentence Evaluator
          </span>
          <h2 className="text-xl font-black text-[#0D0D0D]">Demonstrate Active Vocabulary Mastery</h2>
          <p className="text-xs text-[#736A86]">
            Select a term and write a complete sentence using it. Our AI model will evaluate your contextual usage, syntax, and clarity.
          </p>
        </div>

        {/* Term selector */}
        <div className="space-y-2">
          <label className="text-xs font-black uppercase text-[#736A86]">Select Target Vocabulary Term</label>
          <CustomSelect
            value={selectedWord.id}
            onChange={(val) => {
              const found = words.find(w => w.id === val);
              if (found) setSelectedWord(found);
            }}
            options={words.map(w => ({
              value: w.id,
              label: `${w.word} — "${w.definition.slice(0, 45)}..."`
            }))}
            className="w-full"
          />
        </div>

        <form onSubmit={handleEvaluate} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase text-[#736A86]">Write Your Sentence</label>
            <textarea
              rows={3}
              value={userSentence}
              onChange={(e) => setUserSentence(e.target.value)}
              placeholder={`Write a sentence using "${selectedWord.word}" in context...`}
              className="w-full p-4 rounded-2xl bg-[#F7F7F7] border-2 border-[#C8CED6] focus:border-[#433075] outline-none text-xs font-semibold text-[#0D0D0D]"
            />
          </div>

          <button
            type="submit"
            disabled={isEvaluating || !userSentence.trim()}
            className="w-full py-3.5 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isEvaluating ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Evaluating with AI...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Evaluate Sentence Usage</span>
              </>
            )}
          </button>
        </form>

        {/* Evaluation Output */}
        {evaluationResult && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-6 rounded-2xl bg-[#F7F7F7] border-2 border-[#433075] space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="font-black text-sm text-[#433075] flex items-center gap-2">
                <BrainCircuit className="w-5 h-5 text-[#A58CF4]" />
                <span>AI Evaluation Score</span>
              </div>
              <span className={`px-3 py-1 rounded-full font-black text-xs text-white ${
                evaluationResult.score >= 80 ? "bg-emerald-600" : evaluationResult.score >= 60 ? "bg-amber-500" : "bg-rose-500"
              }`}>
                {evaluationResult.score} / 100
              </span>
            </div>

            <p className="text-xs text-[#0D0D0D] font-semibold leading-relaxed">
              {evaluationResult.feedback || evaluationResult.explanation}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
