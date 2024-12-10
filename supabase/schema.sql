-- Enable the necessary extensions
create extension if not exists "uuid-ossp";

-- Create custom types
create type user_role as enum ('admin', 'user');
create type file_type as enum ('cue id', 'audio', 'video', 'image', 'document', 'other');

-- Create users table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  role user_role default 'user'::user_role,
  constraint username_length check (char_length(username) >= 3)
);

-- Create shows table
create table public.shows (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  title text not null,
  description text,
  creator_id uuid references public.profiles(id) on delete set null,
  is_template boolean default false,
  metadata jsonb default '{}'::jsonb
);

-- Create show_flows table
create table public.show_flows (
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
create table public.files (
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
create table public.show_collaborators (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  show_id uuid references public.shows(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  can_edit boolean default false,
  unique(show_id, user_id)
);

-- Create RLS policies
alter table public.profiles enable row level security;
alter table public.shows enable row level security;
alter table public.show_flows enable row level security;
alter table public.files enable row level security;
alter table public.show_collaborators enable row level security;

-- Profiles policies
create policy "Public profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Shows policies
create policy "Shows are viewable by creator and collaborators"
  on public.shows for select
  using (
    auth.uid() = creator_id or
    exists (
      select 1 from public.show_collaborators
      where show_id = id and user_id = auth.uid()
    )
  );

create policy "Shows can be created by authenticated users"
  on public.shows for insert
  with check (auth.uid() = creator_id);

create policy "Shows can be updated by creator and editors"
  on public.shows for update
  using (
    auth.uid() = creator_id or
    exists (
      select 1 from public.show_collaborators
      where show_id = id and user_id = auth.uid() and can_edit = true
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
