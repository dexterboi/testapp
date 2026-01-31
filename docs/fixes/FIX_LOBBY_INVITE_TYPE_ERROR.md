# 🔧 Fix: Lobby Invite Type Mismatch Error

## Problem

When inviting a friend to a lobby, you get this error:
```
Error inviting to lobby: {code: '42804', details: null, hint: null, message: 'COALESCE types uuid and text cannot be matched'}
```

## Root Cause

The database trigger `trigger_lobby_invite_notification()` was using `COALESCE` with mixed types (UUID and TEXT) when trying to get the inviter ID.

## Solution

I've fixed the trigger function to:
1. First get the inviter ID into a UUID variable
2. Use explicit UUID casting to ensure type consistency
3. Then use that variable for queries

## What You Need to Do

**Re-run the fixed SQL trigger in Supabase:**

1. Go to Supabase SQL Editor
2. Drop the existing trigger:
   ```sql
   DROP TRIGGER IF EXISTS lobby_invite_notification_trigger ON public.lobby_members;
   ```
3. Run the **entire** `CREATE_NOTIFICATION_TRIGGERS.sql` file again

The trigger function has been updated to handle UUID types correctly.

## What Was Fixed

✅ Changed the trigger to use a UUID variable first
✅ Added explicit UUID casting: `NEW.invited_by::UUID`
✅ Ensures both sides of COALESCE are UUID type

## After Fixing

1. Re-run the SQL triggers
2. Try inviting a friend to a lobby again
3. It should work now! ✅

## Alternative (Skip Triggers for Now)

If you don't want to set up notification triggers yet, you can:
1. Drop the trigger: `DROP TRIGGER IF EXISTS lobby_invite_notification_trigger ON public.lobby_members;`
2. The lobby invite will work, just without automatic push notifications
