# Academy App: Mobile Strategy

The goal is to create a dedicated mobile experience tailored for **Parents, Students, and Coaches**, separate from the main PitchPerfect complex manager app.

## Why a Separate App?
1. **Targeted UX**: Parents don't need pitch management; they need child progress and schedules.
2. **Branding**: Allows academies to have a "white-label" feel.
3. **Performance**: Smaller footprint, faster load times for student-specific features.

## Architecture Plan

- **Framework**: React Native with Expo (for fast iteration & EAS builds).
- **Backend (Shared)**: Same Supabase project, leveraging existing `academy_registrations`, `academy_students`, and `academy_coaches` tables.
- **State Management**: React Query (TanStack) for seamless data syncing.

## Feature Roadmap for Academy App

### Phase 1: Parent/Student View
1. **Registration Tracking**: Real-time status of their pending requests.
2. **Attendance & Schedule**: Calendar view of upcoming sessions.
3. **Payment Reminders**: Push notifications for expired memberships.
4. **Digital Badge**: QR code for attendance check-in.

### Phase 2: Coach Interface
1. **Session Management**: Coaches see their assigned slots.
2. **Attendance Toggling**: Mark students present/absent via app.
3. **Quick Feedback**: 1-minute reports on student performance.

## Design Inspiration
- **Aesthetic**: Dynamic, sporty, high-contrast (using the PitchPerfect color palette).
- **Interactions**: Swipe-based navigation between children (if multiple).

## Implementation Steps
1. [ ] Initialize new Expo project `pitchperfect-academy`.
2. [ ] Shared components library (Style tokens, Supabase client).
3. [ ] Implement Auth flow (OTP or Magic Link for parents).
4. [ ] Build "My Schedule" and "Child Profile" screens.
