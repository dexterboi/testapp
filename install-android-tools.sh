#!/bin/bash

# Automated installation script for Android build tools
# This script installs Java and guides Android Studio setup

echo "🚀 Installing Android Build Tools for PitchPerfect"
echo ""

# Check if Homebrew is installed
if ! command -v brew &> /dev/null; then
    echo "❌ Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

# Install Java
echo "📦 Installing Java JDK 17..."
if brew list --cask temurin &> /dev/null; then
    echo "✅ Java already installed"
else
    brew install --cask temurin
    echo "✅ Java installed!"
fi

# Verify Java installation
if command -v java &> /dev/null; then
    JAVA_VERSION=$(java -version 2>&1 | head -1)
    echo "✅ Java verified: $JAVA_VERSION"
else
    echo "⚠️  Java installed but not in PATH. You may need to restart your terminal."
fi

echo ""
echo "📥 Next: Install Android Studio"
echo ""
echo "1. Download Android Studio:"
echo "   https://developer.android.com/studio"
echo ""
echo "2. Install Android Studio (drag to Applications)"
echo ""
echo "3. Open Android Studio and complete the setup wizard"
echo "   (This will install Android SDK automatically)"
echo ""
echo "4. After Android Studio is installed, run:"
echo "   ./build-apk.sh"
echo "   npx cap open android"
echo ""
echo "✅ Java installation complete!"
echo "⏳ Waiting for Android Studio installation..."
