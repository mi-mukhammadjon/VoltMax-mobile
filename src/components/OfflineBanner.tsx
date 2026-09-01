import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';

/**
 * «Aloqa yo'q» chizig'i.
 *
 * Ilgari internet uzilganda ekran shunchaki bo'sh qolardi va
 * foydalanuvchi sababini bilmasdi: stansiya yo'qmi, yuklanmadimi,
 * ilova buzildimi. Bo'sh ekran eng yomon javob — u hech narsa
 * aytmaydi.
 *
 * Chiziq ikki narsani aytadi: aloqa yo'qligini va ekrandagi
 * ma'lumot QACHONGI ekanini. Eski ma'lumot hech narsadan yaxshiroq,
 * lekin uni yangi deb ko'rsatish yolg'on bo'lardi.
 */
interface Props {
  /** Ma'lumot oxirgi marta qachon olingani (ms) */
  syncedAt?: number | null;
  /** Qayta urinish tugmasi — aloqa tiklanganda foydali */
  onRetry?: () => void;
}

function ageLabel(syncedAt?: number | null): string | null {
  if (!syncedAt) return null;

  const minutes = Math.floor((Date.now() - syncedAt) / 60000);
  if (minutes < 1) return 'hozirgina yangilangan';
  if (minutes < 60) return `${minutes} daqiqa oldingi ma'lumot`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} soat oldingi ma'lumot`;
  return `${Math.floor(hours / 24)} kun oldingi ma'lumot`;
}

export default function OfflineBanner({ syncedAt, onRetry }: Props) {
  const colors = useThemeColors();
  const styles = React.useMemo(() => createStyles(colors), [colors]);
  const age = ageLabel(syncedAt);

  return (
    <View style={styles.banner}>
      <WifiOff size={16} color={colors.statusBusy} />
      <View style={styles.text}>
        <Text style={styles.title}>Aloqa yo'q</Text>
        {!!age && <Text style={styles.age}>{age}</Text>}
      </View>
      {!!onRetry && (
        <TouchableOpacity onPress={onRetry} hitSlop={8} style={styles.retry}>
          <RefreshCw size={14} color={colors.statusBusy} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginHorizontal: spacing.lg,
      marginBottom: spacing.md,
      borderRadius: radius.md,
      // Ogohlantirish rangi, xato emas: ilova ishlayapti, faqat
      // ma'lumot eski
      backgroundColor: 'rgba(245,185,66,0.14)',
    },
    text: { flex: 1, minWidth: 0 },
    title: {
      color: colors.statusBusy,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    age: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 1,
    },
    retry: { padding: spacing.xs },
  });
