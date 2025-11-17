import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { AppProvider } from './src/contexts/AppContext';
import { HomeScreen } from './src/screens/HomeScreen';
import { DevicesScreen } from './src/screens/DevicesScreen';
import { SessionScreen } from './src/screens/SessionScreen';
import { CueSetsScreen } from './src/screens/CueSetsScreen';
import { LearningScreen } from './src/screens/LearningScreen';
import { ReportsScreen } from './src/screens/ReportsScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

const TabIcon: React.FC<{ icon: string }> = ({ icon }) => {
  return <Text style={{ fontSize: 24 }}>{icon}</Text>;
};

export default function App() {
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
            name="Home"
            component={HomeScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: () => <TabIcon icon="🏠" />,
            }}
          />
          <Tab.Screen
            name="Devices"
            component={DevicesScreen}
            options={{
              tabBarLabel: 'Devices',
              tabBarIcon: () => <TabIcon icon="📡" />,
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
            name="CueSets"
            component={CueSetsScreen}
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
