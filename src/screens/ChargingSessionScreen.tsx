import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { ArrowLeft, DollarSign, Zap, Plug } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { colors, typography, spacing, radius } from '@/theme';
import { getMockSession } from '@/data/mockSession';
import { mockStations } from '@/data/mockStations';
import BatteryLevelIndicator from '@/components/BatteryLevelIndicator';
import SwipeToStopButton from '@/components/SwipeToStopButton';
import { SessionsAPI } from '@/services/api';

// Ekran 4: Real-vaqt zaryadlash monitoring
// Reference: foydalanuvchi yuborgan skrinshot asosida qurilgan (batareya vizuali,
// narx/kVt-soat kartasi, statistik grid, "suring-toxtatish" tugmasi)
// TODO: WebSocket orqali currentPercent/kwhCharged/costSoFar live yangilanishi ulash

type Props = NativeStackScreenProps<RootStackParamList, 'ChargingSession'>;

function formatSom(amount: number) {
  return amount.toLocaleString('uz-UZ');
}

function formatMinutesSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return { minutes, seconds };
}

export default function ChargingSessionScreen({ route }: Props) {
  const navigation = useNavigation();
  const { sessionId } = route.params;

  const session = useMemo(() => getMockSession(sessionId), [sessionId]);
  const station = useMemo(
    () => mockStations.find((s) => s.id === session.stationId),
    [session.stationId]
  );

  const { minutes, seconds } = formatMinutesSeconds(session.remainingSeconds);

  const handleStop = async () => {
    // TODO: SessionsAPI.stop(session.id) chaqiriladi, keyin History yoki Map'ga qaytish
    // await SessionsAPI.stop(session.id);
    navigation.goBack();
  };

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
              {station?.powerKw}kVt {'\u2022'} {station?.chargerType} {session.connectorLabel} {'\u2022'} Ulangan
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
          </View>

          <View style={styles.infoTile}>
            <Text style={styles.infoTileLabel}>Zaryadlangan kVt</Text>
            <View style={styles.infoTileValueRow}>
              <View style={[styles.iconChip, { backgroundColor: colors.mintGreen }]}>
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
            <Text style={styles.statLabel}>Parkovka jarimasi</Text>
            <Text style={styles.statValue}>
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

const styles = StyleSheet.create({
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
    color: colors.mintGreen,
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
    backgroundColor: colors.electricBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTileValue: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
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
});
