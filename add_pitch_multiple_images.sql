-- ============================================
-- Migration: Add Multiple Images Support for Pitches
-- ============================================
-- This script changes the 'image' field to 'images' array
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add new 'images' column
ALTER TABLE public.pitches 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing single image to images array
UPDATE public.pitches 
SET images = ARRAY[image]
WHERE image IS NOT NULL AND image != '';

-- Step 3: Drop the old 'image' column (optional - you can keep it for backward compatibility)
-- Uncomment the line below if you want to remove the old column:
-- ALTER TABLE public.pitches DROP COLUMN IF EXISTS image;

-- ============================================
-- Verification
-- ============================================
-- Run this to verify the migration:
-- SELECT id, name, image, images FROM public.pitches LIMIT 5;
