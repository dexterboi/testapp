# 🔧 Fix: Lobby Members 400 Bad Request - Missing ID Column

## Problem

When inviting a friend to a lobby, you get this error:
```
GET .../lobby_members?select=id%2Cstatus&... 400 (Bad Request)
```

## Root Cause

The `lobby_members` table uses a **composite primary key** `(lobby_id, user_id)` and **does NOT have an `id` column**. The code was trying to select `id, status` which causes a 400 error because `id` doesn't exist.

## Solution

I've fixed the `inviteToLobby` function to select the correct columns:
- Changed from: `.select('id, status')`
- Changed to: `.select('lobby_id, user_id, status')`

## What Was Fixed

✅ Updated `services/dataService.ts` → `inviteToLobby()` function
✅ Changed query to use composite key columns instead of non-existent `id` column

## After Fixing

1. The code is already fixed
2. Try inviting a friend to a lobby again
3. It should work now! ✅

## Note

The `lobby_members` table structure is:
- **Primary Key**: Composite `(lobby_id, user_id)`
- **Columns**: `lobby_id`, `user_id`, `status`, `invited_by`, `request_message`, `created_at`
- **No `id` column** - Always use the composite key!
