import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BellOff, Zap, CalendarClock, Wallet as WalletIcon, Settings2, AlertTriangle, CheckCircle2 } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { Booking, ServerNotification, Transaction } from '@/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { BookingsAPI, NotificationsAPI, WalletAPI } from '@/services/api';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';
import { formatSom } from '@/utils/money';

// Ekran: Bildirishnomalar. Lenta ikki manbadan yig'iladi:
//   1. SERVER xabarlari (`/api/notifications/`) — stansiya ishlamay qolgani,
//      tuzatilgani va h.k. Ularni panel yoki tizim yozadi, biz faqat o'qiymiz.
//   2. Foydalanuvchining o'z hodisalari — faol sessiya, bronlar, to'lovlar.
// Ikkalasi bitta vaqt o'qida saralanadi, chunki foydalanuvchi uchun bu bitta
// oqim: "menga aloqador nima bo'ldi".

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Notifications'>;

type FeedKind = 'session' | 'booking' | 'wallet' | 'station_down' | 'station_up';

interface FeedItem {
  id: string;
  kind: FeedKind;
  title: string;
  body: string;
  at: string; // ISO
}

const KIND_ICON: Record<FeedKind, typeof Zap> = {
  session: Zap,
  booking: CalendarClock,
  wallet: WalletIcon,
  station_down: AlertTriangle,
  station_up: CheckCircle2,
};

// Nosozlik xabari ogohlantirish rangida — u qolgan lentadan ajralib turishi kerak
const ALERT_KINDS: FeedKind[] = ['station_down'];

function formatWhen(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMin = Math.round((Date.now() - then) / 60000);
  if (diffMin < 1) return 'hozir';
  if (diffMin < 60) return `${diffMin} daqiqa oldin`;
  const diffH = Math.round(diffMin / 60);
  if (diffH < 24) return `${diffH} soat oldin`;
  const diffD = Math.round(diffH / 24);
  if (diffD < 7) return `${diffD} kun oldin`;
  return new Date(iso).toLocaleDateString('uz-UZ');
}

export default function NotificationsScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const activeSession = useAppStore((s) => s.activeSession);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [serverItems, setServerItems] = useState<ServerNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    // Promise.allSettled — bittasi qulasa qolganlari baribir ko'rinsin
    const [notifRes, bookingsRes, txRes] = await Promise.allSettled([
      NotificationsAPI.list(),
      BookingsAPI.list(),
      WalletAPI.getTransactions(),
    ]);
    if (notifRes.status === 'fulfilled') {
      setServerItems(notifRes.value.data.results ?? notifRes.value.data ?? []);
    }
    if (bookingsRes.status === 'fulfilled') {
      setBookings(bookingsRes.value.data.results ?? bookingsRes.value.data ?? []);
    }
    if (txRes.status === 'fulfilled') {
      setTransactions(txRes.value.data.results ?? txRes.value.data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Ekran ochilib, xabarlar ko'rilgach — o'qilgan deb belgilaymiz. Xatosi
  // e'tiborsiz qoldiriladi: bu qulaylik, lenta ko'rinishiga ta'sir qilmaydi.
  useEffect(() => {
    if (serverItems.some((n) => !n.isRead)) {
      NotificationsAPI.markAllRead().catch(() => {});
    }
  }, [serverItems]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const feed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];

    // Server xabarlari birinchi qo'shiladi — ular eng muhimi
    serverItems.forEach((n) => {
      items.push({
        id: `srv-${n.id}`,
        kind: (n.kind as FeedKind) ?? 'system',
        title: n.title,
        body: n.body,
        at: n.createdAt,
      });
    });

    if (activeSession) {
      items.push({
        id: `session-${activeSession.id}`,
        kind: 'session',
        title: 'Zaryadlash davom etmoqda',
        body: `${activeSession.currentPercent}% • ${activeSession.kwhCharged.toFixed(1)} kVt·s • ${formatSom(activeSession.costSoFar)} so'm`,
        at: activeSession.startedAt,
      });
    }

    bookings.slice(0, 10).forEach((b) => {
      const when = new Date(b.scheduledAt).toLocaleString('uz-UZ', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
      items.push({
        id: `booking-${b.id}`,
        kind: 'booking',
        title:
          b.status === 'cancelled'
            ? 'Bron bekor qilindi'
            : b.status === 'completed'
              ? 'Bron yakunlandi'
              : 'Bron tasdiqlandi',
        body: `${b.stationName} • ${when}`,
        at: b.createdAt,
      });
    });

    transactions.slice(0, 10).forEach((t) => {
      items.push({
        id: `tx-${t.id}`,
        kind: 'wallet',
        title: t.type === 'topup' ? "Hisob to'ldirildi" : "To'lov amalga oshirildi",
        body: `${formatSom(t.amount)} so'm • ${t.description}`,
        at: t.createdAt,
      });
    });

    return items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [activeSession, bookings, serverItems, transactions]);

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Bildirishnomalar"
        right={
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('NotificationSettings')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Settings2 size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2, 3].map((i) => (
            <Card key={i}>
              <Skeleton width="55%" height={14} />
              <Skeleton width="80%" height={12} style={{ marginTop: spacing.sm }} />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={feed}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => {
            const Icon = KIND_ICON[item.kind] ?? Zap;
            const isAlert = ALERT_KINDS.includes(item.kind);
            return (
              <Card style={styles.itemCard}>
                <View style={[styles.iconWrap, isAlert && styles.iconWrapAlert]}>
                  <Icon size={17} color={isAlert ? colors.statusError : colors.primary} />
                </View>
                <View style={styles.itemText}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemBody} numberOfLines={2}>
                    {item.body}
                  </Text>
                  <Text style={styles.itemWhen}>{formatWhen(item.at)}</Text>
                </View>
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<BellOff size={26} color={colors.primary} />}
              title="Bildirishnoma yo'q"
              subtitle="Stansiya holati, zaryadlash, bron va to'lov hodisalari shu yerda ko'rinadi."
              fill={false}
            />
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    skeletonWrap: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    itemCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm + 2,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapAlert: {
      // Palitrada tayyor "yumshoq qizil" yo'q — shaffoflik bilan hosil qilinadi
      backgroundColor: 'rgba(229,72,77,0.16)',
    },
    itemText: {
      flex: 1,
    },
    itemTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    itemBody: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    itemWhen: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 4,
    },
  });
