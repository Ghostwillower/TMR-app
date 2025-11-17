# TMR App - Targeted Memory Reactivation

A mobile application for enhancing memory consolidation during sleep through Targeted Memory Reactivation (TMR).

## Features

### Core Functionality
- **BLE Connectivity**: Connect to TMR wristband and wall hub via Bluetooth Low Energy
- **Sleep Session Management**: Track and manage sleep sessions with real-time monitoring
- **Biometric Data Collection**: Receive heart rate, movement, temperature data from wristband
- **Sleep Stage Detection**: Monitor and track sleep stages (AWAKE, NREM1, NREM2, NREM3, REM)
- **Smart Audio Cue Playback**: Automatically trigger audio cues during safe NREM periods
- **Local Data Storage**: All data stored locally using AsyncStorage
- **Cue Set Management**: Create and manage audio cue sets linked to learning sessions
- **Learning Session Tracking**: Track learning sessions and associate them with cue sets
- **Daily Reports**: Generate comprehensive sleep and memory performance reports

### User Interface
- **Home Screen**: Dashboard with device status, session overview, and quick actions
- **Devices Screen**: Scan for and manage BLE device connections
- **Session Screen**: Start/stop sleep sessions and monitor real-time progress
- **Cue Sets Screen**: Create and manage audio cue collections
- **Learning Screen**: Track learning sessions for memory enhancement
- **Reports Screen**: View detailed daily sleep and memory reports
- **Settings Screen**: App configuration and data management

## Architecture

### Technology Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs)
- **State Management**: React Context API
- **BLE**: react-native-ble-plx
- **Storage**: AsyncStorage
- **Audio**: Expo AV
- **Charts**: react-native-chart-kit

### Project Structure
```
src/
├── components/       # Reusable UI components
├── contexts/         # React Context providers
├── models/          # TypeScript interfaces and types
├── screens/         # Main application screens
├── services/        # Business logic and external integrations
│   ├── BLEService.ts           # Bluetooth connectivity
│   ├── StorageService.ts       # Local data persistence
│   ├── SleepSessionManager.ts  # Sleep session orchestration
│   └── ReportService.ts        # Report generation
└── utils/           # Helper functions and utilities
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS:
```bash
npm run ios
```

4. Run on Android:
```bash
npm run android
```

### BLE Device Requirements

The app expects TMR devices with the following characteristics:

**Wristband (Service UUID: 0000180d-0000-1000-8000-00805f9b34fb)**
- Heart Rate: 00002a37-0000-1000-8000-00805f9b34fb
- Movement: 00002a38-0000-1000-8000-00805f9b34fb
- Temperature: 00002a1c-0000-1000-8000-00805f9b34fb
- Sleep Stage: 00002a39-0000-1000-8000-00805f9b34fb

**Hub (Service UUID: 0000180a-0000-1000-8000-00805f9b34fb)**
- Audio Cue Trigger: 00002a3a-0000-1000-8000-00805f9b34fb

## Usage Workflow

1. **Setup Devices**
   - Navigate to Devices screen
   - Scan for TMR wristband and wall hub
   - Connect both devices

2. **Create Learning Content**
   - Go to Learning screen
   - Create a learning session (e.g., "Spanish Vocabulary")
   - Go to Cue Sets screen
   - Create a cue set with audio files for that learning session

3. **Start Sleep Session**
   - Navigate to Session screen
   - Select your cue set (optional)
   - Start the sleep session before going to sleep
   - The app will monitor sleep stages and play cues during NREM2/NREM3

4. **End Session & View Reports**
   - When you wake up, end the sleep session
   - Go to Reports screen to view your sleep quality and memory performance
   - Review recommendations for improvement

## Safety Features

- **NREM-Only Playback**: Audio cues only play during NREM2 and NREM3 stages to avoid disrupting REM sleep
- **Local Storage**: All data remains on your device - no cloud uploads
- **Non-Intrusive**: Cues play at low volume to maintain sleep quality

## Data Privacy

All data is stored locally on your device using AsyncStorage. No data is transmitted to external servers. You can clear all data at any time from the Settings screen.

## Development

### Linting
```bash
npm run lint
```

### Testing
```bash
npm test
```

## License

MIT License

## Support

For issues or questions, please open an issue on the GitHub repository.
