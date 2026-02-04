-- Add pitch_id to lobbies table
ALTER TABLE lobbies
ADD COLUMN IF NOT EXISTS pitch_id UUID REFERENCES pitches(id);
