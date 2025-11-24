import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BiometricData } from '../utils/DemoBiometricSimulator';
import { SessionLog, sessionEngine } from '../services/SessionEngine';
import { cueManager, AudioCue, CueSet } from '../services/CueManager';
import { learningModule, LearningItem, MemoryTest } from '../services/LearningModule';
import { BiometricSource, BiometricStatus, DemoBiometricSource, RealBiometricSource } from '../services/BiometricSource';
import { CueOutput, PhoneSpeakerOutput, HubOutput, HubStatus } from '../services/CueOutput';

export interface AppSettings {
  demoMode: boolean;
  darkMode: boolean;
  maxCuesPerSession: number;
  minSecondsBetweenCues: number;
  movementThreshold: number;
  hrSpikeThreshold: number;
  useWearable: boolean;
}

interface AppContextType {
  // Core State
  demoMode: boolean;
  currentSession: SessionLog | null;
  currentBiometrics: BiometricData | null;
  settings: AppSettings;
  useWearable: boolean;
  biometricStatus: BiometricStatus | null;
  hubStatus: HubStatus | null;
  
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
  toggleDemoMode: () => void;
  toggleDarkMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
  
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
    useWearable: false,
  };

  const [currentSession, setCurrentSession] = useState<SessionLog | null>(null);
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData | null>(null);
  const [cues, setCues] = useState<AudioCue[]>([]);
  const [cueSets, setCueSets] = useState<CueSet[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [biometricStatus, setBiometricStatus] = useState<BiometricStatus | null>(null);
  const [hubStatus, setHubStatus] = useState<HubStatus | null>(null);
  const [initialized, setInitialized] = useState(false);

  const demoMode = !settings.useWearable;
  const useWearable = settings.useWearable;

  const biometricSourceRef = React.useRef<BiometricSource | null>(null);
  const cueOutputRef = React.useRef<CueOutput | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (initialized) {
      initializeServices();
    }
  }, [initialized]);

  useEffect(() => {
    if (!initialized) return;
    initializeServices();
  }, [useWearable]);

  useEffect(() => {
    // Update session engine settings when settings change
    sessionEngine.updateSettings({
      maxCuesPerSession: settings.maxCuesPerSession,
      minSecondsBetweenCues: settings.minSecondsBetweenCues,
      movementThreshold: settings.movementThreshold,
      hrSpikeThreshold: settings.hrSpikeThreshold,
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
        if (parsedSettings.useWearable === undefined && parsedSettings.demoMode !== undefined) {
          mergedSettings.useWearable = !parsedSettings.demoMode;
        }
        setSettings(mergedSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setSettings(DEFAULT_SETTINGS);
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
    await configureTransports();
  };

  const configureTransports = async () => {
    // Stop existing streams before switching
    if (biometricSourceRef.current) {
      await biometricSourceRef.current.stop();
    }

    if (demoMode) {
      biometricSourceRef.current = new DemoBiometricSource();
      cueOutputRef.current = new PhoneSpeakerOutput();
    } else {
      biometricSourceRef.current = new RealBiometricSource();
      cueOutputRef.current = new HubOutput();
    }

    if (biometricSourceRef.current?.onStatus) {
      biometricSourceRef.current.onStatus((status) => setBiometricStatus(status));
    }

    const nextBioStatus = biometricSourceRef.current?.getStatus?.() ?? null;
    if (nextBioStatus) setBiometricStatus(nextBioStatus);

    if (cueOutputRef.current && 'getHubStatus' in cueOutputRef.current) {
      const hub = await (cueOutputRef.current as HubOutput).getHubStatus();
      setHubStatus(hub);
    } else {
      setHubStatus(null);
    }
  };

  const startSession = async (notes?: string) => {
    const session = sessionEngine.startSession(notes);
    setCurrentSession(session);

    // Start biometric source
    if (biometricSourceRef.current) {
      if (biometricSourceRef.current.onStatus) {
        biometricSourceRef.current.onStatus((status) => setBiometricStatus(status));
      }
      biometricSourceRef.current.onData((data) => {
        setCurrentBiometrics(data);
        sessionEngine.logBiometrics(data);

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
      setBiometricStatus(biometricSourceRef.current.getStatus?.() ?? biometricStatus);
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

        if ('getHubStatus' in cueOutputRef.current) {
          const status = await (cueOutputRef.current as HubOutput).getHubStatus();
          setHubStatus(status);
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
  };

  const refreshCues = async () => {
    setCues(cueManager.getAllCues());
    setCueSets(cueManager.getAllCueSets());
  };

  const refreshLearning = async () => {
    setLearningItems(learningModule.getAllItems());
  };

  const toggleDemoMode = () => {
    const newMode = !demoMode;
    setSettings({ ...settings, demoMode: newMode, useWearable: !newMode });
  };

  const toggleDarkMode = () => {
    setSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    const merged = { ...settings, ...newSettings } as AppSettings;
    if (newSettings.useWearable !== undefined) {
      merged.demoMode = !newSettings.useWearable;
    }
    setSettings(merged);
  };

  const clearAllData = async () => {
    await learningModule.clearAllData();
    // Clear sessions and cues from AsyncStorage
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.multiRemove(['tmr_sessions', 'tmr_cues', 'tmr_cue_sets', 'tmr_learning_items', 'tmr_memory_tests']);
    await refreshCues();
    await refreshLearning();
  };

  const value: AppContextType = {
    demoMode,
    currentSession,
    currentBiometrics,
    settings,
    useWearable,
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
    toggleDemoMode,
    toggleDarkMode,
    updateSettings,
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
