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
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    title text not null,
    description text,
    settings jsonb default '{}'::jsonb
);

-- Create show_permissions table
create table if not exists public.show_permissions (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    show_id uuid references public.shows(id) on delete cascade not null,
    user_id uuid not null,
    role text not null default 'viewer',
    constraint unique_show_user unique (show_id, user_id)
);

-- Create day_cue_lists table
create table if not exists public.day_cue_lists (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    show_id uuid references public.shows(id) on delete cascade not null,
    name text not null,
    date date not null
);

-- Create cues table
create table if not exists public.cues (
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

-- Enable Row Level Security
alter table public.shows enable row level security;
alter table public.show_permissions enable row level security;
alter table public.day_cue_lists enable row level security;
alter table public.cues enable row level security;
alter table public.profiles enable row level security;
alter table public.files enable row level security;
alter table public.show_collaborators enable row level security;
alter table public.show_flows enable row level security;

-- Drop existing triggers first
drop trigger if exists handle_updated_at on public.shows;
drop trigger if exists handle_updated_at on public.show_permissions;
drop trigger if exists handle_updated_at on public.day_cue_lists;
drop trigger if exists handle_updated_at on public.cues;
drop trigger if exists handle_updated_at on public.profiles;
drop trigger if exists handle_updated_at on public.show_flows;
drop trigger if exists handle_updated_at on public.files;

-- Create the handle_updated_at function if it doesn't exist
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Create triggers for updated_at
create trigger handle_updated_at
    before update on public.shows
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.show_permissions
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.day_cue_lists
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.cues
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.profiles
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.show_flows
    for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at
    before update on public.files
    for each row execute procedure public.handle_updated_at();

-- Shows Policies
create policy "Users can view shows they have access to"
    on public.shows for select
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = id
    ));

create policy "Users can insert shows"
    on public.shows for insert
    with check ( true );

create policy "Users can update shows they have access to"
    on public.shows for update
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = id
    ));

create policy "Users can delete shows they have access to"
    on public.shows for delete
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = id
    ));

-- Show Permissions Policies
create policy "Users can view show permissions they have access to"
    on public.show_permissions for select
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = show_permissions.show_id
    ));

create policy "Users can insert show permissions for shows they have access to"
    on public.show_permissions for insert
    with check ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = show_permissions.show_id
    ));

create policy "Users can update show permissions they have access to"
    on public.show_permissions for update
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = show_permissions.show_id
    ));

create policy "Users can delete show permissions they have access to"
    on public.show_permissions for delete
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = show_permissions.show_id
    ));

-- Day Cue Lists Policies
create policy "Users can view day_cue_lists they have access to"
    on public.day_cue_lists for select
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = day_cue_lists.show_id
    ));

create policy "Users can insert day_cue_lists for shows they have access to"
    on public.day_cue_lists for insert
    with check ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = day_cue_lists.show_id
    ));

create policy "Users can update day_cue_lists they have access to"
    on public.day_cue_lists for update
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = day_cue_lists.show_id
    ));

create policy "Users can delete day_cue_lists they have access to"
    on public.day_cue_lists for delete
    using ( auth.uid() in (
        select user_id from public.show_permissions
        where show_id = day_cue_lists.show_id
    ));

-- Cues Policies
create policy "Users can view cues they have access to"
    on public.cues for select
    using ( auth.uid() in (
        select user_id from public.show_permissions sp
        join public.day_cue_lists dcl on dcl.show_id = sp.show_id
        where dcl.id = cues.day_cue_list_id
    ));

create policy "Users can insert cues for shows they have access to"
    on public.cues for insert
    with check ( auth.uid() in (
        select user_id from public.show_permissions sp
        join public.day_cue_lists dcl on dcl.show_id = sp.show_id
        where dcl.id = cues.day_cue_list_id
    ));

create policy "Users can update cues they have access to"
    on public.cues for update
    using ( auth.uid() in (
        select user_id from public.show_permissions sp
        join public.day_cue_lists dcl on dcl.show_id = sp.show_id
        where dcl.id = cues.day_cue_list_id
    ));

create policy "Users can delete cues they have access to"
    on public.cues for delete
    using ( auth.uid() in (
        select user_id from public.show_permissions sp
        join public.day_cue_lists dcl on dcl.show_id = sp.show_id
        where dcl.id = cues.day_cue_list_id
    ));

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

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
