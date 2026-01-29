# 🎯 PitchPerfect Booking System - Implementation Guide

## ✅ **What's Been Built So Far**

### 1. **Time-Based Booking System** ✅
- **75-minute match slots** configured per pitch
- Automatic time slot generation based on operating hours
- Conflict detection to prevent double bookings
- Price calculation per time slot

### 2. **Database Schema Updates** ✅

#### **Pitches Collection** (`pitches_coll`)
New fields added:
- `opening_hour` (0-23) - When pitch opens
- `closing_hour` (0-23) - When pitch closes  
- `status` - "active", "maintenance", or "closed"
- `match_duration` (30-180 mins) - Duration of each match slot

#### **Bookings Collection** (`bookings_coll`)
New fields added:
- `start_time` - Booking start date/time
- `end_time` - Booking end date/time
- `total_price` - Total cost for the booking
- `status` - "pending", "approved", "rejected", "cancelled", "completed"

### 3. **Booking Service** (`services/bookingService.ts`) ✅

Complete booking management system with:

#### **Time Slot Functions:**
```typescript
// Generate available time slots for a date
generateTimeSlots(date, openingHour, closingHour, matchDuration, pricePerHour)

// Check if a slot conflicts with existing bookings
checkSlotConflict(slotStart, slotEnd, existingBookings)

// Get all available slots for a pitch on a date
getAvailableSlots(pitchId, date)
```

#### **Booking Functions:**
```typescript
// Create a new booking request (pending approval)
createBookingRequest({ pitch, user, start_time, end_time, total_price })

// Get all bookings for a complex
getComplexBookings(complexId, status?)

// Approve/reject a booking
updateBookingStatus(bookingId, status)
```

#### **Owner Management Functions:**
```typescript
// Update pitch operating hours and settings
updatePitchSettings(pitchId, {
  opening_hour,
  closing_hour,
  match_duration,
  pricePerHour,
  status
})

// Get statistics for owner dashboard
getComplexStatistics(complexId)
```

---

## 🚧 **What Still Needs to Be Built**

### 1. **Owner Dashboard UI** (Next Step)

The owner dashboard should include:

#### **📊 Dashboard Home**
- Total bookings (today, this week, this month)
- Revenue statistics
- Pending approval count
- Quick stats cards

#### **📅 Booking Calendar**
- Monthly/weekly view of all bookings
- Color-coded by status (pending, approved, rejected)
- Click to view booking details
- Filter by pitch

#### **✅ Approval Workflow**
- List of pending booking requests
- View booking details
- Approve/Reject buttons
- Automatic conflict checking

#### **⚙️ Pitch Configuration**
For each pitch:
- Set operating hours (opening/closing times)
- Set match duration (default 75 mins)
- Set price per hour
- Set status (active/maintenance/closed)
- View booking history

#### **📈 Statistics & Analytics**
- Total revenue (today, week, month, year)
- Booking trends graph
- Most popular pitches
- Peak booking times
- Customer analytics

---

## 📝 **How the Booking Flow Works**

### **For Players:**
1. Browse complexes → Select complex → View pitches
2. Click on a pitch to see available time slots
3. Select date → See 75-min slots (only free ones shown)
4. Choose a slot → Confirm booking
5. Booking created with status: **"pending"**
6. Wait for owner approval
7. Once approved → Receive access code

### **For Owners:**
1. Login to owner dashboard
2. See all pending booking requests
3. View booking details:
   - Player name
   - Pitch
   - Date & time
   - Price
4. Check for conflicts (auto-checked)
5. **Approve** or **Reject**
6. Player gets notified

### **Conflict Prevention:**
- System checks availability before showing slots
- Double-checks when booking is created
- Locks the slot when booking is pending/approved
- 75-min slots never overlap

---

## 🔧 **Implementation Example**

### **Using the Booking Service:**

```typescript
import { 
  getAvailableSlots, 
  createBookingRequest,
  updateBookingStatus 
} from './services/bookingService';

// 1. Get available slots for a pitch
const slots = await getAvailableSlots('pitch_id_here', new Date('2026-01-20'));

console.log(slots);
// Output:
// [
//   { start: 2026-01-20T08:00, end: 2026-01-20T09:15, available: true, price: 150 },
//   { start: 2026-01-20T09:15, end: 2026-01-20T10:30, available: false, price: 150 },
//   { start: 2026-01-20T10:30, end: 2026-01-20T11:45, available: true, price: 150 },
//   ... more slots ...
// ]

// 2. Create a booking
const booking = await createBookingRequest({
  pitch: 'pitch_id',
  user: 'user_id',
  start_time: new Date('2026-01-20T08:00'),
  end_time: new Date('2026-01-20T09:15'),
  total_price: 150
});

// 3. Owner approves the booking
await updateBookingStatus(booking.id, 'approved');
```

---

## 🎨 **Owner Dashboard Routes to Add**

```typescript
// Add these routes to App.tsx:

<Route path="/owner" element={<OwnerDashboard />} />
<Route path="/owner/bookings" element={<OwnerBookings />} />
<Route path="/owner/calendar" element={<OwnerCalendar />} />
<Route path="/owner/pitches" element={<OwnerPitches />} />
<Route path="/owner/pitches/:id/settings" element={<PitchSettings />} />
<Route path="/owner/statistics" element={<OwnerStatistics />} />
```

---

## 📊 **Owner Dashboard Components Needed**

### 1. **Stats Cards**
```typescript
const StatsCard = ({ title, value, icon, trend }) => (
  <div className="bg-white p-6 rounded-lg shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{title}</p>
        <h3 className="text-3xl font-bold mt-2">{value}</h3>
        {trend && <p className="text-green-500 text-xs mt-1">↑ {trend}%</p>}
      </div>
      <div className="text-brand">{icon}</div>
    </div>
  </div>
);
```

### 2. **Booking Request Card**
```typescript
const BookingRequest = ({ booking, onApprove, onReject }) => (
  <div className="bg-white p-4 rounded-lg shadow mb-4">
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-bold">{booking.expand.pitch.name}</h4>
        <p className="text-sm text-gray-500">
          {new Date(booking.start_time).toLocaleString()}
        </p>
        <p className="text-sm">Player: {booking.expand.user.name}</p>
        <p className="text-lg font-bold text-brand mt-2">
          £{booking.total_price}
        </p>
      </div>
      <div className="flex gap-2">
        <button onClick={() => onApprove(booking.id)} 
                className="bg-green-500 text-white px-4 py-2 rounded">
          Approve
        </button>
        <button onClick={() => onReject(booking.id)}
                className="bg-red-500 text-white px-4 py-2 rounded">
          Reject
        </button>
      </div>
    </div>
  </div>
);
```

### 3. **Pitch Settings Form**
```typescript
const PitchSettingsForm = ({ pitch, onSave }) => {
  const [settings, setSettings] = useState({
    opening_hour: pitch.opening_hour || 8,
    closing_hour: pitch.closing_hour || 23,
    match_duration: pitch.match_duration || 75,
    pricePerHour: pitch.pricePerHour || 120,
    status: pitch.status || 'active'
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(settings); }}>
      <label>Opening Hour: 
        <input type="number" min="0" max="23" 
               value={settings.opening_hour}
               onChange={(e) => setSettings({...settings, opening_hour: +e.target.value})} />
      </label>
      
      <label>Closing Hour:
        <input type="number" min="0" max="23"
               value={settings.closing_hour}
               onChange={(e) => setSettings({...settings, closing_hour: +e.target.value})} />
      </label>
      
      <label>Match Duration (minutes):
        <input type="number" min="30" max="180"
               value={settings.match_duration}
               onChange={(e) => setSettings({...settings, match_duration: +e.target.value})} />
      </label>
      
      <label>Price Per Hour:
        <input type="number" min="0"
               value={settings.pricePerHour}
               onChange={(e) => setSettings({...settings, pricePerHour: +e.target.value})} />
      </label>
      
      <label>Status:
        <select value={settings.status}
                onChange={(e) => setSettings({...settings, status: e.target.value})}>
          <option value="active">Active</option>
          <option value="maintenance">Under Maintenance</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      
      <button type="submit">Save Settings</button>
    </form>
  );
};
```

---

## 🔐 **Access Control**

### **Who Can Access Owner Dashboard?**
- Users with `role = "owner"` in the database
- Check the `owner` field in `complexes_coll` to verify ownership

### **Permission Check:**
```typescript
const canAccessOwnerDashboard = (user, complexId) => {
  // Check if user owns this complex
  return complex.owner === user.id;
};
```

---

## 📌 **Next Steps**

1. ✅ **Time slot system** - DONE
2. ✅ **Booking conflict detection** - DONE  
3. ✅ **Database schema** - DONE
4. ⏳ **Owner Dashboard UI** - IN PROGRESS
5. ⏳ **Booking approval workflow** - READY TO BUILD
6. ⏳ **Pitch settings page** - READY TO BUILD
7. ⏳ **Calendar view** - READY TO BUILD
8. ⏳ **Statistics dashboard** - READY TO BUILD

---

## 🚀 **Ready to Build the Owner Dashboard!**

All the backend logic is ready. We just need to:
1. Create the UI components
2. Add the routes
3. Connect to the booking service
4. Test the full flow

**Should I proceed with building the Owner Dashboard UI?** 🎯
