# 🔑 Get FCM Server Key

The Edge Function now uses the **FCM Server Key** (simpler and works with Deno).

## How to Get Server Key:

1. **Go to Firebase Console**
   - https://console.firebase.google.com/
   - Select your project: **Larena**

2. **Go to Project Settings**
   - Click the **gear icon** ⚙️ (top left)
   - Click **"Project settings"**

3. **Go to Cloud Messaging Tab**
   - Click **"Cloud Messaging"** tab at the top

4. **Enable Legacy API (if needed)**
   - Find section: **"API Cloud Messaging (ancienne version)"** (Old Cloud Messaging API)
   - If it says **"Désactivée"** (Disabled), click the toggle to **enable it**
   - Firebase may show a warning - click **"Activer quand même"** (Enable anyway)

5. **Get Server Key**
   - Once enabled, you'll see **"Clé serveur"** (Server Key)
   - Click **"Afficher"** (Show) or the eye icon 👁️
   - **Copy** the key (long string starting with `AAAA...`)

6. **Add to Supabase Secrets**
   - Go to Supabase Dashboard → **Edge Functions** → **Secrets**
   - Click **"Add new secret"**
   - **Name**: `FCM_SERVER_KEY`
   - **Value**: Paste the server key you copied
   - Click **"Save"**

## ✅ Done!

Now your Edge Function will work! The server key is simpler than the service account for this use case.

---

**Note:** The legacy API is being deprecated by Google (June 2024), but it still works and is much simpler for Deno Edge Functions. For production, you might want to migrate to the v1 API later, but this will work perfectly for now!
