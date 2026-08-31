import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Heart, Navigation2, Star, Zap, Clock } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { StationsAPI, ReviewsAPI } from '@/services/api';
import {
  startChargingSession,
  ChargerTimeoutError,
  ChargingCancelledError,
  ChargingStage,
} from '@/services/chargeSession';
import { subscribeToStationUpdates } from '@/services/liveUpdates';
import { Connector, Station, StationReview } from '@/types';
import { AmenityIcon } from '@/components/AmenityIcon';
import ConnectorConnectingOverlay from '@/components/ConnectorConnectingOverlay';
import ConnectorStatusModal from '@/components/ConnectorStatusModal';
import ConnectorRow from '@/components/ConnectorRow';
import UnderlineTabs from '@/components/UnderlineTabs';
import PrimaryButton from '@/components/PrimaryButton';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/services/alert';
import { openRouteTo } from '@/services/directions';
import { formatSom } from '@/utils/money';

// Ekran 3: Stansiya detali — Prime EV dizayn tili
// Tepada hero rasm, ustida suzuvchi tugmalar; sarlavha bloki; chiziqli tablar
// (Ulagichlar / Tafsilotlar / Sharhlar); pastda mahkamlangan CTA paneli.

type Props = NativeStackScreenProps<RootStackParamList, 'StationDetail'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'StationDetail'>;

type TabValue = 'connectors' | 'details' | 'reviews';

const TABS = [
  { value: 'connectors' as const, label: 'Ulagichlar' },
  { value: 'details' as const, label: 'Tafsilotlar' },
  { value: 'reviews' as const, label: 'Sharhlar' },
];

function RatingSummary({
  reviews,
  average,
  styles,
  colors,
}: {
  reviews: StationReview[];
  average: number;
  styles: ReturnType<typeof createStyles>;
  colors: ColorPalette;
}) {
  const total = reviews.length;
  return (
    <View style={styles.ratingSummary}>
      <View style={styles.ratingScoreBlock}>
        <Text style={styles.ratingScore}>{average ? average.toFixed(1) : '—'}</Text>
        <View style={styles.ratingStars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Star
              key={n}
              size={12}
              color="#F5B942"
              fill={n <= Math.round(average) ? '#F5B942' : 'transparent'}
            />
          ))}
        </View>
        <Text style={styles.ratingCount}>{total} ta sharh</Text>
      </View>

      <View style={styles.ratingBars}>
        {[5, 4, 3, 2, 1].map((star) => {
          const count = reviews.filter((r) => r.rating === star).length;
          const pct = total ? Math.round((count / total) * 100) : 0;
          return (
            <View key={star} style={styles.ratingBarRow}>
              <Text style={styles.ratingBarLabel}>{star}</Text>
              <View style={styles.ratingBarTrack}>
                <View style={[styles.ratingBarFill, { width: `${pct}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

export default function StationDetailScreen({ route }: Props) {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const setActiveSession = useAppStore((s) => s.setActiveSession);
  const stationFromStore = useAppStore((s) => s.stations.find((st) => st.id === route.params.stationId));
  const toggleFavoriteStation = useAppStore((s) => s.toggleFavoriteStation);
  const isFavorite = useAppStore((s) => s.favoriteStationIds.includes(route.params.stationId));
  const { stationId } = route.params;

  const [fetchedStation, setFetchedStation] = useState<Station | null>(null);
  const [starting, setStarting] = useState(false);
  const [waitingInfo, setWaitingInfo] = useState<{ stationName: string; connectorLabel?: string; powerKw?: number } | null>(null);
  const [stage, setStage] = useState<ChargingStage>('requesting');
  // Bo'sh bo'lmagan ulagich bosilganda ochiladigan tushuntirish oynasi
  const [statusConnector, setStatusConnector] = useState<Connector | null>(null);
  const cancelStartRef = useRef(false);
  const station = stationFromStore ?? fetchedStation;

  const [tab, setTab] = useState<TabValue>('connectors');
  const [reviews, setReviews] = useState<StationReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [myRating, setMyRating] = useState(5);
  const [myComment, setMyComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setReviewsLoading(true);
    ReviewsAPI.list(stationId)
      .then((res) => setReviews(res.data.results ?? res.data))
      .catch(() => {})
      .finally(() => setReviewsLoading(false));
  }, [stationId]);

  useEffect(() => {
    // Stansiya global store'da bo'lsa (odatiy holat — MapScreen'dan kelingan),
    // uning ulagich holati MapScreen'ning WebSocket obunasi orqali allaqachon
    // real-vaqt yangilanadi. Store'da yo'q bo'lsa (masalan deep link), shu
    // ekranning o'zi to'g'ridan-to'g'ri obuna bo'ladi.
    if (stationFromStore) return;
    const fetchStation = () => {
      StationsAPI.getById(stationId)
        .then((res) => setFetchedStation(res.data))
        .catch(() => showAlert('Xatolik', "Stansiya ma'lumotini yuklab bo'lmadi", undefined, 'error'));
    };
    fetchStation();
    const unsubscribe = subscribeToStationUpdates(fetchStation);
    return unsubscribe;
  }, [stationId, stationFromStore]);

  const handleSubmitReview = async () => {
    if (submittingReview) return;
    setSubmittingReview(true);
    try {
      await ReviewsAPI.create(stationId, myRating, myComment.trim());
      setMyComment('');
      const res = await ReviewsAPI.list(stationId);
      setReviews(res.data.results ?? res.data);
      showAlert('Rahmat!', 'Sharhingiz saqlandi.', undefined, 'success');
    } catch (err) {
      showAlert('Xatolik', "Sharhni yuborib bo'lmadi", undefined, 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const hasDiscount = !!station?.originalPricePerKwh && station.originalPricePerKwh > station.pricePerKwh;
  const availableConnector = station?.connectors?.find((c) => c.status === 'available');

  const handleConnectorPress = async (connector: Connector) => {
    if (connector.status !== 'available' || !station || starting) return;
    setStarting(true);
    cancelStartRef.current = false;
    setStage('requesting');
    setWaitingInfo({
      stationName: station.name,
      connectorLabel: connector.label,
      powerKw: connector.powerKw,
    });
    try {
      const session = await startChargingSession(station.id, connector.id, {
        onStage: setStage,
        cancelRef: cancelStartRef,
      });
      setActiveSession(session);
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
  };

  const handleCancelWaiting = () => {
    cancelStartRef.current = true;
  };

  // "Ketamiz" — stansiyaga marshrut quradi va tashqi navigatorda darhol ochadi.
  // (Zaryadlashni boshlash alohida CTA'da — ilgari bu tugma xato ravishda
  // marshrut o'rniga sessiya boshlab yuborardi.)
  const handleGo = () => {
    if (!station) return;
    openRouteTo({
      latitude: station.latitude,
      longitude: station.longitude,
      label: station.name,
    });
  };

  const handleStartFromFooter = () => {
    if (availableConnector) {
      handleConnectorPress(availableConnector);
    }
  };

  if (!station) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const averageRating = station.rating ?? 0;

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero rasm — mavjud bo'lmasa brend rangidagi o'rin egallovchi blok */}
        <View style={styles.hero}>
          {station.photoUrl ? (
            <Image source={{ uri: station.photoUrl }} style={styles.heroImage} resizeMode="cover" />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Zap size={44} color={colors.primary} />
            </View>
          )}

          <TouchableOpacity
            style={[styles.heroButton, { top: insets.top + spacing.sm, left: spacing.lg }]}
            activeOpacity={0.85}
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <ArrowLeft size={20} color={colors.textPrimary} />
          </TouchableOpacity>

          {/* Sevimlilarga qo'shish — Sevimli tabidagi ro'yxatni to'ldiradi */}
          <TouchableOpacity
            style={[styles.heroButton, { top: insets.top + spacing.sm, right: spacing.lg }]}
            activeOpacity={0.85}
            onPress={() => toggleFavoriteStation(station.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={20}
              color={isFavorite ? colors.statusError : colors.textPrimary}
              fill={isFavorite ? colors.statusError : 'transparent'}
            />
          </TouchableOpacity>
        </View>

        {/* Sarlavha bloki */}
        <View style={styles.titleBlock}>
          <Text style={styles.title}>{station.name}</Text>
          <Text style={styles.subtitle}>{station.address}</Text>

          <View style={styles.badgeRow}>
            {!!averageRating && (
              <View style={styles.badgeItem}>
                <Star size={13} color="#F5B942" fill="#F5B942" />
                <Text style={styles.badgeText}>{averageRating}</Text>
              </View>
            )}
            <View style={styles.badgeItem}>
              <View
                style={[
                  styles.statusDot,
                  { backgroundColor: availableConnector ? colors.statusAvailable : colors.statusError },
                ]}
              />
              <Text
                style={[
                  styles.badgeText,
                  { color: availableConnector ? colors.statusAvailable : colors.statusError },
                ]}
              >
                {availableConnector ? "Bo'sh" : 'Band'}
              </Text>
            </View>
            <View style={styles.badgeItem}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={styles.badgeMuted}>24 soat</Text>
            </View>
          </View>
        </View>

        <View style={styles.tabsWrap}>
          <UnderlineTabs tabs={TABS} value={tab} onChange={setTab} />
        </View>

        <View style={styles.tabContent}>
          {tab === 'connectors' && (
            <>
              <Text style={styles.hint}>
                Zaryadlashni boshlash uchun bo'sh ulagichni tanlang. Band yoki ishlamayotgan ulagich ustiga bosib, sababini ko'rishingiz mumkin.
              </Text>
              {station.connectors?.map((connector) => (
                <ConnectorRow
                  key={connector.id}
                  connector={connector}
                  onSelect={handleConnectorPress}
                  onShowStatus={setStatusConnector}
                />
              ))}
            </>
          )}

          {tab === 'details' && (
            <>
              <View style={styles.priceCard}>
                <View>
                  <Text style={styles.priceLabel}>1 kVt-soat narxi</Text>
                  <View style={styles.priceRow}>
                    <Text style={styles.priceValue}>
                      {formatSom(station.pricePerKwh)} so'm
                    </Text>
                    {hasDiscount && (
                      <Text style={styles.priceOriginal}>
                        {formatSom(station.originalPricePerKwh!)}
                      </Text>
                    )}
                  </View>
                </View>
                <View style={styles.powerPill}>
                  <Text style={styles.powerPillText}>{station.powerKw} kVt</Text>
                </View>
              </View>

              <Text style={styles.sectionLabel}>Qulayliklar</Text>
              {station.amenities?.length ? (
                <View style={styles.amenityGrid}>
                  {station.amenities.map((amenity, idx) => (
                    <View key={idx} style={styles.amenityChip}>
                      <AmenityIcon icon={amenity.icon} size={16} />
                      <Text style={styles.amenityChipText}>{amenity.title}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.emptyText}>Qulayliklar ko'rsatilmagan</Text>
              )}
            </>
          )}

          {tab === 'reviews' && (
            <>
              {reviewsLoading ? (
                <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.md }} />
              ) : (
                <>
                  <RatingSummary
                    reviews={reviews}
                    average={averageRating}
                    styles={styles}
                    colors={colors}
                  />

                  <View style={styles.reviewFormCard}>
                    <Text style={styles.sectionLabel}>Sharh qoldirish</Text>
                    <View style={styles.starPicker}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <TouchableOpacity
                          key={n}
                          onPress={() => setMyRating(n)}
                          hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
                        >
                          <Star
                            size={26}
                            color="#F5B942"
                            fill={n <= myRating ? '#F5B942' : 'transparent'}
                          />
                        </TouchableOpacity>
                      ))}
                    </View>
                    <TextInput
                      style={styles.reviewInput}
                      placeholder="Fikringizni yozing (ixtiyoriy)..."
                      placeholderTextColor={colors.textMuted}
                      value={myComment}
                      onChangeText={setMyComment}
                      multiline
                    />
                    <PrimaryButton
                      label="Yuborish"
                      onPress={handleSubmitReview}
                      loading={submittingReview}
                    />
                  </View>

                  {reviews.length === 0 ? (
                    <Text style={styles.emptyText}>Hozircha sharhlar yo'q. Birinchi bo'ling!</Text>
                  ) : (
                    reviews.map((review) => (
                      <View key={review.id} style={styles.reviewCard}>
                        <View style={styles.reviewCardHeader}>
                          <Text style={styles.reviewAuthor}>{review.userName}</Text>
                          <View style={styles.ratingStars}>
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star
                                key={n}
                                size={12}
                                color="#F5B942"
                                fill={n <= review.rating ? '#F5B942' : 'transparent'}
                              />
                            ))}
                          </View>
                        </View>
                        {!!review.comment && (
                          <Text style={styles.reviewComment}>{review.comment}</Text>
                        )}
                      </View>
                    ))
                  )}
                </>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {/* Pastda mahkamlangan CTA paneli */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <TouchableOpacity
          style={styles.routeButton}
          activeOpacity={0.85}
          onPress={handleGo}
          accessibilityLabel="Stansiyaga marshrut qurish"
        >
          <Navigation2 size={19} color={colors.primary} />
        </TouchableOpacity>
        <PrimaryButton
          label="Band qilish"
          variant="outline"
          style={{ flex: 1 }}
          onPress={() => navigation.navigate('NewBooking', { stationId: station.id })}
        />
        <PrimaryButton
          label="Zaryadlash"
          style={{ flex: 1 }}
          disabled={!availableConnector}
          onPress={handleStartFromFooter}
        />
      </View>

      <ConnectorConnectingOverlay
        visible={!!waitingInfo}
        stage={stage}
        stationName={waitingInfo?.stationName ?? ''}
        connectorLabel={waitingInfo?.connectorLabel}
        powerKw={waitingInfo?.powerKw}
        onCancel={handleCancelWaiting}
      />

      <ConnectorStatusModal
        connector={statusConnector}
        onClose={() => setStatusConnector(null)}
        onBook={() => {
          setStatusConnector(null);
          navigation.navigate('NewBooking', { stationId: station.id });
        }}
        onChooseOther={
          availableConnector
            ? () => {
                const target = availableConnector;
                setStatusConnector(null);
                handleConnectorPress(target);
              }
            : undefined
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
    scrollContent: {
      paddingBottom: spacing.xl,
    },

    // Hero
    hero: {
      height: 230,
      backgroundColor: colors.bgElevated,
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    heroPlaceholder: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySoft,
    },
    routeButton: {
      width: 50,
      height: 50,
      borderRadius: radius.btn,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroButton: {
      position: 'absolute',
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSecondary,
      alignItems: 'center',
      justifyContent: 'center',
      ...shadow.float,
    },

    // Sarlavha bloki
    titleBlock: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 3,
    },
    badgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    badgeItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    badgeText: {
      color: colors.textPrimary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    badgeMuted: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },

    tabsWrap: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xs,
    },
    tabContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
    },
    hint: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginBottom: spacing.sm,
    },
    sectionLabel: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
      marginBottom: spacing.sm,
      marginTop: spacing.xs,
    },
    emptyText: {
      color: colors.textMuted,
      fontSize: typography.size.sm,
      textAlign: 'center',
      marginTop: spacing.md,
    },

    // Ulagichlar
    connectorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.card,
    },
    connectorIconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectorTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    connectorMeta: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    connectorTypeBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgElevated,
    },
    connectorTypeText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },

    // Tafsilotlar
    priceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    priceLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
    },
    priceRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: 2,
    },
    priceValue: {
      color: colors.primary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
    },
    priceOriginal: {
      color: colors.textMuted,
      fontSize: typography.size.sm,
      textDecorationLine: 'line-through',
    },
    powerPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
    },
    powerPillText: {
      color: colors.primary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.bold,
    },
    amenityGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
    },
    amenityChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgSecondary,
    },
    amenityChipText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },

    // Sharhlar
    ratingSummary: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
      marginBottom: spacing.md,
    },
    ratingScoreBlock: {
      alignItems: 'center',
    },
    ratingScore: {
      color: colors.primary,
      fontSize: typography.size.xxl,
      fontFamily: typography.fontFamily.bold,
    },
    ratingStars: {
      flexDirection: 'row',
      gap: 2,
      marginTop: 2,
    },
    ratingCount: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 3,
    },
    ratingBars: {
      flex: 1,
      gap: 4,
    },
    ratingBarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    ratingBarLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      width: 8,
    },
    ratingBarTrack: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
    },
    ratingBarFill: {
      height: '100%',
      borderRadius: 3,
      backgroundColor: colors.primary,
    },
    reviewFormCard: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      ...shadow.card,
    },
    starPicker: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    reviewInput: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      backgroundColor: colors.bgElevated,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      minHeight: 72,
      textAlignVertical: 'top',
      marginBottom: spacing.md,
    },
    reviewCard: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.card,
    },
    reviewCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 4,
    },
    reviewAuthor: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    reviewComment: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
    },

    // Pastki CTA paneli
    footer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgPrimary,
    },
  });
