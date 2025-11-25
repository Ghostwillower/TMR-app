import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { useApp } from '../contexts/AppContext';
import { sessionEngine } from '../services/SessionEngine';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

export const DashboardScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { demoMode, currentSession, currentBiometrics, cues, learningItems } = useApp();
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalCuesPlayed, setTotalCuesPlayed] = useState(0);
  const headerAnim = useRef(new Animated.Value(0)).current;
  const highlightAnim = useRef(new Animated.Value(0)).current;
  const statusAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const actionsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(headerAnim, {
        toValue: 1,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(highlightAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(statusAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(actionsAnim, {
        toValue: 1,
        duration: 320,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [headerAnim, highlightAnim, statusAnim, statsAnim, actionsAnim]);

  const loadStats = async () => {
    const sessions = await sessionEngine.getAllSessions();
    setTotalSessions(sessions.length);
    const totalCues = sessions.reduce((sum, session) => sum + session.cuesPlayed.length, 0);
    setTotalCuesPlayed(totalCues);
  };

  return (
    <ScrollView style={styles.container}>
      <Animated.View style={[styles.header, fadeSlide(headerAnim)]}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <BrandLogo size={64} withGlow />
          </View>
          <View style={styles.titleGroup}>
            <Text style={styles.title}>TMR</Text>
            <Text style={styles.subtitle}>Targeted Memory Reactivation</Text>
            <View style={styles.brandChips}>
              <View style={styles.brandChip}><Text style={styles.brandChipText}>Sleep smart</Text></View>
              <View style={styles.brandChipMuted}><Text style={styles.brandChipMutedText}>Cue guardian</Text></View>
            </View>
          </View>
        </View>
        <View style={styles.statusChip}>
          <Text style={styles.statusChipText}>{demoMode ? 'Demo Mode' : 'Real Mode'}</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.highlightCard, fadeSlide(highlightAnim)]}>
        <View style={styles.logoGhost}>
          <BrandLogo size={120} />
        </View>
        <View style={styles.highlightLeft}>
          <Text style={styles.highlightLabel}>Tonight's Readiness</Text>
          <Text style={styles.highlightValue}>{currentBiometrics ? 'Optimized' : 'Setup Ready'}</Text>
          <Text style={styles.highlightSubtext}>
            {currentSession
              ? 'Monitoring sleep quality with adaptive cueing'
              : 'Start a session to begin guided cue delivery'}
          </Text>
          <View style={styles.chipRow}>
            <View style={styles.chip}><Text style={styles.chipText}>Sleep safe</Text></View>
            <View style={styles.chipSecondary}><Text style={styles.chipSecondaryText}>Adaptive</Text></View>
          </View>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('Session')}>
          <Text style={styles.primaryButtonText}>{currentSession ? 'View Session' : 'Start Session'}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.statusCard, fadeSlide(statusAnim)]}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Session Status</Text>
          {currentSession && <Text style={styles.badge}>{currentSession.status.toUpperCase()}</Text>}
        </View>
        {currentSession ? (
          <>
            <Text style={styles.statusText}>Elapsed: {Math.floor((Date.now() - currentSession.startTime) / 1000)}s</Text>
            {currentBiometrics && (
              <View style={styles.statRow}>
                <View style={styles.statPill}>
                  <Text style={styles.statPillLabel}>Stage</Text>
                  <Text style={styles.statPillValue}>{currentBiometrics.sleepStage}</Text>
                </View>
                <View style={styles.statPill}>
                  <Text style={styles.statPillLabel}>HR</Text>
                  <Text style={styles.statPillValue}>{Math.round(currentBiometrics.heartRate)} bpm</Text>
                </View>
              </View>
            )}
          </>
        ) : (
          <Text style={styles.statusText}>No active session yet</Text>
        )}
      </Animated.View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Progress Overview</Text>
        <Text style={styles.sectionHint}>Updated from your recent nights</Text>
      </View>
      <Animated.View style={[styles.statsGrid, fadeSlide(statsAnim)]}>
        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📊</Text>
          <Text style={styles.statValue}>{totalSessions}</Text>
          <Text style={styles.statLabel}>Total Sessions</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>🎵</Text>
          <Text style={styles.statValue}>{cues.length}</Text>
          <Text style={styles.statLabel}>Cues</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>📚</Text>
          <Text style={styles.statValue}>{learningItems.length}</Text>
          <Text style={styles.statLabel}>Flashcards</Text>
        </View>

        <View style={styles.statCard}>
          <Text style={styles.statIcon}>✨</Text>
          <Text style={styles.statValue}>{totalCuesPlayed}</Text>
          <Text style={styles.statLabel}>Cues Played</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.quickActionsCard, fadeSlide(actionsAnim)]}>
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
      </Animated.View>
    </ScrollView>
  );
};

const fadeSlide = (value: Animated.Value) => ({
  opacity: value,
  transform: [
    {
      translateY: value.interpolate({
        inputRange: [0, 1],
        outputRange: [12, 0],
      }),
    },
    {
      scale: value.interpolate({
        inputRange: [0, 1],
        outputRange: [0.98, 1],
      }),
    },
  ],
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    margin: theme.spacing.md,
    borderRadius: theme.radius.lg,
    ...theme.shadow.card,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  logoBadge: {
    backgroundColor: '#fef9c3',
    borderRadius: 16,
    padding: 8,
    marginRight: theme.spacing.md,
    borderWidth: 1,
    borderColor: '#fef08a',
  },
  titleGroup: {
    flex: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    marginTop: 6,
  },
  brandChips: {
    flexDirection: 'row',
    marginTop: theme.spacing.xs,
  },
  brandChip: {
    backgroundColor: '#fef9c3',
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    marginRight: theme.spacing.xs,
  },
  brandChipText: {
    color: '#92400e',
    fontWeight: '700',
    fontSize: 12,
  },
  brandChipMuted: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  brandChipMutedText: {
    color: theme.colors.muted,
    fontWeight: '700',
    fontSize: 12,
  },
  statusChip: {
    backgroundColor: '#fef9c3',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: '#fde68a',
  },
  statusChipText: {
    fontWeight: '700',
    color: '#92400e',
  },
  highlightCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
    overflow: 'hidden',
  },
  logoGhost: {
    position: 'absolute',
    right: -10,
    top: -16,
    opacity: 0.12,
    pointerEvents: 'none',
  },
  highlightLeft: {
    flex: 1,
    paddingRight: theme.spacing.md,
  },
  highlightLabel: {
    fontSize: 14,
    color: theme.colors.muted,
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  highlightSubtext: {
    color: theme.colors.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  chip: {
    backgroundColor: '#ecfdf3',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  chipText: {
    color: theme.colors.success,
    fontWeight: '700',
  },
  chipSecondary: {
    backgroundColor: '#eef2ff',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  chipSecondaryText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.radius.md,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  statusCard: {
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  badge: {
    backgroundColor: '#eef2ff',
    color: theme.colors.primary,
    fontWeight: '700',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.md,
  },
  statusText: {
    fontSize: 14,
    color: theme.colors.muted,
    marginVertical: 3,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.md,
  },
  statPill: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: theme.spacing.md,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statPillLabel: {
    color: theme.colors.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  statPillValue: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionHeader: {
    paddingHorizontal: theme.spacing.md,
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0f172a',
  },
  sectionHint: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.md,
  },
  statCard: {
    width: '48%',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    alignItems: 'center',
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  statIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    textAlign: 'center',
  },
  quickActionsCard: {
    backgroundColor: theme.colors.surface,
    margin: theme.spacing.md,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: theme.colors.background,
    padding: theme.spacing.lg,
    borderRadius: theme.radius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
});
