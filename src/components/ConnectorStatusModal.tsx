import React, { useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Zap, ParkingCircle, PlugZap, Clock, Coins, AlertTriangle } from 'lucide-react-native';
import { Connector } from '@/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import ProgressRing from '@/components/ProgressRing';
import PrimaryButton from '@/components/PrimaryButton';
import { formatSom } from '@/utils/money';

// Bo'sh BO'LMAGAN ulagich bosilganda chiqadigan tushuntirish oynasi.
// Uchta holat:
//   busy    — zaryadlanmoqda: animatsiyali foiz halqasi + qachon bo'shashi
//   parking — zaryadlash tugagan, avtomobil hali ulagichda: pullik parkovka
//   offline — ulagich ishlamayapti: sababi va boshqa ulagichga yo'naltirish
// Holat ma'lumot yangilanganda (WebSocket) jonli o'zgaradi — halqa qayta animatsiyalanadi.

export type ConnectorStatusVariant = 'busy' | 'parking' | 'reserved' | 'offline';

export function resolveConnectorVariant(connector: Connector): ConnectorStatusVariant {
  if (connector.status === 'offline') return 'offline';
  if (connector.status === 'reserved') return 'reserved';
  if (connector.parkingMode) return 'parking';
  return 'busy';
}

interface Props {
  connector: Connector | null;
  onClose: () => void;
  /** "Bron qilish" — band ulagich uchun */
  onBook?: () => void;
  /** "Boshqa ulagichni tanlash" — bo'sh ulagich mavjud bo'lsa */
  onChooseOther?: () => void;
}

/** Ishlamayotgan ulagich ikonkasi — sekin chayqaladi (diqqatni tortadi, lekin bezovta qilmaydi) */
function ShakingIcon({ children }: { children: React.ReactNode }) {
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 90, useNativeDriver: true }),
        // Har chayqalish orasida uzoq pauza — takrorlanish bezovta qilmasligi uchun
        Animated.delay(2200),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shake]);

  const rotate = shake.interpolate({ inputRange: [-1, 1], outputRange: ['-7deg', '7deg'] });
  return <Animated.View style={{ transform: [{ rotate }] }}>{children}</Animated.View>;
}

/** Halqa/ikonka atrofida pulslanuvchi halo */
function PulseHalo({ color, size }: { color: string; size: number }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 1600,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1.35] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: 'absolute',
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        opacity,
        transform: [{ scale }],
      }}
    />
  );
}

export default function ConnectorStatusModal({
  connector,
  onClose,
  onBook,
  onChooseOther,
}: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  // connector null bo'lganda ham Modal render bo'ladi (visible=false) —
  // yopilish animatsiyasi to'g'ri ishlashi uchun oxirgi qiymat eslab qolinadi.
  const lastConnector = useRef<Connector | null>(null);
  if (connector) lastConnector.current = connector;
  const shown = connector ?? lastConnector.current;

  const variant = shown ? resolveConnectorVariant(shown) : 'busy';
  const percent = shown?.chargingPercent ?? 0;

  const accent =
    variant === 'offline'
      ? colors.statusOffline
      : variant === 'parking'
        ? colors.statusBusy
        : colors.primary;

  const ringColors: readonly [string, string] =
    variant === 'parking' ? [colors.statusBusy, '#F7CE7A'] : colors.gradientPrimary;

  const parkingCost =
    (shown?.parkingFeePerMin ?? 0) * (shown?.parkingMinutes ?? 0);

  return (
    <Modal
      visible={!!connector}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + spacing.md }]}>
        <View style={styles.grabber} />

        <View style={styles.headerRow}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Ulagich {shown?.label ?? '—'}</Text>
            <Text style={styles.subtitle}>
              {shown?.type} • {shown?.powerKw} kVt gacha
            </Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Vizual holat */}
        <View style={styles.visual}>
          {variant === 'offline' ? (
            <>
              <PulseHalo color={colors.statusOffline} size={132} />
              <View style={[styles.offlineCircle, { borderColor: colors.statusOffline }]}>
                <ShakingIcon>
                  <PlugZap size={44} color={colors.statusOffline} />
                </ShakingIcon>
              </View>
            </>
          ) : (
            <>
              <PulseHalo color={accent} size={148} />
              <ProgressRing
                percent={variant === 'parking' ? 100 : percent}
                colors={ringColors}
                size={140}
                strokeWidth={11}
              >
                {variant === 'parking' ? (
                  <>
                    <ParkingCircle size={26} color={colors.statusBusy} />
                    <Text style={[styles.ringCaption, { color: colors.statusBusy }]}>
                      Parkovka
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.ringPercent}>{percent}%</Text>
                    <View style={styles.ringLabelRow}>
                      <Zap size={12} color={colors.primary} fill={colors.primary} />
                      <Text style={styles.ringCaption}>zaryadda</Text>
                    </View>
                  </>
                )}
              </ProgressRing>
            </>
          )}
        </View>

        {/* Sarlavha va tushuntirish */}
        <Text style={[styles.statusTitle, { color: accent }]}>
          {variant === 'offline'
            ? 'Ulagich ishlamayapti'
            : variant === 'reserved'
              ? 'Ulagich bron qilingan'
              : variant === 'parking'
                ? 'Pullik parkovka rejimi'
                : 'Ulagich band'}
        </Text>
        <Text style={styles.statusBody}>
          {variant === 'offline'
            ? shown?.offlineReason ??
              "Bu ulagich vaqtincha xizmatdan chiqarilgan. Stansiyaning boshqa ulagichini tanlang yoki keyinroq urinib ko'ring."
            : variant === 'reserved'
              ? "Bu ulagich bron bo'yicha ushlab turilgan. Bron muddati tugagach yoki bekor qilinsa u yana bo'shaydi."
              : variant === 'parking'
                ? "Zaryadlash tugagan, lekin avtomobil hali ulagichni bo'shatmagan. Shu sabab daqiqalik parkovka to'lovi hisoblanmoqda."
                : "Hozir boshqa foydalanuvchi zaryadlanmoqda. Ulagich bo'shashi bilan holati yangilanadi."}
        </Text>

        {/* Tafsilotlar */}
        {variant === 'parking' && (
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelWrap}>
                <Coins size={15} color={colors.textMuted} />
                <Text style={styles.detailLabel}>Parkovka tarifi</Text>
              </View>
              <Text style={styles.detailValue}>
                {formatSom((shown?.parkingFeePerMin ?? 0))} so'm/daq
              </Text>
            </View>
            {!!shown?.parkingMinutes && (
              <View style={[styles.detailRow, styles.detailRowDivided]}>
                <View style={styles.detailLabelWrap}>
                  <Clock size={15} color={colors.textMuted} />
                  <Text style={styles.detailLabel}>Davom etmoqda</Text>
                </View>
                <Text style={styles.detailValue}>
                  {shown.parkingMinutes} daq • {formatSom(parkingCost)} so'm
                </Text>
              </View>
            )}
          </View>
        )}

        {variant === 'busy' && shown?.estimatedFreeInMinutes != null && (
          <View style={styles.detailCard}>
            <View style={styles.detailRow}>
              <View style={styles.detailLabelWrap}>
                <Clock size={15} color={colors.textMuted} />
                <Text style={styles.detailLabel}>Taxminan boʻshaydi</Text>
              </View>
              <Text style={styles.detailValue}>
                {shown.estimatedFreeInMinutes} daqiqadan soʻng
              </Text>
            </View>
          </View>
        )}

        {variant === 'offline' && (
          <View style={[styles.detailCard, styles.warningCard]}>
            <AlertTriangle size={16} color={colors.statusBusy} />
            <Text style={styles.warningText}>
              Muammo takrorlansa, stansiya sahifasidagi sharhlar orqali bizga xabar bering.
            </Text>
          </View>
        )}

        {/* Amallar */}
        <View style={styles.actions}>
          {variant === 'busy' && !!onBook && (
            <PrimaryButton label="Bron qilish" onPress={onBook} style={styles.actionButton} />
          )}
          {!!onChooseOther && (
            <PrimaryButton
              label="Boshqa ulagich"
              variant="outline"
              onPress={onChooseOther}
              style={styles.actionButton}
            />
          )}
          {variant !== 'busy' && !onChooseOther && (
            <PrimaryButton
              label="Yopish"
              variant="outline"
              onPress={onClose}
              style={styles.actionButton}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.45)',
    },
    sheet: {
      backgroundColor: colors.bgSecondary,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderTopWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      ...shadow.float,
    },
    grabber: {
      alignSelf: 'center',
      width: 42,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    headerText: {
      flex: 1,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    visual: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.md,
      height: 156,
    },
    offlineCircle: {
      width: 132,
      height: 132,
      borderRadius: 66,
      borderWidth: 2,
      borderStyle: 'dashed',
      alignItems: 'center',
      justifyContent: 'center',
    },
    ringPercent: {
      color: colors.textPrimary,
      fontSize: typography.size.xxl,
      fontFamily: typography.fontFamily.bold,
    },
    ringLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    ringCaption: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      marginTop: 2,
    },
    statusTitle: {
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
      textAlign: 'center',
    },
    statusBody: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      lineHeight: typography.size.sm * typography.lineHeight.normal,
      textAlign: 'center',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.sm,
    },
    detailCard: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      marginTop: spacing.lg,
    },
    detailRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: spacing.md - 2,
    },
    detailRowDivided: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    detailLabelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    detailLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
    },
    detailValue: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    warningCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md - 2,
    },
    warningText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      lineHeight: typography.size.xs * typography.lineHeight.normal,
    },
    actions: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    actionButton: {
      flex: 1,
    },
  });
