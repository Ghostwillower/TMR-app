// Demo Mode Biometric Simulator
export class DemoBiometricSimulator {
  private intervalId: NodeJS.Timeout | null = null;
  private startTime: number = 0;
  private currentStageIndex: number = 0;
  private timeInCurrentStage: number = 0;

  // Sleep stages cycle: Awake → Light → Deep → Light → REM (simplified)
  private stages = ['Awake', 'Light', 'Deep', 'Light', 'REM'] as const;
  private stageDurations = [300, 600, 900, 600, 600]; // seconds per stage

  constructor(private onUpdate: (data: BiometricData) => void) {}

  start(): void {
    if (this.intervalId) return;
    
    this.startTime = Date.now();
    this.currentStageIndex = 0;
    this.timeInCurrentStage = 0;

    // Update every 2 seconds
    this.intervalId = setInterval(() => {
      this.tick();
    }, 2000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private tick(): void {
    this.timeInCurrentStage += 2;

    // Advance to next stage if time exceeded
    if (this.timeInCurrentStage >= this.stageDurations[this.currentStageIndex]) {
      this.currentStageIndex = (this.currentStageIndex + 1) % this.stages.length;
      this.timeInCurrentStage = 0;
    }

    const stage = this.stages[this.currentStageIndex];
    const data = this.generateBiometrics(stage);
    this.onUpdate(data);
  }

  private generateBiometrics(stage: string): BiometricData {
    const baseHR = this.getBaseHeartRate(stage);
    const baseMovement = this.getBaseMovement(stage);
    
    // Add some randomness
    const heartRate = baseHR + (Math.random() * 10 - 5);
    const movement = Math.max(0, baseMovement + (Math.random() * 20 - 10));
    const temperature = 36.5 + (Math.random() * 0.5 - 0.25);

    // Occasionally simulate a spike
    const spike = Math.random() < 0.05;
    
    return {
      heartRate: spike ? heartRate + 20 : heartRate,
      movement: spike ? movement + 40 : movement,
      temperature,
      sleepStage: stage as 'Awake' | 'Light' | 'Deep' | 'REM',
      timestamp: Date.now(),
    };
  }

  private getBaseHeartRate(stage: string): number {
    switch (stage) {
      case 'Awake': return 75;
      case 'Light': return 65;
      case 'Deep': return 55;
      case 'REM': return 70;
      default: return 70;
    }
  }

  private getBaseMovement(stage: string): number {
    switch (stage) {
      case 'Awake': return 50;
      case 'Light': return 20;
      case 'Deep': return 5;
      case 'REM': return 30;
      default: return 20;
    }
  }

  getCurrentStage(): string {
    return this.stages[this.currentStageIndex];
  }

  getSessionDuration(): number {
    return Math.floor((Date.now() - this.startTime) / 1000);
  }
}

export interface BiometricData {
  heartRate: number;
  movement: number;
  temperature: number;
  sleepStage: 'Awake' | 'Light' | 'Deep' | 'REM';
  timestamp: number;
}
