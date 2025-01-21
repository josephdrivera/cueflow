-- Drop existing trigger first
DROP TRIGGER IF EXISTS set_custom_cue_id ON public.cues;

-- Drop existing functions
DROP FUNCTION IF EXISTS get_next_cue_number(uuid);
DROP FUNCTION IF EXISTS generate_custom_cue_id();

-- Drop existing constraint if it exists
ALTER TABLE public.cues DROP CONSTRAINT IF EXISTS valid_cue_number;

-- Add new constraint for the updated format
ALTER TABLE public.cues ADD CONSTRAINT valid_cue_number 
  CHECK (cue_number ~ '^[A-Z]\d+[a-z]?$');

-- Function to get the next available number for cue IDs
CREATE OR REPLACE FUNCTION get_next_cue_number(p_show_id uuid)
RETURNS integer AS $$
DECLARE
  max_num integer;
BEGIN
  -- Extract the numeric part from existing cue_numbers and find the maximum
  SELECT COALESCE(MAX(NULLIF(regexp_replace(c.cue_number, '^[A-Z]|\d+[a-z]?$', ''), '')::integer), 100)
  INTO max_num
  FROM public.cues c
  WHERE c.show_id = p_show_id
    AND c.cue_number ~ '^[A-Z]\d+[a-z]?$';
  
  RETURN max_num + 1;
END;
$$ LANGUAGE plpgsql;

-- Function to generate custom cue IDs
CREATE OR REPLACE FUNCTION generate_custom_cue_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If no cue_number is provided, generate one
  IF NEW.cue_number IS NULL THEN
    NEW.cue_number := 'A' || get_next_cue_number(NEW.show_id)::text;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to set custom cue IDs
CREATE TRIGGER set_custom_cue_id
  BEFORE INSERT ON public.cues
  FOR EACH ROW
  EXECUTE FUNCTION generate_custom_cue_id();
