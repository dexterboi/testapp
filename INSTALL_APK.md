# 📱 Install Larena APK - Quick Guide

## APK Location

**File:** `larena-latest.apk` (12 MB)  
**Path:** `/Users/wasseflabidi/Documents/ai projects/pitchperfect/larena-latest.apk`

## Installation Steps

### 1. Transfer APK to Your Phone

**Option A: AirDrop (Mac to iPhone won't work, Android only)**
- Right-click `larena-latest.apk`
- Share via AirDrop to nearby Android device

**Option B: USB Cable**
```bash
# Connect phone via USB, then:
adb install larena-latest.apk
```

**Option C: Cloud Storage**
- Upload to Google Drive, Dropbox, or email it to yourself
- Download on your phone

**Option D: Direct File Transfer**
- Connect phone via USB
- Copy `larena-latest.apk` to phone's Downloads folder

### 2. Install on Phone

1. Open the APK file on your phone (from Downloads or wherever you saved it)
2. If prompted, enable "Install from Unknown Sources" or "Allow from this source"
3. Tap "Install"
4. Wait for installation to complete
5. Tap "Open"

### 3. Test Push Notifications

1. **Log in** with your account
2. **Grant notification permission** when prompted
3. **Wait a few seconds** for FCM registration

### 4. Verify Registration

On your computer, run:

```bash
cd /Users/wasseflabidi/Documents/ai\ projects/pitchperfect
node debug-notifications.js "8de1f877-32f8-4960-b550-8b7001a09b95"
```

**Expected output:**
```
✅ Found 1 device token(s):
   Token 1:
   - Platform: android
   - Token: cXyZ123...
```

### 5. Send Test Notification

```bash
node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95" "🎉 Test" "Hello from Larena!"
```

**You should receive the notification on your phone!**

### 6. Test App-Triggered Notifications

In the app, try:
- Sending a friend request to another user
- Creating a lobby and inviting someone
- Requesting to join a private lobby

## Troubleshooting

### "App not installed" error
- Make sure you have enough storage space
- Uninstall any previous version first

### No notification permission prompt
- Go to Settings > Apps > Larena > Permissions
- Manually enable Notifications

### Still no device token after login
- Check logcat: `adb logcat | grep -E "🔔|FCM|Push"`
- Make sure phone has internet connection
- Verify Google Play Services is installed and updated

### Notifications not received
- Check Do Not Disturb mode is off
- Check battery optimization settings (disable for Larena)
- Verify notification permission is granted

## Quick Commands Reference

```bash
# Check device token
node debug-notifications.js "8de1f877-32f8-4960-b550-8b7001a09b95"

# Send test notification
node test-supabase-notification.js "8de1f877-32f8-4960-b550-8b7001a09b95" "Test" "Message"

# View Android logs
adb logcat | grep -E "🔔|FCM|Push"

# Install APK via USB
adb install larena-latest.apk

# Rebuild APK (if needed)
npm run build && npx cap sync android && cd android && ./gradlew assembleDebug
```

## Success Criteria

✅ APK installed on phone  
✅ App opens without crashes  
✅ User logged in successfully  
✅ Notification permission granted  
✅ Device token appears in database  
✅ Test notification received  
✅ App-triggered notification received  

---

**Need help?** Check the [walkthrough.md](file:///Users/wasseflabidi/.gemini/antigravity/brain/e060f5ef-8eff-4d89-986a-32cbd8ecbef2/walkthrough.md) for detailed troubleshooting.
