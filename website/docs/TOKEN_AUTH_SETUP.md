# 🔑 Portal Token-Based Authentication

## What Changed

✅ **Removed Google OAuth** - No more Google login  
✅ **Removed Email/Password** - No more Supabase auth  
✅ **Token-Based Login** - Simple token authentication using `portal_token`
✅ **Fixed Redirect** - Now goes to `dashboard.html` correctly  

## How It Works

1. **Owner gets a token** - Stored in `user_profiles.portal_token`
2. **Owner enters token** - On login page
3. **System verifies token** - Checks if token exists and belongs to owner
4. **Access granted** - Redirects to dashboard

## Setup Steps

### 1. Run SQL in Supabase

Go to Supabase SQL Editor and run:

```sql
-- Add portal_token column
ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS portal_token TEXT;

-- Create index
CREATE INDEX IF NOT EXISTS idx_user_profiles_portal_token 
ON public.user_profiles(portal_token) 
WHERE portal_token IS NOT NULL;
```

### 2. Generate Tokens for Owners

For each owner, generate a token and update their profile:

```sql
-- Generate token for specific owner (replace USER_ID)
UPDATE public.user_profiles
SET portal_token = encode(gen_random_bytes(32), 'hex')
WHERE id = 'USER_ID_HERE' AND role = 'owner';
```

Or generate tokens for all owners:

```sql
-- Generate tokens for all owners
UPDATE public.user_profiles
SET portal_token = encode(gen_random_bytes(32), 'hex')
WHERE role = 'owner' AND portal_token IS NULL;
```

### 3. Get Owner Tokens

To see all owner tokens:

```sql
SELECT id, name, email, portal_token
FROM public.user_profiles
WHERE role = 'owner' AND portal_token IS NOT NULL;
```

### 4. Share Tokens with Owners

Give each owner their unique token. They'll use it to login to the website.

## Security Notes

- ✅ Tokens are unique per owner
- ✅ Only owners can login (role check)
- ✅ Token stored in sessionStorage (cleared on logout)
- ✅ Token verified on every dashboard load

## Testing

1. **Get a token** from database
2. **Go to**: http://localhost:8000/login.html
3. **Enter token** in the input field
4. **Click Sign In**
5. **Should redirect** to dashboard.html ✅

## Regenerating Tokens

If an owner loses their token or needs a new one:

```sql
-- Generate new token for owner
UPDATE public.user_profiles
SET portal_token = encode(gen_random_bytes(32), 'hex')
WHERE id = 'OWNER_USER_ID';
```

## Benefits

- ✅ **Simple** - No OAuth complexity
- ✅ **Secure** - Token-based authentication
- ✅ **Reliable** - No redirect issues
- ✅ **Easy to manage** - Generate/regenerate tokens as needed
- ✅ **Optimized** - No conflict with standard `access_token` query parameters
