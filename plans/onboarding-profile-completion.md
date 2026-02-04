# Onboarding Profile Completion - Implementation Plan

## Overview
When a new user logs in (via Google OAuth or manual registration), they should be redirected to a profile completion form before accessing the main app. This ensures all required user information is collected upfront.

## Required Fields for Profile Completion
Based on the User interface and database schema:
1. **Name** (required) - Full name of the user
2. **Phone** (required) - Phone number for contact/booking
3. **Address** (optional) - User's location/address
4. **Avatar** (optional) - Profile picture

## Implementation Approach

### 1. Database Schema Check
Need to verify the `users` table has all necessary fields:
- `id` (uuid, primary key) - from auth.users
- `name` (text) - required
- `email` (text) - from auth
- `phone` (text) - required, currently nullable
- `address` (text) - optional, may need to add
- `avatar` (text) - optional, URL to image
- `role` (text) - 'player' by default
- `profile_completed` (boolean) - NEW FIELD to track completion

### 2. Components to Create/Modify

#### A. Create: `src/components/pages/OnboardingProfile.tsx`
- Full-screen modal/page that blocks app access until completed
- Form with all required fields
- Avatar upload with camera/gallery options
- Save button that updates user profile
- Validation for required fields
- Design following app design system (rounded corners, shadows, primary colors)

#### B. Modify: `src/App.tsx`
- Check if user profile is complete on login
- If not complete, show OnboardingProfile component instead of main app
- Pass user data and completion callback

#### C. Modify: `src/components/pages/Auth.tsx`
- After successful login/registration, check if profile is complete
- If new user or incomplete profile, trigger onboarding flow

### 3. Backend Changes

#### A. Database Migration
```sql
-- Add profile_completed column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS address TEXT;

-- Update existing users to have profile_completed = TRUE
UPDATE users SET profile_completed = TRUE WHERE name IS NOT NULL AND phone IS NOT NULL;
```

#### B. RLS Policies
Ensure users can update their own profile during onboarding.

## UI/UX Design

### OnboardingProfile Component Layout:
```
┌─────────────────────────────┐
│  Complete Your Profile      │
│                             │
│  [Avatar Upload]            │
│  Tap to add photo           │
│                             │
│  Full Name *                │
│  ┌─────────────────────┐    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  Phone Number *             │
│  ┌─────────────────────┐    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  Address                    │
│  ┌─────────────────────┐    │
│  │                     │    │
│  └─────────────────────┘    │
│                             │
│  [  Complete Profile  ]     │
│                             │
└─────────────────────────────┘
```

### Design System Compliance:
- Background: `bg-[#F8F9FA]` (light) / `dark:bg-[#121417]` (dark)
- Cards: `bg-white dark:bg-[#1E2126]` with `shadow-soft`
- Inputs: Rounded-xl with border
- Button: Primary green with rounded-2xl
- Typography: Same as UserProfile

## Flow Diagram

```
User Logs In (Google/Manual)
        │
        ▼
Check if profile_completed = TRUE
        │
    ┌───┴───┐
    │       │
   YES     NO
    │       │
    ▼       ▼
Home   OnboardingProfile
Page       │
           ▼
      User fills form
           │
           ▼
      Save to database
      profile_completed = TRUE
           │
           ▼
      Redirect to Home
```

## Files to Modify:
1. `src/App.tsx` - Add profile completion check
2. `src/components/pages/Auth.tsx` - Trigger onboarding after auth
3. Create `src/components/pages/OnboardingProfile.tsx` - New component
4. Database migration - Add columns

## Questions:
1. Should we make address required or optional?
2. Should we allow users to skip and complete later?
3. Any other fields needed (birthdate, preferred sport, etc.)?
