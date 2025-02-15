-- Create cue_lists table
CREATE TABLE IF NOT EXISTS public.cue_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    show_id UUID REFERENCES public.shows(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create RLS policies
ALTER TABLE public.cue_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for authenticated users" ON public.cue_lists
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Enable insert access for authenticated users" ON public.cue_lists
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Enable update access for authenticated users" ON public.cue_lists
    FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Enable delete access for authenticated users" ON public.cue_lists
    FOR DELETE
    TO authenticated
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_cue_lists_updated_at
    BEFORE UPDATE ON public.cue_lists
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
