#!/bin/bash

# Configuration
REPO_URL="https://github.com/dexterboi/testapp"
APK_SOURCE="android/app/build/outputs/apk/debug/app-debug.apk"
APK_TARGET="app-debug.apk"
TEMP_DIR="temp_github_repo"

# 1. Get current version from package.json
VERSION=$(node -e "console.log(require('./package.json').version)")
echo "📦 Current version identified in package.json: $VERSION"

# 1.5 Build and Sync Capacitor
echo "🏗️ Building web assets..."
npm run build
echo "🔄 Syncing with Capacitor..."
npx cap sync android

# 1.6 Build the Android APK
echo "🛠️ Cleaning and compiling Android APK..."
cd android
./gradlew clean
./gradlew assembleDebug || { echo "❌ Gradle build failed"; exit 1; }
cd ..
echo "✅ Build complete!"

# 2. Check if APK exists
if [ ! -f "$APK_SOURCE" ]; then
    echo "❌ APK not found at $APK_SOURCE"
    exit 1
fi

# 3. Create version.json
cat <<EOF > version.json
{
  "latest_version": "$VERSION",
  "download_url": "https://github.com/dexterboi/testapp/raw/main/app-debug.apk",
  "release_notes": "Fixed Browser Mode bug. Enabled Private Messages and Broadcast Notifications."
}
EOF

# 4. Clone repo to temp dir
rm -rf "$TEMP_DIR"
git clone "$REPO_URL" "$TEMP_DIR"

# 5. Copy files
cp "$APK_SOURCE" "$TEMP_DIR/$APK_TARGET"
cp version.json "$TEMP_DIR/version.json"

# 6. Commit and Push
cd "$TEMP_DIR"
git rm Larena.apk --ignore-unmatch
git add "$APK_TARGET" version.json
git commit -m "🚀 Automated Build Update: $VERSION (Cleaned Legacy APK)"
git push origin main

# 7. Cleanup
cd ..
rm -rf "$TEMP_DIR"
rm version.json

echo "✅ APK pushed to GitHub successfully!"
