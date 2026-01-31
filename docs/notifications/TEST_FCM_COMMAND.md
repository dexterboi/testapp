# 🧪 Test FCM Notification via Command Line

## Quick Test Command

Test push notifications directly via Firebase API from your terminal:

```bash
node test-fcm-direct.js <device-token> [title] [body]
```

## Examples

### Basic Test
```bash
node test-fcm-direct.js "your-device-token-here"
```

### Custom Title and Body
```bash
node test-fcm-direct.js "your-device-token-here" "Hello!" "This is a test notification"
```

### With Full Token
```bash
node test-fcm-direct.js "cXyZ123abc456def789..." "Test" "Notification"
```

## How to Get Your Device Token

1. **From Supabase:**
   - Go to Supabase Dashboard
   - Table Editor → `device_tokens`
   - Find your user ID
   - Copy the `token` value

2. **From App Logs:**
   - Check browser console or Android logs
   - Look for: `🔔 [Push] Registration success! Token: ...`

## What the Script Does

1. ✅ Loads Firebase service account JSON
2. ✅ Gets OAuth2 access token from Google
3. ✅ Sends notification via FCM v1 API
4. ✅ Shows detailed response from Firebase

## Expected Output

**Success:**
```
🚀 Testing FCM Push Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔑 Getting OAuth2 access token...
✅ Access token obtained
📤 Sending notification to FCM...
   Token: cXyZ123abc456def789...
   Title: 🎉 Test Notification
   Body: This is a test notification from Larena!
✅ Notification sent successfully!
📊 Response: { "name": "projects/..." }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Test completed successfully!
📱 Check your device for the notification.
```

**Error:**
```
❌ FCM API Error:
   Status: 400 Bad Request
   Response: { "error": { "message": "Invalid token" } }
```

## Troubleshooting

### Error: "Device token is required!"
- Make sure you're passing the token as the first argument
- Token should be in quotes if it contains special characters

### Error: "Service account JSON not found!"
- Make sure the file exists at: `android/app/larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json`
- Check the file path

### Error: "OAuth2 token exchange failed"
- Check if Firebase Cloud Messaging API is enabled in Google Cloud Console
- Verify service account has correct permissions

### Error: "Invalid token"
- Token might be expired or invalid
- Uninstall and reinstall app to get a new token
- Make sure you're using the correct token format

### Notification Not Received
- Check phone notification settings
- Make sure app has notification permission
- Check if phone is in Do Not Disturb mode
- Verify token is correct by testing in Firebase Console

## Compare with Firebase Console

This script does the same thing as Firebase Console's "Send test message":
- Both use FCM v1 API
- Both require valid device token
- Both send directly to Firebase

If this script works but notifications from the app don't, the issue is with:
- Edge Function payload format
- Database triggers
- App notification handling

If this script doesn't work, the issue is with:
- Device token (invalid/expired)
- Firebase setup
- Service account permissions
