import { Audio } from 'expo-av';
import {
  SleepSession,
  BiometricData,
  SleepStage,
  AudioCue,
  CueSet,
} from '../models/types';
import { bleService } from './BLEService';
import { storageService } from './StorageService';

export class SleepSessionManager {
  private currentSession: SleepSession | null = null;
  private currentStage: SleepStage | null = null;
  private activeCueSet: CueSet | null = null;
  private soundObject: Audio.Sound | null = null;
  private biometricBuffer: BiometricData[] = [];

  async startSession(cueSetId?: string): Promise<string> {
    if (this.currentSession) {
      throw new Error('Session already in progress');
    }

    const sessionId = `session_${Date.now()}`;
    
    this.currentSession = {
      id: sessionId,
      startTime: Date.now(),
      biometricData: [],
      sleepStages: [],
      cuesPlayed: [],
      status: 'ACTIVE',
    };

    // Load cue set if provided
    if (cueSetId) {
      this.activeCueSet = await storageService.getCueSetById(cueSetId);
    }

    // Start monitoring biometric data
    bleService.onBiometricData((data) => {
      this.handleBiometricData(data);
    });

    // Start monitoring sleep stages
    bleService.onSleepStageChange((stage) => {
      this.handleSleepStageChange(stage);
    });

    return sessionId;
  }

  async endSession(): Promise<void> {
    if (!this.currentSession) {
      throw new Error('No active session');
    }

    this.currentSession.endTime = Date.now();
    this.currentSession.status = 'COMPLETED';

    // Close current sleep stage
    if (this.currentStage && !this.currentStage.endTime) {
      this.currentStage.endTime = Date.now();
      this.currentSession.sleepStages.push(this.currentStage);
    }

    // Save session
    await storageService.saveSleepSession(this.currentSession);

    // Generate daily report
    await this.generateDailySleepReport();

    // Cleanup
    this.currentSession = null;
    this.currentStage = null;
    this.activeCueSet = null;
    this.biometricBuffer = [];
  }

  private handleBiometricData(data: BiometricData): void {
    if (!this.currentSession) return;

    this.currentSession.biometricData.push(data);
    this.biometricBuffer.push(data);

    // Keep only last 30 seconds of data in buffer for analysis
    const cutoffTime = Date.now() - 30000;
    this.biometricBuffer = this.biometricBuffer.filter(
      d => d.timestamp > cutoffTime
    );
  }

  private handleSleepStageChange(stage: string): void {
    if (!this.currentSession) return;

    // Close previous stage
    if (this.currentStage && !this.currentStage.endTime) {
      this.currentStage.endTime = Date.now();
      this.currentSession.sleepStages.push(this.currentStage);
    }

    // Start new stage
    this.currentStage = {
      stage: stage as any,
      startTime: Date.now(),
      confidence: 0.95, // Placeholder confidence
    };

    // Trigger audio cues if in safe NREM period
    if (this.isSafeNREMPeriod(stage)) {
      this.triggerAudioCue();
    }
  }

  private isSafeNREMPeriod(stage: string): boolean {
    // NREM2 and NREM3 are considered safe for audio cues
    return stage === 'NREM2' || stage === 'NREM3';
  }

  private async triggerAudioCue(): Promise<void> {
    if (!this.activeCueSet || !this.currentSession) return;

    // Check if we've already played all cues
    const playedCueIds = new Set(
      this.currentSession.cuesPlayed.map(c => c.id)
    );
    const unplayedCues = this.activeCueSet.cues.filter(
      cue => !playedCueIds.has(cue.id)
    );

    if (unplayedCues.length === 0) return;

    // Select a random unplayed cue
    const cue = unplayedCues[Math.floor(Math.random() * unplayedCues.length)];

    try {
      // Send trigger to wall hub
      await bleService.sendAudioCueTrigger(cue.id);

      // Play locally as backup (optional)
      await this.playAudioLocally(cue);

      // Record the cue play
      const playedCue = {
        ...cue,
        playedAt: Date.now(),
        sleepStageWhenPlayed: this.currentStage?.stage,
      };
      this.currentSession.cuesPlayed.push(playedCue);

      // Save session progress
      await storageService.saveSleepSession(this.currentSession);
    } catch (error) {
      console.error('Error playing audio cue:', error);
    }
  }

  private async playAudioLocally(cue: AudioCue): Promise<void> {
    try {
      // Unload previous sound
      if (this.soundObject) {
        await this.soundObject.unloadAsync();
      }

      // Load and play new sound at low volume
      const { sound } = await Audio.Sound.createAsync(
        { uri: cue.audioUri },
        { shouldPlay: true, volume: 0.3 }
      );
      this.soundObject = sound;
    } catch (error) {
      console.error('Error playing audio locally:', error);
    }
  }

  private async generateDailySleepReport(): Promise<void> {
    if (!this.currentSession) return;

    const dateKey = new Date(this.currentSession.startTime).setHours(0, 0, 0, 0);
    const totalSleepTime = this.currentSession.endTime
      ? this.currentSession.endTime - this.currentSession.startTime
      : 0;

    // Calculate sleep stage breakdown
    const stageBreakdown = {
      NREM1: 0,
      NREM2: 0,
      NREM3: 0,
      REM: 0,
    };

    this.currentSession.sleepStages.forEach(stage => {
      const duration = (stage.endTime || Date.now()) - stage.startTime;
      if (stage.stage in stageBreakdown) {
        stageBreakdown[stage.stage as keyof typeof stageBreakdown] += duration;
      }
    });

    // Calculate average heart rate
    const heartRates = this.currentSession.biometricData
      .filter(d => d.heartRate)
      .map(d => d.heartRate);
    const averageHeartRate = heartRates.length
      ? heartRates.reduce((a, b) => a + b, 0) / heartRates.length
      : 0;

    // Calculate movement score
    const movements = this.currentSession.biometricData
      .filter(d => d.movement)
      .map(d => d.movement);
    const movementScore = movements.length
      ? movements.reduce((a, b) => a + b, 0) / movements.length
      : 0;

    // Calculate sleep quality (0-100)
    const deepSleepPercentage = totalSleepTime > 0
      ? ((stageBreakdown.NREM3 / totalSleepTime) * 100)
      : 0;
    const sleepQuality = Math.min(100, Math.max(0, 
      (deepSleepPercentage * 0.6) + 
      ((100 - movementScore) * 0.3) +
      ((80 - Math.abs(averageHeartRate - 60)) * 0.1)
    ));

    const report = {
      date: dateKey,
      totalSleepTime,
      sleepQuality,
      sleepStageBreakdown: stageBreakdown,
      cuesPlayed: this.currentSession.cuesPlayed.length,
      averageHeartRate,
      movementScore,
    };

    await storageService.saveSleepReport(report);
  }

  getCurrentSession(): SleepSession | null {
    return this.currentSession;
  }

  getCurrentStage(): string | null {
    return this.currentStage?.stage || null;
  }

  isSessionActive(): boolean {
    return this.currentSession !== null;
  }
}

export const sleepSessionManager = new SleepSessionManager();
