import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, Switch, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { useSettingsStore } from '@/store/useSettingsStore';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'NotificationSettings'>;

function SettingRow({
  title,
  subtitle,
  value,
  onChange,
  colors,
  styles,
}: {
  title: string;
  subtitle: string;
  value: boolean;
  onChange: (value: boolean) => void;
  colors: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSubtitle}>{subtitle}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.bgElevated, true: colors.primary }}
        thumbColor={colors.textPrimary}
      />
    </View>
  );
}

export default function NotificationSettingsScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const sessionNotifications = useSettingsStore((s) => s.sessionNotifications);
  const setSessionNotifications = useSettingsStore((s) => s.setSessionNotifications);
  const promoNotifications = useSettingsStore((s) => s.promoNotifications);
  const setPromoNotifications = useSettingsStore((s) => s.setPromoNotifications);

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
        <Text style={styles.headerTitle}>Bildirishnomalar</Text>
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.content}>
        <SettingRow
          title="Zaryadlash bildirishnomalari"
          subtitle="Sessiya boshlanishi, tugashi va charger holati haqida"
          value={sessionNotifications}
          onChange={setSessionNotifications}
          colors={colors}
          styles={styles}
        />
        <SettingRow
          title="Aksiya va chegirmalar"
          subtitle="Yangi stansiyalar va chegirmalar haqida xabarlar"
          value={promoNotifications}
          onChange={setPromoNotifications}
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
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    rowTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    rowSubtitle: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
  });
