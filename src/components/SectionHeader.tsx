import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { typography, spacing, useThemeColors, ColorPalette } from '@/theme';

// Bo'lim sarlavhasi: chapda nom, o'ngda ixtiyoriy "Barchasi >" havolasi.

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function SectionHeader({ title, actionLabel = 'Barchasi', onAction }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {!!onAction && (
        <TouchableOpacity
          style={styles.action}
          activeOpacity={0.7}
          onPress={onAction}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
          <ChevronRight size={15} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
    },
    actionText: {
      color: colors.primary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
  });
