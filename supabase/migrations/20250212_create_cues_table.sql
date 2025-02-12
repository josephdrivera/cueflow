-- Create cues table
CREATE TABLE IF NOT EXISTS cues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cue_number VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    run_time TIME NOT NULL,
    end_time TIME NOT NULL,
    activity TEXT,
    graphics TEXT,
    video TEXT,
    audio TEXT,
    lighting TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    previous_cue_id UUID REFERENCES cues(id),
    next_cue_id UUID REFERENCES cues(id),
    show_id UUID REFERENCES shows(id) ON DELETE CASCADE,
    UNIQUE(show_id, cue_number)
);
