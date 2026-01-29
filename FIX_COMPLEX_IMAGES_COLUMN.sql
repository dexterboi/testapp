-- ============================================
-- FIX: Ensure 'images' column exists in complexes table
-- ============================================
-- Run this in Supabase SQL Editor if you get errors about missing 'images' column
-- ============================================

-- Add the images column if it doesn't exist
ALTER TABLE public.complexes 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'complexes' 
  AND column_name = 'images';
