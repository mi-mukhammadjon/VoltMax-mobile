import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker } from 'react-native-maps';
import { Station } from '@/types';
import { colors } from '@/theme';

interface Props {
  station: Station;
  onPress: (station: Station) => void;
}

const statusColor: Record<Station['status'], string> = {
  available: colors.statusAvailable,
  busy: colors.statusBusy,
  offline: colors.statusOffline,
};

export default function StationMarker({ station, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: station.latitude, longitude: station.longitude }}
      onPress={() => onPress(station)}
      tracksViewChanges={false}
    >
      <View style={styles.markerOuter}>
        <View style={[styles.markerInner, { backgroundColor: statusColor[station.status] }]} />
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerOuter: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border,
  },
  markerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
});
