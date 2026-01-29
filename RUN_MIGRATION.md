# How to Run the Supabase Migration

## ✅ Fixed Issues

The migration script has been updated to handle:
- ✅ Existing triggers (drops them before creating)
- ✅ Existing policies (drops them before creating)
- ✅ Existing functions (drops them before creating)
- ✅ Can be run multiple times safely (idempotent)

## 🚀 Steps to Run

### 1. Open Supabase Dashboard

Go to: https://supabase.com/dashboard
- Select your project: `dgpdlwklqvbmdtalyiis`

### 2. Open SQL Editor

- Click on **SQL Editor** in the left sidebar
- Click **New Query**

### 3. Copy and Paste

1. Open `supabase_migration.sql` file
2. Copy **ALL** the contents (Ctrl+A, Ctrl+C or Cmd+A, Cmd+C)
3. Paste into the SQL Editor

### 4. Run the Script

- Click the **Run** button (or press Ctrl+Enter / Cmd+Enter)
- Wait for it to complete (should take a few seconds)

### 5. Verify Success

You should see:
- ✅ "Success. No rows returned"
- ✅ No error messages

### 6. Check Tables

Go to **Table Editor** and verify these tables exist:
- ✅ `user_profiles`
- ✅ `complexes`
- ✅ `pitches`
- ✅ `bookings`

### 7. Check Storage

Go to **Storage** and verify these buckets exist:
- ✅ `avatars`
- ✅ `complex-images`
- ✅ `pitch-images`

## 🐛 If You Get Errors

### Error: "relation already exists"
- The script should handle this, but if you see it:
  - The tables weren't fully dropped
  - Try running the DROP statements manually first

### Error: "trigger already exists"
- ✅ **FIXED** - Script now drops triggers before creating

### Error: "policy already exists"
- ✅ **FIXED** - Script now drops policies before creating

### Error: "function already exists"
- ✅ **FIXED** - Script now drops functions before creating

### Error: "permission denied"
- Make sure you're running as the database owner
- Check you're in the correct project

## 🔄 Running Multiple Times

The script is now **idempotent** - you can run it multiple times safely:
- It will drop existing objects before creating new ones
- No duplicate errors should occur

## ✅ What the Script Does

1. **Drops** existing tables, functions, triggers, policies
2. **Creates** all tables with proper schema
3. **Sets up** Row Level Security (RLS) policies
4. **Creates** storage buckets
5. **Sets up** storage policies
6. **Creates** triggers for auto-updating timestamps
7. **Creates** trigger for auto-creating user profiles

## 📝 Next Steps After Migration

1. ✅ Run the SQL migration (this file)
2. ⏳ Update your app code to use Supabase
3. ⏳ Test authentication
4. ⏳ Test CRUD operations
5. ⏳ Test image uploads

## 🆘 Still Having Issues?

If you still get errors:
1. Copy the full error message
2. Check which line it's failing on
3. Try running sections of the script separately
4. Check Supabase logs for more details

---

**The script is now ready to run!** 🎉
