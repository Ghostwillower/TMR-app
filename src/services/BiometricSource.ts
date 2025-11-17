// Biometric Source Interface - Abstraction for different biometric inputs
import { BiometricData } from '../utils/DemoBiometricSimulator';

export interface BiometricSource {
  start(): Promise<void>;
  stop(): Promise<void>;
  onData(callback: (data: BiometricData) => void): void;
  isConnected(): boolean;
}

export class DemoBiometricSource implements BiometricSource {
  private simulator: any = null;
  private callback: ((data: BiometricData) => void) | null = null;

  async start(): Promise<void> {
    const { DemoBiometricSimulator } = await import('../utils/DemoBiometricSimulator');
    this.simulator = new DemoBiometricSimulator((data: BiometricData) => {
      if (this.callback) {
        this.callback(data);
      }
    });
    this.simulator.start();
  }

  async stop(): Promise<void> {
    if (this.simulator) {
      this.simulator.stop();
      this.simulator = null;
    }
  }

  onData(callback: (data: BiometricData) => void): void {
    this.callback = callback;
  }

  isConnected(): boolean {
    return this.simulator !== null;
  }
}

export class RealBiometricSource implements BiometricSource {
  private callback: ((data: BiometricData) => void) | null = null;
  private connected: boolean = false;

  async start(): Promise<void> {
    // TODO: Implement BLE connection to wristband
    // This will connect to the wristband and start receiving biometric data
    throw new Error('Real BLE integration not yet implemented');
  }

  async stop(): Promise<void> {
    // TODO: Implement BLE disconnection
    this.connected = false;
  }

  onData(callback: (data: BiometricData) => void): void {
    this.callback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }

  // Future methods for BLE:
  // - async scanForDevices(): Promise<Device[]>
  // - async connectToDevice(deviceId: string): Promise<void>
  // - async disconnectFromDevice(): Promise<void>
}
