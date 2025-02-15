-- Add is_archived column to shows table
ALTER TABLE shows ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT FALSE;

-- Create an index for faster querying of archived shows
CREATE INDEX IF NOT EXISTS idx_shows_is_archived ON shows(is_archived);
