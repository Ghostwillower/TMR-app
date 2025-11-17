import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
} from 'react-native';
import { useApp } from '../contexts/AppContext';

export const SettingsScreen: React.FC = () => {
  const { demoMode, settings, toggleDemoMode, toggleDarkMode } = useApp();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mode</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Demo Mode</Text>
            <Text style={styles.settingDescription}>
              Use simulated biometric data for testing
            </Text>
          </View>
          <Switch
            value={demoMode}
            onValueChange={toggleDemoMode}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={demoMode ? '#6200ee' : '#f4f3f4'}
          />
        </View>
        {!demoMode && (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              ⚠️ Real Mode not yet implemented. BLE connectivity coming in Step 9.
            </Text>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingLabel}>Dark Mode</Text>
            <Text style={styles.settingDescription}>
              Use dark theme (Coming in Step 6)
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
          <Text style={styles.versionText}>Version 1.0.0 (Step 1)</Text>
          <Text style={styles.descriptionText}>
            This app enhances memory consolidation during sleep by playing
            audio cues at optimal times.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Implementation Progress</Text>
        <View style={styles.progressCard}>
          <Text style={styles.progressItem}>✅ Step 1: App shell and demo mode</Text>
          <Text style={styles.progressItem}>⬜ Step 2: Session engine and logging</Text>
          <Text style={styles.progressItem}>⬜ Step 3: Cue Manager and audio</Text>
          <Text style={styles.progressItem}>⬜ Step 4: Learning module</Text>
          <Text style={styles.progressItem}>⬜ Step 5: Reports and history</Text>
          <Text style={styles.progressItem}>⬜ Step 6: Settings and safety</Text>
          <Text style={styles.progressItem}>⬜ Step 7: Better demo mode</Text>
          <Text style={styles.progressItem}>⬜ Step 8: Debug tools</Text>
          <Text style={styles.progressItem}>⬜ Step 9: Hardware integration</Text>
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
});
