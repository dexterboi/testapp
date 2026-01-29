# 🚀 Project Roadmap & Status

> [!NOTE]
> This document reflects the verified status of the PitchPerfect application as of **Jan 2026**.

## ✅ Implemented Features

### 🏟️ Venue Discovery & Booking (Web & Mobile)
- **Venue Search**: Real-time search by name, sport, or location.
- **Filtering**: Advanced filters for Price, Rating, Surface, Amenities, and Distance.
- **Interactive Map**: View venues on an interactive map with geolocation.
- **Complex Details**: Rich pages with image galleries, amenities lists, and "Quick Stats".
- **Pitch Listing**: View available pitches within a complex with pricing and details.
- **Reviews**: User review system with ratings and comments.

### 👥 "Spaces" - Social Features (Mobile First)
- **Lobbies System**:
  - Create Public or Private lobbies.
  - "Request to Join" workflow for public lobbies.
  - Direct invites for friends.
  - Real-time status updates (Joined, Requested).
- **Team Management**:
  - Create and manage Football Teams/Clubs.
  - Invite members to teams.
  - Team profiles with member rosters.
- **Social Graph**:
  - Friend system with "Invite" flow.
  - User profiles with avatars and activity stats.

### 📱 Mobile Architecture
- **Hybrid App**: Built with **Capacitor** technology.
- **Platform Support**: Ready for deployment to **iOS** and **Android**.
- **Native Features**: Geolocation integration, Push Notification infrastructure.

### 🛠️ Backend (Supabase)
- **Database**: Fully normalized Postgres schema (`lobbies`, `teams`, `complexes`, `pitches`, `friendships`).
- **Auth**: Secure user profiles (`user_profiles`) with Role-Based Access (RBAC).
- **Storage**: Image buckets for Venues and Avatars.

---

## 🚧 In Progress / Next Priorities

### 1. Academy Features (Beta)
- [ ] **Enrollment**: Full student registration flow for academies.
- [ ] **Payments**: Integration with local payment gateways for subscriptions.
- [ ] **Parent Portal**: Dedicated view for parents to manage child schedules.

### 2. Advanced Booking
- [ ] **Payment Integration**: Finalize Stripe/Konnect payment flow for pitch booking.
- [ ] **Calendar**: Sync bookings with device calendar.

### 3. Owner Dashboard 2.0
- [ ] **Analytics**: Improved revenue and utilization charts.
- [ ] **Booking Management**: Drag-and-drop calendar for complex owners.

---

## 🔮 Future Concepts

- **Tournaments**: Automated bracket generation for Lobbies.
- **Leagues**: Seasonal tracking for Teams.
- **Coach Marketplace**: Find and book private sessions with verified coaches.
