import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Clock, Gauge, Coins, BatteryCharging } from 'lucide-react-native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { SessionHistoryItem } from '@/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { SessionsAPI } from '@/services/api';
import { subscribeToStationUpdates } from '@/services/liveUpdates';
import Card from '@/components/Card';
import SectionHeader from '@/components/SectionHeader';
import EmptyState from '@/components/EmptyState';
import PrimaryButton from '@/components/PrimaryButton';
import { formatSom } from '@/utils/money';

// Tab: Zaryadlash — faol sessiya bo'lsa jonli progress kartasi (foiz chizig'i,
// kVt·s / narx / vaqt), bo'lmasa bo'sh holat + oxirgi sessiyalar ro'yxati.

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Charging'>,
  NativeStackNavigationProp<RootStackParamList>
>;

function formatDuration(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h} soat ${m % 60} daq` : `${m} daq`;
}

export default function ChargingTabScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const activeSession = useAppStore((s) => s.activeSession);
  const setActiveSession = useAppStore((s) => s.setActiveSession);
  const [history, setHistory] = useState<SessionHistoryItem[]>([]);

  // Faol sessiya boshqa qurilmadan boshlangan/tugagan bo'lishi mumkin —
  // tab har ochilganda va stansiya yangilanishi kelganda holat tekshiriladi.
  const syncActive = useCallback(async () => {
    try {
      const res = await SessionsAPI.getActive();
      setActiveSession(res.status === 200 && res.data ? res.data : null);
    } catch {
      // tarmoq xatosi — mavjud holat saqlanadi
    }
  }, [setActiveSession]);

  useFocusEffect(
    useCallback(() => {
      syncActive();
      SessionsAPI.list()
        .then((res) => setHistory((res.data.results ?? res.data ?? []).slice(0, 5)))
        .catch(() => {});
    }, [syncActive])
  );

  useEffect(() => subscribeToStationUpdates(syncActive), [syncActive]);

  const percent = activeSession?.currentPercent ?? 0;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.screenTitle}>Zaryadlash</Text>

      {activeSession ? (
        <>
          <LinearGradient
            colors={colors.gradientPrimary as unknown as string[]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.liveCard}
          >
            <View style={styles.liveTop}>
              <View style={styles.liveBadge}>
                <Zap size={13} color="#FFFFFF" fill="#FFFFFF" />
                <Text style={styles.liveBadgeText}>Jonli</Text>
              </View>
              <Text style={styles.liveConnector}>{activeSession.connectorLabel} ulagich</Text>
            </View>

            <Text style={styles.livePercent}>
              {percent}
              <Text style={styles.livePercentSign}>%</Text>
            </Text>

            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${Math.min(percent, 100)}%` }]} />
            </View>

            <Text style={styles.liveRemaining}>
              To'lguncha taxminan {formatDuration(activeSession.remainingSeconds)}
            </Text>
          </LinearGradient>

          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <BatteryCharging size={16} color={colors.primary} />
              <Text style={styles.statValue}>{activeSession.kwhCharged.toFixed(1)}</Text>
              <Text style={styles.statLabel}>kVt·soat</Text>
            </Card>
            <Card style={styles.statCard}>
              <Coins size={16} color={colors.primary} />
              <Text style={styles.statValue}>
                {formatSom(activeSession.costSoFar)}
              </Text>
              <Text style={styles.statLabel}>so'm</Text>
            </Card>
            <Card style={styles.statCard}>
              <Clock size={16} color={colors.primary} />
              <Text style={styles.statValue}>
                {formatDuration(activeSession.elapsedSeconds)}
              </Text>
              <Text style={styles.statLabel}>o'tdi</Text>
            </Card>
          </View>

          <Card style={styles.metaCard}>
            <View style={styles.metaRow}>
              <View style={styles.metaLabelWrap}>
                <Gauge size={15} color={colors.textMuted} />
                <Text style={styles.metaLabel}>Joriy quvvat</Text>
              </View>
              <Text style={styles.metaValue}>{activeSession.powerKw} kVt</Text>
            </View>
            <View style={[styles.metaRow, styles.metaRowDivided]}>
              <View style={styles.metaLabelWrap}>
                <Coins size={15} color={colors.textMuted} />
                <Text style={styles.metaLabel}>Tarif</Text>
              </View>
              <Text style={styles.metaValue}>
                {formatSom(activeSession.pricePerKwh)} so'm/kVt·s
              </Text>
            </View>
          </Card>

          <PrimaryButton
            label="Jarayonni ochish"
            style={styles.cta}
            onPress={() =>
              navigation.navigate('ChargingSession', { sessionId: activeSession.id })
            }
          />
        </>
      ) : (
        <Card style={styles.emptyCard}>
          <EmptyState
            icon={<Zap size={26} color={colors.primary} />}
            title="Faol zaryadlash yo'q"
            subtitle="Stansiyani xaritadan yoki ro'yxatdan tanlab, zaryadlashni boshlang."
            actionLabel="Stansiya tanlash"
            onAction={() => navigation.navigate('Stations')}
            fill={false}
          />
        </Card>
      )}

      {history.length > 0 && (
        <View style={styles.historySection}>
          <SectionHeader
            title="Oxirgi sessiyalar"
            onAction={() => navigation.navigate('History')}
          />
          {history.map((item) => (
            <Card key={item.id} style={styles.historyCard}>
              <View style={styles.historyText}>
                <Text style={styles.historyName} numberOfLines={1}>
                  {item.stationName}
                </Text>
                <Text style={styles.historyMeta}>
                  {new Date(item.date).toLocaleDateString('uz-UZ')} • {item.kwhCharged.toFixed(1)} kVt·s •{' '}
                  {item.durationMinutes} daq
                </Text>
              </View>
              <Text style={styles.historyCost}>{formatSom(item.cost)} so'm</Text>
            </Card>
          ))}
        </View>
      )}
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
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
      marginBottom: spacing.md,
    },
    liveCard: {
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow.float,
    },
    liveTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    liveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.22)',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    liveBadgeText: {
      color: '#FFFFFF',
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    liveConnector: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    livePercent: {
      color: '#FFFFFF',
      fontSize: typography.size.display,
      fontFamily: typography.fontFamily.bold,
      marginTop: spacing.sm,
    },
    livePercentSign: {
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.medium,
    },
    progressTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: 'rgba(255,255,255,0.28)',
      overflow: 'hidden',
      marginTop: spacing.sm,
    },
    progressFill: {
      height: '100%',
      borderRadius: 4,
      backgroundColor: '#FFFFFF',
    },
    liveRemaining: {
      color: 'rgba(255,255,255,0.9)',
      fontSize: typography.size.xs,
      marginTop: spacing.sm,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    statCard: {
      flex: 1,
      alignItems: 'flex-start',
      paddingHorizontal: spacing.sm + 2,
      gap: spacing.sm,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: -6,
    },
    metaCard: {
      marginTop: spacing.md,
      paddingVertical: 0,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md - 2,
    },
    metaRowDivided: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    metaLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    metaLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
    },
    metaValue: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    cta: {
      marginTop: spacing.lg,
    },
    emptyCard: {
      paddingVertical: spacing.md,
    },
    historySection: {
      marginTop: spacing.xl,
    },
    historyCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    historyText: {
      flex: 1,
    },
    historyName: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    historyMeta: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    historyCost: {
      color: colors.primary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
  });
