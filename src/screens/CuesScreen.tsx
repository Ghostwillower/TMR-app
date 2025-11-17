import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const CuesScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Cue Manager</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>🎵 Cue Manager</Text>
        <Text style={styles.placeholderSubtext}>
          Coming in Step 3: Add and manage audio cues
        </Text>
      </View>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  placeholderText: {
    fontSize: 48,
    marginBottom: 20,
  },
  placeholderSubtext: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
});
