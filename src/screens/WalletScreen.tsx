import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Plus, ArrowDownLeft, ArrowUpRight, X } from 'lucide-react-native';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { WalletAPI } from '@/services/api';
import { Transaction, WalletBalance } from '@/types';
import ScreenHeader from '@/components/ScreenHeader';
import { showAlert } from '@/services/alert';
import { useAppStore } from '@/store/useAppStore';
import { describeError } from '@/services/errors';
import { formatSom, groupSomInput, parseSomInput, somInputToNumber } from '@/utils/money';

// Ekran 5: Hamyon / to'lov
//
// To'ldirish oqimi: summa tanlanadi -> server to'lov havolasini qaytaradi ->
// havola brauzerda ochiladi -> foydalanuvchi to'laydi. Balans SHU YERDA
// oshmaydi: pul kelganini faqat to'lov tizimi tasdiqlaydi va u haqda
// serverga xabar beradi. Shuning uchun ilovaga qaytgach holat so'raladi.

const TOPUP_PRESETS = [50000, 100000, 200000];

function TransactionRow({
  tx,
  colors,
  styles,
}: {
  tx: Transaction;
  colors: ColorPalette;
  styles: ReturnType<typeof createStyles>;
}) {
  const isTopup = tx.type === 'topup';
  return (
    <View style={styles.txRow}>
      <View style={[styles.txIconWrap, isTopup && styles.txIconWrapPositive]}>
        {isTopup ? (
          <ArrowDownLeft size={16} color={colors.accent} />
        ) : (
          <ArrowUpRight size={16} color={colors.textSecondary} />
        )}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.txDescription} numberOfLines={1}>
          {tx.description}
        </Text>
        <Text style={styles.txDate}>
          {new Date(tx.createdAt).toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short' })}
        </Text>
      </View>
      <Text style={[styles.txAmount, isTopup && styles.txAmountPositive]}>
        {isTopup ? '+' : '-'}
        {formatSom(tx.amount)} so'm
      </Text>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [topUpVisible, setTopUpVisible] = useState(false);
  const [amount, setAmount] = useState('');      // faqat raqamlar
  const [amountFocused, setAmountFocused] = useState(false);
  const [topUpLoading, setTopUpLoading] = useState(false);
  const [providers, setProviders] = useState<{ code: string; name: string }[]>([]);
  // To'lovdan qaytgach shu buyurtma holati so'raladi
  // Do'kondan: foydalanuvchi to'lash uchun brauzerga o'tganda tizim
  // ilovani xotiradan chiqarib yuborishi mumkin. Ekran holatida
  // saqlansa buyurtma raqami yo'qolardi va qaytgan odam tasdiqni
  // umuman ko'rmasdi.
  const pendingOrder = useAppStore((s) => s.pendingOrderId);
  const setPendingOrder = useAppStore((s) => s.setPendingOrder);

  const loadWallet = useCallback(() => {
    Promise.all([WalletAPI.getBalance(), WalletAPI.getTransactions()])
      .then(([balanceRes, txRes]) => {
        setBalance(balanceRes.data);
        setTransactions(txRes.data.results ?? txRes.data);
      })
      .catch(() => showAlert('Xatolik', "Hamyon ma'lumotini yuklab bo'lmadi", undefined, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadWallet();
      WalletAPI.getProviders()
        .then((res) => setProviders(res.data.results ?? []))
        .catch(() => setProviders([]));

      // To'lov sahifasidan qaytilgan bo'lsa natijani tekshiramiz: pul
      // kelgani haqida xabarni server oladi, ilova emas
      if (pendingOrder) {
        WalletAPI.getPaymentStatus(pendingOrder)
          .then((res) => {
            if (res.data.paid) {
              showAlert("To'landi", `${formatSom(res.data.amount)} so'm qo'shildi`,
                        undefined, 'success');
              setPendingOrder(null);
              loadWallet();
            }
          })
          .catch(() => undefined);
      }
    }, [loadWallet, pendingOrder])
  );

  const handleTopUp = async (providerCode?: string) => {
    if (!amount || topUpLoading) return;
    const code = providerCode ?? providers[0]?.code;
    if (!code) {
      showAlert("To'lov usuli yo'q", "Hozircha to'ldirish usuli mavjud emas",
                undefined, 'error');
      return;
    }

    setTopUpLoading(true);
    try {
      const res = await WalletAPI.topUp(somInputToNumber(amount), code);
      setTopUpVisible(false);
      setAmount('');

      // Havola brauzerda ochiladi; qaytgach holatni so'raymiz
      const opened = await Linking.openURL(res.data.checkoutUrl).then(
        () => true,
        () => false
      );
      if (!opened) {
        showAlert('Xatolik', "To'lov sahifasi ochilmadi", undefined, 'error');
        return;
      }
      setPendingOrder(res.data.orderId);
    } catch (err: any) {
      // `describeError` server matnini birinchi o'ringa qo'yadi
      // (chegaradan kam summa, sozlanmagan tizim), javob umuman
      // kelmasa esa internet yo'qligini aytadi — «Xatolik» degan
      // umumiy so'z ikkalasini yashirardi.
      showAlert('Xatolik', describeError(err, "To'ldirib bo'lmadi"),
                undefined, 'error');
    } finally {
      setTopUpLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Hamyon"
        right={
          <TouchableOpacity
            style={styles.topUpLink}
            activeOpacity={0.7}
            onPress={() => setTopUpVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={15} color={colors.primary} />
            <Text style={styles.topUpLinkText}>To'ldirish</Text>
          </TouchableOpacity>
        }
      />

      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <>
            {/* Prime EV: tekis, och yashil balans kartasi (gradient emas) */}
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Umumiy balans</Text>
              <Text style={styles.balanceValue}>
                {formatSom((balance?.amount ?? 0))}{' '}
                <Text style={styles.balanceUnit}>so'm</Text>
              </Text>
            </View>

            <View style={styles.paymentMethodsRow}>
              <TouchableOpacity style={styles.paymentMethod} activeOpacity={0.8}>
                <Text style={styles.paymentMethodText}>Payme</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.paymentMethod} activeOpacity={0.8}>
                <Text style={styles.paymentMethodText}>Click</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionLabel}>Oxirgi tranzaksiyalar</Text>
          </>
        }
        renderItem={({ item }) => <TransactionRow tx={item} colors={colors} styles={styles} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Tranzaksiyalar yo'q</Text>}
      />

      <Modal
        visible={topUpVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setTopUpVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Hisobni to'ldirish</Text>
              <TouchableOpacity
                onPress={() => setTopUpVisible(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.presetsRow}>
              {TOPUP_PRESETS.map((preset) => (
                <TouchableOpacity
                  key={preset}
                  style={[styles.presetChip, amount === String(preset) && styles.presetChipActive]}
                  activeOpacity={0.8}
                  onPress={() => setAmount(String(preset))}
                >
                  <Text style={styles.presetChipText}>{formatSom(preset)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Holatda toza raqam turadi; ajratgichlar faqat ko'rsatishda
                qo'shiladi. Fokusdan chiqqanda panel bilan bir xil ko'rinish. */}
            <TextInput
              style={styles.amountInput}
              placeholder="Summani kiriting"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              value={
                amountFocused || !amount ? groupSomInput(amount) : formatSom(somInputToNumber(amount))
              }
              onChangeText={(v) => setAmount(parseSomInput(v))}
              onFocus={() => setAmountFocused(true)}
              onBlur={() => setAmountFocused(false)}
            />

            {/* Bir nechta to'lov tizimi bo'lsa foydalanuvchi tanlaydi —
                bittasi bo'lsa ortiqcha qadam qo'shmaymiz */}
            {providers.length > 1 ? (
              <View style={styles.providerRow}>
                {providers.map((provider) => (
                  <TouchableOpacity
                    key={provider.code}
                    style={[styles.confirmButton, styles.providerButton,
                            !amount && styles.confirmButtonDisabled]}
                    activeOpacity={0.85}
                    disabled={!amount || topUpLoading}
                    onPress={() => handleTopUp(provider.code)}
                  >
                    <Text style={styles.confirmButtonText}>{provider.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <TouchableOpacity
                style={[styles.confirmButton, !amount && styles.confirmButtonDisabled]}
                activeOpacity={0.85}
                disabled={!amount || topUpLoading}
                onPress={() => handleTopUp()}
              >
                {topUpLoading ? (
                  <ActivityIndicator color={colors.textPrimary} />
                ) : (
                  <Text style={styles.confirmButtonText}>
                    {providers[0] ? `${providers[0].name} orqali to'lash` : 'Davom etish'}
                  </Text>
                )}
              </TouchableOpacity>
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
    listContent: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    topUpLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    topUpLinkText: {
      color: colors.primary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    balanceCard: {
      backgroundColor: colors.primarySoft,
      borderRadius: radius.md,
      paddingVertical: spacing.lg,
      paddingHorizontal: spacing.lg,
      marginBottom: spacing.lg,
      alignItems: 'center',
    },
    balanceLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    balanceValue: {
      color: colors.primary,
      fontSize: typography.size.xxl,
      fontFamily: typography.fontFamily.bold,
      marginTop: spacing.xs,
    },
    balanceUnit: {
      fontSize: typography.size.base,
    },
    paymentMethodsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    paymentMethod: {
      flex: 1,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    paymentMethodText: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      marginBottom: spacing.sm,
    },
    txRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      ...shadow.sm,
    },
    txIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    txIconWrapPositive: {
      backgroundColor: colors.primarySoft,
    },
    txDescription: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    txDate: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    txAmount: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    txAmountPositive: {
      color: colors.accent,
    },
    emptyText: {
      color: colors.textSecondary,
      textAlign: 'center',
      marginTop: spacing.xl,
    },
    modalBackdrop: {
      flex: 1,
      justifyContent: 'flex-end',
      backgroundColor: 'rgba(0,0,0,0.5)',
    },
    modalCard: {
      backgroundColor: colors.bgSecondary,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.lg,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.lg,
    },
    modalTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.semibold,
    },
    presetsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    presetChip: {
      flex: 1,
      backgroundColor: colors.bgElevated,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
      alignItems: 'center',
    },
    presetChipActive: {
      borderColor: colors.primary,
      backgroundColor: 'rgba(59,130,246,0.14)',
    },
    presetChipText: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    amountInput: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.regular,
      paddingHorizontal: spacing.md,
      height: 52,
      marginBottom: spacing.lg,
    },
    confirmButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    providerRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    providerButton: {
      flex: 1,
    },
    confirmButtonDisabled: {
      backgroundColor: colors.bgElevated,
    },
    confirmButtonText: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
  });
