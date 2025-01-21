-- Add delete policy for cues table
CREATE POLICY "Enable delete for authenticated users" ON public.cues
    FOR DELETE USING (true);

-- Ensure RLS is disabled as per current setup
ALTER TABLE public.cues DISABLE ROW LEVEL SECURITY;
