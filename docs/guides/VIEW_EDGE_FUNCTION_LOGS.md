# 📋 How to View Edge Function Detailed Logs

## The Problem

Invocation logs only show HTTP status (200 OK), not the actual console.log output from inside the function.

## Solution 1: Check Logs Tab (Not Invocations)

1. **Go to Supabase Dashboard**
   - Edge Functions → `send-push-notification`
   - Click **"Logs"** tab (NOT "Invocations")
   - Look for recent logs with timestamps matching your test
   - You should see:
     - `🔑 Getting OAuth2 access token...`
     - `📤 Sending to X device(s)...`
     - `✅ Successfully sent to token 0: {...}` ← FCM response
     - OR `❌ Failed to send to token 0: {...}` ← FCM error

## Solution 2: Check Response Body (Updated Function)

I've updated the Edge Function to return detailed FCM responses in the HTTP response body.

**Now when you test, the response will include:**
```json
{
  "success": true,
  "sent": 1,
  "failed": 0,
  "total": 1,
  "details": [
    {
      "tokenIndex": 0,
      "success": true,
      "fcmResponse": {
        "name": "projects/.../messages/..."
      }
    }
  ],
  "message": "Notification sent to 1 device(s)"
}
```

**Or if it fails:**
```json
{
  "success": false,
  "sent": 0,
  "failed": 1,
  "total": 1,
  "details": [
    {
      "tokenIndex": 0,
      "success": false,
      "status": 400,
      "statusText": "Bad Request",
      "error": "{\"error\":{\"message\":\"Invalid token\"}}"
    }
  ],
  "message": "Failed to send to all 1 device(s). Check details."
}
```

## Test Again

Run the test command again:
```bash
node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95"
```

**Now you'll see the FCM response details in the output!**

This will tell us:
- ✅ If FCM accepted the notification
- ❌ If FCM rejected it (and why)
- 📊 What FCM actually returned

## Next Steps

1. **Re-deploy the updated Edge Function** (with detailed response)
2. **Run the test again**
3. **Check the response body** - It will show FCM's actual response
4. **Share the response** so we can see what FCM returned
