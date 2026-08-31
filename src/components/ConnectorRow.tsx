import React, { useEffect, useMemo, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from 'react-native';
import { Zap, ParkingCircle, PlugZap, CalendarClock, ChevronRight } from 'lucide-react-native';
import { Connector } from '@/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { formatSom } from '@/utils/money';

// Stansiya ulagichi qatori. Har holat o'ziga xos vizual signal beradi:
//   bo'sh     — yashil nuqta + "Tanlash" ko'rsatkichi
//   band      — pulslanuvchi amber nuqta + jonli foiz chizig'i
//   parkovka  — amber parkovka belgisi (zaryad tugagan, avtomobil ulagichda)
//   ishlamas  — kulrang, uzuq-uzuq chegara, so'ngan ko'rinish

/** Pulslanuvchi holat nuqtasi — "jonli" ekanini bildiradi */
function LiveDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.15] });

  return (
    <Animated.View
      style={{
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

/** Band ulagichning zaryad foizi — qiymat o'zgarganda silliq to'ladi */
function PercentBar({ percent, color, trackColor }: { percent: number; color: string; trackColor: string }) {
  const width = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(width, {
      toValue: Math.max(0, Math.min(percent, 100)),
      duration: 800,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [percent, width]);

  const widthStyle = width.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[barStyles.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[barStyles.fill, { width: widthStyle, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 6,
  },
  fill: {
    height: '100%',
    borderRadius: 3,
  },
});

interface Props {
  connector: Connector;
  /** bo'sh ulagich bosilganda — zaryadlashni boshlash */
  onSelect: (connector: Connector) => void;
  /** bo'sh bo'lmagan ulagich bosilganda — holat oynasini ochish */
  onShowStatus: (connector: Connector) => void;
}

export default function ConnectorRow({ connector, onSelect, onShowStatus }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const available = connector.status === 'available';
  const offline = connector.status === 'offline';
  const reserved = connector.status === 'reserved';
  const parking = !offline && !reserved && !!connector.parkingMode;
  const busy = !available && !offline && !reserved && !parking;

  const accent = available
    ? colors.statusAvailable
    : offline
      ? colors.statusOffline
      : colors.statusBusy;

  const statusLabel = available
    ? "Boʻsh"
    : offline
      ? 'Ishlamayapti'
      : reserved
        ? 'Bron qilingan'
        : parking
          ? 'Pullik parkovka'
          : `Zaryadlanmoqda • ${connector.chargingPercent ?? 0}%`;

  const StatusIcon = offline ? PlugZap : reserved ? CalendarClock : parking ? ParkingCircle : Zap;

  return (
    <TouchableOpacity
      style={[styles.row, offline && styles.rowOffline]}
      activeOpacity={0.8}
      onPress={() => (available ? onSelect(connector) : onShowStatus(connector))}
    >
      <View style={[styles.iconWrap, { backgroundColor: available ? colors.primarySoft : colors.bgElevated }]}>
        <StatusIcon size={18} color={accent} />
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, offline && styles.titleOffline]}>
            Ulagich {connector.label}
          </Text>
          <View style={styles.typeBadge}>
            <Text style={styles.typeText}>{connector.type}</Text>
          </View>
        </View>

        <View style={styles.metaRow}>
          {busy || parking ? <LiveDot color={accent} /> : <View style={[styles.dot, { backgroundColor: accent }]} />}
          <Text style={[styles.status, { color: accent }]} numberOfLines={1}>
            {statusLabel}
          </Text>
          <Text style={styles.power}>• {connector.powerKw} kVt</Text>
        </View>

        {busy && connector.chargingPercent != null && (
          <PercentBar
            percent={connector.chargingPercent}
            color={colors.statusBusy}
            trackColor={colors.bgElevated}
          />
        )}

        {parking && !!connector.parkingFeePerMin && (
          <Text style={styles.parkingFee}>
            {formatSom(connector.parkingFeePerMin)} so'm/daq hisoblanmoqda
          </Text>
        )}
      </View>

      <View style={styles.trailing}>
        {available ? (
          <Text style={styles.selectText}>Tanlash</Text>
        ) : (
          <ChevronRight size={18} color={colors.textMuted} />
        )}
      </View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md - 2,
      marginBottom: spacing.sm,
    },
    rowOffline: {
      borderStyle: 'dashed',
      opacity: 0.75,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    body: {
      flex: 1,
    },
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    titleOffline: {
      color: colors.textSecondary,
    },
    typeBadge: {
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: colors.bgElevated,
    },
    typeText: {
      color: colors.textMuted,
      fontSize: 10,
      fontFamily: typography.fontFamily.semibold,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      marginTop: 3,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    status: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      flexShrink: 1,
    },
    power: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
    },
    parkingFee: {
      color: colors.statusBusy,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      marginTop: 5,
    },
    trailing: {
      alignItems: 'flex-end',
      justifyContent: 'center',
    },
    selectText: {
      color: colors.primary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
  });
