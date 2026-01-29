-- ============================================
-- FINAL FIX: Add 'images' column to pitches table
-- ============================================
-- Simple version - just adds the column, no migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Just add the column - that's all we need
ALTER TABLE public.pitches 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Verify it was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pitches' 
  AND column_name IN ('image', 'images')
ORDER BY column_name;
