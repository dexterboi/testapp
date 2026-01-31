# 🏆 Owner Dashboard - Complete Guide

## ✅ **Everything Is Ready!**

I've built a complete booking system with an owner dashboard. Here's what's done:

### 🎯 **Features Completed:**

#### **1. Time-Based Booking System** ✅
- 75-minute match slots
- Dynamic slot generation based on pitch hours
- Real-time availability checking
- Conflict prevention (no double bookings)
- Booking requires owner approval

#### **2. Owner Dashboard** ✅
- **Statistics Overview:**
  - Total bookings this month
  - Monthly revenue
  - Pending approvals count
  - Total bookings all-time

- **Booking Management:**
  - View all bookings (filter by status)
  - Approve/reject pending bookings
  - See booking details (player, time, price)

- **Pitch Configuration:**
  - Set operating hours (opening/closing)
  - Configure match duration
  - Set price per hour
  - Manage pitch status (active/maintenance/closed)

---

## 🧪 **How to Test:**

### **Step 1: Update Your User to Owner Role**

You need to set your user's role to "owner" in PocketBase:

1. Open PocketBase Admin: http://127.0.0.1:8090/_/
2. Login with your admin credentials
3. Go to **Collections** → **users**
4. Find your user account
5. Click **Edit**
6. Find the **role** field
7. Change it to: `owner`
8. Click **Save**

### **Step 2: Access Owner Dashboard**

1. Open the app: http://localhost:3000
2. Go to **Profile** tab (bottom right)
3. You should now see **"Owner Dashboard"** button (with building icon)
4. Click it to access the dashboard

---

## 📱 **What You'll See:**

### **Owner Dashboard Home**
- Stats cards showing:
  - Bookings this month
  - Revenue this month
  - Pending approvals
  - Total bookings
- Quick action buttons:
  - View Bookings
  - Pitch Settings
- Recent pending bookings list with Approve/Reject buttons

### **Bookings Page** (`/owner/bookings/:complexId`)
- Filter by: All, Pending, Approved, Rejected
- Each booking shows:
  - Pitch name
  - Player name
  - Date & time (with 75-min duration)
  - Price
  - Status badge
  - Approve/Reject buttons (if pending)

### **Pitch Settings Page** (`/owner/pitches/:complexId`)
- List of all pitches in your complex
- For each pitch, you can configure:
  - **Opening Hour** (0-23)
  - **Closing Hour** (0-23)
  - **Match Duration** (30-180 mins, default 75)
  - **Price Per Hour** (£)
  - **Status** (Active, Under Maintenance, Closed)

---

## 🎮 **Player Booking Flow (For Testing):**

### **As a Player:**

1. Go to **Discover** tab
2. Select a complex
3. Click on a pitch
4. Select a **date**
5. You'll see **75-minute time slots**
   - Available slots are clickable
   - Booked slots are grayed out
   - Each slot shows the price
6. Select a slot → Click **Confirm Booking**
7. Booking is created with status: **"PENDING APPROVAL"**

### **As an Owner:**

1. Go to **Profile** → **Owner Dashboard**
2. See the new booking in **"Pending Approvals"**
3. Click **Approve** or **Reject**
4. Booking status updates instantly

---

## ⚙️ **Default Pitch Settings:**

If a pitch doesn't have settings configured, these defaults are used:
- Opening Hour: **8:00** (8 AM)
- Closing Hour: **23:00** (11 PM)
- Match Duration: **75 minutes**
- Price: Uses `pricePerHour` from pitch data
- Status: **active**

To see custom slots, configure your pitch settings first!

---

## 🔍 **Testing Checklist:**

- [ ] Set user role to "owner" in PocketBase
- [ ] Access Owner Dashboard from Profile
- [ ] View statistics on dashboard
- [ ] Configure pitch settings (hours, price, duration)
- [ ] Book a pitch as a player (see 75-min slots)
- [ ] Approve/reject the booking as an owner
- [ ] Verify booking shows as approved
- [ ] Try booking the same slot (should be unavailable)
- [ ] Set pitch to "maintenance" and verify no slots appear
- [ ] Filter bookings by status

---

## 🛠️ **Technical Details:**

### **New Database Fields:**

**Pitches Collection (`pitches_coll`):**
- `opening_hour` (number)
- `closing_hour` (number)
- `match_duration` (number)
- `status` (select: active/maintenance/closed)

**Bookings Collection (`bookings_coll`):**
- `start_time` (datetime)
- `end_time` (datetime)
- `total_price` (number)
- `status` (select: pending/approved/rejected/cancelled/completed)

### **API Functions Available:**

```typescript
// Get available time slots
getAvailableSlots(pitchId, date)

// Create booking request
createBookingRequest({ pitch, user, start_time, end_time, total_price })

// Get all bookings for a complex
getComplexBookings(complexId, status?)

// Approve/reject booking
updateBookingStatus(bookingId, 'approved' | 'rejected')

// Update pitch settings
updatePitchSettings(pitchId, { opening_hour, closing_hour, ... })

// Get statistics
getComplexStatistics(complexId)
```

---

## 🎯 **Next Steps (Optional Enhancements):**

1. **Calendar View:** Add a visual calendar for bookings
2. **Email Notifications:** Notify players when bookings are approved
3. **Revenue Reports:** More detailed analytics and charts
4. **Bulk Actions:** Approve/reject multiple bookings at once
5. **Booking History:** Show completed bookings for players
6. **Access Codes:** Display QR codes for approved bookings

---

## 🐛 **Troubleshooting:**

**"No slots available":**
- Check if pitch status is "active"
- Verify opening/closing hours are set
- Make sure the date is not in the past

**Can't see Owner Dashboard:**
- Verify user role is set to "owner" in PocketBase
- Check if user owns any complexes (owner field in complexes_coll)
- Try refreshing the page

**Bookings not showing:**
- Check PocketBase API rules allow reading bookings
- Verify complex ownership is correct
- Check browser console for errors

---

## 🚀 **You're All Set!**

Everything is built and ready to use. Just set your user role to "owner" and start testing! 🎉
