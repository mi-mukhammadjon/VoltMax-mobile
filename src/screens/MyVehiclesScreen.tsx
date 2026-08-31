import React, { useCallback, useMemo, useState } from 'react';
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
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Plus, X, Car, Trash2, CheckCircle2 } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { VehiclesAPI } from '@/services/api';
import { Vehicle } from '@/types';
import ScreenHeader from '@/components/ScreenHeader';
import { showAlert } from '@/services/alert';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'MyVehicles'>;

export default function MyVehiclesScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [formVisible, setFormVisible] = useState(false);
  const [name, setName] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [battery, setBattery] = useState('');
  const [vin, setVin] = useState('');
  const [saving, setSaving] = useState(false);

  const loadVehicles = useCallback(() => {
    VehiclesAPI.list()
      .then((res) => setVehicles(res.data.results ?? res.data))
      .catch(() => showAlert('Xatolik', "Transport vositalarini yuklab bo'lmadi", undefined, 'error'))
      .finally(() => setLoading(false));
  }, []);

  useFocusEffect(useCallback(() => { loadVehicles(); }, [loadVehicles]));

  const resetForm = () => {
    setName('');
    setMake('');
    setModel('');
    setYear('');
    setBattery('');
    setVin('');
  };

  const handleAdd = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    try {
      await VehiclesAPI.create({
        name: name.trim(),
        make: make.trim() || undefined,
        model: model.trim() || undefined,
        year: year ? Number(year) : undefined,
        batteryCapacityKwh: battery ? Number(battery) : undefined,
        vin: vin.trim() || undefined,
        isDefault: vehicles.length === 0,
      });
      setFormVisible(false);
      resetForm();
      loadVehicles();
    } catch (err: any) {
      // Server VIN uzunligi/belgilari bo'yicha aniq sabab qaytaradi —
      // umumiy "qo'shib bo'lmadi" o'rniga o'shani ko'rsatamiz
      const detail = err?.response?.data?.vin?.[0];
      showAlert('Xatolik', detail || "Transport vositasini qo'shib bo'lmadi", undefined, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSetDefault = async (vehicle: Vehicle) => {
    if (vehicle.isDefault) return;
    try {
      await VehiclesAPI.update(vehicle.id, { isDefault: true });
      loadVehicles();
    } catch (err) {
      showAlert('Xatolik', "O'zgartirib bo'lmadi", undefined, 'error');
    }
  };

  const handleDelete = (vehicle: Vehicle) => {
    showAlert(
      "O'chirish",
      `"${vehicle.name}" ro'yxatdan o'chirilsinmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: async () => {
            try {
              await VehiclesAPI.remove(vehicle.id);
              loadVehicles();
            } catch (err) {
              showAlert('Xatolik', "O'chirib bo'lmadi", undefined, 'error');
            }
          },
        },
      ],
      'warning'
    );
  };

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="Transport vositalarim"
        right={
          <TouchableOpacity
            style={styles.addLink}
            activeOpacity={0.7}
            onPress={() => setFormVisible(true)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Plus size={15} color={colors.primary} />
            <Text style={styles.addLinkText}>Yangi</Text>
          </TouchableOpacity>
        }
      />

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={vehicles}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.85}
              onPress={() => handleSetDefault(item)}
            >
              <View style={styles.carIconWrap}>
                <Car size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.vehicleName}>{item.name}</Text>
                <Text style={styles.vehicleMeta}>
                  {[item.make, item.model, item.year].filter(Boolean).join(' ') || '—'}
                  {item.batteryCapacityKwh ? ` • ${item.batteryCapacityKwh} kVt-soat` : ''}
                  {item.vin ? ` • ${item.vin}` : ''}
                </Text>
              </View>
              {item.isDefault ? (
                <CheckCircle2 size={20} color={colors.accent} />
              ) : (
                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Trash2 size={18} color={colors.statusError} />
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <View style={styles.emptyIconWrap}>
                <Car size={28} color={colors.textMuted} />
              </View>
              <Text style={styles.emptyTitle}>Transport vositalari yo'q</Text>
              <Text style={styles.emptySubtitle}>Yangi qo'shish uchun yuqoridagi "+" tugmasini bosing</Text>
            </View>
          }
        />
      )}

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Yangi transport vositasi</Text>
              <TouchableOpacity onPress={() => setFormVisible(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <X size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Nomi (masalan: Kundalik mashinam)" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
            <View style={styles.row2}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Marka" placeholderTextColor={colors.textMuted} value={make} onChangeText={setMake} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Model" placeholderTextColor={colors.textMuted} value={model} onChangeText={setModel} />
            </View>
            <View style={styles.row2}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Yil" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={year} onChangeText={setYear} />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Batareya (kVt-soat)" placeholderTextColor={colors.textMuted} keyboardType="number-pad" value={battery} onChangeText={setBattery} />
            </View>
            {/* VIN — katta harflarda saqlanadi, avtomatik to'g'rilanadi */}
            <TextInput
              style={styles.input}
              placeholder="VIN (17 belgi, ixtiyoriy)"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={17}
              value={vin}
              onChangeText={(text) => setVin(text.toUpperCase())}
            />

            <TouchableOpacity style={[styles.saveButton, !name.trim() && styles.saveButtonDisabled]} activeOpacity={0.85} disabled={!name.trim() || saving} onPress={handleAdd}>
              {saving ? <ActivityIndicator color={colors.textPrimary} /> : <Text style={styles.saveButtonText}>Qo'shish</Text>}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
    headerTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.semibold,
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    listContent: { padding: spacing.lg, paddingBottom: spacing.xxl },
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      marginBottom: spacing.sm,
      ...shadow.sm,
    },
    carIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.bgElevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    vehicleName: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
    vehicleMeta: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    emptyWrap: { alignItems: 'center', paddingTop: spacing.xxl },
    emptyIconWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.md,
    },
    emptyTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.semibold,
      marginBottom: spacing.xs,
    },
    emptySubtitle: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      textAlign: 'center',
      paddingHorizontal: spacing.xl,
    },
    modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
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
    input: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.regular,
      paddingHorizontal: spacing.md,
      height: 52,
      marginBottom: spacing.md,
    },
    row2: { flexDirection: 'row', gap: spacing.sm },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    saveButtonDisabled: { backgroundColor: colors.bgElevated },
    saveButtonText: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
  });
