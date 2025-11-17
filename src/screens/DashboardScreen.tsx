import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../contexts/AppContext';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { demoMode, currentSession, currentBiometrics } = useApp();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TMR Dashboard</Text>
        <Text style={styles.subtitle}>Targeted Memory Reactivation</Text>
      </View>

      <View style={styles.modeCard}>
        <Text style={styles.modeLabel}>Mode</Text>
        <Text style={styles.modeValue}>{demoMode ? '🔧 Demo Mode' : '📡 Real Mode (Not Implemented)'}</Text>
        <Text style={styles.modeDescription}>
          {demoMode 
            ? 'Using simulated biometric data for testing' 
            : 'Connected to real BLE devices'}
        </Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Session Status</Text>
        {currentSession ? (
          <>
            <Text style={styles.statusText}>Status: {currentSession.status}</Text>
            <Text style={styles.statusText}>
              Duration: {Math.floor((Date.now() - currentSession.startTime) / 1000)}s
            </Text>
            {currentBiometrics && (
              <>
                <Text style={styles.statusText}>Stage: {currentBiometrics.sleepStage}</Text>
                <Text style={styles.statusText}>HR: {Math.round(currentBiometrics.heartRate)} bpm</Text>
              </>
            )}
          </>
        ) : (
          <Text style={styles.statusText}>No active session</Text>
        )}
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Session')}
        >
          <Text style={styles.buttonText}>
            {currentSession ? 'View Session' : 'Start Session'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.quickActionsCard}>
        <Text style={styles.cardTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Cues')}
          >
            <Text style={styles.actionIcon}>🎵</Text>
            <Text style={styles.actionText}>Manage Cues</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Learning')}
          >
            <Text style={styles.actionIcon}>📚</Text>
            <Text style={styles.actionText}>Learning</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Settings')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
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
    padding: 30,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    marginTop: 5,
    opacity: 0.9,
  },
  modeCard: {
    backgroundColor: '#e3f2fd',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 2,
  },
  modeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  modeValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  modeDescription: {
    fontSize: 14,
    color: '#666',
  },
  statusCard: {
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
  statusText: {
    fontSize: 14,
    color: '#666',
    marginVertical: 3,
  },
  button: {
    backgroundColor: '#6200ee',
    padding: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  quickActionsCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
});
