# TMR App Developer Guide

## Project Overview

This is a React Native mobile application built with Expo for Targeted Memory Reactivation (TMR). The app connects to BLE devices (wristband and wall hub) to monitor sleep and play audio cues during optimal sleep stages.

## Tech Stack

- **Framework**: Expo SDK 51
- **Language**: TypeScript
- **UI**: React Native with custom styling
- **Navigation**: React Navigation (Bottom Tabs)
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **BLE**: react-native-ble-plx
- **Audio**: Expo AV
- **Testing**: Jest + React Native Testing Library

## Project Structure

```
TMR-app/
├── src/
│   ├── components/          # Reusable UI components
│   ├── contexts/           # React Context providers
│   │   └── AppContext.tsx  # Main app state management
│   ├── models/             # TypeScript interfaces
│   │   └── types.ts        # All data models
│   ├── screens/            # App screens
│   │   ├── HomeScreen.tsx
│   │   ├── DevicesScreen.tsx
│   │   ├── SessionScreen.tsx
│   │   ├── CueSetsScreen.tsx
│   │   ├── LearningScreen.tsx
│   │   ├── ReportsScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── services/           # Business logic
│   │   ├── BLEService.ts           # Bluetooth connectivity
│   │   ├── StorageService.ts       # Data persistence
│   │   ├── SleepSessionManager.ts  # Session orchestration
│   │   └── ReportService.ts        # Report generation
│   └── utils/              # Helper functions
├── __tests__/              # Test files
├── assets/                 # Images and media
├── App.tsx                 # Root component
├── index.js                # Entry point
└── package.json            # Dependencies
```

## Key Features Implementation

### 1. BLE Connectivity (BLEService.ts)

The BLE service handles all Bluetooth communication:

```typescript
// Initialize BLE
await bleService.initialize();

// Scan for devices
bleService.scanForDevices((device) => {
  console.log('Found device:', device);
}, 10000);

// Connect to device
await bleService.connectToDevice(deviceId, 'WRISTBAND');

// Monitor biometric data
bleService.onBiometricData((data) => {
  console.log('Heart rate:', data.heartRate);
});
```

**Device UUIDs:**
- Wristband Service: `0000180d-0000-1000-8000-00805f9b34fb`
- Hub Service: `0000180a-0000-1000-8000-00805f9b34fb`

### 2. Sleep Session Management

The SleepSessionManager orchestrates the entire sleep tracking process:

```typescript
// Start session
const sessionId = await sleepSessionManager.startSession(cueSetId);

// Session automatically:
// - Monitors biometric data
// - Tracks sleep stages
// - Plays cues during NREM2/NREM3
// - Records all data

// End session
await sleepSessionManager.endSession();
// Automatically generates daily report
```

### 3. Data Storage

All data is stored locally using AsyncStorage:

```typescript
// Save sleep session
await storageService.saveSleepSession(session);

// Retrieve sessions
const sessions = await storageService.getAllSleepSessions();

// Get reports
const report = await storageService.getSleepReportByDate(date);
```

### 4. Safety Features

**NREM-Only Audio Playback:**
The app only triggers audio cues during safe sleep stages (NREM2 and NREM3):

```typescript
private isSafeNREMPeriod(stage: string): boolean {
  return stage === 'NREM2' || stage === 'NREM3';
}
```

This prevents disrupting REM sleep and light sleep stages.

### 5. Report Generation

Daily reports are automatically generated when a sleep session ends:

```typescript
const report = await reportService.generateDailyMemoryReport(date);

// Report includes:
// - Learning sessions count
// - Cues played
// - Sleep quality correlation
// - Personalized recommendations
```

## Development Workflow

### Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Start development server:**
```bash
npm start
```

3. **Run on platform:**
```bash
npm run ios      # iOS
npm run android  # Android
npm run web      # Web (limited BLE support)
```

### Testing

Run tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

### Linting

```bash
npm run lint
```

## BLE Device Requirements

### Wristband Specifications

The wristband must expose these characteristics:

| Characteristic | UUID | Type | Description |
|----------------|------|------|-------------|
| Heart Rate | `00002a37...` | Notify | Heart rate in BPM |
| Movement | `00002a38...` | Notify | Movement score (0-100) |
| Temperature | `00002a1c...` | Notify | Skin temperature in °C |
| Sleep Stage | `00002a39...` | Notify | Sleep stage code (0-4) |

**Sleep Stage Codes:**
- 0: AWAKE
- 1: NREM1
- 2: NREM2
- 3: NREM3
- 4: REM

### Wall Hub Specifications

The hub must expose:

| Characteristic | UUID | Type | Description |
|----------------|------|------|-------------|
| Cue Trigger | `00002a3a...` | Write | Audio cue ID to play |

## State Management

The app uses React Context API for global state:

```typescript
const {
  connectedWristband,      // BLE device state
  connectedHub,
  currentSession,          // Active sleep session
  currentSleepStage,       // Current sleep stage
  cueSets,                 // Available cue sets
  learningSessions,        // Learning sessions
  startSleepSession,       // Actions
  endSleepSession,
  // ... more actions
} = useApp();
```

## Adding New Features

### Adding a New Screen

1. Create screen component in `src/screens/`
2. Add route to `App.tsx` navigation
3. Update context if new state is needed
4. Add tests in `__tests__/`

### Adding a New Service

1. Create service class in `src/services/`
2. Export singleton instance
3. Add to AppContext if state is needed
4. Write unit tests

### Adding New Data Models

1. Add TypeScript interfaces to `src/models/types.ts`
2. Update StorageService for persistence
3. Update relevant screens and services

## Performance Considerations

1. **BLE Monitoring**: Data is buffered and processed in batches
2. **Storage**: AsyncStorage is asynchronous to prevent UI blocking
3. **State Updates**: Context updates are optimized to prevent unnecessary re-renders
4. **Audio Playback**: Cues are played at low volume (0.3) to minimize sleep disruption

## Security & Privacy

- All data is stored locally on the device
- No cloud synchronization or external API calls
- BLE communication is encrypted by the OS
- Users can clear all data from Settings

## Troubleshooting

### BLE Connection Issues

- Ensure Bluetooth is enabled
- Grant location permissions (required for BLE on Android)
- Check device battery and range
- Restart the app and rescan

### Build Issues

- Clear cache: `expo start -c`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check Expo SDK compatibility

## Future Enhancements

Potential features to add:

1. **Cloud Backup**: Optional data synchronization
2. **Advanced Analytics**: Machine learning for sleep pattern analysis
3. **Social Features**: Share achievements with friends
4. **Custom Cue Creation**: Record audio within the app
5. **Wearable Integration**: Support for additional fitness trackers
6. **Export Data**: CSV/PDF export for reports

## Contributing

When contributing:

1. Follow TypeScript strict mode
2. Write tests for new features
3. Update documentation
4. Follow existing code style
5. Test on both iOS and Android

## Support

For questions or issues:
- Check existing GitHub issues
- Review this documentation
- Contact the development team
