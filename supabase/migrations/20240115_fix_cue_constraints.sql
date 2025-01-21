-- Drop the old unique constraint
ALTER TABLE public.cues
DROP CONSTRAINT IF EXISTS unique_show_cue_number;

-- Add the new unique constraint for day_cue_list_id and cue_number
ALTER TABLE public.cues
ADD CONSTRAINT unique_day_cue_list_cue_number 
UNIQUE (day_cue_list_id, cue_number);
