-- Create shows table if it doesn't exist
CREATE TABLE IF NOT EXISTS shows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Add trigger to update updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_shows_updated_at') THEN
        CREATE TRIGGER update_shows_updated_at
            BEFORE UPDATE ON shows
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create cues table if it doesn't exist
CREATE TABLE IF NOT EXISTS cues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    show_id UUID NOT NULL,
    cue_number TEXT NOT NULL,
    previous_cue_id UUID REFERENCES cues(id) ON DELETE SET NULL,
    next_cue_id UUID REFERENCES cues(id) ON DELETE SET NULL,
    start_time TEXT,
    run_time TEXT,
    end_time TEXT,
    activity TEXT,
    graphics TEXT,
    video TEXT,
    audio TEXT,
    lighting TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE (show_id, cue_number)
);

-- Alter cues table to add show_id foreign key if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_name = 'cues_show_id_fkey'
    ) THEN
        ALTER TABLE cues
        ADD CONSTRAINT cues_show_id_fkey
        FOREIGN KEY (show_id)
        REFERENCES shows(id)
        ON DELETE CASCADE;
    END IF;
END
$$;

-- Add trigger to update updated_at column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_cues_updated_at') THEN
        CREATE TRIGGER update_cues_updated_at
            BEFORE UPDATE ON cues
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END
$$;

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc', NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';
