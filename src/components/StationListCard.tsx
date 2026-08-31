import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { Station } from '@/types';
import { AmenityIcon } from '@/components/AmenityIcon';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { formatSom } from '@/utils/money';

// Prime EV stansiya kartasi: nom + masofa (yashil), manzil, reyting va
// qulaylik ikonkalari, ajratuvchi chiziq, pastda holat + narx.

interface Props {
  station: Station;
  onPress: (station: Station) => void;
}

export default function StationListCard({ station, onPress }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const hasDiscount =
    !!station.originalPricePerKwh && station.originalPricePerKwh > station.pricePerKwh;
  const connectorCount = station.connectors?.length ?? 0;
  const available = station.connectors?.some((c) => c.status === 'available') ?? station.status === 'available';

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onPress(station)}>
      <View style={styles.titleRow}>
        <Text style={styles.name} numberOfLines={1}>
          {station.name}
        </Text>
        {station.distanceKm != null && (
          <Text style={styles.distance}>{station.distanceKm} km</Text>
        )}
      </View>

      <Text style={styles.address} numberOfLines={1}>
        {station.address}
      </Text>

      <View style={styles.metaRow}>
        {!!station.rating && (
          <View style={styles.ratingWrap}>
            <Star size={13} color="#F5B942" fill="#F5B942" />
            <Text style={styles.ratingText}>{station.rating}</Text>
          </View>
        )}
        <View style={styles.amenityRow}>
          {station.amenities?.slice(0, 4).map((amenity, idx) => (
            <AmenityIcon key={idx} icon={amenity.icon} size={15} color={colors.textMuted} />
          ))}
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footerRow}>
        <View style={styles.statusWrap}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: available ? colors.statusAvailable : colors.statusError },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: available ? colors.statusAvailable : colors.statusError },
            ]}
          >
            {available ? "Bo'sh" : 'Band'}
          </Text>
          {connectorCount > 0 && (
            <Text style={styles.plugCount}>
              {'•'} {connectorCount} ta razyom
            </Text>
          )}
        </View>

        <View style={styles.priceWrap}>
          <Text style={styles.price}>{formatSom(station.pricePerKwh)} so'm</Text>
          {hasDiscount && (
            <Text style={styles.strikePrice}>
              {formatSom(station.originalPricePerKwh!)}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    name: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    distance: {
      color: colors.primary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    address: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 3,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
    },
    ratingWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    ratingText: {
      color: colors.textPrimary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    amenityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginLeft: 'auto',
    },
    divider: {
      height: 1,
      backgroundColor: colors.border,
      marginTop: spacing.sm,
      marginBottom: spacing.sm,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    statusWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 1,
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
    plugCount: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      flexShrink: 1,
    },
    priceWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    price: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    strikePrice: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      textDecorationLine: 'line-through',
    },
  });
