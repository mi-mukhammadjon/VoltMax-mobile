import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import PrimaryButton from '@/components/PrimaryButton';

// Barcha bo'sh holatlar uchun umumiy blok: yumshoq doira ichida ikonka,
// sarlavha, tushuntirish va ixtiyoriy CTA.

interface Props {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  /** ekranni to'liq egallash (flex:1) — ro'yxat ichida ishlatilsa false */
  fill?: boolean;
}

export default function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  fill = true,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.wrap, fill && styles.fill]}>
      <View style={styles.iconWrap}>{icon}</View>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      {!!actionLabel && !!onAction && (
        <PrimaryButton label={actionLabel} onPress={onAction} style={styles.action} />
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xl,
    },
    fill: {
      flex: 1,
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      lineHeight: typography.size.sm * typography.lineHeight.normal,
      textAlign: 'center',
      marginTop: spacing.xs,
      maxWidth: 280,
    },
    action: {
      marginTop: spacing.lg,
      paddingHorizontal: spacing.xl,
    },
  });
