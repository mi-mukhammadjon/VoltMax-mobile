import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Star, MapPin, Clock, Zap } from 'lucide-react-native';
import { Station } from '@/types';
import { colors, typography, spacing, radius } from '@/theme';

interface Props {
  station: Station;
  onPress: (station: Station) => void;
}

export default function StationListCard({ station, onPress }: Props) {
  const hasDiscount = !!station.originalPricePerKwh && station.originalPricePerKwh > station.pricePerKwh;

  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => onPress(station)}>
      <View style={styles.headerRow}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.powerBadge}
        >
          <Text style={styles.powerBadgeValue}>{station.powerKw}</Text>
          <Text style={styles.powerBadgeUnit}>kVt</Text>
        </LinearGradient>

        <View style={{ flex: 1 }}>
          <Text style={styles.name} numberOfLines={2}>{station.name}</Text>
          <Text style={styles.address} numberOfLines={1}>{station.address}</Text>
          {!!station.rating && (
            <View style={styles.starsRow}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  color={colors.mintGreen}
                  fill={i < Math.round(station.rating!) ? colors.mintGreen : 'transparent'}
                />
              ))}
            </View>
          )}
        </View>
      </View>

      <View style={styles.infoRow}>
        <View style={styles.infoItem}>
          <View style={styles.infoTop}>
            <MapPin size={14} color={colors.textSecondary} />
            <Text style={styles.infoValue}>{station.distanceKm ?? '-'} km</Text>
          </View>
          <Text style={styles.infoLabel}>Masofa</Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={styles.infoItem}>
          <View style={styles.infoTop}>
            <Clock size={14} color={colors.textSecondary} />
            <Text style={styles.infoValue}>{station.etaMinutes ?? '-'} daq</Text>
          </View>
          <Text style={styles.infoLabel}>Vaqt</Text>
        </View>

        <View style={styles.infoDivider} />

        <View style={[styles.infoItem, { alignItems: 'flex-end' }]}>
          <View style={styles.infoTop}>
            <Zap size={14} color={colors.mintGreen} fill={colors.mintGreen} />
            <Text style={[styles.infoValue, { color: colors.mintGreen }]}>
              {station.pricePerKwh.toLocaleString('uz-UZ')} so'm
            </Text>
          </View>
          {hasDiscount && (
            <Text style={styles.strikePrice}>
              {station.originalPricePerKwh!.toLocaleString('uz-UZ')} so'm{' '}
              <Text style={styles.infoLabel}>1 kVt uchun</Text>
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  powerBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  powerBadgeValue: {
    color: colors.bgPrimary,
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.bold,
    lineHeight: 18,
  },
  powerBadgeUnit: {
    color: colors.bgPrimary,
    fontSize: 10,
    fontFamily: typography.fontFamily.medium,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.semibold,
  },
  address: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 2,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: spacing.xs,
  },
  infoRow: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  infoItem: {
    flex: 1,
  },
  infoDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginHorizontal: spacing.sm,
  },
  infoTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  strikePrice: {
    color: colors.textMuted,
    fontSize: 10,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
});
