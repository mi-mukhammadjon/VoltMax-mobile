import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, User } from 'lucide-react-native';
import { RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, useThemeColors, ColorPalette } from '@/theme';
import { AuthAPI } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { showAlert } from '@/services/alert';

type NavProp = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const phone = useAuthStore((s) => s.phone);
  const setStoredName = useAuthStore((s) => s.setName);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    AuthAPI.getProfile()
      .then((res) => {
        setName(res.data.name ?? '');
        setStoredName(res.data.name ?? null);
      })
      .catch(() => showAlert('Xatolik', "Profilni yuklab bo'lmadi", undefined, 'error'))
      .finally(() => setLoading(false));
  }, [setStoredName]);

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await AuthAPI.updateProfile(name.trim());
      // Bosh ekrandagi salomlashuv darhol yangilanishi uchun
      setStoredName(name.trim());
      showAlert('Saqlandi', 'Profil ma\'lumotlari yangilandi.', undefined, 'success');
      navigation.goBack();
    } catch (err) {
      showAlert('Xatolik', "Profilni saqlab bo'lmadi", undefined, 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <ArrowLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profilni tahrirlash</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.avatar}>
            <User size={32} color={colors.textSecondary} />
          </View>

          <Text style={styles.label}>Ism</Text>
          <TextInput
            style={styles.input}
            placeholder="Ismingizni kiriting"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            maxLength={150}
          />

          <Text style={styles.label}>Telefon raqam</Text>
          <View style={styles.phoneRow}>
            <Text style={styles.phoneText}>+{phone?.replace(/^\+/, '')}</Text>
            <Text style={styles.phoneHint}>O'zgartirib bo'lmaydi</Text>
          </View>

          <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleSave} disabled={saving}>
            {saving ? (
              <ActivityIndicator color={colors.bgPrimary} />
            ) : (
              <Text style={styles.saveButtonText}>Saqlash</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
    },
    backButton: {
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
    loadingWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    content: {
      padding: spacing.lg,
    },
    avatar: {
      width: 76,
      height: 76,
      borderRadius: radius.pill,
      backgroundColor: colors.bgSecondary,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.xl,
    },
    label: {
      color: colors.textSecondary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.bgSecondary,
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
    phoneRow: {
      backgroundColor: colors.bgElevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      height: 52,
      justifyContent: 'center',
      marginBottom: spacing.xl,
    },
    phoneText: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.medium,
    },
    phoneHint: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    saveButton: {
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    saveButtonText: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.semibold,
    },
  });
