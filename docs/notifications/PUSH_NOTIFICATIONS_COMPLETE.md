# ✅ Push Notifications - Complete Setup

## 🎉 What's Ready

All code is in place! Here's what you have:

### ✅ Frontend (App)
- Push notification service initialized automatically
- Device tokens saved to Supabase
- Notification handlers for when user taps notifications

### ✅ Backend Options

**Option 1: Supabase Edge Function** (Recommended)
- File: `supabase/functions/send-push-notification/index.ts`
- Automatically sends notifications via HTTP API

**Option 2: Database Triggers** (Automatic)
- File: `CREATE_NOTIFICATION_TRIGGERS.sql`
- Automatically sends notifications when events happen
- No code changes needed!

**Option 3: Node.js Service** (Manual)
- File: `services/notificationSender.ts`
- Use in your own backend server

## 🚀 Quick Setup (Choose One)

### Option A: Database Triggers (Easiest - Automatic!)

1. **Set up Supabase Edge Function:**
   ```bash
   # Install Supabase CLI if needed
   npm install -g supabase
   
   # Login
   supabase login
   
   # Link your project
   supabase link --project-ref your-project-ref
   
   # Deploy the function
   supabase functions deploy send-push-notification
   ```

2. **Set environment variable in Supabase:**
   - Go to Supabase Dashboard > Project Settings > Edge Functions
   - Add secret: `FCM_SERVER_KEY` = (your Firebase server key)

3. **Run the SQL trigger:**
   - Open Supabase SQL Editor
   - Run `CREATE_NOTIFICATION_TRIGGERS.sql`
   - Done! Notifications will send automatically

### Option B: Manual API Calls

Use the Edge Function directly from your code:

```typescript
// In your code when friend request is created
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

## 📋 Final Checklist

- [ ] Create Firebase project
- [ ] Add `google-services.json` to `android/app/`
- [ ] Run `CREATE_DEVICE_TOKENS_TABLE.sql` in Supabase
- [ ] Get FCM Server Key from Firebase Console
- [ ] Deploy Supabase Edge Function (if using triggers)
- [ ] Set `FCM_SERVER_KEY` environment variable
- [ ] Run `CREATE_NOTIFICATION_TRIGGERS.sql` (if using triggers)
- [ ] Build APK and test on real device
- [ ] Verify device token appears in Supabase
- [ ] Test sending a notification

## 🧪 Testing

1. **Test device registration:**
   - Install APK on real device
   - Log in
   - Check Supabase `device_tokens` table - should see your token

2. **Test notification sending:**
   - Create a friend request
   - Should automatically send push notification
   - Or manually call the Edge Function API

3. **Test notification tap:**
   - Tap notification
   - App should open and navigate to correct page

## 🔧 Troubleshooting

**No notifications received?**
- Check device token exists in Supabase
- Verify FCM_SERVER_KEY is set correctly
- Check Firebase Console > Cloud Messaging > Send test message
- Ensure app has notification permission

**Triggers not working?**
- Check Supabase logs for errors
- Verify Edge Function is deployed
- Check `notify_push_notification` function exists

**Token not saving?**
- Check RLS policies allow inserts
- Verify user is authenticated
- Check browser/device console for errors

## 📚 Files Created

- ✅ `services/pushNotificationService.ts` - Frontend service
- ✅ `services/notificationSender.ts` - Backend helper
- ✅ `supabase/functions/send-push-notification/index.ts` - Edge Function
- ✅ `CREATE_DEVICE_TOKENS_TABLE.sql` - Database table
- ✅ `CREATE_NOTIFICATION_TRIGGERS.sql` - Auto-notification triggers
- ✅ `PUSH_NOTIFICATIONS_SETUP.md` - Detailed setup guide

## 🎯 Next Steps

1. Complete Firebase setup (5 min)
2. Run database migrations (1 min)
3. Deploy Edge Function (2 min)
4. Test on device (5 min)

**Total time: ~15 minutes!**

Your app will then have full push notification support! 🚀
