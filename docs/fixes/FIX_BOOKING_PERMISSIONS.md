# Fix Booking Permissions

## Allow Users to Create Bookings

1. **Open PocketBase Admin:** http://127.0.0.1:8090/_/

2. **Go to Collections → bookings_coll**

3. **Click the gear icon (⚙️)** to edit

4. **Find "API rules" section**

5. **Update the "Create rule" to:**

```
@request.auth.id != ""
```

This allows any authenticated user to create bookings.

6. **Click Save**

---

## Done!

Users can now create bookings without superuser access.
