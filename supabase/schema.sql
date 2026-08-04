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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow public reading of basic user profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (TRUE);

-- Allow authenticated users to update their own profile
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Allow service or self-insert upon registration
CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

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

ALTER TABLE public.study_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to public study sets" ON public.study_sets FOR SELECT USING (is_public = TRUE OR auth.uid() = user_id);
CREATE POLICY "Users can manage own study sets" ON public.study_sets FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Allow read access to public flashcards" ON public.flashcards FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.study_sets WHERE id = set_id AND (is_public = TRUE OR user_id = auth.uid()))
);
CREATE POLICY "Users can manage own flashcards" ON public.flashcards FOR ALL USING (
    EXISTS (SELECT 1 FROM public.study_sets WHERE id = set_id AND user_id = auth.uid())
);
