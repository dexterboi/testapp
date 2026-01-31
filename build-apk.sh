#!/bin/bash

# Build script for PitchPerfect APK
# This script builds the React app and syncs with Capacitor

echo "🚀 Building PitchPerfect APK..."
echo ""

# Step 1: Build React app
echo "📦 Building React app..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

# Step 2: Sync with Capacitor
echo "🔄 Syncing with Capacitor..."
npx cap sync android

if [ $? -ne 0 ]; then
    echo "❌ Sync failed!"
    exit 1
fi

echo ""
echo "✅ Build complete!"
echo ""
echo "Next steps:"
echo "1. Open Android Studio: npx cap open android"
echo "2. Build APK: Build → Build Bundle(s) / APK(s) → Build APK(s)"
echo "3. Find APK at: android/app/build/outputs/apk/debug/app-debug.apk"
echo ""
