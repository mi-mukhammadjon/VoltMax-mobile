import React, { useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, MoreVertical, Navigation2 } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { colors, typography, spacing, radius } from '@/theme';
import { mockStations } from '@/data/mockStations';
import { Connector, ConnectorStatus } from '@/types';
import { AmenityIcon } from '@/components/AmenityIcon';

// Ekran 3: Stansiya detali — Tesla-uslubidagi premium versiya
// Reference: foydalanuvchi yuborgan skrinshot (mukofot bloki, narx kartasi,
// ulagichlar ro'yxati holat bilan, "Ketamiz" CTA tugmasi)

type Props = NativeStackScreenProps<RootStackParamList, 'StationDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'StationDetail'>;

const connectorStatusMeta: Record<ConnectorStatus, { label: string; color: string }> = {
  available: { label: 'Bo\u02bbsh', color: colors.mintGreen },
  charging: { label: 'Zaryadlanmoqda', color: colors.electricBlue },
  offline: { label: 'Ishlamayapti', color: colors.statusOffline },
};

function ConnectorRow({ connector, onPress }: { connector: Connector; onPress: () => void }) {
  const meta = connectorStatusMeta[connector.status];
  return (
    <TouchableOpacity style={styles.connectorRow} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.connectorLetterBadge}>
        <Text style={styles.connectorLetterText}>{connector.label}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.connectorType}>
          {connector.type} {connector.label}
        </Text>
        <Text style={[styles.connectorStatus, { color: meta.color }]}>
          {connector.status === 'charging' && connector.chargingPercent
            ? `${meta.label}: ${connector.chargingPercent}%`
            : meta.label}
        </Text>
      </View>
      <Text style={styles.connectorPower}>{connector.powerKw} kVt</Text>
    </TouchableOpacity>
  );
}

export default function StationDetailScreen({ route }: Props) {
  const navigation = useNavigation<NavProp>();
  const { stationId } = route.params;

  const station = useMemo(
    () => mockStations.find((s) => s.id === stationId) ?? mockStations[0],
    [stationId]
  );

  const hasDiscount = !!station.originalPricePerKwh && station.originalPricePerKwh > station.pricePerKwh;
  const availableConnector = station.connectors?.find((c) => c.status === 'available');

  const handleConnectorPress = (connector: Connector) => {
    if (connector.status !== 'available') return;
    // TODO: SessionsAPI.start(station.id, connector.id) chaqiriladi
    const sessionId = `mock-session-${station.id}-${connector.id}`;
    navigation.navigate('ChargingSession', { sessionId });
  };

  const handleGo = () => {
    if (availableConnector) {
      handleConnectorPress(availableConnector);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconButton}>
          <MoreVertical size={20} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>{station.name}</Text>
      <Text style={styles.subtitle}>{station.address}</Text>

      {station.amenities?.map((amenity, idx) => (
        <View key={idx} style={styles.amenityCard}>
          <View style={styles.amenityIconWrap}>
            <AmenityIcon icon={amenity.icon} />
          </View>
          <View>
            <Text style={styles.amenityTitle}>{amenity.title}</Text>
            <Text style={styles.amenitySubtitle}>{amenity.subtitle}</Text>
          </View>
        </View>
      ))}

      <Text style={styles.sectionLabel}>Narxlar</Text>
      <View style={styles.priceCard}>
        <Text style={styles.priceValue}>
          {station.pricePerKwh.toLocaleString('uz-UZ')} so'm
        </Text>
        {hasDiscount && (
          <Text style={styles.priceOriginal}>
            {station.originalPricePerKwh!.toLocaleString('uz-UZ')} so'm{' '}
            <Text style={styles.priceUnit}>1 kVt uchun</Text>
          </Text>
        )}
      </View>

      <Text style={styles.sectionLabel}>Ulagichlar</Text>
      {station.connectors?.map((connector) => (
        <ConnectorRow
          key={connector.id}
          connector={connector}
          onPress={() => handleConnectorPress(connector)}
        />
      ))}

      <TouchableOpacity
        style={[styles.ctaButton, !availableConnector && styles.ctaButtonDisabled]}
        activeOpacity={0.85}
        disabled={!availableConnector}
        onPress={handleGo}
      >
        <Navigation2 size={18} color={colors.textPrimary} />
        <Text style={styles.ctaText}>Ketamiz</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.size.xxl,
    fontFamily: typography.fontFamily.bold,
    lineHeight: 34,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  amenityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  amenityTitle: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  amenitySubtitle: {
    color: colors.textMuted,
    fontSize: typography.size.xs,
    marginTop: 1,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.medium,
    marginBottom: spacing.sm,
    marginTop: spacing.xs,
  },
  priceCard: {
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceValue: {
    color: colors.mintGreen,
    fontSize: typography.size.xl,
    fontFamily: typography.fontFamily.bold,
  },
  priceOriginal: {
    color: colors.textMuted,
    fontSize: typography.size.sm,
    textDecorationLine: 'line-through',
    marginTop: 2,
  },
  priceUnit: {
    textDecorationLine: 'none',
    color: colors.textMuted,
  },
  connectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  connectorLetterBadge: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLetterText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.bold,
  },
  connectorType: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.semibold,
  },
  connectorStatus: {
    fontSize: typography.size.xs,
    marginTop: 1,
    fontFamily: typography.fontFamily.medium,
  },
  connectorPower: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.electricBlue,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.bgElevated,
  },
  ctaText: {
    color: colors.textPrimary,
    fontSize: typography.size.base,
    fontFamily: typography.fontFamily.semibold,
  },
});
