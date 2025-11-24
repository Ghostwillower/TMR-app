// Session Engine - Handles session lifecycle, logging, and cue logic
import { BiometricData } from '../utils/DemoBiometricSimulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionLog {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
  biometricLogs: BiometricData[];
  stageTimings: {
    Awake: number;
    Light: number;
    Deep: number;
    REM: number;
  };
  cueAllowedCount: number;
  cuesPlayed: CuePlayEvent[];
}

export interface CuePlayEvent {
  timestamp: number;
  cueId: string;
  cueName: string;
  sleepStage: string;
}

export class SessionEngine {
  private currentSession: SessionLog | null = null;
  private logInterval: NodeJS.Timeout | null = null;
  private stageStartTime: number = 0;
  private currentStage: string = 'Awake';
  private lastCueTime: number = 0;
  
  // Cue safety settings
  private minSecondsBetweenCues: number = 120;
  private maxCuesPerSession: number = 10;
  private movementThreshold: number = 30;
  private hrSpikeThreshold: number = 20;
  private lastHR: number = 70;

  startSession(notes?: string, startTime: number = Date.now()): SessionLog {
    this.currentSession = {
      id: `session_${startTime}`,
      startTime,
      status: 'active',
      notes,
      biometricLogs: [],
      stageTimings: {
        Awake: 0,
        Light: 0,
        Deep: 0,
        REM: 0,
      },
      cueAllowedCount: 0,
      cuesPlayed: [],
    };

    this.stageStartTime = startTime;
    this.currentStage = 'Awake';
    this.lastCueTime = 0;

    return this.currentSession;
  }

  logBiometrics(data: BiometricData, timestampOverride?: number): void {
    if (!this.currentSession || this.currentSession.status !== 'active') return;

    const now = timestampOverride ?? data.timestamp ?? Date.now();

    // Add to biometric logs
    this.currentSession.biometricLogs.push(data);

    // Update stage timings if stage changed
    if (data.sleepStage !== this.currentStage) {
      const elapsed = now - this.stageStartTime;
      if (this.currentStage in this.currentSession.stageTimings) {
        this.currentSession.stageTimings[this.currentStage as keyof typeof this.currentSession.stageTimings] += elapsed;
      }
      this.currentStage = data.sleepStage;
      this.stageStartTime = now;
    }

    // Check if cue is allowed
    if (this.isCueAllowed(data, now)) {
      this.currentSession.cueAllowedCount++;
    }

    this.lastHR = data.heartRate;
  }

  isCueAllowed(data: BiometricData, currentTime: number = Date.now()): boolean {
    if (!this.currentSession) return false;

    // Rule 1: Stage must be Light or Deep
    if (data.sleepStage !== 'Light' && data.sleepStage !== 'Deep') {
      return false;
    }

    // Rule 2: Movement must be low
    if (data.movement > this.movementThreshold) {
      return false;
    }

    // Rule 3: No HR spike
    const hrChange = Math.abs(data.heartRate - this.lastHR);
    if (hrChange > this.hrSpikeThreshold) {
      return false;
    }

    // Rule 4: Cooldown period
    const timeSinceLastCue = (currentTime - this.lastCueTime) / 1000;
    if (this.lastCueTime > 0 && timeSinceLastCue < this.minSecondsBetweenCues) {
      return false;
    }

    // Rule 5: Max cues per session
    if (this.currentSession.cuesPlayed.length >= this.maxCuesPerSession) {
      return false;
    }

    return true;
  }

  playCue(cueId: string, cueName: string, sleepStage: string, timestamp: number = Date.now()): void {
    if (!this.currentSession) return;

    const cueEvent: CuePlayEvent = {
      timestamp,
      cueId,
      cueName,
      sleepStage,
    };

    this.currentSession.cuesPlayed.push(cueEvent);
    this.lastCueTime = timestamp;
  }

  pauseSession(currentTime: number = Date.now()): void {
    if (this.currentSession) {
      // Update current stage timing
      const elapsed = currentTime - this.stageStartTime;
      if (this.currentStage in this.currentSession.stageTimings) {
        this.currentSession.stageTimings[this.currentStage as keyof typeof this.currentSession.stageTimings] += elapsed;
      }

      this.currentSession.status = 'paused';
    }
  }

  resumeSession(currentTime: number = Date.now()): void {
    if (this.currentSession) {
      this.currentSession.status = 'active';
      this.stageStartTime = currentTime;
    }
  }

  async endSession(currentTime: number = Date.now()): Promise<SessionLog | null> {
    if (!this.currentSession) return null;

    // Update final stage timing
    const elapsed = currentTime - this.stageStartTime;
    if (this.currentStage in this.currentSession.stageTimings) {
      this.currentSession.stageTimings[this.currentStage as keyof typeof this.currentSession.stageTimings] += elapsed;
    }

    this.currentSession.endTime = currentTime;
    this.currentSession.status = 'completed';

    // Save to storage
    await this.saveSession(this.currentSession);

    const completedSession = this.currentSession;
    this.currentSession = null;
    return completedSession;
  }

  getCurrentSession(): SessionLog | null {
    return this.currentSession;
  }

  getSessionDuration(): number {
    if (!this.currentSession) return 0;
    const endTime = this.currentSession.endTime || Date.now();
    return endTime - this.currentSession.startTime;
  }

  updateSettings(settings: {
    minSecondsBetweenCues?: number;
    maxCuesPerSession?: number;
    movementThreshold?: number;
    hrSpikeThreshold?: number;
  }): void {
    if (settings.minSecondsBetweenCues !== undefined) {
      this.minSecondsBetweenCues = settings.minSecondsBetweenCues;
    }
    if (settings.maxCuesPerSession !== undefined) {
      this.maxCuesPerSession = settings.maxCuesPerSession;
    }
    if (settings.movementThreshold !== undefined) {
      this.movementThreshold = settings.movementThreshold;
    }
    if (settings.hrSpikeThreshold !== undefined) {
      this.hrSpikeThreshold = settings.hrSpikeThreshold;
    }
  }

  private async saveSession(session: SessionLog): Promise<void> {
    try {
      const sessions = await this.getAllSessions();
      sessions.push(session);
      await AsyncStorage.setItem('tmr_sessions', JSON.stringify(sessions));
    } catch (error) {
      console.error('Error saving session:', error);
    }
  }

  async getAllSessions(): Promise<SessionLog[]> {
    try {
      const data = await AsyncStorage.getItem('tmr_sessions');
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('Error loading sessions:', error);
      return [];
    }
  }

  async getSessionById(id: string): Promise<SessionLog | null> {
    const sessions = await this.getAllSessions();
    return sessions.find(s => s.id === id) || null;
  }
}

export const sessionEngine = new SessionEngine();
