-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('admin', 'user');
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'file_type') THEN
        CREATE TYPE file_type AS ENUM ('cue id', 'audio', 'video', 'image', 'document', 'other');
    END IF;
END $$;

-- Drop existing policies
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
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    user_id uuid references public.profiles(id) on delete cascade not null,
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
    id uuid default uuid_generate_v4() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    show_id uuid references public.shows(id) on delete cascade not null,
    name text not null,
    date date not null
);

CREATE TABLE IF NOT EXISTS public.cues (
    id uuid default uuid_generate_v4() primary key,
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

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_cue_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_flows ENABLE ROW LEVEL SECURITY;

-- Temporarily disable RLS
ALTER TABLE public.shows DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.show_collaborators DISABLE ROW LEVEL SECURITY;

-- Drop existing policies for these tables
DROP POLICY IF EXISTS "Shows are viewable by creator and collaborators" ON public.shows;
DROP POLICY IF EXISTS "Users can create shows" ON public.shows;
DROP POLICY IF EXISTS "Shows are editable by creator and collaborators with edit permission" ON public.shows;
DROP POLICY IF EXISTS "Users can delete their own shows" ON public.shows;
DROP POLICY IF EXISTS "Show collaborators are viewable by show members" ON public.show_collaborators;
DROP POLICY IF EXISTS "Show collaborators can be managed by show creator" ON public.show_collaborators;

-- Drop existing triggers
DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
DROP TRIGGER IF EXISTS handle_updated_at ON public.shows;
DROP TRIGGER IF EXISTS handle_updated_at ON public.day_cue_lists;
DROP TRIGGER IF EXISTS handle_updated_at ON public.cues;
DROP TRIGGER IF EXISTS handle_updated_at ON public.files;
DROP TRIGGER IF EXISTS handle_updated_at ON public.show_flows;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create updated_at triggers for all tables
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

CREATE TRIGGER handle_updated_at
    BEFORE UPDATE ON public.show_flows
    FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Create RLS Policies

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone"
ON public.profiles FOR SELECT
TO public
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Day cue lists policies
CREATE POLICY "Day cue lists are viewable by show members"
ON public.day_cue_lists FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE s.id = show_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Day cue lists can be modified by editors"
ON public.day_cue_lists FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE s.id = show_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

-- Cues policies
CREATE POLICY "Cues are viewable by show members"
ON public.cues FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.day_cue_lists dcl
        JOIN public.shows s ON s.id = dcl.show_id
        WHERE dcl.id = day_cue_list_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Cues can be modified by editors"
ON public.cues FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.day_cue_lists dcl
        JOIN public.shows s ON s.id = dcl.show_id
        WHERE dcl.id = day_cue_list_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

-- Files policies
CREATE POLICY "Files are viewable by show members"
ON public.files FOR SELECT
USING (
    show_id IS NULL OR
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE s.id = show_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Files can be modified by editors"
ON public.files FOR ALL
USING (
    show_id IS NULL OR
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE s.id = show_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

-- Show flows policies
CREATE POLICY "Show flows are viewable by show members"
ON public.show_flows FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE s.id = show_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Show flows can be modified by editors"
ON public.show_flows FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE s.id = show_id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

-- Create function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        new.raw_user_meta_data->>'full_name',
        new.raw_user_meta_data->>'avatar_url'
    );
    RETURN new;
END;
$$ language plpgsql security definer;

-- Create trigger for new user creation
CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
