# Store Submission & Release Guide

This document outlines the requirements and steps to successfully launch both the PitchPerfect main app and the Academy app on iOS and Android.

## 1. Technical Requirements (iOS & Android)

- **App Icons**: 1024x1024px high-res icon.
- **Splash Screens**: Branded launch screens for all device sizes.
- **Privacy Policy**: Hosted URL (e.g., `pitchperfect.com/privacy`).
- **Support URL**: Way for users to contact support.
- **Demo Account**: Required for reviewers (Apple/Google) to test the app without a real payment.

## 2. Apple App Store (iOS) Requirements

- **Developer Account**: $99/year (Individual or Organization).
- **Guidelines**:
    - No "placeholder" content.
    - App must use "Sign in with Apple" if other social logins (Google) are used.
    - High focus on UI/UX quality.
- **Submission**: Via Xcode or Transporter (Standard binary upload).

## 3. Google Play Store (Android) Requirements

- **Developer Account**: One-time $25 fee.
- **20-Tester Rule**: NEW personal accounts must have 20 testers opt-in for 14 days before production release.
- **Submission**: Via Google Play Console (AAB - Android App Bundle).

## 4. Play Store Pushing Checklist (Android)

1. [ ] **Internal Testing**: Share AAB with developers.
2. [ ] **Closed Testing**: The "20 testers" phase (required for new accounts).
3. [ ] **Store Listing**: Screenshots (min 2, max 8), feature graphic (1024x500), short & long descriptions.
4. [ ] **Release**: Promote to Production after testing.

## 5. App Store Pushing Checklist (iOS)

1. [ ] **TestFlight**: Distribute to internal/external testers.
2. [ ] **App Information**: Category, Keywords, Age Rating.
3. [ ] **Submission**: Submit for Review (takes 24-48h typically).

## Success Tips
- **Videos**: Include a 30s preview video for higher conversion.
- **Description**: Use keywords effectively (e.g., "football academy", "pitch booking").
- **Backend Stability**: Ensure Supabase won't hit rate limits during review.
