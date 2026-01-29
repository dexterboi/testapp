# 🚀 Production Setup Guide - Dashboard Database Updates

## Overview
This guide sets up a **production-ready** solution for the owner dashboard to securely update the database using Supabase Edge Functions.

## ✅ What This Solution Provides

1. **Secure Token Validation** - Edge Functions validate tokens server-side
2. **Authorization Checks** - Verifies ownership before allowing updates
3. **Service Role Security** - Service role key stays on server (never exposed)
4. **Works on InfinityFree** - No special server requirements
5. **Automatic Updates** - Changes reflect immediately in the app

## 📋 Setup Steps

### Step 1: Deploy Edge Functions

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref dgpdlwklqvbmdtalyiis
   ```

4. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy update-complex
   supabase functions deploy update-pitch
   ```

5. **Set Environment Variables** (if not auto-set):
   ```bash
   supabase secrets set SUPABASE_URL=https://dgpdlwklqvbmdtalyiis.supabase.co
   supabase secrets set SUPABASE_ANON_KEY=your-anon-key
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

### Step 2: Get Your Service Role Key

1. Go to **Supabase Dashboard** → **Settings** → **API**
2. Copy the **`service_role`** key (keep it secret!)
3. Use it in Step 1.5 above

### Step 3: Verify Edge Functions

After deployment, test the functions:

```bash
# Test update-complex
curl -X POST https://dgpdlwklqvbmdtalyiis.supabase.co/functions/v1/update-complex \
  -H "Authorization: Bearer YOUR_OWNER_TOKEN" \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"name":"Test Complex","address":"Test Address"}'
```

### Step 4: Update Website Files

The dashboard.js file has already been updated to use Edge Functions. Just make sure:

1. ✅ `dashboard.js` uses Edge Function URLs
2. ✅ Token is passed in Authorization header
3. ✅ Files are uploaded to InfinityFree

### Step 5: Test the Dashboard

1. Login to dashboard with owner token
2. Try creating/editing a complex
3. Try creating/editing a pitch
4. Check Supabase dashboard to verify changes
5. Check mobile app to see updates

## 🔒 Security Features

- ✅ **Token Validation** - Edge Functions verify tokens before any operation
- ✅ **Ownership Verification** - Only owners can update their complexes/pitches
- ✅ **Service Role Protection** - Service key never exposed to client
- ✅ **CORS Headers** - Proper CORS configuration for web access
- ✅ **Error Handling** - Clear error messages without exposing internals

## 📁 File Structure

```
supabase/
  functions/
    update-complex/
      index.ts          # Handles complex create/update
    update-pitch/
      index.ts          # Handles pitch create/update
website/
  dashboard.js          # Updated to use Edge Functions
  dashboard.html       # Dashboard UI
```

## 🔄 How It Works

1. **User logs in** → Token stored in sessionStorage
2. **User edits complex/pitch** → Dashboard sends request to Edge Function
3. **Edge Function validates token** → Checks user_profiles table
4. **Edge Function verifies ownership** → Ensures user owns the complex
5. **Edge Function updates database** → Uses service role key (bypasses RLS)
6. **Changes saved** → Immediately visible in app

## 🐛 Troubleshooting

### Edge Function not found (404)
- Check function name matches exactly
- Verify deployment was successful
- Check Supabase dashboard → Edge Functions

### Unauthorized (401)
- Verify token is correct
- Check token exists in user_profiles table
- Ensure user has 'owner' role

### Forbidden (403)
- User doesn't own the complex/pitch
- Check ownership in database

### CORS errors
- Edge Functions include CORS headers
- Check browser console for specific error

## ✅ Production Checklist

- [ ] Edge Functions deployed
- [ ] Service role key set as secret
- [ ] Tested complex create/update
- [ ] Tested pitch create/update
- [ ] Verified changes in Supabase dashboard
- [ ] Verified changes in mobile app
- [ ] Website uploaded to InfinityFree
- [ ] Tested on InfinityFree hosting

## 🎉 You're Ready!

Once Edge Functions are deployed, your dashboard will securely update the database, and changes will automatically appear in your mobile app. No RLS policy changes needed - everything works through secure Edge Functions!
