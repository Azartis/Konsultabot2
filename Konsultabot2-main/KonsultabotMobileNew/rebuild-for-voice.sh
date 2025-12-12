#!/bin/bash
# Shell script to rebuild the app for voice recognition
# This is REQUIRED for @react-native-voice/voice to work

echo "========================================"
echo "  Rebuilding App for Voice Recognition"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "app.config.js" ]; then
    echo "❌ Error: app.config.js not found!"
    echo "Please run this script from the KonsultabotMobileNew directory"
    exit 1
fi

echo "Step 1: Cleaning previous builds..."
if [ -d "android" ]; then
    rm -rf android
    echo "✅ Removed android directory"
fi

if [ -d "ios" ]; then
    rm -rf ios
    echo "✅ Removed ios directory"
fi

echo ""
echo "Step 2: Running expo prebuild..."
npx expo prebuild --clean

if [ $? -ne 0 ]; then
    echo "❌ Prebuild failed!"
    exit 1
fi

echo ""
echo "Step 3: Building and running on Android..."
echo "This will take a few minutes..."
echo ""

npx expo run:android

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Build failed!"
    echo ""
    echo "Alternative: Create EAS development build:"
    echo "  eas build --profile development --platform android"
    exit 1
fi

echo ""
echo "✅ Build complete! Voice recognition should now work."
echo ""
echo "Note: If you're using Expo Go, voice recognition will NOT work."
echo "You MUST use the development build created above."

