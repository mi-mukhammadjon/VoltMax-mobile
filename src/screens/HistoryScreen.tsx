import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

// Ekran 6: Sessiyalar tarixi
// TODO: oylik xarajat grafigi (line chart), o'tgan sessiyalar ro'yxati, chek/kvitansiya

export default function HistoryScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Tarix ekrani (keyingi bosqich)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    padding: spacing.lg,
  },
  placeholder: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
  },
});
