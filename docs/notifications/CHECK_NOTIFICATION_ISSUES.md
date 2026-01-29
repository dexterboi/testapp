# 🔍 Check Why Notification Not Received

## The notification was sent successfully from our server, but you didn't receive it. Let's debug:

### Step 1: Check Edge Function Logs

1. **Go to Supabase Dashboard**
   - Edge Functions → `send-push-notification`
   - Click **"Logs"** tab
   - Look for the latest invocation
   - Check for any errors or warnings

### Step 2: Verify Device Token

1. **Check Supabase Table**
   - Go to Table Editor → `device_tokens`
   - Find your user ID: `8de1f877-32f8-4960-b550-8b7001a09b95`
   - Copy the token value

2. **Test Token Directly with Firebase**
   - Go to Firebase Console → Cloud Messaging
   - Click **"Send test message"**
   - Paste your device token
   - Send a test message
   - **If this works**: Our Edge Function has an issue
   - **If this doesn't work**: Token is invalid or Firebase setup issue

### Step 3: Common Issues

**Issue 1: Token Invalid/Expired**
- **Solution**: Uninstall app, reinstall, log in again
- This generates a fresh token

**Issue 2: App in Background/Doze Mode**
- **Test**: Make sure app is completely closed
- Send notification again
- Should still work if token is valid

**Issue 3: Android Notification Settings**
- **Check**: Phone Settings → Apps → Larena → Notifications
- Make sure all notification categories are enabled

**Issue 4: OAuth Token Issue**
- The Edge Function might be getting OAuth token but FCM rejecting it
- Check Edge Function logs for FCM error responses

**Issue 5: FCM v1 API Issue**
- The OAuth token might not have correct permissions
- Check if service account has Firebase Cloud Messaging API enabled

### Step 4: Check Android Logs

Connect phone via USB:
```bash
adb logcat | grep -i "fcm\|firebase\|push\|notification"
```

Look for:
- FCM registration errors
- Token refresh messages
- Notification delivery errors

### Step 5: Quick Test

Try sending from Firebase Console directly:
1. Firebase Console → Cloud Messaging → Send test message
2. Use device token from Supabase
3. If this works, the issue is with our Edge Function
4. If this doesn't work, the issue is with Firebase setup or token

---

## Most Likely Issues:

1. **OAuth token doesn't have correct permissions** - Check Firebase IAM
2. **Token format issue** - Token might be malformed
3. **FCM API not enabled** - Enable Firebase Cloud Messaging API in Google Cloud Console

Let me know what you see in the Edge Function logs!
