import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Clock, SearchX } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { Station } from '@/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import SearchField from '@/components/SearchField';
import StationListCard from '@/components/StationListCard';
import EmptyState from '@/components/EmptyState';

// Ekran: Qidiruv — stansiya nomi yoki manzil bo'yicha jonli filtrlash.
// Ro'yxat store'dagi stansiyalardan qidiriladi (backend qidiruv endpoint'i
// qo'shilganda shu yerda StationsAPI.search() ga almashtiriladi).

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Search'>;

export default function SearchScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const stations = useAppStore((s) => s.stations);
  const recentSearches = useAppStore((s) => s.recentSearches);
  const addRecentSearch = useAppStore((s) => s.addRecentSearch);
  const clearRecentSearches = useAppStore((s) => s.clearRecentSearches);

  const [query, setQuery] = useState('');
  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!trimmed) return [];
    const needle = trimmed.toLowerCase();
    return stations.filter(
      (s) =>
        s.name.toLowerCase().includes(needle) || s.address.toLowerCase().includes(needle)
    );
  }, [trimmed, stations]);

  const openStation = useCallback(
    (station: Station) => {
      // Muvaffaqiyatli qidiruv so'rovi tarixga qo'shiladi
      if (trimmed) addRecentSearch(trimmed);
      navigation.navigate('StationDetail', { stationId: station.id });
    },
    [navigation, trimmed, addRecentSearch]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.headerRow}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.fieldWrap}>
          <SearchField value={query} onChangeText={setQuery} autoFocus />
        </View>
      </View>

      {!trimmed ? (
        <View style={styles.recentWrap}>
          {recentSearches.length > 0 ? (
            <>
              <View style={styles.recentHeader}>
                <Text style={styles.recentTitle}>So'nggi qidiruvlar</Text>
                <TouchableOpacity activeOpacity={0.7} onPress={clearRecentSearches}>
                  <Text style={styles.clearText}>Tozalash</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.chipWrap}>
                {recentSearches.map((item) => (
                  <TouchableOpacity
                    key={item}
                    style={styles.chip}
                    activeOpacity={0.8}
                    onPress={() => setQuery(item)}
                  >
                    <Clock size={13} color={colors.textMuted} />
                    <Text style={styles.chipText}>{item}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : (
            <EmptyState
              icon={<Clock size={26} color={colors.primary} />}
              title="Qidiruvni boshlang"
              subtitle="Stansiya nomi yoki manzilning bir qismini kiriting — natijalar darhol ko'rinadi."
            />
          )}
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            results.length > 0 ? (
              <Text style={styles.resultCount}>{results.length} ta natija topildi</Text>
            ) : null
          }
          renderItem={({ item }) => (
            <StationListCard station={item} onPress={openStation} />
          )}
          ListEmptyComponent={
            <EmptyState
              icon={<SearchX size={26} color={colors.primary} />}
              title="Natija topilmadi"
              subtitle={`"${trimmed}" bo'yicha stansiya yo'q. Boshqa nom yoki manzilni sinab ko'ring.`}
              actionLabel="Qidiruvni tozalash"
              onAction={() => setQuery('')}
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
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
    },
    fieldWrap: {
      flex: 1,
    },
    recentWrap: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    recentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    recentTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    clearText: {
      color: colors.primary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    chipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    resultCount: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginBottom: spacing.sm,
    },
  });
