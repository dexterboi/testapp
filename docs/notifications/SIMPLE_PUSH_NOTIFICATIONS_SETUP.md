# 📱 Push Notifications - Simple Step-by-Step Guide

## ✅ What You Need to Do (3 Simple Steps)

---

## Step 1: Create Firebase Project (5 minutes)

### 1.1 Go to Firebase
- Open: https://console.firebase.google.com/
- Sign in with your Google account

### 1.2 Create New Project
- Click **"Add project"** or **"Create a project"**
- Enter project name: **"Larena"** (or any name you like)
- Click **Continue**
- **Disable** Google Analytics (or enable if you want)
- Click **Create project**
- Wait for it to finish, then click **Continue**

### 1.3 Add Android App
- You'll see a dashboard with icons
- Click the **Android icon** (or click **"Add app"** then select Android)
- **Package name**: Type exactly: `com.pitchperfect.app`
- **App nickname**: Type: `Larena` (optional)
- Click **Register app**

### 1.4 Download Config File
- You'll see a page asking to download `google-services.json`
- Click **Download google-services.json**
- **IMPORTANT**: Save this file somewhere you can find it (like Desktop)

### 1.5 Copy File to Project
- Open Finder (Mac) or File Explorer (Windows)
- Go to your project folder: `/Users/wasseflabidi/Documents/ai projects/pitchperfect`
- Go into: `android` → `app` folder
- **Copy** the `google-services.json` file you downloaded into this `android/app` folder
- ✅ Done! You should have: `android/app/google-services.json`

---

## Step 2: Get Firebase Server Key (2 minutes)

### 2.1 Go to Project Settings
- In Firebase Console, click the **gear icon** ⚙️ (top left)
- Click **"Project settings"**

### 2.2 Get Server Key
- Click the **"Cloud Messaging"** tab (at the top)
- Find **"Server key"** section
- You'll see a long key that starts with something like `AAAA...`
- Click **"Copy"** to copy this key
- **Save this key somewhere safe** (like a text file) - you'll need it later

---

## Step 3: Set Up Database (3 minutes)

### 3.1 Go to Supabase
- Open: https://supabase.com/dashboard
- Sign in and select your project

### 3.2 Open SQL Editor
- In the left sidebar, click **"SQL Editor"**
- Click **"New query"**

### 3.3 Run the SQL
- Open the file: `CREATE_DEVICE_TOKENS_TABLE.sql` in your project
- **Copy ALL the text** from that file
- **Paste it** into the Supabase SQL Editor
- Click **"Run"** (or press Cmd+Enter / Ctrl+Enter)
- ✅ You should see "Success" message

---

## Step 4: Test It! (5 minutes)

### 4.1 Build the App
- Open terminal in your project folder
- Run: `npm run build`
- Then run: `npx cap sync android`

### 4.2 Open in Android Studio
- Run: `npx cap open android`
- Android Studio will open
- Connect your Android phone to computer
- Click the **green play button** ▶️ to install on your phone

### 4.3 Test on Phone
- Open the app on your phone
- **Log in** to your account
- You should see a popup asking for notification permission
- Click **"Allow"** ✅

### 4.4 Check if It Worked
- Go back to Supabase
- Click **"Table Editor"** in left sidebar
- Click on **"device_tokens"** table
- You should see a row with your device token! ✅

---

## 🎉 That's It!

Your push notifications are now set up! The app will:
- ✅ Ask for permission automatically
- ✅ Save device tokens automatically
- ✅ Ready to receive notifications

---

## 📤 Sending Notifications (Optional - Later)

When you want to actually send notifications, you have 2 options:

### Option A: Use Supabase Edge Function (Recommended)
1. Deploy the function (I can help with this later)
2. Set the FCM server key as a secret
3. Notifications will send automatically!

### Option B: Manual Testing
- Use Firebase Console to send test notifications
- Go to Firebase Console → Cloud Messaging → Send test message
- Paste a device token from Supabase
- Send a test notification!

---

## ❓ Troubleshooting

**"I can't find google-services.json"**
- Make sure you downloaded it from Firebase
- Make sure it's in: `android/app/google-services.json` (not just `android/`)

**"Permission not showing"**
- Make sure you're testing on a **real phone** (not emulator)
- Make sure you're **logged in** to the app

**"No token in database"**
- Check if you granted permission
- Check browser/phone console for errors
- Make sure you ran the SQL in Step 3

**"Build failed"**
- Make sure `google-services.json` is in the right place
- Try: `npx cap sync android` again

---

## 📞 Need Help?

If you get stuck at any step, just tell me which step number and what error you see, and I'll help you fix it!
