-- Update cues table to link with cue_lists
DO $$ 
BEGIN
    -- Add cue_list_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'cue_list_id') THEN
        ALTER TABLE public.cues ADD COLUMN cue_list_id UUID REFERENCES public.cue_lists(id) ON DELETE CASCADE;
    END IF;

    -- Add cue_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'cue_number') THEN
        ALTER TABLE public.cues ADD COLUMN cue_number SERIAL;
    END IF;

    -- Drop show_id column if it exists (since cues will now be linked through cue_lists)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'show_id') THEN
        ALTER TABLE public.cues DROP COLUMN show_id;
    END IF;
END $$;

-- Add unique constraint to ensure cue numbers are unique within a cue list
ALTER TABLE public.cues 
ADD CONSTRAINT unique_cue_number_per_list 
UNIQUE (cue_list_id, cue_number);
