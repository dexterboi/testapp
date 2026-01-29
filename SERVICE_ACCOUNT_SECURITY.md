# 🔒 Service Account JSON - Security Guide

## ⚠️ IMPORTANT: This File Contains Sensitive Credentials!

The file `larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json` contains:
- Private keys
- Service account credentials
- Full access to your Firebase project

**NEVER:**
- ❌ Commit it to Git
- ❌ Share it publicly
- ❌ Put it in client-side code
- ❌ Upload it to public repositories

## ✅ What to Do

### Option 1: Use Environment Variable (Recommended for Production)

1. **For Supabase Edge Functions:**
   - Go to Supabase Dashboard → Edge Functions → Secrets
   - Add secret: `FIREBASE_SERVICE_ACCOUNT`
   - Paste the entire JSON content as the value

2. **For Node.js Backend:**
   - Store in `.env` file (add to `.gitignore`)
   - Or use environment variables in your hosting platform

### Option 2: Keep File Secure (For Development)

1. **Move the file:**
   ```bash
   # Create a secure folder (not in git)
   mkdir -p .secrets
   mv android/app/larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json .secrets/
   ```

2. **Add to .gitignore:**
   ```
   .secrets/
   *.json
   android/app/*-firebase-adminsdk-*.json
   ```

3. **Update code to use the new path**

## 📍 Current Location

The file is currently in: `android/app/larena-4acd2-firebase-adminsdk-fbsvc-3ecf5b620b.json`

**This is NOT secure for production!** It's in the Android app folder which gets bundled.

## ✅ Recommended Actions

1. ✅ Move file to `.secrets/` folder
2. ✅ Add to `.gitignore`
3. ✅ Use environment variables in production
4. ✅ Never commit credentials to Git

## 🔧 How It's Used

The service account JSON is used by:
- `services/firebaseAdminService.ts` - For sending push notifications
- Supabase Edge Functions - For backend notification sending
- Node.js backend services - For automated notifications

**This file should ONLY be used on the server/backend, never in the mobile app!**
