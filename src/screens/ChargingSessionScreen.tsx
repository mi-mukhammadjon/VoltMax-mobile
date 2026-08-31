import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, DollarSign, Zap, Plug, Hourglass } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { ChargingSession } from '@/types';
import BatteryLevelIndicator from '@/components/BatteryLevelIndicator';
import SwipeToStopButton from '@/components/SwipeToStopButton';
import AnimatedStatusCircle from '@/components/AnimatedStatusCircle';
import ConnectorConnectingOverlay from '@/components/ConnectorConnectingOverlay';
import { SessionsAPI } from '@/services/api';
import {
  startChargingSession,
  ChargerTimeoutError,
  ChargingCancelledError,
  ChargingStage,
} from '@/services/chargeSession';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/services/alert';
import { formatSom } from '@/utils/money';

// Ekran 4: Real-vaqt zaryadlash monitoring
// Reference: foydalanuvchi yuborgan skrinshot asosida qurilgan (batareya vizuali,
// narx/kVt-soat kartasi, statistik grid, "suring-toxtatish" tugmasi)
// Har 3 soniyada backend'dan qayta so'raladi ("jonli" yangilanish — real WebSocket/Channels
// ulanguncha shu yetarli).

const POLL_INTERVAL_MS = 3000;

type Props = NativeStackScreenProps<RootStackParamList, 'ChargingSession'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'ChargingSession'>;

function formatMinutesSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
}

export default function ChargingSessionScreen({ route }: Props) {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeSession = useAppStore((s) => s.activeSession);
  const setActiveSession = useAppStore((s) => s.setActiveSession);
  const allStations = useAppStore((s) => s.stations);
  const { sessionId } = route.params;

  const [session, setSession] = useState<ChargingSession | null>(activeSession);
  const [resuming, setResuming] = useState(false);
  const [waitingInfo, setWaitingInfo] = useState<{ stationName: string; connectorLabel?: string; powerKw?: number } | null>(null);
  const [stage, setStage] = useState<ChargingStage>('requesting');
  const cancelResumeRef = useRef(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const fetchSession = () => {
      SessionsAPI.getById(sessionId)
        .then((res) => {
          setSession(res.data);
          setActiveSession(res.data);
        })
        .catch(() => {});
    };
    fetchSession();
    intervalRef.current = setInterval(fetchSession, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [sessionId, setActiveSession]);

  const station = useMemo(
    () => allStations.find((s) => s.id === session?.stationId),
    [allStations, session?.stationId]
  );

  const handleStop = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    try {
      await SessionsAPI.stop(sessionId);
    } catch (err) {
      // sessiya baribir tugagan hisoblanadi — foydalanuvchini bloklamaymiz
    }
    setActiveSession(null);
    navigation.goBack();
  };

  const handleResume = async () => {
    if (!station || !session || resuming) return;
    const connector = station.connectors?.find((c) => c.label === session.connectorLabel);
    setResuming(true);
    cancelResumeRef.current = false;
    setStage('requesting');
    setWaitingInfo({
      stationName: station.name,
      connectorLabel: session.connectorLabel,
      powerKw: connector?.powerKw,
    });
    try {
      const newSession = await startChargingSession(station.id, connector?.id, {
        onStage: setStage,
        cancelRef: cancelResumeRef,
      });
      setActiveSession(newSession);
      navigation.replace('ChargingSession', { sessionId: newSession.id });
    } catch (err: any) {
      if (!(err instanceof ChargingCancelledError)) {
        const detail = err instanceof ChargerTimeoutError ? err.message : err?.response?.data?.detail;
        showAlert('Xatolik', detail || "Zaryadlashni davom ettirib bo'lmadi", undefined, 'error');
      }
    } finally {
      setResuming(false);
      setWaitingInfo(null);
    }
  };

  const handleCancelResume = () => {
    cancelResumeRef.current = true;
  };

  if (!session) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  // Sessiya real charger tomonidan tabiiy tugatilgan (masalan batareya to'lgan) —
  // ulagich hali jismoniy ulangan bo'lishi mumkin, shuning uchun oddiy "tarix"
  // ko'rinishi o'rniga alohida "tugadi, davom ettirasizmi?" ekrani ko'rsatiladi.
  if (session.status !== 'charging') {
    return (
      <View style={styles.container}>
        <View style={[styles.header, styles.endedHeaderPadding]}>
          <View style={styles.backButton}>
            <ArrowLeft size={20} color={colors.textPrimary} onPress={() => navigation.goBack()} />
          </View>
          <Text style={styles.headerTitle}>Zaryadlash jarayoni</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.endedInfoCard}>
          <View style={styles.connectorBadge}>
            <Text style={styles.connectorLetter}>{session.connectorLabel}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stationName} numberOfLines={1}>{station?.name ?? 'Stansiya'}</Text>
            <Text style={styles.stationSubtitle}>
              Ulagich: {session.connectorLabel} {'•'} {session.powerKw} kVt
            </Text>
          </View>
        </View>

        <View style={styles.endedCenter}>
          <AnimatedStatusCircle
            icon={<Hourglass size={36} color={colors.bgPrimary} />}
            gradientColors={[colors.statusBusy, '#D97706']}
          />
          <Text style={styles.endedTitle}>Zaryadlash tugadi</Text>
          <Text style={styles.endedSubtitle}>
            Ulagichni ajrating yoki zaryadlashni davom ettiring
          </Text>
        </View>

        <TouchableOpacity style={styles.resumeButton} activeOpacity={0.85} onPress={handleResume} disabled={resuming}>
          <Text style={styles.resumeButtonText}>{resuming ? 'Kutilmoqda...' : 'Davom etish'}</Text>
        </TouchableOpacity>

        <ConnectorConnectingOverlay
          visible={!!waitingInfo}
          stage={stage}
          stationName={waitingInfo?.stationName ?? ''}
          connectorLabel={waitingInfo?.connectorLabel}
          powerKw={waitingInfo?.powerKw}
          onCancel={handleCancelResume}
        />
      </View>
    );
  }

  const { minutes, seconds } = formatMinutesSeconds(session.remainingSeconds);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.backButton}>
          <ArrowLeft
            size={20}
            color={colors.textPrimary}
            onPress={() => navigation.goBack()}
          />
        </View>
        <Text style={styles.headerTitle}>Zaryadlash jarayoni</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Station / vehicle card */}
      <View style={styles.card}>
        <View style={styles.stationRow}>
          <View style={styles.connectorBadge}>
            <Text style={styles.connectorLetter}>{session.connectorLabel}</Text>
          </View>
          <View style={styles.connectorIconWrap}>
            <Plug size={18} color={colors.textSecondary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stationName} numberOfLines={1}>
              {station?.name ?? 'Stansiya'}
            </Text>
            <Text style={styles.stationSubtitle}>
              {station?.powerKw}kVt {'•'} {station?.chargerType} {session.connectorLabel} {'•'} Ulangan
            </Text>
          </View>
        </View>

        <View style={styles.carImageWrap}>
          {/* TODO: haqiqiy avtomobil rasmi (Image source={{uri: ...}}) ulanadi */}
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?q=80&w=800' }}
            style={styles.carImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.chargingStatus}>Zaryadlanmoqda</Text>
      </View>

      {/* Progress + pricing row */}
      <View style={styles.row}>
        <View style={[styles.card, styles.halfCard]}>
          <Text style={styles.cardLabel}>Zaryadlash jarayoni</Text>
          <View style={styles.progressBody}>
            <BatteryLevelIndicator percent={session.currentPercent} />
            <View style={styles.timeBlock}>
              <View style={styles.timeRow}>
                <Text style={styles.timeValue}>{minutes}</Text>
                <Text style={styles.timeUnit}>daqiqa</Text>
              </View>
              <View style={styles.timeRow}>
                <Text style={styles.timeValue}>{seconds}</Text>
                <Text style={styles.timeUnit}>soniya</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={[styles.card, styles.halfCard]}>
          <View style={styles.infoTile}>
            <Text style={styles.infoTileLabel}>Narx 1 kVt-soat uchun</Text>
            <View style={styles.infoTileValueRow}>
              <View style={styles.iconChip}>
                <DollarSign size={14} color={colors.bgPrimary} />
              </View>
              <Text style={styles.infoTileValue}>{formatSom(session.pricePerKwh)} so'm</Text>
            </View>
            {/* Chegirma sababi va tejalgan summa. Narx sessiya
                boshlanganda muzlatilgan, shuning uchun bu qiymat
                sessiya davomida o'zgarmaydi. */}
            {!!session.priceLabel && (
              <Text style={styles.savedNote}>
                {session.priceLabel}
                {!!session.savedAmount && ` · ${formatSom(session.savedAmount)} so'm tejaldi`}
              </Text>
            )}
          </View>

          <View style={styles.infoTile}>
            <Text style={styles.infoTileLabel}>Zaryadlangan kVt</Text>
            <View style={styles.infoTileValueRow}>
              <View style={[styles.iconChip, { backgroundColor: colors.accent }]}>
                <Zap size={14} color={colors.bgPrimary} />
              </View>
              <Text style={styles.infoTileValue}>{session.kwhCharged.toFixed(3)} kVt-soat</Text>
            </View>
          </View>

          <View style={{ marginTop: spacing.sm }}>
            <Text style={styles.paymentLabel}>Sizning to'lovingiz</Text>
            <Text style={styles.paymentValue}>
              {formatSom(session.costSoFar)} <Text style={styles.paymentUnit}>so'm</Text>
            </Text>
            {/* Parkovka hisoblanayotgan bo'lsa, umumiy summa nimadan iboratligi
                ochib beriladi — aks holda summa sababsiz oshgandek ko'rinadi. */}
            {!!session.parkingCost && (
              <>
                <Text style={styles.paymentBreakdown}>
                  Energiya {formatSom(session.energyCost ?? session.costSoFar - session.parkingCost)} +
                  parkovka {formatSom(session.parkingCost)} so'm ({session.parkingMinutes ?? 0} daq)
                </Text>
                {/* Parkovka daqiqalik yechilgani uchun — qancha qismi allaqachon to'langan */}
                {!!session.parkingPaid && (
                  <Text style={styles.paymentNote}>
                    Parkovkaning {formatSom(session.parkingPaid)} so'mi hamyondan yechib bo'lingan
                  </Text>
                )}
              </>
            )}
          </View>
        </View>
      </View>

      {/* Stats grid */}
      <View style={styles.card}>
        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Quvvat</Text>
            <Text style={styles.statValue}>
              {session.powerKw} <Text style={styles.statUnit}>kVt</Text>
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Kuchlanish tok</Text>
            <Text style={styles.statValue}>
              {session.currentAmps.toFixed(2)} <Text style={styles.statUnit}>A</Text>
            </Text>
          </View>
          <View style={styles.statDividerH} />
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>Voltaj</Text>
            <Text style={styles.statValue}>
              {session.voltageV.toFixed(2)} <Text style={styles.statUnit}>V</Text>
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>
              {session.parkingCost ? 'Parkovka hisoblanmoqda' : 'Parkovka jarimasi'}
            </Text>
            <Text
              style={[styles.statValue, !!session.parkingCost && { color: colors.statusBusy }]}
            >
              {formatSom(session.parkingFeePerMin)} <Text style={styles.statUnit}>so'm/min</Text>
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.swipeWrap}>
        <SwipeToStopButton onComplete={handleStop} />
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
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
    card: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    stationRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    connectorBadge: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectorLetter: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
    },
    connectorIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stationName: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
    stationSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    carImageWrap: {
      height: 140,
      alignItems: 'center',
      justifyContent: 'center',
    },
    carImage: {
      width: '100%',
      height: '100%',
    },
    chargingStatus: {
      textAlign: 'center',
      color: colors.accent,
      fontFamily: typography.fontFamily.semibold,
      fontSize: typography.size.base,
      marginTop: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.md,
    },
    halfCard: {
      flex: 1,
    },
    cardLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.sm,
    },
    progressBody: {
      alignItems: 'center',
    },
    timeBlock: {
      marginTop: spacing.sm,
      alignItems: 'center',
    },
    timeRow: {
      flexDirection: 'row',
      alignItems: 'baseline',
      gap: 4,
    },
    timeValue: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
    },
    timeUnit: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
    },
    infoTile: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    infoTileLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginBottom: spacing.xs,
    },
    infoTileValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    iconChip: {
      width: 22,
      height: 22,
      borderRadius: 11,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    infoTileValue: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    savedNote: {
      color: colors.accent,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      marginTop: 4,
    },
    paymentLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
    },
    paymentValue: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
      marginTop: 2,
    },
    paymentUnit: {
      fontSize: typography.size.sm,
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
    paymentBreakdown: {
      color: colors.statusBusy,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      marginTop: 4,
    },
    paymentNote: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    statsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    statCell: {
      width: '50%',
      alignItems: 'center',
      paddingVertical: spacing.md,
    },
    statDividerH: {
      width: '100%',
      height: 1,
      backgroundColor: colors.border,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginBottom: spacing.xs,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
    },
    statUnit: {
      fontSize: typography.size.xs,
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.regular,
    },
    swipeWrap: {
      marginTop: spacing.sm,
    },
    endedHeaderPadding: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
    },
    endedInfoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginHorizontal: spacing.lg,
    },
    endedCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    endedTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      marginTop: spacing.lg,
    },
    endedSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      textAlign: 'center',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.xl,
    },
    resumeButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginHorizontal: spacing.lg,
      marginBottom: spacing.lg,
    },
    resumeButtonText: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
  });
