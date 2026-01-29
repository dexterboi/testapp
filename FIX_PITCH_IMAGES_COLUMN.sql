-- ============================================
-- FIX: Add 'images' column to pitches table
-- ============================================
-- This fixes the error: "Could not find the 'images' column of 'pitches'"
-- 
-- INSTRUCTIONS:
-- 1. Go to Supabase Dashboard: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Go to SQL Editor
-- 4. Copy and paste this entire file
-- 5. Click "Run"
-- ============================================

-- Add the 'images' column to pitches table
ALTER TABLE public.pitches 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Migrate any existing single images to the images array
-- Handle both TEXT and TEXT[] types for the image column
UPDATE public.pitches 
SET images = CASE
  WHEN pg_typeof(image)::text = 'text[]' THEN 
    -- If image is already an array, use it directly
    image::TEXT[]
  WHEN image IS NOT NULL AND image::text != '' THEN 
    -- If image is a single text value, convert to array
    ARRAY[image::text]
  ELSE 
    -- Otherwise, empty array
    ARRAY[]::TEXT[]
END
WHERE (images IS NULL OR array_length(images, 1) IS NULL);

-- Verify it worked (this will show the column exists)
SELECT 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pitches' 
  AND column_name = 'images';
