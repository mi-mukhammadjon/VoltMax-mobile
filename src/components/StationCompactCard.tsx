import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MapPin, Zap, Star } from 'lucide-react-native';
import { Station } from '@/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { formatSom } from '@/utils/money';

// Home ekranidagi gorizontal karusel uchun ixcham stansiya kartasi.
// To'liq kartadan (StationListCard) farqi: qat'iy kenglik va faqat eng muhim
// uchta ma'lumot — holat, quvvat/masofa, narx.

export const COMPACT_CARD_WIDTH = 230;

interface Props {
  station: Station;
  onPress: (station: Station) => void;
}

export default function StationCompactCard({ station, onPress }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const available =
    station.connectors?.some((c) => c.status === 'available') ?? station.status === 'available';
  const statusColor = available ? colors.statusAvailable : colors.statusBusy;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onPress(station)}>
      <View style={styles.topRow}>
        <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
          <Zap size={13} color={colors.primary} fill={colors.primary} />
          <Text style={styles.badgeText}>{station.powerKw} kVt</Text>
        </View>
        {!!station.rating && (
          <View style={styles.ratingWrap}>
            <Star size={12} color={colors.statusBusy} fill={colors.statusBusy} />
            <Text style={styles.ratingText}>{station.rating}</Text>
          </View>
        )}
      </View>

      <Text style={styles.name} numberOfLines={1}>
        {station.name}
      </Text>

      <View style={styles.addressRow}>
        <MapPin size={12} color={colors.textMuted} />
        <Text style={styles.address} numberOfLines={1}>
          {station.address}
        </Text>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.statusWrap}>
          <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.statusText, { color: statusColor }]}>
            {available ? "Bo'sh" : 'Band'}
          </Text>
        </View>
        <Text style={styles.price}>
          {formatSom(station.pricePerKwh)}
          <Text style={styles.priceUnit}> so'm/kVt</Text>
        </Text>
      </View>

      {station.distanceKm != null && (
        <Text style={styles.distance}>{station.distanceKm} km uzoqlikda</Text>
      )}
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      width: COMPACT_CARD_WIDTH,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      ...shadow.card,
    },
    topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    badgeText: {
      color: colors.primary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    ratingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
    },
    ratingText: {
      color: colors.textPrimary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    name: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 3,
    },
    address: {
      flex: 1,
      color: colors.textMuted,
      fontSize: typography.size.xs,
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: spacing.sm,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    statusWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    price: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    priceUnit: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
    },
    distance: {
      color: colors.primary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      marginTop: spacing.sm,
    },
  });
