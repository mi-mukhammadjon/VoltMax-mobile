import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
} from 'react-native';
import { Station } from '@/types';
import { colors, typography, spacing, radius } from '@/theme';

interface Props {
  station: Station | null;
  onClose: () => void;
  onStart: (station: Station) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const statusLabel: Record<Station['status'], string> = {
  available: 'Bo\u02bbsh',
  busy: 'Band',
  offline: 'Ishlamayapti',
};

const statusColor: Record<Station['status'], string> = {
  available: colors.statusAvailable,
  busy: colors.statusBusy,
  offline: colors.statusOffline,
};

export default function StationDetailSheet({ station, onClose, onStart }: Props) {
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: station ? 0 : SCREEN_HEIGHT,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [station]);

  if (!station) return null;

  const canStart = station.status === 'available';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View style={styles.handle} />

        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{station.name}</Text>
            <Text style={styles.address} numberOfLines={1}>{station.address}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor[station.status] + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor[station.status] }]} />
            <Text style={[styles.statusText, { color: statusColor[station.status] }]}>
              {statusLabel[station.status]}
            </Text>
          </View>
        </View>

        <View style={styles.infoRow}>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeLabel}>Quvvat</Text>
            <Text style={styles.infoBadgeValue}>{station.chargerType} {station.powerKw}kW</Text>
          </View>
          <View style={styles.infoBadge}>
            <Text style={styles.infoBadgeLabel}>Narx</Text>
            <Text style={styles.infoBadgeValue}>{station.pricePerKwh.toLocaleString('uz-UZ')} so'm/kWh</Text>
          </View>
          {station.rating && (
            <View style={styles.infoBadge}>
              <Text style={styles.infoBadgeLabel}>Reyting</Text>
              <Text style={styles.infoBadgeValue}>{'\u2605'} {station.rating}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.startButton, !canStart && styles.startButtonDisabled]}
          disabled={!canStart}
          onPress={() => onStart(station)}
        >
          <Text style={styles.startButtonText}>
            {canStart ? 'Zaryadlashni boshlash' : statusLabel[station.status]}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  address: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  infoBadge: {
    flex: 1,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
  },
  infoBadgeLabel: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginBottom: 2,
  },
  infoBadgeValue: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  startButton: {
    backgroundColor: colors.electricBlue,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: colors.bgElevated,
  },
  startButtonText: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.semibold,
  },
});
