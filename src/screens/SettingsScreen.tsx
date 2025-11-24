import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useApp } from '../contexts/AppContext';
import { sessionEngine } from '../services/SessionEngine';
import { cueManager } from '../services/CueManager';
import { BiometricData } from '../utils/DemoBiometricSimulator';

export const SettingsScreen: React.FC = () => {
  const { demoMode, settings, toggleDarkMode, updateSettings, clearAllData, useWearable } = useApp();
  const [runningDemo, setRunningDemo] = useState(false);

  const handleModeChange = (value: boolean) => {
    updateSettings({ useWearable: value });
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all sessions, cues, learning items, and tests. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            Alert.alert('Success', 'All data has been cleared');
          },
        },
      ]
    );
  };

  const runFastForwardDemo = async () => {
    if (!demoMode) {
      Alert.alert('Error', 'Fast-forward demo only works in Demo Mode');
      return;
    }

    setRunningDemo(true);

    try {
      // Create a few cues if none exist
      const allCues = cueManager.getAllCues();
      if (allCues.length === 0) {
        await cueManager.addCue('Chime 1', 'demo://chime1.mp3');
        await cueManager.addCue('Chime 2', 'demo://chime2.mp3');
        await cueManager.addCue('Chime 3', 'demo://chime3.mp3');
        const cueIds = cueManager.getAllCues().map(c => c.id);
        await cueManager.createCueSet('Demo Set', cueIds);
        await cueManager.setActiveCueSet(cueManager.getAllCueSets()[0].id);
      }

      // Start a session
      const sessionStartTime = Date.now();
      const session = sessionEngine.startSession('Fast-forward demo session', sessionStartTime);

      // Simulate 8 hours of sleep in compressed time
      const stages = ['Awake', 'Light', 'Deep', 'Light', 'REM', 'Light', 'Deep', 'REM'];
      const totalMinutes = 8 * 60; // 8 hours
      const timePerStage = (totalMinutes * 60 * 1000) / stages.length; // ms per stage

      let currentTime = session.startTime;

      for (let i = 0; i < stages.length; i++) {
        const stage = stages[i];
        
        // Generate biometric data for this stage
        for (let j = 0; j < 20; j++) { // 20 readings per stage
          const biometricData: BiometricData = {
            timestamp: currentTime,
            heartRate: stage === 'Deep' ? 55 + Math.random() * 5 : 
                      stage === 'Light' ? 65 + Math.random() * 5 :
                      stage === 'REM' ? 70 + Math.random() * 5 : 75 + Math.random() * 5,
            movement: stage === 'Deep' ? 5 + Math.random() * 5 :
                     stage === 'Light' ? 20 + Math.random() * 10 :
                     stage === 'REM' ? 30 + Math.random() * 10 : 50 + Math.random() * 10,
            temperature: 36.5 + Math.random() * 0.5,
            sleepStage: stage,
          };

          sessionEngine.logBiometrics(biometricData, currentTime);

          // Possibly play a cue
          if (sessionEngine.isCueAllowed(biometricData, currentTime) && Math.random() < 0.15) {
            const enabledCues = cueManager.getEnabledCuesFromActiveSet();
            if (enabledCues.length > 0) {
              const randomCue = enabledCues[Math.floor(Math.random() * enabledCues.length)];
              sessionEngine.playCue(randomCue.id, randomCue.name, stage, currentTime);
            }
          }

          currentTime += timePerStage / 20;
        }
      }

      // End the session
      await sessionEngine.endSession(currentTime);

      setRunningDemo(false);

      Alert.alert(
        'Demo Complete! 🎉',
        'A full 8-hour sleep session has been simulated. Check the Reports screen to see the results!',
        [{ text: 'OK' }]
      );
    } catch (error) {
      setRunningDemo(false);
      Alert.alert('Error', 'Failed to run demo: ' + error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Use wearable</Text>
            <Text style={styles.settingDescription}>
              Stream biometrics from a connected wristband and trigger cues via a hub
            </Text>
          </View>
          <Switch
            value={useWearable}
            onValueChange={handleModeChange}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={useWearable ? '#6200ee' : '#f4f3f4'}
          />
        </View>
        {demoMode && (
          <TouchableOpacity
            style={styles.demoButton}
            onPress={runFastForwardDemo}
            disabled={runningDemo}
          >
            {runningDemo ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.demoButtonText}>
                ⚡ Run 5-Minute Demo Night
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Cue Safety Settings</Text>
        
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Max Cues Per Session</Text>
          <TextInput
            style={styles.input}
            value={settings.maxCuesPerSession.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              updateSettings({ maxCuesPerSession: value });
            }}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Min Seconds Between Cues</Text>
          <TextInput
            style={styles.input}
            value={settings.minSecondsBetweenCues.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              updateSettings({ minSecondsBetweenCues: value });
            }}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>Movement Threshold</Text>
          <TextInput
            style={styles.input}
            value={settings.movementThreshold.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              updateSettings({ movementThreshold: value });
            }}
            keyboardType="number-pad"
          />
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>HR Spike Threshold (bpm)</Text>
          <TextInput
            style={styles.input}
            value={settings.hrSpikeThreshold.toString()}
            onChangeText={(text) => {
              const value = parseInt(text) || 0;
              updateSettings({ hrSpikeThreshold: value });
            }}
            keyboardType="number-pad"
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Use dark theme (coming soon)
            </Text>
          </View>
          <Switch
            value={settings.darkMode}
            onValueChange={toggleDarkMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={settings.darkMode ? '#6200ee' : '#f4f3f4'}
            disabled={true}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            TMR App - Targeted Memory Reactivation
          </Text>
          <Text style={styles.versionText}>Version 2.0.0 (All Steps Complete)</Text>
          <Text style={styles.descriptionText}>
            This app enhances memory consolidation during sleep by playing
            audio cues at optimal times during safe NREM periods.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Implementation Progress</Text>
        <View style={styles.progressCard}>
          <Text style={styles.progressItem}>✅ Step 1: App shell and demo mode</Text>
          <Text style={styles.progressItem}>✅ Step 2: Session engine and logging</Text>
          <Text style={styles.progressItem}>✅ Step 3: Cue Manager and audio</Text>
          <Text style={styles.progressItem}>✅ Step 4: Learning module</Text>
          <Text style={styles.progressItem}>✅ Step 5: Reports and history</Text>
          <Text style={styles.progressItem}>✅ Step 6: Settings and safety</Text>
          <Text style={styles.progressItem}>✅ Step 7: Better demo mode</Text>
          <Text style={styles.progressItem}>✅ Step 8: Debug tools (in console)</Text>
          <Text style={styles.progressItem}>✅ Step 9: Hardware abstraction</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Data Management</Text>
        <TouchableOpacity
          style={styles.dangerButton}
          onPress={handleClearData}
        >
          <Text style={styles.dangerButtonText}>Clear All Data</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          All data is stored locally on your device
        </Text>
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
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  section: {
    margin: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  settingDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    width: 80,
    textAlign: 'center',
  },
  notice: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
  },
  noticeText: {
    fontSize: 14,
    color: '#856404',
  },
  demoButton: {
    backgroundColor: '#2196f3',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  versionText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  progressCard: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  progressItem: {
    fontSize: 14,
    color: '#333',
    marginVertical: 5,
  },
  dangerButton: {
    backgroundColor: '#d32f2f',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  dangerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
  },
});
