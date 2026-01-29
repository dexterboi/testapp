# 🔑 How to Get Firebase Server Key

## The Problem
Firebase now uses the new V1 API (which uses Service Accounts), but the old "Server Key" is easier for our setup.

## Solution: Enable Legacy API Temporarily

### Step 1: Enable Legacy API
1. On the Cloud Messaging page you're viewing
2. Find the section: **"API Cloud Messaging (ancienne version)"** (Old Cloud Messaging API)
3. You'll see it says **"Désactivée"** (Disabled)
4. Click the **toggle switch** or **"Activer"** (Enable) button to enable it
5. Firebase may show a warning - click **"Activer quand même"** (Enable anyway) or similar

### Step 2: Get the Server Key
1. Once enabled, the section will expand
2. You'll see **"Clé serveur"** (Server Key)
3. Click **"Afficher"** (Show) or the eye icon 👁️
4. **Copy** the key (it's a long string starting with something like `AAAA...`)
5. **Save it somewhere safe** - you'll need it later!

### Step 3: (Optional) Disable After Getting Key
- You can disable the legacy API again after copying the key
- The key will still work even if disabled

---

## Alternative: Use Service Account (More Complex)

If you prefer to use the modern V1 API:
1. Click **"Gérer les comptes de service"** (Manage service accounts)
2. Create a service account
3. Download JSON key file
4. Use it in your backend

**But for simplicity, just get the Server Key from the legacy API!**

---

## What You Need
- **Server Key**: The long string you copied
- **Sender ID**: `1036021429427` (you can see this on the page)

Save both of these - you'll need them!
