import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Easing } from 'react-native';
import { theme } from '../theme';
import { BrandLogo } from '../components/BrandLogo';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const cardAnim = useRef(new Animated.Value(1)).current;
  const hintAnim = useRef(new Animated.Value(0)).current;

  const pages = [
    {
      icon: '🧠',
      title: 'Welcome to TMR',
      description:
        'Targeted Memory Reactivation enhances memory consolidation during sleep by replaying cues at optimal times.',
    },
    {
      icon: '🌙',
      title: 'How It Works',
      description:
        'During sleep, the app monitors your sleep stages and plays audio cues only during safe NREM periods (Light and Deep sleep).',
    },
    {
      icon: '🎵',
      title: 'Audio Cues',
      description:
        'Create cue sets linked to learning sessions. These cues help reactivate memories during sleep for better retention.',
    },
    {
      icon: '📚',
      title: 'Learning Items',
      description:
        'Add flashcards and link them to cues. Take pre-sleep and post-sleep tests to measure your memory improvement.',
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description:
        'View detailed reports of your sleep sessions, cue performance, and memory boost statistics.',
    },
    {
      icon: '🔧',
      title: 'Demo Mode',
      description:
        'Start in demo mode with simulated data. When you have BLE devices, switch to Real Mode in Settings.',
    },
  ];

  const nextPage = () => {
    if (currentPage < pages.length - 1) {
      setCurrentPage(currentPage + 1);
    } else {
      onComplete();
    }
  };

  const skipOnboarding = () => {
    onComplete();
  };

  const currentPageData = pages[currentPage];

  useEffect(() => {
    cardAnim.setValue(0.8);
    hintAnim.setValue(0);

    Animated.parallel([
      Animated.spring(cardAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 7,
        tension: 90,
      }),
      Animated.timing(hintAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [cardAnim, hintAnim, currentPage]);

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.brandLeft}>
          <BrandLogo size={44} withGlow />
          <View style={styles.brandTextGroup}>
            <Text style={styles.brand}>TMR</Text>
            <Text style={styles.brandTagline}>Sleep smarter with cues</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View style={[styles.card, cardMotion(cardAnim)]}>
          <View style={styles.mascotHalo}>
            <BrandLogo size={86} />
          </View>
          <Text style={styles.icon}>{currentPageData.icon}</Text>
          <Text style={styles.title}>{currentPageData.title}</Text>
          <Text style={styles.description}>{currentPageData.description}</Text>
        </Animated.View>

        <View style={styles.progressRow}>
          <View style={styles.stepLabelGroup}>
            <Text style={styles.stepLabel}>Step {currentPage + 1} of {pages.length}</Text>
            <Text style={styles.stepHint}>Swipe or tap next to continue</Text>
          </View>
          <View style={styles.pagination}>
            {pages.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  index === currentPage && styles.activeDot,
                ]}
              />
            ))}
          </View>
        </View>

        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        <Animated.View style={[styles.hintCard, fadeUp(hintAnim)]}>
          <Text style={styles.hintTitle}>Polished experience</Text>
          <Text style={styles.hintText}>
            Guided onboarding, richer visuals, and a ready-to-run demo night make it easy to experience Targeted Memory Reactivation.
          </Text>
        </Animated.View>

        {currentPage === pages.length - 1 && (
          <Animated.View style={[styles.demoTip, fadeUp(hintAnim)]}>
            <Text style={styles.demoTipText}>
              💡 Tip: Try the "Run 5-Minute Demo Night" in Settings to see the full experience!
            </Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const fadeUp = (value: Animated.Value) => ({
  opacity: value,
  transform: [
    {
      translateY: value.interpolate({
        inputRange: [0, 1],
        outputRange: [8, 0],
      }),
    },
  ],
});

const cardMotion = (value: Animated.Value) => ({
  transform: [
    { scale: value },
    {
      translateY: value.interpolate({
        inputRange: [0.8, 1],
        outputRange: [20, 0],
      }),
    },
  ],
  opacity: value.interpolate({
    inputRange: [0.8, 1],
    outputRange: [0.4, 1],
  }),
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  brandLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brand: {
    fontWeight: '800',
    fontSize: 20,
    color: theme.colors.primary,
  },
  brandTextGroup: {
    marginLeft: 12,
  },
  brandTagline: {
    color: theme.colors.muted,
    marginTop: 2,
  },
  skipButton: {
    padding: 12,
  },
  skipText: {
    color: theme.colors.muted,
    fontSize: 16,
  },
  content: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 10,
  },
  card: {
    backgroundColor: theme.colors.surface,
    padding: 30,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    ...theme.shadow.card,
  },
  mascotHalo: {
    position: 'absolute',
    top: -28,
    alignSelf: 'center',
    opacity: 0.86,
  },
  icon: {
    fontSize: 92,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: theme.colors.muted,
    textAlign: 'center',
    lineHeight: 24,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepLabelGroup: {
    flex: 1,
  },
  stepLabel: {
    fontWeight: '700',
    color: '#0f172a',
  },
  stepHint: {
    color: theme.colors.muted,
    marginTop: 4,
  },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: theme.colors.border,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: theme.colors.primary,
    width: 26,
  },
  nextButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: theme.radius.xl,
    alignItems: 'center',
    ...theme.shadow.card,
  },
  nextButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  hintCard: {
    backgroundColor: '#eef2ff',
    padding: 18,
    borderRadius: theme.radius.lg,
    marginTop: 20,
    borderColor: theme.colors.border,
    borderWidth: 1,
  },
  hintTitle: {
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  hintText: {
    color: '#0f172a',
    lineHeight: 20,
  },
  demoTip: {
    marginTop: 18,
    backgroundColor: '#ecfdf3',
    padding: 14,
    borderRadius: theme.radius.md,
    borderColor: '#bbf7d0',
    borderWidth: 1,
  },
  demoTipText: {
    color: '#166534',
    fontSize: 14,
    textAlign: 'center',
  },
});
