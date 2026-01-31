# 🔍 Debug Push Notification - Why Not Received?

## Step 1: Check Device Token

1. **Go to Supabase Dashboard**
   - Table Editor → `device_tokens`
   - Find your user ID: `8de1f877-32f8-4960-b550-8b7001a09b95`
   - Check if there's a token

2. **Verify Token Format**
   - Should be a long string (like: `cXyZ123...`)
   - Should start with letters/numbers
   - Copy the token

## Step 2: Check Edge Function Logs

1. **Go to Supabase Dashboard**
   - Edge Functions → `send-push-notification`
   - Click **"Logs"** tab
   - Look for errors or warnings

## Step 3: Test with Firebase Console

1. **Go to Firebase Console**
   - https://console.firebase.google.com/
   - Select project: **Larena**

2. **Go to Cloud Messaging**
   - Click **"Cloud Messaging"** in left sidebar
   - Click **"Send test message"**

3. **Get Device Token**
   - Copy token from Supabase `device_tokens` table
   - Paste in Firebase Console
   - Send test message
   - If this works, the issue is with our Edge Function
   - If this doesn't work, the issue is with Firebase setup

## Step 4: Check Common Issues

### Issue 1: Token Not Valid
- **Solution**: Uninstall and reinstall app, log in again
- This will generate a new token

### Issue 2: App Not Running
- **Test**: Close the app completely, then send notification
- Should still receive it if token is valid

### Issue 3: Notification Permission
- **Check**: Phone Settings → Apps → Larena → Notifications
- Make sure notifications are enabled

### Issue 4: Firebase Service Account
- **Check**: Supabase → Edge Functions → Secrets
- Verify `FIREBASE_SERVICE_ACCOUNT` exists and is correct

### Issue 5: Google Services JSON
- **Check**: `android/app/google-services.json` exists
- Should have correct package name: `com.pitchperfect.app`

## Step 5: Check Android Logs

Connect phone via USB and run:
```bash
adb logcat | grep -i "fcm\|firebase\|push\|notification"
```

Look for errors or warnings.

## Quick Fix: Re-register Token

If token seems invalid:
1. Uninstall app
2. Reinstall app
3. Log in
4. Grant notification permission
5. Check for new token in Supabase
6. Test again
