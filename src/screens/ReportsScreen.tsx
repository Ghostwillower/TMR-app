import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export const ReportsScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Reports</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholderText}>📊 Reports</Text>
        <Text style={styles.placeholderSubtext}>
          Coming in Step 5: View session history and analytics
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
