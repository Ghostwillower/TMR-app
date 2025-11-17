export interface BiometricData {
  heartRate: number;
  movement: number;
  temperature: number;
  timestamp: number;
}

export interface SleepStage {
  stage: 'AWAKE' | 'NREM1' | 'NREM2' | 'NREM3' | 'REM';
  startTime: number;
  endTime?: number;
  confidence: number;
}

export interface SleepSession {
  id: string;
  startTime: number;
  endTime?: number;
  biometricData: BiometricData[];
  sleepStages: SleepStage[];
  cuesPlayed: AudioCue[];
  status: 'ACTIVE' | 'COMPLETED' | 'INTERRUPTED';
}

export interface AudioCue {
  id: string;
  name: string;
  audioUri: string;
  playedAt?: number;
  sleepStageWhenPlayed?: string;
  associatedLearningSessionId?: string;
}

export interface CueSet {
  id: string;
  name: string;
  description: string;
  cues: AudioCue[];
  learningSessionId: string;
  createdAt: number;
}

export interface LearningSession {
  id: string;
  name: string;
  description: string;
  date: number;
  cueSetId?: string;
}

export interface DailySleepReport {
  date: number;
  totalSleepTime: number;
  sleepQuality: number;
  sleepStageBreakdown: {
    NREM1: number;
    NREM2: number;
    NREM3: number;
    REM: number;
  };
  cuesPlayed: number;
  averageHeartRate: number;
  movementScore: number;
}

export interface DailyMemoryReport {
  date: number;
  learningSessionsCount: number;
  cuesPlayedCount: number;
  sleepQualityCorrelation: number;
  recommendations: string[];
}

export interface BLEDevice {
  id: string;
  name: string;
  type: 'WRISTBAND' | 'HUB';
  connected: boolean;
  rssi?: number;
}
