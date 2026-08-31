import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, LifeBuoy, ChevronRight } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { AuthAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { showAlert } from '@/services/alert';

// Auth oqimi 2-qadam: OTP tasdiqlash — backend orqali JWT token olinadi
// Kod yuborilgandan keyin 60 soniya qayta yuborishni bloklaydi (SMS'ni suiiste'mol qilishning oldini olish)
// Layout: https://mir-s3-cdn-cf.behance.net/... (Login/Sign Up mobile UI) asosida,
// VoltMax navy/electric-blue/mint temasida qayta qurilgan.

type Props = NativeStackScreenProps<RootStackParamList, 'Otp'>;
type NavProp = NativeStackNavigationProp<RootStackParamList, 'Otp'>;

const CODE_LENGTH = 5;
const RESEND_COOLDOWN_SECONDS = 60;

function formatCooldown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export default function OtpScreen({ route }: Props) {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const setTokens = useAuthStore((s) => s.setTokens);
  const setName = useAuthStore((s) => s.setName);
  const { phone } = route.params;
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_COOLDOWN_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const isValid = code.length === CODE_LENGTH;
  const canResend = secondsLeft === 0 && !resending;

  const handleConfirm = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      const res = await AuthAPI.verifyOtp(phone, code);
      setTokens(res.data.access, res.data.refresh, phone);
      // Ilgari ism kiritgan foydalanuvchi bosh ekranda darhol ismi bilan ko'rinadi
      setName(res.data.name ?? null);
      // Auth muvaffaqiyatli — Login/Otp'ga qaytib ketmasligi uchun stackni tozalab MainTabs'ga o'tamiz
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'MainTabs' }],
        })
      );
    } catch (err) {
      showAlert('Xatolik', "Kod noto'g'ri yoki muddati o'tgan", undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setResending(true);
    try {
      await AuthAPI.sendOtp(phone);
      setCode('');
      setSecondsLeft(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      showAlert('Xatolik', "Kod qayta yuborilmadi", undefined, 'error');
    } finally {
      setResending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        activeOpacity={0.8}
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <ArrowLeft size={20} color={colors.textPrimary} />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Tasdiqlash kodi</Text>
        <Text style={styles.subtitle}>
          {phone} raqamiga Telegram orqali kod yuborildi.{' '}
          <Text style={styles.editLink} onPress={() => navigation.goBack()}>
            Raqamni tahrirlash
          </Text>
        </Text>

        <TouchableOpacity
          activeOpacity={1}
          style={styles.otpBoxRow}
          onPress={() => {
            // Klaviatura tashqi tarzda (masalan orqaga tugmasi bilan) yopilgan bo'lsa,
            // input hali native darajada "focus qilingan" deb hisoblanadi va oddiy
            // .focus() hech narsa qilmaydi — shuning uchun avval blur, keyin focus.
            inputRef.current?.blur();
            requestAnimationFrame(() => inputRef.current?.focus());
          }}
        >
          {Array.from({ length: CODE_LENGTH }).map((_, i) => {
            const filled = i < code.length;
            const isCursor = i === code.length;
            return (
              <View
                key={i}
                style={[styles.otpBox, filled && styles.otpBoxFilled, isCursor && styles.otpBoxActive]}
              >
                <Text style={styles.otpBoxText}>{code[i] ?? ''}</Text>
              </View>
            );
          })}
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={styles.hiddenInput}
          keyboardType="number-pad"
          maxLength={CODE_LENGTH}
          value={code}
          onChangeText={(v) => setCode(v.replace(/\D/g, ''))}
          autoFocus
        />

        <View style={styles.resendRow}>
          <Text style={styles.resendHint}>Kodni olmadingizmi? </Text>
          {canResend ? (
            <TouchableOpacity onPress={handleResend} disabled={resending}>
              <Text style={styles.resendActiveText}>
                {resending ? 'Yuborilmoqda...' : 'Qayta yuborish'}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.resendText}>Qayta yuborish {formatCooldown(secondsLeft)}</Text>
          )}
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isValid || loading}
          onPress={handleConfirm}
        >
          <LinearGradient
            colors={!isValid ? [colors.bgElevated, colors.bgElevated] : colors.gradientPrimary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {loading ? (
              <ActivityIndicator color={colors.bgPrimary} />
            ) : (
              <Text style={[styles.ctaText, !isValid && styles.ctaTextDisabled]}>Tasdiqlash</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.supportRow}
        activeOpacity={0.8}
        onPress={() => showAlert("Qo'llab-quvvatlash", 'Tez orada qo\'shiladi.')}
      >
        <LifeBuoy size={16} color={colors.textSecondary} />
        <Text style={styles.supportText}>OTP bilan muammo bormi? Qo'llab-quvvatlash</Text>
        <ChevronRight size={16} color={colors.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
      padding: spacing.lg,
      justifyContent: 'space-between',
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.xxl,
      fontFamily: typography.fontFamily.bold,
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      lineHeight: 20,
      marginBottom: spacing.xl,
    },
    editLink: {
      color: colors.primary,
      fontFamily: typography.fontFamily.semibold,
    },
    otpBoxRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    otpBox: {
      flex: 1,
      height: 60,
      borderRadius: radius.md,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1.5,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
    },
    otpBoxFilled: {
      borderColor: colors.primary,
    },
    otpBoxActive: {
      borderColor: colors.accent,
    },
    otpBoxText: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
    },
    hiddenInput: {
      position: 'absolute',
      opacity: 0,
      height: 1,
      width: 1,
    },
    resendRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    resendHint: {
      color: colors.textMuted,
      fontSize: typography.size.sm,
    },
    resendText: {
      color: colors.textMuted,
      fontSize: typography.size.sm,
    },
    resendActiveText: {
      color: colors.primary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    cta: {
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    ctaText: {
      color: colors.bgPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
    },
    ctaTextDisabled: {
      color: colors.textMuted,
    },
    supportRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.pill,
      paddingVertical: spacing.sm,
      marginBottom: spacing.sm,
    },
    supportText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
  });
