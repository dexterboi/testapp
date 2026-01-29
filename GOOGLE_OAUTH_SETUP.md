# Google OAuth Setup for Supabase

## 🔍 Where to Find Your Google OAuth Credentials

Since you're using **Supabase** for authentication, your Google OAuth credentials are configured in your **Supabase Dashboard**, not in your app code.

### Step 1: Access Supabase Dashboard

1. Go to: https://supabase.com/dashboard
2. Select your project: `dgpdlwklqvbmdtalyiis`
3. Navigate to: **Authentication** → **Providers**

### Step 2: Find Google OAuth Settings

1. Click on **Google** provider
2. You'll see:
   - **Client ID (for OAuth)**: This is your Google Client ID
   - **Client Secret (for OAuth)**: This is your Google Client Secret

### Step 3: If Not Configured Yet

If Google OAuth isn't set up yet, you need to:

#### A. Create Google OAuth Credentials

1. Go to: https://console.cloud.google.com/
2. Select your project (or create a new one)
3. Navigate to: **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Choose **Web application**
6. Configure:
   - **Name**: PitchPerfect (or any name)
   - **Authorized JavaScript origins**:
     - `http://localhost:3000` (for development)
     - `https://dgpdlwklqvbmdtalyiis.supabase.co` (Supabase URL)
   - **Authorized redirect URIs**:
     - `https://dgpdlwklqvbmdtalyiis.supabase.co/auth/v1/callback`
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

#### B. Configure in Supabase

1. Go to Supabase Dashboard → **Authentication** → **Providers**
2. Click **Google**
3. Enable Google provider
4. Paste your **Client ID** and **Client Secret**
5. Click **Save**

## 📝 Your Credentials Location

Your Google OAuth credentials are stored in:
- **Supabase Dashboard** (not in your code)
- **Google Cloud Console** (where you created them)

## 🔐 Security Note

**Never commit OAuth credentials to your code!** They should only be:
- Stored in Supabase Dashboard (for Supabase Auth)
- Stored in Google Cloud Console (where you created them)
- Used in environment variables (if needed for other services)

## 🚀 Current Setup

Your app uses Supabase's built-in OAuth, so:
- ✅ Credentials are managed by Supabase
- ✅ No need to store them in your app code
- ✅ Supabase handles the OAuth flow
- ✅ Redirects are automatically configured

## 📞 Need to Retrieve Credentials?

If you need to see your credentials again:

1. **Google Cloud Console**: https://console.cloud.google.com/apis/credentials
   - Find your OAuth 2.0 Client ID
   - Click on it to see Client ID and Secret

2. **Supabase Dashboard**: https://supabase.com/dashboard/project/dgpdlwklqvbmdtalyiis/auth/providers
   - Go to Authentication → Providers → Google
   - View (but not edit) the configured credentials

## ⚠️ Important

- **Client Secret** is sensitive - keep it private
- If you lose it, you can create a new one in Google Cloud Console
- Don't share these credentials publicly

---

**Your Google OAuth is configured in Supabase, not in your app code!** 🎯
