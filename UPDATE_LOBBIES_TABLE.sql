-- Add new columns to lobbies table for Match system
ALTER TABLE lobbies
ADD COLUMN IF NOT EXISTS level TEXT CHECK (level IN ('beginner', 'intermediate', 'pro', 'all')),
ADD COLUMN IF NOT EXISTS age_range TEXT,
ADD COLUMN IF NOT EXISTS team_size INTEGER DEFAULT 5,
ADD COLUMN IF NOT EXISTS price_per_player NUMERIC DEFAULT 0;

-- Update existing lobbies to have default values
UPDATE lobbies SET level = 'all' WHERE level IS NULL;
