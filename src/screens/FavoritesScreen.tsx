import React, { useCallback, useMemo } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart } from 'lucide-react-native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { Station } from '@/types';
import { typography, spacing, useThemeColors, ColorPalette } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import StationListCard from '@/components/StationListCard';
import EmptyState from '@/components/EmptyState';

// Tab: Sevimli — StationDetailSheet'dagi "..." menyusi orqali qo'shilgan stansiyalar
// (useAppStore.favoriteStationIds). Hozircha faqat xotirada saqlanadi, backend/persist yo'q.

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Favorites'>,
  NativeStackNavigationProp<RootStackParamList>
>;

export default function FavoritesScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const favoriteStationIds = useAppStore((s) => s.favoriteStationIds);
  const allStations = useAppStore((s) => s.stations);

  const favoriteStations = useMemo(
    () => allStations.filter((s) => favoriteStationIds.includes(s.id)),
    [favoriteStationIds, allStations]
  );

  const openStation = useCallback(
    (station: Station) => navigation.navigate('StationDetail', { stationId: station.id }),
    [navigation]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.header}>
        <Text style={styles.screenTitle}>Sevimli</Text>
        <Text style={styles.screenSubtitle}>
          {favoriteStations.length > 0
            ? `${favoriteStations.length} ta saqlangan stansiya`
            : 'Saqlangan stansiyalar shu yerda turadi'}
        </Text>
      </View>

      <FlatList
        data={favoriteStations}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.listContent,
          favoriteStations.length === 0 && styles.listContentEmpty,
        ]}
        renderItem={({ item }) => <StationListCard station={item} onPress={openStation} />}
        ListEmptyComponent={
          <EmptyState
            icon={<Heart size={26} color={colors.primary} />}
            title="Sevimli stansiyalar yo'q"
            subtitle="Stansiya sahifasidagi yurak belgisini bosib, uni shu ro'yxatga qo'shing."
            actionLabel="Stansiyalarni ko'rish"
            onAction={() => navigation.navigate('Stations')}
          />
        }
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
      marginBottom: spacing.md,
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
    },
    screenSubtitle: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    listContentEmpty: {
      flexGrow: 1,
    },
  });
