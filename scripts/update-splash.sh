#!/bin/bash

# This script copies the penguin logo to Android splash screen directories
# Run this from the project root: bash scripts/update-splash.sh

SOURCE_IMAGE="public/penguin_logo.png"
TARGET_DIR="android/app/src/main/res/drawable"

if [ ! -f "$SOURCE_IMAGE" ]; then
  echo "Error: Source image not found at $SOURCE_IMAGE"
  exit 1
fi

# Copy to drawable directory (this is the main splash screen)
cp "$SOURCE_IMAGE" "$TARGET_DIR/splash.png"

echo "✅ Splash screen updated successfully!"
echo "📱 To see changes, rebuild the Android app:"
echo "   npm run build && npx cap sync android"
