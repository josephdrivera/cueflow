-- Fix the infinite recursion in show_collaborators policy

-- First, drop the problematic policy
DROP POLICY IF EXISTS "Show collaborators are viewable by show members" ON public.show_collaborators;

-- Create the fixed policy
CREATE POLICY "Show collaborators are viewable by show members" ON public.show_collaborators
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND (
            user_id = auth.uid()
        )
    ) OR 
    user_id = auth.uid()
);

-- Verify that RLS is enabled
ALTER TABLE IF EXISTS public.show_collaborators ENABLE ROW LEVEL SECURITY;
