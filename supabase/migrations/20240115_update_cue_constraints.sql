-- Drop the old constraint
ALTER TABLE public.cues
DROP CONSTRAINT IF EXISTS valid_cue_number;

-- Add the new constraint that allows optional lowercase letter suffix
ALTER TABLE public.cues
ADD CONSTRAINT valid_cue_number 
CHECK (cue_number ~ '^[A-Z][0-9]{3}[a-z]?$');

-- Update the display_id constraint to match
ALTER TABLE public.cues
ADD CONSTRAINT valid_display_id 
CHECK (display_id ~ '^[A-Z][0-9]{3}[a-z]?$');
