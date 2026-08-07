-- ==========================================
-- WordNest Schema V2 Migration
-- Adds Vocabulary Vault, Practice Sessions, and AI Logs
-- ==========================================

-- 1. Vocabulary Vault
CREATE TABLE IF NOT EXISTS public.vocabulary_vault (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    word TEXT NOT NULL,
    phonetic TEXT,
    part_of_speech TEXT,
    definition TEXT NOT NULL,
    example TEXT,
    category TEXT DEFAULT 'Essential',
    status TEXT DEFAULT 'Learning',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.vocabulary_vault ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own vocabulary vault" ON public.vocabulary_vault;
CREATE POLICY "Users can manage own vocabulary vault" ON public.vocabulary_vault 
    FOR ALL USING (auth.uid() = user_id);

-- 2. Practice Sessions (Analytics & Progress)
CREATE TABLE IF NOT EXISTS public.practice_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    mode TEXT NOT NULL, -- e.g. 'Flashcards', 'Spelling', 'AI Quiz'
    xp_earned INTEGER DEFAULT 0,
    score INTEGER DEFAULT 0,
    duration_seconds INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.practice_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own practice sessions" ON public.practice_sessions;
CREATE POLICY "Users can manage own practice sessions" ON public.practice_sessions 
    FOR ALL USING (auth.uid() = user_id);

-- 3. AI Labs Logs
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    log_type TEXT NOT NULL, -- e.g. 'Mnemonic', 'Socratic', 'Enhancer'
    query_term TEXT NOT NULL,
    generated_content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ai logs" ON public.ai_logs;
CREATE POLICY "Users can manage own ai logs" ON public.ai_logs 
    FOR ALL USING (auth.uid() = user_id);
