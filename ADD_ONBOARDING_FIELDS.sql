-- Add new fields to user_profiles table for onboarding
-- Run this SQL in Supabase SQL Editor

-- Add profile_completed boolean field
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;

-- Add address field
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS address TEXT;

-- Add bio field
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS bio TEXT;

-- Add social media fields
ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS instagram TEXT;

ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS twitter TEXT;

ALTER TABLE IF EXISTS user_profiles 
ADD COLUMN IF NOT EXISTS facebook TEXT;

-- Update existing users to have profile_completed = TRUE
-- (since they already have profiles)
UPDATE user_profiles 
SET profile_completed = TRUE 
WHERE name IS NOT NULL AND name != '';

-- Create index for faster lookup
CREATE INDEX IF NOT EXISTS idx_user_profiles_profile_completed 
ON user_profiles(profile_completed);

-- Also check if we need to create the users table reference
-- This ensures RLS policies work correctly
COMMENT ON TABLE user_profiles IS 'Extended user profile information';
