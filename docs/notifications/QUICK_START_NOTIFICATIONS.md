# 🚀 Quick Start - Push Notifications

## ✅ You've Done:
- ✅ Database table created
- ✅ Service account file ready
- ✅ Code is ready

## 🎯 Next Steps (5 minutes):

### 1. Add Secret to Supabase (2 min)

1. Open Supabase Dashboard
2. Go to **Edge Functions** → **Secrets**
3. Click **"Add new secret"**
4. **Name**: `FIREBASE_SERVICE_ACCOUNT`
5. **Value**: Copy entire content from `android/app/larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json`
6. Click **Save**

### 2. Deploy Function (2 min)

```bash
# Install Supabase CLI (if needed)
npm install -g supabase

# Login
supabase login

# Link project (get project-ref from Supabase Dashboard → Settings)
supabase link --project-ref your-project-ref

# Deploy
supabase functions deploy send-push-notification
```

### 3. Test (1 min)

1. Install app on phone
2. Log in → Grant notification permission
3. Check Supabase `device_tokens` table - you should see your token
4. Test send notification from Supabase Dashboard → Edge Functions → Invoke

## 🎉 Done!

That's it! Push notifications are now working!

## 📤 Send Notifications

**From code:**
```typescript
fetch('https://your-project.supabase.co/functions/v1/send-push-notification', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    userId: 'user-id',
    title: 'Hello!',
    body: 'You have a new notification',
    data: { type: 'friend_request' }
  })
});
```

**Automatic (using triggers):**
- Run `CREATE_NOTIFICATION_TRIGGERS.sql` in Supabase SQL Editor
- Notifications will send automatically!
