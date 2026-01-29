# 🧪 Test Push Notification - Quick Guide

## User ID
`8de1f877-32f8-4960-b550-8b7001a09b95`

## Method 1: Using Supabase Dashboard (Easiest)

1. **Go to Supabase Dashboard**
   - Open: https://supabase.com/dashboard
   - Select your project

2. **Go to Edge Functions**
   - Click **"Edge Functions"** in left sidebar
   - Click on **`send-push-notification`**

3. **Click "Invoke" button**

4. **Paste this JSON:**
   ```json
   {
     "userId": "8de1f877-32f8-4960-b550-8b7001a09b95",
     "title": "🎉 Test Notification!",
     "body": "Push notifications are working perfectly!",
     "data": {
       "type": "test",
       "message": "This is a test notification from Larena"
     }
   }
   ```

5. **Click "Invoke"**
   - You should see a success response
   - Check your phone - notification should appear! 📱

## Method 2: Using Test Script

1. **Run the test script:**
   ```bash
   node test-notification.js
   ```

2. **Or use curl:**
   ```bash
   curl -X POST \
     'https://dgpdlwklqvbmdtalyiis.supabase.co/functions/v1/send-push-notification' \
     -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA' \
     -H 'Content-Type: application/json' \
     -d '{
       "userId": "8de1f877-32f8-4960-b550-8b7001a09b95",
       "title": "🎉 Test!",
       "body": "Push notifications are working!",
       "data": {"type": "test"}
     }'
   ```

## Method 3: From Browser Console

Open browser console on your app and run:

```javascript
fetch('https://dgpdlwklqvbmdtalyiis.supabase.co/functions/v1/send-push-notification', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: '8de1f877-32f8-4960-b550-8b7001a09b95',
    title: '🎉 Test!',
    body: 'Push notifications are working!',
    data: { type: 'test' }
  })
}).then(r => r.json()).then(console.log);
```

## ✅ Expected Result

- **Success response:**
  ```json
  {
    "success": true,
    "sent": 1,
    "failed": 0,
    "total": 1
  }
  ```

- **On your phone:**
  - Notification should appear immediately
  - Even if app is closed!
  - Tap to open the app

## 🔍 Troubleshooting

**"No device tokens found"**
- Make sure you logged in on your phone
- Check `device_tokens` table in Supabase
- Verify your user ID matches

**"Function error"**
- Check Edge Function logs in Supabase
- Verify `FIREBASE_SERVICE_ACCOUNT` secret is set

**Notification not received**
- Check phone notification settings
- Make sure app has notification permission
- Check if device token exists in Supabase
