-- ============================================
-- Sport Types: configurable duration & buffer per sport
-- ============================================
-- Owners define sport types (e.g. Football 90min, Padel 60min). Each pitch can
-- link to a sport type; slot generation then uses that sport's match_duration
-- and buffer_minutes, so football and padel pitches get different slot grids.
-- Run after supabase_migration.sql (complexes, pitches, user_profiles exist).
-- ============================================

-- 1. Sport types table (owner-level)
CREATE TABLE IF NOT EXISTS public.sport_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  match_duration INTEGER NOT NULL DEFAULT 60 CHECK (match_duration >= 30 AND match_duration <= 180),
  buffer_minutes INTEGER NOT NULL DEFAULT 15 CHECK (buffer_minutes >= 0 AND buffer_minutes <= 60),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for owner lookups
CREATE INDEX IF NOT EXISTS idx_sport_types_owner ON public.sport_types(owner_id);

-- RLS
ALTER TABLE public.sport_types ENABLE ROW LEVEL SECURITY;

-- Anyone can read (app needs to show names; filtering by owner in app)
CREATE POLICY "Anyone can view sport_types"
  ON public.sport_types FOR SELECT
  USING (true);

-- Only owner can insert/update/delete (enforced via Edge Function for website; auth.uid() for app)
CREATE POLICY "Owners can insert own sport_types"
  ON public.sport_types FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update own sport_types"
  ON public.sport_types FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Owners can delete own sport_types"
  ON public.sport_types FOR DELETE
  USING (auth.uid() = owner_id);

-- Trigger updated_at
DROP TRIGGER IF EXISTS update_sport_types_updated_at ON public.sport_types;
CREATE TRIGGER update_sport_types_updated_at
  BEFORE UPDATE ON public.sport_types
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 2. Pitches: add optional link to sport type
ALTER TABLE public.pitches
  ADD COLUMN IF NOT EXISTS sport_type_id UUID REFERENCES public.sport_types(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_pitches_sport_type ON public.pitches(sport_type_id) WHERE sport_type_id IS NOT NULL;

-- ============================================
-- Usage:
-- - When pitch.sport_type_id IS SET: getAvailableSlots uses sport_types.match_duration and sport_types.buffer_minutes.
-- - When pitch.sport_type_id IS NULL: use pitch.match_duration and 15 as buffer (current behavior).
-- ============================================
