# 🧪 PitchPerfect App - Complete Testing Guide

## 📱 App Status

✅ **Backend:** Running on http://127.0.0.1:8090  
✅ **Frontend:** Running on http://localhost:3000  
✅ **Database:** 1 Complex + 1 Pitch ready to test  

---

## 🔐 Step 1: Login to the App

### Option A: Use Test Account
1. Open http://localhost:3000/
2. Enter credentials:
   - **Email:** `test@pitchperfect.com`
   - **Password:** `test123456`
3. Click "Log In"

### Option B: Use Admin Account
- **Email:** `admin@pitchperfect.com`
- **Password:** `admin123`

### Option C: Create New Account
1. Click "Register" tab
2. Enter your email and password
3. Register and login

---

## 🏠 Step 2: Test Discover Page (Complexes)

After login, you should see:

### **What You Should See:**
- Header: "PITCHPERFECT" logo
- Search bar
- Date & Time pickers
- **"Complexes near you"** title
- LIST / MAP toggle buttons
- **Complex Card showing:**
  ```
  📍 Sassi Stadiums
  📍 Distance: X.X km (based on your location)
  📍 Address information
  🎯 "VIEW PITCHES →" button
  ```

### **If You See:**
- ❌ "No complexes found" → Check console (F12) for errors
- ❌ Login page still showing → Try Option B or C above
- ✅ Complex card → SUCCESS! Proceed to Step 3

---

## 🏟️ Step 3: Test Complex Detail Page

1. **Click on the "Sassi Stadiums" complex card**
2. You should be redirected to `/complex/zzle86o0iq5vbil`

### **What You Should See:**
- Large header image
- Complex name: "Sassi Stadiums"
- Address display
- GPS coordinates (Lat/Lng)
- **"Available Pitches (1)"** section
- **Pitch Card showing:**
  ```
  🏟️ Liverpool
  ⚽ Surface: 4G
  👥 Size: 7 a side  
  💰 £120/hr
  ➡️ Arrow to view details
  ```

### **Test:**
- ✅ Can you see the complex header?
- ✅ Is the address displayed?
- ✅ Can you see the "Liverpool" pitch?
- ✅ Does the price show correctly?

---

## ⚽ Step 4: Test Pitch Detail Page

1. **Click on the "Liverpool" pitch card**
2. You should be redirected to `/pitch/uefujuysmyuxzp9`

### **What You Should See:**
- Pitch image
- Pitch name: "Liverpool"
- Complex name: "Sassi Stadiums"
- Surface: 4G
- Size: 7 a side
- Price: £120/hr
- **Date picker**
- **Time slots**
- **Add-ons** (optional)
- **"BOOK NOW"** button

### **Test Booking:**
1. Select a date
2. Choose a time slot
3. (Optional) Select add-ons
4. Click "BOOK NOW"
5. Confirm booking

---

## 🗺️ Step 5: Test Map View

### From Discover Page:
1. Click the **"MAP"** button (top right toggle)

### **What You Should See:**
- Map-style background
- Pin marker for "Sassi Stadiums"
- "EXPLORING NEARBY COMPLEXES" badge
- Back button (top left)

### **Test:**
1. **Click on the map pin** → Should show bottom sheet with:
   - Complex image
   - Complex name
   - Address  
   - "VIEW DETAILS" button
2. **Click "VIEW DETAILS"** → Should go to Complex Detail Page

### **Alternative Map Access:**
1. Click the **center green map button** in bottom navigation
2. Should show same map view

---

## 🧭 Navigation Flow Test

Test the complete user journey:

```
🏠 Discover Page
   ↓ (click complex)
🏟️ Complex Detail Page  
   ↓ (click pitch)
⚽ Pitch Detail Page
   ↓ (click book)
✅ Booking Confirmation

OR

🗺️ Map View
   ↓ (click pin)
📍 Bottom Sheet
   ↓ (view details)
🏟️ Complex Detail Page
   ↓ (etc...)
```

---

## 🐛 Troubleshooting

### Issue: "Can't see complexes on Discover page"

**Check:**
1. Open Browser Console (F12 → Console tab)
2. Look for logs:
   ```
   🏟️ Fetching complexes...
   📊 Complexes received: 1 [...]
   📍 Distance to Sassi Stadiums: X.X km
   ✅ Complexes loaded and sorted: 1
   ```

3. If you see errors, check:
   - Is PocketBase running? → Check http://127.0.0.1:8090/api/health
   - Are you logged in? → Check for user info in console

**Fix:**
```bash
# Restart PocketBase
cd "/Users/wasseflabidi/Documents/ai projects/pitchperfect/pocketbase_0.36.0_darwin_arm64"
./pocketbase serve --http=127.0.0.1:8090
```

---

### Issue: "Maps not loading / not showing"

**The map view is a VISUAL SIMULATION** (not Google Maps integration).

**What to expect:**
- Grid pattern background (dots)
- Pin markers at calculated positions
- Click pins to see details
- Bottom sheet popup

**If you see blank screen:**
1. Check console for JavaScript errors
2. Try clicking different areas
3. Refresh page (Ctrl+R / Cmd+R)

---

### Issue: "Login keeps showing error"

**Try:**
1. Use admin account instead:
   - Email: `admin@pitchperfect.com`
   - Password: `admin123`

2. Create new account via Register tab

3. Check PocketBase admin panel:
   - Go to http://127.0.0.1:8090/_/
   - Login with admin credentials
   - Check "users" collection
   - Verify user exists and is verified

---

## 📊 Current Data in Database

### Complexes:
```
✅ Sassi Stadiums (ID: zzle86o0iq5vbil)
   - Has GPS coordinates
   - Contains 1 pitch
```

### Pitches:
```
✅ Liverpool (ID: uefujuysmyuxzp9)
   - Surface: 4G
   - Size: 7 a side
   - Price: £120/hr
   - Linked to: Sassi Stadiums
```

---

## ✅ Feature Checklist

Test each feature and check off:

### Discover Page:
- [ ] Login works
- [ ] Can see "Sassi Stadiums" complex
- [ ] Distance is calculated and shown
- [ ] Search bar works
- [ ] Date/Time pickers work
- [ ] LIST/MAP toggle visible

### Complex Detail:
- [ ] Clicking complex navigates correctly
- [ ] Complex name shown
- [ ] Address displayed
- [ ] GPS coordinates shown
- [ ] Liverpool pitch visible
- [ ] Pitch shows correct info (4G, 7-a-side, £120)

### Pitch Detail:
- [ ] Clicking pitch navigates correctly
- [ ] All pitch info visible
- [ ] Can select date
- [ ] Can select time
- [ ] Can add add-ons
- [ ] "BOOK NOW" button works

### Map View:
- [ ] Map view loads
- [ ] Pin(s) visible on map
- [ ] Clicking pin shows bottom sheet
- [ ] Bottom sheet shows complex info
- [ ] "VIEW DETAILS" navigates to complex

### Navigation:
- [ ] Bottom nav bar visible
- [ ] Can navigate between pages
- [ ] Back buttons work
- [ ] URL changes correctly

---

## 🆘 Getting Help

If something doesn't work:

1. **Check Console Logs:**
   - Press F12 (Windows/Linux) or Cmd+Option+I (Mac)
   - Go to "Console" tab
   - Look for 🏟️ 📊 📍 ✅ emojis in logs
   - Share any error messages (red text)

2. **Verify Services:**
   ```bash
   # Check PocketBase
   curl http://127.0.0.1:8090/api/health
   
   # Check complexes
   curl http://127.0.0.1:8090/api/collections/complexes_coll/records
   
   # Check pitches  
   curl http://127.0.0.1:8090/api/collections/pitches_coll/records
   ```

3. **Test API Directly:**
   - Go to http://127.0.0.1:8090/_/
   - Login with admin account
   - Browse collections
   - Verify data exists

---

## 🎯 Success Criteria

Your app is working correctly if:

✅ You can login  
✅ You see 1 complex on Discover page  
✅ Complex shows distance from you  
✅ Clicking complex shows Liverpool pitch  
✅ Clicking pitch shows booking page  
✅ Map view shows pin for complex  
✅ Navigation works smoothly  

**If ALL checkmarks pass → App is fully functional!** 🎉

---

## 🔜 Next Steps

Once core features are confirmed working:

1. **Add more test data:**
   - Add 2-3 more complexes via PocketBase admin
   - Add multiple pitches per complex
   - Test with real data

2. **Social Page Development:**
   - Team formation
   - Player profiles
   - Match scheduling

3. **Enhanced Features:**
   - Real map integration (Google Maps API)
   - Photo uploads
   - Reviews & ratings
   - Payment integration

---

**Happy Testing!** 🚀
