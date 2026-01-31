# 🔧 Fix: Dashboard Not Saving to Database

## Problem
The dashboard uses **token-based authentication**, but Supabase RLS policies check for `auth.uid()`, which doesn't exist with token auth. This blocks all database updates.

## Solution Options

### Option 1: Use Service Role Key (Quick Fix - Testing Only)
⚠️ **WARNING**: Service role key bypasses RLS. Only use for testing or behind Edge Functions.

1. Get your service role key from Supabase Dashboard → Settings → API
2. Update `config.js`:

```javascript
const SUPABASE_SERVICE_ROLE_KEY = 'your-service-role-key-here';
```

3. Update `dashboard.js` to use service role key instead of anon key for updates.

### Option 2: Create Supabase Edge Function (Recommended for Production)
Create an Edge Function that:
- Validates the token
- Gets user_id from user_profiles
- Performs updates with service role
- Returns results

### Option 3: Temporarily Disable RLS (Testing Only)
Run this SQL in Supabase:

```sql
-- TEMPORARY: Disable RLS for testing
ALTER TABLE public.complexes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches DISABLE ROW LEVEL SECURITY;
```

⚠️ **Re-enable RLS after testing!**

### Option 4: Update RLS Policies (Best Long-term)
Create policies that work with token-based auth using a helper function.

## Quick Test Fix

For immediate testing, run this SQL:

```sql
-- Allow all operations temporarily
DROP POLICY IF EXISTS "Owners can insert their complexes" ON public.complexes;
DROP POLICY IF EXISTS "Owners can update their complexes" ON public.complexes;
DROP POLICY IF EXISTS "Complex owners can insert pitches" ON public.pitches;
DROP POLICY IF EXISTS "Complex owners can update pitches" ON public.pitches;

CREATE POLICY "Allow complex operations"
    ON public.complexes FOR ALL
    USING (true)
    WITH CHECK (true);

CREATE POLICY "Allow pitch operations"
    ON public.pitches FOR ALL
    USING (true)
    WITH CHECK (true);
```

**Remember to add proper security later!**
