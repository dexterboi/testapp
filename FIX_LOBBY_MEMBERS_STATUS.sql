-- ============================================
-- FIX: Update lobby_members status constraint to include 'requested'
-- ============================================
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop the existing constraint if it exists
ALTER TABLE public.lobby_members 
DROP CONSTRAINT IF EXISTS lobby_members_status_check;

-- Recreate the constraint with all valid statuses
ALTER TABLE public.lobby_members 
ADD CONSTRAINT lobby_members_status_check 
CHECK (status IN ('joined', 'invited', 'requested', 'declined', 'blocked'));

-- Add message column for access requests (optional message to owner)
ALTER TABLE public.lobby_members 
ADD COLUMN IF NOT EXISTS request_message TEXT;

-- Verify the constraint
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'public.lobby_members'::regclass
AND conname = 'lobby_members_status_check';
