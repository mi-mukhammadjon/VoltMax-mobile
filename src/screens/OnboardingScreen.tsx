import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

// Ekran 1: Onboarding / Splash
// TODO: brend logotipi, gradient fon, "Boshlash" tugmasi (UI bosqichida to'ldiriladi)

export default function OnboardingScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>VoltMax</Text>
      <Text style={styles.subtitle}>Zaryadlash endi oson</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.display,
    fontFamily: typography.fontFamily.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
    marginTop: spacing.sm,
  },
});
