# 📄 PitchPerfect Project Documentation

> [!NOTE]
> This document is formatted to be easily copied into Notion. It covers the current state of the PitchPerfect ecosystem, the roadmap for the new Academy App, and deployment guides.

## 🌟 Project Overview

**PitchPerfect** is a comprehensive ecosystem for the football community, connecting players, facility owners, and academies.

**The Ecosystem consists of:**
1.  **PitchPerfect App (Mobile/Web)**: For players to discover pitches, book fields, and socialize (Teams, Lobbies).
2.  **Owner Portal (Web)**: For complex owners to manage facilities and bookings.
3.  **Academy Portal (Web - Beta)**: For academy managers to organize programs and students.
4.  **Academy App (Planned)**: A dedicated mobile experience for parents, students, and coaches.

---

## ✅ Implementation Status

### 1. User Mobile App (React / Capacitor)
*Current Version: v1.0.0*

**Core Features:**
*   **🏟️ Discovery**: Real-time complex search by location, sport, and amenities.
*   **📅 Booking**: Interactive slot selection, 75-min match duration, buffer management.
*   **🗺️ Map View**: Interactive Leaflet map with complex markers.
*   **👥 Social Spaces**:
    *   **Lobbies**: Create/Join public or private game lobbies.
    *   **Teams**: Create football clubs, manage rosters.
    *   **Friends**: Add friends and invite them to games.
*   **👤 Profile**: Player stats (Games, Wins, Losses), Avatar management.

**Tech Stack:**
*   **Framework**: React 19, Vite, Tailwind CSS.
*   **Mobile**: Ionic Capacitor (iOS/Android ready).
*   **Backend**: Supabase (Postgres, Auth, Storage).

### 2. Website & Owner Portal (HTML / Vanilla JS)
*Current Status: Active*

**Location**: `website/` directory (Pure HTML/JS)

**Core Features:**
*   **📊 Dashboard**: Real-time stats (Revenue, Bookings).
*   **🏢 Management**: CRUD operations for Complexes and Pitches.
*   **📅 Booking System**: Approve/Reject workflow with "Access Code" generation.
*   **🎓 Academy Management (Beta)**:
    *   **Programs**: Create training programs (e.g., "Elite Junior") with age groups and pricing.
    *   **Student Registry**: Enrollment management, payment status tracking.
    *   **Coach Management**: Staff profiles and assignment.
    *   **Schedule**: Calendar view of training sessions.

---

## 🗺️ Roadmap: Academy Mobile App

**Goal**: Create a dedicated mobile application linked to the same Supabase backend to serve the needs of Academy stakeholders (Parents, Students, Coaches).

### 📱 Planned Features by Role

#### 👨‍👩‍👧 For Parents & Students
*   **Dashboard**: View upcoming training sessions and match schedules.
*   **Digital Player Card**: Stats, evaluation reports, and "Skill Spider Chart".
*   **Payments**: Pay monthly fees directly via the app (Konnect/Stripe integration).
*   **Attendance**: Real-time notification when the child arrives/leaves (QR Code scan).
*   **Gallery**: Photos/Videos from training sessions shared by coaches.

#### 🧢 For Coaches
*   **Session Management**: View daily schedule and session plans.
*   **Attendance**: Quick "Tap to Mark" attendance for students.
*   **Evaluation**: Simple form to rate player performance after matches (Technical, Tactical, Physical).
*   **Communication**: Broadcast messages to specific age groups (e.g., "Training cancelled due to rain").

#### 🛠️ Technical Strategy
*   **Backend**: Reuse existing Supabase `users` table with new roles (`academy_parent`, `academy_coach`, `academy_student`).
*   **Database**: Utilize existing `academies`, `programs`, `enrollments` tables (from Web Portal).
*   **Codebase**:
    *   *Recommendation*: Build as a separate project or within a monorepo structure to share UI components with the main PitchPerfect app.
    *   *Tech*: React Native (Expo) or Capacitor (React) to match main app expertise.

---

## 🛠️ iOS Build Guide (Capacitor)

Follow these steps to generate the iOS version of the app.

### Prerequisites
*   Mac with macOS (latest).
*   Xcode (latest) installed.
*   Apple Developer Account (for TestFlight/App Store).

### Step-by-Step
1.  **Build the Web Assets**:
    ```bash
    npm run build
    ```
    *Ensures the `dist` folder is up to date.*

2.  **Add iOS Platform** (if not already added):
    ```bash
    npx cap add ios
    ```

3.  **Sync Native Project**:
    ```bash
    npx cap sync ios
    ```
    *Copies web assets and plugins to the native iOS project.*

4.  **Open in Xcode**:
    ```bash
    npx cap open ios
    ```

5.  **Configure Signing**:
    *   In Xcode, click on the **App** project root in the left navigator.
    *   Select the **Signing & Capabilities** tab.
    *   Select your **Team** (Add account if needed via Xcode > Preferences > Accounts).
    *   Ensure "Automatically manage signing" is checked.
    *   Set a unique **Bundle Identifier** (e.g., `com.pitchperfect.app`).

6.  **Configure Icons & Splash Source**:
    *   Use `@capacitor/assets` to generate icons.
    *   Place a `logo.png` (1024x1024) in `assets/`.
    *   Run: `npx capacitor-assets generate --ios`

7.  **Build & Archive**:
    *   Select **Any iOS Device (arm64)** as the target.
    *   Go to **Product > Archive**.
    *   Once finished, the **Organizer** window will open.
    *   Click **Distribute App** -> **TestFlight & App Store** -> **Upload**.

---

## 📋 App Store & Play Store Review Criteria

To ensure your app is accepted, verify these critical points before submission.

### 🍏 Apple App Store (Strict)
1.  **Functionality**: No "Coming Soon" buttons or broken links. The app must be fully functional.
2.  **Test Account**: You **MUST** provide a demo user account (email/password) in App Connect for the reviewer to log in.
3.  **Permissions**:
    *   If using Location, the usage description in `Info.plist` (`NSLocationWhenInUseUsageDescription`) must be specific (e.g., "Used to show playing fields near you").
    *   If capturing photos, explain why (e.g., "Used to upload profile pictures").
4.  **User Generated Content (UGC)**:
    *   Since users can post Lobbies/Reviews, you must have:
        *   A mechanism to Report/Block abusive users.
        *   Acceptance of Terms of Use (EULA) upon signup.
5.  **Design**: Follow Human Interface Guidelines. Avoid web-like behaviors (like small tap targets).
6.  **Privacy**: A link to your Privacy Policy must be accessible inside the app (usually in Settings/Profile).

### 🤖 Google Play Store
1.  **Data Safety Section**: You must accurately declare what data you collect (Location, Personal Info) and why.
2.  **Target API Level**: Ensure your build targets the latest Android API level (check `android/variables.gradle`).
3.  **App Content**: Complete the content rating questionnaire accurately.
4.  **Performance**: App should not crash on startup. Pre-launch report in Play Console will catch this.
