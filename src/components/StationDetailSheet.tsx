import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  Share,
  ScrollView,
  PanResponder,
} from 'react-native';
import { MoreVertical, Heart, Share2, AlertCircle, Navigation2 } from 'lucide-react-native';
import { Connector, Station } from '@/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/services/alert';
import { AmenityIcon } from '@/components/AmenityIcon';
import ConnectorRow from '@/components/ConnectorRow';
import { openRouteTo } from '@/services/directions';
import { formatSom } from '@/utils/money';

interface Props {
  station: Station | null;
  onClose: () => void;
  onStart: (station: Station, connector?: Connector) => void;
  /** bo'sh bo'lmagan ulagich bosilganda — holat oynasini ochish */
  onShowConnectorStatus: (connector: Connector) => void;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const statusLabel: Record<Station['status'], string> = {
  available: 'Bo\u02bbsh',
  busy: 'Band',
  offline: 'Ishlamayapti',
};


export default function StationDetailSheet({
  station: stationProp,
  onClose,
  onStart,
  onShowConnectorStatus,
}: Props) {
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
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const dragStartValue = useRef(0);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  // Sheet'ni tepasidan (header) ushlab pastga sudrab yopish — barmoqqa ergashib
  // real-vaqtda harakatlanadi, yetarlicha pastga tushirilsa yoki tez "urib"
  // qo'yib yuborilsa yopiladi, aks holda joyiga qaytadi.
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_evt, gestureState) => gestureState.dy > 4 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx),
      onPanResponderGrant: () => {
        translateY.stopAnimation((value) => {
          dragStartValue.current = value;
        });
      },
      onPanResponderMove: (_evt, gestureState) => {
        translateY.setValue(Math.max(0, dragStartValue.current + gestureState.dy));
      },
      onPanResponderRelease: (_evt, gestureState) => {
        const shouldClose = gestureState.dy > 100 || gestureState.vy > 0.8;
        if (shouldClose) {
          onCloseRef.current();
        } else {
          Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 4 }).start();
      },
    })
  ).current;
  const [menuOpen, setMenuOpen] = useState(false);
  // `station` prop yopilganda darhol `null` bo'lib qoladi — agar shu asosda
  // render qilinsa, pastga tushish animatsiyasi boshlanishi bilanoq komponent
  // unmount bo'lib, effekt umuman ko'rinmay qolar edi. Shuning uchun oxirgi
  // ma'lumot animatsiya tugaguncha shu yerda "ushlab turiladi".
  const [renderedStation, setRenderedStation] = useState<Station | null>(stationProp);
  const favoriteStationIds = useAppStore((s) => s.favoriteStationIds);
  const toggleFavoriteStation = useAppStore((s) => s.toggleFavoriteStation);

  useEffect(() => {
    if (stationProp) {
      setRenderedStation(stationProp);
      Animated.timing(translateY, { toValue: 0, duration: 260, useNativeDriver: true }).start();
    } else {
      Animated.timing(translateY, { toValue: SCREEN_HEIGHT, duration: 260, useNativeDriver: true }).start(() => {
        setRenderedStation(null);
      });
    }
    setMenuOpen(false);
  }, [stationProp]);

  if (!renderedStation) return null;
  const station = renderedStation;

  const isFavorite = favoriteStationIds.includes(station.id);
  const hasDiscount = !!station.originalPricePerKwh && station.originalPricePerKwh > station.pricePerKwh;

  const handleShare = () => {
    setMenuOpen(false);
    Share.share({
      message: `${station.name} — ${station.address}\nVoltMax orqali topdim.`,
    });
  };

  const handleReport = () => {
    setMenuOpen(false);
    // TODO: backend tayyor bo'lgach StationsAPI.reportIssue(station.id) chaqiriladi
    showAlert('Rahmat', 'Muammo haqida xabaringiz qabul qilindi.', undefined, 'success');
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Pressable style={styles.backdrop} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <View {...panResponder.panHandlers}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 30, right: 30 }}
          >
            <View style={styles.handle} />
          </TouchableOpacity>

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{station.name}</Text>
              <Text style={styles.address} numberOfLines={1}>{station.address}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor[station.status] + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor[station.status] }]} />
              <Text style={[styles.statusText, { color: statusColor[station.status] }]}>
                {statusLabel[station.status]}
              </Text>
            </View>
            {/* Marshrut — tashqi navigatorda darhol ochiladi */}
            <TouchableOpacity
              style={styles.routeButton}
              activeOpacity={0.8}
              onPress={() =>
                openRouteTo({
                  latitude: station.latitude,
                  longitude: station.longitude,
                  label: station.name,
                })
              }
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Stansiyaga marshrut qurish"
            >
              <Navigation2 size={17} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.moreButton}
              activeOpacity={0.7}
              onPress={() => setMenuOpen((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MoreVertical size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {menuOpen && (
          <>
            <Pressable style={styles.menuBackdrop} onPress={() => setMenuOpen(false)} />
            <View style={styles.menu}>
              <TouchableOpacity
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => {
                  toggleFavoriteStation(station.id);
                  setMenuOpen(false);
                }}
              >
                <Heart
                  size={18}
                  color={isFavorite ? colors.accent : colors.textSecondary}
                  fill={isFavorite ? colors.accent : 'transparent'}
                />
                <Text style={styles.menuItemText}>
                  {isFavorite ? "Sevimlilardan olib tashlash" : "Sevimlilarga qo'shish"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleShare}>
                <Share2 size={18} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Ulashish</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={handleReport}>
                <AlertCircle size={18} color={colors.textSecondary} />
                <Text style={styles.menuItemText}>Muammo haqida xabar berish</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {station.rating && (
            <View style={styles.ratingRow}>
              <Text style={styles.ratingText}>{'\u2605'} {station.rating}</Text>
            </View>
          )}

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
            <Text style={styles.priceValue}>{formatSom(station.pricePerKwh)} so'm</Text>
            {hasDiscount && (
              <Text style={styles.priceOriginal}>
                {formatSom(station.originalPricePerKwh!)} so'm{' '}
                <Text style={styles.priceUnit}>1 kVt uchun</Text>
              </Text>
            )}
          </View>

          <Text style={styles.sectionLabel}>Ulagichlar</Text>
          {station.connectors?.map((connector) => (
            <ConnectorRow
              key={connector.id}
              connector={connector}
              onSelect={(c) => onStart(station, c)}
              onShowStatus={onShowConnectorStatus}
            />
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: SCREEN_HEIGHT * 0.78,
    backgroundColor: colors.bgSecondary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.size.lg,
    fontFamily: typography.fontFamily.semibold,
  },
  address: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    gap: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: typography.size.xs,
    fontFamily: typography.fontFamily.medium,
  },
  routeButton: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  moreButton: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  menuBackdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  menu: {
    position: 'absolute',
    top: 44,
    right: spacing.lg,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.xs,
    minWidth: 220,
    zIndex: 10,
    elevation: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  menuItemText: {
    color: colors.textPrimary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.medium,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    paddingBottom: spacing.sm,
  },
  ratingRow: {
    marginBottom: spacing.sm,
  },
  ratingText: {
    color: colors.textSecondary,
    fontSize: typography.size.sm,
    fontFamily: typography.fontFamily.medium,
  },
  amenityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    ...shadow.sm,
    marginBottom: spacing.md,
  },
  amenityIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSecondary,
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
  },
  priceCard: {
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.lg,
    ...shadow.sm,
  },
  priceValue: {
    color: colors.accent,
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
    backgroundColor: colors.bgElevated,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    ...shadow.sm,
  },
  connectorLetterBadge: {
    width: 32,
    height: 32,
    borderRadius: radius.sm,
    backgroundColor: colors.bgSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  connectorLetterText: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.bold,
    fontSize: typography.size.sm,
  },
  connectorTypeIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
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
  });
