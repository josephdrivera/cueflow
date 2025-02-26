-- Fix the shows table policies

-- First, drop existing policies
DROP POLICY IF EXISTS "Shows are viewable by creator and collaborators" ON public.shows;
DROP POLICY IF EXISTS "Users can create shows" ON public.shows;
DROP POLICY IF EXISTS "Shows are editable by creator and collaborators with edit permission" ON public.shows;
DROP POLICY IF EXISTS "Users can delete their own shows" ON public.shows;

-- Ensure RLS is enabled
ALTER TABLE IF EXISTS public.shows ENABLE ROW LEVEL SECURITY;

-- Recreate the policies
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
