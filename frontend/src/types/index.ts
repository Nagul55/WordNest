export interface Flashcard {
  id: string;
  setId: string;
  term: string;
  definition: string;
  imageUrl?: string;
  termAudioLang?: string;
  defAudioLang?: string;
  starred?: boolean;
}

export interface StudySet {
  id: string;
  title: string;
  description: string;
  category: string;
  isPublic: boolean;
  authorName: string;
  authorAvatar?: string;
  cardCount: number;
  cards?: Flashcard[];
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  description?: string;
  setIds: string[];
}

export interface CardMastery {
  cardId: string;
  level: number; // 0 = New, 1 = Familiar, 2 = Mastered
  correctCount: number;
  incorrectCount: number;
  nextReview?: string;
}

export interface QuizQuestion {
  id: string;
  type: 'mc' | 'tf' | 'written';
  question: string;
  options?: string[];
  correctAnswer: string | boolean;
  userAnswer?: string | boolean;
  explanation?: string;
}

export interface AIStudySuite {
  title: string;
  category: string;
  description: string;
  study_notes: string;
  flashcards: { term: string; definition: string }[];
  practice_quiz: {
    question: string;
    options: string[];
    correct_answer_index: number;
    explanation: string;
  }[];
}

export interface TutorMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export interface MatchItem {
  id: string; // cardId + '_term' or '_def'
  cardId: string;
  content: string;
  type: 'term' | 'def';
  state: 'idle' | 'selected' | 'matched' | 'error';
}
