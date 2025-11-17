import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { DemoBiometricSimulator, BiometricData } from '../utils/DemoBiometricSimulator';

export const SessionScreen: React.FC = () => {
  const { demoMode, currentSession, startSession, pauseSession, stopSession } = useApp();
  const [currentBiometrics, setCurrentBiometrics] = useState<BiometricData | null>(null);
  const [biometricsHistory, setBiometricsHistory] = useState<BiometricData[]>([]);
  const simulatorRef = useRef<DemoBiometricSimulator | null>(null);

  useEffect(() => {
    if (demoMode && currentSession && currentSession.status === 'active') {
      // Start demo simulator
      if (!simulatorRef.current) {
        simulatorRef.current = new DemoBiometricSimulator((data) => {
          setCurrentBiometrics(data);
          setBiometricsHistory(prev => [...prev, data].slice(-100)); // Keep last 100 readings
        });
        simulatorRef.current.start();
      }
    } else {
      // Stop simulator
      if (simulatorRef.current) {
        simulatorRef.current.stop();
        simulatorRef.current = null;
      }
    }

    return () => {
      if (simulatorRef.current) {
        simulatorRef.current.stop();
      }
    };
  }, [demoMode, currentSession]);

  const handleStart = () => {
    startSession();
    setBiometricsHistory([]);
  };

  const handlePause = () => {
    pauseSession();
  };

  const handleStop = () => {
    stopSession();
    setCurrentBiometrics(null);
    setBiometricsHistory([]);
  };

  const getSleepStageColor = (stage: string) => {
    switch (stage) {
      case 'Awake': return '#ff5722';
      case 'Light': return '#ffc107';
      case 'Deep': return '#2196f3';
      case 'REM': return '#9c27b0';
      default: return '#757575';
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  };

  if (!currentSession) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Sleep Session</Text>
        </View>

        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🌙</Text>
          <Text style={styles.emptyText}>No Active Session</Text>
          <Text style={styles.emptySubtext}>
            Start a session to begin monitoring your sleep
          </Text>
          
          {demoMode && (
            <View style={styles.demoNotice}>
              <Text style={styles.demoNoticeText}>
                🔧 Demo Mode: Will use simulated biometric data
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.startButton} onPress={handleStart}>
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Session</Text>
        <Text style={styles.headerSubtext}>
          {formatDuration(Date.now() - currentSession.startTime)}
        </Text>
      </View>

      {currentBiometrics && (
        <>
          <View style={styles.stageCard}>
            <Text style={styles.stageLabel}>Current Sleep Stage</Text>
            <View
              style={[
                styles.stageBadge,
                { backgroundColor: getSleepStageColor(currentBiometrics.sleepStage) },
              ]}
            >
              <Text style={styles.stageText}>{currentBiometrics.sleepStage}</Text>
            </View>
          </View>

          <View style={styles.biometricsCard}>
            <Text style={styles.cardTitle}>Live Biometrics</Text>
            
            <View style={styles.biometricRow}>
              <Text style={styles.biometricLabel}>❤️ Heart Rate</Text>
              <Text style={styles.biometricValue}>
                {Math.round(currentBiometrics.heartRate)} bpm
              </Text>
            </View>

            <View style={styles.biometricRow}>
              <Text style={styles.biometricLabel}>🏃 Movement</Text>
              <Text style={styles.biometricValue}>
                {Math.round(currentBiometrics.movement)}
              </Text>
            </View>

            <View style={styles.biometricRow}>
              <Text style={styles.biometricLabel}>🌡️ Temperature</Text>
              <Text style={styles.biometricValue}>
                {currentBiometrics.temperature.toFixed(1)}°C
              </Text>
            </View>

            <View style={styles.biometricRow}>
              <Text style={styles.biometricLabel}>📊 Readings</Text>
              <Text style={styles.biometricValue}>
                {biometricsHistory.length}
              </Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.controlsCard}>
        <Text style={styles.cardTitle}>Session Controls</Text>
        <View style={styles.buttonRow}>
          {currentSession.status === 'active' ? (
            <TouchableOpacity style={styles.pauseButton} onPress={handlePause}>
              <Text style={styles.buttonText}>⏸️ Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.resumeButton} onPress={startSession}>
              <Text style={styles.buttonText}>▶️ Resume</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
            <Text style={styles.buttonText}>⏹️ Stop</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
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
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtext: {
    fontSize: 16,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  demoNotice: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  demoNoticeText: {
    fontSize: 14,
    color: '#1976d2',
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: 10,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stageCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  stageLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  stageBadge: {
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  stageText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  biometricsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  biometricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  biometricLabel: {
    fontSize: 16,
    color: '#666',
  },
  biometricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  controlsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#ff9800',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#d32f2f',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
