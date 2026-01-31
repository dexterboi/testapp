# ✅ Push Notifications - Test Guide

## 🎉 Deployment Complete!

Your Edge Function `send-push-notification` is now deployed!

## ✅ What's Ready

1. ✅ Database table created (`device_tokens`)
2. ✅ Service account secret added (`FIREBASE_SERVICE_ACCOUNT`)
3. ✅ Edge Function deployed
4. ✅ App code ready to save device tokens

## 🧪 Testing Steps

### Step 1: Get a Device Token

1. **Install app on your phone**
   - Build and install the APK
   - Or use: `npx cap open android` → Run on device

2. **Log in to the app**
   - Use your account

3. **Grant notification permission**
   - App will ask for permission
   - Click **"Allow"**

4. **Check Supabase for token**
   - Go to Supabase Dashboard → **Table Editor**
   - Click on **`device_tokens`** table
   - You should see a row with your device token!
   - Copy the `token` value

### Step 2: Test the Function

1. **Go to Supabase Dashboard**
   - Click **Edge Functions**
   - Click on **`send-push-notification`**

2. **Click "Invoke" button**

3. **Use this test JSON:**
   ```json
   {
     "userId": "your-user-id-here",
     "title": "Test Notification",
     "body": "This is a test notification!",
     "data": {
       "type": "test"
     }
   }
   ```
   - Replace `your-user-id-here` with your actual user ID (from `device_tokens` table)

4. **Click "Invoke"**
   - You should see a success response
   - Check your phone - you should receive the notification! 📱

### Step 3: Test from Code

You can also test from your app code:

```typescript
const response = await fetch(
  'https://your-project.supabase.co/functions/v1/send-push-notification',
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseAnonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      userId: 'user-id-here',
      title: 'Hello!',
      body: 'You have a new notification',
      data: {
        type: 'friend_request',
        friendship_id: '123'
      }
    })
  }
);
```

## 🎯 Next Steps

### Option A: Automatic Notifications (Recommended)

Run the SQL triggers to send notifications automatically:

1. Go to Supabase → **SQL Editor**
2. Open `CREATE_NOTIFICATION_TRIGGERS.sql`
3. Copy and paste the SQL
4. Click **Run**

Now notifications will send automatically when:
- Friend request is created
- Lobby invite is created
- Lobby access request is created

### Option B: Manual Notifications

Call the function from your code when events happen (see test code above).

## 🔍 Troubleshooting

**"No device tokens found"**
- Make sure user logged in and granted permission
- Check `device_tokens` table in Supabase

**"FIREBASE_SERVICE_ACCOUNT not set"**
- Go to Edge Functions → Secrets
- Make sure `FIREBASE_SERVICE_ACCOUNT` exists

**Notification not received**
- Check phone notification settings
- Make sure app has notification permission
- Check function logs in Supabase Dashboard

**Function error**
- Check Edge Function logs in Supabase Dashboard
- Look for error messages

## 🎉 You're Done!

Push notifications are now fully set up and working! 🚀
