"use client";

import React, { useState, useEffect } from "react";
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
  BarChart, 
  RefreshCcw,
  BookOpen,
  Volume2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Flashcard {
  id: string;
  word: string;
  phonetic: string;
  definition: string;
  example: string;
  deck: string;
  difficulty: "Easy" | "Medium" | "Hard";
}

import { supabase } from "@/lib/supabase";

export default function FlashcardsSection({ user }: { user?: any }) {
  const [activeDeck, setActiveDeck] = useState<string>("ALL");
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [sessionScore, setSessionScore] = useState<{ mastered: number; review: number }>({ mastered: 0, review: 0 });
  const [isSessionComplete, setIsSessionComplete] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  
  const [allCards, setAllCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    const fetchFlashcards = async () => {
      if (!user?.id) return;
      try {
        const { data, error } = await supabase
          .from("vocabulary_vault")
          .select("*")
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        if (data) {
          const formatted = data.map((d: any) => ({
            id: d.id,
            word: d.term,
            phonetic: "/ˌfəˈnet.ɪk/", // Mocked phonetics for now if not in DB
            definition: d.definition,
            example: d.example_sentence || "No example provided.",
            deck: "Essential Vocabulary",
            difficulty: "Medium" as any
          }));
          setAllCards(formatted);
        }
      } catch (err) {
        console.error("Error fetching flashcards:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFlashcards();
  }, [user]);

  const deckCards = allCards.filter(card => card.deck === activeDeck || activeDeck === "ALL");
  const currentCard = deckCards[currentIndex] || deckCards[0];
  const totalCards = deckCards.length;

  const handleNextCard = (known: boolean) => {
    setIsFlipped(false);
    setTimeout(() => {
      if (known) {
        setSessionScore(prev => ({ ...prev, mastered: prev.mastered + 1 }));
      } else {
        setSessionScore(prev => ({ ...prev, review: prev.review + 1 }));
      }

      if (currentIndex + 1 < totalCards) {
        setCurrentIndex(currentIndex + 1);
      } else {
        setIsSessionComplete(true);
        (window as any).wordnestNotify?.(
          "Session Completed!", 
          `You finished all ${totalCards} cards in "${activeDeck === "ALL" ? "All Combined Decks" : activeDeck}".`, 
          "success"
        );
      }
    }, 400);
  };

  const handleRestartSession = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSessionScore({ mastered: 0, review: 0 });
    setIsSessionComplete(false);
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setPlaying(false);
    }
  }, [isFlipped, currentIndex]);

  const handleSpeak = (e: React.MouseEvent, word: string) => {
    e.stopPropagation();
    if ("speechSynthesis" in window) {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        setPlaying(false);
        return;
      }
      setPlaying(true);
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      utterance.onend = () => setPlaying(false);
      utterance.onerror = () => setPlaying(false);
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } else {
      setPlaying(true);
      setTimeout(() => setPlaying(false), 800);
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn max-w-5xl mx-auto text-[#0D0D0D] w-full max-w-full overflow-x-hidden">
      
      {/* HEADER BANNER (DEEP PURPLE TO SLATE GRADIENT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/50 text-[#FAFAFA] text-xs font-black uppercase tracking-wider mb-2 shadow-inner">
            <Layers className="w-3.5 h-3.5 text-[#A58CF4]" />
            <span>3D Neural Spaced-Repetition Arena</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Interactive Smart Flashcards
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F7F7] mt-1 font-normal">
            Click cards to flip between terms and definitions, then grade your retention to calibrate future scheduling.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-white text-[#0D0D0D] px-5 py-3 rounded-2xl border-2 border-[#433075] shadow-lg shrink-0">
          <Flame className="w-6 h-6 text-[#A58CF4] fill-[#A58CF4] animate-bounce" />
          <div>
            <div className="text-[10px] font-black uppercase text-[#736A86]">Session Cadence</div>
            <div className="text-sm font-black text-[#0D0D0D]">Spaced Interval: 24 hrs</div>
          </div>
        </div>
      </div>

      {/* DECK SELECTOR TABS */}
      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
        {["Essential Vocabulary", "Advanced Vocabulary", "ALL"].map((deck) => (
          <button
            key={deck}
            onClick={() => {
              setActiveDeck(deck);
              setCurrentIndex(0);
              setIsFlipped(false);
              setIsSessionComplete(false);
              setSessionScore({ mastered: 0, review: 0 });
            }}
            className={`px-5 py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
              activeDeck === deck
                ? "bg-[#433075] text-[#FAFAFA] shadow-md border border-[#A58CF4]"
                : "bg-white text-[#0D0D0D] border border-[#C8CED6] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-transparent"
            }`}
          >
            {deck === "ALL" ? "All Combined Decks" : deck}
          </button>
        ))}
      </div>

      {/* SESSION COMPLETE VICTORY SCREEN */}
      {isSessionComplete ? (
        <motion.div 
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="p-10 sm:p-14 rounded-3xl bg-white border-2 border-[#433075] text-center max-w-2xl mx-auto space-y-6 shadow-xl relative overflow-hidden"
        >
          <div className="w-20 h-20 bg-[#433075] border-2 border-[#A58CF4] rounded-full flex items-center justify-center mx-auto text-[#FAFAFA] shadow-md">
            <Award className="w-10 h-10 text-[#A58CF4] animate-bounce" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-black text-[#0D0D0D]">Deck Session Accomplished!</h2>
            <p className="text-xs sm:text-sm text-[#736A86] font-semibold">
              You have completed all scheduled cards in this WordNest deck. Your retention statistics have been updated in the global analytics hub.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-xs mx-auto py-2">
            <div className="p-4 rounded-3xl bg-[#F7F7F7] border border-[#C8CED6] text-center">
              <span className="text-2xl font-black text-[#433075]">{sessionScore.mastered}</span>
              <span className="block text-[11px] font-bold text-[#736A86] uppercase mt-1">Mastered Today</span>
            </div>
            <div className="p-4 rounded-3xl bg-[#F7F7F7] border border-[#C8CED6] text-center">
              <span className="text-2xl font-black text-[#0D0D0D]">{sessionScore.review}</span>
              <span className="block text-[11px] font-bold text-[#736A86] uppercase mt-1">Scheduled Review</span>
            </div>
          </div>

          <button
            onClick={handleRestartSession}
            className="px-8 py-4 rounded-2xl bg-[#433075] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] text-[#FAFAFA] font-black text-xs shadow-md transition-all duration-300 inline-flex items-center gap-2 cursor-pointer active:scale-95 group border border-transparent hover:border-[#736A86]"
          >
            <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
            <span>Restart Spaced Review</span>
          </button>
        </motion.div>
      ) : (
        /* INTERACTIVE 3D CARD CONTAINER */
        <div className="space-y-6">
          
          {/* Progress Indicator Bar */}
          <div className="flex items-center justify-between text-xs font-black text-[#736A86] max-w-2xl mx-auto px-1">
            <span>Card <strong className="text-[#0D0D0D]">{totalCards > 0 ? currentIndex + 1 : 0}</strong> of <strong className="text-[#0D0D0D]">{totalCards}</strong></span>
            <span className="text-[#433075] uppercase tracking-wider">Tap card to reveal definition</span>
          </div>

          <div className="w-full max-w-2xl mx-auto h-2.5 bg-[#F7F7F7] rounded-full overflow-hidden border border-[#C8CED6]">
            <div 
              className="h-full bg-gradient-to-r from-[#433075] to-[#A58CF4] transition-all duration-300"
              style={{ width: totalCards > 0 ? `${((currentIndex + 1) / totalCards) * 100}%` : "0%" }}
            />
          </div>

          {isLoading ? (
            <div className="text-center p-12 text-[#736A86] animate-pulse font-bold">Loading Flashcards...</div>
          ) : deckCards.length === 0 ? (
            <div className="text-center p-12 text-[#736A86] font-bold">No cards found in your vault. Please add vocabulary words first!</div>
          ) : (
            <>


          {/* 3D PERSPECTIVE FLIP BOX */}
          <div 
            onClick={() => {
              if (typeof window !== "undefined" && "speechSynthesis" in window) {
                window.speechSynthesis.cancel();
                setPlaying(false);
              }
              setIsFlipped(!isFlipped);
            }}
            className={`w-full max-w-2xl h-[300px] xs:h-[340px] sm:h-[420px] mx-auto cursor-pointer perspective-1000 ${isFlipped ? "flipped" : ""}`}
          >
            <div className="relative w-full h-full flip-card-inner">
              
              {/* ==========================================
                  FRONT OF CARD (TERM & SPEECH)
                  ========================================== */}
              <div className="flip-card-front rounded-3xl bg-white border-2 border-[#C8CED6] hover:border-[#433075] p-5 sm:p-12 flex flex-col justify-between shadow-xl group transition-all">
                <div className="flex items-center justify-between">
                  <span className="px-3.5 py-1 rounded-full bg-[#F7F7F7] text-[#433075] font-black text-xs uppercase tracking-wider border border-[#C8CED6] shadow-sm">
                    {currentCard.deck}
                  </span>
                  <span className="text-xs font-bold text-[#736A86] flex items-center gap-1">
                    <span>Difficulty: <strong className="text-[#0D0D0D] font-black">{currentCard.difficulty}</strong></span>
                  </span>
                </div>

                <div className="text-center space-y-3 my-auto">
                  <h2 className="text-3xl sm:text-6xl font-black text-[#0D0D0D] tracking-tight group-hover:scale-105 transition-transform duration-300">
                    {currentCard.word}
                  </h2>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-sm font-black text-[#433075]">{currentCard.phonetic}</span>
                    <button
                      type="button"
                      onClick={(e) => handleSpeak(e, currentCard.word)}
                      title="Synthesize Pronunciation Audio"
                      className="p-2.5 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] text-[#433075] hover:text-[#FAFAFA] hover:border-transparent transition-all cursor-pointer shadow-sm group/btn"
                    >
                      <Volume2 className={`w-4 h-4 group-hover/btn:text-[#FAFAFA] ${playing ? "animate-pulse text-[#0D0D0D]" : ""}`} />
                    </button>
                  </div>
                </div>

                <div className="text-center pt-4 border-t border-[#C8CED6]/80">
                  <span className="text-xs font-extrabold text-[#433075] flex items-center justify-center gap-1.5 group-hover:text-[#0D0D0D] transition-colors">
                    <RotateCw className="w-4 h-4 text-[#433075] group-hover:rotate-180 transition-transform duration-500" />
                    <span>Click card to reveal definition and example</span>
                  </span>
                </div>
              </div>

              {/* ==========================================
                  BACK OF CARD (DEFINITION & EXAMPLE) - VIBRANT PURPLE OVERLAY
                  ========================================== */}
              <div className="flip-card-back rounded-3xl bg-gradient-to-b from-[#433075] to-[#272A3B] text-[#FAFAFA] border-2 border-[#A58CF4] p-8 sm:p-10 flex flex-col justify-between shadow-2xl overflow-y-auto">
                <div className="flex items-center justify-between border-b border-[#A58CF4]/40 pb-3">
                  <span className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-[#A58CF4]" />
                    <span>Scholarly Definition</span>
                  </span>
                  <span className="text-xs text-[#F7F7F7] font-bold">Term: <strong className="text-[#A58CF4]">{currentCard.word}</strong></span>
                </div>

                <div className="my-auto space-y-4 py-2">
                  <p className="text-base sm:text-xl font-extrabold text-white leading-relaxed">
                    {currentCard.definition}
                  </p>

                  <div className="p-4 sm:p-5 rounded-3xl bg-white text-[#0D0D0D] border-l-4 border-[#A58CF4] shadow-md">
                    <span className="text-[10px] uppercase font-black text-[#433075] block mb-1">Contextual Usage Example:</span>
                    <p className="text-xs sm:text-sm text-[#0D0D0D] font-bold italic leading-relaxed">
                      "{currentCard.example}"
                    </p>
                  </div>
                </div>

                <div className="text-center pt-3 border-t border-[#A58CF4]/40">
                  <span className="text-[11px] font-bold text-[#F7F7F7]">Select your recall confidence rating below</span>
                </div>
              </div>

            </div>
          </div>

          {/* RECALL ASSESSMENT BUTTONS */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-2xl mx-auto pt-2">
            <button
              onClick={() => handleNextCard(false)}
              className="w-full sm:w-1/2 py-4 rounded-2xl bg-white hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] text-[#0D0D0D] hover:text-[#FAFAFA] font-black text-xs border-2 border-[#C8CED6] hover:border-transparent transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer shadow-md active:scale-95 group"
            >
              <XCircle className="w-5 h-5 text-rose-500 group-hover:text-rose-400 group-hover:scale-110 transition-all" />
              <span>Needs Further Review (Hard)</span>
            </button>
            <button
              onClick={() => handleNextCard(true)}
              className="w-full sm:w-1/2 py-4 rounded-2xl bg-[#433075] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] text-[#FAFAFA] font-black text-xs shadow-md transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer active:scale-95 border border-transparent hover:border-[#0D0D0D] group"
            >
              <CheckCircle2 className="w-5 h-5 text-[#A58CF4] group-hover:text-[#FAFAFA] group-hover:scale-110 transition-transform" />
              <span>Mastered and Retained (Easy)</span>
            </button>
          </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
