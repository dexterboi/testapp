-- Add access_token column to user_profiles for owner website access
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS access_token TEXT;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_access_token ON public.user_profiles(access_token) WHERE access_token IS NOT NULL;

-- Update existing owners to have tokens (optional - you can generate these manually)
-- This generates a random token for owners who don't have one
UPDATE public.user_profiles
SET access_token = encode(gen_random_bytes(32), 'hex')
WHERE role = 'owner' AND access_token IS NULL;

-- Add comment
COMMENT ON COLUMN public.user_profiles.access_token IS 'Access token for owner website dashboard login';
