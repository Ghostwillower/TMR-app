import React, { useState, useEffect, ReactNode, useMemo } from 'react';
import { Text, View } from 'react-native';
import {
  NavigationContainer,
  DarkTheme as NavigationDarkTheme,
  DefaultTheme as NavigationDefaultTheme,
} from '@react-navigation/native';
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
import { BrandLogo } from './src/components/BrandLogo';
import { ThemeProvider, useTheme } from './src/contexts/ThemeContext';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon?: string; children?: ReactNode }> = ({ icon, children }) => {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      {children ?? <Text style={{ fontSize: 24 }}>{icon}</Text>}
    </View>
  );
};

const AppNavigation = () => {
  const { theme, mode } = useTheme();

  const navigationTheme = useMemo(
    () => ({
      ...(mode === 'dark' ? NavigationDarkTheme : NavigationDefaultTheme),
      colors: {
        ...(mode === 'dark' ? NavigationDarkTheme.colors : NavigationDefaultTheme.colors),
        background: theme.colors.background,
        card: theme.colors.surface,
        text: theme.colors.text,
        primary: theme.colors.primary,
        border: theme.colors.border,
      },
    }),
    [mode, theme]
  );

  return (
    <NavigationContainer theme={navigationTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: theme.colors.primary,
          tabBarInactiveTintColor: theme.colors.muted,
          tabBarLabelStyle: { fontWeight: '600', fontSize: 12 },
          tabBarStyle: {
            backgroundColor: theme.colors.surface,
            paddingBottom: 8,
            paddingTop: 8,
            height: 68,
            borderTopColor: theme.colors.border,
            borderTopWidth: 1,
          },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Dashboard',
            tabBarIcon: () => (
              <TabIcon>
                <BrandLogo size={32} />
              </TabIcon>
            ),
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
  );
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
      <ThemeProvider>
        <AppNavigation />
      </ThemeProvider>
    </AppProvider>
  );
}
