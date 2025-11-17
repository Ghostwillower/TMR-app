# TMR App - Targeted Memory Reactivation

A mobile application for enhancing memory consolidation during sleep through Targeted Memory Reactivation (TMR).

## Implementation Roadmap

This app is being built following a 9-step roadmap, prioritizing demo mode first and preparing for real hardware integration later.

### Progress

- [x] **Step 1** – App shell and demo mode ✅
  - Navigation: Dashboard, Session, Cues, Learning, Reports, Settings
  - Global app state with demoMode
  - Demo biometric simulator (HR, movement, temp, sleep stages)
  - Session screen with Start/Pause/Stop controls
  - Real-time biometric display using simulated data
  
- [ ] **Step 2** – Real session engine and logging
- [ ] **Step 3** – Cue Manager and audio playback
- [ ] **Step 4** – Learning module and memory tests
- [ ] **Step 5** – Reports and history
- [ ] **Step 6** – Settings, safety, and UX
- [ ] **Step 7** – Better demo mode
- [ ] **Step 8** – Debug/dev tools (optional)
- [ ] **Step 9** – Prepare for real hardware integration

## Current Features (Step 1)

### Demo Mode
- Realistic sleep cycle simulation: Awake → Light → Deep → Light → REM
- Simulated biometric data:
  - Heart Rate (varies by sleep stage)
  - Movement (varies by sleep stage)
  - Temperature
  - Sleep Stage transitions
- Updates every 2 seconds

### Session Management
- Start/Pause/Stop session controls
- Real-time biometric display
- Session duration tracking
- Status indicators

### User Interface
- **Dashboard**: Overview and quick actions
- **Session**: Active session monitoring with live biometrics
- **Cues**: Placeholder (Coming in Step 3)
- **Learning**: Placeholder (Coming in Step 4)
- **Reports**: Placeholder (Coming in Step 5)
- **Settings**: Demo mode toggle and progress tracker

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

## Architecture

### Technology Stack
- **Framework**: Expo (React Native)
- **Language**: TypeScript
- **Navigation**: React Navigation (Bottom Tabs)
- **State Management**: React Context API
- **Demo Simulator**: Custom class with sleep cycle logic

### Project Structure
```
src/
├── contexts/         # React Context providers
│   └── AppContext.tsx
├── models/          # TypeScript interfaces (legacy, being phased out)
├── screens/         # Main application screens
│   ├── DashboardScreen.tsx
│   ├── SessionScreen.tsx
│   ├── CuesScreen.tsx
│   ├── LearningScreen.tsx
│   ├── ReportsScreen.tsx
│   └── SettingsScreen.tsx
├── services/        # Business logic (legacy, being refactored)
└── utils/           # Helper functions and utilities
    └── DemoBiometricSimulator.ts
```

## Demo Mode Features

The app currently runs in **Demo Mode** by default, which:
- Simulates realistic sleep cycles
- Generates biometric data based on sleep stage
- Provides the full user experience without hardware
- Can be toggled in Settings

### Sleep Stage Simulation

The simulator cycles through stages with realistic transitions:

| Stage | Duration | Heart Rate | Movement | Color |
|-------|----------|------------|----------|-------|
| Awake | 5 min | ~75 bpm | High (~50) | Red |
| Light | 10 min | ~65 bpm | Medium (~20) | Yellow |
| Deep | 15 min | ~55 bpm | Low (~5) | Blue |
| Light | 10 min | ~65 bpm | Medium (~20) | Yellow |
| REM | 10 min | ~70 bpm | Medium (~30) | Purple |

Occasional spikes in heart rate and movement are simulated (5% chance per reading).

## Future Hardware Integration

**Real Mode** (Step 9) will support:
- BLE wristband for biometric monitoring
- Wall hub for audio cue playback
- Abstracted interfaces for easy hardware swap

Currently, enabling "Real Mode" in settings will show a notice that it's not yet implemented.

## Development

### Current Sprint: Step 1 ✅

Step 1 is complete with:
- Working demo mode simulation
- Session start/pause/stop functionality
- Real-time biometric updates
- Clean navigation structure
- Settings with mode toggle

### Next Sprint: Step 2

Will implement:
- Session data model and persistence
- Biometric logging at fixed intervals
- cueAllowed logic based on sleep stage and movement
- Session summary view
- Local storage (JSON/AsyncStorage)

## Testing

The app is designed to be fully functional in demo mode, allowing testing without any hardware:

1. Launch the app
2. Navigate to Session screen
3. Press "Start Session"
4. Watch biometrics update in real-time
5. Observe sleep stage transitions
6. Press "Stop" to end the session

## License

MIT License

## Support

For issues or questions, please open an issue on the GitHub repository.
