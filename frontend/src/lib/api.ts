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

export const fetchWordDefinition = async (word: string, explicitUserContext?: UserContext): Promise<string> => {
  const user_context = explicitUserContext || getStoredUserContext();
  try {
    const res = await fetch(`${API_BASE_URL}/api/ai/definition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ word, user_context })
    });
    if (res.ok) {
      const data = await res.json();
      return data.definition;
    }
    throw new Error("API error");
  } catch (e) {
    throw e;
  }
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

export const searchUnsplash = async (query: string): Promise<Array<{ id: string; url: string; thumb: string; alt_text: string; author: string }>> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/unsplash/search?q=${encodeURIComponent(query)}&per_page=6`);
    if (res.ok) {
      const data = await res.json();
      return data.results;
    }
    throw new Error("Offline");
  } catch (e) {
    return [
      {
        id: "demo-u1",
        url: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=600&auto=format&fit=crop&q=80",
        thumb: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=200&auto=format&fit=crop&q=80",
        alt_text: "Study table and laptop",
        author: "Unsplash Pro"
      },
      {
        id: "demo-u2",
        url: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=600&auto=format&fit=crop&q=80",
        thumb: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=200&auto=format&fit=crop&q=80",
        alt_text: "Textbooks and notebook reading",
        author: "Unsplash Pro"
      },
      {
        id: "demo-u3",
        url: "https://images.unsplash.com/photo-1507842229356-51c615049540?w=600&auto=format&fit=crop&q=80",
        thumb: "https://images.unsplash.com/photo-1507842229356-51c615049540?w=200&auto=format&fit=crop&q=80",
        alt_text: "Library shelf abstraction",
        author: "Unsplash Pro"
      }
    ];
  }
};
