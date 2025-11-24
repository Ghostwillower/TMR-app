// Cue Output Interface - Abstraction for different audio output methods

export interface CueOutput {
  playCue(cueId: string, cueName: string, volume: number): Promise<void>;
  stopCue(): Promise<void>;
  isAvailable(): boolean;
}

export class PhoneSpeakerOutput implements CueOutput {
  private cueManager: any = null;

  constructor() {
    this.initializeCueManager();
  }

  private async initializeCueManager(): Promise<void> {
    const { cueManager } = await import('./CueManager');
    this.cueManager = cueManager;
  }

  async playCue(cueId: string, cueName: string, volume: number = 0.3): Promise<void> {
    if (!this.cueManager) {
      await this.initializeCueManager();
    }
    
    try {
      await this.cueManager.playCue(cueId, volume);
    } catch (error) {
      console.error('Error playing cue on phone speaker:', error);
      throw error;
    }
  }

  async stopCue(): Promise<void> {
    if (this.cueManager) {
      await this.cueManager.stopCue();
    }
  }

  isAvailable(): boolean {
    return true; // Phone speaker is always available
  }
}

export class HubOutput implements CueOutput {
  private connected: boolean = false;
  private hubId: string | null = null;
  private lastError: string | null = null;
  private fallbackOutput = new PhoneSpeakerOutput();

  constructor(hubId?: string) {
    this.hubId = hubId ?? null;
  }

  async playCue(cueId: string, cueName: string, volume: number = 0.3): Promise<void> {
    const connected = await this.ensureConnection();

    if (connected) {
      try {
        const { bleService } = await import('./BLEService');
        await bleService.sendAudioCueTrigger(cueId);
        return;
      } catch (error) {
        console.error('Error triggering cue on hub, falling back to phone:', error);
        this.connected = false;
        this.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    // Fallback to local playback if hub is unavailable
    await this.fallbackOutput.playCue(cueId, cueName, volume);
  }

  async stopCue(): Promise<void> {
    if (this.connected) {
      try {
        const { bleService } = await import('./BLEService');
        await bleService.sendStopAudioCue();
        return;
      } catch (error) {
        console.error('Error stopping cue on hub, falling back to phone:', error);
        this.connected = false;
        this.lastError = error instanceof Error ? error.message : String(error);
      }
    }

    await this.fallbackOutput.stopCue();
  }

  isAvailable(): boolean {
    return this.connected;
  }

  async connectToHub(hubId?: string): Promise<void> {
    try {
      const { bleService } = await import('./BLEService');
      this.hubId = hubId ?? this.hubId;

      if (!this.hubId) {
        throw new Error('Hub identifier not provided');
      }

      await bleService.initialize();
      await bleService.connectToDevice(this.hubId, 'HUB');
      this.connected = bleService.isHubConnected();
      this.lastError = null;
    } catch (error) {
      this.connected = false;
      this.lastError = error instanceof Error ? error.message : String(error);
      throw error;
    }
  }

  async getHubStatus(): Promise<HubStatus> {
    return {
      connected: this.isAvailable(),
      hubId: this.hubId,
      lastError: this.lastError,
    };
  }

  private async ensureConnection(retries: number = 2): Promise<boolean> {
    if (this.connected) return true;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        await this.connectToHub();
        if (this.connected) return true;
      } catch (error) {
        // Swallow to allow retries/fallback
        this.lastError = error instanceof Error ? error.message : String(error);
        await new Promise(resolve => setTimeout(resolve, 300 * (attempt + 1)));
      }
    }

    return false;
  }

  // Future methods for hub integration:
  // - async disconnectFromHub(): Promise<void>
}

export interface HubStatus {
  connected: boolean;
  hubId: string | null;
  lastError: string | null;
}
