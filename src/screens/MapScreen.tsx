import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { List } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { Station } from '@/types';
import { colors, typography, spacing, radius } from '@/theme';
import { mockStations } from '@/data/mockStations';
import StationMarker from '@/components/StationMarker';
import StationDetailSheet from '@/components/StationDetailSheet';
import { SessionsAPI } from '@/services/api';

// Ekran 2: Xarita / Bosh ekran
// - Barcha stansiyalar xaritada holat rangiga qarab (yashil/sariq/kulrang) ko'rsatiladi
// - Stansiya bosilganda pastdan StationDetailSheet chiqadi (nom, narx, quvvat, holat)
// - Sheet ichidagi "Zaryadlashni boshlash" tugmasi faqat bo'sh stansiyalarda faol

// Toshkent markazi — boshlang'ich region
const INITIAL_REGION = {
  latitude: 41.3111,
  longitude: 69.2797,
  latitudeDelta: 0.12,
  longitudeDelta: 0.12,
};

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Map'>;

export default function MapScreen() {
  const navigation = useNavigation<NavProp>();
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [starting, setStarting] = useState(false);

  const handleMarkerPress = useCallback((station: Station) => {
    setSelectedStation(station);
  }, []);

  const handleClose = useCallback(() => setSelectedStation(null), []);

  const handleStart = useCallback(
    async (station: Station) => {
      if (starting) return;
      setStarting(true);
      try {
        // TODO: backend tayyor bo'lgach chin session yaratiladi
        // const res = await SessionsAPI.start(station.id);
        // const sessionId = res.data.id;
        const sessionId = `mock-session-${station.id}`;

        setSelectedStation(null);
        navigation.navigate('ChargingSession', { sessionId });
      } finally {
        setStarting(false);
      }
    },
    [navigation, starting]
  );

  return (
    <View style={styles.container}>
      <MapView
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        userInterfaceStyle="dark"
      >
        {mockStations.map((station) => (
          <StationMarker key={station.id} station={station} onPress={handleMarkerPress} />
        ))}
      </MapView>

      <TouchableOpacity
        style={styles.listButton}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('StationsList')}
      >
        <List size={16} color={colors.textPrimary} />
        <Text style={styles.listButtonText}>Stansiyalar</Text>
      </TouchableOpacity>

      <StationDetailSheet
        station={selectedStation}
        onClose={handleClose}
        onStart={handleStart}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  listButton: {
    position: 'absolute',
    top: spacing.xl,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  listButtonText: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.medium,
  },
});
