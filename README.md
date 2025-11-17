# TMR App - Targeted Memory Reactivation

A comprehensive mobile application for enhancing memory consolidation during sleep through Targeted Memory Reactivation (TMR).

## 🎉 All 9 Roadmap Steps Complete

This app follows a structured 9-step implementation roadmap, now fully complete:

✅ **Step 1** – App shell and demo mode  
✅ **Step 2** – Real session engine and logging  
✅ **Step 3** – Cue Manager and audio playback  
✅ **Step 4** – Learning module and memory tests  
✅ **Step 5** – Reports and history  
✅ **Step 6** – Settings, safety, and UX  
✅ **Step 7** – Better demo mode  
✅ **Step 8** – Debug/dev tools  
✅ **Step 9** – Hardware abstraction for real BLE integration  

## Features

### Core Functionality

**Session Management**
- Start/pause/stop sleep sessions with optional notes
- Real-time biometric monitoring (HR, movement, temperature, sleep stage)
- Automatic logging at fixed intervals
- Session summary with time spent in each sleep stage
- Persistent storage in local AsyncStorage

**Cue Management**
- Add, delete, rename, and toggle audio cues
- Create active cue sets for each session
- Test button to preview cues
- Low-volume playback (30%) during sleep
- Safety enforcement: cues only during Light/Deep stages

**Learning Module**
- Flashcard system with front/back text
- Link cues to specific learning items
- Pre-sleep and post-sleep testing
- Memory boost calculation (cued vs uncued performance)
- Correct/incorrect tracking for spaced repetition

**Reports & Analytics**
- Session history with date, duration, cues played
- Detailed session view:
  - Sleep stage timeline (visual progress bars)
  - Biometric summary (avg HR, movement)
  - Cue timestamps with sleep stages
  - Export session data as JSON
- Memory boost analysis when tests exist

**Safety Features**
- Cues only play during Light or Deep sleep (never Awake/REM)
- Movement threshold check (default: < 30)
- HR spike detection (default: < 20 bpm change)
- Cooldown period between cues (default: 120 seconds)
- Maximum cues per session (default: 10)
- All thresholds configurable in Settings

### Demo Mode

The app runs in **Demo Mode** by default with realistic sleep simulation:

**Sleep Cycle Simulation**
- Cycles through: Awake → Light → Deep → Light → REM (repeating)
- Stage durations: Awake (5m), Light (10m), Deep (15m), REM (10m)
- Updates every 2 seconds

**Biometric Simulation**
- Heart Rate varies by stage: Awake (75), Light (65), Deep (55), REM (70) bpm
- Movement varies by stage: Awake (50), Light (20), Deep (5), REM (30)
- Temperature: 36.5°C ± 0.25°C
- Random spikes (5% chance) to test safety logic

## Architecture

### Technology Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript (strict mode)
- **Navigation**: React Navigation (Bottom Tabs)
- **State Management**: React Context API
- **Storage**: AsyncStorage
- **Audio**: Expo AV

### Project Structure
```
src/
├── contexts/
│   └── AppContext.tsx         # Global state management
├── models/
│   └── types.ts               # Legacy types (being phased out)
├── screens/
│   ├── DashboardScreen.tsx    # Home overview
│   ├── SessionScreen.tsx      # Active session monitoring
│   ├── CuesScreen.tsx         # Cue management
│   ├── LearningScreen.tsx     # Flashcards and learning
│   ├── ReportsScreen.tsx      # Session history and analytics
│   └── SettingsScreen.tsx     # App configuration
├── services/
│   ├── SessionEngine.ts       # Session lifecycle and logging
│   ├── CueManager.ts          # Audio cue management
│   ├── LearningModule.ts      # Flashcards and tests
│   ├── BiometricSource.ts     # Input abstraction (Demo/Real)
│   └── CueOutput.ts           # Output abstraction (Phone/Hub)
└── utils/
    └── DemoBiometricSimulator.ts  # Realistic sleep simulation
```

### Hardware Abstraction (Step 9)

The app is architected for easy hardware integration:

**BiometricSource Interface**
- `DemoBiometricSource`: Current simulator (working)
- `RealBiometricSource`: Stub for future BLE wristband

**CueOutput Interface**
- `PhoneSpeakerOutput`: Current audio playback (working)
- `HubOutput`: Stub for future wall hub integration

The session engine depends only on these interfaces, making it trivial to swap implementations when real hardware is available.

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Expo CLI: `npm install -g expo-cli`
- For APK builds: EAS CLI `npm install -g eas-cli`
- iOS Simulator or Android Emulator (or physical device with Expo Go)

### Development

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

### Building APK for Android

**Quick Build** (using helper script):
```bash
./build-apk.sh
```

**Manual Build** (using EAS):
```bash
# Install EAS CLI
npm install -g eas-cli

# Login to Expo
eas login

# Build APK for testing
npm run build:android:apk
# or
eas build --platform android --profile preview

# Build for production (Google Play)
npm run build:android:production
```

📱 **See [BUILD_APK.md](./BUILD_APK.md) for complete build instructions, troubleshooting, and deployment guide.**

## Usage Guide

### 1. Quick Start (Demo Mode)

1. **Dashboard**: View app status and quick actions
2. **Session**: Press "Start Session" to begin monitoring
3. Watch live biometrics update in real-time
4. See sleep stage transitions (Awake → Light → Deep → REM)
5. Press "Stop" to end session and save data

### 2. Adding Cues

1. Navigate to **Cues** screen
2. Press "+ Add Cue" button
3. Enter cue name (audio file simulation in demo mode)
4. Create a cue set and activate it for your next session

### 3. Learning Items

1. Navigate to **Learning** screen
2. Press "+ Add Item" button
3. Enter question (front) and answer (back)
4. Optionally link to a cue for TMR
5. Use "Study" to practice with flashcards

### 4. Viewing Reports

1. Complete at least one sleep session
2. Navigate to **Reports** screen
3. Tap on any session to see detailed analytics
4. View sleep stage timeline, cue performance, biometrics
5. Export session data as JSON if needed

### 5. Configuring Safety

1. Navigate to **Settings** screen
2. Adjust cue safety parameters:
   - Max cues per session
   - Minimum seconds between cues
   - Movement threshold
   - HR spike threshold
3. Changes apply to all future sessions

## Safety Logic

The cue engine uses multiple safety checks:

```typescript
function isCueAllowed(data: BiometricData): boolean {
  // Rule 1: Stage must be Light or Deep
  if (stage !== 'Light' && stage !== 'Deep') return false;
  
  // Rule 2: Movement must be low
  if (movement > threshold) return false;
  
  // Rule 3: No HR spike
  if (abs(currentHR - lastHR) > threshold) return false;
  
  // Rule 4: Cooldown period
  if (timeSinceLastCue < minSeconds) return false;
  
  // Rule 5: Max cues per session
  if (cuesPlayed >= maxCues) return false;
  
  return true;
}
```

## Data Storage

All data is stored locally using AsyncStorage:

- **Sessions**: `tmr_sessions`
- **Cues**: `tmr_cues`
- **Cue Sets**: `tmr_cue_sets`
- **Learning Items**: `tmr_learning_items`
- **Memory Tests**: `tmr_memory_tests`

No cloud synchronization. Data stays on your device. Can be cleared via Settings → Clear All Data.

## Future: Real Hardware Integration

When BLE hardware becomes available:

1. **Wristband Integration**:
   - Update `RealBiometricSource` to connect via BLE
   - Read HR, movement, temperature, sleep stage characteristics
   - Service UUID: TBD by hardware vendor

2. **Wall Hub Integration**:
   - Update `HubOutput` to trigger audio via HTTP/WebSocket/BLE
   - Send cue ID and volume level
   - Connection endpoint: TBD by hardware vendor

3. **Toggle Mode**:
   - Settings → Demo Mode (OFF)
   - App will use real hardware implementations
   - All logic remains the same

## Development

### Testing
```bash
npm test
```

### Linting
```bash
npm run lint
```

### Building
```bash
# iOS
expo build:ios

# Android
expo build:android
```

## Troubleshooting

**Sessions not saving?**
- Check AsyncStorage permissions
- Try clearing app cache and restarting

**Cues not playing in demo mode?**
- This is normal - demo mode simulates playback without actual audio
- Audio files will work when added in real implementation

**Can't toggle Demo Mode off?**
- Real Mode shows "not implemented" notice
- This is intentional - BLE integration pending hardware availability

## Contributing

When contributing:
1. Follow existing TypeScript patterns
2. Maintain interface abstractions
3. Write tests for new features
4. Update documentation

## License

MIT License

## Support

For issues or questions, please open an issue on GitHub.
