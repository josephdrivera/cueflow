-- Enable the necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_type') THEN
        CREATE TYPE file_type AS ENUM ('cue id', 'audio', 'video', 'image', 'document', 'other');
    END IF;
END $$;

-- Create tables
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid references auth.users on delete cascade primary key,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    username text unique,
    full_name text,
    avatar_url text,
    role user_role default 'user'::user_role,
    constraint username_length check (char_length(username) >= 3)
);

CREATE TABLE IF NOT EXISTS public.shows (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references public.profiles(id) on delete cascade,
    title text not null,
    description text,
    settings jsonb default '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS public.show_collaborators (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    show_id uuid references public.shows(id) on delete cascade not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
    can_edit boolean default false,
    unique(show_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.day_cue_lists (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    show_id uuid references public.shows(id) on delete cascade not null,
    name text not null,
    date date not null
);

CREATE TABLE IF NOT EXISTS public.cues (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    day_cue_list_id uuid references public.day_cue_lists(id) on delete cascade not null,
    cue_number text not null,
    time text,
    description text,
    notes text,
    sort_order integer not null default 0
);

CREATE TABLE IF NOT EXISTS public.files (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    name text not null,
    file_type file_type not null,
    storage_path text not null,
    size_bytes bigint not null,
    metadata jsonb default '{}'::jsonb,
    uploader_id uuid references public.profiles(id) on delete set null,
    show_id uuid references public.shows(id) on delete cascade
);

CREATE TABLE IF NOT EXISTS public.show_flows (
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    show_id uuid references public.shows(id) on delete cascade not null,
    name text not null,
    description text,
    flow_data jsonb not null default '{}'::jsonb,
    version integer default 1,
    is_active boolean default true
);

-- Drop all existing policies
DO $$ 
DECLARE
    _sql text;
BEGIN
    FOR _sql IN (
        SELECT format('DROP POLICY IF EXISTS %I ON %I.%I', 
               pol.policyname, pol.schemaname, pol.tablename)
        FROM pg_policies pol
        WHERE pol.schemaname = 'public'
    ) LOOP
        EXECUTE _sql;
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_cue_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_flows ENABLE ROW LEVEL SECURITY;

-- Create basic policies (we'll add more specific ones as needed)
-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Shows policies
CREATE POLICY "Shows are viewable by creator and collaborators"
ON public.shows FOR SELECT
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.show_collaborators
        WHERE show_id = id AND user_id = auth.uid()
    )
);

CREATE POLICY "Users can create shows"
ON public.shows FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Shows are editable by creator and collaborators with edit permission"
ON public.shows FOR UPDATE
USING (
    user_id = auth.uid() OR 
    EXISTS (
        SELECT 1 FROM public.show_collaborators
        WHERE show_id = id AND user_id = auth.uid() AND can_edit = true
    )
);

CREATE POLICY "Users can delete their own shows"
ON public.shows FOR DELETE
USING (auth.uid() = user_id);

-- Show collaborators policies
CREATE POLICY "Show collaborators are viewable by show members"
ON public.show_collaborators FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND (
            user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = id AND sc.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Show collaborators can be managed by show creator"
ON public.show_collaborators FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND user_id = auth.uid()
    )
);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.shows
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.day_cue_lists
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.cues
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.files
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();
