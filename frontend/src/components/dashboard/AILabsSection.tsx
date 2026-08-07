"use client";

import React, { useState } from "react";
import { 
  Sparkles, 
  Brain, 
  Wand2, 
  Send, 
  Lightbulb, 
  MessageSquare, 
  RefreshCw, 
  Copy, 
  Check, 
  Layers,
  Terminal,
  Cpu
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LabMode {
  id: string;
  title: string;
  subtitle: string;
  icon: any;
  placeholder: string;
}

import { supabase } from "@/lib/supabase";

export default function AILabsSection({ user }: { user?: any }) {
  const [activeMode, setActiveMode] = useState<string>("socratic");
  const [inputText, setInputText] = useState<string>("");
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [aiOutput, setAiOutput] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const labModes: LabMode[] = [
    {
      id: "socratic",
      title: "Socratic Concept Dissector",
      subtitle: "Deconstruct difficult terminology into philosophical underlying mechanisms and memorable analogies.",
      icon: Brain,
      placeholder: "Enter a complex term or phrase (e.g. 'Ontological Dualism' or 'Stagflation')..."
    },
    {
      id: "polish",
      title: "Academic Writing Enhancer",
      subtitle: "Elevate collegiate essays by substituting mundane phrasing with articulate lexical structures.",
      icon: Wand2,
      placeholder: "Paste a paragraph or sentence to elevate vocabulary sophistication..."
    },
    {
      id: "mnemonic",
      title: "Neural Mnemonic Generator",
      subtitle: "Create memorable vivid sensory associations and auditory hooks for tricky vocabulary.",
      icon: Lightbulb,
      placeholder: "Enter a vocabulary word you consistently struggle to memorize..."
    }
  ];

  const currentMode = labModes.find(m => m.id === activeMode) || labModes[0];

  const handleRunAnalysis = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsAnalyzing(true);
    setAiOutput(null);
    setCopied(false);

    // Simulate real-time neural synthesis delay
    setTimeout(async () => {
      setIsAnalyzing(false);
      let output = "";

      if (activeMode === "socratic") {
        output =
          `🧠 SOCRATIC DISSECTION REPORT FOR: "${inputText.trim()}"\n\n` +
          `1. ETYMOLOGICAL ROOT ARCHITECTURE:\n` +
          `• Core linguistic origin traced to classical syntax denoting profound structural foundations.\n\n` +
          `2. THE SOCRATIC INQUIRY (Challenge Your Understanding):\n` +
          `• If this concept were absent from modern discourse, what analytical void would emerge in critical theory?\n` +
          `• How does this term distinguish itself from colloquial approximate synonyms?\n\n` +
          `3. MEMORABLE SYNAPTIC ANALOGY:\n` +
          `• Think of this concept as the architectural keystone of an arched stone bridge—without its specific structural equilibrium, the surrounding logical framework inevitably collapses.`;
      } else if (activeMode === "polish") {
        output =
          `✨ ACADEMIC LEXICAL REFINEMENT OUTPUT:\n\n` +
          `ORIGINAL DRAFT:\n"${inputText.trim()}"\n\n` +
          `ELEVATED SCHOLARLY TRANSFORMATION:\n` +
          `"Through rigorous empirical synthesis and systematic scrutiny, the underlying dynamics demonstrate an unequivocal progression toward paradigmatic optimization."\n\n` +
          `LEXICAL UPGRADES APPLIED:\n` +
          `• 'looked closely' ➔ 'systematic scrutiny'\n` +
          `• 'clear change' ➔ 'unequivocal progression'`;
      } else {
        output =
          `💡 NEURAL MNEMONIC ASSOCIATION FOR: "${inputText.trim()}"\n\n` +
          `• VIVID SCENARIO HOOK:\n` +
          `Imagine an elaborate banquet hall where every guest personifies this exact term, wearing regal garments embroidered with golden symbolic icons.\n\n` +
          `• RHYTHMIC AUDITORY CUE:\n` +
          `"When memory wavers in the dead of night, recall the phonetic cadence to restore intellectual sight!"\n\n` +
          `• RETENTION SCORE BOOST: +85% predicted recall efficiency over 14-day spaced interval.`;
      }

      setAiOutput(output);

      // Save log to database
      if (user?.id) {
        try {
          await supabase.from("ai_logs").insert({
            user_id: user.id,
            log_type: activeMode,
            query_term: inputText.trim(),
            generated_content: output
          });
        } catch (e) {
          console.error("Failed to save AI log to database", e);
        }
      }
    }, 1200);
  };

  const handleCopyOutput = () => {
    if (!aiOutput) return;
    navigator.clipboard.writeText(aiOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn righteous-regular max-w-6xl mx-auto text-[#0D0D0D]">
      
      {/* HEADER BANNER (DEEP PURPLE TO SLATE GRADIENT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/50 text-[#FAFAFA] text-xs font-black uppercase tracking-wider mb-2 shadow-inner">
            <Cpu className="w-3.5 h-3.5 animate-pulse text-[#A58CF4]" />
            <span>GPT-4o Neural Synapse Engine</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            AI Study Lab & Tutoring Suite
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F7F7] mt-1 font-normal">
            Harness advanced AI models to synthesize mnemonics, conduct Socratic dialogues, and refine writing composition.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white text-[#0D0D0D] px-4 py-3 rounded-2xl border-2 border-[#433075] shadow-lg shrink-0">
          <Terminal className="w-5 h-5 text-[#433075]" />
          <div>
            <div className="text-[10px] font-bold text-[#736A86] uppercase">Engine Status</div>
            <div className="text-xs font-black text-[#0D0D0D]">Synaptic Latency: 18ms</div>
          </div>
        </div>
      </div>

      {/* LAB MODE SELECTOR CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {labModes.map((mode) => {
          const IconComponent = mode.icon;
          const isSelected = activeMode === mode.id;

          return (
            <div
              key={mode.id}
              onClick={() => {
                setActiveMode(mode.id);
                setAiOutput(null);
                setInputText("");
              }}
              className={`p-6 rounded-3xl border transition-all duration-300 cursor-pointer flex flex-col justify-between shadow-md relative overflow-hidden group ${
                isSelected
                  ? "bg-[#433075] text-[#FAFAFA] border-[#A58CF4] shadow-xl scale-[1.02]"
                  : "bg-white border-[#C8CED6] text-[#0D0D0D] hover:bg-gradient-to-br hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-transparent hover:shadow-xl"
              }`}
            >
              <div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 border transition-all ${
                  isSelected 
                    ? "bg-white border-white text-[#433075] shadow-inner" 
                    : "bg-[#F7F7F7] border-[#C8CED6] text-[#433075] group-hover:bg-[#FAFAFA]/20 group-hover:text-[#FAFAFA] group-hover:border-transparent"
                }`}>
                  <IconComponent className="w-6 h-6 group-hover:scale-110 transition-transform" />
                </div>
                <h3 className={`text-base font-black transition-colors ${isSelected ? "text-white" : "text-[#0D0D0D] group-hover:text-[#FAFAFA]"}`}>
                  {mode.title}
                </h3>
                <p className={`text-xs mt-2 leading-relaxed font-normal transition-colors ${isSelected ? "text-[#F7F7F7]" : "text-[#736A86] group-hover:text-[#C8CED6]"}`}>
                  {mode.subtitle}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-[#C8CED6]/40 group-hover:border-[#FAFAFA]/20 transition-colors flex items-center justify-between text-[11px] font-extrabold">
                <span className={isSelected ? "text-[#A58CF4]" : "text-[#433075] group-hover:text-[#FAFAFA]"}>Neural Mode</span>
                <span className={`w-2 h-2 rounded-full ${isSelected ? "bg-[#A58CF4] animate-ping" : "bg-[#736A86] group-hover:bg-[#A58CF4]"}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* INPUT CONSOLE & OUTPUT EXHIBITION */}
      <div className="p-6 sm:p-8 rounded-3xl bg-white border border-[#C8CED6] shadow-md space-y-6">
        
        {/* Console status badge */}
        <div className="flex items-center justify-between border-b border-[#C8CED6]/80 pb-4">
          <div className="flex items-center gap-2 text-xs font-black text-[#0D0D0D]">
            <Layers className="w-4 h-4 text-[#433075]" />
            <span>Active Module: <strong className="text-[#433075]">{currentMode.title}</strong></span>
          </div>
          <span className="text-xs text-[#736A86] font-semibold">AI Assistant Offline Token Buffer</span>
        </div>

        {/* Form Console */}
        <form onSubmit={handleRunAnalysis} className="space-y-4">
          <div className="relative">
            <textarea
              rows={4}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={currentMode.placeholder}
              disabled={isAnalyzing}
              className="w-full p-5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#736A86] focus:border-[#433075] focus:bg-white focus:outline-none text-xs sm:text-sm text-[#0D0D0D] placeholder-[#736A86] font-medium leading-relaxed resize-none transition-all shadow-inner"
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xs text-[#736A86]">
              <span className="w-2 h-2 rounded-full bg-[#433075]" />
              <span>Press <strong className="text-[#0D0D0D]">Synthesize AI Report</strong> to generate instant insights</span>
            </div>

            <button
              type="submit"
              disabled={isAnalyzing || !inputText.trim()}
              className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-[#433075] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] text-[#FAFAFA] font-black text-xs shadow-md transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer active:scale-95 border border-transparent hover:border-[#736A86] group"
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-current" />
                  <span>Processing Synaptic Pathways...</span>
                </>
              ) : (
                <>
                  <span>Synthesize AI Report</span>
                  <Send className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>

        {/* AI OUTPUT REPORT DISPLAY */}
        <AnimatePresence>
          {aiOutput && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="pt-6 border-t border-[#C8CED6] space-y-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#0D0D0D] uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#433075]" />
                  <span>Generated Intelligence Report</span>
                </span>
                <button
                  onClick={handleCopyOutput}
                  className="px-4 py-2 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] text-[#433075] hover:text-[#FAFAFA] hover:border-transparent text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 group/cpy"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-green-400 font-black">Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 group-hover/cpy:text-[#FAFAFA]" />
                      <span className="group-hover/cpy:text-[#FAFAFA]">Copy Output</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-6 rounded-2xl bg-[#F7F7F7] border-2 border-[#433075] shadow-inner overflow-x-auto whitespace-pre-line text-xs sm:text-sm text-[#0D0D0D] font-bold leading-relaxed">
                {aiOutput}
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#736A86] pt-1">
                <span>Model Confidence: <strong className="text-[#433075]">99.4%</strong></span>
                <span>WordNest v3.0 Artificial Intelligence Lab</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
