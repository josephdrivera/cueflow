-- Update cues table to use custom ID format
ALTER TABLE public.cues 
  ALTER COLUMN id TYPE text,  -- Change from uuid to text
  ALTER COLUMN id DROP DEFAULT;  -- Remove uuid generation

-- Add a trigger to auto-generate custom cue ID
CREATE OR REPLACE FUNCTION generate_custom_cue_id()
RETURNS TRIGGER AS $$
BEGIN
  -- Format: SHOW_PREFIX-CUE_NUMBER (e.g., SH1-A101)
  NEW.id = 'CUE-' || NEW.cue_number;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_custom_cue_id
  BEFORE INSERT ON public.cues
  FOR EACH ROW
  EXECUTE FUNCTION generate_custom_cue_id();

-- Update existing cues with new ID format
UPDATE public.cues
SET id = 'CUE-' || cue_number
WHERE id IS NOT NULL;
