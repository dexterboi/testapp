# 🔄 Re-deploy Edge Function with Detailed Response

## Why Re-deploy?

I've updated the Edge Function to include **detailed FCM responses** in the HTTP response body. This will help us see exactly what FCM returned.

## How to Re-deploy

### Option 1: Via Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Edge Functions → `send-push-notification`
   - Click **"Edit"** or **"Code Editor"**

2. **Copy the updated code**
   - Open: `supabase/functions/send-push-notification/index.ts`
   - Copy the entire file content

3. **Paste in Supabase Editor**
   - Replace all existing code
   - Click **"Deploy"** or **"Save"**

### Option 2: Via Supabase CLI

```bash
cd "/Users/wasseflabidi/Documents/ai projects/pitchperfect"
npx supabase functions deploy send-push-notification
```

## What Changed

The Edge Function now returns:
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

Or if FCM rejects it:
```json
{
  "success": false,
  "sent": 0,
  "failed": 1,
  "details": [
    {
      "tokenIndex": 0,
      "success": false,
      "status": 400,
      "error": "{\"error\":{\"message\":\"Invalid token\"}}"
    }
  ]
}
```

## After Re-deploying

1. **Test again:**
   ```bash
   node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95"
   ```

2. **Check the output** - You'll now see:
   - ✅ FCM response details
   - ❌ FCM error messages (if any)
   - 📊 Exact status codes and error messages

This will tell us exactly what FCM is returning!
