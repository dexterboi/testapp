# Quick APK Build Guide

## ✅ Project is Ready!

Your PitchPerfect app is fully configured for Android. Follow these steps to build your APK:

## Step 1: Install Java (Required)

**Option A: Using Homebrew (Recommended)**
```bash
brew install --cask temurin
```

**Option B: Manual Download**
1. Visit: https://adoptium.net/
2. Download: macOS, ARM64 (or x64), JDK 17 or higher
3. Install the .pkg file

**Verify installation:**
```bash
java -version
```

## Step 2: Install Android Studio (Required)

1. **Download Android Studio:**
   - Visit: https://developer.android.com/studio
   - Download for macOS

2. **Install:**
   - Open the .dmg file
   - Drag Android Studio to Applications
   - Open Android Studio from Applications

3. **First-time Setup:**
   - Complete the setup wizard
   - It will automatically install Android SDK
   - Accept all license agreements
   - Wait for SDK download (may take 10-15 minutes)

## Step 3: Build Your APK

### Method 1: Using Android Studio (Easiest)

1. **Open the project:**
   ```bash
   npx cap open android
   ```
   This opens the project in Android Studio

2. **Wait for Gradle Sync:**
   - Android Studio will automatically sync
   - First time may take 5-10 minutes
   - Watch the progress bar at the bottom

3. **Build APK:**
   - Go to: **Build** → **Build Bundle(s) / APK(s)** → **Build APK(s)**
   - Wait for build to complete
   - Click **locate** in the notification

4. **Find your APK:**
   - Location: `android/app/build/outputs/apk/debug/app-debug.apk`
   - This is your installable APK file!

### Method 2: Using Command Line

After Android Studio is installed and SDK is set up:

```bash
# Rebuild React app and sync
./build-apk.sh

# Build APK
cd android
./gradlew assembleDebug
```

APK location: `android/app/build/outputs/apk/debug/app-debug.apk`

## Step 4: Install on Your Device

### Via USB:
1. Enable **Developer Options** on Android device:
   - Settings → About Phone → Tap "Build Number" 7 times
2. Enable **USB Debugging**:
   - Settings → Developer Options → USB Debugging
3. Connect device via USB
4. Transfer APK to device
5. Open APK on device to install

### Via ADB (if installed):
```bash
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### "Java not found"
- Make sure Java is installed: `java -version`
- If installed but not found, restart terminal

### "Android SDK not found"
- Make sure Android Studio is installed
- Open Android Studio → SDK Manager
- Install Android SDK Platform (latest version)
- Set environment variable:
  ```bash
  export ANDROID_HOME=$HOME/Library/Android/sdk
  echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
  source ~/.zshrc
  ```

### Build fails in Android Studio
- Check **Build** tab for errors
- Try: **File** → **Invalidate Caches / Restart**
- Make sure internet connection is active (downloads dependencies)

### APK won't install
- Enable "Install from Unknown Sources" in Android settings
- For Android 8+: Enable "Install unknown apps" for your file manager

## After Making Code Changes

1. **Rebuild React app:**
   ```bash
   npm run build
   ```

2. **Sync with Capacitor:**
   ```bash
   npx cap sync android
   ```

3. **Rebuild APK** (in Android Studio or via command line)

## Current Status

✅ Capacitor configured  
✅ Android project created  
✅ Permissions added (Internet, Location)  
✅ Build scripts ready  
⏳ Java installation needed (run: `brew install --cask temurin`)  
⏳ Android Studio installation needed  

## Next Steps

1. Install Java: `brew install --cask temurin`
2. Install Android Studio: https://developer.android.com/studio
3. Run: `npx cap open android`
4. Build APK in Android Studio

Your app is ready! 🚀
