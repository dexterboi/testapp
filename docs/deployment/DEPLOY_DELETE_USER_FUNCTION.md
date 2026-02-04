# Deploy Delete User Account Edge Function

## Overview
This guide explains how to deploy the `delete-user-account` Edge Function to Supabase.

## Prerequisites
- Supabase CLI installed
- Logged in to Supabase (`supabase login`)
- Project reference ID: `dgpdlwklqvbmdtalyiis`

## Deployment Steps

### 1. Login to Supabase

```bash
npx supabase login
```

This will open a browser window to authenticate with your Supabase account.

### 2. Deploy the Function

```bash
npx supabase functions deploy delete-user-account --project-ref dgpdlwklqvbmdtalyiis
```

### 3. Verify Deployment

After deployment, verify the function is available:

```bash
npx supabase functions list --project-ref dgpdlwklqvbmdtalyiis
```

You should see `delete-user-account` in the list.

### 4. Test the Function

You can test the function using curl:

```bash
curl -X POST \
  https://dgpdlwklqvbmdtalyiis.supabase.co/functions/v1/delete-user-account \
  -H "Authorization: Bearer <YOUR_JWT_TOKEN>" \
  -H "Content-Type: application/json"
```

Replace `<YOUR_JWT_TOKEN>` with a valid user JWT token.

## Function Behavior

### What the Function Does:
1. Verifies the user's JWT token
2. Checks if user is an owner (owners cannot delete via this function)
3. Deletes all related data:
   - Device tokens
   - Push notification subscriptions
   - Friendships
   - Team memberships
   - Messages
   - Bookings
   - Lobby memberships
   - User profile from `users` table
   - Auth user account

### Security:
- Requires valid JWT token
- Only non-owner users can delete their accounts
- Uses service role key for admin operations
- Returns detailed error messages on failure

## Troubleshooting

### "Access token not provided"
Run `npx supabase login` first to authenticate.

### "Function already exists"
The deployment will update the existing function.

### "Failed to delete auth user"
Ensure the `SUPABASE_SERVICE_ROLE_KEY` environment variable is set in your Supabase project.

## Environment Variables Required

The function requires these environment variables to be set in your Supabase project:

- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key for admin operations

These are automatically available in the Edge Function runtime.

## Post-Deployment

After deploying the function:

1. Rebuild the APK to include the new UI changes
2. Test account deletion with a test user account
3. Monitor the Edge Function logs for any errors

## Related Files

- `supabase/functions/delete-user-account/index.ts` - Edge Function code
- `src/components/pages/UserProfile.tsx` - UI with delete account button
- `plans/account-deletion-plan.md` - Implementation plan
