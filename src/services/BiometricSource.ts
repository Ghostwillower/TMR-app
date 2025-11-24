// Biometric Source Interface - Abstraction for different biometric inputs
import { Alert, PermissionsAndroid, Platform } from 'react-native';
import { BleManager, Device, Subscription } from 'react-native-ble-plx';
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
  private manager = new BleManager();
  private scanSubscription: Subscription | null = null;
  private dataSubscriptions: Subscription[] = [];
  private connectionSubscription: Subscription | null = null;
  private selectedDevice: Device | null = null;
  private connectedDevice: Device | null = null;
  private latestHeartRate: number = 0;
  private latestMovement: number = 0;
  private latestTemperature: number = 0;

  private static HEART_RATE_SERVICE = '0000180d-0000-1000-8000-00805f9b34fb';
  private static HEART_RATE_CHARACTERISTIC = '00002a37-0000-1000-8000-00805f9b34fb';
  private static TEMPERATURE_SERVICE = '00001809-0000-1000-8000-00805f9b34fb';
  private static TEMPERATURE_CHARACTERISTIC = '00002a1c-0000-1000-8000-00805f9b34fb';
  // Movement is device-specific; we fall back to the running speed/cadence profile when available
  private static MOVEMENT_SERVICE = '00001816-0000-1000-8000-00805f9b34fb';
  private static MOVEMENT_CHARACTERISTIC = '00002a5b-0000-1000-8000-00805f9b34fb';

  async start(): Promise<void> {
    const permissionsGranted = await this.requestPermissions();
    if (!permissionsGranted) {
      Alert.alert('Permissions required', 'Bluetooth permissions are needed to connect to the wristband.');
      return;
    }

    if (!this.selectedDevice) {
      const device = await this.scanForDevices();
      if (!device) {
        Alert.alert('No devices found', 'We could not find any nearby wristbands. Please retry.');
        this.connected = false;
        return;
      }
      this.selectedDevice = device;
    }

    try {
      await this.connectToSelectedDevice();
    } catch (error: any) {
      this.connected = false;
      Alert.alert('Connection failed', error?.message ?? 'Unable to connect to the wristband.');
    }
  }

  async stop(): Promise<void> {
    this.stopScan();
    this.stopStreaming();

    if (this.connectionSubscription) {
      this.connectionSubscription.remove();
      this.connectionSubscription = null;
    }

    if (this.connectedDevice) {
      try {
        await this.manager.cancelDeviceConnection(this.connectedDevice.id);
      } catch (error) {
        console.warn('Error disconnecting from device', error);
      }
    }

    this.connectedDevice = null;
    this.connected = false;
  }

  onData(callback: (data: BiometricData) => void): void {
    this.callback = callback;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async requestPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') {
      return true;
    }

    const permissions: string[] = [];

    if (Platform.Version >= 31) {
      permissions.push(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
      );
    } else {
      permissions.push(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
    }

    const statuses = await PermissionsAndroid.requestMultiple(permissions);
    const denied = Object.values(statuses).some((status) => status !== PermissionsAndroid.RESULTS.GRANTED);

    return !denied;
  }

  async scanForDevices(onDeviceFound?: (device: Device) => void, timeoutMs: number = 8000): Promise<Device | null> {
    if (this.scanSubscription) {
      return this.selectedDevice;
    }

    return new Promise((resolve) => {
      const discoveredDevices: Record<string, Device> = {};
      let resolved = false;

      this.scanSubscription = this.manager.startDeviceScan(null, null, (error, device) => {
        if (error) {
          console.warn('Scan error', error);
          this.stopScan();
          if (!resolved) {
            resolved = true;
            resolve(null);
          }
          return;
        }

        if (device && device.id && !discoveredDevices[device.id]) {
          discoveredDevices[device.id] = device;
          onDeviceFound?.(device);

          // If the device advertises a name, prioritize the first one found
          if (!resolved && device.name) {
            resolved = true;
            this.stopScan();
            resolve(device);
          }
        }
      });

      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.stopScan();
          const firstDevice = Object.values(discoveredDevices)[0] ?? null;
          resolve(firstDevice);
        }
      }, timeoutMs);
    });
  }

  selectDevice(device: Device): void {
    this.selectedDevice = device;
  }

  private stopScan(): void {
    if (this.scanSubscription) {
      this.scanSubscription.remove();
      this.scanSubscription = null;
    }
    this.manager.stopDeviceScan();
  }

  private async connectToSelectedDevice(): Promise<void> {
    if (!this.selectedDevice) {
      throw new Error('No device selected');
    }

    this.stopScan();

    try {
      const device = await this.manager.connectToDevice(this.selectedDevice.id, { autoConnect: true });
      this.connectedDevice = await device.discoverAllServicesAndCharacteristics();
      this.connected = true;

      this.connectionSubscription = device.onDisconnected(() => {
        this.connected = false;
        this.connectedDevice = null;
        this.connectionSubscription = null;
        this.stopStreaming();
        Alert.alert('Wristband disconnected', 'The biometric wristband disconnected. Please reconnect.');
      });

      this.startStreaming(device);
    } catch (error) {
      this.connected = false;
      throw error;
    }
  }

  private startStreaming(device: Device): void {
    this.stopStreaming();

    try {
      this.dataSubscriptions.push(
        device.monitorCharacteristicForService(
          RealBiometricSource.HEART_RATE_SERVICE,
          RealBiometricSource.HEART_RATE_CHARACTERISTIC,
          (error, characteristic) => {
            if (error) {
              console.warn('Heart rate monitor error', error);
              return;
            }

            const heartRate = this.parseHeartRate(characteristic?.value);
            if (heartRate !== null) {
              this.latestHeartRate = heartRate;
              this.emitData();
            }
          }
        )
      );
    } catch (error) {
      console.warn('Unable to subscribe to heart rate', error);
    }

    try {
      this.dataSubscriptions.push(
        device.monitorCharacteristicForService(
          RealBiometricSource.MOVEMENT_SERVICE,
          RealBiometricSource.MOVEMENT_CHARACTERISTIC,
          (error, characteristic) => {
            if (error) {
              console.warn('Movement monitor error', error);
              return;
            }

            const movement = this.parseMovement(characteristic?.value);
            if (movement !== null) {
              this.latestMovement = movement;
              this.emitData();
            }
          }
        )
      );
    } catch (error) {
      console.warn('Unable to subscribe to movement', error);
    }

    try {
      this.dataSubscriptions.push(
        device.monitorCharacteristicForService(
          RealBiometricSource.TEMPERATURE_SERVICE,
          RealBiometricSource.TEMPERATURE_CHARACTERISTIC,
          (error, characteristic) => {
            if (error) {
              console.warn('Temperature monitor error', error);
              return;
            }

            const temperature = this.parseTemperature(characteristic?.value);
            if (temperature !== null) {
              this.latestTemperature = temperature;
              this.emitData();
            }
          }
        )
      );
    } catch (error) {
      console.warn('Unable to subscribe to temperature', error);
    }
  }

  private stopStreaming(): void {
    this.dataSubscriptions.forEach((subscription) => subscription.remove());
    this.dataSubscriptions = [];
  }

  private parseHeartRate(value?: string | null): number | null {
    const bytes = this.decodeBase64(value);
    if (!bytes || bytes.length < 2) return null;

    const isUInt16 = (bytes[0] & 0x01) === 1;
    return isUInt16 ? bytes[1] + (bytes[2] << 8) : bytes[1];
  }

  private parseMovement(value?: string | null): number | null {
    const bytes = this.decodeBase64(value);
    if (!bytes || bytes.length < 2) return null;

    if (bytes.length >= 6) {
      const x = this.toInt16(bytes[0], bytes[1]);
      const y = this.toInt16(bytes[2], bytes[3]);
      const z = this.toInt16(bytes[4], bytes[5]);
      return Math.sqrt(x * x + y * y + z * z);
    }

    return bytes[0];
  }

  private parseTemperature(value?: string | null): number | null {
    const bytes = this.decodeBase64(value);
    if (!bytes || bytes.length < 2) return null;

    const raw = bytes[0] + (bytes[1] << 8);
    return raw / 100; // Most thermometers report hundredths of a degree
  }

  private decodeBase64(value?: string | null): Uint8Array | null {
    if (!value) return null;

    if (!globalThis.atob) {
      console.warn('Base64 decoding is unavailable on this platform.');
      return null;
    }

    try {
      const binary = globalThis.atob(value);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    } catch (error) {
      console.warn('Failed to decode base64', error);
      return null;
    }
  }

  private toInt16(low: number, high: number): number {
    const value = low | (high << 8);
    return value & 0x8000 ? value - 0x10000 : value;
  }

  private emitData(): void {
    if (!this.callback) return;

    const movement = this.latestMovement;
    const heartRate = this.latestHeartRate;
    const temperature = this.latestTemperature || 36.5;
    const sleepStage = this.deriveSleepStage(heartRate, movement);

    this.callback({
      heartRate,
      movement,
      temperature,
      sleepStage,
      timestamp: Date.now(),
    });
  }

  private deriveSleepStage(heartRate: number, movement: number): BiometricData['sleepStage'] {
    if (movement > 40 || heartRate > 90) return 'Awake';
    if (movement < 8 && heartRate < 58) return 'Deep';
    if (movement < 15) return 'REM';
    return 'Light';
  }
}
