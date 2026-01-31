-- Fix Role Constraint in user_profiles table
-- Run this in Supabase SQL Editor if you've already created the tables

-- Drop the old constraint (if it exists)
ALTER TABLE public.user_profiles 
DROP CONSTRAINT IF EXISTS user_profiles_role_check;

-- Add the new constraint with only 'player' and 'owner'
ALTER TABLE public.user_profiles 
ADD CONSTRAINT user_profiles_role_check 
CHECK (role IN ('player', 'owner'));

-- Update any existing inconsistent values
UPDATE public.user_profiles 
SET role = 'player' 
WHERE role NOT IN ('player', 'owner') OR role IS NULL;

UPDATE public.user_profiles 
SET role = LOWER(role) 
WHERE role IN ('Owner', 'User');

-- Verify the constraint
SELECT DISTINCT role FROM public.user_profiles;
