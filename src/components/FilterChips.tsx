import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Percent } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '@/theme';

export type StationFilter = 'all' | 'available' | 'discounts';

interface Props {
  value: StationFilter;
  onChange: (filter: StationFilter) => void;
}

const OPTIONS: { key: StationFilter; label: string }[] = [
  { key: 'all', label: 'Barchasi' },
  { key: 'available', label: 'Mavjud' },
  { key: 'discounts', label: 'Chegirmalar' },
];

export default function FilterChips({ value, onChange }: Props) {
  return (
    <View style={styles.row}>
      {OPTIONS.map((opt) => {
        const active = value === opt.key;
        return (
          <TouchableOpacity
            key={opt.key}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => onChange(opt.key)}
            activeOpacity={0.8}
          >
            {opt.key === 'discounts' && (
              <Percent size={14} color={active ? colors.bgPrimary : colors.mintGreen} style={{ marginRight: 4 }} />
            )}
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.medium,
  },
  chipTextActive: {
    color: colors.bgPrimary,
  },
});
