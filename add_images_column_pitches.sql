-- ============================================
-- Migration: Add 'images' column to pitches table
-- ============================================
-- Run this in Supabase SQL Editor to fix the error:
-- "Could not find the 'images' column of 'pitches' in the schema cache"
-- ============================================

-- Step 1: Add 'images' column if it doesn't exist
ALTER TABLE public.pitches 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Migrate existing single image to images array (if any exist)
UPDATE public.pitches 
SET images = ARRAY[image]
WHERE image IS NOT NULL AND image != '' AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Step 3: Verify the column was added
-- Run this to check:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'pitches' AND column_name = 'images';

-- ============================================
-- Note: The 'image' column is kept for backward compatibility
-- ============================================
