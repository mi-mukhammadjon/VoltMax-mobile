import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';

// Prime EV "My Booking" ekranidagi segment boshqaruvi: bitta chegaralangan
// konteyner ichida, aktiv segment to'liq yashil pill bilan belgilanadi.

interface Props<T extends string> {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export default function SegmentedTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.track}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <TouchableOpacity
            key={tab.value}
            style={[styles.segment, active && styles.segmentActive]}
            activeOpacity={0.8}
            onPress={() => onChange(tab.value)}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    track: {
      flexDirection: 'row',
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      padding: 3,
    },
    segment: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
      borderRadius: 6,
    },
    segmentActive: {
      backgroundColor: colors.primary,
    },
    label: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    labelActive: {
      color: '#FFFFFF',
      fontFamily: typography.fontFamily.semibold,
    },
  });
