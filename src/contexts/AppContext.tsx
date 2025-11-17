import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BiometricData } from '../utils/DemoBiometricSimulator';
import { SessionLog, sessionEngine } from '../services/SessionEngine';
import { cueManager, AudioCue, CueSet } from '../services/CueManager';
import { learningModule, LearningItem, MemoryTest } from '../services/LearningModule';
import { BiometricSource, DemoBiometricSource, RealBiometricSource } from '../services/BiometricSource';
import { CueOutput, PhoneSpeakerOutput, HubOutput } from '../services/CueOutput';

export interface AppSettings {
  demoMode: boolean;
  darkMode: boolean;
  maxCuesPerSession: number;
  minSecondsBetweenCues: number;
  movementThreshold: number;
  hrSpikeThreshold: number;
}

interface AppContextType {
  // Core State
  demoMode: boolean;
  currentSession: SessionLog | null;
  currentBiometrics: BiometricData | null;
  settings: AppSettings;
  
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
  const [demoMode, setDemoMode] = useState(true);
  const [currentSession, setCurrentSession] = useState<SessionLog | null>(null);
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData | null>(null);
  const [cues, setCues] = useState<AudioCue[]>([]);
  const [cueSets, setCueSets] = useState<CueSet[]>([]);
  const [learningItems, setLearningItems] = useState<LearningItem[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
    demoMode: true,
    darkMode: false,
    maxCuesPerSession: 10,
    minSecondsBetweenCues: 120,
    movementThreshold: 30,
    hrSpikeThreshold: 20,
  });

  const biometricSourceRef = React.useRef<BiometricSource | null>(null);
  const cueOutputRef = React.useRef<CueOutput | null>(null);

  useEffect(() => {
    initializeServices();
  }, []);

  useEffect(() => {
    // Update session engine settings when settings change
    sessionEngine.updateSettings({
      maxCuesPerSession: settings.maxCuesPerSession,
      minSecondsBetweenCues: settings.minSecondsBetweenCues,
      movementThreshold: settings.movementThreshold,
      hrSpikeThreshold: settings.hrSpikeThreshold,
    });
  }, [settings]);

  const initializeServices = async () => {
    await cueManager.initialize();
    await learningModule.initialize();
    await refreshCues();
    await refreshLearning();
    
    // Initialize biometric source and cue output based on mode
    if (demoMode) {
      biometricSourceRef.current = new DemoBiometricSource();
      cueOutputRef.current = new PhoneSpeakerOutput();
    } else {
      biometricSourceRef.current = new RealBiometricSource();
      cueOutputRef.current = new HubOutput();
    }
  };

  const startSession = async (notes?: string) => {
    const session = sessionEngine.startSession(notes);
    setCurrentSession(session);

    // Start biometric source
    if (biometricSourceRef.current) {
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
    setDemoMode(newMode);
    setSettings({ ...settings, demoMode: newMode });
    
    // Reinitialize biometric source and cue output
    if (newMode) {
      biometricSourceRef.current = new DemoBiometricSource();
      cueOutputRef.current = new PhoneSpeakerOutput();
    } else {
      biometricSourceRef.current = new RealBiometricSource();
      cueOutputRef.current = new HubOutput();
    }
  };

  const toggleDarkMode = () => {
    setSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings({ ...settings, ...newSettings });
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

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
