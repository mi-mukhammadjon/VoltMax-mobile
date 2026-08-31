import React, { useMemo } from 'react';
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';

// Prime EV asosiy CTA: to'liq kenglikdagi to'q yashil tugma, yumshoq
// to'rtburchak burchaklar (pill emas), oq matn.

interface Props {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  /** ikkilamchi ko'rinish — oq fon, yashil chegara va matn */
  variant?: 'solid' | 'outline' | 'danger';
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

export default function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
  variant = 'solid',
  icon,
  style,
}: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const inactive = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' && styles.buttonOutline,
        variant === 'danger' && styles.buttonDanger,
        inactive && styles.buttonDisabled,
        style,
      ]}
      activeOpacity={0.85}
      disabled={inactive}
      onPress={onPress}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'solid' ? '#FFFFFF' : colors.primary} />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.label,
              variant === 'outline' && styles.labelOutline,
              variant === 'danger' && styles.labelDanger,
            ]}
          >
            {label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.primary,
      borderRadius: radius.btn,
      paddingVertical: 15,
      paddingHorizontal: spacing.lg,
    },
    buttonOutline: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.primary,
    },
    buttonDanger: {
      backgroundColor: 'rgba(229,72,77,0.10)',
    },
    buttonDisabled: {
      opacity: 0.45,
    },
    label: {
      color: '#FFFFFF',
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
    labelOutline: {
      color: colors.primary,
    },
    labelDanger: {
      color: colors.statusError,
    },
  });
