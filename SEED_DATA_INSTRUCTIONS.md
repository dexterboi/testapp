# Seed Data Instructions - Tunisian Football Complexes

This guide explains how to populate your Supabase database with test data for Tunisian football complexes and pitches.

## Prerequisites

1. **You must have at least one user account** in your Supabase database (created via the app)
2. The user should ideally have `role = 'owner'` in the `user_profiles` table
3. All tables must be created (run `supabase_migration.sql` first if you haven't)

## Steps to Run

### Step 1: Create a User Account (if you don't have one)

1. Open your app: `http://localhost:3000`
2. Sign up for a new account
3. **Important:** After signing up, go to Supabase Dashboard → Authentication → Users
4. Copy the user's UUID (you'll need it if the script fails)

### Step 2: Update User Role to Owner (Optional but Recommended)

1. Go to Supabase Dashboard → Table Editor → `user_profiles`
2. Find your user
3. Update the `role` field to `'owner'` (lowercase)

### Step 3: Run the Seed Script

1. Open Supabase Dashboard → SQL Editor
2. Copy the entire contents of `seed_tunisian_data.sql`
3. Paste it into the SQL Editor
4. Click **Run** (or press `Ctrl/Cmd + Enter`)

### Step 4: Verify the Data

Run these queries in Supabase SQL Editor to verify:

```sql
-- Count complexes
SELECT COUNT(*) as total_complexes FROM public.complexes;

-- Count pitches
SELECT COUNT(*) as total_pitches FROM public.pitches;

-- View complexes with pitch counts
SELECT 
  c.name, 
  c.address,
  COUNT(p.id) as pitch_count 
FROM public.complexes c 
LEFT JOIN public.pitches p ON p.complex_id = c.id 
GROUP BY c.id, c.name, c.address
ORDER BY c.name;
```

## What Gets Created

The script creates:

- **6 Tunisian Football Complexes:**
  1. Tunis Sports Center (Tunis)
  2. Sfax Football Academy (Sfax)
  3. Sousse Beach Football (Sousse)
  4. Ariana Sports Complex (Ariana)
  5. Bardo Football Center (Bardo)
  6. Monastir Elite Football (Monastir)

- **23 Pitches Total:**
  - Various surfaces: Grass, 3G, 4G, Indoor
  - Various sizes: 6 a side, 7 a side, 11 a side
  - Prices: 80-220 TND/hour
  - Operating hours: 8:00-23:00 (some 6:00-22:00)
  - All set to 'active' status

## Troubleshooting

### Error: "No user found"
- **Solution:** Create a user account first via the app, then run the script again

### Error: "permission denied"
- **Solution:** Make sure you're running the script as a database admin or with proper RLS policies

### Error: "duplicate key value"
- **Solution:** The data already exists. Delete existing complexes/pitches first, or modify the script to use `ON CONFLICT` clauses

### Complexes created but no pitches
- **Solution:** Check if the complex IDs were correctly retrieved. The script uses variables, so if complexes were created, pitches should be too. Verify with the queries above.

## Testing in the App

After running the script:

1. Refresh your app (`http://localhost:3000`)
2. Go to the **Discover** page
3. You should see 6 complexes listed
4. Click on any complex to see its pitches
5. Try booking a pitch to test the booking system

## Notes

- All complexes are assigned to the **first user** in your `auth.users` table
- If you want to assign complexes to a specific user, modify the script to use a specific UUID
- Prices are in Tunisian Dinar (TND)
- Coordinates are real locations in Tunisia
- Facilities are stored as JSON arrays
- Images arrays are empty - you can upload images via the owner dashboard
