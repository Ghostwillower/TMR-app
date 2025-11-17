import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { storageService } from '../services/StorageService';
import { DailySleepReport } from '../models/types';
import { format } from 'date-fns';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { 
    connectedWristband, 
    connectedHub, 
    currentSession,
    currentSleepStage,
  } = useApp();
  
  const [lastReport, setLastReport] = useState<DailySleepReport | null>(null);

  useEffect(() => {
    loadLastReport();
  }, []);

  const loadLastReport = async () => {
    const reports = await storageService.getAllSleepReports();
    if (reports.length > 0) {
      const sorted = reports.sort((a, b) => b.date - a.date);
      setLastReport(sorted[0]);
    }
  };

  const getConnectionStatus = () => {
    const wristbandStatus = connectedWristband ? '✓' : '✗';
    const hubStatus = connectedHub ? '✓' : '✗';
    return `Wristband: ${wristbandStatus} | Hub: ${hubStatus}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TMR Sleep App</Text>
        <Text style={styles.subtitle}>Targeted Memory Reactivation</Text>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Device Status</Text>
        <Text style={styles.statusText}>{getConnectionStatus()}</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Devices')}
        >
          <Text style={styles.buttonText}>Manage Devices</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Sleep Session</Text>
        {currentSession ? (
          <>
            <Text style={styles.statusText}>Status: Active</Text>
            <Text style={styles.statusText}>
              Stage: {currentSleepStage || 'Unknown'}
            </Text>
            <Text style={styles.statusText}>
              Duration: {Math.floor((Date.now() - currentSession.startTime) / 60000)} min
            </Text>
            <Text style={styles.statusText}>
              Cues Played: {currentSession.cuesPlayed.length}
            </Text>
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

      {lastReport && (
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Last Sleep Report</Text>
          <Text style={styles.statusText}>
            Date: {format(new Date(lastReport.date), 'MMM dd, yyyy')}
          </Text>
          <Text style={styles.statusText}>
            Sleep Quality: {Math.round(lastReport.sleepQuality)}%
          </Text>
          <Text style={styles.statusText}>
            Total Sleep: {Math.round(lastReport.totalSleepTime / 60000)} min
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.buttonText}>View All Reports</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.menuGrid}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('CueSets')}
        >
          <Text style={styles.menuIcon}>🎵</Text>
          <Text style={styles.menuText}>Cue Sets</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Learning')}
        >
          <Text style={styles.menuIcon}>📚</Text>
          <Text style={styles.menuText}>Learning</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Reports')}
        >
          <Text style={styles.menuIcon}>📊</Text>
          <Text style={styles.menuText}>Reports</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => navigation.navigate('Settings')}
        >
          <Text style={styles.menuIcon}>⚙️</Text>
          <Text style={styles.menuText}>Settings</Text>
        </TouchableOpacity>
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
  statusCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    justifyContent: 'space-between',
  },
  menuItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  menuIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  menuText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});
