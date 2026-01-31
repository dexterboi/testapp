#!/bin/bash

# Setup script for Android APK building
# This script checks prerequisites and guides installation

echo "🔍 Checking prerequisites for Android APK build..."
echo ""

# Check Java
echo "Checking Java..."
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo "✅ Java found: $JAVA_VERSION"
else
    echo "❌ Java not found"
    echo ""
    echo "📥 To install Java:"
    echo "   Option 1 (Recommended): Install via Homebrew:"
    echo "   brew install --cask temurin"
    echo ""
    echo "   Option 2: Download from: https://adoptium.net/"
    echo "   Choose: macOS, x64, JDK 17 or higher"
    echo ""
    exit 1
fi

# Check Android SDK
echo ""
echo "Checking Android SDK..."
if [ -n "$ANDROID_HOME" ] || [ -n "$ANDROID_SDK_ROOT" ]; then
    echo "✅ Android SDK found at: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}"
elif [ -d "$HOME/Library/Android/sdk" ]; then
    echo "✅ Android SDK found at: $HOME/Library/Android/sdk"
    export ANDROID_HOME="$HOME/Library/Android/sdk"
else
    echo "❌ Android SDK not found"
    echo ""
    echo "📥 To install Android SDK:"
    echo "   1. Download Android Studio: https://developer.android.com/studio"
    echo "   2. Install Android Studio"
    echo "   3. Open Android Studio → More Actions → SDK Manager"
    echo "   4. Install Android SDK (latest version)"
    echo "   5. Set ANDROID_HOME environment variable:"
    echo "      export ANDROID_HOME=\$HOME/Library/Android/sdk"
    echo "      echo 'export ANDROID_HOME=\$HOME/Library/Android/sdk' >> ~/.zshrc"
    echo ""
    exit 1
fi

# Check Gradle
echo ""
echo "Checking Gradle..."
if command -v gradle &> /dev/null; then
    GRADLE_VERSION=$(gradle -v | grep "Gradle" | head -1)
    echo "✅ Gradle found: $GRADLE_VERSION"
else
    echo "⚠️  Gradle not in PATH (Gradle wrapper will be used)"
fi

echo ""
echo "✅ All prerequisites met!"
echo ""
echo "🚀 Ready to build APK!"
echo "   Run: ./build-apk.sh"
echo "   Then: cd android && ./gradlew assembleDebug"
