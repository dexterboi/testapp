-- ============================================
-- PitchPerfect Database Migration to Supabase
-- ============================================
-- This script drops existing tables and creates new ones
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing tables (if they exist) in correct order (respecting foreign keys)
-- This will also drop all associated policies and triggers
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS pitches CASCADE;
DROP TABLE IF EXISTS complexes CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- ============================================
-- 1. USER PROFILES TABLE
-- ============================================
-- Extends Supabase auth.users with custom fields
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'player' CHECK (role IN ('player', 'owner')),
  phone TEXT,
  avatar TEXT, -- URL to avatar image in storage
  loyalty_points INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  games_played INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON public.user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ============================================
-- 2. COMPLEXES TABLE
-- ============================================
CREATE TABLE public.complexes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  location_lat NUMERIC(10, 8),
  location_lng NUMERIC(11, 8),
  owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  description TEXT CHECK (char_length(description) <= 500),
  phone TEXT,
  email TEXT,
  facilities JSONB DEFAULT '[]'::jsonb, -- Array of facility names
  images TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of image URLs from storage
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.complexes ENABLE ROW LEVEL SECURITY;

-- Policies for complexes
CREATE POLICY "Anyone can view complexes"
  ON public.complexes FOR SELECT
  USING (true);

CREATE POLICY "Owners can insert their complexes"
  ON public.complexes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their complexes"
  ON public.complexes FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their complexes"
  ON public.complexes FOR DELETE
  USING (auth.uid() = owner_id);

-- ============================================
-- 3. PITCHES TABLE
-- ============================================
CREATE TABLE public.pitches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complex_id UUID REFERENCES public.complexes(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  surface TEXT CHECK (surface IN ('Grass', '3G', '4G', 'outdoor', 'indoor')),
  size TEXT CHECK (size IN ('6 a side', '7 a side', '11 a side')),
  price_per_hour NUMERIC(10, 2) DEFAULT 0,
  image TEXT, -- URL to image in storage
  opening_hour INTEGER DEFAULT 8 CHECK (opening_hour >= 0 AND opening_hour <= 23),
  closing_hour INTEGER DEFAULT 23 CHECK (closing_hour >= 0 AND closing_hour <= 23),
  match_duration INTEGER DEFAULT 75 CHECK (match_duration >= 30 AND match_duration <= 180),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;

-- Policies for pitches
CREATE POLICY "Anyone can view pitches"
  ON public.pitches FOR SELECT
  USING (true);

CREATE POLICY "Complex owners can insert pitches"
  ON public.pitches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.complexes
      WHERE complexes.id = pitches.complex_id
      AND complexes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Complex owners can update pitches"
  ON public.pitches FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.complexes
      WHERE complexes.id = pitches.complex_id
      AND complexes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Complex owners can delete pitches"
  ON public.pitches FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.complexes
      WHERE complexes.id = pitches.complex_id
      AND complexes.owner_id = auth.uid()
    )
  );

-- ============================================
-- 4. BOOKINGS TABLE
-- ============================================
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID REFERENCES public.pitches(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  total_price NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancel_request', 'cancelled', 'completed')),
  access_code TEXT, -- Generated code for approved bookings
  date_time TIMESTAMP WITH TIME ZONE, -- Legacy field (deprecated, kept for compatibility)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Ensure end_time is after start_time
  CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Enable Row Level Security
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Policies for bookings
CREATE POLICY "Users can view own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Complex owners can view their bookings"
  ON public.bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      JOIN public.complexes ON pitches.complex_id = complexes.id
      WHERE pitches.id = bookings.pitch_id
      AND complexes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can view bookings" -- For public availability checking
  ON public.bookings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Complex owners can update their bookings"
  ON public.bookings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.pitches
      JOIN public.complexes ON pitches.complex_id = complexes.id
      WHERE pitches.id = bookings.pitch_id
      AND complexes.owner_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete own bookings"
  ON public.bookings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================

-- Complexes indexes
CREATE INDEX idx_complexes_owner ON public.complexes(owner_id);
CREATE INDEX idx_complexes_location ON public.complexes(location_lat, location_lng);

-- Pitches indexes
CREATE INDEX idx_pitches_complex ON public.pitches(complex_id);
CREATE INDEX idx_pitches_status ON public.pitches(status);

-- Bookings indexes
CREATE INDEX idx_bookings_pitch ON public.bookings(pitch_id);
CREATE INDEX idx_bookings_user ON public.bookings(user_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_start_time ON public.bookings(start_time);
CREATE INDEX idx_bookings_end_time ON public.bookings(end_time);
CREATE INDEX idx_bookings_time_range ON public.bookings USING GIST (tstzrange(start_time, end_time));

-- ============================================
-- 6. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON public.user_profiles;
DROP TRIGGER IF EXISTS update_complexes_updated_at ON public.complexes;
DROP TRIGGER IF EXISTS update_pitches_updated_at ON public.pitches;
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_complexes_updated_at
  BEFORE UPDATE ON public.complexes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pitches_updated_at
  BEFORE UPDATE ON public.pitches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'player')
  )
  ON CONFLICT (id) DO NOTHING; -- Prevent duplicate inserts
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 7. STORAGE BUCKETS (for file uploads)
-- ============================================
-- Note: Run these in Supabase Dashboard > Storage or via SQL

-- Create storage bucket for user avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for complex images
INSERT INTO storage.buckets (id, name, public)
VALUES ('complex-images', 'complex-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for pitch images
INSERT INTO storage.buckets (id, name, public)
VALUES ('pitch-images', 'pitch-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view complex images" ON storage.objects;
DROP POLICY IF EXISTS "Complex owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Complex owners can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view pitch images" ON storage.objects;
DROP POLICY IF EXISTS "Pitch owners can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Pitch owners can delete images" ON storage.objects;

-- Storage policies for avatars
CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own avatar"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Storage policies for complex images
CREATE POLICY "Anyone can view complex images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'complex-images');

-- Complex images: Allow authenticated users to manage
-- Ownership will be checked in application code
CREATE POLICY "Authenticated users can upload complex images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'complex-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete complex images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'complex-images' AND
    auth.uid() IS NOT NULL
  );

-- Storage policies for pitch images
CREATE POLICY "Anyone can view pitch images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'pitch-images');

-- Pitch images: Allow authenticated users to manage
-- Ownership will be checked in application code
CREATE POLICY "Authenticated users can upload pitch images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'pitch-images' AND
    auth.uid() IS NOT NULL
  );

CREATE POLICY "Authenticated users can delete pitch images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'pitch-images' AND
    auth.uid() IS NOT NULL
  );

-- ============================================
-- MIGRATION COMPLETE
-- ============================================
-- Next steps:
-- 1. Update your app code to use Supabase client
-- 2. Update environment variables
-- 3. Test all functionality
-- ============================================
