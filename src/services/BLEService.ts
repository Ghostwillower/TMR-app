import { BleManager, Device, Characteristic } from 'react-native-ble-plx';
import { BiometricData, BLEDevice } from '../models/types';

// UUIDs for TMR devices
const WRISTBAND_SERVICE_UUID = '0000180d-0000-1000-8000-00805f9b34fb';
const HUB_SERVICE_UUID = '0000180a-0000-1000-8000-00805f9b34fb';
const HEART_RATE_CHAR_UUID = '00002a37-0000-1000-8000-00805f9b34fb';
const MOVEMENT_CHAR_UUID = '00002a38-0000-1000-8000-00805f9b34fb';
const TEMPERATURE_CHAR_UUID = '00002a1c-0000-1000-8000-00805f9b34fb';
const SLEEP_STAGE_CHAR_UUID = '00002a39-0000-1000-8000-00805f9b34fb';

export class BLEService {
  private manager: BleManager;
  private wristband: Device | null = null;
  private hub: Device | null = null;
  private biometricCallback?: (data: BiometricData) => void;
  private sleepStageCallback?: (stage: string) => void;

  constructor() {
    this.manager = new BleManager();
  }

  async initialize(): Promise<void> {
    const state = await this.manager.state();
    if (state !== 'PoweredOn') {
      throw new Error('Bluetooth is not powered on');
    }
  }

  async scanForDevices(
    onDeviceFound: (device: BLEDevice) => void,
    duration: number = 10000
  ): Promise<void> {
    const foundDevices = new Map<string, BLEDevice>();

    this.manager.startDeviceScan(
      [WRISTBAND_SERVICE_UUID, HUB_SERVICE_UUID],
      { allowDuplicates: false },
      (error, device) => {
        if (error) {
          console.error('Scan error:', error);
          return;
        }

        if (device && !foundDevices.has(device.id)) {
          const bleDevice: BLEDevice = {
            id: device.id,
            name: device.name || 'Unknown Device',
            type: device.serviceUUIDs?.includes(WRISTBAND_SERVICE_UUID)
              ? 'WRISTBAND'
              : 'HUB',
            connected: false,
            rssi: device.rssi || undefined,
          };
          foundDevices.set(device.id, bleDevice);
          onDeviceFound(bleDevice);
        }
      }
    );

    setTimeout(() => {
      this.manager.stopDeviceScan();
    }, duration);
  }

  async connectToDevice(deviceId: string, type: 'WRISTBAND' | 'HUB'): Promise<void> {
    try {
      const device = await this.manager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();

      if (type === 'WRISTBAND') {
        this.wristband = device;
        await this.startMonitoringWristband();
      } else {
        this.hub = device;
      }
    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  async disconnect(type: 'WRISTBAND' | 'HUB'): Promise<void> {
    const device = type === 'WRISTBAND' ? this.wristband : this.hub;
    if (device) {
      await device.cancelConnection();
      if (type === 'WRISTBAND') {
        this.wristband = null;
      } else {
        this.hub = null;
      }
    }
  }

  private async startMonitoringWristband(): Promise<void> {
    if (!this.wristband) return;

    const deviceId = this.wristband.id;

    // Monitor heart rate
    this.manager.monitorCharacteristicForDevice(
      deviceId,
      WRISTBAND_SERVICE_UUID,
      HEART_RATE_CHAR_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Heart rate monitoring error:', error);
          return;
        }
        this.handleBiometricData(characteristic, 'heartRate');
      }
    );

    // Monitor movement
    this.manager.monitorCharacteristicForDevice(
      deviceId,
      WRISTBAND_SERVICE_UUID,
      MOVEMENT_CHAR_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Movement monitoring error:', error);
          return;
        }
        this.handleBiometricData(characteristic, 'movement');
      }
    );

    // Monitor temperature
    this.manager.monitorCharacteristicForDevice(
      deviceId,
      WRISTBAND_SERVICE_UUID,
      TEMPERATURE_CHAR_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Temperature monitoring error:', error);
          return;
        }
        this.handleBiometricData(characteristic, 'temperature');
      }
    );

    // Monitor sleep stage
    this.manager.monitorCharacteristicForDevice(
      deviceId,
      WRISTBAND_SERVICE_UUID,
      SLEEP_STAGE_CHAR_UUID,
      (error, characteristic) => {
        if (error) {
          console.error('Sleep stage monitoring error:', error);
          return;
        }
        this.handleSleepStageData(characteristic);
      }
    );
  }

  private handleBiometricData(
    characteristic: Characteristic | null,
    type: 'heartRate' | 'movement' | 'temperature'
  ): void {
    if (!characteristic || !characteristic.value) return;

    const value = this.decodeBase64ToNumber(characteristic.value);
    
    if (this.biometricCallback) {
      const data: Partial<BiometricData> = {
        timestamp: Date.now(),
      };
      data[type] = value;
      this.biometricCallback(data as BiometricData);
    }
  }

  private handleSleepStageData(characteristic: Characteristic | null): void {
    if (!characteristic || !characteristic.value) return;

    const stageCode = this.decodeBase64ToNumber(characteristic.value);
    const stages = ['AWAKE', 'NREM1', 'NREM2', 'NREM3', 'REM'];
    const stage = stages[stageCode] || 'AWAKE';

    if (this.sleepStageCallback) {
      this.sleepStageCallback(stage);
    }
  }

  private decodeBase64ToNumber(base64: string): number {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new DataView(bytes.buffer).getUint8(0);
  }

  onBiometricData(callback: (data: BiometricData) => void): void {
    this.biometricCallback = callback;
  }

  onSleepStageChange(callback: (stage: string) => void): void {
    this.sleepStageCallback = callback;
  }

  async sendAudioCueTrigger(cueId: string): Promise<void> {
    if (!this.hub) {
      throw new Error('Hub not connected');
    }

    const data = Buffer.from(cueId).toString('base64');
    await this.manager.writeCharacteristicWithResponseForDevice(
      this.hub.id,
      HUB_SERVICE_UUID,
      '00002a3a-0000-1000-8000-00805f9b34fb',
      data
    );
  }

  async sendStopAudioCue(): Promise<void> {
    if (!this.hub) {
      throw new Error('Hub not connected');
    }

    const data = Buffer.from('STOP').toString('base64');
    await this.manager.writeCharacteristicWithResponseForDevice(
      this.hub.id,
      HUB_SERVICE_UUID,
      '00002a3a-0000-1000-8000-00805f9b34fb',
      data
    );
  }

  isWristbandConnected(): boolean {
    return this.wristband !== null;
  }

  isHubConnected(): boolean {
    return this.hub !== null;
  }

  destroy(): void {
    this.manager.destroy();
  }
}

export const bleService = new BLEService();
