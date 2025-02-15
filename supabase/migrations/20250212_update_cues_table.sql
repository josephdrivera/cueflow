-- Update cues table with missing columns
DO $$ 
BEGIN
    -- First, alter the day_cue_list_id to allow NULL values temporarily
    ALTER TABLE public.cues ALTER COLUMN day_cue_list_id DROP NOT NULL;

    -- Add show_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'show_id') THEN
        ALTER TABLE public.cues ADD COLUMN show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE;
    END IF;

    -- Add other required columns if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'start_time') THEN
        ALTER TABLE public.cues ADD COLUMN start_time TIME NOT NULL DEFAULT '00:00:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'run_time') THEN
        ALTER TABLE public.cues ADD COLUMN run_time TIME NOT NULL DEFAULT '00:05:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'end_time') THEN
        ALTER TABLE public.cues ADD COLUMN end_time TIME NOT NULL DEFAULT '00:05:00';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'activity') THEN
        ALTER TABLE public.cues ADD COLUMN activity TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'graphics') THEN
        ALTER TABLE public.cues ADD COLUMN graphics TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'video') THEN
        ALTER TABLE public.cues ADD COLUMN video TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'audio') THEN
        ALTER TABLE public.cues ADD COLUMN audio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'lighting') THEN
        ALTER TABLE public.cues ADD COLUMN lighting TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'notes') THEN
        ALTER TABLE public.cues ADD COLUMN notes TEXT;
    END IF;

    -- Add timestamps if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'created_at') THEN
        ALTER TABLE public.cues ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cues' AND column_name = 'updated_at') THEN
        ALTER TABLE public.cues ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;
