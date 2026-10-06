import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, LinkingOptions } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

import { AuthStackParamList, MainTabParamList, RootStackParamList } from './types';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SignupScreen } from '../screens/SignupScreen';
import { PhoneOtpScreen } from '../screens/PhoneOtpScreen';
import { ForgotPasswordScreen } from '../screens/ForgotPasswordScreen';
import { ResetPasswordScreen } from '../screens/ResetPasswordScreen';

import { HomeScreen } from '../screens/HomeScreen';
import { ExploreScreen } from '../screens/ExploreScreen';
import { BookingsListScreen } from '../screens/BookingsListScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

import { TrekDetailScreen } from '../screens/TrekDetailScreen';
import { DepartureDetailScreen } from '../screens/DepartureDetailScreen';
import { SeatSelectionScreen } from '../screens/SeatSelectionScreen';
import { BookingCheckoutScreen } from '../screens/BookingCheckoutScreen';
import { BookingConfirmationScreen } from '../screens/BookingConfirmationScreen';
import { BookingDetailScreen } from '../screens/BookingDetailScreen';
import { AccountSettingsScreen } from '../screens/AccountSettingsScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { GuideDashboardScreen } from '../screens/GuideDashboardScreen';
import { AdminDashboardScreen } from '../screens/AdminDashboardScreen';
import { AdminTracksScreen } from '../screens/AdminTracksScreen';
import { AdminDeparturesScreen } from '../screens/AdminDeparturesScreen';

const AuthStack = createStackNavigator<AuthStackParamList>();
const MainTab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['sahyatri://', 'https://sahyatri.com'],
  config: {
    screens: {
      MainTabs: {
        screens: {
          Home: 'home',
          Explore: 'explore',
          Bookings: 'bookings',
          Notifications: 'notifications',
          Profile: 'profile',
        },
      },
      TrekDetail: 'trek/:slug',
      DepartureDetail: 'departure/:id',
      BookingDetail: 'booking/:booking_id',
    },
  },
};

function AuthNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Onboarding" component={OnboardingScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="PhoneOtp" component={PhoneOtpScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <AuthStack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </AuthStack.Navigator>
  );
}

function MainTabNavigator() {
  const { colors } = useTheme();

  return (
    <MainTab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarIcon: ({ focused, color }) => {
          let icon = '🏔️';
          if (route.name === 'Home') icon = focused ? '🏠' : '🛖';
          else if (route.name === 'Explore') icon = focused ? '🗺️' : '🧭';
          else if (route.name === 'Bookings') icon = focused ? '🎟️' : '🎫';
          else if (route.name === 'Notifications') icon = focused ? '🔔' : '🔕';
          else if (route.name === 'Profile') icon = focused ? '👤' : '👥';

          return <Text style={{ fontSize: 20 }}>{icon}</Text>;
        },
      })}
    >
      <MainTab.Screen name="Home" component={HomeScreen} />
      <MainTab.Screen name="Explore" component={ExploreScreen} />
      <MainTab.Screen name="Bookings" component={BookingsListScreen} />
      <MainTab.Screen name="Notifications" component={NotificationsScreen} />
      <MainTab.Screen name="Profile" component={ProfileScreen} />
    </MainTab.Navigator>
  );
}

export function AppNavigator() {
  const { colors } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : (
          <>
            <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
            <RootStack.Screen name="TrekDetail" component={TrekDetailScreen} />
            <RootStack.Screen name="DepartureDetail" component={DepartureDetailScreen} />
            <RootStack.Screen name="SeatSelection" component={SeatSelectionScreen} />
            <RootStack.Screen name="BookingCheckout" component={BookingCheckoutScreen} />
            <RootStack.Screen name="BookingConfirmation" component={BookingConfirmationScreen} />
            <RootStack.Screen name="BookingDetail" component={BookingDetailScreen} />
            <RootStack.Screen name="AccountSettings" component={AccountSettingsScreen} />
            <RootStack.Screen name="Support" component={SupportScreen} />
            <RootStack.Screen name="GuideDashboard" component={GuideDashboardScreen} />
            <RootStack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            <RootStack.Screen name="AdminTracks" component={AdminTracksScreen} />
            <RootStack.Screen name="AdminDepartures" component={AdminDeparturesScreen} />
          </>
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
