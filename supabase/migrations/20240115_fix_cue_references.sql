-- Drop existing foreign key constraints if they exist
ALTER TABLE public.cues
DROP CONSTRAINT IF EXISTS cues_show_id_fkey,
DROP CONSTRAINT IF EXISTS cues_day_cue_list_id_fkey;

-- Add day_cue_list_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'cues' 
        AND column_name = 'day_cue_list_id'
    ) THEN
        ALTER TABLE public.cues ADD COLUMN day_cue_list_id UUID;
    END IF;
END $$;

-- Add foreign key constraints with ON DELETE CASCADE
ALTER TABLE public.cues
ADD CONSTRAINT cues_day_cue_list_id_fkey 
FOREIGN KEY (day_cue_list_id) 
REFERENCES public.day_cue_lists(id) 
ON DELETE CASCADE;

-- Clear any orphaned cues (cues without a valid day_cue_list_id)
DELETE FROM public.cues 
WHERE day_cue_list_id IS NULL 
   OR day_cue_list_id NOT IN (SELECT id FROM public.day_cue_lists);

-- Make day_cue_list_id NOT NULL
ALTER TABLE public.cues 
ALTER COLUMN day_cue_list_id SET NOT NULL;
