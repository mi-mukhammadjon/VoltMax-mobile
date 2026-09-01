import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Switch,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { CreditCard, Check, AlertTriangle } from 'lucide-react-native';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { CardsAPI } from '@/services/api';
import { SavedCard, AutoTopUp as AutoTopUpSettings } from '@/types';
import ScreenHeader from '@/components/ScreenHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { showAlert } from '@/services/alert';
import { describeError } from '@/services/errors';
import { formatSom, groupSomInput, parseSomInput, somInputToNumber } from '@/utils/money';

// Avtomatik to'ldirish.
//
// Nima uchun: zaryadlash paytida pul tugasa sessiya to'xtaydi va odam
// yarim zaryadlangan mashina bilan qoladi — ko'pincha yerto'la
// parkovkada, aloqasiz joyda.
//
// Nima uchun bu ekran KO'P narsani ochiq aytadi: avtomatik pul yechish
// ishonchni eng tez yo'qotadigan narsa. Odam qachon, qancha va qaysi
// kartadan yechilishini oldindan bilishi kerak — keyin bilsa, kech.
//
// Kunlik va oylik chegara SERVERDA turadi va bu yerda faqat
// KO'RSATILADI. Ularni ilovadan o'zgartirish mumkin bo'lsa, ular himoya
// bo'lishdan to'xtaydi.

const THRESHOLD_PRESETS = [10000, 20000, 30000];
const AMOUNT_PRESETS = [50000, 100000, 200000];

export default function AutoTopUpScreen() {
  const navigation = useNavigation();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [cards, setCards] = useState<SavedCard[]>([]);
  const [settings, setSettings] = useState<AutoTopUpSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [enabled, setEnabled] = useState(false);
  const [cardId, setCardId] = useState<string | null>(null);
  const [threshold, setThreshold] = useState('20000');
  const [amount, setAmount] = useState('50000');

  const load = useCallback(() => {
    Promise.all([CardsAPI.list(), CardsAPI.getAutoTopUp()])
      .then(([cardsRes, settingsRes]) => {
        const usable: SavedCard[] = (cardsRes.data.results ?? []).filter(
          (card: SavedCard) => card.isUsable
        );
        setCards(usable);

        const data: AutoTopUpSettings = settingsRes.data;
        setSettings(data);
        if (data.enabled) {
          setEnabled(Boolean(data.isActive));
          setCardId(String(data.cardId));
          setThreshold(String(data.threshold ?? 20000));
          setAmount(String(data.amount ?? 50000));
        } else {
          // Sozlanmagan bo'lsa asosiy karta oldindan tanlanadi
          const preferred = usable.find((card) => card.isDefault) ?? usable[0];
          setCardId(preferred ? preferred.id : null);
        }
      })
      .catch(() => showAlert('Xatolik', 'Sozlamani yuklab bo‘lmadi', undefined, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const thresholdValue = somInputToNumber(threshold);
  const amountValue = somInputToNumber(amount);
  // Chegara summadan katta bo'lsa to'ldirish darhol yana ishga tushadi
  // va halqa hosil bo'ladi — server ham buni rad etadi, lekin
  // foydalanuvchi buni saqlashdan OLDIN ko'rishi kerak
  const loopRisk = thresholdValue >= amountValue;

  const save = async () => {
    if (!cardId || saving || loopRisk) return;

    setSaving(true);
    try {
      const res = await CardsAPI.saveAutoTopUp(cardId, thresholdValue, amountValue, enabled);
      setSettings(res.data);
      showAlert(
        enabled ? 'Yoqildi' : 'Saqlandi',
        enabled
          ? `Balans ${formatSom(thresholdValue)} so‘mdan pastga tushsa, kartadan ${formatSom(amountValue)} so‘m yechiladi.`
          : 'Avtomatik to‘ldirish o‘chirilgan holda saqlandi.',
        undefined,
        'success'
      );
    } catch (err: any) {
      showAlert('Xatolik', describeError(err, 'Saqlab bo‘lmadi'), undefined, 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeSettings = () => {
    showAlert(
      'Sozlamani o‘chirish',
      'Avtomatik to‘ldirish butunlay o‘chiriladi.',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O‘chirish',
          style: 'destructive',
          onPress: () => {
            CardsAPI.removeAutoTopUp()
              .then(() => navigation.goBack())
              .catch((err) => showAlert('Xatolik',
                describeError(err, 'O‘chirib bo‘lmadi'), undefined, 'error'));
          },
        },
      ],
      'warning'
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Avtomatik to‘ldirish" />
        <View style={styles.center}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="Avtomatik to‘ldirish" />
        <View style={styles.center}>
          <Text style={styles.emptyText}>
            Avval tasdiqlangan karta biriktiring.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="Avtomatik to‘ldirish" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Yoqilgan</Text>
            <Text style={styles.switchText}>
              Faqat zaryadlash ketayotganda ishlaydi
            </Text>
          </View>
          <Switch
            value={enabled}
            onValueChange={setEnabled}
            trackColor={{ false: colors.border, true: colors.primarySoft }}
            thumbColor={enabled ? colors.primary : colors.textMuted}
          />
        </View>

        <Text style={styles.sectionLabel}>Karta</Text>
        {cards.map((card) => (
          <TouchableOpacity
            key={card.id}
            style={[styles.cardRow, cardId === card.id && styles.cardRowActive]}
            activeOpacity={0.8}
            onPress={() => setCardId(card.id)}
          >
            <CreditCard size={17} color={colors.primary} />
            <Text style={styles.cardPan}>{card.maskedPan}</Text>
            {cardId === card.id ? <Check size={16} color={colors.primary} /> : null}
          </TouchableOpacity>
        ))}

        <Text style={styles.sectionLabel}>Balans shundan pastga tushsa</Text>
        <View style={styles.presetsRow}>
          {THRESHOLD_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.chip, thresholdValue === preset && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => setThreshold(String(preset))}
            >
              <Text style={styles.chipText}>{formatSom(preset)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={groupSomInput(threshold)}
          onChangeText={(v) => setThreshold(parseSomInput(v))}
        />

        <Text style={styles.sectionLabel}>Shuncha to‘ldirilsin</Text>
        <View style={styles.presetsRow}>
          {AMOUNT_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              style={[styles.chip, amountValue === preset && styles.chipActive]}
              activeOpacity={0.8}
              onPress={() => setAmount(String(preset))}
            >
              <Text style={styles.chipText}>{formatSom(preset)}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={groupSomInput(amount)}
          onChangeText={(v) => setAmount(parseSomInput(v))}
        />

        {loopRisk ? (
          <View style={styles.warnRow}>
            <AlertTriangle size={15} color={colors.statusBusy} />
            <Text style={styles.warnText}>
              To‘ldirish summasi chegaradan katta bo‘lishi kerak — aks holda
              to‘ldirish darhol qaytadan ishga tushadi.
            </Text>
          </View>
        ) : null}

        {/* Chegaralar serverda; ular bu yerda faqat ko'rsatiladi */}
        {settings?.enabled ? (
          <Text style={styles.limits}>
            Chegaralar: kuniga {formatSom(settings.dailyLimit)} so‘m, oyiga{' '}
            {formatSom(settings.monthlyLimit)} so‘m. Bu chegaralarni faqat
            operator o‘zgartira oladi.
          </Text>
        ) : null}

        {settings?.blockedReason ? (
          <View style={styles.warnRow}>
            <AlertTriangle size={15} color={colors.statusError} />
            <Text style={styles.warnText}>{settings.blockedReason}</Text>
          </View>
        ) : null}

        <PrimaryButton
          label="Saqlash"
          loading={saving}
          disabled={!cardId || loopRisk}
          onPress={save}
          style={{ marginTop: spacing.md }}
        />

        {settings?.enabled ? (
          <PrimaryButton
            label="Sozlamani o‘chirish"
            variant="danger"
            onPress={removeSettings}
            style={{ marginTop: spacing.sm }}
          />
        ) : null}

        <Text style={styles.note}>
          Har yechimdan keyin sizga darhol xabar keladi. Ketma-ket uchta
          muvaffaqiyatsiz urinishdan so‘ng sozlama o‘z-o‘zidan o‘chadi.
        </Text>
      </ScrollView>
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
      padding: spacing.lg,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    switchTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
    switchText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      marginTop: 2,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      marginTop: spacing.md,
    },
    cardRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
    },
    cardRowActive: {
      borderColor: colors.primary,
    },
    cardPan: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    presetsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    chip: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySoft,
    },
    chipText: {
      color: colors.textPrimary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
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
    warnRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    warnText: {
      flex: 1,
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      lineHeight: 17,
    },
    limits: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      lineHeight: 17,
      marginTop: spacing.sm,
    },
    note: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      lineHeight: 17,
      marginTop: spacing.md,
    },
    emptyText: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.regular,
      textAlign: 'center',
    },
  });
