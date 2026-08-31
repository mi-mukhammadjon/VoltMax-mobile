import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { typography, spacing, useThemeColors, ColorPalette } from '@/theme';

// Prime EV stansiya detali ekranidagi tablar: pastida yashil chiziq bilan
// belgilanadigan matn tablari (Ulagichlar / Tafsilotlar / Sharhlar).

interface Props<T extends string> {
  tabs: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}

export default function UnderlineTabs<T extends string>({ tabs, value, onChange }: Props<T>) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.row}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        return (
          <TouchableOpacity
            key={tab.value}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => onChange(tab.value)}
          >
            <Text style={[styles.label, active && styles.labelActive]} numberOfLines={1}>
              {tab.label}
            </Text>
            <View style={[styles.indicator, active && styles.indicatorActive]} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    tab: {
      flex: 1,
      alignItems: 'center',
    },
    label: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      paddingBottom: spacing.sm,
    },
    labelActive: {
      color: colors.primary,
      fontFamily: typography.fontFamily.semibold,
    },
    indicator: {
      height: 2,
      alignSelf: 'stretch',
      backgroundColor: 'transparent',
      // chiziq konteynerning pastki chegarasini qoplab tursin
      marginBottom: -1,
    },
    indicatorActive: {
      backgroundColor: colors.primary,
    },
  });
