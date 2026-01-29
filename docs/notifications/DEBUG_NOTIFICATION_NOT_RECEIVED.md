# 🔍 Debug: Notification Sent But Not Received

## Current Status

✅ **Edge Function returned success**: `sent: 1, failed: 0`  
❌ **Notification not received on phone**

This means Supabase Edge Function is working, but something is wrong with:
- The device token (might be invalid/expired)
- FCM delivery (FCM accepted but didn't deliver)
- Android notification settings

## Step 1: Check Invocation Logs (CRITICAL!)

The logs you showed are **lifecycle logs** (boot/shutdown). We need **invocation logs**:

1. **Go to Supabase Dashboard**
   - Edge Functions → `send-push-notification`
   - Click **"Invocations"** tab (NOT "Logs")
   - Find the latest invocation (should be recent, from our test)
   - Click on it to see detailed logs
   - **Look for:**
     - `🔑 Getting OAuth2 access token...`
     - `📤 Sending to X device(s)...`
     - `✅ Successfully sent to token 0: {...}` ← This shows what FCM returned
     - OR `❌ Failed to send to token 0: {...}` ← This shows FCM errors

2. **If you don't see "Invocations" tab:**
   - The function might not be logging properly
   - Check if there's a "Recent Invocations" section
   - Or look for a timestamp that matches when we ran the test

## Step 2: Test Token Directly with Firebase (MOST IMPORTANT!)

This will tell us if the token is valid:

1. **Get Device Token:**
   - Supabase Dashboard → Table Editor → `device_tokens`
   - Find user: `8de1f877-32f8-4960-b550-8b7001a09b95`
   - Copy the `token` value

2. **Test in Firebase Console:**
   - Go to Firebase Console → Cloud Messaging
   - Click **"Send test message"**
   - Paste your device token
   - Title: "Direct Firebase Test"
   - Body: "Testing token validity"
   - Click **"Test"**

   **Results:**
   - ✅ **If you receive it**: Token is valid, issue is with Edge Function payload or FCM delivery
   - ❌ **If you DON'T receive it**: Token is invalid/expired, need to regenerate

## Step 3: Check What FCM Actually Returned

The Edge Function logs should show what FCM returned. Look for:
- `✅ Successfully sent to token 0: {"name": "projects/..."}` ← FCM accepted
- `❌ Failed to send to token 0: {"error": {...}}` ← FCM rejected

If FCM returned success but you didn't receive it, the token might be:
- Expired
- Invalid
- From a different app/device

## Step 4: Regenerate Device Token

If token test fails:

1. **Uninstall the app** from your phone
2. **Reinstall the APK**
3. **Log in again**
4. **Grant notification permission** (should appear immediately)
5. **Check Supabase** → `device_tokens` table for new token
6. **Test again** with the new token

## Step 5: Check Android Settings

1. **Phone Settings** → Apps → Larena → Notifications
   - Make sure all notification categories are enabled
   - Check if "Do Not Disturb" is blocking notifications

2. **Battery Optimization**
   - Settings → Apps → Larena → Battery
   - Set to "Unrestricted" (prevents Android from killing the app)

## Quick Test Commands

**Test Supabase Edge Function:**
```bash
node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95"
```

**Test Firebase Directly (if you have token):**
```bash
node test-fcm-direct.js "your-device-token-here"
```

## Most Likely Issues

1. **Token is invalid/expired** (80% chance)
   - Solution: Regenerate token by reinstalling app

2. **FCM accepted but didn't deliver** (15% chance)
   - Check Android notification settings
   - Check if app is in battery saver mode

3. **Edge Function payload issue** (5% chance)
   - Check invocation logs to see FCM response
   - Compare with Firebase Console test

---

## Next Steps

1. **Check invocation logs** in Supabase (Step 1)
2. **Test token in Firebase Console** (Step 2) - This is the most important test!
3. **Share the results** so we can fix the issue
