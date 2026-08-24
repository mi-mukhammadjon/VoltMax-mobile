import React from 'react';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { colors } from '@/theme';

import OnboardingScreen from '@/screens/OnboardingScreen';
import MapScreen from '@/screens/MapScreen';
import StationsListScreen from '@/screens/StationsListScreen';
import StationDetailScreen from '@/screens/StationDetailScreen';
import ChargingSessionScreen from '@/screens/ChargingSessionScreen';
import WalletScreen from '@/screens/WalletScreen';
import HistoryScreen from '@/screens/HistoryScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bgPrimary,
    card: colors.bgSecondary,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.electricBlue,
  },
};

export default function AppNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="StationsList" component={StationsListScreen} />
        <Stack.Screen name="StationDetail" component={StationDetailScreen} />
        <Stack.Screen name="ChargingSession" component={ChargingSessionScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
