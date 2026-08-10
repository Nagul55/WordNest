"use client";

import React, { useState, useEffect } from "react";
import { 
  Folder, 
  Plus, 
  ArrowLeft, 
  Trash2, 
  FolderOpen, 
  Search, 
  ImageIcon, 
  X, 
  Upload, 
  BookOpen,
  Loader2,
  XCircle,
  Sparkles,
  Pencil
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import CustomFolder from "@/components/Folder";
import { searchUnsplash, fetchWordDefinition } from "@/lib/api";

interface Word {
  id: string;
  word: string;
  meaning: string;
  image?: string; // base64, URL, or CSS gradient
  created_at: string;
}

interface Deck {
  id: string;
  name: string;
  description: string;
  words: Word[];
  colorGradient: string;
  created_at: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const CURATED_GRADIENTS = [
  "linear-gradient(135deg, #f5576c 0%, #f093fb 100%)",
  "linear-gradient(135deg, #f6d365 0%, #fda085 100%)",
  "linear-gradient(135deg, #5ee7df 0%, #b490ca 100%)",
  "linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)",
  "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
  "linear-gradient(135deg, #7028e4 0%, #e20b8c 100%)",
  "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
  "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
  "linear-gradient(135deg, #f3e7e9 0%, #e3eeff 100%)",
  "linear-gradient(135deg, #0f2027 0%, #203a43 100%)",
  "linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)",
  "linear-gradient(135deg, #8a2387 0%, #e94057 50%, #f27121 100%)"
];

const CURATED_TEXTURES = [
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1517842645767-c639042777db?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533090161767-e6ffed986c88?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop"
];

export default function DecksSection({ 
  user,
  prefetchedDecks,
  prefetchedFlashcards
}: { 
  user: any;
  prefetchedDecks?: any[] | null;
  prefetchedFlashcards?: any[] | null;
}) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openFolderId, setOpenFolderId] = useState<string | null>(null);
  
  const getFolderColor = (gradient: string) => {
    if (gradient.includes("433075")) return "#433075";
    if (gradient.includes("A58CF4")) return "#A58CF4";
    if (gradient.includes("4f46e5")) return "#4f46e5";
    if (gradient.includes("272A3B")) return "#272A3B";
    return "#5227FF";
  };

  const handleCardClick = (deckId: string) => {
    setOpenFolderId(deckId);
    setTimeout(() => {
      window.location.hash = `deck-${deckId}`;
      setSearchQuery("");
      setOpenFolderId(null);
    }, 450);
  };
  
  // UX loaders
  const [isLoadingDecks, setIsLoadingDecks] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isGeneratingDefinition, setIsGeneratingDefinition] = useState(false);
  
  // Modals state
  const [isNewDeckOpen, setIsNewDeckOpen] = useState(false);
  const [isNewWordOpen, setIsNewWordOpen] = useState(false);

  // Edit Deck states
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [editDeckForm, setEditDeckForm] = useState({ name: "", description: "" });

  // Edit Word states
  const [isEditWordOpen, setIsEditWordOpen] = useState(false);
  const [editingWord, setEditingWord] = useState<Word | null>(null);
  const [editWordForm, setEditWordForm] = useState({ word: "", meaning: "", imageType: "url" as "url" | "upload", imageUrl: "", imageFile: "" });
  const [editImageSelectorOpen, setEditImageSelectorOpen] = useState(false);
  const [editImageTab, setEditImageTab] = useState<"gallery" | "upload" | "link" | "unsplash">("gallery");
  const [editUnsplashSearchQuery, setEditUnsplashSearchQuery] = useState("");
  const [editUnsplashImages, setEditUnsplashImages] = useState<any[]>([]);
  const [isEditUnsplashSearching, setIsEditUnsplashSearching] = useState(false);
  
  // Custom image editor popover states
  const [imageSelectorOpen, setImageSelectorOpen] = useState(false);
  const [imageTab, setImageTab] = useState<"gallery" | "upload" | "link" | "unsplash">("gallery");
  const [unsplashSearchQuery, setUnsplashSearchQuery] = useState("");
  const [unsplashImages, setUnsplashImages] = useState<any[]>([]);
  const [isUnsplashSearching, setIsUnsplashSearching] = useState(false);

  // Forms state
  const [deckForm, setDeckForm] = useState({ name: "", description: "" });
  const [wordForm, setWordForm] = useState({ word: "", meaning: "", imageType: "url" as "url" | "upload", imageUrl: "", imageFile: "" });

  // Load decks and words with offline-first resilient storage strategy
  useEffect(() => {
    if (!user) return;
    
    const localKey = `wordnest_decks_${user.id}`;
    
    // Check if preloaded props exist to skip DB round-trip
    if (prefetchedDecks !== undefined && prefetchedDecks !== null && prefetchedFlashcards !== undefined && prefetchedFlashcards !== null) {
      const mapped = prefetchedDecks.map(set => {
        const cards = prefetchedFlashcards.filter(c => c.set_id === set.id);
        return {
          id: set.id,
          name: set.title,
          description: set.description || "",
          colorGradient: set.category && set.category.startsWith("from-") 
            ? set.category 
            : "from-[#433075] to-[#272A3B]",
          words: cards.map((c: any) => ({
            id: c.id,
            word: c.term,
            meaning: c.definition,
            image: c.image_url || undefined,
            created_at: c.created_at
          })),
          created_at: set.created_at
        };
      });
      setDecks(mapped);
      setIsLoadingDecks(false);
      localStorage.setItem(localKey, JSON.stringify(mapped));
      return;
    }

    // 1. Instantly load from localStorage if available for immediate rendering
    try {
      const cached = localStorage.getItem(localKey);
      if (cached) {
        setDecks(JSON.parse(cached));
        setIsLoadingDecks(false);
      }
    } catch (e) {
      console.warn("Failed to load cached decks:", e);
    }

    const fetchDecks = async () => {
      try {
        const { data: sets, error: setsError } = await supabase
          .from("study_sets")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true });

        if (setsError) throw setsError;

        if (sets) {
          const decksWithWords = await Promise.all(
            sets.map(async (set) => {
              const { data: cards, error: cardsError } = await supabase
                .from("flashcards")
                .select("*")
                .eq("set_id", set.id)
                .eq("user_id", user.id)
                .order("created_at", { ascending: true });

              if (cardsError) {
                console.warn("Notice loading cards for deck:", set.id, cardsError);
              }

              return {
                id: set.id,
                name: set.title,
                description: set.description || "",
                colorGradient: set.category && set.category.startsWith("from-") 
                  ? set.category 
                  : "from-[#433075] to-[#272A3B]",
                words: (cards || []).map((c) => ({
                  id: c.id,
                  word: c.term,
                  meaning: c.definition,
                  image: c.image_url || undefined,
                  created_at: c.created_at
                })),
                created_at: set.created_at
              };
            })
          );

          setDecks(decksWithWords);
          setDbError(null);
          // Sync with local cache
          localStorage.setItem(localKey, JSON.stringify(decksWithWords));
        }
      } catch (err: any) {
        console.warn("Database sync notice (falling back to local cache):", err);
        const cached = localStorage.getItem(localKey);
        if (!cached) {
          // If no network and no local decks, start with clean empty state without crashing UI
          setDecks([]);
        }
      } finally {
        setIsLoadingDecks(false);
      }
    };

    fetchDecks();
  }, [user]);

  // Clipboard Paste listener for Upload tab in Image Selector
  useEffect(() => {
    if (!isNewWordOpen || imageTab !== "upload") return;
    
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              handleImageFile(file);
            }
          }
        }
      }
    };
    
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isNewWordOpen, imageTab]);

  // Real-time listener for vocabulary term with 1s debounce
  useEffect(() => {
    const term = wordForm.word.trim();
    if (!term || term.length < 2) {
      // Clear fields if the term is erased
      setUnsplashImages([]);
      setWordForm(prev => ({ ...prev, meaning: "", imageUrl: "", imageFile: "" }));
      return;
    }

    const timer = setTimeout(async () => {
      // 1. Fetch AI definition (Groq) and overwrite definition
      setIsGeneratingDefinition(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/definition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: term })
        });
        const data = await res.json();
        if (data.status === "success" && data.definition) {
          setWordForm(prev => ({ ...prev, meaning: data.definition }));
        }
      } catch (err) {
        console.error("AI definition generation error:", err);
      } finally {
        setIsGeneratingDefinition(false);
      }

      // 2. Fetch Unsplash images for the new term and force-update the cover image preview
      setIsUnsplashSearching(true);
      try {
        const results = await searchUnsplash(term);
        if (results && results.length > 0) {
          setUnsplashImages(results);
          
          // Force update the cover preview with the first Unsplash image of the new word
          setWordForm(prev => ({ 
            ...prev, 
            imageUrl: results[0].url,
            imageFile: "" // Clear local uploads when term changes
          }));
        }
      } catch (err) {
        console.error("Auto Unsplash search error:", err);
      } finally {
        setIsUnsplashSearching(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [wordForm.word]);

  // Sync view state with browser URL Hash (enables browser Back/Forward/Reload buttons)
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith("#deck-")) {
        const remaining = hash.replace("#deck-", "");
        if (remaining.endsWith("-add")) {
          const deckId = remaining.replace("-add", "");
          setSelectedDeckId(deckId);
          setIsNewWordOpen(true);
        } else {
          setSelectedDeckId(remaining);
          setIsNewWordOpen(false);
        }
      } else {
        setSelectedDeckId(null);
        setIsNewWordOpen(false);
      }
    };

    handleHashChange(); // Run on mount

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  // Persist local state changes automatically
  useEffect(() => {
    if (!user || isLoadingDecks) return;
    try {
      localStorage.setItem(`wordnest_decks_${user.id}`, JSON.stringify(decks));
    } catch (e) {
      console.warn("Failed to persist decks locally:", e);
    }
  }, [decks, user, isLoadingDecks]);

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deckForm.name.trim() || !user) return;

    const gradients = [
      "from-[#433075] to-[#272A3B]",
      "from-[#272A3B] to-[#0D0D0D]",
      "from-[#736A86] to-[#433075]",
      "from-[#4f46e5] to-[#272A3B]",
      "from-[#A58CF4] to-[#433075]"
    ];
    const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
    const tempId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "deck_" + Date.now();

    setIsSubmitting(true);
    let newDeck: Deck = {
      id: tempId,
      name: deckForm.name.trim(),
      description: deckForm.description.trim() || "No description provided.",
      colorGradient: randomGradient,
      words: [],
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase
        .from("study_sets")
        .insert({
          title: deckForm.name.trim(),
          description: deckForm.description.trim() || "No description provided.",
          user_id: user.id,
          category: randomGradient,
          is_public: true
        })
        .select()
        .single();

      if (!error && data) {
        newDeck.id = data.id;
        newDeck.created_at = data.created_at;
      }
    } catch (err: any) {
      console.warn("Notice: Created deck locally due to network sync exception:", err);
    } finally {
      setDecks(prev => [...prev, newDeck]);
      (window as any).wordnestNotify?.("Deck Created", `Deck "${deckForm.name.trim()}" has been created successfully.`, "success");
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wordnest-data-changed"));
      }
      setDeckForm({ name: "", description: "" });
      setIsNewDeckOpen(false);
      setIsSubmitting(false);
    }
  };

  const handleDeleteDeck = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    const deckName = decks.find(d => d.id === id)?.name || "Folder";
    setDecks(prev => prev.filter(d => d.id !== id));
    if (selectedDeckId === id) setSelectedDeckId(null);
    (window as any).wordnestNotify?.("Deck Deleted", `"${deckName}" and all of its terms have been deleted.`, "warning");

    try {
      await supabase
        .from("study_sets")
        .delete()
        .eq("id", id);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("wordnest-data-changed"));
      }
    } catch (err: any) {
      console.warn("Notice: Deleted deck locally due to network sync exception:", err);
    }
  };

  const handleAddWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordForm.word.trim() || !wordForm.meaning.trim() || !selectedDeckId || !user) return;

    const imageSource = wordForm.imageFile || wordForm.imageUrl.trim();
    const tempWordId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "word_" + Date.now();

    setIsSubmitting(true);
    let newWord: Word = {
      id: tempWordId,
      word: wordForm.word.trim(),
      meaning: wordForm.meaning.trim(),
      image: imageSource || undefined,
      created_at: new Date().toISOString()
    };

    try {
      let insertResult = await supabase
        .from("flashcards")
        .insert({
          set_id: selectedDeckId,
          user_id: user.id,
          term: wordForm.word.trim(),
          definition: wordForm.meaning.trim(),
          image_url: imageSource || null
        })
        .select()
        .single();

      if (insertResult.error && (insertResult.error.message?.includes("user_id") || insertResult.error.code === "PGRST204" || insertResult.error.details?.includes("user_id"))) {
        insertResult = await supabase
          .from("flashcards")
          .insert({
            set_id: selectedDeckId,
            term: wordForm.word.trim(),
            definition: wordForm.meaning.trim(),
            image_url: imageSource || null
          })
          .select()
          .single();
      }

      if (!insertResult.error && insertResult.data) {
        newWord.id = insertResult.data.id;
        newWord.created_at = insertResult.data.created_at;
      }
    } catch (err: any) {
      console.warn("Notice: Added term locally due to network sync exception:", err);
    } finally {
      setDecks(prev => prev.map(d => {
        if (d.id === selectedDeckId) {
          return { ...d, words: [...d.words, newWord] };
        }
        return d;
      }));

      (window as any).wordnestNotify?.("Word Added", `"${wordForm.word.trim()}" has been added to your deck.`, "success");
      setWordForm({ word: "", meaning: "", imageType: "url", imageUrl: "", imageFile: "" });
      setUnsplashImages([]);
      setImageSelectorOpen(false);
      window.location.hash = `deck-${selectedDeckId}`;
      setIsSubmitting(false);
    }
  };

  const handleDeleteWord = async (wordId: string) => {
    const deck = decks.find(d => d.id === selectedDeckId);
    const wordText = deck?.words.find(w => w.id === wordId)?.word || "Term";
    
    setDecks(prev => prev.map(d => {
      if (d.id === selectedDeckId) {
        return { ...d, words: d.words.filter(w => w.id !== wordId) };
      }
      return d;
    }));
    (window as any).wordnestNotify?.("Word Removed", `"${wordText}" has been deleted from your folder.`, "warning");

    try {
      await supabase
        .from("flashcards")
        .delete()
        .eq("id", wordId);
    } catch (err: any) {
      console.warn("Notice: Deleted term locally due to network sync exception:", err);
    }
  };

  const handleOpenEditDeckModal = (deck: Deck) => {
    setEditingDeck(deck);
    setEditDeckForm({ name: deck.name, description: deck.description });
    setIsEditDeckOpen(true);
  };

  const handleEditDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDeck || !editDeckForm.name.trim() || !user) return;

    setIsSubmitting(true);
    try {
      await supabase
        .from("study_sets")
        .update({
          title: editDeckForm.name.trim(),
          description: editDeckForm.description.trim()
        })
        .eq("id", editingDeck.id);

      setDecks(prev => prev.map(d => {
        if (d.id === editingDeck.id) {
          return {
            ...d,
            name: editDeckForm.name.trim(),
            description: editDeckForm.description.trim()
          };
        }
        return d;
      }));

      (window as any).wordnestNotify?.("Deck Updated", `Deck details updated successfully.`, "success");
      setIsEditDeckOpen(false);
      setEditingDeck(null);
    } catch (err) {
      console.warn("Failed to edit deck:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditWordModal = (word: Word) => {
    setEditingWord(word);
    setEditWordForm({
      word: word.word,
      meaning: word.meaning,
      imageType: "url",
      imageUrl: word.image && !word.image.startsWith("linear-gradient") ? word.image : "",
      imageFile: ""
    });
    setIsEditWordOpen(true);
  };

  const handleEditWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWord || !editWordForm.word.trim() || !editWordForm.meaning.trim() || !selectedDeckId || !user) return;

    setIsSubmitting(true);
    const imageSource = editWordForm.imageFile || editWordForm.imageUrl.trim() || null;

    try {
      await supabase
        .from("flashcards")
        .update({
          term: editWordForm.word.trim(),
          definition: editWordForm.meaning.trim(),
          image_url: imageSource
        })
        .eq("id", editingWord.id);

      setDecks(prev => prev.map(d => {
        if (d.id === selectedDeckId) {
          return {
            ...d,
            words: d.words.map(w => {
              if (w.id === editingWord.id) {
                return {
                  ...w,
                  word: editWordForm.word.trim(),
                  meaning: editWordForm.meaning.trim(),
                  image: imageSource || undefined
                };
              }
              return w;
            })
          };
        }
        return d;
      }));

      (window as any).wordnestNotify?.("Word Updated", `Word details updated successfully.`, "success");
      setIsEditWordOpen(false);
      setEditingWord(null);
    } catch (err) {
      console.warn("Failed to edit word:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setWordForm(prev => ({ ...prev, imageFile: reader.result as string, imageUrl: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditImageFile = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setEditWordForm(prev => ({ ...prev, imageFile: reader.result as string, imageUrl: "" }));
    };
    reader.readAsDataURL(file);
  };

  const handleEditUnsplashSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsEditUnsplashSearching(true);
    try {
      const results = await searchUnsplash(query);
      if (results && results.length > 0) {
        setEditUnsplashImages(results);
      }
    } catch (err) {
      console.error("Edit Unsplash search error:", err);
    } finally {
      setIsEditUnsplashSearching(false);
    }
  };

  // Clipboard Paste listener for Edit Word Modal
  useEffect(() => {
    if (!isEditWordOpen || editImageTab !== "upload") return;
    
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (items) {
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const file = items[i].getAsFile();
            if (file) {
              handleEditImageFile(file);
            }
          }
        }
      }
    };
    
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [isEditWordOpen, editImageTab]);

  // AI auto-generate definition helper
  const handleAutoDefine = async (termToDefine?: string) => {
    const targetWord = termToDefine || wordForm.word.trim();
    if (!targetWord) return;

    setIsGeneratingDefinition(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/definition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: targetWord })
      });
      const data = await res.json();
      if (data.status === "success" && data.definition) {
        setWordForm(prev => ({ ...prev, meaning: data.definition }));
      }
    } catch (err) {
      console.error("AI definition generation error:", err);
    } finally {
      setIsGeneratingDefinition(false);
    }
  };

  // Unsplash search helper
  const handleUnsplashSearch = async (query: string) => {
    if (!query.trim()) return;
    setIsUnsplashSearching(true);
    try {
      const results = await searchUnsplash(query);
      if (results && results.length > 0) {
        setUnsplashImages(results);
      }
    } catch (err) {
      console.error("Unsplash search error:", err);
    } finally {
      setIsUnsplashSearching(false);
    }
  };

  // Automatically fetch definition and prefetch image when user types term & blurs/focus-outs
  const handleTermBlur = async () => {
    const term = wordForm.word.trim();
    if (!term) return;

    // 1. Trigger AI definition generate if field is currently empty
    if (!wordForm.meaning.trim()) {
      handleAutoDefine(term);
    }

    // 2. Trigger auto Unsplash image prefetch
    setIsUnsplashSearching(true);
    try {
      const results = await searchUnsplash(term);
      if (results && results.length > 0) {
        setUnsplashImages(results);
        
        // Auto-select the first regular image returned if no cover selected yet
        if (!wordForm.imageUrl && !wordForm.imageFile) {
          setWordForm(prev => ({ ...prev, imageUrl: results[0].url }));
        }
      }
    } catch (err) {
      console.error("Auto Unsplash search error:", err);
    } finally {
      setIsUnsplashSearching(false);
    }
  };

  // Real-time listener for edit vocabulary term with 1s debounce
  useEffect(() => {
    const term = editWordForm.word.trim();
    if (!isEditWordOpen || !term || term.length < 2) return;

    // Check if the term has actually changed from the original word
    const hasWordChanged = term.toLowerCase() !== editingWord?.word.toLowerCase();
    if (!hasWordChanged) return;

    const timer = setTimeout(async () => {
      setIsGeneratingDefinition(true);
      try {
        const res = await fetch(`${API_BASE_URL}/api/ai/definition`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ word: term })
        });
        const data = await res.json();
        if (data.status === "success" && data.definition) {
          setEditWordForm(prev => ({ ...prev, meaning: data.definition }));
        }
      } catch (err) {
        console.error("AI definition generation error:", err);
      } finally {
        setIsGeneratingDefinition(false);
      }

      setIsEditUnsplashSearching(true);
      try {
        const results = await searchUnsplash(term);
        if (results && results.length > 0) {
          setEditUnsplashImages(results);
          // Auto-select the first matching image for the new word
          setEditWordForm(prev => ({ ...prev, imageUrl: results[0].url, imageFile: "" }));
        }
      } catch (err) {
        console.error("Auto Unsplash search error:", err);
      } finally {
        setIsEditUnsplashSearching(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [editWordForm.word, isEditWordOpen, editingWord]);

  const handleEditAutoDefine = async (termToDefine?: string) => {
    const targetWord = termToDefine || editWordForm.word.trim();
    if (!targetWord) return;

    setIsGeneratingDefinition(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/definition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: targetWord })
      });
      const data = await res.json();
      if (data.status === "success" && data.definition) {
        setEditWordForm(prev => ({ ...prev, meaning: data.definition }));
      }
    } catch (err) {
      console.error("AI definition generation error:", err);
    } finally {
      setIsGeneratingDefinition(false);
    }
  };

  const handleEditTermBlur = async () => {
    const term = editWordForm.word.trim();
    if (!term) return;

    const hasWordChanged = term.toLowerCase() !== editingWord?.word.toLowerCase();
    if (!hasWordChanged) return;

    handleEditAutoDefine(term);

    setIsEditUnsplashSearching(true);
    try {
      const results = await searchUnsplash(term);
      if (results && results.length > 0) {
        setEditUnsplashImages(results);
        setEditWordForm(prev => ({ ...prev, imageUrl: results[0].url, imageFile: "" }));
      }
    } catch (err) {
      console.error("Auto Unsplash search error:", err);
    } finally {
      setIsEditUnsplashSearching(false);
    }
  };

  const activeDeck = decks.find(d => d.id === selectedDeckId);
  const filteredWords = activeDeck
    ? activeDeck.words.filter(w =>
        w.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        w.meaning.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const previewImage = wordForm.imageFile || wordForm.imageUrl;

  return (
    <div className="space-y-8 pb-12 text-[#0D0D0D]">
      {dbError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-xs font-semibold leading-relaxed mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-rose-500 shrink-0" />
            <span>
              {dbError.includes("42P01") || dbError.includes("does not exist") || dbError.includes("schema cache") ? (
                <>
                  <strong>Database Table Missing:</strong> Please run the SQL schema initialization script inside <a href="/c:/Users/nagul/Documents/GitHub/WordNest/supabase/schema.sql" className="underline text-rose-600 hover:text-rose-800 font-bold">supabase/schema.sql</a> in your Supabase Dashboard &rarr; SQL Editor to create the <code>study_sets</code> and <code>flashcards</code> tables!
                </>
              ) : (
                <><strong>Database Sync Error:</strong> {dbError}</>
              )}
            </span>
          </div>
          <button onClick={() => setDbError(null)} className="text-rose-500 hover:text-rose-700 font-bold ml-2 cursor-pointer">Dismiss</button>
        </div>
      )}

      <AnimatePresence mode="wait">
        {isLoadingDecks ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-20 space-y-4"
          >
            <Loader2 className="w-8 h-8 animate-spin text-[#433075]" />
            <p className="text-xs font-black text-[#736A86] tracking-wider uppercase">Syncing Decks from database...</p>
          </motion.div>
        ) : !selectedDeckId ? (
          // ==========================================
          // DECKS LIST VIEW
          // ==========================================
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-[#C8CED6]/40 shadow-sm">
              <div className="space-y-1">
                <h1 className="text-3xl font-black tracking-tight text-[#433075]">Decks Library</h1>
                <p className="text-sm text-[#736A86] font-medium leading-relaxed">
                  Manage your custom vocabulary folders, bundle specific terms, and review visual aids.
                </p>
              </div>
              <button
                id="tour-create-deck-btn"
                onClick={() => setIsNewDeckOpen(true)}
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs transition-all duration-300 shadow-md shadow-[#433075]/20 cursor-pointer active:scale-95 border border-[#A58CF4]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Create New Deck</span>
              </button>
            </div>

            {/* Decks Grid */}
            {decks.length === 0 ? (
              <div className="bg-white/60 p-12 rounded-3xl text-center border-2 border-dashed border-[#C8CED6] space-y-4 max-w-md mx-auto mt-10">
                <Folder className="w-12 h-12 text-[#736A86] mx-auto opacity-60" />
                <h3 className="text-lg font-black text-[#272A3B]">No Decks Found</h3>
                <p className="text-xs text-[#736A86] leading-relaxed">
                  It looks like you don't have any vocabulary decks yet. Create your first folder to organize your words.
                </p>
                <button
                  onClick={() => setIsNewDeckOpen(true)}
                  className="px-4 py-2 bg-[#433075] text-white font-black text-xs rounded-xl hover:bg-[#A58CF4] hover:text-[#0D0D0D] transition-all cursor-pointer"
                >
                  Create First Deck
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 {decks.map(deck => (
                  <div
                    key={deck.id}
                    onClick={() => handleCardClick(deck.id)}
                    className="group relative flex flex-col justify-between p-6 rounded-3xl bg-white border border-[#C8CED6]/40 shadow-sm hover:shadow-md transition-all duration-300 cursor-pointer overflow-hidden border-b-4 border-b-[#433075]"
                  >
                    <div className="space-y-4">
                      {/* Top Row: Animated Folder Component + Count */}
                      <div className="flex items-center justify-between">
                        <div className="w-[50px] h-[40px] flex items-center justify-start overflow-visible pointer-events-none">
                          <CustomFolder 
                            size={0.45} 
                            color={getFolderColor(deck.colorGradient)} 
                            open={openFolderId === deck.id}
                          />
                        </div>
                        <span className="text-[10px] bg-[#F7F7F7] border border-[#C8CED6]/40 text-[#433075] px-2.5 py-1 rounded-full font-black uppercase tracking-wider">
                          {deck.words.length} {deck.words.length === 1 ? "Word" : "Words"}
                        </span>
                      </div>
                      
                      {/* Mid: Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="text-xl font-black tracking-tight text-[#0D0D0D] group-hover:text-[#433075] transition-colors duration-200 uppercase ">
                          {deck.name}
                        </h3>
                        <p className="text-xs text-[#736A86] line-clamp-2 leading-relaxed font-normal">
                          {deck.description}
                        </p>
                      </div>
                    </div>

                    {/* Bottom: Folder link & Delete */}
                    <div className="flex items-center justify-between pt-6 mt-6 border-t border-[#C8CED6]/30">
                      <span className="text-[11px] font-black text-[#433075] uppercase tracking-wider flex items-center gap-1 group-hover:underline">
                        <span>Open Folder</span>
                        <ArrowLeft className="w-3.5 h-3.5 rotate-180" />
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenEditDeckModal(deck);
                          }}
                          className="p-2 text-[#8E97A6] hover:text-[#433075] rounded-xl hover:bg-indigo-50 transition-all cursor-pointer"
                          title="Edit Deck"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDeleteDeck(deck.id, e)}
                          className="p-2 text-[#8E97A6] hover:text-red-500 rounded-xl hover:bg-red-50 transition-all cursor-pointer"
                          title="Delete Deck"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          // ==========================================
          // DECK DETAIL VIEW
          // ==========================================
          <motion.div
            key="detail"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25 }}
            className="space-y-6"
          >
            {/* Nav Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/40 backdrop-blur-md p-6 rounded-3xl border border-[#C8CED6]/40 shadow-sm">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => {
                    window.location.hash = "";
                    setSelectedDeckId(null);
                  }}
                  className="p-3 rounded-2xl bg-white border border-[#C8CED6]/40 hover:border-[#433075] text-[#736A86] hover:text-[#433075] transition-all cursor-pointer shadow-sm hover:shadow active:scale-95"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-black tracking-tight text-[#433075] uppercase">{activeDeck?.name}</h1>
                    <button
                      onClick={() => activeDeck && handleOpenEditDeckModal(activeDeck)}
                      className="p-1.5 text-[#736A86] hover:text-[#433075] hover:bg-white rounded-lg transition-all cursor-pointer border border-transparent hover:border-[#C8CED6]/40"
                      title="Edit Deck Title/Description"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <span className="text-[10px] bg-[#433075] text-white px-2 py-0.5 rounded-md font-black">DECK</span>
                  </div>
                  <p className="text-xs text-[#736A86] font-medium leading-relaxed max-w-xl">
                    {activeDeck?.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setWordForm({ word: "", meaning: "", imageType: "url", imageUrl: "", imageFile: "" });
                  setUnsplashImages([]);
                  setImageSelectorOpen(false);
                  window.location.hash = `deck-${selectedDeckId}-add`;
                }}
                className="shrink-0 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs transition-all duration-300 shadow-md shadow-[#433075]/20 cursor-pointer active:scale-95 border border-[#A58CF4]/20"
              >
                <Plus className="w-4 h-4" />
                <span>Add Word to Deck</span>
              </button>
            </div>

            {/* Search Bar / Words Stats */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-3xl border border-[#C8CED6]/40 shadow-sm">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-[#8E97A6] pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search terms or definitions inside this folder..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-[#F7F7F7] border border-transparent hover:border-[#C8CED6]/60 focus:border-[#433075] focus:outline-none text-xs text-[#0D0D0D] font-semibold transition-all"
                />
              </div>
              <span className="text-xs font-bold text-[#736A86] px-4 py-2 bg-[#F7F7F7] rounded-xl shrink-0">
                Displaying {filteredWords.length} of {activeDeck?.words.length || 0} terms
              </span>
            </div>

            {/* Words Grid */}
            {filteredWords.length === 0 ? (
              <div className="bg-white/60 p-12 rounded-3xl text-center border border-[#C8CED6]/40 space-y-4 max-w-md mx-auto mt-10">
                <BookOpen className="w-12 h-12 text-[#736A86] mx-auto opacity-60" />
                <h3 className="text-lg font-black text-[#272A3B]">No Terms Match</h3>
                <p className="text-xs text-[#736A86] leading-relaxed">
                  {activeDeck?.words.length === 0 
                    ? "This folder is empty. Start adding words with custom descriptions and visual aids now!" 
                    : "No words in this deck match your active search filter query."}
                </p>
                {activeDeck?.words.length === 0 && (
                  <button
                    onClick={() => {
                      setWordForm({ word: "", meaning: "", imageType: "url", imageUrl: "", imageFile: "" });
                      setUnsplashImages([]);
                      setImageSelectorOpen(false);
                      window.location.hash = `deck-${selectedDeckId}-add`;
                    }}
                    className="px-4 py-2 bg-[#433075] text-white font-black text-xs rounded-xl hover:bg-[#A58CF4] hover:text-[#0D0D0D] transition-all cursor-pointer"
                  >
                    Add Your First Word
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredWords.map(word => (
                  <div
                    key={word.id}
                    className="group flex flex-col justify-between rounded-3xl bg-white border border-[#C8CED6]/40 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    {/* Visual Aid Header */}
                    <div className="relative w-full h-40 bg-gradient-to-br from-[#DFE3E8] to-[#C8CED6] border-b border-[#C8CED6]/40 overflow-hidden">
                      {word.image ? (
                        word.image.startsWith("linear-gradient") || word.image.startsWith("rgba") || word.image.startsWith("#") ? (
                          <div 
                            style={{ background: word.image }} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                          />
                        ) : (
                          <img
                            src={word.image}
                            alt={`Visual aid for ${word.word}`}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        )
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-[#736A86]/50 bg-gradient-to-br from-[#433075]/10 via-[#736A86]/5 to-transparent space-y-1 select-none">
                          <ImageIcon className="w-8 h-8 opacity-60" />
                          <span className="text-[10px] font-black tracking-wider uppercase">Default Gradient Art</span>
                        </div>
                      )}
                    </div>

                    {/* Word Metadata */}
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <h3 className="text-xl font-black text-[#0D0D0D] tracking-tight uppercase group-hover:text-[#433075] transition-colors">
                          {word.word}
                        </h3>
                        <p className="text-xs text-[#736A86] leading-relaxed font-normal text-left text-wrap max-w-full truncate overflow-ellipsis">
                          {word.meaning}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-[#C8CED6]/30">
                        <span className="text-[10px] text-[#8E97A6] font-bold">
                          Added {new Date(word.created_at).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEditWordModal(word)}
                            className="p-2 text-[#8E97A6] hover:text-[#433075] hover:bg-indigo-50 rounded-xl transition-all cursor-pointer"
                            title="Edit Word"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteWord(word.id)}
                            className="p-2 text-[#8E97A6] hover:text-red-500 hover:bg-red-50 rounded-xl transition-all cursor-pointer"
                            title="Delete Word"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: ADD NEW DECK
          ========================================== */}
      <AnimatePresence>
        {isNewDeckOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-xl border border-white/60 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl space-y-5 sm:space-y-6 text-left"
            >
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#C8CED6]/40">
                <h3 className="text-xl sm:text-2xl font-black text-[#433075] tracking-tight">Create New Deck</h3>
                <button
                  onClick={() => setIsNewDeckOpen(false)}
                  className="p-1.5 sm:p-2 text-[#736A86] hover:text-[#433075] rounded-xl hover:bg-black/5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateDeck} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Deck Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Academic Vocabulary"
                    value={deckForm.name}
                    onChange={(e) => setDeckForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Write a brief overview of the deck purpose..."
                    value={deckForm.description}
                    onChange={(e) => setDeckForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setIsNewDeckOpen(false)}
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl border border-[#C8CED6] hover:bg-[#F7F7F7] hover:border-[#736A86] text-[#736A86] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer shadow-lg shadow-[#433075]/15 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Create Deck</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: ADD WORD TO DECK
          ========================================== */}
      <AnimatePresence>
        {isNewWordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-hide no-scrollbar custom-scrollbar bg-white/95 backdrop-blur-xl border border-white/60 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl space-y-4 sm:space-y-6 text-left"
            >
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#C8CED6]/40">
                <h3 className="text-xl sm:text-2xl font-black text-[#433075] tracking-tight">Add Word to Folder</h3>
                <button
                  onClick={() => { window.location.hash = `deck-${selectedDeckId}`; }}
                  className="p-1.5 sm:p-2 text-[#736A86] hover:text-[#433075] rounded-xl hover:bg-black/5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleAddWord} className="space-y-3.5 sm:space-y-4">
                {/* Word Input */}
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Vocabulary Term</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Cacophony"
                    value={wordForm.word}
                    onChange={(e) => setWordForm(prev => ({ ...prev, word: e.target.value }))}
                    onBlur={handleTermBlur}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300"
                  />
                </div>

                {/* Definition Input */}
                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider">Definition / Meaning</label>
                    <button
                      type="button"
                      onClick={() => handleAutoDefine()}
                      disabled={isGeneratingDefinition || !wordForm.word.trim()}
                      className="text-[11px] sm:text-xs font-black text-[#433075] hover:text-[#A58CF4] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingDefinition ? (
                        <Loader2 className="w-3 h-3 animate-spin text-current" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#433075]" />
                      )}
                      <span>Auto-Generate (AI)</span>
                    </button>
                  </div>
                  <textarea
                    rows={2}
                    required
                    placeholder="Write the clear definition or click Auto-Generate..."
                    value={wordForm.meaning}
                    onChange={(e) => setWordForm(prev => ({ ...prev, meaning: e.target.value }))}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300 resize-none"
                  />
                </div>

                {/* Cover Image Visual Preview Area with Overlay Selector */}
                <div className="space-y-1.5 sm:space-y-2 relative">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Cover Image</label>
                  
                  <div className="relative w-full h-32 sm:h-40 rounded-2xl border border-[#C8CED6]/50 overflow-hidden group shadow-sm bg-gradient-to-br from-[#DFE3E8] to-[#C8CED6]">
                    {previewImage ? (
                      previewImage.startsWith("linear-gradient") || previewImage.startsWith("rgba") || previewImage.startsWith("#") ? (
                        <div 
                          style={{ background: previewImage }} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <img 
                          src={previewImage} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover" 
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#736A86]/50 space-y-1 select-none">
                        <ImageIcon className="w-8 h-8 opacity-60" />
                        <span className="text-xs font-black tracking-wider uppercase">No cover selected</span>
                      </div>
                    )}

                    {/* Float controls at top right */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => setImageSelectorOpen(!imageSelectorOpen)}
                        className="px-3 py-1.5 rounded-xl bg-[#0D0D0D]/75 text-white hover:bg-white hover:text-[#0D0D0D] font-bold text-[11px] transition-all duration-200 backdrop-blur-sm cursor-pointer shadow flex items-center gap-1"
                      >
                        Change
                      </button>
                      {previewImage && (
                        <button
                          type="button"
                          onClick={() => {
                            setWordForm(prev => ({ ...prev, imageUrl: "", imageFile: "" }));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600/75 text-white hover:bg-red-600 font-bold text-[11px] transition-all duration-200 backdrop-blur-sm cursor-pointer shadow"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabbed Image Selector Drawer (Notion style absolute overlay) */}
                  <AnimatePresence>
                    {imageSelectorOpen && (
                      <>
                        {/* Invisible full screen backdrop to catch clicks outside */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setImageSelectorOpen(false)} 
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-16 right-0 sm:right-3 w-[calc(100vw-2.5rem)] max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-[#1E202B] text-white border border-[#2A2E3D] shadow-2xl space-y-4"
                        >
                          {/* Tabs Navigation */}
                          <div className="flex items-center justify-between border-b border-[#2A2E3D] pb-2">
                            <div className="flex gap-4">
                              {(["gallery", "upload", "link", "unsplash"] as const).map(tab => (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={() => setImageTab(tab)}
                                  className={`text-xs font-bold uppercase pb-1 border-b-2 transition-all cursor-pointer ${
                                    imageTab === tab 
                                      ? "border-[#4facfe] text-white" 
                                      : "border-transparent text-[#8E97A6] hover:text-white"
                                  }`}
                                >
                                  {tab}
                                </button>
                              ))}
                            </div>
                            
                            {/* Close icon */}
                            <button
                              type="button"
                              onClick={() => setImageSelectorOpen(false)}
                              className="p-1 text-[#8E97A6] hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Close"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Content panel */}
                          <div className="min-h-[160px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {imageTab === "gallery" && (
                              <div className="space-y-4">
                                {/* Gradients */}
                                <div className="space-y-1.5 text-left">
                                  <h4 className="text-[11px] font-black text-[#8E97A6] uppercase tracking-wider pl-1">Color and Gradient</h4>
                                  <div className="grid grid-cols-4 gap-2">
                                    {CURATED_GRADIENTS.map((grad, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                          setWordForm(prev => ({ ...prev, imageUrl: grad, imageFile: "" }));
                                          setImageSelectorOpen(false);
                                        }}
                                        style={{ background: grad }}
                                        className={`h-10 rounded-xl hover:scale-105 transition-all cursor-pointer border ${
                                          wordForm.imageUrl === grad ? "border-white ring-2 ring-[#4facfe]" : "border-transparent"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {/* Textures */}
                                <div className="space-y-1.5 text-left">
                                  <h4 className="text-[11px] font-black text-[#8E97A6] uppercase tracking-wider pl-1">Texturelabs</h4>
                                  <div className="grid grid-cols-4 gap-2">
                                    {CURATED_TEXTURES.map((tex, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                          setWordForm(prev => ({ ...prev, imageUrl: tex, imageFile: "" }));
                                          setImageSelectorOpen(false);
                                        }}
                                        className={`h-10 rounded-xl hover:scale-105 transition-all cursor-pointer overflow-hidden relative border ${
                                          wordForm.imageUrl === tex ? "border-white ring-2 ring-[#4facfe]" : "border-transparent"
                                        }`}
                                      >
                                        <img src={tex} alt="Texture option" className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {imageTab === "upload" && (
                              <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) handleImageFile(file);
                                }}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2A2E3D] hover:border-[#4facfe] rounded-xl bg-[#14161F] transition-all group cursor-pointer relative"
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleImageFile(file);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="text-center space-y-2 pointer-events-none">
                                  {wordForm.imageFile ? (
                                    <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                                      <ImageIcon className="w-5 h-5" />
                                      <span>Uploaded successfully!</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="w-6 h-6 text-[#8E97A6] group-hover:text-white mx-auto transition-colors" />
                                      <span className="text-xs font-black text-[#8E97A6] block">Upload file</span>
                                      <span className="text-[10px] text-[#555] block">or Ctrl+V to paste an image</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {imageTab === "link" && (
                              <div className="space-y-3 pt-2">
                                <input
                                  type="url"
                                  placeholder="Paste an image link..."
                                  value={wordForm.imageUrl}
                                  onChange={(e) => setWordForm(prev => ({ ...prev, imageUrl: e.target.value, imageFile: "" }))}
                                  className="w-full px-4 py-2.5 rounded-xl bg-[#14161F] border border-[#2A2E3D] focus:border-[#4facfe] focus:outline-none text-xs text-white font-semibold transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => setImageSelectorOpen(false)}
                                  className="w-full py-2.5 rounded-xl bg-[#2b6cb0] hover:bg-[#3182ce] text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1 shadow"
                                >
                                  Submit
                                </button>
                                <p className="text-[10px] text-center text-[#8E97A6]">Works with any image from the web.</p>
                              </div>
                            )}

                            {imageTab === "unsplash" && (
                              <div className="space-y-3">
                                {/* Search bar */}
                                <div className="relative">
                                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8E97A6] pointer-events-none" />
                                  <input
                                    type="text"
                                    placeholder="Search for an image..."
                                    value={unsplashSearchQuery}
                                    onChange={(e) => setUnsplashSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleUnsplashSearch(unsplashSearchQuery);
                                      }
                                    }}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#14161F] border border-[#2A2E3D] focus:border-[#4facfe] focus:outline-none text-xs text-white font-semibold transition-all"
                                  />
                                </div>

                                {/* Images grid */}
                                {isUnsplashSearching ? (
                                  <div className="flex items-center justify-center py-10 space-y-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#4facfe]" />
                                  </div>
                                ) : unsplashImages.length === 0 ? (
                                  <p className="text-[10px] text-center text-[#8E97A6] py-10">No Unsplash images loaded. Type a term and focus out to auto-fetch, or search above.</p>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3">
                                    {unsplashImages.map((img) => (
                                      <div key={img.id} className="group/item space-y-1 text-left">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setWordForm(prev => ({ ...prev, imageUrl: img.url, imageFile: "" }));
                                            setImageSelectorOpen(false);
                                          }}
                                          className={`w-full h-24 rounded-xl overflow-hidden relative border ${
                                            wordForm.imageUrl === img.url ? "border-white ring-2 ring-[#4facfe]" : "border-transparent"
                                          } hover:scale-[1.02] transition-transform cursor-pointer`}
                                        >
                                          <img src={img.thumb} alt={img.alt_text} className="w-full h-full object-cover" />
                                        </button>
                                        <div className="text-[9px] text-[#8E97A6] truncate px-1">
                                          by{" "}
                                          <a
                                            href={img.author_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline hover:text-white"
                                          >
                                            {img.author}
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Dynamic layout spacer to push buttons down smoothly */}
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: imageSelectorOpen ? 270 : 0 }}
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                  className="overflow-hidden"
                />

                {/* Cancel & Submit Actions */}
                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => { window.location.hash = `deck-${selectedDeckId}`; }}
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl border border-[#C8CED6] hover:bg-[#F7F7F7] hover:border-[#736A86] text-[#736A86] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer shadow-lg shadow-[#433075]/15 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Add Word</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: EDIT DECK
          ========================================== */}
      <AnimatePresence>
        {isEditDeckOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-xl border border-white/60 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl space-y-5 sm:space-y-6 text-left"
            >
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#C8CED6]/40">
                <h3 className="text-xl sm:text-2xl font-black text-[#433075] tracking-tight">Edit Deck Details</h3>
                <button
                  onClick={() => setIsEditDeckOpen(false)}
                  className="p-1.5 sm:p-2 text-[#736A86] hover:text-[#433075] rounded-xl hover:bg-black/5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleEditDeck} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Deck Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Advanced Academic Vocabulary"
                    value={editDeckForm.name}
                    onChange={(e) => setEditDeckForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Write a brief overview of the deck purpose..."
                    value={editDeckForm.description}
                    onChange={(e) => setEditDeckForm(prev => ({ ...prev, description: e.target.value }))}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300 resize-none"
                  />
                </div>

                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditDeckOpen(false)}
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl border border-[#C8CED6] hover:bg-[#F7F7F7] hover:border-[#736A86] text-[#736A86] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer shadow-lg shadow-[#433075]/15 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Changes</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ==========================================
          MODAL: EDIT WORD
          ========================================== */}
      <AnimatePresence>
        {isEditWordOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar bg-white/95 backdrop-blur-xl border border-white/60 p-4 sm:p-8 rounded-[24px] sm:rounded-[32px] shadow-2xl space-y-5 sm:space-y-6 text-left"
            >
              <div className="flex items-center justify-between pb-3 sm:pb-4 border-b border-[#C8CED6]/40">
                <h3 className="text-xl sm:text-2xl font-black text-[#433075] tracking-tight">Edit Word Details</h3>
                <button
                  onClick={() => setIsEditWordOpen(false)}
                  className="p-1.5 sm:p-2 text-[#736A86] hover:text-[#433075] rounded-xl hover:bg-black/5 transition-all cursor-pointer"
                >
                  <X className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>

              <form onSubmit={handleEditWord} className="space-y-4 sm:space-y-5">
                <div className="space-y-1.5 sm:space-y-2">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Vocabulary Word</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ephemeral"
                    value={editWordForm.word}
                    onChange={(e) => setEditWordForm(prev => ({ ...prev, word: e.target.value }))}
                    onBlur={handleEditTermBlur}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <div className="flex items-center justify-between pl-1">
                    <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider">Definition / Meaning</label>
                    <button
                      type="button"
                      onClick={() => handleEditAutoDefine()}
                      disabled={isGeneratingDefinition || !editWordForm.word.trim()}
                      className="text-[11px] sm:text-xs font-black text-[#433075] hover:text-[#A58CF4] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingDefinition ? (
                        <Loader2 className="w-3 h-3 animate-spin text-current" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#433075]" />
                      )}
                      <span>Auto-Generate (AI)</span>
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    required
                    placeholder="Define the term in clear, simple language..."
                    value={editWordForm.meaning}
                    onChange={(e) => setEditWordForm(prev => ({ ...prev, meaning: e.target.value }))}
                    className="w-full px-4 py-3 sm:px-5 sm:py-3.5 rounded-2xl bg-white border border-[#C8CED6]/50 focus:border-[#433075] focus:outline-none text-xs sm:text-sm text-[#0D0D0D] font-black shadow-inner hover:border-[#736A86] focus:ring-4 focus:ring-[#A58CF4]/20 transition-all duration-300 resize-none animate-fadeIn"
                  />
                </div>

                {/* Cover Image Visual Preview Area with Overlay Selector */}
                <div className="space-y-1.5 sm:space-y-2 relative">
                  <label className="text-[11px] sm:text-[13px] font-black text-[#433075] uppercase tracking-wider pl-1">Cover Image</label>
                  
                  <div className="relative w-full h-32 sm:h-40 rounded-2xl border border-[#C8CED6]/50 overflow-hidden group shadow-sm bg-gradient-to-br from-[#DFE3E8] to-[#C8CED6]">
                    {(editWordForm.imageFile || editWordForm.imageUrl) ? (
                      (editWordForm.imageFile || editWordForm.imageUrl).startsWith("linear-gradient") || (editWordForm.imageFile || editWordForm.imageUrl).startsWith("rgba") || (editWordForm.imageFile || editWordForm.imageUrl).startsWith("#") ? (
                        <div 
                          style={{ background: editWordForm.imageFile || editWordForm.imageUrl }} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <img 
                          src={editWordForm.imageFile || editWordForm.imageUrl} 
                          alt="Cover preview" 
                          className="w-full h-full object-cover" 
                        />
                      )
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-[#736A86]/50 space-y-1 select-none">
                        <ImageIcon className="w-8 h-8 opacity-60" />
                        <span className="text-xs font-black tracking-wider uppercase">No cover selected</span>
                      </div>
                    )}

                    {/* Float controls at top right */}
                    <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
                      <button
                        type="button"
                        onClick={() => setEditImageSelectorOpen(!editImageSelectorOpen)}
                        className="px-3 py-1.5 rounded-xl bg-[#0D0D0D]/75 text-white hover:bg-white hover:text-[#0D0D0D] font-bold text-[11px] transition-all duration-200 backdrop-blur-sm cursor-pointer shadow flex items-center gap-1"
                      >
                        Change
                      </button>
                      {(editWordForm.imageFile || editWordForm.imageUrl) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditWordForm(prev => ({ ...prev, imageUrl: "", imageFile: "" }));
                          }}
                          className="px-3 py-1.5 rounded-xl bg-red-600/75 text-white hover:bg-red-600 font-bold text-[11px] transition-all duration-200 backdrop-blur-sm cursor-pointer shadow"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tabbed Image Selector Drawer (Notion style absolute overlay) */}
                  <AnimatePresence>
                    {editImageSelectorOpen && (
                      <>
                        {/* Invisible full screen backdrop to catch clicks outside */}
                        <div 
                          className="fixed inset-0 z-40 cursor-default" 
                          onClick={() => setEditImageSelectorOpen(false)} 
                        />
                        
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          className="absolute top-16 right-0 sm:right-3 w-[calc(100vw-2.5rem)] max-w-md z-50 p-4 sm:p-5 rounded-2xl bg-[#1E202B] text-white border border-[#2A2E3D] shadow-2xl space-y-4"
                        >
                          {/* Tabs Navigation */}
                          <div className="flex items-center justify-between border-b border-[#2A2E3D] pb-2">
                            <div className="flex gap-4">
                              {(["gallery", "upload", "link", "unsplash"] as const).map(tab => (
                                <button
                                  key={tab}
                                  type="button"
                                  onClick={() => setEditImageTab(tab)}
                                  className={`text-xs font-bold uppercase pb-1 border-b-2 transition-all cursor-pointer ${
                                    editImageTab === tab 
                                      ? "border-[#4facfe] text-white" 
                                      : "border-transparent text-[#8E97A6] hover:text-white"
                                  }`}
                                >
                                  {tab}
                                </button>
                              ))}
                            </div>
                            
                            {/* Close icon */}
                            <button
                              type="button"
                              onClick={() => setEditImageSelectorOpen(false)}
                              className="p-1 text-[#8E97A6] hover:text-white rounded-lg transition-all cursor-pointer"
                              title="Close"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Content panel */}
                          <div className="min-h-[160px] max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                            {editImageTab === "gallery" && (
                              <div className="space-y-4">
                                {/* Gradients */}
                                <div className="space-y-1.5 text-left">
                                  <h4 className="text-[11px] font-black text-[#8E97A6] uppercase tracking-wider pl-1">Color and Gradient</h4>
                                  <div className="grid grid-cols-4 gap-2">
                                    {CURATED_GRADIENTS.map((grad, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                          setEditWordForm(prev => ({ ...prev, imageUrl: grad, imageFile: "" }));
                                          setEditImageSelectorOpen(false);
                                        }}
                                        style={{ background: grad }}
                                        className={`h-10 rounded-xl hover:scale-105 transition-all cursor-pointer border ${
                                          editWordForm.imageUrl === grad ? "border-white ring-2 ring-[#4facfe]" : "border-transparent"
                                        }`}
                                      />
                                    ))}
                                  </div>
                                </div>
                                {/* Textures */}
                                <div className="space-y-1.5 text-left">
                                  <h4 className="text-[11px] font-black text-[#8E97A6] uppercase tracking-wider pl-1">Texturelabs</h4>
                                  <div className="grid grid-cols-4 gap-2">
                                    {CURATED_TEXTURES.map((tex, i) => (
                                      <button
                                        key={i}
                                        type="button"
                                        onClick={() => {
                                          setEditWordForm(prev => ({ ...prev, imageUrl: tex, imageFile: "" }));
                                          setEditImageSelectorOpen(false);
                                        }}
                                        className={`h-10 rounded-xl hover:scale-105 transition-all cursor-pointer overflow-hidden relative border ${
                                          editWordForm.imageUrl === tex ? "border-white ring-2 ring-[#4facfe]" : "border-transparent"
                                        }`}
                                      >
                                        <img src={tex} alt="Texture option" className="w-full h-full object-cover" />
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            )}

                            {editImageTab === "upload" && (
                              <div
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  const file = e.dataTransfer.files?.[0];
                                  if (file) handleEditImageFile(file);
                                }}
                                className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-[#2A2E3D] hover:border-[#4facfe] rounded-xl bg-[#14161F] transition-all group cursor-pointer relative"
                              >
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) handleEditImageFile(file);
                                  }}
                                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                />
                                <div className="text-center space-y-2 pointer-events-none">
                                  {editWordForm.imageFile ? (
                                    <div className="flex items-center gap-2 text-xs font-black text-emerald-400">
                                      <ImageIcon className="w-5 h-5" />
                                      <span>Uploaded successfully!</span>
                                    </div>
                                  ) : (
                                    <>
                                      <Upload className="w-6 h-6 text-[#8E97A6] group-hover:text-white mx-auto transition-colors" />
                                      <span className="text-xs font-black text-[#8E97A6] block">Upload file</span>
                                      <span className="text-[10px] text-[#555] block">or Ctrl+V to paste an image</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            )}

                            {editImageTab === "link" && (
                              <div className="space-y-3 pt-2">
                                <input
                                  type="url"
                                  placeholder="Paste an image link..."
                                  value={editWordForm.imageUrl}
                                  onChange={(e) => setEditWordForm(prev => ({ ...prev, imageUrl: e.target.value, imageFile: "" }))}
                                  className="w-full px-4 py-2.5 rounded-xl bg-[#14161F] border border-[#2A2E3D] focus:border-[#4facfe] focus:outline-none text-xs text-white font-semibold transition-all"
                                />
                                <button
                                  type="button"
                                  onClick={() => setEditImageSelectorOpen(false)}
                                  className="w-full py-2.5 rounded-xl bg-[#2b6cb0] hover:bg-[#3182ce] text-white font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-1 shadow"
                                >
                                  Submit
                                </button>
                                <p className="text-[10px] text-center text-[#8E97A6]">Works with any image from the web.</p>
                              </div>
                            )}

                            {editImageTab === "unsplash" && (
                              <div className="space-y-3">
                                {/* Search bar */}
                                <div className="relative">
                                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-[#8E97A6] pointer-events-none" />
                                  <input
                                    type="text"
                                    placeholder="Search for an image..."
                                    value={editUnsplashSearchQuery}
                                    onChange={(e) => setEditUnsplashSearchQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleEditUnsplashSearch(editUnsplashSearchQuery);
                                      }
                                    }}
                                    className="w-full pl-9 pr-4 py-2 rounded-xl bg-[#14161F] border border-[#2A2E3D] focus:border-[#4facfe] focus:outline-none text-xs text-white font-semibold transition-all"
                                  />
                                </div>

                                {/* Images grid */}
                                {isEditUnsplashSearching ? (
                                  <div className="flex items-center justify-center py-10 space-y-2">
                                    <Loader2 className="w-5 h-5 animate-spin text-[#4facfe]" />
                                  </div>
                                ) : editUnsplashImages.length === 0 ? (
                                  <p className="text-[10px] text-center text-[#8E97A6] py-10">Search Unsplash for visual representations above.</p>
                                ) : (
                                  <div className="grid grid-cols-2 gap-3">
                                    {editUnsplashImages.map((img) => (
                                      <div key={img.id} className="group/item space-y-1 text-left">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditWordForm(prev => ({ ...prev, imageUrl: img.url, imageFile: "" }));
                                            setEditImageSelectorOpen(false);
                                          }}
                                          className={`w-full h-24 rounded-xl overflow-hidden relative border ${
                                            editWordForm.imageUrl === img.url ? "border-white ring-2 ring-[#4facfe]" : "border-transparent"
                                          } hover:scale-[1.02] transition-transform cursor-pointer`}
                                        >
                                          <img src={img.thumb} alt={img.alt_text} className="w-full h-full object-cover" />
                                        </button>
                                        <div className="text-[9px] text-[#8E97A6] truncate px-1">
                                          by{" "}
                                          <a
                                            href={img.author_link}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="underline hover:text-white"
                                          >
                                            {img.author}
                                          </a>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 pt-3 sm:pt-4">
                  <button
                    type="button"
                    onClick={() => setIsEditWordOpen(false)}
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl border border-[#C8CED6] hover:bg-[#F7F7F7] hover:border-[#736A86] text-[#736A86] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-1/2 py-3 sm:py-3.5 rounded-2xl bg-[#433075] hover:bg-[#A58CF4] text-white hover:text-[#0D0D0D] font-black text-xs sm:text-sm transition-all duration-300 cursor-pointer shadow-lg shadow-[#433075]/15 flex items-center justify-center gap-2 active:scale-95"
                  >
                    {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                    <span>Save Word</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
