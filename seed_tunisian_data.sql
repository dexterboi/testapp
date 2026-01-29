-- ============================================
-- Seed Data: Tunisian Football Complexes & Pitches
-- ============================================
-- This script creates test data for Tunisian football complexes
-- Run this in Supabase SQL Editor after creating tables
-- ============================================

-- First, you need to have at least one owner user
-- Replace 'OWNER_USER_ID' with an actual user ID from auth.users
-- Or create an owner user first, then get their ID

-- ============================================
-- STEP 1: Get or Create Owner User
-- ============================================
-- If you don't have an owner user yet, create one via the app first
-- Then get their ID from: SELECT id FROM auth.users LIMIT 1;
-- Replace 'YOUR_OWNER_USER_ID' below with the actual UUID

-- ============================================
-- STEP 2: Insert Complexes and Pitches
-- ============================================
-- Using DO blocks to insert complexes and their pitches

DO $$
DECLARE
  owner_user_id UUID;
  complex1_id UUID;
  complex2_id UUID;
  complex3_id UUID;
  complex4_id UUID;
  complex5_id UUID;
  complex6_id UUID;
BEGIN
  -- Get the first user as owner (or create one manually first)
  SELECT id INTO owner_user_id FROM auth.users LIMIT 1;
  
  -- If no user exists, you'll need to create one first via the app
  IF owner_user_id IS NULL THEN
    RAISE EXCEPTION 'No user found. Please create a user account first via the app, then run this script again.';
  END IF;

  -- Complex 1: Tunis Sports Center (Tunis)
  INSERT INTO public.complexes (
    name, address, location_lat, location_lng, owner_id, 
    description, phone, email, facilities, images
  ) VALUES (
    'Tunis Sports Center',
    'Avenue Habib Bourguiba, Tunis 1000, Tunisia',
    36.8065, 10.1815,
    owner_user_id,
    'Modern football complex in the heart of Tunis with multiple pitches and excellent facilities. Perfect for training and matches.',
    '+216 71 123 456',
    'contact@tunissports.tn',
    '["Parking", "Changing Rooms", "Showers", "Cafe", "WiFi", "First Aid", "Floodlights"]'::jsonb,
    ARRAY[]::TEXT[]
  ) RETURNING id INTO complex1_id;

  -- Complex 2: Sfax Football Academy (Sfax)
  INSERT INTO public.complexes (
    name, address, location_lat, location_lng, owner_id,
    description, phone, email, facilities, images
  ) VALUES (
    'Sfax Football Academy',
    'Route de Gabes, Sfax 3000, Tunisia',
    34.7406, 10.7603,
    owner_user_id,
    'Professional football academy with state-of-the-art facilities. Home to multiple youth teams and training programs.',
    '+216 74 234 567',
    'info@sfaxacademy.tn',
    '["Parking", "Changing Rooms", "Showers", "Cafe", "WiFi", "First Aid", "Equipment Rental", "Coaching", "Floodlights", "Spectator Seating"]'::jsonb,
    ARRAY[]::TEXT[]
  ) RETURNING id INTO complex2_id;

  -- Complex 3: Sousse Beach Football (Sousse)
  INSERT INTO public.complexes (
    name, address, location_lat, location_lng, owner_id,
    description, phone, email, facilities, images
  ) VALUES (
    'Sousse Beach Football',
    'Corniche de Sousse, Sousse 4000, Tunisia',
    35.8254, 10.6369,
    owner_user_id,
    'Beautiful beachside football complex with stunning views. Perfect for evening matches with sea breeze.',
    '+216 73 345 678',
    'hello@soussebeach.tn',
    '["Parking", "Changing Rooms", "Showers", "Cafe", "WiFi", "Floodlights", "Spectator Seating"]'::jsonb,
    ARRAY[]::TEXT[]
  ) RETURNING id INTO complex3_id;

  -- Complex 4: Ariana Sports Complex (Ariana)
  INSERT INTO public.complexes (
    name, address, location_lat, location_lng, owner_id,
    description, phone, email, facilities, images
  ) VALUES (
    'Ariana Sports Complex',
    'Zone Industrielle, Ariana 2080, Tunisia',
    36.8601, 10.1934,
    owner_user_id,
    'Large sports complex with multiple football pitches. Ideal for tournaments and group training sessions.',
    '+216 71 456 789',
    'contact@arianasports.tn',
    '["Parking", "Changing Rooms", "Showers", "Cafe", "WiFi", "First Aid", "Equipment Rental", "Floodlights", "Security"]'::jsonb,
    ARRAY[]::TEXT[]
  ) RETURNING id INTO complex4_id;

  -- Complex 5: Bardo Football Center (Bardo)
  INSERT INTO public.complexes (
    name, address, location_lat, location_lng, owner_id,
    description, phone, email, facilities, images
  ) VALUES (
    'Bardo Football Center',
    'Avenue de la République, Bardo 2000, Tunisia',
    36.8092, 10.1376,
    owner_user_id,
    'Centrally located football center with excellent accessibility. Popular among local teams and players.',
    '+216 71 567 890',
    'info@bardofootball.tn',
    '["Parking", "Changing Rooms", "Showers", "Cafe", "WiFi", "First Aid", "Floodlights"]'::jsonb,
    ARRAY[]::TEXT[]
  ) RETURNING id INTO complex5_id;

  -- Complex 6: Monastir Elite Football (Monastir)
  INSERT INTO public.complexes (
    name, address, location_lat, location_lng, owner_id,
    description, phone, email, facilities, images
  ) VALUES (
    'Monastir Elite Football',
    'Route de Khniss, Monastir 5000, Tunisia',
    35.7780, 10.8262,
    owner_user_id,
    'Elite football facility with professional-grade pitches. Used by professional teams for training.',
    '+216 73 678 901',
    'contact@monastirelite.tn',
    '["Parking", "Changing Rooms", "Showers", "Cafe", "WiFi", "First Aid", "Equipment Rental", "Coaching", "Floodlights", "Spectator Seating", "Security"]'::jsonb,
    ARRAY[]::TEXT[]
  ) RETURNING id INTO complex6_id;

  -- ============================================
  -- STEP 3: Insert Pitches for Each Complex
  -- ============================================

  -- Pitches for Tunis Sports Center
  INSERT INTO public.pitches (complex_id, name, surface, size, price_per_hour, opening_hour, closing_hour, match_duration, status) VALUES
  (complex1_id, 'Pitch 1 - Main Field', 'Grass', '11 a side', 150, 8, 23, 75, 'active'),
  (complex1_id, 'Pitch 2 - Training', '3G', '7 a side', 100, 8, 23, 75, 'active'),
  (complex1_id, 'Pitch 3 - Quick Match', '4G', '6 a side', 80, 8, 23, 75, 'active');

  -- Pitches for Sfax Football Academy
  INSERT INTO public.pitches (complex_id, name, surface, size, price_per_hour, opening_hour, closing_hour, match_duration, status) VALUES
  (complex2_id, 'Academy Main Pitch', 'Grass', '11 a side', 200, 6, 22, 75, 'active'),
  (complex2_id, 'Youth Training Field', '3G', '7 a side', 120, 6, 22, 75, 'active'),
  (complex2_id, 'Indoor Training', 'indoor', '6 a side', 100, 8, 20, 75, 'active'),
  (complex2_id, 'Practice Field 1', '4G', '7 a side', 90, 8, 22, 75, 'active');

  -- Pitches for Sousse Beach Football
  INSERT INTO public.pitches (complex_id, name, surface, size, price_per_hour, opening_hour, closing_hour, match_duration, status) VALUES
  (complex3_id, 'Beachside Pitch 1', '3G', '7 a side', 120, 8, 23, 75, 'active'),
  (complex3_id, 'Beachside Pitch 2', '3G', '6 a side', 100, 8, 23, 75, 'active'),
  (complex3_id, 'Sunset Field', 'Grass', '7 a side', 110, 8, 23, 75, 'active');

  -- Pitches for Ariana Sports Complex
  INSERT INTO public.pitches (complex_id, name, surface, size, price_per_hour, opening_hour, closing_hour, match_duration, status) VALUES
  (complex4_id, 'Stadium Pitch', 'Grass', '11 a side', 180, 8, 23, 75, 'active'),
  (complex4_id, 'Field A', '3G', '7 a side', 110, 8, 23, 75, 'active'),
  (complex4_id, 'Field B', '3G', '7 a side', 110, 8, 23, 75, 'active'),
  (complex4_id, 'Field C', '4G', '6 a side', 90, 8, 23, 75, 'active'),
  (complex4_id, 'Training Ground', 'Grass', '7 a side', 100, 8, 22, 75, 'active');

  -- Pitches for Bardo Football Center
  INSERT INTO public.pitches (complex_id, name, surface, size, price_per_hour, opening_hour, closing_hour, match_duration, status) VALUES
  (complex5_id, 'Center Pitch', 'Grass', '11 a side', 160, 8, 23, 75, 'active'),
  (complex5_id, 'Side Field 1', '3G', '7 a side', 105, 8, 23, 75, 'active'),
  (complex5_id, 'Side Field 2', '4G', '6 a side', 85, 8, 23, 75, 'active');

  -- Pitches for Monastir Elite Football
  INSERT INTO public.pitches (complex_id, name, surface, size, price_per_hour, opening_hour, closing_hour, match_duration, status) VALUES
  (complex6_id, 'Elite Main Field', 'Grass', '11 a side', 220, 6, 23, 75, 'active'),
  (complex6_id, 'Professional Training', '3G', '11 a side', 180, 6, 23, 75, 'active'),
  (complex6_id, 'Youth Development', '4G', '7 a side', 130, 8, 22, 75, 'active'),
  (complex6_id, 'Indoor Arena', 'indoor', '6 a side', 120, 8, 20, 75, 'active');

END $$;

-- ============================================
-- VERIFICATION
-- ============================================
-- Run these queries to verify the data was inserted:

-- SELECT COUNT(*) as total_complexes FROM public.complexes;
-- SELECT COUNT(*) as total_pitches FROM public.pitches;
-- SELECT c.name, COUNT(p.id) as pitch_count 
-- FROM public.complexes c 
-- LEFT JOIN public.pitches p ON p.complex_id = c.id 
-- GROUP BY c.name;

-- ============================================
-- DATA SUMMARY
-- ============================================
-- This script creates:
-- - 6 Tunisian football complexes
-- - 23 pitches total
-- - Locations in: Tunis, Sfax, Sousse, Ariana, Bardo, Monastir
-- - Prices range from 80-220 TND/hour
-- - All pitches set to 'active' status
-- - Operating hours: 8:00-23:00 (some 6:00-22:00)
-- ============================================
