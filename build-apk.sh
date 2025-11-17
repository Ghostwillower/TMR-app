#!/bin/bash
# Quick build script for TMR App APK

set -e

echo "================================================"
echo "TMR App - Android APK Build Script"
echo "================================================"
echo ""

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "❌ EAS CLI not found. Installing..."
    npm install -g eas-cli
fi

# Check if logged in to Expo
if ! eas whoami &> /dev/null; then
    echo "📝 Please login to Expo:"
    eas login
fi

echo ""
echo "🔧 Installing dependencies..."
npm install

echo ""
echo "🏗️  Building Android APK..."
echo ""
echo "Choose build method:"
echo "  1) Cloud build (recommended - requires internet)"
echo "  2) Local build (requires Android SDK)"
echo ""
read -p "Enter choice (1 or 2): " choice

case $choice in
    1)
        echo ""
        echo "🌐 Starting cloud build with EAS..."
        eas build --platform android --profile preview
        echo ""
        echo "✅ Build complete! Download link above."
        ;;
    2)
        echo ""
        echo "💻 Starting local build..."
        eas build --platform android --profile preview --local
        echo ""
        echo "✅ Build complete! APK saved locally."
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "================================================"
echo "Next steps:"
echo "  1. Download the APK file"
echo "  2. Transfer to your Android device"
echo "  3. Enable 'Unknown Sources' in device settings"
echo "  4. Install the APK"
echo "  5. Launch TMR App and enjoy!"
echo "================================================"
