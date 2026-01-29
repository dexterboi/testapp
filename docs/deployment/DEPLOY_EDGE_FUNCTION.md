# 🚀 Deploy Edge Function - Step by Step

## Step 1: Install Supabase CLI

I'm installing it locally for you. If you prefer global install, run:
```bash
sudo npm install -g supabase
```

## Step 2: Login to Supabase

```bash
npx supabase login
```

This will open your browser to authenticate.

## Step 3: Link Your Project

1. Go to Supabase Dashboard
2. Click **Settings** (gear icon) → **General**
3. Find **"Reference ID"** (looks like: `abcdefghijklmnop`)
4. Copy it

Then run:
```bash
npx supabase link --project-ref YOUR_PROJECT_REF_HERE
```

## Step 4: Deploy Function

```bash
npx supabase functions deploy send-push-notification
```

## Step 5: Verify

1. Go to Supabase Dashboard → **Edge Functions**
2. You should see `send-push-notification` in the list
3. Click on it to test!

---

## Alternative: Deploy via Supabase Dashboard

If CLI doesn't work, you can also:
1. Go to Supabase Dashboard → Edge Functions
2. Click **"Create a new function"**
3. Name it: `send-push-notification`
4. Copy the code from `supabase/functions/send-push-notification/index.ts`
5. Paste and deploy
