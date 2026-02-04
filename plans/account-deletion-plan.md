# User Account Deletion Feature - Implementation Plan

## Overview
Add the ability for non-owner users to delete their account, which removes all their data from the database.

## Requirements
- Only show "Delete Account" option for non-owner users
- Delete all user-related data from database tables
- Show confirmation dialog before deletion
- Handle errors gracefully
- Sign out user after successful deletion

## Database Tables to Clean Up

Based on the codebase analysis, the following tables need to be cleaned when a user deletes their account:

1. **device_tokens** - Push notification tokens
2. **push_notification_subscriptions** - Push notification subscriptions
3. **friendships** - Friend relationships (where user is requester or receiver)
4. **team_members** - Team memberships
5. **messages** - Chat messages sent by user
6. **bookings** - User's bookings
7. **users** - User profile record
8. **auth.users** - Supabase Auth user (requires admin API or Edge Function)

## Implementation Approach

### Option 1: Client-Side Deletion (Simpler, but limited)
- Delete from database tables directly from the client
- Call `supabase.auth.signOut()` after deletion
- Note: Cannot delete auth user without admin privileges

### Option 2: Edge Function (Recommended, more secure)
- Create a Supabase Edge Function to handle deletion
- Edge Function has admin privileges to delete auth user
- Better for handling complex cascading deletes
- More secure as it can verify ownership server-side

## Recommended Implementation: Edge Function

### Files to Create/Modify:

1. **Create: `supabase/functions/delete-user-account/index.ts`**
   - Edge Function to handle account deletion
   - Verify user is not an owner
   - Delete all related records
   - Delete auth user
   - Return success/failure

2. **Modify: `src/components/pages/UserProfile.tsx`**
   - Add "Delete Account" button in Account Hub section
   - Only show for non-owner users
   - Show confirmation modal
   - Call Edge Function
   - Handle success (sign out, navigate to login)
   - Handle errors (show error message)

3. **Add translations to i18n files**
   - Add keys for delete account UI

## UI/UX Design

### Button Placement
Add in the "Account Hub" section of UserProfile, after the Logout button:
- Red/destructive styling
- Warning icon
- Label: "Delete Account"
- Subtitle: "Permanently delete your account and all data"

### Confirmation Modal
- Title: "Delete Account?"
- Message: "This action cannot be undone. All your data will be permanently deleted."
- Buttons: "Cancel" (secondary), "Delete Account" (destructive red)
- Require user to type "DELETE" to confirm (optional extra security)

## Security Considerations

1. **Verify user is not an owner** before allowing deletion
2. **Verify user ID matches** the authenticated user
3. **Use RLS policies** to ensure users can only delete their own data
4. **Soft delete option** (mark as deleted instead of hard delete) - consider for future

## Error Handling

- Network errors
- Database constraint errors
- Partial deletion failures (transaction rollback)
- User cancellation

## Testing Checklist

- [ ] Delete button only shows for non-owner users
- [ ] Delete button hidden for owner users
- [ ] Confirmation modal appears
- [ ] Cancel button works
- [ ] Delete proceeds after confirmation
- [ ] All user data removed from database
- [ ] User signed out after deletion
- [ ] Error messages shown if deletion fails
- [ ] User can re-register with same email after deletion (if desired)

## Migration/Edge Function Deployment

1. Create Edge Function code
2. Deploy to Supabase
3. Test with test user account
4. Monitor logs for errors

## Questions for User

1. Should we implement soft delete (mark as inactive) instead of hard delete?
2. Should we require email confirmation or password re-entry before deletion?
3. Any specific data retention requirements?
4. Should we send a confirmation email after account deletion?
