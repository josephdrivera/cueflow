-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.cue_lists;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.cue_lists;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.cue_lists;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.cue_lists;

-- Enable RLS on cue_lists table
ALTER TABLE public.cue_lists ENABLE ROW LEVEL SECURITY;

-- Create policies for cue_lists
CREATE POLICY "Enable read access for all users" ON public.cue_lists
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.cue_lists
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.cue_lists
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON public.cue_lists
    FOR DELETE USING (auth.uid() IS NOT NULL);

-- Also ensure RLS is properly set for cues table
ALTER TABLE public.cues ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.cues;
DROP POLICY IF EXISTS "Enable insert access for authenticated users" ON public.cues;
DROP POLICY IF EXISTS "Enable update access for authenticated users" ON public.cues;
DROP POLICY IF EXISTS "Enable delete access for authenticated users" ON public.cues;

-- Create policies for cues
CREATE POLICY "Enable read access for all users" ON public.cues
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.cues
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Enable update for authenticated users" ON public.cues
    FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Enable delete for authenticated users" ON public.cues
    FOR DELETE USING (auth.uid() IS NOT NULL);
