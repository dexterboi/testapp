# 📱 Enable Phone Notifications for Lobby Invites

## Quick Setup (5 minutes)

### Step 1: Run SQL Triggers

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run the **entire** `CREATE_NOTIFICATION_TRIGGERS.sql` file
3. This creates triggers that automatically send push notifications

### Step 2: Verify Triggers

Check that triggers were created:
```sql
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE event_object_table = 'lobby_members';
```

You should see:
- `lobby_invite_notification_trigger`
- `lobby_access_request_notification_trigger`

### Step 3: Test

1. Invite a friend to a lobby
2. They should receive a push notification on their phone
3. Check Supabase Edge Function logs if it doesn't work

## Troubleshooting

### Notifications Not Received?

1. **Check Edge Function Logs:**
   - Supabase Dashboard → Edge Functions → `send-push-notification` → Logs
   - Look for errors or successful sends

2. **Check Device Token:**
   - Supabase → Table Editor → `device_tokens`
   - Verify token exists for the user

3. **Test Manually:**
   ```bash
   node test-notification.js
   ```

4. **Check Firebase:**
   - Firebase Console → Cloud Messaging
   - Send test message to verify token works

### Edge Function Not Being Called?

- Check if triggers are active
- Verify `notify_push_notification` function exists
- Check Supabase function logs for errors

## What the Triggers Do

- **Lobby Invite**: When someone invites you → Sends push notification
- **Lobby Access Request**: When someone requests to join your lobby → Sends push notification to you (host)
- **Friend Request**: When someone sends friend request → Sends push notification

All triggers use the `send-push-notification` Edge Function which sends via Firebase FCM.
