import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { BLEDevice } from '../models/types';

export const DevicesScreen: React.FC = () => {
  const {
    connectedWristband,
    connectedHub,
    isScanning,
    availableDevices,
    startScanning,
    connectDevice,
    disconnectDevice,
  } = useApp();

  const handleConnect = async (device: BLEDevice) => {
    try {
      await connectDevice(device.id, device.type);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async (type: 'WRISTBAND' | 'HUB') => {
    try {
      await disconnectDevice(type);
    } catch (error) {
      console.error('Disconnection failed:', error);
    }
  };

  const renderDevice = ({ item }: { item: BLEDevice }) => {
    const isConnected =
      (item.type === 'WRISTBAND' && connectedWristband?.id === item.id) ||
      (item.type === 'HUB' && connectedHub?.id === item.id);

    return (
      <View style={styles.deviceCard}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceType}>{item.type}</Text>
          {item.rssi && <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>}
        </View>
        <TouchableOpacity
          style={[styles.button, isConnected && styles.disconnectButton]}
          onPress={() =>
            isConnected
              ? handleDisconnect(item.type)
              : handleConnect(item)
          }
        >
          <Text style={styles.buttonText}>
            {isConnected ? 'Disconnect' : 'Connect'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bluetooth Devices</Text>
      </View>

      <View style={styles.connectedSection}>
        <Text style={styles.sectionTitle}>Connected Devices</Text>
        {connectedWristband && (
          <View style={styles.connectedCard}>
            <Text style={styles.connectedName}>{connectedWristband.name}</Text>
            <Text style={styles.connectedType}>Wristband</Text>
          </View>
        )}
        {connectedHub && (
          <View style={styles.connectedCard}>
            <Text style={styles.connectedName}>{connectedHub.name}</Text>
            <Text style={styles.connectedType}>Hub</Text>
          </View>
        )}
        {!connectedWristband && !connectedHub && (
          <Text style={styles.emptyText}>No devices connected</Text>
        )}
      </View>

      <View style={styles.scanSection}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanningButton]}
          onPress={startScanning}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.scanButtonText}>Scan for Devices</Text>
          )}
        </TouchableOpacity>
      </View>

      {availableDevices.length > 0 && (
        <View style={styles.availableSection}>
          <Text style={styles.sectionTitle}>Available Devices</Text>
          <FlatList
            data={availableDevices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.id}
            style={styles.deviceList}
          />
        </View>
      )}

      {!isScanning && availableDevices.length === 0 && (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No devices found. Make sure your wristband and hub are powered on and in range.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  connectedSection: {
    padding: 15,
    backgroundColor: '#fff',
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  connectedCard: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  connectedName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  connectedType: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  scanSection: {
    padding: 15,
  },
  scanButton: {
    backgroundColor: '#6200ee',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  scanningButton: {
    backgroundColor: '#9c4dcc',
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  availableSection: {
    flex: 1,
    padding: 15,
  },
  deviceList: {
    flex: 1,
  },
  deviceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  deviceType: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  deviceRssi: {
    fontSize: 12,
    color: '#999',
    marginTop: 3,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 6,
  },
  disconnectButton: {
    backgroundColor: '#d32f2f',
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});
