import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BiometricData } from '../utils/DemoBiometricSimulator';

// Simple types for Step 1
export interface SessionData {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed';
  biometrics: BiometricData[];
  notes?: string;
}

export interface AppSettings {
  demoMode: boolean;
  darkMode: boolean;
  maxCuesPerSession: number;
  minSecondsBetweenCues: number;
}

interface AppContextType {
  // Core State
  demoMode: boolean;
  currentSession: SessionData | null;
  currentBiometrics: BiometricData | null;
  settings: AppSettings;
  
  // Session Actions
  startSession: () => void;
  pauseSession: () => void;
  stopSession: () => void;
  
  // Settings Actions
  toggleDemoMode: () => void;
  toggleDarkMode: () => void;
  updateSettings: (settings: Partial<AppSettings>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [demoMode, setDemoMode] = useState(true); // Start in demo mode
  const [currentSession, setCurrentSession] = useState<SessionData | null>(null);
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData | null>(null);
  const [settings, setSettings] = useState<AppSettings>({
    demoMode: true,
    darkMode: false,
    maxCuesPerSession: 10,
    minSecondsBetweenCues: 120,
  });

  const startSession = () => {
    const newSession: SessionData = {
      id: `session_${Date.now()}`,
      startTime: Date.now(),
      status: 'active',
      biometrics: [],
    };
    setCurrentSession(newSession);
  };

  const pauseSession = () => {
    if (currentSession) {
      setCurrentSession({ ...currentSession, status: 'paused' });
    }
  };

  const stopSession = () => {
    if (currentSession) {
      const endedSession = {
        ...currentSession,
        endTime: Date.now(),
        status: 'completed' as const,
      };
      setCurrentSession(null);
      // TODO: Save to local storage in Step 1
      console.log('Session ended:', endedSession);
    }
  };

  const toggleDemoMode = () => {
    setDemoMode(!demoMode);
    setSettings({ ...settings, demoMode: !demoMode });
  };

  const toggleDarkMode = () => {
    setSettings({ ...settings, darkMode: !settings.darkMode });
  };

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings({ ...settings, ...newSettings });
  };

  const value: AppContextType = {
    demoMode,
    currentSession,
    currentBiometrics,
    settings,
    startSession,
    pauseSession,
    stopSession,
    toggleDemoMode,
    toggleDarkMode,
    updateSettings,
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
