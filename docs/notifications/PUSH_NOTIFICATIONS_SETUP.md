# 📱 Push Notifications Setup Guide

This guide will help you set up push notifications for your Larena app using Capacitor and Firebase Cloud Messaging (FCM).

## ✅ What's Already Done

1. ✅ Installed `@capacitor/push-notifications` package
2. ✅ Created push notification service (`services/pushNotificationService.ts`)
3. ✅ Created database table SQL script (`CREATE_DEVICE_TOKENS_TABLE.sql`)
4. ✅ Integrated push notification initialization in `App.tsx`

## 🔧 Setup Steps

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" or select existing project
3. Follow the setup wizard

### Step 2: Add Android App to Firebase

1. In Firebase Console, click the Android icon (or "Add app")
2. Enter your package name: `com.pitchperfect.app` (from `capacitor.config.ts`)
3. Download `google-services.json`
4. Place it in: `android/app/google-services.json`

### Step 3: Configure Android Build

1. Open `android/build.gradle` (project level)
2. Add to `buildscript.dependencies`:
```gradle
classpath 'com.google.gms:google-services:4.4.0'
```

3. Open `android/app/build.gradle`
4. Add at the top:
```gradle
apply plugin: 'com.google.gms.google-services'
```

5. Add to `dependencies`:
```gradle
implementation 'com.google.firebase:firebase-messaging:23.4.0'
```

### Step 4: Update AndroidManifest.xml

Add these permissions (if not already present):
```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
```

### Step 5: Run Database Migration

1. Go to Supabase SQL Editor
2. Run the SQL from `CREATE_DEVICE_TOKENS_TABLE.sql`
3. This creates the table to store device tokens

### Step 6: Sync Capacitor

```bash
npm run build
npx cap sync android
```

### Step 7: Test

1. Build and install the APK on a real device
2. Log in to the app
3. Grant notification permission when prompted
4. Check Supabase `device_tokens` table - you should see your device token

## 🚀 Sending Notifications

### Option 1: Using Supabase Edge Functions (Recommended)

Create a Supabase Edge Function to send notifications:

```typescript
// supabase/functions/send-push-notification/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { userId, title, body, data } = await req.json()
  
  // Get user's device tokens
  const supabase = createClient(...)
  const { data: tokens } = await supabase
    .from('device_tokens')
    .select('token')
    .eq('user_id', userId)
  
  // Send via FCM API
  // (You'll need FCM server key from Firebase)
  
  return new Response(JSON.stringify({ success: true }))
})
```

### Option 2: Using Firebase Admin SDK

You can create a backend service (Node.js, Python, etc.) that:
1. Listens to Supabase database changes (via webhooks or real-time)
2. Gets device tokens for the user
3. Sends notifications via Firebase Admin SDK

## 📋 Notification Triggers

The app will automatically send push notifications when:

1. **Friend Request**: Someone sends you a friend request
2. **Lobby Invite**: You're invited to a lobby
3. **Lobby Access Request**: Someone requests to join your lobby
4. **New Venue/Pitch**: New venues or pitches are added (optional)

## 🔔 How It Works

1. **App starts** → Requests notification permission
2. **User logs in** → Registers device token with FCM
3. **Token saved** → Stored in Supabase `device_tokens` table
4. **Event happens** → Backend sends notification via FCM
5. **Device receives** → Shows notification even if app is closed
6. **User taps** → Opens app and navigates to relevant page

## ⚠️ Important Notes

- **Android 13+**: Requires runtime permission for notifications
- **Testing**: Must test on real device (not emulator)
- **FCM Server Key**: Keep this secret! Store in environment variables
- **Token Refresh**: Tokens can change, handle token updates

## 🐛 Troubleshooting

### Notifications not showing?
- Check if permission was granted
- Verify `google-services.json` is in correct location
- Check device token exists in Supabase
- Verify FCM server key is correct

### Token not saving?
- Check Supabase RLS policies allow inserts
- Verify user is authenticated
- Check browser console for errors

## 📚 Resources

- [Capacitor Push Notifications Docs](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM Server Setup](https://firebase.google.com/docs/cloud-messaging/server)
