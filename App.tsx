import React, { useState, useEffect } from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppProvider } from './src/contexts/AppContext';
import { DashboardScreen } from './src/screens/DashboardScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { CuesScreen } from './src/screens/CuesScreen';
import { LearningScreen } from './src/screens/LearningScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { OnboardingScreen } from './src/screens/OnboardingScreen';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string }> = ({ icon }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};

export default function App() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    try {
      const hasSeenOnboarding = await AsyncStorage.getItem('hasSeenOnboarding');
      setShowOnboarding(hasSeenOnboarding !== 'true');
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
      setShowOnboarding(false);
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  if (loading) {
    return null;
  }

  if (showOnboarding) {
    return <OnboardingScreen onComplete={handleOnboardingComplete} />;
  }
  return (
    <AppProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: '#6200ee',
            tabBarInactiveTintColor: '#999',
            tabBarStyle: {
              paddingBottom: 5,
              paddingTop: 5,
              height: 60,
            },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarLabel: 'Dashboard',
              tabBarIcon: () => <TabIcon icon="🏠" />,
            }}
          />
          <Tab.Screen
            name="Session"
            component={SessionScreen}
            options={{
              tabBarLabel: 'Session',
              tabBarIcon: () => <TabIcon icon="🌙" />,
            }}
          />
          <Tab.Screen
            name="Cues"
            component={CuesScreen}
            options={{
              tabBarLabel: 'Cues',
              tabBarIcon: () => <TabIcon icon="🎵" />,
            }}
          />
          <Tab.Screen
            name="Learning"
            component={LearningScreen}
            options={{
              tabBarLabel: 'Learning',
              tabBarIcon: () => <TabIcon icon="📚" />,
            }}
          />
          <Tab.Screen
            name="Reports"
            component={ReportsScreen}
            options={{
              tabBarLabel: 'Reports',
              tabBarIcon: () => <TabIcon icon="📊" />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Settings',
              tabBarIcon: () => <TabIcon icon="⚙️" />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </AppProvider>
  );
}
