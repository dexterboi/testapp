# 🔧 Fix: Notification Issues

## Issues Fixed

### 1. ✅ Fixed `id` Column Error
- **Problem**: `lobby_members` table doesn't have an `id` column (uses composite key)
- **Fixed**: Changed `.select('id')` to `.select('lobby_id, user_id')` in `NotificationCenter.tsx`

### 2. 📱 Phone Notifications Not Working
- **Problem**: Push notifications not sent when user is invited to lobby
- **Solution**: 
  - Make sure you've run the `CREATE_NOTIFICATION_TRIGGERS.sql` in Supabase
  - The trigger `lobby_invite_notification_trigger` will automatically send push notifications
  - If triggers are set up, check Edge Function logs in Supabase

### 3. 🔔 In-App Notification Badge Not Updating
- **Problem**: Badge count doesn't update until user changes pages
- **Fixed**: 
  - Added real-time listener for lobby access requests (when user is host)
  - Added console logs to debug real-time updates
  - The badge should now update immediately when notifications arrive

## What You Need to Do

### For Phone Notifications:
1. **Make sure triggers are set up:**
   - Go to Supabase SQL Editor
   - Run `CREATE_NOTIFICATION_TRIGGERS.sql` (already fixed to use `user_profiles`)
   - Verify triggers exist: Check Supabase Dashboard → Database → Triggers

2. **Check Edge Function:**
   - Supabase Dashboard → Edge Functions → `send-push-notification`
   - Check logs to see if notifications are being sent
   - Verify `FIREBASE_SERVICE_ACCOUNT` secret is set

### For In-App Notifications:
- The code is already fixed
- Real-time listeners are set up
- Badge should update automatically when:
  - Friend request received
  - Lobby invite received
  - Lobby access request received (if you're host)
  - New complexes/pitches added

## Testing

1. **Test phone notification:**
   - Invite a friend to a lobby
   - Check if they receive push notification
   - Check Supabase Edge Function logs

2. **Test in-app badge:**
   - Stay on home page
   - Have someone invite you to a lobby
   - Badge should update immediately without changing pages

## Debugging

If notifications still don't work:
1. Check browser console for real-time listener logs
2. Check Supabase Edge Function logs
3. Verify device token exists in `device_tokens` table
4. Test with Firebase Console directly
