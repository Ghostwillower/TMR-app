import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentPage, setCurrentPage] = useState(0);

  const pages = [
    {
      icon: '🧠',
      title: 'Welcome to TMR',
      description: 'Targeted Memory Reactivation enhances memory consolidation during sleep by replaying cues at optimal times.',
    },
    {
      icon: '🌙',
      title: 'How It Works',
      description: 'During sleep, the app monitors your sleep stages and plays audio cues only during safe NREM periods (Light and Deep sleep).',
    },
    {
      icon: '🎵',
      title: 'Audio Cues',
      description: 'Create cue sets linked to learning sessions. These cues help reactivate memories during sleep for better retention.',
    },
    {
      icon: '📚',
      title: 'Learning Items',
      description: 'Add flashcards and link them to cues. Take pre-sleep and post-sleep tests to measure your memory improvement.',
    },
    {
      icon: '📊',
      title: 'Track Progress',
      description: 'View detailed reports of your sleep sessions, cue performance, and memory boost statistics.',
    },
    {
      icon: '🔧',
      title: 'Demo Mode',
      description: 'Start in demo mode with simulated data. When you have BLE devices, switch to Real Mode in Settings.',
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

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.pageContainer}>
          <Text style={styles.icon}>{currentPageData.icon}</Text>
          <Text style={styles.title}>{currentPageData.title}</Text>
          <Text style={styles.description}>{currentPageData.description}</Text>
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

        <TouchableOpacity style={styles.nextButton} onPress={nextPage}>
          <Text style={styles.nextButtonText}>
            {currentPage === pages.length - 1 ? 'Get Started' : 'Next'}
          </Text>
        </TouchableOpacity>

        {currentPage === pages.length - 1 && (
          <View style={styles.demoTip}>
            <Text style={styles.demoTipText}>
              💡 Tip: Try the "Run 5-Minute Demo Night" in Settings to see the full experience!
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#6200ee',
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 15,
    marginTop: 40,
  },
  skipText: {
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  pageContainer: {
    alignItems: 'center',
    marginBottom: 50,
  },
  icon: {
    fontSize: 100,
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.9,
  },
  pagination: {
    flexDirection: 'row',
    marginBottom: 40,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginHorizontal: 5,
  },
  activeDot: {
    backgroundColor: '#fff',
    width: 30,
  },
  nextButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 30,
  },
  nextButtonText: {
    color: '#6200ee',
    fontSize: 18,
    fontWeight: 'bold',
  },
  demoTip: {
    marginTop: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    padding: 15,
    borderRadius: 10,
  },
  demoTipText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
  },
});
