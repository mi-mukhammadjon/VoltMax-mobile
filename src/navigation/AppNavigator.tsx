import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Home, List, Zap, Heart, User } from 'lucide-react-native';
import { RootStackParamList, MainTabParamList } from './types';
import { useThemeColors, ColorPalette, radius, typography } from '@/theme';
import { useActiveScheme } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';

import LoginScreen from '@/screens/LoginScreen';
import OtpScreen from '@/screens/OtpScreen';
import HomeScreen from '@/screens/HomeScreen';
import MapScreen from '@/screens/MapScreen';
import SearchScreen from '@/screens/SearchScreen';
import NotificationsScreen from '@/screens/NotificationsScreen';
import StationsListScreen from '@/screens/StationsListScreen';
import StationDetailScreen from '@/screens/StationDetailScreen';
import ChargingSessionScreen from '@/screens/ChargingSessionScreen';
import ChargingTabScreen from '@/screens/ChargingTabScreen';
import FavoritesScreen from '@/screens/FavoritesScreen';
import ProfileScreen from '@/screens/ProfileScreen';
import WalletScreen from '@/screens/WalletScreen';
import HistoryScreen from '@/screens/HistoryScreen';
import EditProfileScreen from '@/screens/EditProfileScreen';
import NotificationSettingsScreen from '@/screens/NotificationSettingsScreen';
import AboutAppScreen from '@/screens/AboutAppScreen';
import MyVehiclesScreen from '@/screens/MyVehiclesScreen';
import MyRfidCardsScreen from '@/screens/MyRfidCardsScreen';
import MyBookingsScreen from '@/screens/MyBookingsScreen';
import NewBookingScreen from '@/screens/NewBookingScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

const tabIcons: Record<keyof MainTabParamList, typeof Home> = {
  Main: Home,
  Stations: List,
  Charging: Zap,
  Favorites: Heart,
  Profile: User,
};

const tabLabels: Record<keyof MainTabParamList, string> = {
  Main: 'Asosiy',
  Stations: 'Stansiyalar',
  Charging: 'Zaryadlash',
  Favorites: 'Sevimli',
  Profile: 'Profil',
};

function MainTabs() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        // Yorliq ikonka ostida turadi: 5 ta tab bo'lgani uchun "Stansiyalar"
        // kabi uzun so'z ikonka bilan bir qatorga sig'maydi. Aktiv holat
        // ikonka ortidagi yumshoq pill va yashil yorliq bilan belgilanadi.
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.bgSecondary,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarIcon: ({ focused }) => {
          const Icon = tabIcons[route.name];
          return (
            <View style={styles.tabItem}>
              <View style={[styles.tabIconPill, focused && styles.tabIconPillActive]}>
                <Icon size={19} color={focused ? colors.primary : colors.textMuted} />
              </View>
              <Text
                style={[styles.tabLabel, focused && styles.tabLabelActive]}
                numberOfLines={1}
                // Tizimda shrift kattalashtirilgan bo'lsa ham yorliq buzilmasin
                allowFontScaling={false}
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {tabLabels[route.name]}
              </Text>
            </View>
          );
        },
      })}
    >
      <Tab.Screen name="Main" component={HomeScreen} />
      <Tab.Screen name="Stations" component={StationsListScreen} />
      <Tab.Screen name="Charging" component={ChargingTabScreen} />
      <Tab.Screen name="Favorites" component={FavoritesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    tabItem: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 68,
      gap: 3,
    },
    tabIconPill: {
      width: 42,
      height: 26,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
    },
    tabIconPillActive: {
      backgroundColor: colors.primarySoft,
    },
    tabLabel: {
      color: colors.textMuted,
      fontSize: 10,
      lineHeight: 13,
      fontFamily: typography.fontFamily.medium,
    },
    tabLabelActive: {
      color: colors.primary,
      fontFamily: typography.fontFamily.semibold,
    },
  });

export default function AppNavigator() {
  const colors = useThemeColors();
  const scheme = useActiveScheme();
  // App.tsx AppNavigator'ni faqat auth-store AsyncStorage'dan tiklangandan keyin
  // render qiladi — shuning uchun bu yerda accessToken birinchi mountda ham to'g'ri
  // qiymatga ega bo'ladi va initialRouteName xato tanlanmaydi.
  const isLoggedIn = !!useAuthStore((s) => s.accessToken);

  const navTheme = useMemo(() => {
    const base = scheme === 'light' ? DefaultTheme : DarkTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        background: colors.bgPrimary,
        card: colors.bgSecondary,
        text: colors.textPrimary,
        border: colors.border,
        primary: colors.primary,
      },
    };
  }, [colors, scheme]);

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={isLoggedIn ? 'MainTabs' : 'Login'}
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Otp" component={OtpScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Search" component={SearchScreen} />
        <Stack.Screen name="Notifications" component={NotificationsScreen} />
        <Stack.Screen name="StationDetail" component={StationDetailScreen} />
        <Stack.Screen name="ChargingSession" component={ChargingSessionScreen} />
        <Stack.Screen name="Wallet" component={WalletScreen} />
        <Stack.Screen name="History" component={HistoryScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
        <Stack.Screen name="AboutApp" component={AboutAppScreen} />
        <Stack.Screen name="MyVehicles" component={MyVehiclesScreen} />
        <Stack.Screen name="MyRfidCards" component={MyRfidCardsScreen} />
        <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
        <Stack.Screen name="NewBooking" component={NewBookingScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
