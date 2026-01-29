# 🚀 Deploy Edge Functions from Supabase Dashboard

## Quick Method - No CLI Needed!

You can deploy Edge Functions directly from the Supabase Dashboard editor, just like you did before.

## Step-by-Step Guide

### 1. Go to Supabase Dashboard
- Open: https://supabase.com/dashboard
- Select your project: `dgpdlwklqvbmdtalyiis`

### 2. Navigate to Edge Functions
- Click **"Edge Functions"** in the left sidebar
- Or go to: https://supabase.com/dashboard/project/dgpdlwklqvbmdtalyiis/functions

### 3. Create `update-complex` Function

1. Click **"Create a new function"** or **"New Function"**
2. Name it: `update-complex`
3. Click **"Create function"** or **"Continue"**
4. **Copy the entire code** from `EDGE_FUNCTION_CODE_update-complex.txt` file
5. Paste it into the editor
6. Click **"Deploy"** or **"Save"**

### 4. Create `update-pitch` Function

1. Click **"Create a new function"** again
2. Name it: `update-pitch`
3. Click **"Create function"**
4. **Copy the entire code** from `EDGE_FUNCTION_CODE_update-pitch.txt` file
5. Paste it into the editor
6. Click **"Deploy"** or **"Save"**

### 5. Set Environment Variables (Secrets)

1. In Edge Functions page, look for **"Settings"** or **"Secrets"** tab
2. Or go to: **Settings** → **Edge Functions** → **Secrets**
3. Add these secrets:

```
SUPABASE_URL = https://dgpdlwklqvbmdtalyiis.supabase.co
SUPABASE_ANON_KEY = eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRncGRsd2tscXZibWR0YWx5aWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2MzEzMTYsImV4cCI6MjA4NDIwNzMxNn0.REgLPzPG7Xq2I5Ocp7vD8IS2MLuqfbNNioOrS0RNGSA
SUPABASE_SERVICE_ROLE_KEY = YOUR_SERVICE_ROLE_KEY_HERE
```

**To get Service Role Key:**
- Go to **Settings** → **API**
- Copy the **`service_role`** key (keep it secret!)

### 6. Verify Functions Are Deployed

After deploying, you should see:
- ✅ `update-complex` - Status: Active
- ✅ `update-pitch` - Status: Active

## Test the Functions

You can test directly in the dashboard:

1. Click on a function (e.g., `update-complex`)
2. Go to **"Invoke"** or **"Test"** tab
3. Use this test payload:

```json
{
  "name": "Test Complex",
  "address": "Test Address"
}
```

4. Add header:
   - Key: `Authorization`
   - Value: `Bearer YOUR_OWNER_TOKEN`

5. Click **"Invoke"** or **"Run"**

## ✅ Done!

Once both functions are deployed, your dashboard will automatically use them. No CLI needed!

## Troubleshooting

**Function not showing up?**
- Refresh the page
- Check you're in the correct project
- Verify function name matches exactly

**Getting errors?**
- Check all secrets are set correctly
- Verify service role key is correct
- Check function code is copied correctly

**Can't find Secrets/Environment Variables?**
- Look for **"Settings"** in Edge Functions page
- Or check **Project Settings** → **Edge Functions**
- Some projects have it under function settings
