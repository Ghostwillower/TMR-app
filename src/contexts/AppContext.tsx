import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BiometricData } from '../utils/DemoBiometricSimulator';
import { AdaptiveState, SessionHardwareProvenance, SessionLog, sessionEngine } from '../services/SessionEngine';
import { cueManager, AudioCue, CueSet } from '../services/CueManager';
import { learningModule, LearningItem, MemoryTest } from '../services/LearningModule';
import { BiometricSource, DemoBiometricSource, RealBiometricSource, BiometricStatus } from '../services/BiometricSource';
import { CueOutput, PhoneSpeakerOutput, HubOutput, OutputStatus } from '../services/CueOutput';
import { backupService } from '../services/BackupService';
import type { BackupStrategy } from '../services/BackupService';

export interface AppSettings {
  demoMode: boolean;
  darkMode: boolean;
  maxCuesPerSession: number;
  minSecondsBetweenCues: number;
  movementThreshold: number;
  hrSpikeThreshold: number;
  adaptiveModeEnabled: boolean;
  adaptiveMovementSensitivity: number;
  adaptiveHRSensitivity: number;
}

interface AppContextType {
  // Core State
  demoMode: boolean;
  currentSession: SessionLog | null;
  currentBiometrics: BiometricData | null;
  adaptiveState: AdaptiveState | null;
  settings: AppSettings;
  biometricStatus: BiometricStatus | null;
  hubStatus: OutputStatus | null;

  // Session Actions
  startSession: (notes?: string) => Promise<void>;
  pauseSession: () => void;
  resumeSession: () => void;
  stopSession: () => Promise<void>;
  
  // Cue Management
  cues: AudioCue[];
  cueSets: CueSet[];
  refreshCues: () => Promise<void>;
  
  // Learning Management
  learningItems: LearningItem[];
  refreshLearning: () => Promise<void>;

  // Settings Actions
  setDemoMode: (value: boolean) => Promise<void>;
  toggleDarkMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  reconnectHardware: () => Promise<void>;

  // Backup & Restore
  exportBackup: (passphrase: string) => Promise<string>;
  importBackup: (fileUri: string, passphrase: string, strategy: BackupStrategy) => Promise<void>;

  // Utility
  clearAllData: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const DEFAULT_SETTINGS: AppSettings = {
    demoMode: true,
    darkMode: false,
    maxCuesPerSession: 10,
    minSecondsBetweenCues: 120,
    movementThreshold: 30,
    hrSpikeThreshold: 20,
    adaptiveModeEnabled: false,
    adaptiveMovementSensitivity: 0.5,
    adaptiveHRSensitivity: 0.5,
  };

  const [demoMode, setDemoModeState] = useState(DEFAULT_SETTINGS.demoMode);
  const [currentSession, setCurrentSession] = useState<SessionLog | null>(null);
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData | null>(null);
  const [adaptiveState, setAdaptiveState] = useState<AdaptiveState | null>(null);
  const [cues, setCues] = useState<AudioCue[]>([]);
  const [cueSets, setCueSets] = useState<CueSet[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [initialized, setInitialized] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [hubStatus, setHubStatus] = useState<OutputStatus | null>(null);

  const biometricSourceRef = React.useRef<BiometricSource | null>(null);
  const cueOutputRef = React.useRef<CueOutput | null>(null);

  const attachBiometricStatusListener = (source: BiometricSource | null) => {
    if (!source || !source.onStatusChange) return;
    source.onStatusChange((status) => setBiometricStatus({ ...status }));
    const status = source.getStatus?.();
    if (status) {
      setBiometricStatus({ ...status });
    }
  };

  const attachOutputStatusListener = (output: CueOutput | null) => {
    if (!output || !output.onStatusChange) return;
    output.onStatusChange((status) => setHubStatus({ ...status }));
    const status = output.getStatus?.();
    if (status) {
      setHubStatus({ ...status });
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (initialized) {
      initializeServices();
    }
  }, [initialized]);

  useEffect(() => {
    // Update session engine settings when settings change
    sessionEngine.updateSettings({
      maxCuesPerSession: settings.maxCuesPerSession,
      minSecondsBetweenCues: settings.minSecondsBetweenCues,
      movementThreshold: settings.movementThreshold,
      hrSpikeThreshold: settings.hrSpikeThreshold,
      adaptiveModeEnabled: settings.adaptiveModeEnabled,
      adaptiveMovementSensitivity: settings.adaptiveMovementSensitivity,
      adaptiveHRSensitivity: settings.adaptiveHRSensitivity,
    });
  }, [settings]);

  useEffect(() => {
    if (!initialized) return;

    const persistSettings = async () => {
      try {
        await AsyncStorage.setItem('tmr_settings', JSON.stringify(settings));
      } catch (error) {
        console.error('Error saving settings:', error);
      }
    };

    persistSettings();
  }, [settings, initialized]);

  const loadSettings = async () => {
    try {
      const storedSettings = await AsyncStorage.getItem('tmr_settings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings) as Partial<AppSettings>;
          const mergedSettings = { ...DEFAULT_SETTINGS, ...parsedSettings } as AppSettings;
          setSettings(mergedSettings);
        setDemoModeState(parsedSettings.demoMode ?? DEFAULT_SETTINGS.demoMode);
        }
      } catch (error) {
        console.error('Error loading settings:', error);
        setSettings(DEFAULT_SETTINGS);
      setDemoModeState(DEFAULT_SETTINGS.demoMode);
      } finally {
        setInitialized(true);
      }
    };

  const initializeServices = async () => {
    await cueManager.initialize();
    await learningModule.initialize();
    await refreshCues();
    await refreshLearning();
    
    // Initialize biometric source and cue output based on mode
    if (demoMode) {
      biometricSourceRef.current = new DemoBiometricSource();
      cueOutputRef.current = new PhoneSpeakerOutput();
      setHubStatus(cueOutputRef.current.getStatus?.() ?? { connected: true });
      attachBiometricStatusListener(biometricSourceRef.current);
      attachOutputStatusListener(cueOutputRef.current);
    } else {
      biometricSourceRef.current = new RealBiometricSource();
      cueOutputRef.current = new HubOutput();
      attachBiometricStatusListener(biometricSourceRef.current);
      attachOutputStatusListener(cueOutputRef.current);
    }
  };

  const reconnectHardware = async () => {
    if (biometricSourceRef.current instanceof RealBiometricSource) {
      attachBiometricStatusListener(biometricSourceRef.current);
      try {
        await biometricSourceRef.current.start();
      } catch (error) {
        console.warn('Biometric reconnect failed', error);
      }
      const latest = biometricSourceRef.current.getStatus?.();
      if (latest) setBiometricStatus({ ...latest });
    } else if (biometricSourceRef.current) {
      attachBiometricStatusListener(biometricSourceRef.current);
    }

    if (cueOutputRef.current instanceof HubOutput) {
      attachOutputStatusListener(cueOutputRef.current);
      try {
        await cueOutputRef.current.ensureHubConnection();
      } catch (error) {
        console.warn('Hub reconnect failed', error);
      }
      const latestHubStatus = cueOutputRef.current.getStatus?.();
      if (latestHubStatus) setHubStatus({ ...latestHubStatus });
    } else if (cueOutputRef.current) {
      attachOutputStatusListener(cueOutputRef.current);
      const fallbackStatus = cueOutputRef.current.getStatus?.();
      if (fallbackStatus) setHubStatus({ ...fallbackStatus });
    }
  };

  const buildSessionHardware = (): SessionHardwareProvenance => {
    const biometricProvenance = biometricSourceRef.current?.getProvenance?.();
    const outputProvenance = cueOutputRef.current?.getProvenance?.();

    return {
      biometric: {
        mode: biometricProvenance?.mode ?? (demoMode ? 'demo' : 'ble'),
        deviceId: biometricProvenance?.deviceId ?? null,
        deviceName: biometricProvenance?.deviceName ?? null,
      },
      cueOutput: {
        mode: outputProvenance?.mode ?? (demoMode ? 'phone' : 'hub'),
        deviceId: outputProvenance?.deviceId ?? null,
        deviceName: outputProvenance?.deviceName ?? null,
      },
    };
  };

  const startSession = async (notes?: string) => {
    if (!biometricSourceRef.current || !cueOutputRef.current) {
      await initializeServices();
    }

    if (!demoMode) {
      await reconnectHardware();
      if (!biometricSourceRef.current?.isConnected()) {
        Alert.alert('Wristband not connected', 'Please pair a sleep wearable before starting a real session.');
        return;
      }
    }

    const session = sessionEngine.startSession(notes, Date.now(), buildSessionHardware());
    setCurrentSession(session);
    setAdaptiveState({ ...sessionEngine.getAdaptiveState() });

    // Start biometric source
    if (biometricSourceRef.current) {
      biometricSourceRef.current.onData((data) => {
        setCurrentBiometrics(data);
        sessionEngine.logBiometrics(data);
        setAdaptiveState({ ...sessionEngine.getAdaptiveState() });

        // Check if cue should be played
        if (sessionEngine.isCueAllowed(data)) {
          const enabledCues = cueManager.getEnabledCuesFromActiveSet();
          if (enabledCues.length > 0) {
            const randomCue = enabledCues[Math.floor(Math.random() * enabledCues.length)];
            playCueIfAllowed(randomCue, data.sleepStage);
          }
        }
      });

      await biometricSourceRef.current.start();
    }
  };

  const playCueIfAllowed = async (cue: AudioCue, sleepStage: string) => {
    if (cueOutputRef.current) {
      try {
        await cueOutputRef.current.playCue(cue.id, cue.name, 0.3);
        sessionEngine.playCue(cue.id, cue.name, sleepStage);
        
        // Update session state
        const updatedSession = sessionEngine.getCurrentSession();
        if (updatedSession) {
          setCurrentSession({ ...updatedSession });
        }
      } catch (error) {
        console.error('Error playing cue:', error);
      }
    }
  };

  const pauseSession = () => {
    sessionEngine.pauseSession();
    const session = sessionEngine.getCurrentSession();
    if (session) {
      setCurrentSession({ ...session });
    }
  };

  const resumeSession = () => {
    sessionEngine.resumeSession();
    const session = sessionEngine.getCurrentSession();
    if (session) {
      setCurrentSession({ ...session });
    }
  };

  const stopSession = async () => {
    if (biometricSourceRef.current) {
      await biometricSourceRef.current.stop();
    }
    
    await sessionEngine.endSession();
    setCurrentSession(null);
    setCurrentBiometrics(null);
    setAdaptiveState(null);
  };

  const refreshCues = async () => {
    setCues(cueManager.getAllCues());
    setCueSets(cueManager.getAllCueSets());
  };

  const refreshLearning = async () => {
    setLearningItems(learningModule.getAllItems());
  };

  const setDemoMode = async (value: boolean) => {
    setSettings((prev) => ({ ...prev, demoMode: value }));
    setDemoModeState(value);

    if (biometricSourceRef.current) {
      await biometricSourceRef.current.stop();
    }
    if (cueOutputRef.current) {
      await cueOutputRef.current.stopCue();
    }

    if (value) {
      biometricSourceRef.current = new DemoBiometricSource();
      cueOutputRef.current = new PhoneSpeakerOutput();
      attachBiometricStatusListener(biometricSourceRef.current);
      attachOutputStatusListener(cueOutputRef.current);
      setHubStatus(cueOutputRef.current.getStatus?.() ?? { connected: true });
    } else {
      biometricSourceRef.current = new RealBiometricSource();
      cueOutputRef.current = new HubOutput();
      attachBiometricStatusListener(biometricSourceRef.current);
      attachOutputStatusListener(cueOutputRef.current);
      setHubStatus(cueOutputRef.current.getStatus?.() ?? null);
      await reconnectHardware();
    }
  };

  const toggleDarkMode = () => {
    setSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const applySettingsFromBackup = (incoming: AppSettings | undefined) => {
    const merged = { ...DEFAULT_SETTINGS, ...incoming } as AppSettings;
    setSettings(merged);
    void setDemoMode(merged.demoMode);
  };

  const exportBackup = async (passphrase: string): Promise<string> => {
    return backupService.exportEncryptedBackup(passphrase);
  };

  const importBackup = async (
    fileUri: string,
    passphrase: string,
    strategy: BackupStrategy = 'merge'
  ): Promise<void> => {
    const data = await backupService.importFromFile(fileUri, passphrase, strategy);
    applySettingsFromBackup(data.settings);
    await cueManager.initialize();
    await learningModule.initialize();
    await refreshCues();
    await refreshLearning();
  };

  const clearAllData = async () => {
    await learningModule.clearAllData();
    // Clear sessions and cues from AsyncStorage
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.multiRemove([
      'tmr_sessions',
      'tmr_cues',
      'tmr_cue_sets',
      'tmr_learning_items',
      'tmr_memory_tests',
      'tmr_settings',
    ]);
    applySettingsFromBackup(DEFAULT_SETTINGS);
    await refreshCues();
    await refreshLearning();
  };

  const value: AppContextType = {
    demoMode,
    currentSession,
    currentBiometrics,
    adaptiveState,
    settings,
    biometricStatus,
    hubStatus,
    cues,
    cueSets,
    learningItems,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    refreshCues,
    refreshLearning,
    setDemoMode,
    toggleDarkMode,
    updateSettings,
    reconnectHardware,
    exportBackup,
    importBackup,
    clearAllData,
  };

  if (!initialized) {
    return null;
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
