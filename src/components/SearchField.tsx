import React, { useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Search, X, SlidersHorizontal } from 'lucide-react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';

// Qidiruv maydoni ikki rejimda ishlaydi:
//  - `onPress` berilsa: bosiladigan "soxta" input (Home ekranidan Search ekraniga o'tish uchun)
//  - `onChangeText` berilsa: haqiqiy TextInput (Search/Stansiyalar ekranlarida)

interface Props {
  placeholder?: string;
  value?: string;
  onChangeText?: (text: string) => void;
  onPress?: () => void;
  onFilterPress?: () => void;
  /** filtr tugmasida faol filtr borligini bildiruvchi nuqta */
  filterActive?: boolean;
  autoFocus?: boolean;
}

export default function SearchField({
  placeholder = 'Stansiya yoki manzil qidiring',
  value,
  onChangeText,
  onPress,
  onFilterPress,
  filterActive = false,
  autoFocus = false,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const inner = (
    <>
      <Search size={18} color={colors.textMuted} />
      {onPress ? (
        <Text style={styles.placeholder} numberOfLines={1}>
          {placeholder}
        </Text>
      ) : (
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoFocus={autoFocus}
          returnKeyType="search"
        />
      )}
      {!onPress && !!value && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onChangeText?.('')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <X size={16} color={colors.textMuted} />
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <View style={styles.row}>
      {onPress ? (
        <TouchableOpacity style={styles.field} activeOpacity={0.8} onPress={onPress}>
          {inner}
        </TouchableOpacity>
      ) : (
        <View style={styles.field}>{inner}</View>
      )}

      {!!onFilterPress && (
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.8} onPress={onFilterPress}>
          <SlidersHorizontal size={18} color={colors.textPrimary} />
          {filterActive && <View style={styles.filterDot} />}
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
      gap: spacing.sm,
    },
    field: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      height: 46,
      paddingHorizontal: spacing.md,
      borderRadius: radius.btn,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    placeholder: {
      flex: 1,
      color: colors.textMuted,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.regular,
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.regular,
      padding: 0,
    },
    filterButton: {
      width: 46,
      height: 46,
      borderRadius: radius.btn,
      backgroundColor: colors.bgElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    filterDot: {
      position: 'absolute',
      top: 9,
      right: 9,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
  });
