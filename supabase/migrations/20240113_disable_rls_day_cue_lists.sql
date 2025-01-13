-- Disable RLS for day_cue_lists table temporarily
ALTER TABLE public.day_cue_lists DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Enable read access for all users" ON public.day_cue_lists;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.day_cue_lists;
