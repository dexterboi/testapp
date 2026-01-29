# ⚠️ IMPORTANT: Update Edge Functions to Fix "Invalid JWT" Error

## Current Error
You're seeing: `{code: 401, message: 'Invalid JWT'}`

This happens because the Edge Functions are still using the old code that tries to validate your token as a JWT.

## ✅ Solution: Update Both Edge Functions

### Step 1: Update `update-complex` Function

1. Go to **Supabase Dashboard** → **Edge Functions** → **Functions**
2. Click on **`update-complex`**
3. **Delete all existing code**
4. **Copy ALL code** from: `EDGE_FUNCTION_CODE_update-complex.txt`
5. **Paste it** into the editor
6. Click **"Deploy"** or **"Save"**

### Step 2: Update `update-pitch` Function

1. Still in Edge Functions
2. Click on **`update-pitch`**
3. **Delete all existing code**
4. **Copy ALL code** from: `EDGE_FUNCTION_CODE_update-pitch.txt`
5. **Paste it** into the editor
6. Click **"Deploy"** or **"Save"**

## 🔑 Key Change

The new code uses **REST API directly** instead of Supabase client for token verification:

**Old (causes JWT error):**
```typescript
const supabaseService = createClient(...)
await supabaseService.from('user_profiles')...
```

**New (fixed):**
```typescript
const verifyResponse = await fetch(
  `${supabaseUrl}/rest/v1/user_profiles?access_token=eq.${token}...`,
  { headers: { 'apikey': supabaseServiceKey } }
)
```

## ✅ After Updating

1. Refresh your dashboard
2. Try editing a complex or pitch
3. The "Invalid JWT" error should be gone
4. Changes should save successfully!

## 📝 Note

The image URL issue (`GET http://localhost:8000/[]`) is also fixed in the dashboard code - it now validates image URLs before displaying them.
