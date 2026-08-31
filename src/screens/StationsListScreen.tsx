import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MapPinOff } from 'lucide-react-native';
import { RootStackParamList, MainTabParamList } from '@/navigation/types';
import { Station } from '@/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { StationsAPI } from '@/services/api';
import { subscribeToStationUpdates } from '@/services/liveUpdates';
import StationListCard from '@/components/StationListCard';
import StationFilterSheet, {
  StationFilters,
  DEFAULT_FILTERS,
  isDefaultFilters,
} from '@/components/StationFilterSheet';
import SearchField from '@/components/SearchField';
import Card from '@/components/Card';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

// Ekran: Stansiyalar — jonli qidiruv, filtr sheet'i (ulagich turi, minimal
// quvvat, saralash, bo'sh/chegirmali) va tortib-yangilash bilan to'liq ro'yxat.

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Stations'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function StationsListScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const allStations = useAppStore((s) => s.stations);
  const setStations = useAppStore((s) => s.setStations);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<StationFilters>(DEFAULT_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await StationsAPI.list();
      setStations(res.data.results ?? res.data);
    } catch {
      // Xatoni bu yerda ko'rsatmaymiz — ro'yxat bo'sh holatda tushuntiriladi
    } finally {
      setLoading(false);
    }
  }, [setStations]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToStationUpdates(load);
    return unsubscribe;
  }, [load]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const stations = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = allStations.filter((s) => {
      if (needle && !`${s.name} ${s.address}`.toLowerCase().includes(needle)) return false;
      if (filters.connectorType !== 'all') {
        const matchesType =
          s.connectors?.some((c) => c.type === filters.connectorType) ??
          s.chargerType === filters.connectorType;
        if (!matchesType) return false;
      }
      if (filters.minPowerKw > 0 && s.powerKw < filters.minPowerKw) return false;
      if (filters.onlyAvailable && s.status !== 'available') return false;
      if (
        filters.onlyDiscounts &&
        !(s.originalPricePerKwh && s.originalPricePerKwh > s.pricePerKwh)
      ) {
        return false;
      }
      return true;
    });

    // Saralash: masofa/narx — o'sish, quvvat/reyting — kamayish tartibida
    return filtered.sort((a, b) => {
      switch (filters.sort) {
        case 'price':
          return a.pricePerKwh - b.pricePerKwh;
        case 'power':
          return b.powerKw - a.powerKw;
        case 'rating':
          return (b.rating ?? 0) - (a.rating ?? 0);
        default:
          return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      }
    });
  }, [allStations, query, filters]);

  const openStation = useCallback(
    (station: Station) => navigation.navigate('StationDetail', { stationId: station.id }),
    [navigation]
  );

  const filtersActive = !isDefaultFilters(filters);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Text style={styles.headerTitle}>Stansiyalar</Text>
        <Text style={styles.headerSubtitle}>
          {loading ? 'Yuklanmoqda…' : `${stations.length} ta stansiya topildi`}
        </Text>
        <View style={styles.searchWrap}>
          <SearchField
            value={query}
            onChangeText={setQuery}
            onFilterPress={() => setSheetOpen(true)}
            filterActive={filtersActive}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1, 2, 3].map((i) => (
            <Card key={i} style={styles.skeletonCard}>
              <Skeleton width="65%" height={15} />
              <Skeleton width="85%" height={12} style={{ marginTop: spacing.sm }} />
              <Skeleton width="100%" height={1} style={{ marginTop: spacing.md }} />
              <Skeleton width="50%" height={13} style={{ marginTop: spacing.md }} />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={stations}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          renderItem={({ item }) => <StationListCard station={item} onPress={openStation} />}
          ListEmptyComponent={
            <EmptyState
              icon={<MapPinOff size={26} color={colors.primary} />}
              title="Stansiya topilmadi"
              subtitle={
                filtersActive || query
                  ? "Tanlangan shartlarga mos stansiya yo'q. Filtrni yumshatib ko'ring."
                  : "Stansiyalar ro'yxati bo'sh. Tortib yangilang yoki keyinroq urinib ko'ring."
              }
              actionLabel={filtersActive || query ? 'Filtrni tozalash' : 'Qayta yuklash'}
              onAction={() => {
                if (filtersActive || query) {
                  setFilters(DEFAULT_FILTERS);
                  setQuery('');
                } else {
                  handleRefresh();
                }
              }}
              fill={false}
            />
          }
        />
      )}

      <StationFilterSheet
        visible={sheetOpen}
        value={filters}
        onClose={() => setSheetOpen(false)}
        onApply={setFilters}
      />
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
    },
    headerSubtitle: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    searchWrap: {
      marginTop: spacing.md,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    skeletonWrap: {
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    skeletonCard: {
      borderRadius: radius.md,
    },
  });
