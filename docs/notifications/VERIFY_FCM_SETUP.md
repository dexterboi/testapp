# ✅ Verify FCM Setup - Step by Step

## The notification was sent but not received. Let's check:

### Step 1: Check Edge Function Logs (Most Important!)

1. **Go to Supabase Dashboard**
   - Edge Functions → `send-push-notification`
   - Click **"Logs"** tab
   - Find the latest invocation (when we sent the test)
   - **Look for:**
     - Any error messages
     - FCM API responses
     - OAuth token errors
     - Token validation errors

### Step 2: Enable Firebase Cloud Messaging API

The service account might not have the API enabled:

1. **Go to Google Cloud Console**
   - https://console.cloud.google.com/
   - Select project: **Larena** (or `larena-4acd2`)

2. **Enable API**
   - Go to **APIs & Services** → **Library**
   - Search for: **"Firebase Cloud Messaging API"**
   - Click on it
   - Click **"Enable"**

3. **Verify Service Account Permissions**
   - Go to **IAM & Admin** → **Service Accounts**
   - Find: `firebase-adminsdk-fbsvc@larena-4acd2.iam.gserviceaccount.com`
   - Make sure it has **"Firebase Cloud Messaging Admin"** role
   - Or at least **"Firebase Admin SDK Administrator Service Agent"**

### Step 3: Test Token Directly

1. **Get Device Token**
   - Supabase → Table Editor → `device_tokens`
   - Copy the token for your user

2. **Test in Firebase Console**
   - Firebase Console → Cloud Messaging
   - Click **"Send test message"**
   - Paste token
   - Send
   - **If this works**: Our Edge Function has an issue
   - **If this doesn't work**: Token or Firebase setup issue

### Step 4: Check Common Issues

**Android Doze Mode**
- Phone might be in battery saver mode
- Try sending notification when phone is active

**App Not Properly Registered**
- Uninstall and reinstall app
- Log in again
- Check for new token in Supabase

**Notification Permission**
- Settings → Apps → Larena → Notifications
- Make sure enabled

---

## Quick Fix: Re-deploy Function with Better Logging

I've updated the function with better logging. Re-deploy it:

1. Copy updated code from `supabase/functions/send-push-notification/index.ts`
2. Paste in Supabase Editor
3. Deploy
4. Test again
5. Check logs for detailed FCM responses

---

## Most Likely Issue

The **Firebase Cloud Messaging API** might not be enabled in Google Cloud Console. This is required for FCM v1 API to work!
