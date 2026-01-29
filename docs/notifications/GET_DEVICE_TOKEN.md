# 📱 Get Device Token for Testing

## Quick Steps

1. **Go to Supabase Dashboard**
   - Table Editor → `device_tokens`
   - Find user: `8de1f877-32f8-4960-b550-8b7001a09b95`
   - Copy the `token` value

2. **Test in Firebase Console**
   - Firebase Console → Cloud Messaging → Send test message
   - Paste token and send

3. **If no token found:**
   - User needs to log in and grant notification permission
   - Or token might be expired (reinstall app)

## Alternative: Get Token via SQL

Run in Supabase SQL Editor:

```sql
SELECT 
  user_id,
  token,
  platform,
  created_at,
  last_used_at
FROM device_tokens
WHERE user_id = '8de1f877-32f8-4960-b550-8b7001a09b95';
```

This will show all device tokens for the user.
