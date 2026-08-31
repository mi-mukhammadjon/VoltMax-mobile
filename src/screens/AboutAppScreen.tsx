import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Zap, LifeBuoy, FileText, Shield } from 'lucide-react-native';
import Constants from 'expo-constants';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { showAlert } from '@/services/alert';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'AboutApp'>;

function LinkRow({
  icon,
  label,
  onPress,
  colors,
  styles,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  colors: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={onPress}>
      <View style={styles.rowIconWrap}>{icon}</View>
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AboutAppScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ilova haqida</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoWrap}
        >
          <Zap size={30} color={colors.bgPrimary} fill={colors.bgPrimary} />
        </LinearGradient>
        <Text style={styles.appName}>VoltMax</Text>
        <Text style={styles.version}>Versiya {version}</Text>

        <Text style={styles.description}>
          VoltMax — O'zbekiston bo'ylab elektromobillar uchun zaryadlash stansiyalarini topish,
          zaryadlashni boshqarish va to'lovlarni amalga oshirish uchun mo'ljallangan ilova.
        </Text>

        <LinkRow
          icon={<LifeBuoy size={18} color={colors.primary} />}
          label="Qo'llab-quvvatlash"
          onPress={() => showAlert("Qo'llab-quvvatlash", 'Tez orada qoʻshiladi.')}
          colors={colors}
          styles={styles}
        />
        <LinkRow
          icon={<FileText size={18} color={colors.primary} />}
          label="Foydalanish shartlari"
          onPress={() => showAlert('Foydalanish shartlari', 'Tez orada qoʻshiladi.')}
          colors={colors}
          styles={styles}
        />
        <LinkRow
          icon={<Shield size={18} color={colors.primary} />}
          label="Maxfiylik siyosati"
          onPress={() => showAlert('Maxfiylik siyosati', 'Tez orada qoʻshiladi.')}
          colors={colors}
          styles={styles}
        />
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.bgSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.semibold,
    },
    content: {
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
    },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    appName: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
    },
    version: {
      color: colors.textMuted,
      fontSize: typography.size.sm,
      marginTop: 2,
      marginBottom: spacing.lg,
    },
    description: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: spacing.xl,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      width: '100%',
    },
    rowIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
  });
