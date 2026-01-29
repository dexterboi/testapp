# Supabase Migration Guide

## 🚀 Quick Start

### Step 1: Run SQL Migration

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Copy and paste the entire contents of `supabase_migration.sql`
5. Click **Run**

This will:
- Drop existing tables (if any)
- Create all necessary tables
- Set up Row Level Security (RLS) policies
- Create storage buckets
- Set up triggers and functions

### Step 2: Update Environment Variables

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://dgpdlwklqvbmdtalyiis.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA
```

### Step 3: Code Updates Needed

The following files need to be updated to use Supabase:

#### ✅ Already Updated:
- `services/supabase.ts` - New Supabase client
- `services/dataService.ts` - Updated to use Supabase
- `supabase_migration.sql` - Complete SQL schema

#### ⚠️ Still Need Updates:
- `services/bookingService.ts` - Partially updated, needs completion
- `components/Auth.tsx` - Update authentication
- `components/UserProfile.tsx` - Update user profile
- `components/OwnerDashboard.tsx` - Update owner dashboard
- `components/ImageUpload.tsx` - Update image upload
- `App.tsx` - Update all PocketBase references

## 📋 Field Name Mappings

### PocketBase → Supabase

| PocketBase | Supabase |
|------------|----------|
| `pitches_coll` | `pitches` |
| `complexes_coll` | `complexes` |
| `bookings_coll` | `bookings` |
| `_pb_users_auth_` | `auth.users` + `user_profiles` |
| `pricePerHour` | `price_per_hour` |
| `complex` (relation) | `complex_id` |
| `pitch` (relation) | `pitch_id` |
| `user` (relation) | `user_id` |
| `owner` (relation) | `owner_id` |
| `accessCode` | `access_code` |
| `start_time` | `start_time` (same) |
| `end_time` | `end_time` (same) |
| `total_price` | `total_price` (same) |

## 🔄 API Call Conversions

### Fetching Records

**PocketBase:**
```typescript
const records = await pb.collection('complexes_coll').getFullList();
```

**Supabase:**
```typescript
const { data: records, error } = await supabase
  .from('complexes')
  .select('*');
```

### Fetching with Relations

**PocketBase:**
```typescript
const record = await pb.collection('pitches_coll').getOne(id, {
  expand: 'complex'
});
```

**Supabase:**
```typescript
const { data: record, error } = await supabase
  .from('pitches')
  .select('*, complexes(*)')
  .eq('id', id)
  .single();
```

### Filtering

**PocketBase:**
```typescript
const records = await pb.collection('bookings_coll').getFullList({
  filter: `user = "${userId}" && status = "pending"`
});
```

**Supabase:**
```typescript
const { data: records, error } = await supabase
  .from('bookings')
  .select('*')
  .eq('user_id', userId)
  .eq('status', 'pending');
```

### Creating Records

**PocketBase:**
```typescript
const record = await pb.collection('bookings_coll').create({
  pitch: pitchId,
  user: userId,
  status: 'pending'
});
```

**Supabase:**
```typescript
const { data: record, error } = await supabase
  .from('bookings')
  .insert({
    pitch_id: pitchId,
    user_id: userId,
    status: 'pending'
  })
  .select()
  .single();
```

### Updating Records

**PocketBase:**
```typescript
const record = await pb.collection('bookings_coll').update(id, {
  status: 'approved'
});
```

**Supabase:**
```typescript
const { data: record, error } = await supabase
  .from('bookings')
  .update({ status: 'approved' })
  .eq('id', id)
  .select()
  .single();
```

### Deleting Records

**PocketBase:**
```typescript
await pb.collection('bookings_coll').delete(id);
```

**Supabase:**
```typescript
const { error } = await supabase
  .from('bookings')
  .delete()
  .eq('id', id);
```

## 🔐 Authentication

### Sign Up

**PocketBase:**
```typescript
const user = await pb.collection('users').create({
  email,
  password,
  passwordConfirm: password,
  name
});
```

**Supabase:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    data: {
      name,
      role: 'player'
    }
  }
});
```

### Sign In

**PocketBase:**
```typescript
const authData = await pb.collection('users').authWithPassword(email, password);
const user = pb.authStore.model;
```

**Supabase:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
const user = data.user;
```

### Get Current User

**PocketBase:**
```typescript
const user = pb.authStore.model;
```

**Supabase:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Sign Out

**PocketBase:**
```typescript
pb.authStore.clear();
```

**Supabase:**
```typescript
await supabase.auth.signOut();
```

## 📁 File Storage

### Upload File

**PocketBase:**
```typescript
const formData = new FormData();
formData.append('image', file);
const record = await pb.collection('complexes_coll').update(id, formData);
```

**Supabase:**
```typescript
const { data, error } = await supabase.storage
  .from('complex-images')
  .upload(`${complexId}/${filename}`, file);
```

### Get File URL

**PocketBase:**
```typescript
const url = getFileUrl('complexes_coll', id, filename);
```

**Supabase:**
```typescript
const { data } = supabase.storage
  .from('complex-images')
  .getPublicUrl(`${id}/${filename}`);
const url = data.publicUrl;
```

### Delete File

**PocketBase:**
```typescript
const record = await pb.collection('complexes_coll').update(id, {
  images: updatedImages
});
```

**Supabase:**
```typescript
const { error } = await supabase.storage
  .from('complex-images')
  .remove([`${id}/${filename}`]);
```

## ⚠️ Important Notes

1. **Field Names**: Supabase uses snake_case, PocketBase used camelCase
2. **Relations**: Supabase uses foreign keys (`complex_id`) instead of relation fields
3. **Expands**: Use `.select('*, related_table(*)')` instead of `expand`
4. **Filters**: Use query builder methods (`.eq()`, `.gte()`, etc.) instead of filter strings
5. **User Profiles**: Supabase auth.users is separate from user_profiles table
6. **RLS Policies**: Make sure RLS policies allow the operations you need

## 🧪 Testing Checklist

After migration, test:

- [ ] User registration
- [ ] User login
- [ ] View complexes
- [ ] View pitches
- [ ] Create booking
- [ ] View bookings
- [ ] Owner dashboard
- [ ] Approve/reject bookings
- [ ] Image upload
- [ ] Image viewing
- [ ] Cancel booking
- [ ] Update profile

## 🐛 Common Issues

### "relation does not exist"
- Make sure you ran the SQL migration
- Check table names match (snake_case)

### "permission denied"
- Check RLS policies
- Verify user is authenticated
- Check policy conditions

### "column does not exist"
- Check field name mappings
- Verify column names in database

### "foreign key constraint"
- Ensure related records exist
- Check foreign key relationships

## 📞 Need Help?

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check `supabase_migration.sql` for schema details
