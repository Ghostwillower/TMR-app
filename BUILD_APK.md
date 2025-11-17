# Building APK for TMR App

This guide explains how to build an Android APK for the TMR (Targeted Memory Reactivation) app.

## Prerequisites

1. **Node.js and npm**: Ensure you have Node.js 18+ installed
2. **Expo CLI**: Install globally with `npm install -g expo-cli`
3. **EAS CLI**: Install globally with `npm install -g eas-cli`
4. **Expo Account**: Create a free account at [expo.dev](https://expo.dev)

## Method 1: Using EAS Build (Recommended)

EAS (Expo Application Services) Build is the recommended way to create production-ready APKs.

### Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Configure the project**:
   ```bash
   eas build:configure
   ```

### Build APK

**For testing (APK file)**:
```bash
npm run build:android:apk
```
or
```bash
eas build --platform android --profile preview
```

**For production (AAB file for Google Play)**:
```bash
npm run build:android:production
```

The build will be done on Expo's servers and you'll get a download link when complete.

### Download the APK

Once the build completes:
1. You'll receive a download link in the terminal
2. Or visit your Expo dashboard at https://expo.dev/accounts/[your-account]/projects/tmr-app/builds
3. Download the APK file to your computer
4. Transfer to your Android device and install

## Method 2: Local Build (Advanced)

For local builds without using Expo's cloud services:

### Prerequisites
- Android Studio with SDK installed
- Android SDK Build-Tools
- Java Development Kit (JDK) 11 or higher

### Build Locally

```bash
npm run build:android:apk -- --local
```

This requires:
- Android SDK configured properly
- Sufficient disk space (~10GB)
- All Android build tools installed

## Method 3: Development Build

For development and testing:

1. **Start the development server**:
   ```bash
   npm start
   ```

2. **Run on Android device/emulator**:
   ```bash
   npm run android
   ```

This uses Expo Go or a development build.

## Installing the APK

### On Physical Device

1. **Enable Unknown Sources**:
   - Go to Settings → Security
   - Enable "Install from Unknown Sources" or "Unknown Sources"

2. **Transfer APK**:
   - Download APK to device
   - Or transfer via USB/email/cloud storage

3. **Install**:
   - Tap the APK file
   - Follow installation prompts
   - Grant permissions when requested

### Permissions Required

The app requests these Android permissions:
- **Bluetooth** - For connecting to TMR wristband and wall hub
- **Location** - Required for BLE scanning on Android
- **Storage** - For saving session data and audio cues

## Build Profiles

### Preview (APK)
- Optimized for testing
- Generates APK file
- No app signing required
- Easy to distribute for testing

### Production (AAB)
- Optimized for Google Play Store
- Generates Android App Bundle
- Requires app signing
- Smaller download size for users

## Troubleshooting

### Build Fails
- Check that all dependencies are installed: `npm install`
- Verify Expo account is logged in: `eas whoami`
- Check build logs on Expo dashboard

### APK Won't Install
- Enable "Unknown Sources" in device settings
- Check available storage space
- Verify APK is not corrupted (re-download if needed)

### Bluetooth Permissions
- Grant all requested permissions during first launch
- Check app permissions in device settings if features don't work

## App Size

Expected APK sizes:
- Development build: ~50-80 MB
- Production build: ~30-50 MB (after optimization)

## Next Steps

After installing:
1. Launch the app
2. Complete the onboarding flow
3. Try the "Run 5-Minute Demo Night" in Settings
4. Explore all features in demo mode
5. When hardware is available, switch to Real Mode in Settings

## Production Deployment

For Google Play Store submission:
1. Build with production profile: `eas build --platform android --profile production`
2. Download the AAB file
3. Create app listing on Google Play Console
4. Upload AAB and complete store listing
5. Submit for review

## Support

For issues with:
- **Expo/EAS**: https://docs.expo.dev
- **TMR App**: Check the README.md and documentation files

## Notes

- First build may take 15-30 minutes
- Subsequent builds are faster (cached dependencies)
- APK files can be distributed directly (no Play Store needed)
- Demo mode works fully offline
- Real BLE mode requires actual hardware (coming soon)
