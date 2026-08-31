import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import { ChargerType } from '@/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import PrimaryButton from '@/components/PrimaryButton';

// Stansiyalar ro'yxati uchun filtr bottom-sheet'i (Prime EV "Filter" ekrani).
// Sheet o'z ichida vaqtinchalik holat tutadi — "Qo'llash" bosilgandagina
// ota-ekranga qaytariladi, "Tozalash" esa boshlang'ich holatga qaytaradi.

export type SortKey = 'distance' | 'price' | 'power' | 'rating';

export interface StationFilters {
  connectorType: ChargerType | 'all';
  minPowerKw: number;
  onlyAvailable: boolean;
  onlyDiscounts: boolean;
  sort: SortKey;
}

export const DEFAULT_FILTERS: StationFilters = {
  connectorType: 'all',
  minPowerKw: 0,
  onlyAvailable: false,
  onlyDiscounts: false,
  sort: 'distance',
};

export function isDefaultFilters(f: StationFilters): boolean {
  return (
    f.connectorType === DEFAULT_FILTERS.connectorType &&
    f.minPowerKw === DEFAULT_FILTERS.minPowerKw &&
    f.onlyAvailable === DEFAULT_FILTERS.onlyAvailable &&
    f.onlyDiscounts === DEFAULT_FILTERS.onlyDiscounts &&
    f.sort === DEFAULT_FILTERS.sort
  );
}

const CONNECTOR_OPTIONS: { value: ChargerType | 'all'; label: string }[] = [
  { value: 'all', label: 'Barchasi' },
  { value: 'AC', label: 'AC' },
  { value: 'DC', label: 'DC (tez)' },
];

const POWER_OPTIONS: { value: number; label: string }[] = [
  { value: 0, label: 'Har qanday' },
  { value: 22, label: '22+ kVt' },
  { value: 60, label: '60+ kVt' },
  { value: 120, label: '120+ kVt' },
];

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'distance', label: 'Masofa' },
  { value: 'price', label: 'Arzon narx' },
  { value: 'power', label: 'Quvvat' },
  { value: 'rating', label: 'Reyting' },
];

interface Props {
  visible: boolean;
  value: StationFilters;
  onClose: () => void;
  onApply: (filters: StationFilters) => void;
}

export default function StationFilterSheet({ visible, value, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [draft, setDraft] = useState<StationFilters>(value);

  // Sheet har ochilganda amaldagi filtrdan qayta boshlanadi
  useEffect(() => {
    if (visible) setDraft(value);
  }, [visible, value]);

  const renderChips = <T,>(
    options: { value: T; label: string }[],
    selected: T,
    onSelect: (v: T) => void
  ) => (
    <View style={styles.chipRow}>
      {options.map((opt) => {
        const active = opt.value === selected;
        return (
          <TouchableOpacity
            key={String(opt.value)}
            style={[styles.chip, active && styles.chipActive]}
            activeOpacity={0.8}
            onPress={() => onSelect(opt.value)}
          >
            <Text style={[styles.chipText, active && styles.chipTextActive]}>{opt.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.grabber} />

        <View style={styles.headerRow}>
          <Text style={styles.title}>Filtr</Text>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Ulagich turi</Text>
        {renderChips(CONNECTOR_OPTIONS, draft.connectorType, (connectorType) =>
          setDraft((d) => ({ ...d, connectorType }))
        )}

        <Text style={styles.label}>Minimal quvvat</Text>
        {renderChips(POWER_OPTIONS, draft.minPowerKw, (minPowerKw) =>
          setDraft((d) => ({ ...d, minPowerKw }))
        )}

        <Text style={styles.label}>Saralash</Text>
        {renderChips(SORT_OPTIONS, draft.sort, (sort) => setDraft((d) => ({ ...d, sort })))}

        <View style={styles.toggleRow}>
          <TouchableOpacity
            style={[styles.toggle, draft.onlyAvailable && styles.toggleActive]}
            activeOpacity={0.8}
            onPress={() => setDraft((d) => ({ ...d, onlyAvailable: !d.onlyAvailable }))}
          >
            <Text style={[styles.toggleText, draft.onlyAvailable && styles.toggleTextActive]}>
              Faqat bo'sh
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggle, draft.onlyDiscounts && styles.toggleActive]}
            activeOpacity={0.8}
            onPress={() => setDraft((d) => ({ ...d, onlyDiscounts: !d.onlyDiscounts }))}
          >
            <Text style={[styles.toggleText, draft.onlyDiscounts && styles.toggleTextActive]}>
              Chegirmali
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <PrimaryButton
            label="Tozalash"
            variant="outline"
            style={styles.actionButton}
            onPress={() => setDraft(DEFAULT_FILTERS)}
          />
          <PrimaryButton
            label="Qo'llash"
            style={styles.actionButton}
            onPress={() => {
              onApply(draft);
              onClose();
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.bgSecondary,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      ...shadow.float,
    },
    grabber: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
    },
    label: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontFamily: typography.fontFamily.semibold,
    },
    toggleRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    toggle: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.md - 2,
      borderRadius: radius.btn,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    toggleActive: {
      backgroundColor: colors.primarySoft,
      borderColor: colors.primary,
    },
    toggleText: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    toggleTextActive: {
      color: colors.primary,
      fontFamily: typography.fontFamily.semibold,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    actionButton: {
      flex: 1,
    },
  });
