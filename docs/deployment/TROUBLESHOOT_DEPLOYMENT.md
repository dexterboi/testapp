# 🔧 Troubleshooting Deployment Issues

## Error: "Failed to fetch (api.supabase.com)"

This is usually a network or authentication issue. Try these solutions:

### Solution 1: Try Again
- Sometimes it's a temporary network issue
- Click **"Deploy"** again
- Wait a few seconds and retry

### Solution 2: Check Your Connection
- Make sure you're logged into Supabase Dashboard
- Refresh the page
- Try in a different browser or incognito mode

### Solution 3: Use CLI Instead (More Reliable)

If the editor keeps failing, use the CLI:

```bash
# Make sure you're in the project folder
cd "/Users/wasseflabidi/Documents/ai projects/pitchperfect"

# Login (will open browser)
npx supabase login

# Link project (get project-ref from Supabase Dashboard → Settings → General)
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy
npx supabase functions deploy send-push-notification
```

### Solution 4: Check Function Name
- Make sure the function name is exactly: `send-push-notification`
- No spaces, no special characters

### Solution 5: Verify Secrets
- Go to Edge Functions → Secrets
- Make sure `FIREBASE_SERVICE_ACCOUNT` exists
- Check that it has the correct JSON content

### Solution 6: Check Supabase Status
- Visit: https://status.supabase.com/
- Check if there are any service issues

---

## Alternative: Deploy via Supabase Dashboard (Step by Step)

1. **Go to Edge Functions**
   - Supabase Dashboard → Edge Functions (left sidebar)

2. **Create New Function**
   - Click **"Create a new function"**
   - Name: `send-push-notification`
   - Click **"Create"**

3. **Copy Code**
   - Open: `supabase/functions/send-push-notification/index.ts`
   - Copy ALL the code (Cmd+A, Cmd+C)

4. **Paste in Editor**
   - Paste into Supabase editor
   - Replace any existing code

5. **Save First**
   - Click **"Save"** (not Deploy yet)
   - Wait for it to save

6. **Then Deploy**
   - Click **"Deploy"** button
   - Wait for completion

---

## Still Not Working?

If none of these work:
1. Check browser console for errors (F12)
2. Try a different browser
3. Clear browser cache
4. Contact Supabase support
