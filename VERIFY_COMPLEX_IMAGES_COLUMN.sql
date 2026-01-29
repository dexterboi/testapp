-- ============================================
-- VERIFY: Check complexes table images column
-- ============================================
-- Run this in Supabase SQL Editor to verify the images column exists
-- ============================================

-- Check if images column exists and its type
SELECT 
    column_name, 
    data_type,
    udt_name,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'complexes' 
  AND column_name = 'images';

-- If the above returns no rows, the column doesn't exist. Run this to add it:
-- ALTER TABLE public.complexes 
-- ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Check a sample complex to see its images
SELECT 
    id,
    name,
    images,
    array_length(images, 1) as image_count
FROM public.complexes 
LIMIT 5;
