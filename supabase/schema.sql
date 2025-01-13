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

-- Create users table (extends Supabase auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  role user_role default 'user'::user_role,
  constraint username_length check (char_length(username) >= 3)
);

-- Create shows table
create table if not exists public.shows (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  creator_id uuid references public.profiles(id) on delete set null,
  is_template boolean default false,
  metadata jsonb default '{}'::jsonb
);

-- Create day_cue_lists table
create table if not exists public.day_cue_lists (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  show_id uuid references public.shows(id) on delete cascade not null,
  name text not null,
  date date not null,
  metadata jsonb default '{}'::jsonb,
  unique(show_id, date)
);

-- Create show_flows table
create table if not exists public.show_flows (
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

-- Create files table
create table if not exists public.files (
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

-- Create show_collaborators table for managing show access
create table if not exists public.show_collaborators (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  show_id uuid references public.shows(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  can_edit boolean default false,
  unique(show_id, user_id)
);

-- Create cues table
create table if not exists public.cues (
  id uuid default uuid_generate_v4() primary key,  -- System ID (hidden)
  display_id text not null,                       -- Display ID (e.g., CUE-A101)
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  show_id uuid references public.shows(id) on delete cascade not null,
  cue_list_id uuid references public.day_cue_lists(id) on delete cascade not null,
  cue_number text not null,
  description text,
  start_time interval not null default '00:00:00'::interval,
  run_time interval not null default '00:00:00'::interval,
  end_time interval not null default '00:00:00'::interval,
  metadata jsonb default '{}'::jsonb,
  unique(cue_list_id, cue_number),
  unique(cue_list_id, display_id)  -- Ensure display_id is unique within a cue list
);

-- Create function to generate display_id
create or replace function public.generate_cue_display_id()
returns trigger as $$
declare
  prefix text := 'CUE-';
  next_num integer;
begin
  -- Get the highest numeric part from existing display_ids for this show
  select coalesce(max(cast(substring(display_id from '^CUE-(\d+)$') as integer)), 0)
  into next_num
  from public.cues
  where show_id = NEW.show_id
    and display_id ~ '^CUE-\d+$';

  -- Generate the next display_id
  NEW.display_id := prefix || lpad((next_num + 1)::text, 3, '0');
  
  return NEW;
end;
$$ language plpgsql;

-- Create trigger for display_id generation
create trigger generate_cue_display_id
  before insert on public.cues
  for each row
  when (NEW.display_id IS NULL)
  execute function public.generate_cue_display_id();

-- Create RLS policies
alter table if exists public.profiles enable row level security;
alter table if exists public.shows enable row level security;
alter table if exists public.show_flows enable row level security;
alter table if exists public.files enable row level security;
alter table if exists public.show_collaborators enable row level security;
alter table if exists public.cues enable row level security;
alter table if exists public.day_cue_lists enable row level security;

-- Drop existing policies first
DO $$ 
BEGIN
    -- Drop profiles policies
    DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    
    -- Drop shows policies
    DROP POLICY IF EXISTS "Shows are viewable by everyone" ON public.shows;
    DROP POLICY IF EXISTS "Shows can be created by anyone" ON public.shows;
    DROP POLICY IF EXISTS "Shows can be updated by anyone" ON public.shows;
    DROP POLICY IF EXISTS "Shows can be deleted by anyone" ON public.shows;
    
    -- Drop show flows policies
    DROP POLICY IF EXISTS "Show flows are viewable by show collaborators" ON public.show_flows;
    DROP POLICY IF EXISTS "Show flows can be updated by show editors" ON public.show_flows;
    
    -- Drop files policies
    DROP POLICY IF EXISTS "Files are viewable by show collaborators" ON public.files;
    DROP POLICY IF EXISTS "Files can be uploaded by show editors" ON public.files;
    
    -- Drop cues policies
    DROP POLICY IF EXISTS "Cues are viewable by everyone" ON public.cues;
    DROP POLICY IF EXISTS "Cues can be created by anyone" ON public.cues;
    DROP POLICY IF EXISTS "Cues can be updated by anyone" ON public.cues;
    DROP POLICY IF EXISTS "Cues can be deleted by anyone" ON public.cues;
    
    -- Drop day_cue_lists policies
    DROP POLICY IF EXISTS "Day cue lists are viewable by show collaborators" ON public.day_cue_lists;
    DROP POLICY IF EXISTS "Day cue lists can be created by show editors" ON public.day_cue_lists;
    DROP POLICY IF EXISTS "Day cue lists can be updated by show editors" ON public.day_cue_lists;
    DROP POLICY IF EXISTS "Day cue lists can be deleted by show editors" ON public.day_cue_lists;
END $$;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Shows policies
create policy "Shows are viewable by everyone"
  on public.shows for select
  using (true);

create policy "Shows can be created by anyone"
  on public.shows for insert
  with check (true);

create policy "Shows can be updated by anyone"
  on public.shows for update
  using (true);

create policy "Shows can be deleted by anyone"
  on public.shows for delete
  using (true);

-- Show flows policies
create policy "Show flows are viewable by show collaborators"
  on public.show_flows for select
  using (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or sc.user_id = auth.uid())
    )
  );

create policy "Show flows can be updated by show editors"
  on public.show_flows for update
  using (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or (sc.user_id = auth.uid() and sc.can_edit = true))
    )
  );

-- Files policies
create policy "Files are viewable by show collaborators"
  on public.files for select
  using (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or sc.user_id = auth.uid())
    )
  );

create policy "Files can be uploaded by show editors"
  on public.files for insert
  with check (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or (sc.user_id = auth.uid() and sc.can_edit = true))
    )
  );

-- Cues policies
create policy "Cues are viewable by everyone"
  on public.cues for select
  using (true);

create policy "Cues can be created by anyone"
  on public.cues for insert
  with check (true);

create policy "Cues can be updated by anyone"
  on public.cues for update
  using (true);

create policy "Cues can be deleted by anyone"
  on public.cues for delete
  using (true);

-- Day cue lists policies
create policy "Day cue lists are viewable by show collaborators"
  on public.day_cue_lists for select
  using (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or sc.user_id = auth.uid())
    )
  );

create policy "Day cue lists can be created by show editors"
  on public.day_cue_lists for insert
  with check (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or (sc.user_id = auth.uid() and sc.can_edit = true))
    )
  );

create policy "Day cue lists can be updated by show editors"
  on public.day_cue_lists for update
  using (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or (sc.user_id = auth.uid() and sc.can_edit = true))
    )
  );

create policy "Day cue lists can be deleted by show editors"
  on public.day_cue_lists for delete
  using (
    exists (
      select 1 from public.shows s
      left join public.show_collaborators sc on s.id = sc.show_id
      where s.id = show_id and (s.creator_id = auth.uid() or (sc.user_id = auth.uid() and sc.can_edit = true))
    )
  );

-- Drop existing triggers first
DO $$ 
BEGIN
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS handle_updated_at ON public.profiles;
    DROP TRIGGER IF EXISTS handle_updated_at ON public.shows;
    DROP TRIGGER IF EXISTS handle_updated_at ON public.show_flows;
    DROP TRIGGER IF EXISTS handle_updated_at ON public.files;
    DROP TRIGGER IF EXISTS handle_updated_at ON public.cues;
    DROP TRIGGER IF EXISTS handle_updated_at ON public.day_cue_lists;
END $$;

-- Functions and triggers
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name, avatar_url)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Update timestamps trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger handle_updated_at
  before update on public.profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.shows
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.show_flows
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.files
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.cues
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
  before update on public.day_cue_lists
  for each row execute procedure public.handle_updated_at();
