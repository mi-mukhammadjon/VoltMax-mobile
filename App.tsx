import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
} from '@expo-google-fonts/manrope';
import AppNavigator from '@/navigation/AppNavigator';
import CustomAlert from '@/components/CustomAlert';
import { useThemeColors } from '@/theme';
import { useActiveScheme } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { registerForPush } from '@/services/push';

export default function App() {
  const colors = useThemeColors();
  const scheme = useActiveScheme();
  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const token = useAuthStore((s) => s.accessToken);

  // Push manzili faqat tizimga kirgandan keyin yuboriladi: anonim
  // foydalanuvchining xabari ham, tokeni ham bo'lmaydi
  useEffect(() => {
    if (token) registerForPush();
  }, [token]);

  const [fontsLoaded] = useFonts({
    'Manrope-Regular': Manrope_400Regular,
    'Manrope-Medium': Manrope_500Medium,
    'Manrope-SemiBold': Manrope_600SemiBold,
    'Manrope-Bold': Manrope_700Bold,
  });

  if (!fontsLoaded || !authHydrated) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.bgPrimary }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    // `SafeAreaProvider` SHART: usiz `useSafeAreaInsets()` hamma joyda
    // nol qaytaradi. Natijasi jimgina bo'ladi — ekran ochiladi, hech
    // qanday xato chiqmaydi, faqat sarlavha tizim soati ustiga
    // chizilgan bo'ladi. Aynan shunday bo'lgan: asosiy ekranda
    // foydalanuvchining ismi soat bilan ustma-ust tushgan.
    <SafeAreaProvider>
      <StatusBar style={scheme === 'light' ? 'dark' : 'light'} />
      <AppNavigator />
      <CustomAlert />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
