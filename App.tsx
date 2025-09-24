import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import * as SplashScreen from 'expo-splash-screen';

// Import screens
import WelcomeScreen from './src/screens/auth/WelcomeScreen';
import OTPRequestScreen from './src/screens/auth/OTPRequestScreen';
import OTPVerifyScreen from './src/screens/auth/OTPVerifyScreen';
import HomeScreen from './src/screens/main/HomeScreen';
import FieldsScreen from './src/screens/main/FieldsScreen';
import ScanScreen from './src/screens/main/ScanScreen';
import WeatherScreen from './src/screens/main/WeatherScreen';
import PriceScreen from './src/screens/main/PriceScreen';
import SettingsScreen from './src/screens/main/SettingsScreen';

// Import providers
import LanguageProvider from './src/providers/LanguageProvider';

// Initialize QueryClient
const queryClient = new QueryClient();

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Stack Navigator for Auth
const AuthStack = createStackNavigator();
function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Welcome" component={WelcomeScreen} />
      <AuthStack.Screen name="OTPRequest" component={OTPRequestScreen} />
      <AuthStack.Screen name="OTPVerify" component={OTPVerifyScreen} />
    </AuthStack.Navigator>
  );
}

// Tab Navigator for Main App
const Tab = createBottomTabNavigator();
function MainTabNavigator() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Fields') {
            iconName = focused ? 'location' : 'location-outline';
          } else if (route.name === 'Scan') {
            iconName = focused ? 'scan' : 'scan-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4CAF50',
        tabBarInactiveTintColor: '#9E9E9E',
        tabBarStyle: {
          backgroundColor: '#2E7D32',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
          borderTopWidth: 0,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        headerShown: true,
        headerTitleStyle: { fontFamily: 'NotoSansThai_700Bold' },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ tabBarLabel: t('home') }}
      />
      <Tab.Screen 
        name="Scan" 
        component={ScanScreen} 
        options={{ tabBarLabel: t('scan') }}
      />
      <Tab.Screen 
        name="Fields" 
        component={FieldsScreen} 
        options={{ tabBarLabel: t('fields') }}
      />
    </Tab.Navigator>
  );
}

// Main App Component
function AppContent() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate app initialization
    const initializeApp = async () => {
      try {
        // Check if user is already authenticated
        // This would typically check AsyncStorage or MMKV
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsLoading(false);
        SplashScreen.hideAsync();
      } catch (error) {
        console.error('App initialization error:', error);
        setIsLoading(false);
        SplashScreen.hideAsync();
      }
    };

    initializeApp();
  }, []);

  if (isLoading) {
    return null; // Splash screen is shown
  }

  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      {isAuthenticated ? <MainTabNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

// Root App Component
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <LanguageProvider>
            <AppContent />
          </LanguageProvider>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}