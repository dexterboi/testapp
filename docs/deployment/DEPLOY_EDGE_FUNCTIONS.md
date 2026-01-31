# 🚀 Deploy Edge Functions - Quick Guide

## Prerequisites

1. **Supabase CLI installed**:
   ```bash
   npm install -g supabase
   ```

2. **Supabase account** (you already have this)

## Quick Deploy Steps

### 1. Login to Supabase
```bash
supabase login
```

### 2. Link Your Project
```bash
supabase link --project-ref dgpdlwklqvbmdtalyiis
```

### 3. Set Secrets (One Time)
```bash
# Get these from Supabase Dashboard → Settings → API
supabase secrets set SUPABASE_URL=https://dgpdlwklqvbmdtalyiis.supabase.co
supabase secrets set SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

**⚠️ Get Service Role Key from:**
- Supabase Dashboard → Settings → API → `service_role` key (keep it secret!)

### 4. Deploy Functions
```bash
# Deploy complex update function
supabase functions deploy update-complex

# Deploy pitch update function
supabase functions deploy update-pitch
```

### 5. Verify Deployment
Check Supabase Dashboard → Edge Functions → You should see:
- ✅ `update-complex`
- ✅ `update-pitch`

## Test Functions

After deployment, test in browser console:

```javascript
// Test complex update
fetch('https://dgpdlwklqvbmdtalyiis.supabase.co/functions/v1/update-complex', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_OWNER_TOKEN',
    'Content-Type': 'application/json',
    'apikey': 'YOUR_ANON_KEY'
  },
  body: JSON.stringify({
    id: 'COMPLEX_ID',
    name: 'Updated Name'
  })
})
.then(r => r.json())
.then(console.log)
```

## ✅ Done!

Once deployed, your dashboard will securely update the database through Edge Functions. Changes will appear immediately in your mobile app!

## Troubleshooting

**"Function not found"**
- Check function names match exactly
- Verify deployment succeeded
- Check Supabase dashboard

**"Unauthorized"**
- Verify token is correct
- Check user has 'owner' role
- Verify token in user_profiles table
