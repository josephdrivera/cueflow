-- Create the show_invitations table to track pending invitations
CREATE TABLE IF NOT EXISTS public.show_invitations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    show_id uuid REFERENCES public.shows(id) ON DELETE CASCADE NOT NULL,
    email TEXT NOT NULL,
    can_edit BOOLEAN DEFAULT false,
    token TEXT NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    UNIQUE(show_id, email)
);

-- Add RLS policies for the show_invitations table
ALTER TABLE public.show_invitations ENABLE ROW LEVEL SECURITY;

-- Only show owners can view invitations for their shows
CREATE POLICY "Show owners can view invitations"
    ON public.show_invitations
    FOR SELECT
    USING (
        (auth.uid() IN (
            SELECT user_id FROM public.shows WHERE id = show_id
        ))
    );

-- Only show owners can create invitations for their shows
CREATE POLICY "Show owners can create invitations"
    ON public.show_invitations
    FOR INSERT
    WITH CHECK (
        (auth.uid() IN (
            SELECT user_id FROM public.shows WHERE id = show_id
        ))
    );

-- Only show owners can delete invitations for their shows
CREATE POLICY "Show owners can delete invitations"
    ON public.show_invitations
    FOR DELETE
    USING (
        (auth.uid() IN (
            SELECT user_id FROM public.shows WHERE id = show_id
        ))
    );

-- Create a function to accept an invitation and add the user as a collaborator
CREATE OR REPLACE FUNCTION public.accept_show_invitation(
    invitation_token TEXT,
    accepting_user_id UUID
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    invitation_record RECORD;
    collaborator_record RECORD;
    result jsonb;
BEGIN
    -- Find the invitation by token
    SELECT * INTO invitation_record
    FROM public.show_invitations
    WHERE token = invitation_token
      AND expires_at > NOW();
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Invalid or expired invitation token';
    END IF;
    
    -- Check if this user already has access to the show
    SELECT * INTO collaborator_record
    FROM public.show_collaborators
    WHERE show_id = invitation_record.show_id
      AND user_id = accepting_user_id;
    
    IF FOUND THEN
        -- User is already a collaborator, just update permissions if needed
        IF collaborator_record.can_edit <> invitation_record.can_edit THEN
            UPDATE public.show_collaborators
            SET can_edit = invitation_record.can_edit
            WHERE id = collaborator_record.id;
        END IF;
    ELSE
        -- Add the user as a collaborator
        INSERT INTO public.show_collaborators (
            show_id, 
            user_id, 
            can_edit
        ) VALUES (
            invitation_record.show_id,
            accepting_user_id,
            invitation_record.can_edit
        );
    END IF;
    
    -- Delete the invitation
    DELETE FROM public.show_invitations
    WHERE id = invitation_record.id;
    
    -- Return the show ID
    result := jsonb_build_object('showId', invitation_record.show_id);
    RETURN result;
END;
$$;
