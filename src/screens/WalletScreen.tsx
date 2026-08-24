import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '@/theme';

// Ekran 5: Hamyon / to'lov
// TODO: balans kartasi, Payme/Click integratsiyasi, "Hisobni to'ldirish", tranzaksiyalar ro'yxati

export default function WalletScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Hamyon ekrani (keyingi bosqich)</Text>
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
