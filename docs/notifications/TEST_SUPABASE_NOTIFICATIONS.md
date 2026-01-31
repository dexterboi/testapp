# 🧪 Test Supabase Push Notifications

## Quick Test Command

Test if Supabase Edge Function can send push notifications:

```bash
node test-supabase-notification.js <user-id> [title] [body]
```

## Examples

### Basic Test
```bash
node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95"
```

### Custom Message
```bash
node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95" "Hello!" "This is a test from Supabase"
```

## What It Does

1. ✅ Checks if device tokens exist for the user
2. ✅ Calls Supabase Edge Function `send-push-notification`
3. ✅ Shows detailed response from Edge Function
4. ✅ Tells you if notification was sent successfully

## Expected Output

**Success:**
```
🚀 Testing Supabase Edge Function Push Notification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

👤 User ID: 8de1f877-32f8-4960-b550-8b7001a09b95
📝 Title: 🔔 Test Notification from Supabase
📄 Body: This is a test notification sent via Supabase Edge Function!
🔗 Edge Function: https://dgpdlwklqvbmdtalyiis.supabase.co/functions/v1/send-push-notification

🔍 Checking device tokens for user...

✅ Found 1 device token(s):
   1. Platform: android
      Token: cXyZ123abc456def789...
      Created: 2024-01-15T10:30:00Z
      Last used: 2024-01-15T10:30:00Z

📤 Sending notification via Supabase Edge Function...

📊 Response Status: 200 OK

✅ Edge Function Response:
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1
}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Notification sent successfully via Supabase!
📊 Sent: 1, Failed: 0, Total: 1

📱 Check your phone for the notification!
```

**No Device Token:**
```
⚠️  No device tokens found for this user!
   The user needs to:
   1. Open the app
   2. Log in
   3. Grant notification permission
   4. Check device_tokens table in Supabase
```

**Edge Function Error:**
```
❌ Edge Function Error:
   Status: 500
   Response: {"error": "FIREBASE_SERVICE_ACCOUNT environment variable not set"}
```

## Troubleshooting

### Error: "No device tokens found"
- User needs to log in and grant notification permission
- Check `device_tokens` table in Supabase
- Make sure app is installed and running

### Error: "FIREBASE_SERVICE_ACCOUNT not set"
- Go to Supabase Dashboard → Edge Functions → Secrets
- Add secret: `FIREBASE_SERVICE_ACCOUNT`
- Paste your Firebase service account JSON

### Error: "Edge Function not found"
- Make sure Edge Function is deployed
- Check Supabase Dashboard → Edge Functions
- Function name should be: `send-push-notification`

### Success but no notification received
- Check Edge Function logs in Supabase
- Test token directly with Firebase Console
- Verify token is valid and not expired

## Compare with Firebase Test

This test calls **Supabase Edge Function**, which then calls **Firebase FCM**.

If this works but triggers don't:
- Issue is with database triggers
- Check trigger setup in `CREATE_NOTIFICATION_TRIGGERS.sql`

If this doesn't work:
- Issue is with Edge Function or Firebase setup
- Check Edge Function logs
- Verify Firebase service account is configured

## Next Steps

1. **Test this command** - Verify Supabase can send notifications
2. **If it works** - Check why triggers aren't firing
3. **If it doesn't work** - Fix Edge Function or Firebase setup
