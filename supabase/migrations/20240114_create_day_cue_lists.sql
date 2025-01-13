-- Create day_cue_lists table
CREATE TABLE IF NOT EXISTS public.day_cue_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    show_id UUID NOT NULL REFERENCES public.shows(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    description TEXT,
    order_index INTEGER,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'::jsonb,
    UNIQUE(show_id, date)
);

-- Enable RLS
ALTER TABLE public.day_cue_lists ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Enable read access for all users" ON public.day_cue_lists
    FOR SELECT USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.day_cue_lists
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users" ON public.day_cue_lists
    FOR UPDATE USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users" ON public.day_cue_lists
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create updated_at trigger
CREATE TRIGGER set_updated_at
    BEFORE UPDATE ON public.day_cue_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();
