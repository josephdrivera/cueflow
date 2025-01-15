-- Add display_id column to cues table
ALTER TABLE public.cues
ADD COLUMN IF NOT EXISTS display_id VARCHAR(10);

-- Initially set display_id to match cue_number
UPDATE public.cues
SET display_id = cue_number
WHERE display_id IS NULL;

-- Add NOT NULL constraint
ALTER TABLE public.cues
ALTER COLUMN display_id SET NOT NULL;
