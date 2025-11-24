import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Circle, G, Line, Text as SvgText } from 'react-native-svg';
import { sessionEngine, SessionLog } from '../services/SessionEngine';
import { learningModule, MemoryBoostResult } from '../services/LearningModule';
import {
  buildHideListForDots,
  buildTimeSeries,
  formatStageLabel,
  getCueIndices,
  stageLegend,
} from '../utils/reportCharts';

export const ReportsScreen: React.FC = () => {
  const [sessions, setSessions] = useState<SessionLog[]>([]);
  const [selectedSession, setSelectedSession] = useState<SessionLog | null>(null);
  const [memoryBoost, setMemoryBoost] = useState<MemoryBoostResult | null>(null);
  const [hasPreTest, setHasPreTest] = useState(false);
  const [hasPostTest, setHasPostTest] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  useEffect(() => {
    if (selectedSession) {
      loadMemoryInsights(selectedSession.id);
    } else {
      setMemoryBoost(null);
      setHasPreTest(false);
      setHasPostTest(false);
    }
  }, [selectedSession]);

  const loadSessions = async () => {
    const allSessions = await sessionEngine.getAllSessions();
    setSessions(allSessions.sort((a, b) => b.startTime - a.startTime));
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    return `${hours}h ${minutes % 60}m`;
  };

  const exportSession = (session: SessionLog) => {
    const data = JSON.stringify(session, null, 2);
    Alert.alert(
      'Export Session',
      'Session data (console logged):\n\n' + data.substring(0, 200) + '...',
      [{ text: 'OK' }]
    );
    console.log('Session export:', data);
  };

  const loadMemoryInsights = (sessionId: string) => {
    const tests = learningModule.getTestsBySessionId(sessionId);
    const preTests = tests
      .filter(test => test.type === 'pre-sleep')
      .sort((a, b) => b.timestamp - a.timestamp);
    const postTests = tests
      .filter(test => test.type === 'post-sleep')
      .sort((a, b) => b.timestamp - a.timestamp);

    setHasPreTest(preTests.length > 0);
    setHasPostTest(postTests.length > 0);

    if (preTests.length === 0 || postTests.length === 0) {
      setMemoryBoost(null);
      return;
    }

    const boost = learningModule.calculateMemoryBoost(preTests[0].id, postTests[0].id);
    setMemoryBoost(boost);
  };

  const renderCueDot = (
    x: number,
    y: number,
    index: number,
    cueIndexMap: Record<number, SessionLog['cuesPlayed']>,
  ) => {
    const cues = cueIndexMap[index];
    if (!cues || cues.length === 0) return null;

    const label = cues.length > 1 ? `${cues.length} cues` : cues[0].cueName;

    return (
      <G key={`cue-${index}`}>
        <Line x1={x} y1={y} x2={x} y2={y - 18} stroke="#ff4081" strokeWidth={2} />
        <Circle cx={x} cy={y} r={5} fill="#ff4081" />
        <SvgText x={x} y={y - 22} fontSize="10" fill="#ff4081" textAnchor="middle">
          {label}
        </SvgText>
      </G>
    );
  };

  const renderTrendChart = (
    title: string,
    description: string,
    series: ReturnType<typeof buildTimeSeries>,
    options?: { formatYLabel?: (value: string) => string; color?: string },
  ) => {
    const chartWidth = Dimensions.get('window').width - 50;
    const cueIndices = getCueIndices(series.cueIndexMap);
    const hidePointsAtIndex = buildHideListForDots(cueIndices, series.data.length);

    if (series.data.length === 0) {
      return (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{title}</Text>
          <Text style={styles.emptySubtext}>{description}</Text>
          <Text style={styles.emptySubtext}>No biometric data recorded for this session.</Text>
        </View>
      );
    }

    return (
      <View style={styles.detailCard}>
        <Text style={styles.detailTitle}>{title}</Text>
        <Text style={styles.chartDescription}>{description}</Text>
        <LineChart
          data={{
            labels: series.labels,
            datasets: [
              {
                data: series.data,
                color: (opacity = 1) => options?.color || `rgba(98, 0, 238, ${opacity})`,
              },
            ],
          }}
          width={chartWidth}
          height={240}
          yAxisSuffix=""
          formatYLabel={options?.formatYLabel}
          withShadow={false}
          fromZero
          withDots={cueIndices.length > 0}
          hidePointsAtIndex={hidePointsAtIndex}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(98, 0, 238, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            propsForBackgroundLines: {
              stroke: '#f0f0f0',
            },
            propsForDots: {
              r: '5',
              strokeWidth: '2',
              stroke: '#fff',
            },
          }}
          style={styles.chart}
          renderDotContent={({ x, y, index }) =>
            renderCueDot(x, y, index, series.cueIndexMap)
          }
          bezier
        />
      </View>
    );
  };

  if (selectedSession) {
    const stageSeries = useMemo(
      () => buildTimeSeries(selectedSession.biometricLogs, selectedSession.cuesPlayed, 'sleepStage'),
      [selectedSession.biometricLogs, selectedSession.cuesPlayed],
    );
    const heartRateSeries = useMemo(
      () => buildTimeSeries(selectedSession.biometricLogs, selectedSession.cuesPlayed, 'heartRate'),
      [selectedSession.biometricLogs, selectedSession.cuesPlayed],
    );
    const movementSeries = useMemo(
      () => buildTimeSeries(selectedSession.biometricLogs, selectedSession.cuesPlayed, 'movement'),
      [selectedSession.biometricLogs, selectedSession.cuesPlayed],
    );
    const temperatureSeries = useMemo(
      () => buildTimeSeries(selectedSession.biometricLogs, selectedSession.cuesPlayed, 'temperature'),
      [selectedSession.biometricLogs, selectedSession.cuesPlayed],
    );

    return (
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => setSelectedSession(null)}
          >
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Session Details</Text>
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Session Information</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date:</Text>
            <Text style={styles.detailValue}>{formatDate(selectedSession.startTime)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Duration:</Text>
            <Text style={styles.detailValue}>
              {formatDuration((selectedSession.endTime || Date.now()) - selectedSession.startTime)}
            </Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Status:</Text>
            <Text style={styles.detailValue}>{selectedSession.status}</Text>
          </View>
          {selectedSession.notes && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Notes:</Text>
              <Text style={styles.detailValue}>{selectedSession.notes}</Text>
            </View>
          )}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Sleep Stage Timeline</Text>
          <Text style={styles.chartDescription}>Track stage shifts over time with cue markers.</Text>
          {Object.entries(selectedSession.stageTimings).map(([stage, time]) => (
            <View key={stage} style={styles.stageBar}>
              <Text style={styles.stageName}>{stage}</Text>
              <View style={styles.stageProgress}>
                <View
                  style={[
                    styles.stageProgressFill,
                    {
                      width: `${(time / ((selectedSession.endTime || Date.now()) - selectedSession.startTime)) * 100}%`,
                      backgroundColor: getStageColor(stage),
                    },
                  ]}
                />
              </View>
              <Text style={styles.stageTime}>{formatDuration(time)}</Text>
            </View>
          ))}
          <View style={styles.stageLegendRow}>
            {stageLegend.map(stage => (
              <View key={stage.label} style={styles.legendItem}>
                <View style={[styles.legendSwatch, { backgroundColor: getStageColor(stage.label) }]} />
                <Text style={styles.legendText}>{stage.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {renderTrendChart(
          'Sleep Stages Over Time',
          'Higher values indicate lighter sleep; cue markers appear where sounds were played.',
          stageSeries,
          { formatYLabel: formatStageLabel },
        )}

        {renderTrendChart(
          'Heart Rate',
          'Shows heart rate samples throughout the session with cue overlays.',
          heartRateSeries,
          { color: 'rgba(33, 150, 243, 1)' },
        )}

        {renderTrendChart(
          'Movement',
          'Captures movement intensity; spikes can indicate arousals.',
          movementSeries,
          { color: 'rgba(255, 193, 7, 1)' },
        )}

        {renderTrendChart(
          'Temperature',
          'Skin temperature trend for the session.',
          temperatureSeries,
          { color: 'rgba(156, 39, 176, 1)' },
        )}

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Cue Performance</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cue Allowed Count:</Text>
            <Text style={styles.detailValue}>{selectedSession.cueAllowedCount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Cues Played:</Text>
            <Text style={styles.detailValue}>{selectedSession.cuesPlayed.length}</Text>
          </View>

          {selectedSession.cuesPlayed.length > 0 && (
            <>
              <Text style={styles.cuesListTitle}>Cue Timestamps:</Text>
              {selectedSession.cuesPlayed.map((cue, index) => (
                <View key={index} style={styles.cueItem}>
                  <Text style={styles.cueName}>{cue.cueName}</Text>
                  <Text style={styles.cueStage}>{cue.sleepStage}</Text>
                  <Text style={styles.cueTime}>
                    {new Date(cue.timestamp).toLocaleTimeString()}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Biometric Summary</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Total Readings:</Text>
            <Text style={styles.detailValue}>{selectedSession.biometricLogs.length}</Text>
          </View>
          {selectedSession.biometricLogs.length > 0 && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Avg Heart Rate:</Text>
                <Text style={styles.detailValue}>
                  {Math.round(
                    selectedSession.biometricLogs.reduce((sum, log) => sum + log.heartRate, 0) /
                      selectedSession.biometricLogs.length
                  )}{' '}
                  bpm
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Avg Movement:</Text>
                <Text style={styles.detailValue}>
                  {Math.round(
                    selectedSession.biometricLogs.reduce((sum, log) => sum + log.movement, 0) /
                      selectedSession.biometricLogs.length
                  )}
                </Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>Learning Impact</Text>
          {!hasPreTest && !hasPostTest && (
            <Text style={styles.emptySubtext}>
              Complete pre- and post-sleep tests to estimate memory boost for this session.
            </Text>
          )}

          {(hasPreTest || hasPostTest) && !memoryBoost && (
            <Text style={styles.emptySubtext}>
              Waiting for both pre- and post-sleep tests to calculate learning gains.
            </Text>
          )}

          {memoryBoost && (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cued Items:</Text>
                <Text style={styles.detailValue}>
                  {memoryBoost.cuedDelta.toFixed(1)}% Δ ({memoryBoost.cuedItemsCount} items)
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Uncued Items:</Text>
                <Text style={styles.detailValue}>
                  {memoryBoost.uncuedDelta.toFixed(1)}% Δ ({memoryBoost.uncuedItemsCount} items)
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estimated Boost:</Text>
                <Text style={styles.detailValue}>
                  {memoryBoost.estimatedBoost >= 0 ? '+' : ''}
                  {memoryBoost.estimatedBoost.toFixed(1)}%
                </Text>
              </View>
              <Text style={styles.chartDescription}>
                Positive values indicate stronger improvements for cued items versus uncued material.
              </Text>
            </>
          )}
        </View>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={() => exportSession(selectedSession)}
        >
          <Text style={styles.exportButtonText}>Export as JSON</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Session History</Text>
      </View>

      {sessions.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>📊</Text>
          <Text style={styles.emptyText}>No sessions yet</Text>
          <Text style={styles.emptySubtext}>
            Complete a session to see reports here
          </Text>
        </View>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.sessionCard}
              onPress={() => setSelectedSession(item)}
            >
              <View style={styles.sessionHeader}>
                <Text style={styles.sessionDate}>
                  {formatDate(item.startTime)}
                </Text>
                <Text style={styles.sessionDuration}>
                  {formatDuration((item.endTime || Date.now()) - item.startTime)}
                </Text>
              </View>
              <View style={styles.sessionStats}>
                <Text style={styles.sessionStat}>
                  🎵 {item.cuesPlayed.length} cues
                </Text>
                <Text style={styles.sessionStat}>
                  ✓ {item.cueAllowedCount} opportunities
                </Text>
              </View>
              {item.notes && (
                <Text style={styles.sessionNotes} numberOfLines={1}>
                  {item.notes}
                </Text>
              )}
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const getStageColor = (stage: string) => {
  switch (stage) {
    case 'Awake': return '#ff5722';
    case 'Light': return '#ffc107';
    case 'Deep': return '#2196f3';
    case 'REM': return '#9c27b0';
    default: return '#757575';
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#6200ee',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#999',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 5,
    textAlign: 'center',
  },
  list: {
    padding: 15,
  },
  sessionCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sessionDuration: {
    fontSize: 14,
    color: '#666',
  },
  sessionStats: {
    flexDirection: 'row',
    gap: 15,
  },
  sessionStat: {
    fontSize: 14,
    color: '#666',
  },
  sessionNotes: {
    fontSize: 12,
    color: '#999',
    marginTop: 5,
    fontStyle: 'italic',
  },
  detailCard: {
    backgroundColor: '#fff',
    margin: 15,
    padding: 20,
    borderRadius: 10,
    elevation: 3,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  chartDescription: {
    fontSize: 13,
    color: '#777',
    marginBottom: 12,
  },
  chart: {
    marginLeft: -10,
  },
  stageBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  stageName: {
    width: 60,
    fontSize: 12,
    color: '#666',
  },
  stageProgress: {
    flex: 1,
    height: 20,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 10,
  },
  stageProgressFill: {
    height: '100%',
  },
  stageTime: {
    width: 60,
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
  },
  stageLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
    marginBottom: 8,
  },
  legendSwatch: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
  cuesListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  cueItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cueName: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  cueStage: {
    fontSize: 12,
    color: '#666',
    marginHorizontal: 10,
  },
  cueTime: {
    fontSize: 12,
    color: '#999',
  },
  exportButton: {
    backgroundColor: '#6200ee',
    margin: 15,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
