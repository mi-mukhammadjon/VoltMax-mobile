import React, { useState, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Phone, Zap, Send } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { AuthAPI } from '@/services/api';
import { showAlert } from '@/services/alert';

// Auth oqimi 1-qadam: telefon raqam kiritish — backend'ga OTP yuborish so'raladi
// Raqam har doim +998 bilan boshlanadi, qavs va tire avtomatik qo'shiladi/o'chiriladi:
// +998(93)123-04-56
// Layout: https://mir-s3-cdn-cf.behance.net/... (Login/Sign Up mobile UI) asosida,
// VoltMax navy/electric-blue/mint temasida qayta qurilgan.

type NavProp = NativeStackNavigationProp<RootStackParamList, 'Login'>;

const PHONE_DIGITS_LENGTH = 9; // +998'dan keyingi 9 ta raqam

// "+998" alohida, tahrirlanmaydigan <Text> sifatida chiqariladi (pastda) — shu sabab
// bu yerda faqat O'ZGARUVCHI qismni ("(93)123-04-56") formatlaymiz. Prefiks input
// matnining bir qismi bo'lmagani uchun backspace unga umuman yetib bora olmaydi —
// oldingi "yonib-o'chish"/tiklanish effekti butunlay yo'qoladi.
function formatPhoneRest(digits: string): string {
  if (digits.length === 0) return '';
  let result = '(' + digits.slice(0, 2);
  if (digits.length >= 2) result += ')  '; // +998 bilan (93) orasidagi oraliqqa yaqin bo'shliq
  if (digits.length > 2) result += digits.slice(2, 5);
  if (digits.length > 5) result += '-' + digits.slice(5, 7);
  if (digits.length > 7) result += '-' + digits.slice(7, 9);
  return result;
}

// Format qatorning oxiri har doim ham raqam bilan tugamaydi (masalan "(93)" —
// yopuvchi qavsdan keyin hech narsa yo'q). Kursorni doim OXIRGI RAQAMDAN keyin
// qo'yamiz — aks holda backspace doim shu "osilib qolgan" qavs/tireni o'chiradi va
// hech qachon undan oldingi raqamga yetib bormaydi.
function lastDigitPosition(formatted: string): number {
  for (let i = formatted.length - 1; i >= 0; i--) {
    if (/\d/.test(formatted[i])) return i + 1;
  }
  return formatted.length;
}

export default function LoginScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [selection, setSelection] = useState<{ start: number; end: number } | undefined>(undefined);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', () => setKeyboardVisible(true));
    const hideSub = Keyboard.addListener('keyboardDidHide', () => setKeyboardVisible(false));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handlePhoneChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, PHONE_DIGITS_LENGTH);
    setPhoneDigits(digits);
    const pos = lastDigitPosition(formatPhoneRest(digits));
    setSelection({ start: pos, end: pos });
  };

  const isValid = phoneDigits.length === PHONE_DIGITS_LENGTH;
  const fullPhone = '+998' + phoneDigits;

  const handleContinue = async () => {
    if (!isValid || loading) return;
    setLoading(true);
    try {
      await AuthAPI.sendOtp(fullPhone);
      navigation.navigate('Otp', { phone: fullPhone });
    } catch (err) {
      showAlert('Xatolik', "Kod yuborilmadi. Backend ishga tushirilganini va tarmoqni tekshiring.", undefined, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.content}>
        <LinearGradient
          colors={colors.gradientPrimary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.logoWrap}
        >
          <Zap size={30} color={colors.bgPrimary} fill={colors.bgPrimary} />
        </LinearGradient>

        <Text style={styles.title}>Telefon raqamingizni{'\n'}kiriting</Text>
        <Text style={styles.subtitle}>
          Tasdiqlash kodi shu raqamga yuboriladi
        </Text>

        <View style={styles.inputWrap}>
          <Phone size={18} color={colors.textSecondary} />
          <Text style={styles.prefixText}>+998</Text>
          <TextInput
            style={styles.input}
            placeholder="(__)  ___-__-__"
            placeholderTextColor={colors.textMuted}
            keyboardType="phone-pad"
            value={formatPhoneRest(phoneDigits)}
            onChangeText={handlePhoneChange}
            selection={selection}
            onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
            autoFocus
          />
        </View>

        <View style={styles.telegramNote}>
          <Send size={14} color={colors.primary} />
          <Text style={styles.telegramNoteText}>Kod Telegram orqali yuboriladi</Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.85}
          disabled={!isValid || loading}
          onPress={handleContinue}
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
              <Text style={[styles.ctaText, (!isValid) && styles.ctaTextDisabled]}>Davom etish</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {!keyboardVisible && (
        <Text style={styles.termsText}>
          Davom etish orqali siz{' '}
          <Text style={styles.termsLink}>Foydalanish shartlari</Text> va{' '}
          <Text style={styles.termsLink}>Maxfiylik siyosati</Text>ga rozilik bildirasiz
        </Text>
      )}
    </KeyboardAvoidingView>
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
    content: {
      flex: 1,
      justifyContent: 'center',
    },
    logoWrap: {
      width: 72,
      height: 72,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    title: {
      color: colors.textPrimary,
      fontSize: typography.size.xxl,
      fontFamily: typography.fontFamily.bold,
      lineHeight: 32,
      marginBottom: spacing.sm,
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      marginBottom: spacing.xl,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      height: 56,
      marginBottom: spacing.sm,
    },
    telegramNote: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: spacing.lg,
    },
    telegramNoteText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    prefixText: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.medium,
    },
    input: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.regular,
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
    termsText: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      textAlign: 'center',
      lineHeight: 18,
      paddingBottom: spacing.sm,
    },
    termsLink: {
      color: colors.textSecondary,
      fontFamily: typography.fontFamily.medium,
    },
  });
