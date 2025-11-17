import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from 'react-native';
import { useApp } from '../contexts/AppContext';

export const SessionScreen: React.FC = () => {
  const { 
    demoMode, 
    currentSession, 
    currentBiometrics,
    startSession, 
    pauseSession, 
    resumeSession,
    stopSession 
  } = useApp();
  
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [notes, setNotes] = useState('');

  const handleStart = async () => {
    if (notes.trim()) {
      await startSession(notes);
    } else {
      await startSession();
    }
    setShowNotesModal(false);
    setNotes('');
  };

  const handleStop = async () => {
    await stopSession();
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

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
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

          <TouchableOpacity 
            style={styles.startButton} 
            onPress={() => setShowNotesModal(true)}
          >
            <Text style={styles.startButtonText}>Start Session</Text>
          </TouchableOpacity>
        </View>

        <Modal
          visible={showNotesModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowNotesModal(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Session Notes (Optional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes for this session..."
                value={notes}
                onChangeText={setNotes}
                multiline
                numberOfLines={4}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setShowNotesModal(false)}
                >
                  <Text style={styles.modalButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonPrimary]}
                  onPress={handleStart}
                >
                  <Text style={styles.modalButtonText}>Start</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </View>
    );
  }

  const duration = Date.now() - currentSession.startTime;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Active Session</Text>
        <Text style={styles.headerSubtext}>{formatDuration(duration)}</Text>
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
                {currentSession.biometricLogs.length}
              </Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.summaryCard}>
        <Text style={styles.cardTitle}>Session Summary</Text>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time in Awake:</Text>
          <Text style={styles.summaryValue}>
            {formatTime(currentSession.stageTimings.Awake)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time in Light:</Text>
          <Text style={styles.summaryValue}>
            {formatTime(currentSession.stageTimings.Light)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time in Deep:</Text>
          <Text style={styles.summaryValue}>
            {formatTime(currentSession.stageTimings.Deep)}
          </Text>
        </View>
        
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Time in REM:</Text>
          <Text style={styles.summaryValue}>
            {formatTime(currentSession.stageTimings.REM)}
          </Text>
        </View>

        <View style={[styles.summaryRow, styles.highlightRow]}>
          <Text style={styles.summaryLabel}>Cue Allowed Count:</Text>
          <Text style={styles.summaryValue}>
            {currentSession.cueAllowedCount}
          </Text>
        </View>

        <View style={[styles.summaryRow, styles.highlightRow]}>
          <Text style={styles.summaryLabel}>Cues Played:</Text>
          <Text style={styles.summaryValue}>
            {currentSession.cuesPlayed.length}
          </Text>
        </View>
      </View>

      <View style={styles.controlsCard}>
        <Text style={styles.cardTitle}>Session Controls</Text>
        <View style={styles.buttonRow}>
          {currentSession.status === 'active' ? (
            <TouchableOpacity style={styles.pauseButton} onPress={pauseSession}>
              <Text style={styles.buttonText}>⏸️ Pause</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.resumeButton} onPress={resumeSession}>
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
  summaryCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  highlightRow: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 10,
    borderRadius: 5,
    marginVertical: 5,
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    width: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  notesInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: '#999',
  },
  modalButtonPrimary: {
    backgroundColor: '#6200ee',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
