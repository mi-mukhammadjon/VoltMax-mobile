import React, { useMemo } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { useAlertStore, AlertVariant, AlertButtonConfig } from '@/store/useAlertStore';

const variantIcon: Record<AlertVariant, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
};

function variantColor(colors: ColorPalette, variant: AlertVariant): string {
  switch (variant) {
    case 'success':
      return colors.accent;
    case 'error':
      return colors.statusError;
    case 'warning':
      return colors.statusBusy;
    default:
      return colors.primary;
  }
}

// App.tsx'da bitta marta mount qilinadi — global useAlertStore holatini kuzatib,
// Alert.alert() o'rniga ishlatiladigan brendlashgan modalni chizadi.
export default function CustomAlert() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { visible, title, message, buttons, variant } = useAlertStore();
  const hide = useAlertStore((s) => s.hide);

  const Icon = variantIcon[variant];
  const accent = variantColor(colors, variant);

  const handlePress = (button: AlertButtonConfig) => {
    hide();
    button.onPress?.();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={hide}>
      <Pressable style={styles.backdrop} onPress={hide}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={[styles.iconWrap, { backgroundColor: accent + '22' }]}>
            <Icon size={26} color={accent} />
          </View>

          <Text style={styles.title}>{title}</Text>
          {!!message && <Text style={styles.message}>{message}</Text>}

          <View style={styles.buttonRow}>
            {buttons.map((button, idx) => {
              const isDestructive = button.style === 'destructive';
              const isCancel = button.style === 'cancel';
              const isPrimary = !isDestructive && !isCancel;

              if (isPrimary) {
                return (
                  <TouchableOpacity key={idx} activeOpacity={0.85} style={styles.buttonFlex} onPress={() => handlePress(button)}>
                    <LinearGradient
                      colors={colors.gradientPrimary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.primaryButton}
                    >
                      <Text style={styles.primaryButtonText}>{button.text}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              }

              return (
                <TouchableOpacity
                  key={idx}
                  activeOpacity={0.85}
                  style={[styles.secondaryButton, styles.buttonFlex]}
                  onPress={() => handlePress(button)}
                >
                  <Text style={[styles.secondaryButtonText, isDestructive && { color: colors.statusError }]}>
                    {button.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.xl,
    },
    card: {
      width: '100%',
      maxWidth: 340,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
      alignItems: 'center',
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    message: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.lg,
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      width: '100%',
      marginTop: spacing.xs,
    },
    buttonFlex: {
      flex: 1,
    },
    primaryButton: {
      borderRadius: radius.pill,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: colors.bgPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    secondaryButton: {
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgElevated,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    secondaryButtonText: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
  });
