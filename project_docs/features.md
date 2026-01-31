# 🌟 Application Features Guide

## 📱 Mobile & Web Core Features

### 1. Venue Discovery
The core of PitchPerfect is finding the right place to play.

- **Smart Search**: Find venues by name or sport (Football, Padel, Tennis, Basketball).
- **Geolocation**: Automatically sorts venues by distance from your current location.
- **Rich Filtering**:
  - **Price**: Filter by max hourly rate.
  - **Surface**: Grass, Turf, Indoor, Clay, Hard Court.
  - **Amenities**: Show only venues with Showers, Parking, WiFi, etc. (Verified from `HomePage.tsx`).
- **Interactive Map**: Switch between List View and Map View to explore nearby pitches visually.

### 2. Spaces: Lobbies & Social Play
Organize matches without the headache. The "Spaces" tab is the hub for community play.

#### 🏟️ Lobbies
Lobbies are temporary groups for a specific match or event.
- **Public Lobbies**: Visible to everyone. Players can "Request Access" to join. useful for finding players for a pickup game.
- **Private Lobbies**: Invite-only. Great for organized weekly matches among friends.
- **Roles**:
  - **Host**: Can accept/reject requests, invite players, and delete the lobby.
  - **Member**: Can view lobby details and chat (planned).

#### 🛡️ Teams
Create a lasting identity for your squad.
- **Club Creation**: Establish a team with a custom name and logo.
- **Roster Management**: Invite players to join your official team roster.
- **Profile**: Verify team stats and member count (e.g., "12 Professional Members").

### 3. Booking Experience
Seamless flow from discovery to playing.

1. **Select Complex**: View detailed info, photos, and ratings.
2. **Choose Pitch**: Browse 5v5, 7v7, or Padel courts.
3. **Check Availability**: Real-time slot availability.
4. **Confirm**: Secure the slot (Booking logic handles conflict resolution via Supabase).

---

## 🔒 Security & Privacy
- **Secure Auth**: All personal data is protected behind Supabase Authentication.
- **RBAC**: Complex Owners have different permissions than Players.
- **Private Data**: Phone numbers and emails are only visible to authorized contacts.
