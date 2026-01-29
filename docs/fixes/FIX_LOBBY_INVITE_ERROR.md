# 🔧 Fix: Lobby Invite Error - "relation public.users does not exist"

## Problem

When inviting a friend to a lobby, you get this error:
```
Error inviting to lobby: {code: '42P01', details: null, hint: null, message: 'relation "public.users" does not exist'}
```

## Root Cause

The database triggers for push notifications are trying to query `public.users`, but the actual table is `public.user_profiles`.

## Solution

I've fixed the SQL triggers file. You need to **re-run the fixed SQL** in Supabase:

### Step 1: Drop Existing Triggers (if they exist)

Run this in Supabase SQL Editor:

```sql
DROP TRIGGER IF EXISTS lobby_invite_notification_trigger ON public.lobby_members;
DROP TRIGGER IF EXISTS lobby_access_request_notification_trigger ON public.lobby_members;
DROP TRIGGER IF EXISTS friend_request_notification_trigger ON public.friendships;
```

### Step 2: Re-run the Fixed Triggers

Run the **entire** `CREATE_NOTIFICATION_TRIGGERS.sql` file again in Supabase SQL Editor.

The file has been updated to use `user_profiles` instead of `users`.

## What Was Fixed

✅ Changed all `FROM public.users` to `FROM public.user_profiles` in:
- `trigger_friend_request_notification()` function
- `trigger_lobby_invite_notification()` function  
- `trigger_lobby_access_request_notification()` function

✅ Also fixed TypeScript service files:
- `services/firebaseAdminService.ts`
- `services/notificationSender.ts`

## After Fixing

1. Re-run the SQL triggers
2. Try inviting a friend to a lobby again
3. It should work now! ✅

## Note

If you haven't set up the notification triggers yet, you can skip them for now. The lobby invite will still work, just without automatic push notifications.
