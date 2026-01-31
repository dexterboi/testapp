# Fix Image Upload Permissions

## Update API Rules in PocketBase Admin

### For Complexes (so owners can upload complex images):

1. Open: http://127.0.0.1:8090/_/
2. Go to: **Collections** → **complexes_coll**
3. Click the **gear/settings icon**
4. Find **"API rules"** section
5. Update **"Update rule"** to:

```
@request.auth.id != "" && @request.auth.id = owner
```

Or for testing, use this simpler rule:
```
@request.auth.id != ""
```

6. Click **Save**

---

### For Pitches (so owners can upload pitch images):

1. Go to: **Collections** → **pitches_coll**
2. Click the **gear/settings icon**
3. Find **"API rules"** section
4. Update **"Update rule"** to:

```
@request.auth.id != "" && @request.auth.id = complex.owner
```

Or for testing:
```
@request.auth.id != ""
```

5. Click **Save**

---

## Quick Test (Simpler Rules):

For both collections, you can temporarily use:
- **Update rule:** `@request.auth.id != ""`

This allows any authenticated user to update. Later, make it more secure by checking ownership.
