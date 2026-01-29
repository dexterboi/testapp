# Sport Types – Setup

Sport types let owners define **match duration** and **buffer** per sport (e.g. Football 90min, Padel 60min). Each pitch can use a sport type; slot generation then uses that sport’s duration and buffer, so different sports get different slot grids.

---

## 0. Prerequisites

- **Owner `access_token`**: Each owner must have `user_profiles.access_token` set (run `ADD_OWNER_TOKEN.sql` if needed). The dashboard sends it as `X-Owner-Token` when calling `manage-sport-type`. If it’s missing, you get **401 Unauthorized**.

---

## 1. Run the SQL migration

In **Supabase** → **SQL Editor**, run:

```text
CREATE_SPORT_TYPES.sql
```

This creates:

- `sport_types` (id, owner_id, name, match_duration, buffer_minutes)
- `pitches.sport_type_id` (nullable FK to `sport_types`)

---

## 2. Deploy the Edge Function

Deploy `manage-sport-type` for create/update/delete (website uses `access_token`; RLS does not apply there):

```bash
supabase functions deploy manage-sport-type
```

Or in **Supabase Dashboard** → **Edge Functions** → **Deploy** for `supabase/functions/manage-sport-type`.

---

## 3. Website

- **Sport Types** in the sidebar (Dashboard, Complexes, Bookings, Sport Types).
- **sport-types.html**: list, Add, Edit, Delete. CRUD goes through the `manage-sport-type` Edge Function.
- **Pitch form** (Complexes/Bookings): **Slot configuration** dropdown:
  - **— Custom —**: use **Duration (min)** on the pitch; `sport_type_id` = null.
  - **&lt;Name&gt; (X min)**: use that sport type’s duration and buffer; **Duration** is disabled and taken from the sport type.

---

## 4. App

- `getPitch`, `getPitchesByComplex`, `getPitches`: include `sport_types`.
- `getAvailableSlots`: if `pitch.sport_type_id` is set, uses `sport_types.match_duration` and `sport_types.buffer_minutes`; otherwise `pitch.match_duration` and 15min buffer.
- `generateTimeSlots` and `checkSlotConflict` take a `bufferMins` argument.

---

## 5. Flow

1. Owner creates sport types (e.g. Football 90min / 15min buffer, Padel 60min / 15min buffer) in **Sport Types**.
2. When adding/editing a pitch, owner picks a **Slot configuration** (sport type or **— Custom —**).
3. Slots are built from that sport’s duration and buffer (or from the pitch’s **Duration** when **— Custom —**).

Example: 8:00–23:00 with Football 90min + 15min → fewer, longer slots; with Padel 60min + 15min → more, shorter slots.

---

## Troubleshooting

- **401 when saving sport type**:  
  - Ensure `ADD_OWNER_TOKEN.sql` has been run and your owner row has `access_token` set.  
  - Redeploy `manage-sport-type` with the latest code (it uses `X-Owner-Token` and service-role client for verification).

- **Existing pitches show “Football” but Slot configuration is empty**:  
  - The **Sport Type** dropdown (Football, Padel, …) is the display label from `pitch.sport_type`.  
  - **Slot configuration** is from `sport_type_id`. For existing pitches it is `— Custom —` until you create sport types and assign one. When editing, if a sport type exists with the same name (e.g. Football), it is preselected.
