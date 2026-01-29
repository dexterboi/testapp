-- ============================================
-- SAFE FIX: Add 'images' column to pitches table
-- ============================================
-- This handles both TEXT and TEXT[] types for the image column
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add the 'images' column (safe - won't error if it exists)
ALTER TABLE public.pitches 
ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Step 2: Initialize empty arrays for pitches that don't have images set
UPDATE public.pitches 
SET images = ARRAY[]::TEXT[]
WHERE images IS NULL;

-- Step 3: Migrate single TEXT image values to images array
-- Only update if images array is empty and image has a value
DO $$
DECLARE
    image_col_type text;
BEGIN
    -- Check the data type of the image column
    SELECT data_type INTO image_col_type
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'pitches' 
      AND column_name = 'image';
    
    -- If image is TEXT (single value), migrate it
    IF image_col_type = 'text' THEN
        UPDATE public.pitches 
        SET images = ARRAY[image]
        WHERE image IS NOT NULL 
          AND image != ''
          AND (images IS NULL OR array_length(images, 1) IS NULL);
    END IF;
    
    -- If image is already TEXT[] (array), copy it
    IF image_col_type = 'ARRAY' THEN
        UPDATE public.pitches 
        SET images = image::TEXT[]
        WHERE image IS NOT NULL 
          AND (images IS NULL OR array_length(images, 1) IS NULL);
    END IF;
END $$;

-- Verify the column exists and check a sample
SELECT 
    id, 
    name, 
    CASE 
        WHEN pg_typeof(image)::text = 'text[]' THEN 'array'
        ELSE 'text'
    END as image_type,
    images
FROM public.pitches 
LIMIT 5;
