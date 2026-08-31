import React, { useMemo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Platform } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Calendar, Clock, Zap } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { BookingsAPI } from '@/services/api';
import { useAppStore } from '@/store/useAppStore';
import ScreenHeader from '@/components/ScreenHeader';
import PrimaryButton from '@/components/PrimaryButton';
import { showAlert } from '@/services/alert';
import { formatSom } from '@/utils/money';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'NewBooking'>;
type RouteProps = RouteProp<RootStackParamList, 'NewBooking'>;

const DURATIONS = [30, 60, 90, 120];

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} daq`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}soat ${m}daq` : `${h} soat`;
}

export default function NewBookingScreen() {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const station = useAppStore((s) => s.stations.find((st) => st.id === route.params.stationId));

  const [dateTime, setDateTime] = useState(() => new Date(Date.now() + 60 * 60 * 1000));
  const [pickerMode, setPickerMode] = useState<'date' | 'time' | null>(null);
  const [duration, setDuration] = useState(60);
  const [connectorId, setConnectorId] = useState<string | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  if (!station) {
    return (
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const estimatedKwh = (station.powerKw * duration) / 60;
  const estimatedCost = Math.round(estimatedKwh * station.pricePerKwh);

  const handleConfirm = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await BookingsAPI.create(station.id, dateTime.toISOString(), duration, connectorId);
      showAlert('Bron qilindi', "Bron muvaffaqiyatli yaratildi, uni \"Bronlarim\" bo'limida ko'rishingiz mumkin.", undefined, 'success');
      navigation.goBack();
    } catch (err: any) {
      showAlert('Xatolik', err?.response?.data?.detail || "Bron qilib bo'lmadi", undefined, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Band qilish" />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.stationCard}>
          <Text style={styles.stationName}>{station.name}</Text>
          <Text style={styles.stationAddress}>{station.address}</Text>
        </View>

        {!!station.connectors?.length && (
          <>
            <Text style={styles.sectionLabel}>Ulagich (ixtiyoriy)</Text>
            <View style={styles.chipRow}>
              {station.connectors.map((c) => {
                const active = connectorId === c.id;
                return (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, active && styles.chipActive]}
                    activeOpacity={0.8}
                    onPress={() => setConnectorId(active ? undefined : c.id)}
                  >
                    <Text style={[styles.chipText, active && styles.chipTextActive]}>{c.label} • {c.powerKw} kVt</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.sectionLabel}>Sana va vaqt</Text>
        <View style={styles.row2}>
          <TouchableOpacity style={styles.pickerButton} activeOpacity={0.8} onPress={() => setPickerMode('date')}>
            <Calendar size={16} color={colors.primary} />
            <Text style={styles.pickerText}>{dateTime.toLocaleDateString('uz-UZ', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.pickerButton} activeOpacity={0.8} onPress={() => setPickerMode('time')}>
            <Clock size={16} color={colors.primary} />
            <Text style={styles.pickerText}>{dateTime.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' })}</Text>
          </TouchableOpacity>
        </View>

        {pickerMode && (
          <DateTimePicker
            value={dateTime}
            mode={pickerMode}
            minimumDate={new Date()}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, selected) => {
              setPickerMode(null);
              if (event.type === 'set' && selected) {
                setDateTime((prev) => {
                  const next = new Date(prev);
                  if (pickerMode === 'date') {
                    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
                  } else {
                    next.setHours(selected.getHours(), selected.getMinutes());
                  }
                  return next;
                });
              }
            }}
          />
        )}

        <Text style={styles.sectionLabel}>Davomiyligi</Text>
        <View style={styles.chipRow}>
          {DURATIONS.map((d) => {
            const active = duration === d;
            return (
              <TouchableOpacity
                key={d}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
                onPress={() => setDuration(d)}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{formatDuration(d)}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionLabel}>Bron xulosasi</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Taxminiy energiya</Text>
            <Text style={styles.summaryValue}>{estimatedKwh.toFixed(1)} kVt-soat</Text>
          </View>
          <View style={styles.summaryRow}>
            <Zap size={14} color={colors.accent} fill={colors.accent} />
            <Text style={[styles.summaryLabel, { flex: 1, marginLeft: 6 }]}>Taxminiy narx</Text>
            <Text style={[styles.summaryValue, { color: colors.accent }]}>{formatSom(estimatedCost)} so'm</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.md }]}>
        <PrimaryButton label="Bron qilish" loading={submitting} onPress={handleConfirm} />
      </View>
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bgPrimary },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.sm,
    },
    iconButton: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      backgroundColor: colors.bgSecondary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.semibold,
    },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    stationCard: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.lg,
      ...shadow.sm,
    },
    stationName: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
    stationAddress: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    sectionLabel: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      marginBottom: spacing.sm,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    chipTextActive: { color: colors.textPrimary, fontFamily: typography.fontFamily.semibold },
    row2: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg },
    pickerButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      height: 48,
    },
    pickerText: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    summaryCard: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      ...shadow.sm,
    },
    summaryRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.xs },
    summaryLabel: { color: colors.textSecondary, fontSize: typography.size.sm },
    summaryValue: {
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
      marginLeft: 'auto',
    },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.bgPrimary,
    },
    confirmButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
  });
