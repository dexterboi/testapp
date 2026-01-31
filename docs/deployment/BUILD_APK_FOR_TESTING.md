# 📱 Build APK for Push Notification Testing

## ✅ Build Steps Completed

1. ✅ Web app built
2. ✅ Capacitor synced
3. ✅ Android Studio opening...

## 🔨 Build APK in Android Studio

### Step 1: Wait for Android Studio to Open
- Android Studio should open automatically
- Wait for it to finish loading and indexing

### Step 2: Connect Your Phone
- Connect your Android phone via USB
- Enable **USB Debugging** on your phone:
  - Settings → About Phone → Tap "Build Number" 7 times
  - Settings → Developer Options → Enable "USB Debugging"

### Step 3: Build and Install
- In Android Studio, click the **green play button** ▶️ (or press Shift+F10)
- Select your connected device
- Click **"Run"**
- The app will build and install on your phone automatically

### Alternative: Build APK File

If you want to create an APK file to share:

1. **Build → Generate Signed Bundle / APK**
2. Select **APK**
3. Click **Next**
4. Select **debug** (or create a keystore for release)
5. Click **Finish**
6. APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

## 🧪 Test Push Notifications

After installing:

1. **Open the app** on your phone
2. **Log in** to your account
3. **Grant notification permission** when asked
4. **Check Supabase** → Table Editor → `device_tokens`
   - You should see your device token!
5. **Test notification** from Supabase Dashboard → Edge Functions → Invoke

## 📋 Checklist

- [ ] Android Studio opened
- [ ] Phone connected via USB
- [ ] USB Debugging enabled
- [ ] App built and installed
- [ ] Logged in to app
- [ ] Notification permission granted
- [ ] Device token appears in Supabase
- [ ] Test notification sent and received ✅

## 🎉 Done!

Your APK is ready for testing push notifications!
