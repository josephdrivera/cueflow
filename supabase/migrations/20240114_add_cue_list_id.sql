-- Add cue_list_id column to cues table
ALTER TABLE public.cues 
ADD COLUMN IF NOT EXISTS cue_list_id UUID REFERENCES public.day_cue_lists(id) ON DELETE CASCADE;

-- Update existing cues to have a default cue list if needed
DO $$
DECLARE
    default_show_id UUID;
    default_cue_list_id UUID;
BEGIN
    -- Get the first show
    SELECT id INTO default_show_id FROM public.shows LIMIT 1;
    
    IF default_show_id IS NOT NULL THEN
        -- Create a default cue list if none exists
        INSERT INTO public.day_cue_lists (show_id, name, date)
        SELECT default_show_id, 'Default List', CURRENT_DATE
        WHERE NOT EXISTS (
            SELECT 1 FROM public.day_cue_lists WHERE show_id = default_show_id
        )
        RETURNING id INTO default_cue_list_id;
        
        -- If we didn't create a new one, get the existing one
        IF default_cue_list_id IS NULL THEN
            SELECT id INTO default_cue_list_id 
            FROM public.day_cue_lists 
            WHERE show_id = default_show_id 
            LIMIT 1;
        END IF;
        
        -- Update existing cues to use the default cue list
        UPDATE public.cues
        SET cue_list_id = default_cue_list_id
        WHERE cue_list_id IS NULL AND show_id = default_show_id;
    END IF;
END $$;
