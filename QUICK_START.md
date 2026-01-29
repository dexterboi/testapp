# 🚀 Quick Start Guide - Testing the New Features

## ✅ **Fixed Issues:**
- ✅ UserProfile null user error fixed
- ✅ All booking system features ready
- ✅ Owner dashboard ready

---

## 🎯 **3-Step Quick Test:**

### **Step 1: Create/Update Owner User**

**Option A: Use Existing User**
1. Open PocketBase Admin: http://127.0.0.1:8090/_/
2. Login with your admin credentials
3. Go to **Collections** → **users**
4. Click on your existing user (e.g., `test@test.com`)
5. Set the **role** field to: `owner`
6. Click **Save**

**Option B: Create New Owner User**
1. Open PocketBase Admin: http://127.0.0.1:8090/_/
2. Go to **Collections** → **users**
3. Click **New record**
4. Fill in:
   - **email:** `owner@test.com`
   - **password:** `testowner123`
   - **passwordConfirm:** `testowner123`
   - **name:** `Test Owner`
   - **role:** `owner`
   - **verified:** ✅ (check this)
5. Click **Create**

### **Step 2: Make User Own the Complex**

1. Still in PocketBase Admin
2. Go to **Collections** → **complexes_coll**
3. Click on your complex
4. Find the **owner** field
5. Select your owner user from the dropdown
6. Click **Save**

### **Step 3: Login & Test**

1. Open the app: http://localhost:3000
2. If not logged in, click on **Profile** tab → You should see login
3. Login with:
   - Email: `owner@test.com` (or your email)
   - Password: `testowner123` (or your password)
4. Go to **Profile** tab
5. Click **"Owner Dashboard"** button
6. 🎉 You're in!

---

## 🧪 **Complete Testing Flow:**

### **A. Test Booking System (As Player):**

1. **Browse & Book:**
   - Go to **Discover** tab
   - Click on your complex
   - Click on a pitch
   - Select a date
   - You'll see **75-minute time slots** with prices
   - Click on an available slot
   - Click **Confirm Booking**
   - Click **Pay** (simulated)
   - You'll see "PENDING APPROVAL" message

2. **Verify Booking:**
   - Booking is created with status: `pending`
   - You can check in PocketBase Admin → **bookings_coll**

### **B. Test Owner Dashboard:**

1. **View Dashboard:**
   - Go to **Profile** → **Owner Dashboard**
   - See statistics:
     - Bookings this month
     - Revenue
     - Pending approvals count
   - See your pending booking in the list

2. **Approve Booking:**
   - Click **Approve** button on the pending booking
   - Status changes to `approved`
   - Statistics update automatically

3. **View All Bookings:**
   - Click **View Bookings** button
   - Filter by: All, Pending, Approved, Rejected
   - See detailed booking information

4. **Configure Pitch:**
   - Click **Pitch Settings** button
   - Click **Configure** on any pitch
   - Update settings:
     - **Opening Hour:** Try 9 (9 AM)
     - **Closing Hour:** Try 22 (10 PM)
     - **Match Duration:** Keep 75 mins
     - **Price Per Hour:** Try 150 (£150/hour)
     - **Status:** Keep as Active
   - Click **Save Changes**

5. **Test Updated Settings:**
   - Logout (or open in incognito)
   - Go to the pitch you just configured
   - Verify time slots now show 9 AM - 10 PM
   - Verify price is updated to £187.50 (75 mins × £150/hour)

6. **Test Pitch Status:**
   - Go back to Owner Dashboard
   - Set a pitch to "Under Maintenance"
   - Try booking that pitch as a player
   - You should see "No slots available"

---

## 🎨 **What to Look For:**

### **Player View:**
- ✅ Dynamic time slots (not hardcoded)
- ✅ 75-minute duration
- ✅ Grayed-out unavailable slots
- ✅ Price calculated from pitch settings
- ✅ "PENDING APPROVAL" after booking
- ✅ Slot shows start and end time

### **Owner Dashboard:**
- ✅ Real-time statistics
- ✅ Pending bookings list
- ✅ Approve/Reject buttons work
- ✅ Booking filters work
- ✅ Pitch configuration modal
- ✅ Settings save correctly
- ✅ All data updates without refresh

---

## 🐛 **Common Issues & Solutions:**

### **Issue: "No slots available"**
**Solution:**
- Check if pitch status is "active" (not maintenance/closed)
- Verify opening/closing hours are set
- Make sure you selected a future date

### **Issue: Can't see Owner Dashboard button**
**Solution:**
- Verify user role is "owner" in PocketBase
- Check if user owns the complex (owner field)
- Try logging out and back in

### **Issue: Bookings not showing**
**Solution:**
- Verify user owns the complex
- Check PocketBase API rules allow reading bookings
- Check browser console for errors

### **Issue: Profile shows "Not Logged In"**
**Solution:**
- Click on Profile tab and login
- Use credentials: `owner@test.com` / `testowner123`
- Or use your existing user credentials

---

## 📊 **Expected Behavior:**

### **Time Slot Calculation:**
```
Opening Hour: 9 AM
Closing Hour: 10 PM (22:00)
Match Duration: 75 minutes

Expected Slots:
09:00 - 10:15
10:15 - 11:30
11:30 - 12:45
12:45 - 14:00
... and so on until
20:45 - 22:00 (last slot that fits)
```

### **Pricing Calculation:**
```
Price Per Hour: £120
Match Duration: 75 minutes = 1.25 hours
Slot Price: £120 × 1.25 = £150
```

### **Booking Status Flow:**
```
1. User books → Status: "pending"
2. Owner approves → Status: "approved"
3. Time passes → Status: "completed" (manual for now)
OR
2. Owner rejects → Status: "rejected"
```

---

## 🎯 **Success Criteria:**

You've successfully tested everything if:
- [x] You can login as owner
- [x] Owner Dashboard shows statistics
- [x] You can configure pitch settings
- [x] Time slots reflect your configuration
- [x] You can book a pitch as player
- [x] Booking shows as "pending"
- [x] You can approve booking as owner
- [x] Slot becomes unavailable after booking
- [x] Setting pitch to "maintenance" hides slots
- [x] Booking filters work
- [x] Statistics update in real-time

---

## 🚀 **You're Ready!**

Just follow the 3 steps above and start testing. Everything should work smoothly! 🎉

**Need help?** Check the detailed guides:
- **OWNER_DASHBOARD_GUIDE.md** - Complete feature documentation
- **BOOKING_SYSTEM.md** - Technical details
- **TESTING_GUIDE.md** - General testing guide
