// Session Engine - Handles session lifecycle, logging, and cue logic
import { BiometricData } from '../utils/DemoBiometricSimulator';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface SessionHardwareProvenance {
  biometric: { mode: 'demo' | 'ble'; deviceId?: string | null; deviceName?: string | null };
  cueOutput: { mode: 'phone' | 'hub'; deviceId?: string | null; deviceName?: string | null };
}

export interface SessionLog {
  id: string;
  startTime: number;
  endTime?: number;
  status: 'active' | 'paused' | 'completed';
  notes?: string;
  hardware?: SessionHardwareProvenance;
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

export interface AdaptiveState {
  enabled: boolean;
  cuesPaused: boolean;
  reason?: string;
  effectiveCooldown: number;
  movementVolatility: number;
  hrVolatility: number;
}

export class SessionEngine {
  private currentSession: SessionLog | null = null;
  private logInterval: NodeJS.Timeout | null = null;
  private stageStartTime: number = 0;
  private currentStage: string = 'Awake';
  private lastCueTime: number = 0;
  private lastBiometricTimestamp: number = 0;

  // Cue safety settings
  private minSecondsBetweenCues: number = 120;
  private maxCuesPerSession: number = 10;
  private movementThreshold: number = 30;
  private hrSpikeThreshold: number = 20;
  private lastHR: number = 70;

  // Adaptive cueing
  private adaptiveModeEnabled: boolean = false;
  private adaptiveMovementSensitivity: number = 0.5;
  private adaptiveHRSensitivity: number = 0.5;
  private movementWindow: number[] = [];
  private hrWindow: number[] = [];
  private adaptivePauseUntil: number = 0;
  private adaptiveState: AdaptiveState = {
    enabled: false,
    cuesPaused: false,
    effectiveCooldown: this.minSecondsBetweenCues,
    movementVolatility: 0,
    hrVolatility: 0,
  };

  startSession(
    notes?: string,
    startTime: number = Date.now(),
    hardware?: SessionHardwareProvenance,
  ): SessionLog {
    this.currentSession = {
      id: `session_${startTime}`,
      startTime,
      status: 'active',
      notes,
      hardware,
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
    this.lastBiometricTimestamp = 0;
    this.movementWindow = [];
    this.hrWindow = [];
    this.adaptivePauseUntil = 0;
    this.adaptiveState = {
      ...this.adaptiveState,
      enabled: this.adaptiveModeEnabled,
      cuesPaused: false,
      reason: undefined,
      effectiveCooldown: this.getEffectiveCooldownSeconds(),
      movementVolatility: 0,
      hrVolatility: 0,
    };

    return this.currentSession;
  }

  logBiometrics(data: BiometricData, timestampOverride?: number): void {
    if (!this.currentSession || this.currentSession.status !== 'active') return;

    const now = timestampOverride ?? data.timestamp ?? Date.now();
    this.lastBiometricTimestamp = now;

    // Add to biometric logs
    this.currentSession.biometricLogs.push(data);

    // Update rolling windows
    this.updateRollingMetrics(data);

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

    // Adaptive pause handling
    if (this.adaptiveModeEnabled && currentTime < this.adaptivePauseUntil) {
      this.adaptiveState = {
        ...this.adaptiveState,
        cuesPaused: true,
        reason:
          this.adaptiveState.reason ||
          'Cues paused due to elevated movement or heart rate variability',
        effectiveCooldown: this.getEffectiveCooldownSeconds(),
      };
      return false;
    }

    // Rule 0: Require fresh data to avoid stale cue decisions
    if (currentTime - this.lastBiometricTimestamp > 15000) {
      return false;
    }

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
    const cooldownSeconds = this.getEffectiveCooldownSeconds();
    const timeSinceLastCue = (currentTime - this.lastCueTime) / 1000;
    if (this.lastCueTime > 0 && timeSinceLastCue < cooldownSeconds) {
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
    adaptiveModeEnabled?: boolean;
    adaptiveMovementSensitivity?: number;
    adaptiveHRSensitivity?: number;
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
    if (settings.adaptiveModeEnabled !== undefined) {
      this.adaptiveModeEnabled = settings.adaptiveModeEnabled;
    }
    if (settings.adaptiveMovementSensitivity !== undefined) {
      this.adaptiveMovementSensitivity = settings.adaptiveMovementSensitivity;
    }
    if (settings.adaptiveHRSensitivity !== undefined) {
      this.adaptiveHRSensitivity = settings.adaptiveHRSensitivity;
    }

    this.adaptiveState = {
      ...this.adaptiveState,
      enabled: this.adaptiveModeEnabled,
      effectiveCooldown: this.getEffectiveCooldownSeconds(),
    };
  }

  getAdaptiveState(): AdaptiveState {
    return this.adaptiveState;
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

  private updateRollingMetrics(data: BiometricData) {
    const maxWindowSize = 20;

    this.movementWindow.push(data.movement);
    if (this.movementWindow.length > maxWindowSize) {
      this.movementWindow.shift();
    }

    this.hrWindow.push(data.heartRate);
    if (this.hrWindow.length > maxWindowSize) {
      this.hrWindow.shift();
    }

    this.evaluateAdaptiveState(data.timestamp ?? Date.now());
  }

  private evaluateAdaptiveState(currentTime: number) {
    if (!this.adaptiveModeEnabled) {
      this.adaptiveState = {
        ...this.adaptiveState,
        enabled: false,
        cuesPaused: false,
        reason: undefined,
        effectiveCooldown: this.minSecondsBetweenCues,
      };
      return;
    }

    const movementVolatility = this.calculateVolatility(this.movementWindow);
    const hrVolatility = this.calculateVolatility(this.hrWindow);

    const movementThreshold = 8 + this.adaptiveMovementSensitivity * 20;
    const hrThreshold = 5 + this.adaptiveHRSensitivity * 20;

    const excessiveMovement = movementVolatility > movementThreshold * 1.2;
    const excessiveHR = hrVolatility > hrThreshold * 1.2;

    if (excessiveMovement || excessiveHR) {
      const pauseDuration = 30000 + 20000 * (this.adaptiveMovementSensitivity + this.adaptiveHRSensitivity) / 2;
      this.adaptivePauseUntil = currentTime + pauseDuration;
      this.adaptiveState = {
        enabled: true,
        cuesPaused: true,
        reason: excessiveMovement
          ? 'Cues paused: elevated movement variability'
          : 'Cues paused: elevated heart rate variability',
        effectiveCooldown: this.getEffectiveCooldownSeconds(true),
        movementVolatility,
        hrVolatility,
      };
      return;
    }

    const onWatchlist = movementVolatility > movementThreshold || hrVolatility > hrThreshold;
    this.adaptiveState = {
      enabled: true,
      cuesPaused: false,
      reason: onWatchlist
        ? 'Adaptive cooling: biometrics slightly elevated'
        : undefined,
      effectiveCooldown: this.getEffectiveCooldownSeconds(onWatchlist),
      movementVolatility,
      hrVolatility,
    };
  }

  private calculateVolatility(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private getEffectiveCooldownSeconds(onWatchlist: boolean = false): number {
    if (!this.adaptiveModeEnabled) {
      return this.minSecondsBetweenCues;
    }

    if (this.adaptivePauseUntil > (Date.now())) {
      return this.minSecondsBetweenCues * 3;
    }

    if (onWatchlist) {
      return this.minSecondsBetweenCues * 1.5;
    }

    return this.minSecondsBetweenCues;
  }
}

export const sessionEngine = new SessionEngine();
