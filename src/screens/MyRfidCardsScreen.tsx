import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { CreditCard, Lock, Unlock, ShieldAlert } from 'lucide-react-native';
import { RfidCard } from '@/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { RfidCardsAPI } from '@/services/api';
import { showAlert } from '@/services/alert';
import ScreenHeader from '@/components/ScreenHeader';
import Card from '@/components/Card';
import Skeleton from '@/components/Skeleton';
import EmptyState from '@/components/EmptyState';

// Ekran: Mening kartalarim.
//
// Asosiy maqsad — kartani YO'QOTGANDA foydalanuvchi uni o'zi darhol bloklay
// olsin. Operatorga qo'ng'iroq qilib kutish xavfli: shu orada karta bilan
// zaryadlab, pulni foydalanuvchi hisobidan yechib ketishlari mumkin.
//
// Karta qo'shish/o'chirish bu yerda yo'q — u operator ishi.

export default function MyRfidCardsScreen() {
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [cards, setCards] = useState<RfidCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(() => {
    RfidCardsAPI.list()
      .then((res) => setCards(res.data.results ?? res.data ?? []))
      .catch(() => showAlert('Xatolik', "Kartalarni yuklab bo'lmadi", undefined, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggleBlock = async (card: RfidCard) => {
    if (busyId) return;
    const blocking = !card.isBlocked;

    setBusyId(card.id);
    try {
      await RfidCardsAPI.setBlocked(card.id, blocking);
      load();
      showAlert(
        blocking ? 'Karta bloklandi' : 'Karta ochildi',
        blocking
          ? "Bu karta bilan endi zaryadlash boshlanmaydi. Kartani topsangiz shu yerdan qayta ochasiz."
          : 'Karta yana ishlaydi.',
        undefined,
        'success'
      );
    } catch (err: any) {
      showAlert(
        'Xatolik',
        err?.response?.data?.detail ?? "Amalni bajarib bo'lmadi",
        undefined,
        'error'
      );
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Mening kartalarim" />

      {loading ? (
        <View style={styles.skeletonWrap}>
          {[0, 1].map((i) => (
            <Card key={i}>
              <Skeleton width="45%" height={15} />
              <Skeleton width="70%" height={12} style={{ marginTop: spacing.sm }} />
            </Card>
          ))}
        </View>
      ) : (
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ListHeaderComponent={
            cards.length > 0 ? (
              <Text style={styles.hint}>
                Kartangizni yo'qotsangiz uni darhol bloklang — shundan keyin u bilan
                zaryadlash boshlanmaydi.
              </Text>
            ) : null
          }
          renderItem={({ item }) => {
            const locked = item.isBlocked;
            // Operator bloklagan kartani foydalanuvchi ocha olmaydi
            const lockedByOperator = locked && !item.canUnblock;

            return (
              <Card style={styles.cardRow}>
                <View style={styles.top}>
                  <View style={[styles.iconWrap, locked && styles.iconWrapLocked]}>
                    <CreditCard size={18} color={locked ? colors.statusOffline : colors.primary} />
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.tag}>{item.idTag}</Text>
                    <Text style={styles.meta}>
                      {item.label || 'nomsiz'}
                      {item.companyName ? ` • ${item.companyName}` : ''}
                      {item.useCount ? ` • ${item.useCount} marta` : ''}
                    </Text>
                  </View>
                </View>

                {lockedByOperator ? (
                  <View style={styles.notice}>
                    <ShieldAlert size={15} color={colors.statusError} />
                    <Text style={styles.noticeText}>
                      Kartani operator bloklagan. Ochish uchun qo'llab-quvvatlash
                      xizmatiga murojaat qiling.
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={[styles.action, locked && styles.actionUnlock]}
                    activeOpacity={0.85}
                    disabled={busyId === item.id}
                    onPress={() => toggleBlock(item)}
                  >
                    {busyId === item.id ? (
                      <ActivityIndicator size="small" color={colors.textPrimary} />
                    ) : (
                      <>
                        {locked ? (
                          <Unlock size={16} color={colors.textPrimary} />
                        ) : (
                          <Lock size={16} color={colors.statusError} />
                        )}
                        <Text style={[styles.actionText, !locked && styles.actionTextBlock]}>
                          {locked ? 'Kartani ochish' : 'Kartani bloklash'}
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </Card>
            );
          }}
          ListEmptyComponent={
            <EmptyState
              icon={<CreditCard size={26} color={colors.primary} />}
              title="Karta yo'q"
              subtitle="Sizga RFID karta biriktirilmagan. Zaryadlashni ilova orqali boshlashingiz mumkin."
              fill={false}
            />
          }
        />
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    skeletonWrap: { paddingHorizontal: spacing.lg, gap: spacing.md },
    listContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
    hint: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.textMuted,
      marginBottom: spacing.sm,
      lineHeight: 18,
    },
    cardRow: { gap: spacing.md },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm + 2 },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapLocked: { backgroundColor: 'rgba(107,114,128,0.18)' },
    info: { flex: 1, minWidth: 0 },
    tag: {
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
      color: colors.textPrimary,
      letterSpacing: 0.5,
    },
    meta: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.textSecondary,
      marginTop: 2,
    },
    action: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs + 2,
      height: 42,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.bgElevated,
    },
    actionUnlock: { borderColor: colors.primary },
    actionText: {
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
      color: colors.textPrimary,
    },
    actionTextBlock: { color: colors.statusError },
    notice: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.xs + 2,
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: 'rgba(229,72,77,0.12)',
    },
    noticeText: {
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.regular,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 17,
    },
  });
