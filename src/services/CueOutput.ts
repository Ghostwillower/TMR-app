// Cue Output Interface - Abstraction for different audio output methods

export interface CueOutput {
  playCue(cueId: string, cueName: string, volume: number): Promise<void>;
  stopCue(): Promise<void>;
  isAvailable(): boolean;
  getStatus?(): OutputStatus;
  onStatusChange?(callback: (status: OutputStatus) => void): void;
  getProvenance?(): OutputProvenance;
}

export interface OutputStatus {
  connected: boolean;
  deviceId?: string | null;
  deviceName?: string | null;
  lastError?: string | null;
}

export interface OutputProvenance {
  mode: 'phone' | 'hub';
  deviceId?: string | null;
  deviceName?: string | null;
}

export class PhoneSpeakerOutput implements CueOutput {
  private cueManager: any = null;
  private status: OutputStatus = { connected: true };
  private statusCallback: ((status: OutputStatus) => void) | null = null;

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

  getStatus(): OutputStatus {
    return this.status;
  }

  onStatusChange(callback: (status: OutputStatus) => void): void {
    this.statusCallback = callback;
  }

  getProvenance(): OutputProvenance {
    return { mode: 'phone' };
  }
}

export class HubOutput implements CueOutput {
  private connected: boolean = false;
  private hubId: string | null = null;
  private lastError: string | null = null;
  private fallbackOutput = new PhoneSpeakerOutput();
  private status: OutputStatus = { connected: false, deviceId: null, deviceName: null, lastError: null };
  private statusCallback: ((status: OutputStatus) => void) | null = null;

  constructor(hubId?: string) {
    this.hubId = hubId ?? null;
  }

  async playCue(cueId: string, cueName: string, volume: number = 0.3): Promise<void> {
    const connected = await this.ensureConnection();

    if (connected) {
      try {
        const { bleService } = await import('./BLEService');
        await bleService.sendAudioCueTrigger(cueId);
        this.updateStatus({ connected: true, lastError: null });
        return;
      } catch (error) {
        console.error('Error triggering cue on hub, falling back to phone:', error);
        this.connected = false;
        this.lastError = error instanceof Error ? error.message : String(error);
        this.updateStatus({ connected: false, lastError: this.lastError });
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
        this.updateStatus({ connected: true });
        return;
      } catch (error) {
        console.error('Error stopping cue on hub, falling back to phone:', error);
        this.connected = false;
        this.lastError = error instanceof Error ? error.message : String(error);
        this.updateStatus({ connected: false, lastError: this.lastError });
      }
    }

    await this.fallbackOutput.stopCue();
  }

  isAvailable(): boolean {
    return this.connected;
  }

  getStatus(): OutputStatus {
    return this.status;
  }

  onStatusChange(callback: (status: OutputStatus) => void): void {
    this.statusCallback = callback;
  }

  getProvenance(): OutputProvenance {
    return { mode: this.connected ? 'hub' : 'phone', deviceId: this.hubId, deviceName: this.status.deviceName };
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
      this.updateStatus({ connected: this.connected, deviceId: this.hubId, deviceName: this.hubId, lastError: null });
    } catch (error) {
      this.connected = false;
      this.lastError = error instanceof Error ? error.message : String(error);
      this.updateStatus({ connected: false, lastError: this.lastError });
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
        if (!this.hubId) {
          const discovered = await this.findHubCandidate();
          if (discovered) {
            this.hubId = discovered.id;
            this.updateStatus({ deviceId: discovered.id, deviceName: discovered.name });
          } else {
            continue;
          }
        }

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

  async ensureHubConnection(): Promise<boolean> {
    return this.ensureConnection(2);
  }

  private updateStatus(partial: Partial<OutputStatus>): void {
    this.status = { ...this.status, ...partial };
    this.statusCallback?.(this.status);
  }

  private async findHubCandidate(): Promise<{ id: string; name: string } | null> {
    const { bleService } = await import('./BLEService');
    return new Promise((resolve) => {
      let resolved = false;
      bleService.scanForDevices((device) => {
        if (device.type === 'HUB' && !resolved) {
          resolved = true;
          resolve({ id: device.id, name: device.name });
        }
      }, 4000);

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          resolve(null);
        }
      }, 4200);
    });
  }

  // Future methods for hub integration:
  // - async disconnectFromHub(): Promise<void>
}

export interface HubStatus {
  connected: boolean;
  hubId: string | null;
  lastError: string | null;
}
