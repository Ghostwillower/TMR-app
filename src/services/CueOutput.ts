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

  async playCue(cueId: string, cueName: string, volume: number = 0.3): Promise<void> {
    // TODO: Implement wall hub integration
    // This will send a command to the wall hub to play the audio cue
    // Via HTTP/WebSocket/BLE depending on hub implementation
    throw new Error('Wall hub integration not yet implemented');
  }

  async stopCue(): Promise<void> {
    // TODO: Implement stop command to wall hub
  }

  isAvailable(): boolean {
    return this.connected;
  }

  // Future methods for hub integration:
  // - async connectToHub(hubAddress: string): Promise<void>
  // - async disconnectFromHub(): Promise<void>
  // - async getHubStatus(): Promise<HubStatus>
}
