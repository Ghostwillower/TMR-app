# Quick APK Build Reference

## One-Command Build

```bash
./build-apk.sh
```

This interactive script will:
1. Check for EAS CLI (install if needed)
2. Prompt for Expo login
3. Install dependencies
4. Build the APK

## Manual Commands

### Using NPM Scripts

```bash
# Build APK for testing (cloud)
npm run build:android:apk

# Build APK locally (requires Android SDK)
npm run build:android:apk -- --local

# Build for Google Play Store
npm run build:android:production
```

### Using EAS Directly

```bash
# Preview APK (recommended for testing)
eas build --platform android --profile preview

# Local build
eas build --platform android --profile preview --local

# Production AAB
eas build --platform android --profile production
```

## First-Time Setup

```bash
# Install EAS CLI globally
npm install -g eas-cli

# Login to Expo (create free account at expo.dev)
eas login

# Configure project (run once)
eas build:configure
```

## Download & Install

1. Build completes → Get download link
2. Download APK to computer
3. Transfer to Android device
4. Enable "Unknown Sources" in device settings
5. Tap APK file to install

## Troubleshooting

**Build fails?**
- Run `npm install` first
- Check you're logged in: `eas whoami`
- View build logs on expo.dev dashboard

**Can't install APK?**
- Enable "Install from Unknown Sources"
- Check storage space
- Re-download if corrupted

## File Locations

- `eas.json` - Build configuration
- `app.json` - App configuration with package name
- `assets/` - App icons and splash screen
- `BUILD_APK.md` - Complete documentation

## App Info

- **Package name**: com.ghostwillower.tmrapp
- **Version**: 1.0.0
- **Min SDK**: Android 5.0+
- **Target SDK**: Latest Android

## Build Times

- **First build**: 15-30 minutes (downloads all dependencies)
- **Subsequent builds**: 5-15 minutes (uses cache)
- **Local builds**: 10-20 minutes (requires Android SDK)

## Distribution

After building:
- APK: Direct distribution (email, cloud, etc.)
- AAB: Upload to Google Play Store
- No signing required for testing builds

## Notes

- Free Expo account allows unlimited builds
- Cloud builds recommended (no local Android SDK needed)
- APK works on any Android 5.0+ device
- Demo mode works fully offline
- All features functional without hardware
