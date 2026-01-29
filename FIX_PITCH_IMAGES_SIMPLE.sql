-- ============================================
-- SIMPLE FIX: Add 'images' column to pitches table
-- ============================================
-- This fixes the error: "Could not find the 'images' column of 'pitches'"
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add the 'images' column
ALTER TABLE public.pitches 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Check what type the 'image' column is
-- Run this first to see the column type:
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_schema = 'public' 
--   AND table_name = 'pitches' 
--   AND column_name = 'image';

-- Step 3: If image is TEXT (single value), migrate it:
UPDATE public.pitches 
SET images = ARRAY[image::text]
WHERE image IS NOT NULL 
  AND pg_typeof(image)::text = 'text'
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Step 4: If image is already TEXT[] (array), copy it:
UPDATE public.pitches 
SET images = image::TEXT[]
WHERE image IS NOT NULL 
  AND pg_typeof(image)::text = 'text[]'
  AND (images IS NULL OR array_length(images, 1) IS NULL);

-- Verify it worked
SELECT id, name, image, images FROM public.pitches LIMIT 5;
