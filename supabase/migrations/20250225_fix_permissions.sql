-- Fix Supabase permission issues

-- First, ensure RLS is enabled on all tables
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.shows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.show_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.day_cue_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.files ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.show_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.show_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.cue_lists ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies for these tables
DO $$ 
DECLARE
    _sql text;
BEGIN
    FOR _sql IN (
        SELECT format('DROP POLICY IF EXISTS %I ON %I.%I', 
               pol.policyname, pol.schemaname, pol.tablename)
        FROM pg_policies pol
        WHERE pol.schemaname = 'public' 
        AND pol.tablename IN ('cues', 'cue_lists', 'show_invitations', 'show_collaborators', 'profiles')
    ) LOOP
        EXECUTE _sql;
    END LOOP;
END $$;

-- Create proper policies for cues
CREATE POLICY "Cues are viewable by show members" ON public.cues
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.cue_lists cl
        JOIN public.shows s ON cl.show_id = s.id
        WHERE cues.cue_list_id = cl.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Cues are insertable by show members with edit permission" ON public.cues
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.cue_lists cl
        JOIN public.shows s ON cl.show_id = s.id
        WHERE cues.cue_list_id = cl.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

CREATE POLICY "Cues are updatable by show members with edit permission" ON public.cues
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.cue_lists cl
        JOIN public.shows s ON cl.show_id = s.id
        WHERE cues.cue_list_id = cl.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

CREATE POLICY "Cues are deletable by show members with edit permission" ON public.cues
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.cue_lists cl
        JOIN public.shows s ON cl.show_id = s.id
        WHERE cues.cue_list_id = cl.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

-- Create proper policies for cue_lists
CREATE POLICY "Cue lists are viewable by show members" ON public.cue_lists
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE cue_lists.show_id = s.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid()
            )
        )
    )
);

CREATE POLICY "Cue lists are insertable by show members with edit permission" ON public.cue_lists
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE cue_lists.show_id = s.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

CREATE POLICY "Cue lists are updatable by show members with edit permission" ON public.cue_lists
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE cue_lists.show_id = s.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

CREATE POLICY "Cue lists are deletable by show members with edit permission" ON public.cue_lists
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.shows s
        WHERE cue_lists.show_id = s.id AND (
            s.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.show_collaborators sc
                WHERE sc.show_id = s.id AND sc.user_id = auth.uid() AND sc.can_edit = true
            )
        )
    )
);

-- Fix show_invitations policies
CREATE POLICY "Show owners can view invitations" ON public.show_invitations
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Show owners can create invitations" ON public.show_invitations
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND user_id = auth.uid()
    )
);

CREATE POLICY "Show owners can delete invitations" ON public.show_invitations
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND user_id = auth.uid()
    )
);

-- Fix shows policies
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

-- Fix show_collaborators policies
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

CREATE POLICY "Show collaborators can be managed by show creator" ON public.show_collaborators
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.shows
        WHERE id = show_id AND user_id = auth.uid()
    )
);

-- Fix profiles policies to ensure proper access
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
FOR UPDATE USING (auth.uid() = id);
