"use client";

import React, { useState, useMemo } from "react";
import { 
  BookOpen, 
  Search, 
  Volume2, 
  Filter, 
  Plus, 
  Bookmark, 
  CheckCircle2, 
  Tag, 
  Sparkles,
  ChevronDown,
  X,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface WordItem {
  id: string;
  word: string;
  phonetic: string;
  partOfSpeech: string;
  definition: string;
  example: string;
  category: "GRE" | "TOEFL" | "IELTS" | "Business";
  status: "Mastered" | "Learning" | "Review";
}

export default function VocabularySection() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [activeWordId, setActiveWordId] = useState<string>("w1");
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New word form state
  const [newWord, setNewWord] = useState({
    word: "",
    phonetic: "",
    partOfSpeech: "adjective",
    definition: "",
    example: "",
    category: "GRE" as const
  });

  const [wordsList, setWordsList] = useState<WordItem[]>([
    {
      id: "w1",
      word: "Perspicacious",
      phonetic: "/ˌpɜː.spɪˈkeɪ.ʃəs/",
      partOfSpeech: "adjective",
      definition: "Having or showing an extraordinary penetrating mental discernment and understanding; clearsighted and acutely insightful in judgment.",
      example: "His perspicacious analysis of the volatile geopolitical situation enabled the committee to avert prolonged diplomatic escalation.",
      category: "GRE",
      status: "Mastered",
    },
    {
      id: "w2",
      word: "Recalcitrant",
      phonetic: "/rɪˈkæl.sɪ.trənt/",
      partOfSpeech: "adjective",
      definition: "Having an obstinately uncooperative attitude toward authority, institutional directives, or discipline; stubborn and resistant to moral suasion.",
      example: "The corporate restructuring was significantly impeded by recalcitrant executive managers who clung desperately to obsolete paradigms.",
      category: "GRE",
      status: "Learning",
    },
    {
      id: "w3",
      word: "Equanimity",
      phonetic: "/ˌiː.kwəˈnɪm.ə.ti/",
      partOfSpeech: "noun",
      definition: "Mental calmness, self-possession, and unshakeable inner stability, particularly displayed under conditions of severe distress or high stress.",
      example: "During the catastrophic system failure, the principal architect maintained absolute equanimity, guiding the engineers to calm restoration.",
      category: "TOEFL",
      status: "Mastered",
    },
    {
      id: "w4",
      word: "Obsecrate",
      phonetic: "/ˈɒb.sɪ.kreɪt/",
      partOfSpeech: "verb",
      definition: "To beseech, implore, or pray earnestly for mercy or pardon; to entreat somebody with extreme urgency and profound solemnity.",
      example: "The defeated delegation could only obsecrate the reigning committee for humanitarian leniency during the treaty negotiations.",
      category: "GRE",
      status: "Review",
    },
    {
      id: "w5",
      word: "Sycophantic",
      phonetic: "/ˌsɪk.əˈfæn.tɪk/",
      partOfSpeech: "adjective",
      definition: "Behaving or done in an obsequious way in order to gain advantage; overly fawning and ingratiating toward powerful figures.",
      example: "The board rejected the sycophantic appraisals from subordinate junior partners, demanding rigorous and impartial objective criticism.",
      category: "IELTS",
      status: "Learning",
    },
    {
      id: "w6",
      word: "Proscriptive",
      phonetic: "/prəˈskrɪp.tɪv/",
      partOfSpeech: "adjective",
      definition: "Relating to or imposing severe moral or legal prohibitions; expressly forbidding specific practices or behaviors within an organization.",
      example: "The enterprise introduced strict proscriptive governance regulations concerning unauthorized artificial intelligence deployments.",
      category: "Business",
      status: "Mastered",
    },
  ]);

  // Filter logic
  const filteredWords = useMemo(() => {
    return wordsList.filter((item) => {
      const matchesSearch = item.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            item.definition.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === "ALL" || item.category === selectedCategory;
      const matchesStatus = selectedStatus === "ALL" || item.status === selectedStatus;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [wordsList, searchQuery, selectedCategory, selectedStatus]);

  const activeWord = wordsList.find((w) => w.id === activeWordId) || filteredWords[0] || wordsList[0];

  // Simulate phonetic pronunciation speech synthesis
  const handlePlayPronunciation = (id: string, word: string) => {
    setPlayingId(id);
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.rate = 0.9;
      utterance.onend = () => setPlayingId(null);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setPlayingId(null), 1000);
    }
  };

  // Toggle word mastery status
  const handleToggleStatus = (id: string) => {
    setWordsList((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextStatus = item.status === "Learning" ? "Mastered" : item.status === "Mastered" ? "Review" : "Learning";
          return { ...item, status: nextStatus as any };
        }
        return item;
      })
    );
  };

  const handleCreateWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWord.word.trim() || !newWord.definition.trim()) return;
    const item: WordItem = {
      id: `w_${Date.now()}`,
      word: newWord.word.trim(),
      phonetic: newWord.phonetic.trim() || "/custom/",
      partOfSpeech: newWord.partOfSpeech,
      definition: newWord.definition.trim(),
      example: newWord.example.trim() || "No contextual sentence recorded yet.",
      category: newWord.category,
      status: "Learning",
    };
    setWordsList([item, ...wordsList]);
    setActiveWordId(item.id);
    setIsAddModalOpen(false);
    setNewWord({ word: "", phonetic: "", partOfSpeech: "adjective", definition: "", example: "", category: "GRE" });
  };

  return (
    <div className="space-y-8 pb-12 animate-fadeIn righteous-regular text-[#0D0D0D]">
      
      {/* HEADER BAR (DEEP PURPLE TO SLATE GRADIENT) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-[#433075] via-[#272A3B] to-[#0D0D0D] text-[#FAFAFA] border-2 border-[#A58CF4] shadow-xl">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-[#A58CF4]/50 text-[#FAFAFA] text-xs font-black uppercase tracking-wider mb-2 shadow-inner">
            <BookOpen className="w-3.5 h-3.5 text-[#A58CF4]" />
            <span>AI Lexicon Vault & Semantic Matrix</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
            Academic Vocabulary Repository
          </h1>
          <p className="text-xs sm:text-sm text-[#F7F7F7] mt-1 font-normal">
            Curated high-tier terms equipped with phonetic synthesis, contextual essays, and active tagging.
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-6 py-3.5 rounded-2xl bg-white text-[#433075] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] font-black text-xs shadow-md transition-all duration-300 flex items-center gap-2 shrink-0 cursor-pointer active:scale-95 group border border-transparent hover:border-[#736A86]"
        >
          <Plus className="w-4 h-4 stroke-[3] group-hover:rotate-90 transition-transform" />
          <span>Add Custom Term</span>
        </button>
      </div>

      {/* FILTER & SEARCH ROW */}
      <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#C8CED6] flex flex-wrap items-center justify-between gap-4 shadow-sm">
        {/* Search */}
        <div className="relative flex-1 min-w-[260px]">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#736A86] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by term name or definition content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#736A86] focus:border-[#433075] focus:bg-white focus:outline-none text-xs text-[#0D0D0D] placeholder-[#736A86] font-bold transition-all shadow-inner"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-[#736A86] mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#433075]" /> Category:
          </span>
          {["ALL", "GRE", "TOEFL", "IELTS", "Business"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-[#433075] text-[#FAFAFA] shadow-sm border border-[#A58CF4]"
                  : "bg-[#F7F7F7] text-[#0D0D0D] border border-[#C8CED6] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-transparent"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-black text-[#736A86] mr-1">Status:</span>
          {["ALL", "Mastered", "Learning", "Review"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all duration-300 cursor-pointer ${
                selectedStatus === st
                  ? "bg-[#A58CF4] text-[#0D0D0D] font-black shadow-md border border-[#433075]"
                  : "bg-[#F7F7F7] text-[#0D0D0D] border border-[#C8CED6] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-transparent"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN TWO-COLUMN SPLIT (LIST ON LEFT, INSPECTOR ON RIGHT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* WORD LIST COLUMN */}
        <div className="lg:col-span-5 space-y-3 max-h-[660px] overflow-y-auto pr-1">
          {filteredWords.length === 0 ? (
            <div className="p-8 rounded-3xl bg-white border border-[#C8CED6] text-center text-xs text-[#736A86]">
              No vocabulary terms match your specific filter queries.
            </div>
          ) : (
            filteredWords.map((item) => {
              const isSelected = item.id === activeWord?.id;
              const isMastered = item.status === "Mastered";
              const isReview = item.status === "Review";

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveWordId(item.id)}
                  className={`p-4 sm:p-5 rounded-3xl border transition-all duration-300 cursor-pointer flex items-center justify-between group ${
                    isSelected
                      ? "bg-[#433075] text-[#FAFAFA] border-[#433075] shadow-lg scale-[1.02]"
                      : "bg-white border-[#C8CED6] text-[#0D0D0D] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-transparent hover:shadow-md"
                  }`}
                >
                  <div className="space-y-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-black transition-colors truncate ${isSelected ? "text-white" : "text-[#0D0D0D] group-hover:text-[#FAFAFA]"}`}>
                        {item.word}
                      </span>
                      <span className={`text-[11px] font-bold italic ${isSelected ? "text-[#A58CF4]" : "text-[#433075] group-hover:text-[#A58CF4]"}`}>
                        ({item.partOfSpeech})
                      </span>
                    </div>
                    <p className={`text-xs line-clamp-1 font-normal transition-colors ${isSelected ? "text-[#FAFAFA]/90" : "text-[#736A86] group-hover:text-[#C8CED6]"}`}>
                      {item.definition}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-lg border shadow-sm ${
                      isMastered 
                        ? "bg-[#A58CF4] text-[#0D0D0D] border-[#0D0D0D]/20"
                        : isReview
                        ? "bg-amber-300 text-[#0D0D0D] border-[#0D0D0D]/20"
                        : "bg-white text-[#433075] border-[#C8CED6]"
                    }`}>
                      {item.status}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-lg border transition-all ${
                      isSelected ? "bg-white/20 text-white border-white/30" : "bg-[#F7F7F7] text-[#736A86] border-[#C8CED6] group-hover:bg-[#FAFAFA]/20 group-hover:text-[#FAFAFA] group-hover:border-transparent"
                    }`}>
                      {item.category}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* WORD INSPECTOR PANEL */}
        <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#433075] shadow-xl sticky top-6 space-y-6">
          {activeWord ? (
            <>
              {/* Top Details & Audio Speech */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C8CED6]/80 pb-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl sm:text-4xl font-black text-[#0D0D0D] tracking-tight">
                      {activeWord.word}
                    </h2>
                    <button
                      onClick={() => handlePlayPronunciation(activeWord.id, activeWord.word)}
                      title="Synthesize Pronunciation Audio"
                      className="p-3 rounded-2xl bg-[#F7F7F7] border border-[#C8CED6] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] hover:text-[#FAFAFA] hover:border-transparent transition-all shadow-sm active:scale-90 cursor-pointer group"
                    >
                      <Volume2 className={`w-5 h-5 group-hover:text-[#FAFAFA] ${playingId === activeWord.id ? "animate-pulse text-[#0D0D0D]" : "text-[#433075]"}`} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3 text-xs font-extrabold text-[#0D0D0D]">
                    <span className="text-[#433075] font-black text-sm">{activeWord.phonetic}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8CED6]" />
                    <span className="italic uppercase text-[11px] text-[#736A86]">{activeWord.partOfSpeech}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#C8CED6]" />
                    <span className="px-2.5 py-0.5 rounded-lg bg-[#F7F7F7] border border-[#C8CED6] text-[#433075] text-[10px] font-black">
                      {activeWord.category} TIER
                    </span>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2">
                  <button
                    onClick={() => handleToggleStatus(activeWord.id)}
                    className="px-4 py-2.5 rounded-2xl bg-[#433075] hover:bg-gradient-to-r hover:from-[#736A86] hover:to-[#272A3B] text-[#FAFAFA] text-xs font-black transition-all duration-300 flex items-center gap-2 cursor-pointer shadow-sm active:scale-95 border border-transparent hover:border-[#736A86]"
                  >
                    <CheckCircle2 className="w-4 h-4 text-current" />
                    <span>Status: {activeWord.status}</span>
                  </button>
                  <span className="text-[10px] text-[#736A86] font-bold">Click to update state</span>
                </div>
              </div>

              {/* Definition Section */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-[#433075] uppercase tracking-wider flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-[#433075]" />
                  <span>Scholarly Definition</span>
                </h3>
                <p className="text-sm sm:text-base font-bold text-[#0D0D0D] leading-relaxed p-4 sm:p-5 rounded-3xl bg-[#F7F7F7] border border-[#C8CED6] shadow-inner">
                  {activeWord.definition}
                </p>
              </div>

              {/* Contextual Usage Essay Example */}
              <div className="space-y-2">
                <h3 className="text-xs font-black text-[#433075] uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#A58CF4]" />
                  <span>Contextual Academic Usage</span>
                </h3>
                <blockquote className="p-5 rounded-3xl bg-gradient-to-r from-[#F7F7F7] to-white border-l-4 border-[#433075] border-t border-r border-b border-[#C8CED6] text-xs sm:text-sm text-[#0D0D0D] font-semibold leading-relaxed italic shadow-sm">
                  "{activeWord.example}"
                </blockquote>
              </div>

              {/* Memory Mnemonic Tip */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#433075]/10 via-[#A58CF4]/10 to-transparent border border-[#A58CF4] flex items-start gap-3.5">
                <div className="p-2.5 rounded-2xl bg-[#433075] text-[#FAFAFA] shrink-0 shadow-sm">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-black text-[#0D0D0D]">Neural Synaptic Link (AI Tip)</div>
                  <p className="text-xs text-[#736A86] mt-1 leading-relaxed font-semibold">
                    To embed <strong className="text-[#433075]">{activeWord.word}</strong> into permanent memory, connect it with the root concept during your Socratic AI sessions in the Neural Lab!
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="py-24 text-center text-xs text-[#736A86]">
              Select a word from the lexicon directory to inspect scholarly analytics and playback speech.
            </div>
          )}
        </div>

      </div>

      {/* ADD CUSTOM TERM MODAL */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg p-6 sm:p-8 rounded-3xl bg-white border-2 border-[#433075] shadow-2xl space-y-6 relative text-[#0D0D0D]"
            >
              <div className="flex items-center justify-between border-b border-[#C8CED6] pb-4">
                <div className="flex items-center gap-2">
                  <Plus className="w-5 h-5 text-[#433075]" />
                  <h2 className="text-lg font-black text-[#0D0D0D]">Add Term to Lexicon Vault</h2>
                </div>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-2 rounded-xl text-[#736A86] hover:text-[#0D0D0D] hover:bg-[#A58CF4] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateWord} className="space-y-4 text-xs">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-[#0D0D0D] uppercase text-[11px]">Vocabulary Term *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Inexorable"
                      value={newWord.word}
                      onChange={(e) => setNewWord({ ...newWord, word: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#433075] focus:border-[#433075] focus:bg-white focus:outline-none text-[#0D0D0D] font-bold"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-[#0D0D0D] uppercase text-[11px]">Phonetic Notation</label>
                    <input
                      type="text"
                      placeholder="e.g. /ɪˈnek.sər.ə.bl̩/"
                      value={newWord.phonetic}
                      onChange={(e) => setNewWord({ ...newWord, phonetic: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#433075] focus:border-[#433075] focus:bg-white focus:outline-none text-[#0D0D0D] font-bold"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="font-black text-[#0D0D0D] uppercase text-[11px]">Part of Speech</label>
                    <select
                      value={newWord.partOfSpeech}
                      onChange={(e) => setNewWord({ ...newWord, partOfSpeech: e.target.value })}
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#433075] focus:border-[#433075] focus:bg-white focus:outline-none text-[#0D0D0D] font-bold"
                    >
                      <option value="adjective" className="bg-white">Adjective</option>
                      <option value="noun" className="bg-white">Noun</option>
                      <option value="verb" className="bg-white">Verb</option>
                      <option value="adverb" className="bg-white">Adverb</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="font-black text-[#0D0D0D] uppercase text-[11px]">Academic Category</label>
                    <select
                      value={newWord.category}
                      onChange={(e) => setNewWord({ ...newWord, category: e.target.value as any })}
                      className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#433075] focus:border-[#433075] focus:bg-white focus:outline-none text-[#0D0D0D] font-bold"
                    >
                      <option value="GRE" className="bg-white">GRE</option>
                      <option value="TOEFL" className="bg-white">TOEFL</option>
                      <option value="IELTS" className="bg-white">IELTS</option>
                      <option value="Business" className="bg-white">Business</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="font-black text-[#0D0D0D] uppercase text-[11px]">Scholarly Definition *</label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Enter precise definition and contextual nuances..."
                    value={newWord.definition}
                    onChange={(e) => setNewWord({ ...newWord, definition: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#433075] focus:border-[#433075] focus:bg-white focus:outline-none text-[#0D0D0D] font-semibold resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-black text-[#0D0D0D] uppercase text-[11px]">Example Sentence</label>
                  <textarea
                    rows={2}
                    placeholder="Provide an exemplary complex sentence demonstrating valid usage..."
                    value={newWord.example}
                    onChange={(e) => setNewWord({ ...newWord, example: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#F7F7F7] border border-[#C8CED6] hover:border-[#433075] focus:border-[#433075] focus:bg-white focus:outline-none text-[#0D0D0D] font-semibold resize-none"
                  />
                </div>

                <div className="pt-4 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-3 rounded-xl bg-[#F7F7F7] hover:bg-[#C8CED6] text-[#0D0D0D] font-black transition-all cursor-pointer border border-[#C8CED6]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-[#433075] hover:bg-[#A58CF4] text-[#FAFAFA] hover:text-[#0D0D0D] font-black shadow-md transition-all cursor-pointer active:scale-95 border border-transparent hover:border-[#0D0D0D]"
                  >
                    Register Term in Vault
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
