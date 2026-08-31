import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X, Plug, Check, Radio, Send, Zap } from 'lucide-react-native';
import { ChargingStage } from '@/services/chargeSession';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import AnimatedStatusCircle from './AnimatedStatusCircle';

// Foydalanuvchi bo'sh ulagichni bosgandan keyin ko'rsatiladigan ekran.
// Maqsad — "nimadir yuklanmoqda" o'rniga jarayonning AYNAN qaysi bosqichda
// turganini ko'rsatish: so'rov → stansiya bilan aloqa → ulagichni ulash → start.

const STEPS: { stage: ChargingStage; title: string; hint: string; icon: typeof Send }[] = [
  {
    stage: 'requesting',
    title: 'Soʻrov yuborilmoqda',
    hint: 'Serverga zaryadlash soʻrovi joʻnatilmoqda',
    icon: Send,
  },
  {
    stage: 'contacting',
    title: 'Stansiya bilan bogʻlanilmoqda',
    hint: 'Zaryadlash qurilmasiga buyruq yuborildi',
    icon: Radio,
  },
  {
    stage: 'awaiting_plug',
    title: 'Ulagichni avtomobilga ulang',
    hint: 'Qurilma ulanishni kutmoqda',
    icon: Plug,
  },
  {
    stage: 'started',
    title: 'Zaryadlash boshlandi',
    hint: 'Sessiya ochildi, oʻtkazilmoqda',
    icon: Zap,
  },
];

interface Props {
  visible: boolean;
  stage: ChargingStage;
  stationName: string;
  connectorLabel?: string;
  powerKw?: number;
  /** charger javobini kutish uchun ajratilgan vaqt (soniya) — sanoq shu vaqtdan teskari ketadi */
  timeoutSeconds?: number;
  onCancel: () => void;
}

export default function ConnectorConnectingOverlay({
  visible,
  stage,
  stationName,
  connectorLabel,
  powerKw,
  timeoutSeconds = 30,
  onCancel,
}: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const activeIndex = STEPS.findIndex((s) => s.stage === stage);
  const ActiveIcon = STEPS[Math.max(activeIndex, 0)].icon;

  // "Ulagichni ulang" bosqichida foydalanuvchiga qancha vaqt qolganini ko'rsatamiz
  const [secondsLeft, setSecondsLeft] = useState(timeoutSeconds);
  useEffect(() => {
    if (!visible || stage !== 'awaiting_plug') {
      setSecondsLeft(timeoutSeconds);
      return;
    }
    const timer = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(timer);
  }, [visible, stage, timeoutSeconds]);

  // Bosqichlar chizig'i — yangi bosqichga o'tganda silliq to'ladi
  const lineProgress = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(lineProgress, {
      toValue: Math.max(activeIndex, 0) / (STEPS.length - 1),
      duration: 450,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [activeIndex, lineProgress]);

  const lineWidth = lineProgress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.container}>
        <TouchableOpacity
          style={[styles.closeButton, { top: insets.top + spacing.sm }]}
          activeOpacity={0.8}
          onPress={onCancel}
        >
          <X size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <View style={styles.connectorBadge}>
            <Text style={styles.connectorBadgeText}>{connectorLabel ?? '—'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.stationName} numberOfLines={1}>
              {stationName}
            </Text>
            <Text style={styles.connectorSubtitle}>
              Ulagich: {connectorLabel ?? '—'} {powerKw ? `• ${powerKw} kVt` : ''}
            </Text>
          </View>
        </View>

        <View style={styles.center}>
          <AnimatedStatusCircle
            icon={<ActiveIcon size={38} color="#FFFFFF" />}
            gradientColors={colors.gradientPrimary}
          />
          <Text style={styles.title}>{STEPS[Math.max(activeIndex, 0)].title}</Text>
          <Text style={styles.subtitle}>
            {stage === 'awaiting_plug'
              ? `${connectorLabel ?? ''} ulagichni avtomobilingizga ulang — ${secondsLeft} s`
              : STEPS[Math.max(activeIndex, 0)].hint}
          </Text>

          <View style={styles.lineTrack}>
            <Animated.View style={[styles.lineFill, { width: lineWidth }]} />
          </View>
        </View>

        {/* Bosqichlar ro'yxati — bajarilgan / joriy / kutilayotgan */}
        <View style={styles.steps}>
          {STEPS.map((step, idx) => {
            const done = idx < activeIndex;
            const active = idx === activeIndex;
            return (
              <View key={step.stage} style={styles.stepRow}>
                <View
                  style={[
                    styles.stepDot,
                    done && styles.stepDotDone,
                    active && styles.stepDotActive,
                  ]}
                >
                  {done ? (
                    <Check size={13} color="#FFFFFF" />
                  ) : active ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <View style={styles.stepDotIdle} />
                  )}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    (done || active) && styles.stepLabelDone,
                    active && styles.stepLabelActive,
                  ]}
                >
                  {step.title}
                </Text>
              </View>
            );
          })}
        </View>

        <View style={[styles.ctaWrap, { paddingBottom: insets.bottom + spacing.md }]}>
          <TouchableOpacity style={styles.cancelButton} activeOpacity={0.8} onPress={onCancel}>
            <Text style={styles.cancelText}>Bekor qilish</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
      padding: spacing.lg,
    },
    closeButton: {
      position: 'absolute',
      right: spacing.lg,
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2,
    },
    infoCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: 56,
    },
    connectorBadge: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    connectorBadgeText: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.bold,
      fontSize: typography.size.base,
    },
    stationName: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
    connectorSubtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      textAlign: 'center',
      marginTop: spacing.xs,
      paddingHorizontal: spacing.lg,
    },
    lineTrack: {
      width: '70%',
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.bgElevated,
      overflow: 'hidden',
      marginTop: spacing.lg,
    },
    lineFill: {
      height: '100%',
      borderRadius: 2,
      backgroundColor: colors.primary,
    },
    steps: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    stepRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    stepDot: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stepDotDone: {
      backgroundColor: colors.primary,
    },
    stepDotActive: {
      backgroundColor: colors.primarySoft,
    },
    stepDotIdle: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.textMuted,
    },
    stepLabel: {
      flex: 1,
      color: colors.textMuted,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.regular,
    },
    stepLabelDone: {
      color: colors.textSecondary,
    },
    stepLabelActive: {
      color: colors.textPrimary,
      fontFamily: typography.fontFamily.semibold,
    },
    ctaWrap: {
      paddingTop: spacing.md,
    },
    cancelButton: {
      borderRadius: radius.btn,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgSecondary,
      paddingVertical: 15,
      alignItems: 'center',
    },
    cancelText: {
      color: colors.textSecondary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
  });
