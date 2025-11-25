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
import { theme } from '../theme';

export const SessionScreen: React.FC = () => {
  const {
    demoMode,
    currentSession,
    currentBiometrics,
    adaptiveState,
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

  const renderAdaptiveStatus = () => {
    if (!adaptiveState || !adaptiveState.enabled) {
      return 'Adaptive cueing is off';
    }

    if (adaptiveState.cuesPaused) {
      return adaptiveState.reason || 'Cues paused by adaptive safety';
    }

    return adaptiveState.reason || 'Adaptive cueing is monitoring normally';
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

          <View style={styles.biometricsCard}>
            <Text style={styles.cardTitle}>Adaptive Cueing</Text>
            <View style={styles.biometricRow}>
              <Text style={styles.biometricLabel}>Status</Text>
              <Text style={[styles.biometricValue, adaptiveState?.cuesPaused ? styles.warningText : undefined]}>
                {renderAdaptiveStatus()}
              </Text>
            </View>
            {adaptiveState && adaptiveState.enabled && (
              <>
                <View style={styles.biometricRow}>
                  <Text style={styles.biometricLabel}>Cooldown</Text>
                  <Text style={styles.biometricValue}>{Math.round(adaptiveState.effectiveCooldown)}s</Text>
                </View>
                <View style={styles.biometricRow}>
                  <Text style={styles.biometricLabel}>Movement Volatility</Text>
                  <Text style={styles.biometricValue}>{adaptiveState.movementVolatility.toFixed(1)}</Text>
                </View>
                <View style={styles.biometricRow}>
                  <Text style={styles.biometricLabel}>HR Volatility</Text>
                  <Text style={styles.biometricValue}>{adaptiveState.hrVolatility.toFixed(1)}</Text>
                </View>
              </>
            )}
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
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: 24,
    alignItems: 'center',
    borderBottomColor: theme.colors.border,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerSubtext: {
    fontSize: 16,
    color: theme.colors.muted,
    marginTop: 5,
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
    color: theme.colors.muted,
    textAlign: 'center',
    marginBottom: 30,
  },
  demoNotice: {
    backgroundColor: '#eef2ff',
    padding: 15,
    borderRadius: theme.radius.md,
    marginBottom: 20,
  },
  demoNoticeText: {
    fontSize: 14,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  startButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 40,
    paddingVertical: 15,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  stageCard: {
    backgroundColor: theme.colors.surface,
    margin: 15,
    padding: 20,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  stageLabel: {
    fontSize: 14,
    color: theme.colors.muted,
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
    backgroundColor: theme.colors.surface,
    margin: 15,
    padding: 20,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#0f172a',
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
    color: theme.colors.muted,
  },
  biometricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  warningText: {
    color: theme.colors.danger,
  },
  summaryCard: {
    backgroundColor: theme.colors.surface,
    margin: 15,
    padding: 20,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
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
    color: theme.colors.muted,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  highlightRow: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: 10,
    borderRadius: theme.radius.md,
    marginVertical: 5,
  },
  controlsCard: {
    backgroundColor: theme.colors.surface,
    margin: 15,
    padding: 20,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pauseButton: {
    flex: 1,
    backgroundColor: theme.colors.warning,
    padding: 15,
    borderRadius: theme.radius.md,
    marginRight: 10,
    alignItems: 'center',
  },
  resumeButton: {
    flex: 1,
    backgroundColor: theme.colors.success,
    padding: 15,
    borderRadius: theme.radius.md,
    marginRight: 10,
    alignItems: 'center',
  },
  stopButton: {
    flex: 1,
    backgroundColor: theme.colors.danger,
    padding: 15,
    borderRadius: theme.radius.md,
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
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
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
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
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
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginHorizontal: 5,
    backgroundColor: theme.colors.muted,
  },
  modalButtonPrimary: {
    backgroundColor: theme.colors.primary,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
