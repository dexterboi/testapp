#!/bin/bash
# Quick Build Script for Android APK
# This script builds the web assets, syncs with Android, and opens Android Studio

set -e  # Exit on error

echo "🚀 Building Larena Android APK"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Build web assets
echo "📦 Step 1: Building web assets..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Web assets built successfully"
echo ""

# Step 2: Sync with Android
echo "🔄 Step 2: Syncing with Android..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo "✅ Android sync completed"
echo ""

# Step 3: Open Android Studio
echo "📱 Step 3: Opening Android Studio..."
echo ""
echo "Next steps in Android Studio:"
echo "1. Wait for Gradle sync to complete"
echo "2. Go to: Build > Build Bundle(s) / APK(s) > Build APK(s)"
echo "3. Wait for build to complete"
echo "4. Click 'locate' in the notification to find the APK"
echo "5. Transfer APK to your phone and install"
echo ""

npx cap open android

echo "✅ Done! Android Studio should now be open."
