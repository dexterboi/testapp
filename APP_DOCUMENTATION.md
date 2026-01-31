# PitchPerfect - App Documentation

## 📱 App Overview

**PitchPerfect** is a mobile-first football pitch booking application that connects players with football complexes. The app allows users to discover nearby football pitches, view detailed information, book time slots, and manage their bookings. Complex owners have a dedicated dashboard to manage their facilities, bookings, and settings.

---

## ✨ Key Features

### 🎯 User Features

#### 1. **Discover Page**
- Browse nearby football complexes sorted by distance
- Search complexes by name or location
- View complex details (images, description, facilities, contact info)
- See available pitches at each complex
- Filter by date and time preferences
- Real-time distance calculation using GPS

#### 2. **Map View**
- Interactive map showing all complexes
- Custom markers for each complex location
- Click markers to view complex details
- Built with Leaflet.js (OpenStreetMap)

#### 3. **Complex Detail Page**
- Hero image gallery with full-screen viewer
- Complex information (description, contact, facilities)
- List of all available pitches
- Navigate to individual pitch pages
- Image gallery with clickable images

#### 4. **Pitch Detail Page**
- Pitch information (surface, size, price)
- Image viewer for pitch photos
- Custom date picker for booking
- Available time slots (75-minute matches)
- 15-minute buffer between bookings
- Real-time availability checking
- Booking confirmation with cash payment flow
- Phone number validation before booking

#### 5. **Booking Management**
- View all user bookings
- Filter by status (Upcoming, Past, Cancelled)
- Request cancellation (requires owner approval)
- View booking details (date, time, price, access code)
- See complex and pitch information

#### 6. **User Profile**
- View and edit profile information
- Add/edit phone number (required for bookings)
- View statistics (games played, wins, losses)
- Access owner dashboard (if owner role)
- Logout functionality

#### 7. **Authentication**
- Email/password registration
- Email/password login
- Role-based access (player/owner)
- Session management
- Secure authentication flow

### 🏢 Owner Features

#### 1. **Owner Dashboard**
- Statistics overview (total bookings, revenue, monthly stats)
- Quick action buttons
- Pending bookings list with user details
- Booking status counts (pending, approved, cancelled, etc.)
- Complex selection dropdown

#### 2. **Booking Management**
- View all bookings for complex
- Filter by status (pending, approved, rejected, cancel_request, cancelled)
- Approve/reject booking requests
- Approve/reject cancellation requests
- Cancel bookings directly
- View user name and phone number
- Calendar view of bookings

#### 3. **Pitch Settings**
- Configure multiple pitches
- Set operating hours (opening/closing)
- Set match duration (default: 75 minutes)
- Set price per hour
- Set pitch status (active, maintenance, closed)
- Upload pitch images

#### 4. **Complex Settings**
- Edit complex description
- Add contact information (phone, email)
- Select facilities/amenities
- Upload complex images (up to 10)
- Save settings with validation

#### 5. **Image Management**
- Upload multiple images for complexes
- Upload images for pitches
- Drag-and-drop support
- Image preview and removal
- Full-screen image viewer

---

## 🛠️ Tech Stack & Frameworks

### Frontend

#### **React 19.2.3**
- Modern React with hooks
- Component-based architecture
- State management with `useState` and `useEffect`
- Functional components

#### **TypeScript 5.8.2**
- Type-safe development
- Better IDE support
- Reduced runtime errors
- Interface definitions for data structures

#### **Vite 6.2.0**
- Fast build tool and dev server
- Hot Module Replacement (HMR)
- Optimized production builds
- Modern ES modules

#### **React Router DOM 7.12.0**
- Client-side routing
- Hash routing for mobile compatibility
- Navigation between pages
- Route parameters and state management

#### **Tailwind CSS (CDN)**
- Utility-first CSS framework
- Responsive design
- Custom color scheme (brand colors)
- Mobile-first approach

#### **Lucide React 0.562.0**
- Modern icon library
- Consistent icon design
- Lightweight and tree-shakeable
- Used throughout the app

#### **Leaflet.js 1.7.1**
- Open-source mapping library
- Interactive maps
- Custom markers
- Mobile-friendly touch controls

### Backend

SupaBase

### Additional Libraries

#### **@google/genai 1.37.0**
- Google Gemini AI integration
- AI-powered search
- Chat functionality
- Price analysis (if implemented)

---

## 🏗️ Architecture

### Project Structure

```
pitchperfect/
├── components/          # Reusable React components
│   ├── Auth.tsx         # Authentication component
│   ├── UserProfile.tsx  # User profile page
│   ├── OwnerDashboard.tsx # Owner dashboard
│   ├── ImageUpload.tsx  # Image upload component
│   ├── ImageViewer.tsx  # Full-screen image viewer
│   └── ConfirmationModal.tsx # Modal components
├── services/            # API and business logic
│   ├── supabase.ts     # Supabase client
│   ├── dataService.ts  # Data fetching functions
│   ├── bookingService.ts # Booking logic
│   └── geminiService.ts # AI services
├── App.tsx             # Main app component with routing
├── index.tsx           # App entry point
├── types.ts            # TypeScript type definitions
├── constants.ts        # App constants
└── vite.config.ts     # Vite configuration
```

### Data Flow

```
User Action
    ↓
React Component
    ↓
Service Layer (dataService.ts, bookingService.ts)
    ↓
Supabase Client (supabase.ts)
    ↓
Supabase Backend (PostgreSQL Database)
```

### Component Hierarchy

```
App
├── TabBar (Navigation)
├── Routes
│   ├── HomePage (Discover)
│   ├── MapPage
│   ├── ComplexDetailPage
│   ├── PitchDetailsPage
│   ├── UserBookingsPage
│   ├── UserProfile
│   ├── OwnerDashboard
│   ├── OwnerBookingsPage
│   └── OwnerPitchesPage
└── Modals (ConfirmationModal, SuccessModal, ImageViewer)
```

---

## 🗄️ Database Schema

### Collections (Tables)

#### 1. **users** (`_pb_users_auth_`)
PocketBase's built-in users collection with custom fields:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Text | Unique identifier |
| `email` | Email | User email (unique) |
| `password` | Text | Hashed password |
| `name` | Text | User's full name |
| `role` | Select | `player` or `owner` |
| `phone` | Text | Phone number (required for bookings) |
| `avatar` | File | Profile picture |
| `loyaltyPoints` | Number | User loyalty points |
| `wins` | Number | Games won |
| `losses` | Number | Games lost |
| `gamesPlayed` | Number | Total games played |

#### 2. **complexes_coll**
Football complexes/facilities:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Text | Unique identifier |
| `Name` | Text | Complex name |
| `Address` | Text | Complex address |
| `location_lat` | Number | Latitude |
| `location_lng` | Number | Longitude |
| `owner` | Relation | Reference to `users` (owner) |
| `description` | Text | Complex description (max 500 chars) |
| `phone` | Text | Contact phone |
| `email` | Email | Contact email |
| `facilities` | JSON | Array of facility names |
| `images` | File | Array of images (up to 10) |

#### 3. **pitches_coll**
Individual football pitches:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Text | Unique identifier |
| `complex` | Relation | Reference to `complexes_coll` |
| `name` | Text | Pitch name |
| `surface` | Select | Surface type (e.g., "Grass", "Artificial") |
| `size` | Text | Pitch size (e.g., "5v5", "7v7", "11v11") |
| `pricePerHour` | Number | Price per hour |
| `image` | File | Pitch image |
| `opening_hour` | Number | Opening hour (0-23) |
| `closing_hour` | Number | Closing hour (0-23) |
| `match_duration` | Number | Match duration in minutes (default: 75) |
| `status` | Select | `active`, `maintenance`, `closed` |

#### 4. **bookings_coll**
Booking records:

| Field | Type | Description |
|-------|------|-------------|
| `id` | Text | Unique identifier |
| `pitch` | Relation | Reference to `pitches_coll` |
| `user` | Relation | Reference to `users` |
| `start_time` | Date | Booking start time |
| `end_time` | Date | Booking end time |
| `total_price` | Number | Total booking price |
| `status` | Select | `pending`, `approved`, `rejected`, `cancel_request`, `cancelled`, `completed` |
| `accessCode` | Text | Unique access code for approved bookings |
| `date_time` | Date | Legacy field (deprecated) |

---

## 🔑 Key Features Implementation

### 1. **Time Slot System**

- **Match Duration:** 75 minutes (1 hour 15 minutes)
- **Buffer Time:** 15 minutes between bookings
- **Slot Generation:** Automatically generates available slots based on:
  - Opening/closing hours
  - Match duration
  - Existing bookings
  - 15-minute buffer requirement

**Example:**
- Booking 1: 9:00 AM - 10:15 AM
- Buffer: 10:15 AM - 10:30 AM
- Booking 2: 10:30 AM - 11:45 AM

### 2. **Booking Workflow**

1. **User selects pitch and date**
2. **System generates available time slots**
3. **User selects time slot**
4. **System validates phone number**
5. **User confirms booking**
6. **Booking created with `pending` status**
7. **Owner receives notification**
8. **Owner approves/rejects**
9. **If approved:**
   - Status changes to `approved`
   - Access code generated
   - User can view booking
10. **After match:**
    - Booking auto-deleted (keeps app fresh)
    - Revenue data preserved

### 3. **Cancellation Workflow**

1. **User requests cancellation:**
   - Status changes to `cancel_request`
2. **Owner reviews request:**
   - Can approve → Status: `cancelled`
   - Can reject → Status: `approved` (restored)
3. **Owner can also cancel directly:**
   - Any approved/pending booking
   - Status: `cancelled`

### 4. **Image Management**

- **Complex Images:**
  - Up to 10 images
  - First image used as hero
  - Gallery view for additional images
  - Full-screen viewer with navigation

- **Pitch Images:**
  - Single image per pitch
  - Full-screen viewer
  - Upload via owner dashboard

### 5. **Distance Calculation**

- Uses Haversine formula
- Calculates distance between user location and complexes
- Sorts complexes by distance
- Displays distance in kilometers

---

## 🎨 UI/UX Features

### Design Principles

- **Mobile-First:** Designed for mobile devices
- **Native Feel:** Custom modals instead of browser alerts
- **Consistent Design:** Unified color scheme and typography
- **Smooth Animations:** Transitions and hover effects
- **Touch-Friendly:** Large tap targets, swipe gestures

### Color Scheme

- **Primary Brand:** Emerald Green (`#10b981`)
- **Background:** Light Gray (`#f9fafb`)
- **Text:** Dark Gray (`#0f172a`)
- **Accents:** Various status colors (green, yellow, red, orange)

### Components

#### **Modals**
- `ConfirmationModal`: For confirmations (booking, cancellation)
- `SuccessModal`: For success messages
- `ImageViewer`: Full-screen image viewing

#### **Forms**
- Custom date picker
- Time slot selection
- Phone number input with validation
- Image upload with drag-and-drop

---

## 🔐 Security & Permissions

### API Access Rules

- **Public Read:** Complexes and pitches (anyone can view)
- **Authenticated Write:** Bookings (only logged-in users)
- **Owner Access:** Complex settings (only complex owner)
- **Admin Access:** Full access via Supabase dashboard

### Authentication

- Email/password authentication
- Session management via Supabase Auth
- Role-based access control
- Secure password hashing (handled by Supabase Auth)

### Data Validation

- Phone number required for bookings
- Date/time validation
- Price calculation validation
- Image file type/size validation

---

## 📱 Mobile App Features

### APK-Ready

- Hash routing (works offline)
- No browser dependencies
- Custom modals (no browser alerts)
- Touch-optimized UI
- Responsive design

### Build for Android

The app can be converted to Android APK using:
- **Capacitor** (recommended)
- **React Native** (alternative)
- **PWA** (Progressive Web App)

---

## 🚀 Performance Optimizations

1. **Lazy Loading:** Images loaded on demand
2. **Caching:** Supabase handles caching via PostgREST
3. **Optimized Queries:** Only fetch needed data
4. **Image Optimization:** Thumbnails for galleries
5. **Code Splitting:** Vite handles automatic code splitting

---

## 📊 Statistics & Analytics

### Owner Dashboard Stats

- **Total Bookings:** All active bookings
- **Pending:** Bookings awaiting approval
- **Approved:** Confirmed bookings
- **Cancel Requests:** User cancellation requests
- **Rejected:** Rejected bookings
- **Total Revenue:** Sum of approved booking prices
- **Monthly Stats:** Current month bookings and revenue

---

## 🔄 Data Flow Examples

### Booking Creation Flow

```
User clicks "Book Now"
    ↓
Check phone number exists
    ↓
Validate slot availability
    ↓
Check 15-minute buffer
    ↓
Create booking (status: pending)
    ↓
Generate access code
    ↓
Show success modal
    ↓
Refresh booking list
```

### Owner Approval Flow

```
Owner views pending bookings
    ↓
Clicks "Approve"
    ↓
Update booking status to "approved"
    ↓
Access code already generated
    ↓
Refresh dashboard
    ↓
Update statistics
```

---

## 🛠️ Development Tools

### Build Tools

- **Vite:** Fast build tool
- **TypeScript:** Type checking
- **ESLint:** Code linting (if configured)

### Development Server

```bash
npm run dev
# Starts dev server on http://localhost:3000
```

### Production Build

```bash
npm run build
# Creates optimized build in /dist
```

---

## 📦 Dependencies Summary

### Production Dependencies

- `react` & `react-dom`: UI framework
- `react-router-dom`: Routing
- `@supabase/supabase-js`: Backend client
- `lucide-react`: Icons
- `@google/genai`: AI features (optional)

### Development Dependencies

- `vite`: Build tool
- `typescript`: Type checking
- `@vitejs/plugin-react`: React plugin for Vite

---

## 🌐 API Endpoints (Supabase)

All API calls go through Supabase PostgREST API:

### Collections

- `GET /api/collections/complexes_coll/records` - List complexes
- `GET /api/collections/complexes_coll/records/:id` - Get complex
- `GET /api/collections/pitches_coll/records` - List pitches
- `GET /api/collections/pitches_coll/records/:id` - Get pitch
- `GET /api/collections/bookings_coll/records` - List bookings
- `POST /api/collections/bookings_coll/records` - Create booking
- `PATCH /api/collections/bookings_coll/records/:id` - Update booking

### Authentication

- `POST /api/collections/users/auth-with-password` - Login
- `POST /api/collections/users` - Register

### Files

- `GET /api/files/:collection/:recordId/:filename` - Get file

---

## 🔮 Future Enhancements

Potential features to add:

1. **Payment Integration:** Online payment processing
2. **Push Notifications:** Booking confirmations, reminders
3. **Reviews & Ratings:** User reviews for complexes/pitches
4. **Social Features:** Team creation, match invitations
5. **Loyalty Program:** Points system (already in schema)
6. **Analytics Dashboard:** More detailed statistics
7. **Multi-language Support:** Internationalization
8. **Dark Mode:** Theme switching
9. **Offline Support:** Service workers for offline access
10. **Real-time Updates:** WebSocket for live booking updates

---

## 📝 Code Conventions

### Naming

- **Components:** PascalCase (`UserProfile.tsx`)
- **Functions:** camelCase (`getComplexes()`)
- **Constants:** UPPER_SNAKE_CASE (`BUFFER_TIME_MINS`)
- **Files:** Match component/function name

### File Organization

- Components in `/components`
- Services in `/services`
- Types in `/types.ts`
- Constants in `/constants.ts`

### Code Style

- Use TypeScript for type safety
- Functional components with hooks
- Async/await for API calls
- Error handling with try/catch
- Console logging for debugging

---

## 🐛 Known Limitations

1. **SQLite Database:** Limited scalability (but fine for small-medium apps)
2. **No Real-time:** Bookings don't update in real-time (refresh needed)
3. **Single Image per Pitch:** Only one image per pitch (can be extended)
4. **No Payment:** Cash payment only (no online payment)
5. **No Push Notifications:** Manual refresh required

---

## 📚 Additional Documentation

- `DEPLOYMENT_GUIDE.md` - How to deploy to production
- `FREE_HOSTING_GUIDE.md` - Free hosting options
- `BOOKING_SYSTEM.md` - Booking system details
- `OWNER_DASHBOARD_GUIDE.md` - Owner dashboard guide
- `TESTING_GUIDE.md` - Testing instructions
- `QUICK_START.md` - Quick setup guide

---

## 🎯 Summary

**Larena** is a modern, mobile-first football pitch booking application built with React, TypeScript, and Supabase. It provides a seamless experience for both players and complex owners, with features like real-time availability, booking management, image galleries, and a comprehensive owner dashboard.

The app is designed to be converted to a native Android APK and can be hosted for free using various cloud providers. The codebase is well-structured, type-safe, and ready for production deployment.

---

**Version:** 1.0.0  
**Last Updated:** 2025  
**Framework:** React 19 + TypeScript + Supabase  
**License:** (Specify your license)
