import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ChevronDown, SlidersHorizontal } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { Station } from '@/types';
import { colors, typography, spacing, radius } from '@/theme';
import { mockStations } from '@/data/mockStations';
import StationListCard from '@/components/StationListCard';
import FilterChips, { StationFilter } from '@/components/FilterChips';

// "Stansiyalar poblizosti" ekrani — Tesla-uslubidagi premium ro'yxat
// Reference: foydalanuvchi yuborgan skrinshot (filtr chip'lar + stansiya kartalari)

type NavProp = NativeStackNavigationProp<RootStackParamList, 'StationsList'>;

export default function StationsListScreen() {
  const navigation = useNavigation<NavProp>();
  const [filter, setFilter] = useState<StationFilter>('available');

  const stations = useMemo(() => {
    switch (filter) {
      case 'available':
        return mockStations.filter((s) => s.status === 'available');
      case 'discounts':
        return mockStations.filter(
          (s) => s.originalPricePerKwh && s.originalPricePerKwh > s.pricePerKwh
        );
      default:
        return mockStations;
    }
  }, [filter]);

  const handleCardPress = (station: Station) => {
    navigation.navigate('StationDetail', { stationId: station.id });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerTitleRow} activeOpacity={0.7}>
          <Text style={styles.headerTitle}>Stansiyalar poblizosti</Text>
          <ChevronDown size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} activeOpacity={0.7}>
          <SlidersHorizontal size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.filterWrap}>
        <FilterChips value={filter} onChange={setFilter} />
      </View>

      <FlatList
        data={stations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <StationListCard station={item} onPress={handleCardPress} />
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Bu filtr bo'yicha stansiya topilmadi</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterWrap: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  listContent: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  emptyText: {
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
});
