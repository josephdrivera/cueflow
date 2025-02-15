-- Create a function to update cue references
CREATE OR REPLACE FUNCTION public.update_cue_references(target_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    -- Update previous_cue_id references
    UPDATE public.cues
    SET previous_cue_id = NULL
    WHERE previous_cue_id = target_id;

    -- Update next_cue_id references
    UPDATE public.cues
    SET next_cue_id = NULL
    WHERE next_cue_id = target_id;
END;
$$;
