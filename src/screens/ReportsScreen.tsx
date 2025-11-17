import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { storageService } from '../services/StorageService';
import { reportService } from '../services/ReportService';
import { DailySleepReport, DailyMemoryReport } from '../models/types';
import { format } from 'date-fns';

export const ReportsScreen: React.FC = () => {
  const [sleepReports, setSleepReports] = useState<DailySleepReport[]>([]);
  const [memoryReports, setMemoryReports] = useState<DailyMemoryReport[]>([]);
  const [selectedDate, setSelectedDate] = useState<number>(
    new Date().setHours(0, 0, 0, 0)
  );
  const [currentReport, setCurrentReport] = useState<{
    sleep: DailySleepReport | null;
    memory: DailyMemoryReport | null;
  }>({ sleep: null, memory: null });

  useEffect(() => {
    loadReports();
  }, []);

  useEffect(() => {
    loadCurrentReport();
  }, [selectedDate]);

  const loadReports = async () => {
    const sleep = await storageService.getAllSleepReports();
    const memory = await storageService.getAllMemoryReports();
    setSleepReports(sleep.sort((a, b) => b.date - a.date));
    setMemoryReports(memory.sort((a, b) => b.date - a.date));
  };

  const loadCurrentReport = async () => {
    const sleep = await storageService.getSleepReportByDate(selectedDate);
    let memory = await storageService.getMemoryReportByDate(selectedDate);
    
    if (!memory) {
      memory = await reportService.generateDailyMemoryReport(selectedDate);
    }
    
    setCurrentReport({ sleep, memory });
  };

  const formatDuration = (ms: number) => {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  };

  const getSleepQualityLabel = (quality: number) => {
    if (quality >= 80) return 'Excellent';
    if (quality >= 60) return 'Good';
    if (quality >= 40) return 'Fair';
    return 'Poor';
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Daily Reports</Text>
      </View>

      <View style={styles.dateSelector}>
        <Text style={styles.dateText}>
          {format(new Date(selectedDate), 'EEEE, MMMM dd, yyyy')}
        </Text>
      </View>

      {currentReport.sleep ? (
        <>
          <View style={styles.reportCard}>
            <Text style={styles.cardTitle}>Sleep Report</Text>
            
            <View style={styles.qualityContainer}>
              <Text style={styles.qualityLabel}>Sleep Quality</Text>
              <Text style={styles.qualityValue}>
                {Math.round(currentReport.sleep.sleepQuality)}%
              </Text>
              <Text style={styles.qualitySubtext}>
                {getSleepQualityLabel(currentReport.sleep.sleepQuality)}
              </Text>
            </View>

            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {formatDuration(currentReport.sleep.totalSleepTime)}
                </Text>
                <Text style={styles.statLabel}>Total Sleep</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {Math.round(currentReport.sleep.averageHeartRate)}
                </Text>
                <Text style={styles.statLabel}>Avg HR</Text>
              </View>
              
              <View style={styles.statBox}>
                <Text style={styles.statValue}>
                  {currentReport.sleep.cuesPlayed}
                </Text>
                <Text style={styles.statLabel}>Cues Played</Text>
              </View>
            </View>

            <View style={styles.stagesContainer}>
              <Text style={styles.stagesTitle}>Sleep Stages</Text>
              <View style={styles.stageRow}>
                <Text style={styles.stageName}>Light (NREM1)</Text>
                <Text style={styles.stageDuration}>
                  {formatDuration(currentReport.sleep.sleepStageBreakdown.NREM1)}
                </Text>
              </View>
              <View style={styles.stageRow}>
                <Text style={styles.stageName}>Deep (NREM2)</Text>
                <Text style={styles.stageDuration}>
                  {formatDuration(currentReport.sleep.sleepStageBreakdown.NREM2)}
                </Text>
              </View>
              <View style={styles.stageRow}>
                <Text style={styles.stageName}>Deeper (NREM3)</Text>
                <Text style={styles.stageDuration}>
                  {formatDuration(currentReport.sleep.sleepStageBreakdown.NREM3)}
                </Text>
              </View>
              <View style={styles.stageRow}>
                <Text style={styles.stageName}>REM</Text>
                <Text style={styles.stageDuration}>
                  {formatDuration(currentReport.sleep.sleepStageBreakdown.REM)}
                </Text>
              </View>
            </View>
          </View>

          {currentReport.memory && (
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>Memory Report</Text>
              
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {currentReport.memory.learningSessionsCount}
                  </Text>
                  <Text style={styles.statLabel}>Learning Sessions</Text>
                </View>
                
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>
                    {currentReport.memory.cuesPlayedCount}
                  </Text>
                  <Text style={styles.statLabel}>Cues Played</Text>
                </View>
              </View>

              <View style={styles.recommendationsContainer}>
                <Text style={styles.recommendationsTitle}>Recommendations</Text>
                {currentReport.memory.recommendations.map((rec, index) => (
                  <View key={index} style={styles.recommendationItem}>
                    <Text style={styles.recommendationBullet}>•</Text>
                    <Text style={styles.recommendationText}>{rec}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            No sleep data for this date. Start a sleep session to generate reports!
          </Text>
        </View>
      )}

      {sleepReports.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.cardTitle}>Recent Reports</Text>
          {sleepReports.slice(0, 5).map((report) => (
            <TouchableOpacity
              key={report.date}
              style={styles.historyItem}
              onPress={() => setSelectedDate(report.date)}
            >
              <Text style={styles.historyDate}>
                {format(new Date(report.date), 'MMM dd, yyyy')}
              </Text>
              <Text style={styles.historyQuality}>
                {Math.round(report.sleepQuality)}%
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
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
  dateSelector: {
    backgroundColor: '#fff',
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  dateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  reportCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  qualityContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    marginBottom: 15,
  },
  qualityLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  qualityValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#6200ee',
  },
  qualitySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 15,
  },
  statBox: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  stagesContainer: {
    marginTop: 15,
  },
  stagesTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  stageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stageName: {
    fontSize: 14,
    color: '#666',
  },
  stageDuration: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  recommendationsContainer: {
    marginTop: 15,
  },
  recommendationsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  recommendationItem: {
    flexDirection: 'row',
    marginVertical: 5,
  },
  recommendationBullet: {
    fontSize: 14,
    color: '#6200ee',
    marginRight: 10,
  },
  recommendationText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyDate: {
    fontSize: 14,
    color: '#333',
  },
  historyQuality: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6200ee',
  },
});
