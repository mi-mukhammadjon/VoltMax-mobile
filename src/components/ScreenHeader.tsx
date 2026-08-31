import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { typography, spacing, useThemeColors, ColorPalette } from '@/theme';

// Prime EV uslubidagi ekran sarlavhasi: chapda quticha ichida bo'lmagan sodda
// orqaga strelkasi, markazda sarlavha, o'ngda ixtiyoriy element.

interface Props {
  title: string;
  /** o'ng tomondagi ixtiyoriy element (masalan "+" yoki "Chiqish") */
  right?: React.ReactNode;
  onBack?: () => void;
  /** safe-area yuqori bo'shlig'ini qo'shish (stack ekranlarida kerak) */
  withInset?: boolean;
}

export default function ScreenHeader({ title, right, onBack, withInset = true }: Props) {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.header, withInset && { paddingTop: insets.top + spacing.sm }]}>
      <TouchableOpacity
        style={styles.side}
        activeOpacity={0.6}
        onPress={onBack ?? (() => navigation.goBack())}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
      >
        <ArrowLeft size={22} color={colors.textPrimary} />
      </TouchableOpacity>

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>{right}</View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.bgPrimary,
    },
    side: {
      minWidth: 52,
      justifyContent: 'center',
    },
    sideRight: {
      alignItems: 'flex-end',
    },
    title: {
      flex: 1,
      textAlign: 'center',
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.semibold,
    },
  });
