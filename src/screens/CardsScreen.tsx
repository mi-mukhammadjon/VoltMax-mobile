import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Plus, X, CreditCard, Check, Trash2, RefreshCw } from 'lucide-react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { CardsAPI, WalletAPI } from '@/services/api';
import { SavedCard } from '@/types';
import { RootStackParamList } from '@/navigation/types';
import ScreenHeader from '@/components/ScreenHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { showAlert } from '@/services/alert';
import { describeError } from '@/services/errors';

// Biriktirilgan kartalar.
//
// Nima uchun kerak: hozirgi to'ldirish oqimi brauzerga o'tishni talab
// qiladi va har safar karta raqamini qaytadan kiritishni. Zaryadlash
// paytida pul tugasa, bu qadamlarning har biri sessiyani uzaytiradi.
//
// KARTA RAQAMI SAQLANMAYDI. U shu ekrandan bir marta serverga
// yuboriladi va o'sha yerdan to'lov tizimiga o'tadi. Shuning uchun
// raqam holatda ham, xotirada ham qolmaydi: modal yopilganda tozalanadi.

type Nav = NativeStackNavigationProp<RootStackParamList>;

// Bank kodni SMS orqali yuboradi; ikkinchi qadam shuni kutadi
type Step = 'card' | 'code';

const BRAND_LABELS: Record<string, string> = {
  uzcard: 'UzCard',
  humo: 'Humo',
  visa: 'Visa',
  mastercard: 'Mastercard',
  other: 'Karta',
};

/** `1234 5678 9012 3456` — o'qishni osonlashtiradigan ajratgichlar */
function groupPan(digits: string): string {
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

/** `MM/YY` — foydalanuvchi slashni o'zi kiritmaydi */
function groupExpiry(digits: string): string {
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function onlyDigits(text: string): string {
  return text.replace(/\D/g, '');
}

export default function CardsScreen() {
  const navigation = useNavigation<Nav>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [providers, setProviders] = useState<{ code: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  const [addVisible, setAddVisible] = useState(false);
  const [step, setStep] = useState<Step>('card');
  const [pan, setPan] = useState('');
  const [expiry, setExpiry] = useState('');
  const [code, setCode] = useState('');
  const [pendingCardId, setPendingCardId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    Promise.all([CardsAPI.list(), WalletAPI.getProviders()])
      .then(([cardsRes, providersRes]) => {
        setCards(cardsRes.data.results ?? []);
        setProviders(providersRes.data.results ?? []);
      })
      .catch(() => showAlert('Xatolik', 'Kartalarni yuklab bo‘lmadi', undefined, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  /** Modalni yopish. Karta raqami HAR DOIM shu yerda tozalanadi. */
  const closeAdd = () => {
    setAddVisible(false);
    setStep('card');
    setPan('');
    setExpiry('');
    setCode('');
    setPendingCardId(null);
  };

  const submitCard = async () => {
    const digits = onlyDigits(pan);
    if (digits.length < 16 || onlyDigits(expiry).length < 4 || busy) return;

    const provider = providers[0]?.code;
    if (!provider) {
      showAlert('To‘lov tizimi yo‘q', 'Hozircha karta biriktirib bo‘lmaydi',
                undefined, 'error');
      return;
    }

    setBusy(true);
    try {
      const res = await CardsAPI.add(digits, onlyDigits(expiry), provider);
      setPendingCardId(String(res.data.id));
      // Raqam serverga ketdi — endi u ilovada turishi shart emas
      setPan('');
      setExpiry('');
      setStep('code');
    } catch (err: any) {
      showAlert('Xatolik', describeError(err, 'Kartani biriktirib bo‘lmadi'),
                undefined, 'error');
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async () => {
    if (!pendingCardId || code.length < 4 || busy) return;

    setBusy(true);
    try {
      await CardsAPI.verify(pendingCardId, code);
      closeAdd();
      load();
      showAlert('Karta qo‘shildi', 'Endi bir bosishda to‘ldirsangiz bo‘ladi',
                undefined, 'success');
    } catch (err: any) {
      showAlert('Kod noto‘g‘ri', describeError(err, 'Kodni tekshirib bo‘lmadi'),
                undefined, 'error');
    } finally {
      setBusy(false);
    }
  };

  const confirmRemove = (card: SavedCard) => {
    // Karta o'chirilsa avtomatik to'ldirish ham to'xtaydi — buni oldindan
    // aytamiz, chunki keyin bilish kech bo'ladi
    showAlert(
      'Kartani o‘chirish',
      `${card.maskedPan} o‘chiriladi. Avtomatik to‘ldirish shu kartaga bog‘langan bo‘lsa, u ham to‘xtaydi.`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O‘chirish',
          style: 'destructive',
          onPress: () => {
            CardsAPI.remove(card.id)
              .then(() => load())
              .catch((err) => showAlert('Xatolik',
                describeError(err, 'O‘chirib bo‘lmadi'), undefined, 'error'));
          },
        },
      ],
      'warning'
    );
  };

  const makeDefault = (card: SavedCard) => {
    if (card.isDefault || !card.isUsable) return;
    CardsAPI.makeDefault(card.id)
      .then(() => load())
      .catch(() => undefined);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Kartalarim" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Kartalarim"
        right={
          <TouchableOpacity
            style={styles.addLink}
            activeOpacity={0.7}
            onPress={() => setAddVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={15} color={colors.primary} />
            <Text style={styles.addLinkText}>Qo‘shish</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {cards.length === 0 ? (
          <View style={styles.empty}>
            <CreditCard size={32} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Karta biriktirilmagan</Text>
            <Text style={styles.emptyText}>
              Karta qo‘shsangiz, hisobni brauzerga o‘tmasdan bir bosishda
              to‘ldirasiz.
            </Text>
          </View>
        ) : (
          cards.map((card) => (
            <TouchableOpacity
              key={card.id}
              style={styles.card}
              activeOpacity={card.isUsable && !card.isDefault ? 0.8 : 1}
              onPress={() => makeDefault(card)}
            >
              <View style={styles.cardIcon}>
                <CreditCard size={18} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={styles.cardPan}>{card.maskedPan}</Text>
                <Text style={styles.cardMeta}>
                  {BRAND_LABELS[card.brand] ?? BRAND_LABELS.other} · {card.expires}
                  {!card.isUsable ? ` · ${card.stateLabel}` : ''}
                </Text>
              </View>

              {card.isDefault ? (
                <View style={styles.defaultBadge}>
                  <Check size={12} color={colors.primary} />
                  <Text style={styles.defaultBadgeText}>Asosiy</Text>
                </View>
              ) : null}

              <TouchableOpacity
                onPress={() => confirmRemove(card)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Trash2 size={17} color={colors.textMuted} />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
        )}

        {cards.some((card) => card.isUsable) ? (
          <TouchableOpacity
            style={styles.autoRow}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('AutoTopUp')}
          >
            <RefreshCw size={17} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={styles.autoTitle}>Avtomatik to‘ldirish</Text>
              <Text style={styles.autoText}>
                Zaryadlash paytida balans tugab qolmasligi uchun
              </Text>
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Odam pul bilan bog'liq qarorni bilib turib qabul qilishi kerak */}
        <Text style={styles.note}>
          Karta raqami telefonda ham, bizning serverda ham saqlanmaydi. U
          to‘g‘ridan-to‘g‘ri to‘lov tizimiga uzatiladi va bizda faqat
          oxirgi to‘rt raqam qoladi.
        </Text>
      </ScrollView>

      <Modal visible={addVisible} transparent animationType="slide" onRequestClose={closeAdd}>
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {step === 'card' ? 'Karta qo‘shish' : 'SMS kod'}
              </Text>
              <TouchableOpacity
                onPress={closeAdd}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {step === 'card' ? (
              <>
                <TextInput
                  style={styles.input}
                  placeholder="Karta raqami"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={19}
                  value={groupPan(onlyDigits(pan))}
                  onChangeText={(v) => setPan(onlyDigits(v).slice(0, 16))}
                />
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={5}
                  value={groupExpiry(onlyDigits(expiry))}
                  onChangeText={(v) => setExpiry(onlyDigits(v).slice(0, 4))}
                />
                <PrimaryButton
                  label="Davom etish"
                  loading={busy}
                  disabled={onlyDigits(pan).length < 16 || onlyDigits(expiry).length < 4}
                  onPress={submitCard}
                  style={{ marginTop: spacing.sm }}
                />
              </>
            ) : (
              <>
                <Text style={styles.modalHint}>
                  Kartaga bog‘langan raqamga kelgan kodni kiriting.
                </Text>
                <TextInput
                  style={[styles.input, styles.codeInput]}
                  placeholder="000000"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="number-pad"
                  maxLength={6}
                  value={code}
                  onChangeText={(v) => setCode(onlyDigits(v))}
                  autoFocus
                />
                <PrimaryButton
                  label="Tasdiqlash"
                  loading={busy}
                  disabled={code.length < 4}
                  onPress={submitCode}
                  style={{ marginTop: spacing.sm }}
                />
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: spacing.lg,
      gap: spacing.sm,
    },
    addLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    addLinkText: {
      color: colors.primary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    cardIcon: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardPan: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
    cardMeta: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      marginTop: 2,
    },
    defaultBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.primarySoft,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
    },
    defaultBadgeText: {
      color: colors.primary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    autoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    autoTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    autoText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      marginTop: 2,
    },
    note: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      lineHeight: 17,
      marginTop: spacing.md,
    },
    empty: {
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.xxl,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
      marginTop: spacing.xs,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.regular,
      textAlign: 'center',
      lineHeight: 19,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.bgElevated,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.semibold,
    },
    modalHint: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.regular,
      lineHeight: 19,
    },
    input: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.medium,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    codeInput: {
      textAlign: 'center',
      letterSpacing: 6,
      fontSize: typography.size.lg,
    },
  });
