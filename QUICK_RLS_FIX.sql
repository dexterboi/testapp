-- ============================================
-- QUICK FIX: Allow Dashboard Updates
-- ============================================
-- This temporarily allows all operations for testing
-- ⚠️ IMPORTANT: Add proper security after testing!
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Owners can insert their complexes" ON public.complexes;
DROP POLICY IF EXISTS "Owners can update their complexes" ON public.complexes;
DROP POLICY IF EXISTS "Owners can delete their complexes" ON public.complexes;

DROP POLICY IF EXISTS "Complex owners can insert pitches" ON public.pitches;
DROP POLICY IF EXISTS "Complex owners can update pitches" ON public.pitches;
DROP POLICY IF EXISTS "Complex owners can delete pitches" ON public.pitches;

-- Create permissive policies for testing
-- These allow all operations (not secure for production!)
CREATE POLICY "Allow complex operations for dashboard"
    ON public.complexes
    FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow pitch operations for dashboard"
    ON public.pitches
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Verify policies were created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename IN ('complexes', 'pitches')
ORDER BY tablename, policyname;

-- ============================================
-- After testing, replace with secure policies:
-- ============================================
-- Option 1: Use Supabase Edge Functions
-- Option 2: Create policies that validate token via function
-- Option 3: Use service role key in Edge Functions only
-- ============================================
