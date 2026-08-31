import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Station } from '@/types';
import { typography, useThemeColors, ColorPalette } from '@/theme';

interface Props {
  station: Station;
  onPress: (station: Station) => void;
}

export default function StationMarker({ station, onPress }: Props) {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const statusColor: Record<Station['status'], string> = useMemo(
    () => ({
      available: colors.statusAvailable,
      busy: colors.statusBusy,
      offline: colors.statusOffline,
    }),
    [colors]
  );

  return (
    <Marker
      coordinate={{ latitude: station.latitude, longitude: station.longitude }}
      onPress={() => onPress(station)}
      tracksViewChanges={false}
    >
      <View style={[styles.markerOuter, { borderColor: statusColor[station.status] }]}>
        <Text style={styles.markerText}>{station.powerKw}</Text>
      </View>
    </Marker>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    markerOuter: {
      minWidth: 38,
      height: 38,
      borderRadius: 19,
      paddingHorizontal: 6,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
    },
    markerText: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
  });
