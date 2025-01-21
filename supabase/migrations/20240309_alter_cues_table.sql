-- Add new columns for cue ordering and numbering if they don't exist
DO $$ 
BEGIN
    -- Add columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'cue_number') THEN
        ALTER TABLE public.cues ADD COLUMN cue_number VARCHAR(10);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'previous_cue_id') THEN
        ALTER TABLE public.cues ADD COLUMN previous_cue_id UUID REFERENCES public.cues(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'next_cue_id') THEN
        ALTER TABLE public.cues ADD COLUMN next_cue_id UUID REFERENCES public.cues(id);
    END IF;

    -- Only populate cue numbers if the column was just added (i.e., all values are null)
    IF EXISTS (SELECT 1 FROM public.cues WHERE cue_number IS NULL) THEN
        WITH numbered_cues AS (
            SELECT 
                id,
                show_id,
                CONCAT('A', LPAD(ROW_NUMBER() OVER (PARTITION BY show_id ORDER BY start_time), 3, '0')) as new_cue_number
            FROM public.cues
            WHERE cue_number IS NULL
        )
        UPDATE public.cues c
        SET cue_number = nc.new_cue_number
        FROM numbered_cues nc
        WHERE c.id = nc.id;
    END IF;

    -- Add constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_show_cue_number'
    ) THEN
        -- Make cue_number NOT NULL if it isn't already
        ALTER TABLE public.cues 
            ALTER COLUMN cue_number SET NOT NULL;

        -- Add unique constraint and format validation
        ALTER TABLE public.cues
            ADD CONSTRAINT unique_show_cue_number UNIQUE(show_id, cue_number),
            ADD CONSTRAINT valid_cue_number CHECK (cue_number ~ '^[A-Z][0-9]{3}$');
    END IF;

    -- Create index if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_indexes 
        WHERE tablename = 'cues' 
        AND indexname = 'idx_cues_show_id_cue_number'
    ) THEN
        CREATE INDEX idx_cues_show_id_cue_number ON public.cues(show_id, cue_number);
    END IF;

END $$;
