import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { BLEDevice, SleepSession, CueSet, LearningSession } from '../models/types';
import { bleService } from '../services/BLEService';
import { storageService } from '../services/StorageService';
import { sleepSessionManager } from '../services/SleepSessionManager';

interface AppContextType {
  // BLE State
  connectedWristband: BLEDevice | null;
  connectedHub: BLEDevice | null;
  isScanning: boolean;
  availableDevices: BLEDevice[];
  
  // Session State
  currentSession: SleepSession | null;
  currentSleepStage: string | null;
  
  // Data
  cueSets: CueSet[];
  learningSessions: LearningSession[];
  
  // Actions
  startScanning: () => void;
  stopScanning: () => void;
  connectDevice: (deviceId: string, type: 'WRISTBAND' | 'HUB') => Promise<void>;
  disconnectDevice: (type: 'WRISTBAND' | 'HUB') => Promise<void>;
  startSleepSession: (cueSetId?: string) => Promise<void>;
  endSleepSession: () => Promise<void>;
  loadCueSets: () => Promise<void>;
  loadLearningSessions: () => Promise<void>;
  saveCueSet: (cueSet: CueSet) => Promise<void>;
  saveLearningSession: (session: LearningSession) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [connectedWristband, setConnectedWristband] = useState<BLEDevice | null>(null);
  const [connectedHub, setConnectedHub] = useState<BLEDevice | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [availableDevices, setAvailableDevices] = useState<BLEDevice[]>([]);
  const [currentSession, setCurrentSession] = useState<SleepSession | null>(null);
  const [currentSleepStage, setCurrentSleepStage] = useState<string | null>(null);
  const [cueSets, setCueSets] = useState<CueSet[]>([]);
  const [learningSessions, setLearningSessions] = useState<LearningSession[]>([]);

  useEffect(() => {
    initializeBLE();
    loadCueSets();
    loadLearningSessions();
  }, []);

  const initializeBLE = async () => {
    try {
      await bleService.initialize();
    } catch (error) {
      console.error('BLE initialization error:', error);
    }
  };

  const startScanning = () => {
    setIsScanning(true);
    setAvailableDevices([]);
    
    bleService.scanForDevices(
      (device) => {
        setAvailableDevices(prev => {
          const exists = prev.find(d => d.id === device.id);
          if (exists) return prev;
          return [...prev, device];
        });
      },
      10000
    ).then(() => {
      setIsScanning(false);
    });
  };

  const stopScanning = () => {
    setIsScanning(false);
  };

  const connectDevice = async (deviceId: string, type: 'WRISTBAND' | 'HUB') => {
    try {
      await bleService.connectToDevice(deviceId, type);
      
      const device = availableDevices.find(d => d.id === deviceId);
      if (device) {
        const connectedDevice = { ...device, connected: true };
        if (type === 'WRISTBAND') {
          setConnectedWristband(connectedDevice);
        } else {
          setConnectedHub(connectedDevice);
        }
      }
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  };

  const disconnectDevice = async (type: 'WRISTBAND' | 'HUB') => {
    try {
      await bleService.disconnect(type);
      if (type === 'WRISTBAND') {
        setConnectedWristband(null);
      } else {
        setConnectedHub(null);
      }
    } catch (error) {
      console.error('Disconnection error:', error);
      throw error;
    }
  };

  const startSleepSession = async (cueSetId?: string) => {
    try {
      await sleepSessionManager.startSession(cueSetId);
      updateSessionState();
      
      // Set up periodic updates
      const interval = setInterval(() => {
        updateSessionState();
      }, 1000);
      
      return () => clearInterval(interval);
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  };

  const endSleepSession = async () => {
    try {
      await sleepSessionManager.endSession();
      setCurrentSession(null);
      setCurrentSleepStage(null);
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  };

  const updateSessionState = () => {
    const session = sleepSessionManager.getCurrentSession();
    const stage = sleepSessionManager.getCurrentStage();
    setCurrentSession(session);
    setCurrentSleepStage(stage);
  };

  const loadCueSets = async () => {
    try {
      const sets = await storageService.getAllCueSets();
      setCueSets(sets);
    } catch (error) {
      console.error('Error loading cue sets:', error);
    }
  };

  const loadLearningSessions = async () => {
    try {
      const sessions = await storageService.getAllLearningSessions();
      setLearningSessions(sessions);
    } catch (error) {
      console.error('Error loading learning sessions:', error);
    }
  };

  const saveCueSet = async (cueSet: CueSet) => {
    try {
      await storageService.saveCueSet(cueSet);
      await loadCueSets();
    } catch (error) {
      console.error('Error saving cue set:', error);
      throw error;
    }
  };

  const saveLearningSession = async (session: LearningSession) => {
    try {
      await storageService.saveLearningSession(session);
      await loadLearningSessions();
    } catch (error) {
      console.error('Error saving learning session:', error);
      throw error;
    }
  };

  const value: AppContextType = {
    connectedWristband,
    connectedHub,
    isScanning,
    availableDevices,
    currentSession,
    currentSleepStage,
    cueSets,
    learningSessions,
    startScanning,
    stopScanning,
    connectDevice,
    disconnectDevice,
    startSleepSession,
    endSleepSession,
    loadCueSets,
    loadLearningSessions,
    saveCueSet,
    saveLearningSession,
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
