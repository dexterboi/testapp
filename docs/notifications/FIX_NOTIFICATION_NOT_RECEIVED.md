# 🔧 Fix: Notification Sent But Not Received

## Analysis

✅ **Firebase shows 2 successful requests (0% errors)** - This means:
- Edge Function is working
- FCM API is accepting our requests
- But notifications aren't reaching your device

❌ **Supabase logs only show lifecycle events** - We need to see actual invocation logs

## Step 1: Check Invocation Logs (Not Just Logs Tab)

The logs you showed are **lifecycle logs** (boot/shutdown). We need **invocation logs**:

1. **Go to Supabase Dashboard**
   - Edge Functions → `send-push-notification`
   - Look for **"Invocations"** tab (not just "Logs")
   - OR click on a specific invocation to see detailed logs
   - Look for our `console.log` statements:
     - `🔑 Getting OAuth2 access token...`
     - `📤 Sending to X device(s)...`
     - `✅ Successfully sent...` or `❌ Failed to send...`

## Step 2: Test Device Token Directly (CRITICAL!)

This will tell us if the token is valid:

1. **Get Your Device Token**
   - Supabase → Table Editor → `device_tokens`
   - Find user: `8de1f877-32f8-4960-b550-8b7001a09b95`
   - Copy the `token` value

2. **Test in Firebase Console**
   - Go to Firebase Console → Cloud Messaging
   - Click **"Send test message"** (or "Send your first message")
   - Paste your device token
   - Title: "Test from Firebase"
   - Body: "Testing direct send"
   - Click **"Test"**

   **Results:**
   - ✅ **If you receive it**: Token is valid, issue is with our Edge Function payload
   - ❌ **If you DON'T receive it**: Token is invalid/expired, need to regenerate

## Step 3: If Token Test Fails (Most Likely Issue)

The token might be invalid or expired:

1. **Uninstall the app** from your phone
2. **Reinstall the APK**
3. **Log in again**
4. **Grant notification permission** (should appear immediately)
5. **Check Supabase** → `device_tokens` table for new token
6. **Test again** with the new token

## Step 4: Check Notification Payload Format

If token test works but our notifications don't, the payload might be wrong. Let me check the FCM v1 API format...

## Step 5: Check Android Settings

1. **Phone Settings** → Apps → Larena → Notifications
   - Make sure all categories are enabled
   - Check if "Do Not Disturb" is blocking notifications

2. **Battery Optimization**
   - Settings → Apps → Larena → Battery
   - Set to "Unrestricted" (prevents Android from killing the app)

## Step 6: Check Android Logs (Advanced)

Connect phone via USB:
```bash
adb logcat | grep -i "fcm\|firebase\|push\|notification"
```

Look for:
- Token registration errors
- Notification delivery errors
- FCM connection issues

---

## Most Likely Fix

**The device token is probably invalid or expired.**

**Quick Fix:**
1. Uninstall app
2. Reinstall APK
3. Log in
4. Check for new token in Supabase
5. Test with Firebase Console first
6. Then test with our Edge Function

---

## Next Steps

1. **Test token in Firebase Console** (Step 2) - This is the most important test!
2. **Share the result**: Did you receive the test notification from Firebase Console?
3. **If yes**: We'll fix the Edge Function payload
4. **If no**: We'll regenerate the token
