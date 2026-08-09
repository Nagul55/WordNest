-- ==========================================
-- WordNest Hardened Supabase Database Schema
-- ==========================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Profiles Table (Automatically synced with Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    provider TEXT DEFAULT 'email',
    daily_target INTEGER DEFAULT 30,
    notifications_enabled BOOLEAN DEFAULT TRUE,
    streak_reminders_enabled BOOLEAN DEFAULT TRUE,
    age TEXT,
    occupation TEXT,
    referral_source TEXT,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public reading of basic user profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (TRUE);

-- Allow authenticated users to update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow service or self-insert upon registration
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow users to delete their own profile
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "Users can delete own profile" ON public.profiles
    FOR DELETE USING (auth.uid() = id);

-- ==========================================
-- Automated Zero-Error Profile Creation Trigger
-- ==========================================
-- This PostgreSQL function fires automatically whenever a new user registers 
-- via Google OAuth or Email in Supabase Auth, guaranteeing their profile exists in public.profiles.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    display_name TEXT;
    avatar TEXT;
    auth_provider TEXT;
BEGIN
    -- Extract full name from raw user meta data if provided (Google OAuth sends this)
    display_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    avatar := COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture', '');
    auth_provider := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');

    INSERT INTO public.profiles (id, username, full_name, avatar_url, provider)
    VALUES (
        NEW.id,
        LOWER(split_part(NEW.email, '@', 1)) || '_' || SUBSTRING(NEW.id::TEXT, 1, 4),
        display_name,
        avatar,
        auth_provider
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        avatar_url = EXCLUDED.avatar_url,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- Study Decks & Core Application Tables
-- ==========================================
CREATE TABLE IF NOT EXISTS public.study_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT TRUE,
    category TEXT DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    set_id UUID REFERENCES public.study_sets(id) ON DELETE CASCADE NOT NULL,
    term TEXT NOT NULL,
    definition TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- Migration Block: Backfill user_id on flashcards
-- ==========================================
DO $$
DECLARE
    orphan_count INTEGER;
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' AND table_name='flashcards' AND column_name='user_id'
    ) THEN
        ALTER TABLE public.flashcards ADD COLUMN user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;
        
        -- Backfill existing flashcards
        UPDATE public.flashcards f
        SET user_id = s.user_id
        FROM public.study_sets s
        WHERE f.set_id = s.id;
        
        -- Check for orphans
        SELECT count(*) INTO orphan_count FROM public.flashcards WHERE user_id IS NULL;
        IF orphan_count > 0 THEN
            RAISE NOTICE 'Migration: Found % orphaned flashcards (missing parent study_set). Deleting them.', orphan_count;
            DELETE FROM public.flashcards WHERE user_id IS NULL;
        ELSE
            RAISE NOTICE 'Migration: No orphaned flashcards found. Clean migration.';
        END IF;
        
        ALTER TABLE public.flashcards ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read access to public study sets" ON public.study_sets;
CREATE POLICY "Allow read access to public study sets" ON public.study_sets FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own study sets" ON public.study_sets;
CREATE POLICY "Users can manage own study sets" ON public.study_sets FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Allow read access to public flashcards" ON public.flashcards;
CREATE POLICY "Allow read access to public flashcards" ON public.flashcards FOR SELECT USING (
    (EXISTS (SELECT 1 FROM public.study_sets WHERE id = set_id AND is_public = TRUE)) OR user_id = auth.uid()
);

DROP POLICY IF EXISTS "Users can insert own flashcards" ON public.flashcards;
CREATE POLICY "Users can insert own flashcards" ON public.flashcards FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own flashcards" ON public.flashcards;
CREATE POLICY "Users can update own flashcards" ON public.flashcards FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own flashcards" ON public.flashcards;
CREATE POLICY "Users can delete own flashcards" ON public.flashcards FOR DELETE USING (auth.uid() = user_id);
