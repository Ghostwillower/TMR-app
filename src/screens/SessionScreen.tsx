import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { Picker } from '@react-native-picker/picker';

export const SessionScreen: React.FC = () => {
  const {
    currentSession,
    currentSleepStage,
    cueSets,
    connectedWristband,
    connectedHub,
    startSleepSession,
    endSleepSession,
  } = useApp();

  const [selectedCueSetId, setSelectedCueSetId] = useState<string>('');

  const handleStartSession = async () => {
    if (!connectedWristband || !connectedHub) {
      Alert.alert(
        'Devices Not Connected',
        'Please connect both the wristband and hub before starting a session.'
      );
      return;
    }

    try {
      await startSleepSession(selectedCueSetId || undefined);
      Alert.alert('Success', 'Sleep session started successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to start sleep session');
    }
  };

  const handleEndSession = async () => {
    Alert.alert(
      'End Session',
      'Are you sure you want to end this sleep session?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End',
          style: 'destructive',
          onPress: async () => {
            try {
              await endSleepSession();
              Alert.alert('Success', 'Sleep session ended and saved!');
            } catch (error) {
              Alert.alert('Error', 'Failed to end sleep session');
            }
          },
        },
      ]
    );
  };

  const formatDuration = (ms: number) => {
    const totalMinutes = Math.floor(ms / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getSleepStageColor = (stage: string | null) => {
    switch (stage) {
      case 'AWAKE':
        return '#ff5722';
      case 'NREM1':
        return '#ffc107';
      case 'NREM2':
        return '#4caf50';
      case 'NREM3':
        return '#2196f3';
      case 'REM':
        return '#9c27b0';
      default:
        return '#757575';
    }
  };

  if (currentSession) {
    const duration = Date.now() - currentSession.startTime;
    const selectedCueSet = cueSets.find(
      cs => cs.id === currentSession.cuesPlayed[0]?.associatedLearningSessionId
    );

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Active Sleep Session</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.label}>Current Sleep Stage</Text>
          <View
            style={[
              styles.stageBadge,
              { backgroundColor: getSleepStageColor(currentSleepStage) },
            ]}
          >
            <Text style={styles.stageText}>
              {currentSleepStage || 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Duration</Text>
            <Text style={styles.statValue}>{formatDuration(duration)}</Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Cues Played</Text>
            <Text style={styles.statValue}>
              {currentSession.cuesPlayed.length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Sleep Stages</Text>
            <Text style={styles.statValue}>
              {currentSession.sleepStages.length}
            </Text>
          </View>
          <View style={styles.statRow}>
            <Text style={styles.statLabel}>Biometric Readings</Text>
            <Text style={styles.statValue}>
              {currentSession.biometricData.length}
            </Text>
          </View>
        </View>

        {selectedCueSet && (
          <View style={styles.cueSetCard}>
            <Text style={styles.cardTitle}>Active Cue Set</Text>
            <Text style={styles.cueSetName}>{selectedCueSet.name}</Text>
            <Text style={styles.cueSetDescription}>
              {selectedCueSet.description}
            </Text>
            <Text style={styles.cueCount}>
              {selectedCueSet.cues.length} cues available
            </Text>
          </View>
        )}

        <View style={styles.recentCuesCard}>
          <Text style={styles.cardTitle}>Recent Cues Played</Text>
          {currentSession.cuesPlayed.length > 0 ? (
            currentSession.cuesPlayed
              .slice(-5)
              .reverse()
              .map((cue, index) => (
                <View key={index} style={styles.cueItem}>
                  <Text style={styles.cueName}>{cue.name}</Text>
                  <Text style={styles.cueStage}>
                    {cue.sleepStageWhenPlayed}
                  </Text>
                </View>
              ))
          ) : (
            <Text style={styles.emptyText}>No cues played yet</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.endButton}
          onPress={handleEndSession}
        >
          <Text style={styles.endButtonText}>End Session</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Start Sleep Session</Text>
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>Device Status</Text>
        <View style={styles.deviceStatus}>
          <Text
            style={[
              styles.deviceText,
              connectedWristband && styles.connectedText,
            ]}
          >
            Wristband: {connectedWristband ? 'Connected ✓' : 'Not Connected ✗'}
          </Text>
          <Text
            style={[
              styles.deviceText,
              connectedHub && styles.connectedText,
            ]}
          >
            Hub: {connectedHub ? 'Connected ✓' : 'Not Connected ✗'}
          </Text>
        </View>
      </View>

      <View style={styles.setupCard}>
        <Text style={styles.setupTitle}>Select Cue Set (Optional)</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedCueSetId}
            onValueChange={(value) => setSelectedCueSetId(value)}
            style={styles.picker}
          >
            <Picker.Item label="No Cue Set" value="" />
            {cueSets.map((cueSet) => (
              <Picker.Item
                key={cueSet.id}
                label={cueSet.name}
                value={cueSet.id}
              />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How it works:</Text>
        <Text style={styles.infoText}>
          1. Ensure your wristband and hub are connected
        </Text>
        <Text style={styles.infoText}>
          2. Optionally select a cue set to play during sleep
        </Text>
        <Text style={styles.infoText}>
          3. Start the session before going to sleep
        </Text>
        <Text style={styles.infoText}>
          4. Cues will play automatically during safe NREM periods
        </Text>
        <Text style={styles.infoText}>
          5. End the session when you wake up
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.startButton,
          (!connectedWristband || !connectedHub) && styles.disabledButton,
        ]}
        onPress={handleStartSession}
        disabled={!connectedWristband || !connectedHub}
      >
        <Text style={styles.startButtonText}>Start Sleep Session</Text>
      </TouchableOpacity>
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
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    elevation: 3,
  },
  label: {
    fontSize: 16,
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
  statsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 16,
    color: '#666',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  cueSetCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cueSetName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6200ee',
  },
  cueSetDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  cueCount: {
    fontSize: 12,
    color: '#999',
    marginTop: 10,
  },
  recentCuesCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  cueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cueName: {
    fontSize: 14,
    color: '#333',
  },
  cueStage: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  endButton: {
    backgroundColor: '#d32f2f',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  endButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  setupCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  setupTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  deviceStatus: {
    gap: 10,
  },
  deviceText: {
    fontSize: 16,
    color: '#d32f2f',
  },
  connectedText: {
    color: '#4caf50',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  infoCard: {
    backgroundColor: '#e3f2fd',
    margin: 15,
    padding: 20,
    borderRadius: 10,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 5,
  },
  startButton: {
    backgroundColor: '#6200ee',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
