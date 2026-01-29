# Larena (PitchPerfect) – Update Doc

**Purpose:** Base reference for the mobile app, owner website, shared backend, and conventions. Use this for future edits and onboarding.

> **Note:** The application now uses Supabase exclusively for all data operations.

---

## 1. Project Overview

| Part | Tech | Purpose |
|------|-----|---------|
| **App** | React 19, Vite 6, TypeScript, Capacitor 8 (Android) | Mobile: discover, book, lobbies, chat, profile |
| **Website** | Vanilla HTML/JS, Tailwind, Supabase JS, Chart.js | Owner CRM: dashboard, complexes, bookings, analytics |
| **Backend** | Supabase (Postgres, Auth, Storage, Edge Functions) | API, auth, storage, server logic |
| **App hosting** | **Netlify** | Web build of the app (`dist/`); same build is Capacitor’s `webDir` for Android |

- **Brand:** Larena (app: "Larena", CRM: "Larena CRM")
- **Primary color:** `#D9FF66` (lime)
- **Fonts:** Outfit (display), Inter (body)

---

## 2. App (Mobile)

### 2.1 Stack & Build

- **Root:** `package.json`, `vite.config.ts`, `capacitor.config.ts`
- **Entry:** `index.tsx` → `App.tsx` (HashRouter)
- **Build:** `npm run build` → `dist/`; Capacitor uses `webDir: 'dist'`
- **App ID:** `com.pitchperfect.app`, **Name:** Larena
- **Deployment:** The app is deployed on **Netlify**. `netlify.toml` sets `build: npm run build`, `publish: dist`, SPA redirects (`/*` → `/index.html`), `NODE_VERSION: 18`, and security/cache headers. Scripts: `npm run deploy` (= build + `netlify deploy --prod`), `npm run deploy:draft` (= build + `netlify deploy`). The same `dist/` is used for Netlify (web) and as Capacitor’s `webDir` for the Android build.

**Env (Vite):** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY` (optional, for AI).

### 2.2 Routes (`App.tsx`)

| Path | Page | Notes |
|------|------|-------|
| `/` | HomePage | Discover complexes, distance, search |
| `/complex/:id` | ComplexDetailPage | Complex + list of pitches |
| `/pitch/:id` | PitchDetailsPage | Pitch details, slots, booking |
| `/booking/confirm` | BookingConfirmPage | Post-booking confirmation |
| `/bookings` | UserBookingsPage | User’s bookings |
| `/profile` | UserProfile | Profile, logout |
| `/social` | CrewPage | Friends / social |
| `/chat/:friendshipId` | ChatPage | DMs |
| `/spaces` | SpacesPage | Lobbies / spaces |
| `/lobby/:lobbyId` | LobbyDetailPage | Lobby detail |
| `/team/:teamId` | TeamDetailPage | Team detail |
| `/admin` | AdminPage | Admin |
| `/owner` | OwnerDashboard | In-app owner dashboard (basic) |
| `/owner/bookings/:complexId` | OwnerBookingsPage | Owner bookings for a complex |
| `/owner/pitches/:complexId` | OwnerPitchesPage | Owner pitches for a complex |
| `/email-confirmed` | EmailConfirmationPage | Post signup email confirm |

### 2.3 Main Components (`/components`)

- **Auth.tsx** – Email/password + Google OAuth; `supabase.auth.signInWithPassword` / `signInWithOAuth`
- **TabBar** – Bottom nav
- **SpacesPage, LobbyDetailPage, TeamDetailPage, MapView** – Lobbies, teams, map
- **CrewPage, ChatPage** – Social and DMs
- **NotificationCenter** – In-app notifications
- **OwnerDashboard, UserProfile, ImageUpload, ImageViewer, ConfirmationModal, SuccessModal, EmailConfirmation**

### 2.4 Services (`/services`)

| File | Role |
|------|------|
| **supabase.ts** | Supabase client, `getFileUrl(bucket, path)`, `getBucketName(collection, field)` |
| **dataService.ts** | `getPitches`, `getPitch`, `getComplexes`, `getComplex`, `getPitchesByComplex`, `getUserBookings`, `getUserLocation`, `calculateDistance`, `getReviews`, `submitReview`, `searchUsers`, `getFriendships`, `sendFriendRequest`, `updateFriendshipStatus`, `removeFriendship`, `getMessages`, `sendMessage`, lobbies, `lobby_members`, `lobby_messages`, teams, `team_members`, `team_messages` |
| **bookingService.ts** | `getAvailableSlots`, `createBookingRequest`, `getComplexBookings`, `updateBookingStatus`, `cancelBooking`, `requestCancellation`; slot logic: `match_duration` + 15 min buffer |
| **pushNotificationService.ts** | `initializePushNotifications`, `device_tokens` register/unregister |
| **geminiService.ts** | `searchPitchesAI`, `chatWithSupport`, `getPriceAnalysis` (Gemini) |
| **imageKitService.ts** | ImageKit uploads (if used) |
| **assetService.ts** | `getRealPlaceholderImage` |
| **notificationSender.ts**, **firebaseAdminService.ts** | Server-side / FCM (Node; not in Vite build) |

### 2.5 App Auth

- **Supabase Auth:** `signInWithPassword`, `signUp`, `signInWithOAuth` (Google). Redirect: `com.pitchperfect.app://` on native.
- **Session:** Supabase client manages `auth`; `handle_new_user` creates `user_profiles` on signup.
- **No `access_token` in app** – that is only for the **owner website**.

### 2.6 Types (`types.ts`)

`User`, `Complex`, `Pitch`, `Booking`, `Message`, `Lobby`, `Team`, `Amenity`, `SurfaceType` – some fields (e.g. `complex` vs `complex_id`) are normalized in services.

---

## 3. Website (Owner CRM)

### 3.1 Pages & Scripts

| File | Role |
|------|------|
| **index.html** | Landing: hero, features, owner CTA, Get App (APK from `APP_CONFIG.DOWNLOAD_URL`), stats from Supabase, QR modal |
| **login.html** | Owner login: **Access Token** (`user_profiles.access_token`), `role=owner`; stores `owner_token`, `owner_id`, `owner_name` in `sessionStorage`; redirect to `dashboard.html` |
| **dashboard.html** | Dashboard: sidebar, stats, Revenue Trend + Booking Status + Pitch Performance + Peak Hours + Weekly Pattern + Revenue Breakdown; complex selector in header |
| **complexes.html** | Complexes: same shell, Complex Details + Pitches tabs; `#managementSection`, `#complexTab`, `#pitchesTab` |
| **bookings.html** | Bookings: same shell, Bookings tab; `#managementSection`, `#bookingsTab` |

**Shared script:** `dashboard.js` is used by `dashboard.html`, `complexes.html`, and `bookings.html`. It branches on `path.endsWith('complexes.html')` / `path.endsWith('bookings.html')` to show/hide sections and tabs.

### 3.2 `config.js` (Website)

```js
IMAGEKIT_CONFIG = { PUBLIC_KEY, URL_ENDPOINT, PRIVATE_KEY }
APP_CONFIG = { DOWNLOAD_URL }  // APK download, e.g. GitHub releases
```

- **Supabase:** In `dashboard.js` and `login.html`: URL and anon key are inlined (same project as app).

### 3.3 `dashboard.js` – Structure

- **Supabase:** Fallbacks for `supabaseJs` / `window.supabase` / `supabase` before `createClient`.
- **Auth:** On load, reads `sessionStorage.owner_token`, verifies `user_profiles` (`access_token`, `role=owner`). If invalid → `login.html`.
- **State:** `currentUser`, `currentComplexId`, `currentComplex`, `complexes`, `bookings`, `pitches`; chart refs: `revenueChart`, `statusChart`, `pitchPerformanceChart`, `peakHoursChart`, `weeklyPatternChart`, `revenueBreakdownChart`.
- **Flow:**
  1. `initSupabase` → `initDashboard` → `loadComplexes` (with `cached_complexes` / `selected_complex_id` in sessionStorage).
  2. `selectComplex(id)` → `loadComplexData` (bookings with `pitches(*, complexes(*))`, `user_profiles(*)`; pitches for complex) → `updateStats`, `updateCharts`, `updateAdvancedCharts` (if defined), `renderBookings`, `renderPitches`.
  3. `populateComplexSelector` – fills `#complexSelect`; `#noComplexesMessage` when none.
- **Sections (by page):**
  - **dashboard.html:** `#statsSection`, `#chartsSection`, `#analyticsSection`, `#patternsSection` (no `#managementSection` content in markup; layout may be cut).
  - **complexes.html:** `#managementSection` with Complex Details + Pitches.
  - **bookings.html:** `#managementSection` with Bookings.
- **CRUD:**
  - **Complex:** `update-complex` Edge Function (PUT/POST) with `Authorization: Bearer {owner_token}`; ImageKit for `images`; `complexes` and `complex_id`-aware modals.
  - **Pitch:** `update-pitch` Edge Function (PUT/POST); ImageKit for `image`.
  - **Booking:** `updateBookingStatus` via Supabase client (`bookings` update). `deletePitch` is referenced in `renderPitches`; implementation may live in `dashboard.js` or be missing (confirm before using).
- **Charts (Chart.js):**  
  - `updateCharts`: Revenue Trend (line, 6 months), Booking Status (doughnut: approved/pending/cancelled/cancel_request).  
  - `updateAdvancedCharts`: Pitch Performance (bar, revenue by pitch), Peak Hours (bar, 24h), Weekly Pattern (line, Sun–Sat), Revenue Breakdown (doughnut, by `sport_type`).  
  Charts expect `#revenueChart`, `#statusChart`, `#pitchPerformanceChart`, `#peakHoursChart`, `#weeklyPatternChart`, `#revenueBreakdownChart`; if an element is missing, that chart is skipped.
- **Stats:** `totalRevenue`, `monthlyRevenue`, `monthlyBookings`, `pendingRequests`, `avgBookingValue`, `occupancyRate` (from `updateStats`).
- **Renders:**  
  - **Bookings:** table rows; `renderBookings(filter)`; `booking.pitches`, `booking.user_profiles`; Approve/Reject, Approve/Reject cancel.  
  - **Pitches:** table rows; `pitch.type || 'Football'` and `pitch.sport_type` in different places (prefer `sport_type` if present); Edit; `deletePitch` if implemented.

### 3.4 Website Auth

- **Login:** Token in `user_profiles.access_token` + `role=owner`; no Supabase Auth JWT for website.
- **Edge Functions:** `update-complex`, `update-pitch` validate owner via `access_token` against `user_profiles` (see `IMPORTANT_UPDATE_EDGE_FUNCTIONS.md`). They do **not** use Supabase Auth JWT.

---

## 4. Supabase – Tables & Migrations

**Base:** `supabase_migration.sql` (user_profiles, complexes, pitches, bookings, RLS, triggers, storage buckets).

**Main tables:**

| Table | Purpose |
|-------|---------|
| **user_profiles** | `id` (→ auth.users), `email`, `name`, `role` ('player'\|'owner'), `phone`, `avatar`, `loyalty_points`, `wins`, `losses`, `games_played`, `access_token` (owner website only, from `ADD_OWNER_TOKEN.sql`) |
| **complexes** | `id`, `name`, `address`, `location_lat`, `location_lng`, `owner_id` (→ auth.users), `description`, `phone`, `email`, `facilities` (JSONB), `images` (TEXT[]) |
| **pitches** | `id`, `complex_id`, `name`, `surface`, `size`, `price_per_hour`, `image`, `opening_hour`, `closing_hour`, `match_duration`, `status` ('active'\|'maintenance'\|'closed'); `sport_type` added in `ADD_SPORT_TYPE_TO_PITCHES.sql` |
| **bookings** | `id`, `pitch_id`, `user_id`, `start_time`, `end_time`, `total_price`, `status` ('pending'\|'approved'\|'rejected'\|'cancel_request'\|'cancelled'\|'completed'), `access_code`, `date_time` (legacy) |

**Extra migrations (app/notifications):**  
`CREATE_DEVICE_TOKENS_TABLE.sql`, `CREATE_NOTIFICATION_TRIGGERS.sql`, `UPDATE_LOBBY_SYSTEM.sql`, `FIX_LOBBY_MEMBERS_UPDATE_POLICY.sql`, `FIX_LOBBY_MEMBERS_STATUS.sql`, `FIX_LOBBY_DELETE_POLICY.sql`, `ADD_OWNER_TOKEN.sql`, `ADD_SPORT_TYPE_TO_PITCHES.sql`, `FIX_WEBSITE_RLS_POLICIES.sql`, plus image/column fixes for complexes and pitches.

**App-only tables (exist only if migrations were run):**  
`reviews`, `friendships`, `messages`, `lobbies`, `lobby_members`, `lobby_messages`, `teams`, `team_members`, `team_messages`, `device_tokens`.

**Storage:** `avatars`, `complex-images`, `pitch-images`.

---

## 5. Edge Functions (`supabase/functions`)

| Function | Role |
|---------|------|
| **update-complex** | Create/update complexes; checks `user_profiles.access_token` (REST), not JWT. |
| **update-pitch** | Create/update pitches; same token check. |
| **send-push-notification** | Sends push via FCM; uses `device_tokens` and `user_profiles`. |

Deploy via Supabase CLI. If you see "Invalid JWT", switch to `access_token`-based validation as in `IMPORTANT_UPDATE_EDGE_FUNCTIONS.md`.

---

## 6. Conventions & Gotchas

- **Pitch `type` vs `sport_type`:** App/website use both. Prefer `sport_type` when present; `type` may be legacy or alias. Unify in one place when editing.
- **Pitch `size`:** DB: `'6 a side'`, `'7 a side'`, `'11 a side'`. UI may show `'5 a side'` in forms – align with DB or migration.
- **Pitch `surface`:** DB: `'Grass'`, `'3G'`, `'4G'`, `'outdoor'`, `'indoor'`. Pitch form may have more (e.g. Artificial, Concrete, Clay) – may need migration.
- **Images:**  
  - **Complex:** `images` (array); ImageKit in website; stored as URLs.  
  - **Pitch:** `image` (single); ImageKit in website.  
  - App uses `ensureArray()` and `getImageUrl`/`getFileUrl` for Supabase Storage and external URLs.
- **dashboard.js and DOM:** `renderBookings` and `renderPitches` output `<tr>`. Parent must be `<table>`/`<tbody>` with correct structure; `#bookingsList`/`#pitchesList` might be `<tbody>` (confirm in each HTML).
- **dashboard.html `#managementSection`:** In the reviewed `dashboard.html` the management block is closed before Complex/Pitches/Bookings content; `complexes.html` and `bookings.html` host that content. Ensure `#managementSection` and tabs exist where `dashboard.js` expects them on each page.
- **deletePitch:** Referenced in `renderPitches`; implementation and RLS must exist before enabling.
- **Ratings / reviews:** No ratings table in base schema. `getReviews` / `submitReview` in dataService imply a `reviews` table (separate migration). Do not add “ratings” charts until that (or equivalent) exists.

---

## 7. Config Checklist for New Edits

- **App:** `services/supabase.ts` (or `VITE_*`), `capacitor.config.ts`, `vite.config.ts`, `package.json`, `netlify.toml` (Netlify build/publish). Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` in Netlify env for production.
- **Website:** `config.js` (ImageKit, `APP_CONFIG.DOWNLOAD_URL`), Supabase URL/key in `dashboard.js` and `login.html`; `index.html` uses `APP_CONFIG` and its own Supabase for stats.
- **Supabase:** RLS, `access_token` and `owner_id` for owner flows; `sport_type` and any new pitch/complex columns.
- **Edge Functions:** `access_token` validation and CORS if called from website.

---

## 8. File Map (High Level)

```
/
├── App.tsx, index.tsx, index.html
├── components/           # Auth, TabBar, Spaces*, Crew, Chat, NotificationCenter, Owner*, UserProfile, etc.
├── services/             # supabase, dataService, bookingService, pushNotificationService, gemini, etc.
├── types.ts
├── capacitor.config.ts, vite.config.ts, package.json, netlify.toml
├── supabase/functions/   # update-complex, update-pitch, send-push-notification
├── website/
│   ├── index.html, login.html, dashboard.html, complexes.html, bookings.html
│   ├── config.js
│   ├── dashboard.js      # Shared by dashboard, complexes, bookings
│   └── assets/, docs/
├── supabase_migration.sql, ADD_OWNER_TOKEN.sql, ADD_SPORT_TYPE_TO_PITCHES.sql, CREATE_DEVICE_TOKENS_TABLE.sql, ...
└── IMPORTANT_UPDATE_EDGE_FUNCTIONS.md
```

---

## 9. Suggested Next Steps for Edits

- Unify pitch `type` / `sport_type` and size/surface with DB and forms.
- Implement or remove `deletePitch` in `dashboard.js` and adjust `renderPitches`/HTML.
- Ensure `#managementSection` and tab content exist on `complexes.html` and `bookings.html` for `dashboard.js` and that `dashboard.html` does not expect management blocks it does not have.
- If adding ratings: create `pitch_ratings`/`complex_ratings` (or reuse `reviews`) and RLS, then add charts.
- Move Supabase URL/key (and if needed ImageKit) to a single config used by `dashboard.js`, `login.html`, and `index.html` to avoid drift.
