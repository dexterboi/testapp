# APK Build Guide for PitchPerfect

This guide will help you create an APK file for testing the PitchPerfect app.

## ✅ Setup Complete!

Capacitor and Android platform have been set up. Your project is ready to build!

## Prerequisites

1. **Node.js** (v18 or higher) - ✅ Installed
2. **Java JDK** (v17 or higher) - Required for Android builds
3. **Android Studio** - For Android SDK and build tools (recommended)
4. **Android SDK** - Installed via Android Studio

## Quick Start: Build APK

### Option 1: Using Android Studio (Recommended - Easiest)

1. **Open the project in Android Studio:**
   ```bash
   npx cap open android
   ```

2. **Wait for Android Studio to sync** (it will download dependencies automatically)

3. **Build the APK:**
   - Go to **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for the build to complete (first time may take a few minutes)
   - Click **locate** when the notification appears

4. **Find your APK:**
   - Location: `android/app/build/outputs/apk/debug/app-debug.apk`
   - You can install this on any Android device for testing!

### Option 2: Using Command Line (Requires Android SDK)

If you have Android SDK installed and configured:

```bash
cd android
./gradlew assembleDebug
```

The APK will be in: `android/app/build/outputs/apk/debug/app-debug.apk`

## Rebuilding After Code Changes

Whenever you make changes to your React app:

1. **Build the React app:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Rebuild APK** (using Android Studio or command line)

## Installing the APK on Your Device

### Via ADB (Android Debug Bridge):
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Via USB:
1. Enable **Developer Options** on your Android device
2. Enable **USB Debugging**
3. Connect device via USB
4. Drag and drop the APK file to your device
5. Open it on your device to install

## Quick Build Script

Use the provided script to rebuild after code changes:

```bash
./build-apk.sh
```

Or manually:
```bash
npm run build && npx cap sync android
```

## Important Notes

1. **Supabase URL**: ✅ Your Supabase URL is already configured and accessible from mobile devices

2. **Permissions**: ✅ Added automatically:
   - Internet access
   - Location access (for maps)

3. **Testing**: Install the APK on an Android device:
   ```bash
   adb install android/app/build/outputs/apk/debug/app-debug.apk
   ```
   Or transfer via USB and install manually

4. **Production Build**: For a production APK (for Google Play Store):
   - Generate a signing key
   - Build a release APK
   - Sign the APK
   - See: https://capacitorjs.com/docs/android/deploying-to-google-play

## Troubleshooting

### Java not found
- Install JDK 17+ from: https://adoptium.net/
- Set JAVA_HOME environment variable

### Android SDK not found
- Install Android Studio: https://developer.android.com/studio
- Android Studio will install the SDK automatically
- Set ANDROID_HOME if using command line (optional)

### Build fails in Android Studio
- Check the **Build** tab for specific error messages
- Make sure you have the latest Android SDK installed
- Try **File** → **Invalidate Caches / Restart**

### APK won't install
- Enable "Install from Unknown Sources" in Android settings
- For Android 8+: Enable "Install unknown apps" for your file manager

### App crashes on startup
- Check browser console logs (if using remote debugging)
- Verify Supabase URL is correct in your code
- Check network permissions in AndroidManifest.xml
