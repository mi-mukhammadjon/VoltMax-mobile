import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Wallet, Search, Bell, Headphones, Info, LocateFixed, ArrowLeft } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { Connector, Station } from '@/types';
import { typography, spacing, radius, shadow, useThemeColors, useMapStyle, ColorPalette } from '@/theme';
import { useActiveScheme } from '@/store/useThemeStore';
import StationMarker from '@/components/StationMarker';
import StationDetailSheet from '@/components/StationDetailSheet';
import { StationsAPI, WalletAPI } from '@/services/api';
import {
  startChargingSession,
  ChargerTimeoutError,
  ChargingCancelledError,
  ChargingStage,
} from '@/services/chargeSession';
import { subscribeToStationUpdates } from '@/services/liveUpdates';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/services/alert';
import ConnectorConnectingOverlay from '@/components/ConnectorConnectingOverlay';
import ConnectorStatusModal from '@/components/ConnectorStatusModal';
import { formatSom } from '@/utils/money';

// Ekran: Xarita (root stack) — Home ekranidagi "Xarita" tugmasi orqali ochiladi
// - Barcha stansiyalar xaritada holat rangiga qarab (yashil/sariq/kulrang) ko'rsatiladi,
//   marker ichida stansiyaning kVt quvvati ko'rsatiladi
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
  const insets = useSafeAreaInsets();
  const mapRef = useRef<MapView>(null);
  const colors = useThemeColors();
  const mapStyle = useMapStyle();
  const scheme = useActiveScheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const stations = useAppStore((s) => s.stations);
  const setStations = useAppStore((s) => s.setStations);
  const walletBalance = useAppStore((s) => s.walletBalance);
  const setWalletBalance = useAppStore((s) => s.setWalletBalance);
  const setActiveSession = useAppStore((s) => s.setActiveSession);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [starting, setStarting] = useState(false);
  const [waitingInfo, setWaitingInfo] = useState<{ stationName: string; connectorLabel?: string; powerKw?: number } | null>(null);
  const [stage, setStage] = useState<ChargingStage>('requesting');
  // Xarita sheet'ida bo'sh bo'lmagan ulagich bosilganda holat oynasi ochiladi
  const [statusConnector, setStatusConnector] = useState<Connector | null>(null);
  const cancelStartRef = useRef(false);

  useEffect(() => {
    const loadStations = () => {
      StationsAPI.list()
        .then((res) => setStations(res.data.results ?? res.data))
        .catch(() => showAlert('Xatolik', "Stansiyalarni yuklab bo'lmadi. Backend ishlayaptimi?", undefined, 'error'));
    };
    loadStations();
    WalletAPI.getBalance()
      .then((res) => setWalletBalance(res.data))
      .catch(() => {});

    // Backend'da stansiya/ulagich holati o'zgarsa (boshqa foydalanuvchi
    // zaryadlashni boshladi/tugatdi, real charger holati almashdi va h.k.)
    // xaritani qo'lda yangilamasdan darhol qayta so'raladi.
    const unsubscribe = subscribeToStationUpdates(loadStations);
    return unsubscribe;
  }, [setStations, setWalletBalance]);

  const handleMarkerPress = useCallback((station: Station) => {
    setSelectedStation(station);
  }, []);

  const handleClose = useCallback(() => setSelectedStation(null), []);

  const handleStart = useCallback(
    async (station: Station, connector?: Connector) => {
      if (starting) return;
      setStarting(true);
      cancelStartRef.current = false;
      try {
        const targetConnector = connector ?? station.connectors?.find((c) => c.status === 'available');
        setStage('requesting');
        setWaitingInfo({
          stationName: station.name,
          connectorLabel: targetConnector?.label,
          powerKw: targetConnector?.powerKw,
        });
        const session = await startChargingSession(station.id, targetConnector?.id, {
          onStage: setStage,
          cancelRef: cancelStartRef,
        });
        setActiveSession(session);

        setSelectedStation(null);
        navigation.navigate('ChargingSession', { sessionId: session.id });
      } catch (err: any) {
        if (!(err instanceof ChargingCancelledError)) {
          const detail = err instanceof ChargerTimeoutError ? err.message : err?.response?.data?.detail;
          showAlert('Xatolik', detail || "Zaryadlashni boshlab bo'lmadi", undefined, 'error');
        }
      } finally {
        setStarting(false);
        setWaitingInfo(null);
      }
    },
    [navigation, starting, setActiveSession]
  );

  const handleCancelWaiting = useCallback(() => {
    cancelStartRef.current = true;
  }, []);

  const handleLocate = useCallback(() => {
    mapRef.current?.animateToRegion(INITIAL_REGION, 400);
  }, []);

  const handleSearch = () => navigation.navigate('Search');
  const handleNotifications = () => navigation.navigate('Notifications');
  // TODO: qo'llab-quvvatlash oqimi hali qurilmagan
  const handleSupport = () => showAlert('Qoʻllab-quvvatlash', 'Tez orada qoʻshiladi.');
  const handleInfo = () => showAlert('Xarita belgilari', 'Har bir belgi stansiyaning kVt quvvatini bildiradi. Rang holatni koʻrsatadi: mint — boʻsh, amber — band, kulrang — ishlamayapti.');

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={INITIAL_REGION}
        userInterfaceStyle={scheme}
        customMapStyle={mapStyle as any}
      >
        {stations.map((station) => (
          <StationMarker key={station.id} station={station} onPress={handleMarkerPress} />
        ))}
      </MapView>

      <View style={[styles.topBar, { top: insets.top + spacing.sm }]}>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.85}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <ArrowLeft size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.walletChip}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('Wallet')}
        >
          <Wallet size={16} color={colors.accent} />
          <Text style={styles.walletChipText}>
            {formatSom((walletBalance?.amount ?? 0))} so'm
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.85}
          onPress={handleSearch}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Search size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.iconButton}
          activeOpacity={0.85}
          onPress={handleNotifications}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          <Bell size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.supportButton, { bottom: insets.bottom + spacing.xl }]}
        activeOpacity={0.85}
        onPress={handleSupport}
      >
        <Headphones size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={[styles.rightButtonStack, { bottom: insets.bottom + spacing.xl }]}>
        <TouchableOpacity
          style={styles.roundButton}
          activeOpacity={0.85}
          onPress={handleInfo}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <Info size={18} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.roundButton}
          activeOpacity={0.85}
          onPress={handleLocate}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
        >
          <LocateFixed size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <StationDetailSheet
        station={selectedStation}
        onClose={handleClose}
        onStart={handleStart}
        onShowConnectorStatus={setStatusConnector}
      />

      <ConnectorStatusModal
        connector={statusConnector}
        onClose={() => setStatusConnector(null)}
        onBook={
          selectedStation
            ? () => {
                const stationId = selectedStation.id;
                setStatusConnector(null);
                navigation.navigate('NewBooking', { stationId });
              }
            : undefined
        }
        onChooseOther={
          selectedStation?.connectors?.some((c) => c.status === 'available')
            ? () => {
                const station = selectedStation;
                setStatusConnector(null);
                if (station) handleStart(station);
              }
            : undefined
        }
      />

      <ConnectorConnectingOverlay
        visible={!!waitingInfo}
        stage={stage}
        stationName={waitingInfo?.stationName ?? ''}
        connectorLabel={waitingInfo?.connectorLabel}
        powerKw={waitingInfo?.powerKw}
        onCancel={handleCancelWaiting}
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
    topBar: {
      position: 'absolute',
      left: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    walletChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      ...shadow.card,
    },
    walletChipText: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    iconButton: {
      width: 40,
      height: 40,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
    supportButton: {
      position: 'absolute',
      left: spacing.lg,
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
    rightButtonStack: {
      position: 'absolute',
      right: spacing.lg,
      gap: spacing.sm,
    },
    roundButton: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.card,
    },
  });
