-- ============================================
-- ADD: sport_type column to pitches table
-- ============================================
-- This allows each pitch to have a sport type (Football, Padel, Tennis, Basketball, etc.)
-- Run this in Supabase SQL Editor
-- ============================================

-- Add sport_type column to pitches table
ALTER TABLE public.pitches 
ADD COLUMN IF NOT EXISTS sport_type TEXT DEFAULT 'Football' CHECK (sport_type IN ('Football', 'Padel', 'Tennis', 'Basketball', 'Volleyball', 'Handball', 'Rugby', 'Other'));

-- Update existing pitches to have Football as default (if they don't have a sport_type)
UPDATE public.pitches 
SET sport_type = 'Football' 
WHERE sport_type IS NULL;

-- Verify it was added
SELECT column_name, data_type, column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'pitches' 
  AND column_name = 'sport_type';
