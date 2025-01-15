-- Disable RLS on tables temporarily
alter table public.shows disable row level security;
alter table public.day_cue_lists disable row level security;
alter table public.cues disable row level security;
alter table public.files disable row level security;
alter table public.show_flows disable row level security;

-- Note: We'll need to re-enable these and set up proper permissions later
-- when implementing the authentication system
