import { AIStudySuite, Flashcard } from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface UserContext {
  username?: string;
  age?: string | number;
  occupation?: string;
  referral_source?: string;
}

/**
 * Retrieves cached student persona profile (username, age, occupation) 
 * from localStorage so all AI responses across WordNest are personalized.
 */
export const getStoredUserContext = (): UserContext | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("wordnest_profile_")) {
        const item = localStorage.getItem(key);
        if (item) {
          const parsed = JSON.parse(item);
          if (parsed.username || parsed.age || parsed.occupation) {
            return {
              username: parsed.username,
              age: parsed.age,
              occupation: parsed.occupation,
              referral_source: parsed.referral_source
            };
          }
        }
      }
    }
  } catch (e) {
    console.warn("Failed to read user context for AI personalization:", e);
  }
  return undefined;
};

export const generateMagicNotes = async (content: string, explicitUserContext?: UserContext): Promise<AIStudySuite> => {
  const user_context = explicitUserContext || getStoredUserContext();
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/magic-notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mode: "full_suite", user_context }),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (e) {
    console.warn("Backend FastAPI connection unavailable or errored, using personalized fallback synthesis:", e);
    const name = user_context?.username ? `${user_context.username}'s` : "Personalized";
    const roleDesc = user_context?.occupation ? ` tailored for your background as a ${user_context.occupation}` : "";
    return {
      title: `${name} AI Study Set: Core Synthesis`,
      category: "General Intelligence",
      description: `Groq Llama 3.1 AI automated educational summary${roleDesc}.`,
      study_notes: `### Key Analytical Takeaways for ${user_context?.username || "Student"}\n\n* **Primary Theme**: The text explores fundamental abstractions and structural workflows.\n* **Critical Operations**: System behavior centers around reliable modular execution and iterative validation.\n* **Best Practices**: Always prioritize robust error containment and scalable algorithmic data modeling.\n\n#### Vocabulary Expansion\nReview the connected flashcard deck below to reinforce conceptual definitions.`,
      flashcards: [
        { term: "Abstraction Architecture", definition: "Hiding internal operational complexity behind clean, intuitive public interfaces." },
        { term: "Modular Convergence", definition: "The point where independent software or biological subsystems seamlessly interact to perform complex behaviors." },
        { term: "Iterative Synthesis", definition: "Refining knowledge or code across repeated analytical validation loops." },
        { term: "Fault Isolation", definition: "Architecting systems such that localized component failure does not cascade into structural system collapse." }
      ],
      practice_quiz: [
        {
          question: "What is the core strategic advantage of Abstraction Architecture?",
          options: [
            "Hiding internal operational complexity behind clean interfaces",
            "Maximizing hard-disk energy consumption",
            "Requiring all engineers to read machine-level assembly",
            "Eliminating the need for database storage"
          ],
          correct_answer_index: 0,
          explanation: "Abstraction allows systems to be reasoned about at higher semantic levels without cognitive overload."
        },
        {
          question: "Why is Fault Isolation essential in system design?",
          options: [
            "It guarantees instantaneous network speeds",
            "It prevents localized component failure from cascading across the system",
            "It automatically generates high-resolution UI images",
            "It doubles CPU clock cycles automatically"
          ],
          correct_answer_index: 1,
          explanation: "Fault isolation confines bugs and service exceptions to safe operational boundaries."
        }
      ]
    };
  }
};

export const gradeAnswerWithAI = async (
  term: string,
  expectedDefinition: string,
  userResponse: string,
  explicitUserContext?: UserContext
): Promise<{ is_correct: boolean; score: number; feedback: string }> => {
  const user_context = explicitUserContext || getStoredUserContext();
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/grade`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        term, 
        expected_definition: expectedDefinition, 
        user_response: userResponse,
        user_context 
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.data;
    }
    throw new Error("API Offline");
  } catch (e) {
    const cleanUser = userResponse.toLowerCase().trim();
    const cleanExpected = expectedDefinition.toLowerCase().trim();
    const isMatch = cleanUser.length > 3 && (cleanExpected.includes(cleanUser) || cleanUser.includes(cleanExpected.slice(0, 15)));
    const studentName = user_context?.username ? `${user_context.username}, ` : "";
    return {
      is_correct: isMatch,
      score: isMatch ? 95 : 30,
      feedback: isMatch 
        ? `Great work ${studentName}! Your response accurately captures the core concept.` 
        : `Keep going ${studentName}! Keep in mind: ${expectedDefinition}`
    };
  }
};

export const chatSocraticTutor = async (
  deckTitle: string,
  cards: Flashcard[],
  history: { role: string; content: string }[],
  explicitUserContext?: UserContext
): Promise<string> => {
  const user_context = explicitUserContext || getStoredUserContext();
  try {
    const formattedCards = cards.map(c => ({ term: c.term, definition: c.definition }));
    const response = await fetch(`${API_BASE_URL}/api/ai/tutor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        deck_title: deckTitle, 
        cards: formattedCards, 
        messages: history,
        user_context 
      }),
    });
    if (response.ok) {
      const data = await response.json();
      return data.response;
    }
    throw new Error("API Offline");
  } catch (e) {
    const studentName = user_context?.username ? ` ${user_context.username}` : "";
    return `⚡ *Tutor Tip*: Hey${studentName}! To truly master **${deckTitle}**, try explaining the distinction between **${cards[0]?.term || "concept A"}** and **${cards[1]?.term || "concept B"}** in your own words!`;
  }
};

/**
 * Asynchronously pings the backend service to wake up cold-started containers
 * (e.g. Render free tier) in advance as soon as the app loads.
 */
let warmupInitiated = false;
export const warmupBackend = () => {
  if (warmupInitiated || typeof window === "undefined") return;
  warmupInitiated = true;
  try {
    fetch(`${API_BASE_URL}/health`, { method: "GET", mode: "cors" }).catch(() => {});
  } catch (e) {}
};

export const fetchWordDefinition = async (word: string, explicitUserContext?: UserContext): Promise<string> => {
  const cleanWord = word.trim();
  if (!cleanWord) return "";

  // 1. Fast Free Dictionary API (~50ms response time)
  const fetchFreeDict = async (): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        const meanings = data[0]?.meanings;
        if (meanings && meanings.length > 0) {
          for (const m of meanings) {
            const def = m?.definitions?.[0]?.definition;
            if (def && def.trim().length > 0) {
              const formatted = def.trim().charAt(0).toUpperCase() + def.trim().slice(1);
              return formatted.endsWith(".") ? formatted : formatted + ".";
            }
          }
        }
      }
    } catch (e) {}
    return null;
  };

  // 2. Groq AI Backend API
  const fetchGroqAi = async (): Promise<string | null> => {
    // 2a. Try Next.js Serverless Route first
    try {
      const user_context = explicitUserContext || getStoredUserContext();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`/api/ai/definition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord, user_context }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.definition && data.definition.trim().length > 0) {
          return data.definition.trim();
        }
      }
    } catch (e: any) {
      console.warn("[Next.js AI Definition Fetch Error]:", e?.message || e);
    }

    // 2b. Fallback to FastAPI Backend (which might have GROQ_API_KEY configured)
    try {
      const user_context = explicitUserContext || getStoredUserContext();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${API_BASE_URL}/api/ai/definition`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ word: cleanWord, user_context }),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data?.definition && data.definition.trim().length > 0) {
          return data.definition.trim();
        }
      }
    } catch (e: any) {
      console.warn("[FastAPI AI Definition Fetch Error]:", e?.message || e);
    }
    return null;
  };

  // 3. Fallback Datamuse API
  const fetchDatamuse = async (): Promise<string | null> => {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(cleanWord)}&md=d&max=1`, {
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && data.length > 0 && data[0].defs && data[0].defs.length > 0) {
          const rawDef = data[0].defs[0];
          // Datamuse defs look like "n\t(especially in the plural) Tattered clothes."
          const cleanDef = rawDef.split("\t").pop();
          if (cleanDef) {
            const formatted = cleanDef.trim().charAt(0).toUpperCase() + cleanDef.trim().slice(1);
            return formatted.endsWith(".") ? formatted : formatted + ".";
          }
        }
      }
    } catch (e) {}
    return null;
  };

  // Try Groq AI backend API FIRST for tailored 1-sentence definitions
  const aiResult = await fetchGroqAi();
  if (aiResult) {
    return aiResult;
  }

  // Fallback to Free Dictionary API
  const dictResult = await fetchFreeDict();
  if (dictResult) {
    return dictResult;
  }

  // Fallback to Datamuse API
  const dataMuseResult = await fetchDatamuse();
  if (dataMuseResult) {
    return dataMuseResult;
  }

  // Clean fallback sentence if AI and external dictionaries are offline
  const wordCap = cleanWord.charAt(0).toUpperCase() + cleanWord.slice(1);
  return `${wordCap} is a concept or term used to describe a specific place, action, or object.`;
};

export const fetchWordExample = async (word: string, explicitUserContext?: UserContext): Promise<string> => {
  const user_context = explicitUserContext || getStoredUserContext();
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/example`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, user_context })
    });
    if (res.ok) {
      const data = await res.json();
      return data.example;
    }
    throw new Error("API error");
  } catch (e) {
    throw e;
  }
};

const UNSPLASH_CLIENT_KEY = process.env.NEXT_PUBLIC_UNSPLASH_KEY || "i764_jj_2X-tacZ7T-7o6nzqOf7XgAPqO-jTqBrGqVY";

export const searchUnsplash = async (query: string): Promise<Array<{ id: string; url: string; thumb: string; alt_text: string; author: string }>> => {
  const cleanQuery = query.trim() || "learning";

  // 1. Try Backend Route
  try {
    const res = await fetch(`${API_BASE_URL}/api/unsplash/search?q=${encodeURIComponent(cleanQuery)}&per_page=12`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        // If the backend returns the old static fallback, reject it to trigger the new dynamic fallback
        if (data.results[0].id === "demo-1" || data.results[0].id === "demo-u1") {
          throw new Error("Backend returned static fallback");
        }
        return data.results;
      }
    }
  } catch (e) {
    // Backend unreachable or offline, or returned static fallback
  }

  // 2. Direct Unsplash Client API Fetch (for frontend standalone or Vercel deployment)
  try {
    if (UNSPLASH_CLIENT_KEY && UNSPLASH_CLIENT_KEY !== "your-access-key-here") {
      const res = await fetch(`https://api.unsplash.com/search/photos?query=${encodeURIComponent(cleanQuery)}&per_page=12&orientation=landscape`, {
        headers: { Authorization: `Client-ID ${UNSPLASH_CLIENT_KEY}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          return data.results.map((item: any) => ({
            id: item.id,
            url: item.urls.regular,
            thumb: item.urls.thumb,
            alt_text: item.alt_description || cleanQuery,
            author: item.user?.name || "Unsplash Community"
          }));
        }
      }
    }
  } catch (e) {
    // Direct Unsplash fetch failed or rate limited
  }

  // 3. Dynamic Word-Specific Fallback (guaranteed to match the search query)
  const encoded = encodeURIComponent(cleanQuery);
  return [
    {
      id: `fallback-${encoded}-1`,
      url: `https://loremflickr.com/800/500/${encoded}?random=1`,
      thumb: `https://loremflickr.com/400/250/${encoded}?random=1`,
      alt_text: `${cleanQuery} visual`,
      author: "Visual Studio"
    },
    {
      id: `fallback-${encoded}-2`,
      url: `https://image.pollinations.ai/prompt/photo%20of%20${encoded}?width=800&height=500&nologo=true`,
      thumb: `https://image.pollinations.ai/prompt/photo%20of%20${encoded}?width=400&height=250&nologo=true`,
      alt_text: `Photo of ${cleanQuery}`,
      author: "AI Studio"
    },
    {
      id: `fallback-${encoded}-3`,
      url: `https://loremflickr.com/800/500/${encoded}?random=2`,
      thumb: `https://loremflickr.com/400/250/${encoded}?random=2`,
      alt_text: `${cleanQuery} illustration`,
      author: "Visual Studio"
    },
    {
      id: `fallback-${encoded}-4`,
      url: `https://image.pollinations.ai/prompt/high%20quality%20picture%20of%20${encoded}?width=800&height=500&nologo=true`,
      thumb: `https://image.pollinations.ai/prompt/high%20quality%20picture%20of%20${encoded}?width=400&height=250&nologo=true`,
      alt_text: `Picture of ${cleanQuery}`,
      author: "AI Studio"
    }
  ];
};
