import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell,
  Map as MapIcon,
  CalendarClock,
  Wallet as WalletIcon,
  History as HistoryIcon,
  Zap,
  Leaf,
  ChevronRight,
  Plus,
  MapPinOff,
} from 'lucide-react-native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { Station, SessionInsights } from '@/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { StationsAPI, WalletAPI, SessionsAPI, AuthAPI } from '@/services/api';
import { subscribeToStationUpdates } from '@/services/liveUpdates';
import { subscribeToNetwork, useIsOnline } from '@/services/network';
import OfflineBanner from '@/components/OfflineBanner';
import SearchField from '@/components/SearchField';
import SectionHeader from '@/components/SectionHeader';
import Card from '@/components/Card';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import StationCompactCard, { COMPACT_CARD_WIDTH } from '@/components/StationCompactCard';
import { formatSom } from '@/utils/money';

// Ekran: Asosiy (Home dashboard) — Prime EV kitidagi bosh ekran tuzilishi:
// salomlashuv + bildirishnoma, balans kartasi, qidiruv, tezkor amallar,
// faol sessiya banneri, "Yaqin atrofdagi stansiyalar" karuseli va statistika.
// Xarita alohida ekranga (root stack "Map") ko'chirildi — bu yerdan ochiladi.

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Main'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const QUICK_ACTIONS = [
  { key: 'Map', label: 'Xarita', icon: MapIcon },
  { key: 'NewBooking', label: 'Bron qilish', icon: CalendarClock },
  { key: 'Wallet', label: 'Hamyon', icon: WalletIcon },
  { key: 'History', label: 'Tarix', icon: HistoryIcon },
] as const;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return 'Xayrli tun';
  if (hour < 12) return 'Xayrli tong';
  if (hour < 18) return 'Xayrli kun';
  return 'Xayrli kech';
}

export default function HomeScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const stations = useAppStore((s) => s.stations);
  const setStations = useAppStore((s) => s.setStations);
  const walletBalance = useAppStore((s) => s.walletBalance);
  const setWalletBalance = useAppStore((s) => s.setWalletBalance);
  const activeSession = useAppStore((s) => s.activeSession);
  const phone = useAuthStore((s) => s.phone);
  const name = useAuthStore((s) => s.name);
  const setName = useAuthStore((s) => s.setName);
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const stationsSyncedAt = useAppStore((s) => s.stationsSyncedAt);
  const online = useIsOnline();

  const [insights, setInsights] = useState<SessionInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    // Har bir so'rov mustaqil: biri yiqilsa qolganlari baribir ko'rsatiladi
    // (dashboard bo'sh qolib ketmasligi uchun xatolar bu yerda "yutiladi").
    await Promise.allSettled([
      StationsAPI.list().then((res) => setStations(res.data.results ?? res.data)),
      WalletAPI.getBalance().then((res) => setWalletBalance(res.data)),
      SessionsAPI.getInsights().then((res) => setInsights(res.data)),
      // Ism va rasm profilda o'zgargan bo'lishi mumkin — salomlashuv va
      // avatar doim dolzarb bo'lsin. Rasm boshqa qurilmadan
      // almashtirilgan bo'lishi ham mumkin.
      AuthAPI.getProfile().then((res) => {
        setName(res.data.name ?? null);
        setAvatarUrl(res.data.avatarUrl ?? null);
      }),
    ]);
    setLoading(false);
  }, [setStations, setWalletBalance, setName, setAvatarUrl]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToStationUpdates(load);
    return unsubscribe;
  }, [load]);

  // Aloqa TIKLANGANDA ma'lumot o'zi yangilanadi. Aks holda
  // foydalanuvchi qo'lda tortib yangilashi kerak bo'lardi va
  // ko'pchilik buni qilmaydi — ular ilovani "buzilgan" deb yopadi.
  useEffect(() => subscribeToNetwork((online) => {
    if (online) load();
  }), [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  // Karuselda faqat eng yaqin 6 ta stansiya — qolganlari "Barchasi" orqali
  const nearbyStations = useMemo(
    () =>
      [...stations]
        .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
        .slice(0, 6),
    [stations]
  );

  const availableCount = useMemo(
    () => stations.filter((s) => s.status === 'available').length,
    [stations]
  );

  const openStation = useCallback(
    (station: Station) => navigation.navigate('StationDetail', { stationId: station.id }),
    [navigation]
  );

  const handleQuickAction = useCallback(
    (key: (typeof QUICK_ACTIONS)[number]['key']) => {
      if (key === 'NewBooking') {
        // Bron uchun avval stansiya tanlanadi — ro'yxat tabiga o'tkazamiz
        navigation.navigate('Stations');
        return;
      }
      navigation.navigate(key as never);
    },
    [navigation]
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.sm }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
        />
      }
    >
      {/* Aloqa yo'q bo'lsa — sabab va ma'lumot qanchalik eskiligi.
          Ilgari ekran shunchaki bo'sh qolardi va foydalanuvchi
          sababini bilmasdi. */}
      {!online && (
        <OfflineBanner syncedAt={stationsSyncedAt} onRetry={handleRefresh} />
      )}

      {/* Salomlashuv */}
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.userName} numberOfLines={1}>
            {name ?? phone ?? 'VoltMax foydalanuvchisi'}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.bellButton}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Bell size={19} color={colors.textPrimary} />
          <View style={styles.bellDot} />
        </TouchableOpacity>
      </View>

      {/* Balans */}
      <LinearGradient
        colors={colors.gradientPrimary as unknown as string[]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <View style={styles.balanceTop}>
          <Text style={styles.balanceLabel}>Hamyon balansi</Text>
          <TouchableOpacity
            style={styles.topUpButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Wallet')}
          >
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.topUpText}>To'ldirish</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.balanceAmount}>
          {formatSom((walletBalance?.amount ?? 0))}
          <Text style={styles.balanceCurrency}> so'm</Text>
        </Text>
        <Text style={styles.balanceHint}>
          {availableCount > 0
            ? `${availableCount} ta stansiya hozir bo'sh`
            : 'Stansiyalar holati yangilanmoqda'}
        </Text>
      </LinearGradient>

      {/* Qidiruv */}
      <View style={styles.searchWrap}>
        <SearchField onPress={() => navigation.navigate('Search')} />
      </View>

      {/* Tezkor amallar */}
      <View style={styles.quickRow}>
        {QUICK_ACTIONS.map(({ key, label, icon: Icon }) => (
          <TouchableOpacity
            key={key}
            style={styles.quickItem}
            activeOpacity={0.8}
            onPress={() => handleQuickAction(key)}
          >
            <View style={styles.quickIcon}>
              <Icon size={20} color={colors.primary} />
            </View>
            <Text style={styles.quickLabel} numberOfLines={1}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Faol sessiya banneri */}
      {!!activeSession && (
        <TouchableOpacity
          style={styles.sessionBanner}
          activeOpacity={0.85}
          onPress={() =>
            navigation.navigate('ChargingSession', { sessionId: activeSession.id })
          }
        >
          <View style={styles.sessionIcon}>
            <Zap size={18} color="#FFFFFF" fill="#FFFFFF" />
          </View>
          <View style={styles.sessionText}>
            <Text style={styles.sessionTitle}>Zaryadlash davom etmoqda</Text>
            <Text style={styles.sessionSubtitle}>
              {activeSession.currentPercent}% • {activeSession.connectorLabel} ulagich •{' '}
              {activeSession.kwhCharged.toFixed(1)} kVt·s
            </Text>
          </View>
          <ChevronRight size={18} color={colors.primary} />
        </TouchableOpacity>
      )}

      {/* Yaqin atrofdagi stansiyalar */}
      <View style={styles.section}>
        <SectionHeader
          title="Yaqin atrofdagi stansiyalar"
          onAction={() => navigation.navigate('Stations')}
        />
      </View>

      {loading ? (
        <View style={styles.skeletonRow}>
          {[0, 1].map((i) => (
            <Card key={i} style={styles.skeletonCard}>
              <Skeleton width={70} height={20} borderRadius={radius.pill} />
              <Skeleton width="80%" height={14} style={{ marginTop: spacing.md }} />
              <Skeleton width="60%" height={12} style={{ marginTop: spacing.sm }} />
              <Skeleton width="45%" height={12} style={{ marginTop: spacing.md }} />
            </Card>
          ))}
        </View>
      ) : nearbyStations.length === 0 ? (
        <View style={styles.section}>
          <Card>
            <EmptyState
              icon={<MapPinOff size={26} color={colors.primary} />}
              title="Stansiya topilmadi"
              subtitle="Hozircha yaqin atrofda stansiya yo'q yoki ma'lumot yuklanmadi."
              actionLabel="Qayta yuklash"
              onAction={handleRefresh}
              fill={false}
            />
          </Card>
        </View>
      ) : (
        <FlatList
          horizontal
          data={nearbyStations}
          keyExtractor={(item) => item.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carousel}
          snapToInterval={COMPACT_CARD_WIDTH + spacing.md}
          decelerationRate="fast"
          renderItem={({ item }) => (
            <StationCompactCard station={item} onPress={openStation} />
          )}
        />
      )}

      {/* Statistika */}
      {!!insights && insights.totalSessions > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="Sizning natijalaringiz"
            actionLabel="Tarix"
            onAction={() => navigation.navigate('History')}
          />
          <View style={styles.statsRow}>
            <Card style={styles.statCard}>
              <View style={styles.statIcon}>
                <Zap size={16} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{insights.totalKwh.toFixed(1)}</Text>
              <Text style={styles.statLabel}>jami kVt·soat</Text>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statIcon}>
                <Leaf size={16} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{insights.co2SavedKg.toFixed(0)} kg</Text>
              <Text style={styles.statLabel}>CO₂ tejaldi</Text>
            </Card>
            <Card style={styles.statCard}>
              <View style={styles.statIcon}>
                <HistoryIcon size={16} color={colors.primary} />
              </View>
              <Text style={styles.statValue}>{insights.totalSessions}</Text>
              <Text style={styles.statLabel}>sessiya</Text>
            </Card>
          </View>
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
      paddingBottom: spacing.xxl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    headerText: {
      flex: 1,
    },
    greeting: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    userName: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      marginTop: 2,
    },
    bellButton: {
      width: 42,
      height: 42,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    bellDot: {
      position: 'absolute',
      top: 10,
      right: 12,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.statusError,
      borderWidth: 1.5,
      borderColor: colors.bgSecondary,
    },
    balanceCard: {
      marginHorizontal: spacing.lg,
      borderRadius: radius.lg,
      padding: spacing.md,
      ...shadow.float,
    },
    balanceTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    balanceLabel: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    topUpButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: 'rgba(255,255,255,0.22)',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    topUpText: {
      color: '#FFFFFF',
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    balanceAmount: {
      color: '#FFFFFF',
      fontSize: typography.size.xxl,
      fontFamily: typography.fontFamily.bold,
      marginTop: spacing.sm,
    },
    balanceCurrency: {
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.medium,
    },
    balanceHint: {
      color: 'rgba(255,255,255,0.85)',
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    searchWrap: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
    },
    quickRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      marginTop: spacing.md,
      gap: spacing.sm,
    },
    quickItem: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    quickIcon: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quickLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    sessionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginHorizontal: spacing.lg,
      marginTop: spacing.lg,
      padding: spacing.sm + 2,
      borderRadius: radius.md,
      backgroundColor: colors.primarySoft,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    sessionIcon: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sessionText: {
      flex: 1,
    },
    sessionTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    sessionSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      marginTop: 1,
    },
    section: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.lg,
    },
    carousel: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
      paddingBottom: spacing.xs,
    },
    skeletonRow: {
      flexDirection: 'row',
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    skeletonCard: {
      width: COMPACT_CARD_WIDTH,
    },
    statsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    statCard: {
      flex: 1,
      alignItems: 'flex-start',
      paddingHorizontal: spacing.sm + 2,
    },
    statIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    statValue: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
    },
    statLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 1,
    },
  });
