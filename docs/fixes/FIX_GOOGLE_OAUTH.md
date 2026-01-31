# Fix Google OAuth Redirect URI Mismatch Error

## 🔴 Error: `redirect_uri_mismatch`

This error means the redirect URI in your Google Cloud Console doesn't match what Supabase is sending.

## ✅ Solution: Update Google Cloud Console

### Step 1: Go to Google Cloud Console

1. Open: https://console.cloud.google.com/
2. Select your project
3. Navigate to: **APIs & Services** → **Credentials**

### Step 2: Find Your OAuth 2.0 Client

1. Look for your OAuth 2.0 Client ID (the one used for Supabase)
2. Click on it to edit

### Step 3: Add Supabase Redirect URI

In the **Authorized redirect URIs** section, add:

```
https://dgpdlwklqvbmdtalyiis.supabase.co/auth/v1/callback
```

**Important:** Make sure this URI is **exactly** as shown above (no trailing slash, correct subdomain).

### Step 4: Also Add (Optional but Recommended)

For development, you might also want to add:
```
http://localhost:3000/auth/v1/callback
```

But the main one you **MUST** have is:
```
https://dgpdlwklqvbmdtalyiis.supabase.co/auth/v1/callback
```

### Step 5: Save

1. Click **Save** at the bottom
2. Wait a few seconds for changes to propagate

### Step 6: Test Again

1. Go back to your app
2. Try Google login again
3. It should work now!

## 📋 Complete List of Authorized Redirect URIs

Your Google OAuth Client should have these redirect URIs:

```
https://dgpdlwklqvbmdtalyiis.supabase.co/auth/v1/callback
```

**That's the only one required for Supabase!**

## 🔍 Verify Supabase Configuration

Also check in Supabase Dashboard:

1. Go to: https://supabase.com/dashboard/project/dgpdlwklqvbmdtalyiis/auth/providers
2. Click **Google** provider
3. Make sure it's **Enabled**
4. Verify Client ID and Secret are correct

## ⚠️ Common Mistakes

- ❌ Missing `https://` (must be HTTPS for Supabase)
- ❌ Wrong subdomain (must be `dgpdlwklqvbmdtalyiis.supabase.co`)
- ❌ Trailing slash (should NOT have `/` at the end)
- ❌ Wrong path (must be `/auth/v1/callback`)

## ✅ Correct Format

```
https://dgpdlwklqvbmdtalyiis.supabase.co/auth/v1/callback
```

## 🚀 After Fixing

1. Save in Google Cloud Console
2. Wait 1-2 minutes for propagation
3. Try Google login again
4. Should work! ✅

---

**The redirect URI must match exactly what Supabase sends!**
