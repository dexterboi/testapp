-- ============================================
-- FIX: Add DELETE policy for lobbies table
-- ============================================
-- This allows lobby hosts to delete their own lobbies
-- Run this in Supabase SQL Editor
-- ============================================

-- Check if RLS is enabled
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'lobbies'
    ) THEN
        RAISE EXCEPTION 'lobbies table does not exist';
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.lobbies ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Hosts can delete their lobbies" ON public.lobbies;

-- Create DELETE policy for lobby hosts
CREATE POLICY "Hosts can delete their lobbies"
  ON public.lobbies
  FOR DELETE
  USING (auth.uid() = host_id);

-- Also ensure DELETE policies exist for related tables
-- Lobby members
ALTER TABLE public.lobby_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can delete lobby members" ON public.lobby_members;
CREATE POLICY "Anyone can delete lobby members"
  ON public.lobby_members
  FOR DELETE
  USING (true); -- Allow deletion for cleanup when lobby is deleted

-- Lobby messages
ALTER TABLE public.lobby_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can delete lobby messages" ON public.lobby_messages;
CREATE POLICY "Anyone can delete lobby messages"
  ON public.lobby_messages
  FOR DELETE
  USING (true); -- Allow deletion for cleanup when lobby is deleted

-- Verify the policy was created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'lobbies'
  AND cmd = 'DELETE';
