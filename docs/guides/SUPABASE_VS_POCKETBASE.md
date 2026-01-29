# Supabase vs PocketBase: Migration Guide

## 🤔 Quick Answer: Is it Easy to Switch?

**Short answer: No, it's not easy.** It would require significant refactoring (2-3 days of work).

However, **Supabase has a generous free tier** and might be worth it if you want a fully managed solution.

---

## 📊 Comparison

| Feature | PocketBase | Supabase |
|---------|-----------|----------|
| **Free Tier** | Self-hosted (free) | ✅ Generous free tier |
| **Setup** | Easy (single binary) | Easy (cloud service) |
| **Database** | SQLite | PostgreSQL |
| **Real-time** | ✅ Built-in | ✅ Built-in |
| **Auth** | ✅ Built-in | ✅ Built-in |
| **File Storage** | ✅ Built-in | ✅ Built-in |
| **API** | REST + SDK | REST + GraphQL + SDK |
| **Migrations** | JavaScript files | SQL migrations |
| **Hosting** | Self-host or cloud | ✅ Fully managed |
| **Learning Curve** | Easy | Medium |
| **Your Current Code** | ✅ Already working | ❌ Needs rewrite |

---

## 💰 Supabase Free Tier

**What you get for FREE:**
- ✅ 500MB database storage
- ✅ 1GB file storage
- ✅ 2GB bandwidth/month
- ✅ 50,000 monthly active users
- ✅ Unlimited API requests
- ✅ Real-time subscriptions
- ✅ Email auth (unlimited)
- ✅ Social auth (OAuth)

**Perfect for:** Small to medium apps (like yours!)

**Upgrade when:** You need more storage/bandwidth

---

## ⚠️ What Would Need to Change

### 1. **Database Schema** (Major Change)
- PocketBase: Collections defined in migrations
- Supabase: PostgreSQL tables (SQL)

**Current PocketBase:**
```javascript
// Migration file
collection.schema.addField(new TextField({
  name: "name",
  type: "text"
}));
```

**Supabase Equivalent:**
```sql
-- SQL migration
CREATE TABLE complexes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 2. **API Calls** (Major Change)
- PocketBase: `pb.collection('complexes_coll').getFullList()`
- Supabase: `supabase.from('complexes').select('*')`

**Current Code:**
```typescript
// PocketBase
const complexes = await pb.collection('complexes_coll').getFullList({
  expand: 'owner'
});
```

**Supabase Equivalent:**
```typescript
// Supabase
const { data: complexes } = await supabase
  .from('complexes')
  .select('*, owner:users(*)');
```

### 3. **Authentication** (Medium Change)
- PocketBase: `pb.collection('users').authWithPassword()`
- Supabase: `supabase.auth.signInWithPassword()`

**Current Code:**
```typescript
// PocketBase
await pb.collection('users').authWithPassword(email, password);
const user = pb.authStore.model;
```

**Supabase Equivalent:**
```typescript
// Supabase
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
const user = data.user;
```

### 4. **File Storage** (Medium Change)
- PocketBase: Built-in file field
- Supabase: Storage buckets

**Current Code:**
```typescript
// PocketBase
const fileUrl = getFileUrl('complexes_coll', id, filename);
```

**Supabase Equivalent:**
```typescript
// Supabase
const { data } = supabase.storage
  .from('complex-images')
  .getPublicUrl(filename);
```

### 5. **Relations** (Medium Change)
- PocketBase: Automatic expand
- Supabase: Manual joins with select()

### 6. **Migrations** (Major Change)
- PocketBase: JavaScript migrations
- Supabase: SQL migrations

---

## 📝 Migration Effort Estimate

| Task | Time | Difficulty |
|------|------|------------|
| Set up Supabase project | 30 min | ⭐ Easy |
| Create database schema (SQL) | 2-3 hours | ⭐⭐⭐ Hard |
| Migrate data | 1-2 hours | ⭐⭐ Medium |
| Rewrite API calls | 4-6 hours | ⭐⭐ Medium |
| Update authentication | 2-3 hours | ⭐⭐ Medium |
| Update file storage | 2-3 hours | ⭐⭐ Medium |
| Update all components | 3-4 hours | ⭐⭐ Medium |
| Testing & debugging | 4-6 hours | ⭐⭐⭐ Hard |
| **Total** | **20-30 hours** | **2-3 days** |

---

## ✅ Pros of Switching to Supabase

1. **✅ Fully Managed** - No server management
2. **✅ Generous Free Tier** - 500MB DB, 1GB storage
3. **✅ PostgreSQL** - More powerful than SQLite
4. **✅ Better Scalability** - Handles more users
5. **✅ More Features** - Edge functions, triggers, etc.
6. **✅ Better Documentation** - Extensive docs
7. **✅ Active Community** - Large user base
8. **✅ Automatic Backups** - Built-in
9. **✅ Better Mobile SDK** - React Native support
10. **✅ No Hosting Costs** - Free tier covers small apps

---

## ❌ Cons of Switching to Supabase

1. **❌ Significant Refactoring** - 2-3 days of work
2. **❌ Different API** - All code needs rewriting
3. **❌ SQL Migrations** - Need to learn SQL
4. **❌ More Complex** - PostgreSQL vs SQLite
5. **❌ Vendor Lock-in** - Harder to self-host later
6. **❌ Current Code Works** - Why fix what's not broken?
7. **❌ Learning Curve** - New concepts to learn
8. **❌ Potential Bugs** - During migration

---

## 🎯 My Recommendation

### **Stay with PocketBase IF:**
- ✅ Your app is working well
- ✅ You're comfortable with self-hosting
- ✅ You want full control
- ✅ You don't need PostgreSQL features
- ✅ You want to avoid refactoring

### **Switch to Supabase IF:**
- ✅ You want fully managed (no server management)
- ✅ You need more storage/features
- ✅ You want better mobile SDK
- ✅ You're okay with 2-3 days of refactoring
- ✅ You want automatic backups

---

## 🚀 If You Want to Switch: Quick Start Guide

### Step 1: Create Supabase Project

1. Go to https://supabase.com
2. Sign up (free)
3. Create new project
4. Wait 2 minutes for setup
5. Get your project URL and API key

### Step 2: Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### Step 3: Create Supabase Service

Create `services/supabase.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_KEY';

export const supabase = createClient(supabaseUrl, supabaseKey);
```

### Step 4: Create Database Schema

In Supabase SQL Editor, run:

```sql
-- Users table (extends auth.users)
CREATE TABLE public.users (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT,
  name TEXT,
  role TEXT DEFAULT 'player',
  phone TEXT,
  avatar TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Complexes table
CREATE TABLE public.complexes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  location_lat NUMERIC,
  location_lng NUMERIC,
  owner_id UUID REFERENCES auth.users,
  description TEXT,
  phone TEXT,
  email TEXT,
  facilities JSONB,
  images TEXT[],
  created_at TIMESTAMP DEFAULT NOW()
);

-- Pitches table
CREATE TABLE public.pitches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  complex_id UUID REFERENCES public.complexes ON DELETE CASCADE,
  name TEXT NOT NULL,
  surface TEXT,
  size TEXT,
  price_per_hour NUMERIC,
  image TEXT,
  opening_hour INTEGER DEFAULT 8,
  closing_hour INTEGER DEFAULT 23,
  match_duration INTEGER DEFAULT 75,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pitch_id UUID REFERENCES public.pitches ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  total_price NUMERIC,
  status TEXT DEFAULT 'pending',
  access_code TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.complexes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pitches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Create policies (public read, authenticated write)
CREATE POLICY "Public read" ON public.complexes FOR SELECT USING (true);
CREATE POLICY "Public read" ON public.pitches FOR SELECT USING (true);
CREATE POLICY "Users can read own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
```

### Step 5: Rewrite Data Service

Example for `getComplexes()`:

```typescript
// OLD (PocketBase)
export const getComplexes = async () => {
  const records = await pb.collection('complexes_coll').getFullList();
  return records;
};

// NEW (Supabase)
export const getComplexes = async () => {
  const { data, error } = await supabase
    .from('complexes')
    .select('*');
  
  if (error) {
    console.error('Error fetching complexes:', error);
    return [];
  }
  
  return data || [];
};
```

### Step 6: Update Authentication

```typescript
// OLD (PocketBase)
await pb.collection('users').authWithPassword(email, password);

// NEW (Supabase)
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password
});
```

### Step 7: Update File Storage

```typescript
// Upload file
const { data, error } = await supabase.storage
  .from('complex-images')
  .upload(`${complexId}/${filename}`, file);

// Get public URL
const { data: urlData } = supabase.storage
  .from('complex-images')
  .getPublicUrl(`${complexId}/${filename}`);
```

---

## 💡 Alternative: Hybrid Approach

**Keep PocketBase for now, but design code for easy migration later:**

1. Create abstraction layer (service layer)
2. Keep PocketBase-specific code isolated
3. Switch to Supabase when you need more features

This way, you can migrate later without major refactoring.

---

## 🎯 Final Verdict

**For your current situation:**

1. **If you want zero refactoring:** Stay with PocketBase + free hosting (Oracle Cloud)
2. **If you want fully managed:** Switch to Supabase (2-3 days work)
3. **If you're unsure:** Stay with PocketBase for now, migrate later if needed

**My honest opinion:** Your app works great with PocketBase. Unless you specifically need Supabase features (PostgreSQL, edge functions, etc.), I'd recommend **staying with PocketBase** and using free hosting (Oracle Cloud or Railway).

---

## 📞 Need Help Deciding?

Consider:
- Do you need PostgreSQL features? → Supabase
- Do you want zero server management? → Supabase
- Do you want full control? → PocketBase
- Do you want to avoid refactoring? → PocketBase
- Is your app working well? → Stay with PocketBase

**Bottom line:** Both are great. PocketBase is simpler and your code already works. Supabase is more powerful but requires significant refactoring.
