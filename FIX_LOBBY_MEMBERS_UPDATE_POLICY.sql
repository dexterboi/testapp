-- ============================================
-- FIX: Add UPDATE policy for lobby_members table
-- ============================================
-- This allows lobby hosts to update member status (approve/decline requests)
-- and allows users to accept/decline their own invites
-- Run this in Supabase SQL Editor
-- ============================================

-- Enable RLS if not already enabled
ALTER TABLE public.lobby_members ENABLE ROW LEVEL SECURITY;

-- Drop existing UPDATE policies if they exist
DROP POLICY IF EXISTS "Hosts can update lobby members" ON public.lobby_members;
DROP POLICY IF EXISTS "Users can update own lobby membership" ON public.lobby_members;

-- Policy 1: Lobby hosts can update any member in their lobby
CREATE POLICY "Hosts can update lobby members"
  ON public.lobby_members
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.lobbies
      WHERE lobbies.id = lobby_members.lobby_id
      AND lobbies.host_id = auth.uid()
    )
  );

-- Policy 2: Users can update their own membership status (accept/decline invites)
CREATE POLICY "Users can update own lobby membership"
  ON public.lobby_members
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Verify the policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'lobby_members'
  AND cmd = 'UPDATE'
ORDER BY policyname;
