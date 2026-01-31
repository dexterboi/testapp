-- ============================================
-- UPDATE LOBBY SYSTEM: Add Private/Public Types, Complex, Date/Time
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Add type column (private/public)
ALTER TABLE public.lobbies 
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'public' 
CHECK (type IN ('private', 'public'));

-- Update existing lobbies to be public by default
UPDATE public.lobbies 
SET type = 'public' 
WHERE type IS NULL;

-- Make complex_id required (not nullable) for new lobbies
-- Note: We'll keep it nullable for existing data, but enforce in application
ALTER TABLE public.lobbies 
ALTER COLUMN complex_id DROP NOT NULL; -- First ensure it's nullable if it was required

-- Add preferred date and time fields
ALTER TABLE public.lobbies 
ADD COLUMN IF NOT EXISTS preferred_date DATE;

ALTER TABLE public.lobbies 
ADD COLUMN IF NOT EXISTS preferred_time TIME;

-- Add index for faster queries on public lobbies
CREATE INDEX IF NOT EXISTS idx_lobbies_type ON public.lobbies(type);
CREATE INDEX IF NOT EXISTS idx_lobbies_complex ON public.lobbies(complex_id);
CREATE INDEX IF NOT EXISTS idx_lobbies_date ON public.lobbies(preferred_date);

-- Update lobby_members to support 'requested' status for public lobby access requests
-- Check if status column exists and supports 'requested'
DO $$
BEGIN
    -- Check if 'requested' is already in the CHECK constraint
    IF EXISTS (
        SELECT 1 FROM information_schema.check_constraints 
        WHERE constraint_name LIKE '%lobby_members_status%'
        AND check_clause LIKE '%requested%'
    ) THEN
        RAISE NOTICE 'Status constraint already includes requested';
    ELSE
        -- Try to alter the constraint (may need to drop and recreate)
        RAISE NOTICE 'Note: If lobby_members.status has a CHECK constraint, you may need to update it to include ''requested''';
    END IF;
END $$;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'lobbies' 
AND column_name IN ('type', 'complex_id', 'preferred_date', 'preferred_time')
ORDER BY column_name;
