-- ==========================================
-- WordNest Analytics & Progress Persistence Schema
-- ==========================================

-- 1. Practice Sessions Table
-- Stores XP earned, time spent, and activity type for the Progress page
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL,
    xp_earned INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for Practice Sessions
ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users can insert own practice sessions" ON public.practice_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users can read own practice sessions" ON public.practice_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- 2. Vocabulary Vault Table
-- Stores spaced repetition states for specific flashcards
CREATE TABLE IF NOT EXISTS public.vocabulary_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    word_id UUID REFERENCES public.flashcards(id) ON DELETE CASCADE NOT NULL,
    status TEXT DEFAULT 'Learning', -- 'Learning', 'Reviewing', 'Mastered'
    next_review_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, word_id)
);

-- Enable RLS for Vocabulary Vault
ALTER TABLE public.vocabulary_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert own vocabulary vault entries" ON public.vocabulary_vault;
CREATE POLICY "Users can insert own vocabulary vault entries" ON public.vocabulary_vault
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vocabulary vault entries" ON public.vocabulary_vault;
CREATE POLICY "Users can update own vocabulary vault entries" ON public.vocabulary_vault
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can read own vocabulary vault entries" ON public.vocabulary_vault;
CREATE POLICY "Users can read own vocabulary vault entries" ON public.vocabulary_vault
    FOR SELECT USING (auth.uid() = user_id);
