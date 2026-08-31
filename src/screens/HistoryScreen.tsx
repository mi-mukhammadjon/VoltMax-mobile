import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, SectionList, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, Clock, TrendingDown, Leaf } from 'lucide-react-native';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { SessionsAPI } from '@/services/api';
import { SessionHistoryItem, SessionInsights } from '@/types';
import { showAlert } from '@/services/alert';
import { formatSom } from '@/utils/money';

function InsightsCard({ insights, colors, styles }: { insights: SessionInsights; colors: ColorPalette; styles: ReturnType<typeof createStyles> }) {
  return (
    <LinearGradient
      colors={colors.gradientPrimary}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.insightsCard}
    >
      <Text style={styles.insightsTitle}>Aqlli statistika</Text>
      <View style={styles.insightsRow}>
        <View style={styles.insightsStat}>
          <Text style={styles.insightsStatValue}>{insights.avgKwhPerSession} kVt-soat</Text>
          <Text style={styles.insightsStatLabel}>O'rtacha zaryad</Text>
        </View>
        <View style={styles.insightsStat}>
          <Text style={styles.insightsStatValue}>{formatSom(insights.avgCostPerSession)} so'm</Text>
          <Text style={styles.insightsStatLabel}>O'rtacha narx</Text>
        </View>
      </View>
      <View style={styles.insightsBadgeRow}>
        <View style={styles.insightsBadge}>
          <TrendingDown size={14} color="#fff" />
          <Text style={styles.insightsBadgeText}>
            {formatSom(insights.savedVsGasoline)} so'm tejaldi (benzinga nisbatan)
          </Text>
        </View>
        <View style={styles.insightsBadge}>
          <Leaf size={14} color="#fff" />
          <Text style={styles.insightsBadgeText}>{insights.co2SavedKg} kg CO2 tejaldi</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

// Ekran 6: Sessiyalar tarixi — backend'dagi SessionsAPI orqali
// TODO: chek/kvitansiya ko'rish qo'shiladi

interface MonthBucket {
  key: string;
  label: string;
  amount: number;
}

function MonthlyChart({ styles, data }: { styles: ReturnType<typeof createStyles>; data: MonthBucket[] }) {
  const max = Math.max(1, ...data.map((m) => m.amount));
  const lastIndex = data.length - 1;

  return (
    <View style={styles.chartCard}>
      <Text style={styles.sectionLabel}>Oylik xarajat</Text>
      <View style={styles.chartRow}>
        {data.map((item, idx) => {
          const heightPct = Math.max(8, Math.round((item.amount / max) * 100));
          return (
            <View key={item.key} style={styles.chartBarWrap}>
              <View style={styles.chartBarTrack}>
                <View
                  style={[
                    styles.chartBar,
                    { height: `${heightPct}%` },
                    idx === lastIndex && styles.chartBarActive,
                  ]}
                />
              </View>
              <Text style={styles.chartBarLabel}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function HistoryRow({
  item,
  colors,
  styles,
}: {
  item: SessionHistoryItem;
  colors: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  const date = new Date(item.date);
  return (
    <View style={styles.sessionRow}>
      <View style={styles.sessionIconWrap}>
        <Zap size={18} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.sessionStation} numberOfLines={1}>
          {item.stationName}
        </Text>
        <View style={styles.sessionMetaRow}>
          <Clock size={12} color={colors.textMuted} />
          <Text style={styles.sessionMeta}>
            {date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })} {'•'}{' '}
            {item.durationMinutes} daq {'•'} {item.kwhCharged} kVt-soat
          </Text>
        </View>
        <View style={styles.percentBadge}>
          <Zap size={11} color={colors.accent} fill={colors.accent} />
          <Text style={styles.percentBadgeText}>
            {item.startPercent}% {'→'} {item.endPercent}%
          </Text>
        </View>
      </View>
      <Text style={styles.sessionCost}>{formatSom(item.cost)} so'm</Text>
    </View>
  );
}

function groupSessionsByDate(sessions: SessionHistoryItem[]) {
  const order: string[] = [];
  const map = new Map<string, SessionHistoryItem[]>();
  sessions.forEach((s) => {
    const key = new Date(s.date).toLocaleDateString('uz-UZ', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
    if (!map.has(key)) {
      map.set(key, []);
      order.push(key);
    }
    map.get(key)!.push(s);
  });
  return order.map((title) => ({ title, data: map.get(title)! }));
}

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [sessions, setSessions] = useState<SessionHistoryItem[]>([]);
  const [insights, setInsights] = useState<SessionInsights | null>(null);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      SessionsAPI.list()
        .then((res) => setSessions(res.data.results ?? res.data))
        .catch(() => showAlert('Xatolik', "Tarixni yuklab bo'lmadi", undefined, 'error'))
        .finally(() => setLoading(false));
      SessionsAPI.getInsights()
        .then((res) => setInsights(res.data))
        .catch(() => {});
    }, [])
  );

  const monthlySpend = useMemo<MonthBucket[]>(() => {
    const now = new Date();
    const months: MonthBucket[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${d.getMonth()}`,
        label: d.toLocaleDateString('uz-UZ', { month: 'short' }),
        amount: 0,
      });
    }
    sessions.forEach((s) => {
      const d = new Date(s.date);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const bucket = months.find((m) => m.key === key);
      if (bucket) bucket.amount += s.cost;
    });
    return months;
  }, [sessions]);

  const totalThisMonth = monthlySpend[monthlySpend.length - 1]?.amount ?? 0;
  const sections = useMemo(() => groupSessionsByDate(sessions), [sessions]);

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <SectionList
      style={styles.container}
      sections={sections}
      keyExtractor={(item) => item.id}
      contentContainerStyle={[styles.listContent, { paddingTop: insets.top + spacing.md }]}
      stickySectionHeadersEnabled={false}
      ListHeaderComponent={
        <>
          <Text style={styles.screenTitle}>Sessiyalar tarixi</Text>
          {!!insights && insights.totalSessions > 0 && (
            <InsightsCard insights={insights} colors={colors} styles={styles} />
          )}
          <MonthlyChart styles={styles} data={monthlySpend} />
          <Text style={styles.totalText}>
            Shu oy: <Text style={styles.totalValue}>{formatSom(totalThisMonth)} so'm</Text>
          </Text>
        </>
      }
      renderSectionHeader={({ section }) => <Text style={styles.dateHeader}>{section.title}</Text>}
      renderItem={({ item }) => <HistoryRow item={item} colors={colors} styles={styles} />}
      ListEmptyComponent={<Text style={styles.emptyText}>Sessiyalar tarixi bo'sh</Text>}
    />
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.xxl,
      fontFamily: typography.fontFamily.bold,
      marginBottom: spacing.md,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      marginBottom: spacing.sm,
    },
    insightsCard: {
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    insightsTitle: {
      color: '#fff',
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
      marginBottom: spacing.sm,
    },
    insightsRow: {
      flexDirection: 'row',
      gap: spacing.lg,
      marginBottom: spacing.sm,
    },
    insightsStat: {
      flex: 1,
    },
    insightsStatValue: {
      color: '#fff',
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
    },
    insightsStatLabel: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    insightsBadgeRow: {
      gap: spacing.xs,
    },
    insightsBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: 'rgba(255,255,255,0.16)',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    insightsBadgeText: {
      color: '#fff',
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      flexShrink: 1,
    },
    chartCard: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.card,
    },
    chartRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      justifyContent: 'space-between',
      height: 150,
    },
    chartBarWrap: {
      flex: 1,
      alignItems: 'center',
    },
    chartBarTrack: {
      width: 20,
      height: 120,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      justifyContent: 'flex-end',
      overflow: 'hidden',
    },
    chartBar: {
      width: '100%',
      borderRadius: radius.sm,
      backgroundColor: colors.primary,
    },
    chartBarActive: {
      backgroundColor: colors.accent,
    },
    chartBarLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: spacing.xs,
    },
    totalText: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.lg,
    },
    totalValue: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semibold,
    },
    sessionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      ...shadow.sm,
    },
    sessionIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sessionStation: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    sessionMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    sessionMeta: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
    },
    dateHeader: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    percentBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      alignSelf: 'flex-start',
      gap: 4,
      backgroundColor: 'rgba(52,217,168,0.12)',
      borderRadius: radius.sm,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      marginTop: spacing.xs,
    },
    percentBadgeText: {
      color: colors.accent,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    sessionCost: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
