# 🔧 Fix: Device Token Not Updated When Switching Users

## Problem

When you switch users on the same phone:
- User A logs in → Token saved for User A ✅
- User A logs out, User B logs in → Same device, same FCM token
- But token is still associated with User A in database ❌
- So notifications for User B don't work ❌

## Root Cause

The FCM token is **device-specific**, not user-specific. When a different user logs in on the same device:
- The same FCM token is generated
- But the database still has it associated with the previous user
- The code only checks if token exists for current user, not if it exists for a different user

## Solution

I've updated `saveDeviceToken` to:
1. ✅ Check if token exists for current user → Update timestamp
2. ✅ Check if token exists for DIFFERENT user → Reassign to current user
3. ✅ If token doesn't exist at all → Insert new record

This ensures that when User B logs in on the same device:
- The token gets reassigned from User A to User B
- Notifications will work for User B

## What Was Fixed

✅ Updated `services/pushNotificationService.ts` → `saveDeviceToken()` function
✅ Now checks if token exists for different user and reassigns it
✅ Handles user switching on same device correctly

## Testing

1. **Log in as User A on phone**
   - Check Supabase → `device_tokens` → Should see token for User A

2. **Log out and log in as User B on same phone**
   - Check Supabase → `device_tokens` → Token should now be for User B
   - The token `user_id` should be updated to User B

3. **Send notification to User B**
   - Should work now! ✅

## How It Works Now

```
User A logs in → Token saved: {user_id: A, token: "abc123"}
User A logs out
User B logs in → Same device, same token "abc123"
  → Code detects token exists for User A
  → Updates: {user_id: B, token: "abc123"}
  → Now notifications work for User B! ✅
```

## Next Steps

1. **Rebuild the app** (if needed)
2. **Test user switching:**
   - Log in as User A
   - Log out
   - Log in as User B
   - Check `device_tokens` table - token should be for User B
3. **Test notification:**
   - Send invite to User B
   - Should receive notification! ✅
