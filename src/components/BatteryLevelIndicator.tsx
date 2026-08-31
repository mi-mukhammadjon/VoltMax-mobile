import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap } from 'lucide-react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';

interface Props {
  percent: number; // 0-100
}

export default function BatteryLevelIndicator({ percent }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const clamped = Math.max(0, Math.min(100, percent));

  return (
    <View style={styles.wrapper}>
      <View style={styles.track}>
        <LinearGradient
          colors={[colors.accent, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.fill, { height: `${clamped}%` }]}
        />
      </View>
      <View style={styles.percentRow}>
        <Zap size={16} color={colors.accent} fill={colors.accent} />
        <Text style={styles.percentText}>{clamped}%</Text>
      </View>
    </View>
  );
}

const TRACK_WIDTH = 64;

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    wrapper: {
      alignItems: 'center',
    },
    track: {
      width: TRACK_WIDTH,
      height: 180,
      borderRadius: radius.lg,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      justifyContent: 'flex-end',
    },
    fill: {
      width: '100%',
      borderRadius: radius.lg,
    },
    percentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: spacing.sm,
    },
    percentText: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
    },
  });
