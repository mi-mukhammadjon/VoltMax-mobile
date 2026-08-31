import React, { useMemo } from 'react';
import { View, TouchableOpacity, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';

// Prime EV kartasi: tekis fon + nozik chegara, soya deyarli ko'rinmaydi.
// Barcha ekranlar shu komponentdan foydalanadi — karta uslubi bir joyda turadi.

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  /** ichki bo'shliqni o'chirish (masalan karta ichida to'liq kenglikdagi rasm bo'lsa) */
  noPadding?: boolean;
  style?: StyleProp<ViewStyle>;
}

export default function Card({ children, onPress, noPadding = false, style }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const composed = [styles.card, noPadding && styles.noPadding, style];

  if (onPress) {
    return (
      <TouchableOpacity style={composed} activeOpacity={0.85} onPress={onPress}>
        {children}
      </TouchableOpacity>
    );
  }
  return <View style={composed}>{children}</View>;
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      ...shadow.card,
    },
    noPadding: {
      padding: 0,
      overflow: 'hidden',
    },
  });
