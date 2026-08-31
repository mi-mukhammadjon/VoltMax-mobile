import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarDays } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import ScreenHeader from '@/components/ScreenHeader';
import SegmentedTabs from '@/components/SegmentedTabs';
import { BookingsAPI } from '@/services/api';
import { Booking } from '@/types';
import { showAlert } from '@/services/alert';
import { formatSom } from '@/utils/money';

// "Bronlarim" — Prime EV uslubi: segment tablar (Kelayotgan/Bekor/Tugallangan)
// va har bir bron uchun tekis karta, pastida amal havolasi.

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MyBookings'>;
type Tab = 'upcoming' | 'cancelled' | 'completed';

const TABS = [
  { value: 'upcoming' as const, label: 'Kelayotgan' },
  { value: 'cancelled' as const, label: 'Bekor qilingan' },
  { value: 'completed' as const, label: 'Tugallangan' },
];

function BookingCard({
  booking,
  onCancel,
  onRebook,
  colors,
  styles,
}: {
  booking: Booking;
  onCancel: (booking: Booking) => void;
  onRebook: (booking: Booking) => void;
  colors: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  const date = new Date(booking.scheduledAt);
  const canCancel = booking.status === 'confirmed' && date.getTime() > Date.now();

  return (
    <View style={styles.card}>
      <Text style={styles.stationName} numberOfLines={1}>
        {booking.stationName}
      </Text>
      <Text style={styles.stationAddress} numberOfLines={1}>
        {booking.stationAddress}
      </Text>

      <View style={styles.cardMetaRow}>
        <Text style={styles.cost}>{formatSom(booking.estimatedCost)} so'm</Text>
        <View style={styles.dateWrap}>
          <CalendarDays size={13} color={colors.textMuted} />
          <Text style={styles.dateText}>
            {date.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}
            {'  '}
            {date.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>

      <View style={styles.cardDivider} />

      <TouchableOpacity
        style={styles.cardAction}
        activeOpacity={0.7}
        onPress={() => (canCancel ? onCancel(booking) : onRebook(booking))}
      >
        <Text style={[styles.cardActionText, canCancel && { color: colors.statusError }]}>
          {canCancel ? 'Bekor qilish' : 'Qayta bron qilish'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function MyBookingsScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [tab, setTab] = useState<Tab>('upcoming');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback((scope: Tab) => {
    setLoading(true);
    BookingsAPI.list(scope)
      .then((res) => setBookings(res.data.results ?? res.data))
      .catch(() => showAlert('Xatolik', "Bronlarni yuklab bo'lmadi", undefined, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(tab); }, [load, tab]));

  const handleCancel = (booking: Booking) => {
    showAlert(
      'Bronni bekor qilish',
      `${booking.stationName} uchun bron bekor qilinsinmi?`,
      [
        { text: "Yo'q", style: 'cancel' },
        {
          text: 'Bekor qilish',
          style: 'destructive',
          onPress: async () => {
            try {
              await BookingsAPI.cancel(booking.id);
              load(tab);
            } catch (err) {
              showAlert('Xatolik', "Bekor qilib bo'lmadi", undefined, 'error');
            }
          },
        },
      ],
      'warning'
    );
  };

  const handleRebook = (booking: Booking) => {
    navigation.navigate('NewBooking', { stationId: booking.stationId });
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Bronlarim" />

      <View style={styles.tabsWrap}>
        <SegmentedTabs tabs={TABS} value={tab} onChange={setTab} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <BookingCard
              booking={item}
              onCancel={handleCancel}
              onRebook={handleRebook}
              colors={colors}
              styles={styles}
            />
          )}
          ListEmptyComponent={<Text style={styles.emptyText}>Bu bo'limda bron yo'q</Text>}
        />
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    tabsWrap: {
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.md,
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
    card: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    stationName: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    stationAddress: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 3,
    },
    cardMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    cost: {
      color: colors.primary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    dateWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flexShrink: 1,
    },
    dateText: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      flexShrink: 1,
    },
    cardDivider: {
      height: 1,
      backgroundColor: colors.border,
      marginTop: spacing.md,
    },
    cardAction: {
      alignItems: 'center',
      paddingTop: spacing.sm,
      paddingBottom: 2,
    },
    cardActionText: {
      color: colors.primary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    emptyText: {
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
  });
