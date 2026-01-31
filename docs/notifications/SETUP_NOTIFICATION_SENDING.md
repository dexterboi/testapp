# 📤 Setup Notification Sending - Complete Guide

## ✅ What's Ready

1. ✅ Database table created (`device_tokens`)
2. ✅ Service account JSON file ready
3. ✅ Firebase Admin SDK installed
4. ✅ Edge Function code created
5. ✅ App will save device tokens automatically

## 🚀 Step-by-Step Setup

### Step 1: Set Up Supabase Edge Function Secret

1. **Get your service account JSON content:**
   - Open: `android/app/larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json`
   - Copy the **entire file content** (all the JSON)

2. **Add to Supabase:**
   - Go to Supabase Dashboard
   - Click **"Edge Functions"** in left sidebar
   - Click **"Secrets"** tab
   - Click **"Add new secret"**
   - **Name**: `FIREBASE_SERVICE_ACCOUNT`
   - **Value**: Paste the entire JSON content
   - Click **"Save"**

### Step 2: Deploy Edge Function

1. **Install Supabase CLI** (if not installed):
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase:**
   ```bash
   supabase login
   ```

3. **Link your project:**
   ```bash
   supabase link --project-ref your-project-ref
   ```
   (Get project ref from Supabase Dashboard → Settings → General → Reference ID)

4. **Deploy the function:**
   ```bash
   supabase functions deploy send-push-notification
   ```

### Step 3: Test It!

1. **Get a device token:**
   - Install app on phone
   - Log in
   - Go to Supabase → Table Editor → `device_tokens`
   - Copy a token

2. **Test via Supabase Dashboard:**
   - Go to Edge Functions → `send-push-notification`
   - Click **"Invoke"**
   - Use this JSON:
   ```json
   {
     "userId": "your-user-id-here",
     "title": "Test Notification",
     "body": "This is a test!",
     "data": {
       "type": "test"
     }
   }
   ```

3. **Or test via code:**
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
         userId: 'user-id',
         title: 'Hello!',
         body: 'This is a test notification',
         data: { type: 'test' }
       })
     }
   );
   ```

## 🔄 Automatic Notifications

To send notifications automatically when events happen, you can:

### Option A: Use Database Triggers

1. Run `CREATE_NOTIFICATION_TRIGGERS.sql` in Supabase SQL Editor
2. Notifications will send automatically when:
   - Friend request created
   - Lobby invite created
   - Lobby access request created

### Option B: Call from Your Code

```typescript
// When friend request is created
await fetch('https://your-project.supabase.co/functions/v1/send-push-notification', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: recipientId,
    title: 'New Friend Request',
    body: `${requesterName} wants to join your crew`,
    data: {
      type: 'friend_request',
      friendship_id: friendRequestId
    }
  })
});
```

## 📋 Quick Checklist

- [ ] Service account JSON copied
- [ ] Secret added to Supabase (`FIREBASE_SERVICE_ACCOUNT`)
- [ ] Edge Function deployed
- [ ] Test notification sent
- [ ] Device token saved in database
- [ ] Notification received on phone ✅

## 🎉 You're Done!

Once you complete these steps, push notifications will work! Users will receive notifications even when the app is closed.

## 🔧 Troubleshooting

**"FIREBASE_SERVICE_ACCOUNT not set"**
- Make sure you added the secret in Supabase Edge Functions → Secrets
- The value should be the entire JSON content (not a file path)

**"No device tokens found"**
- Make sure user logged in and granted notification permission
- Check `device_tokens` table in Supabase

**"Function not found"**
- Make sure you deployed: `supabase functions deploy send-push-notification`
- Check function name matches exactly

**"Permission denied"**
- Make sure you're using the correct Supabase anon key
- Check RLS policies on `device_tokens` table
