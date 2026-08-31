import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, CommonActions, CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ChevronRight,
  User,
  Monitor,
  Sun,
  Moon,
  LogOut,
  Trash2,
  UserCog,
  Wallet as WalletIcon,
  CalendarClock,
  Car,
  CreditCard,
  History as HistoryIcon,
  Bell,
  Info,
  Plus,
} from 'lucide-react-native';
import { MainTabParamList, RootStackParamList } from '@/navigation/types';
import { typography, spacing, radius, shadow, useThemeColors, ColorPalette } from '@/theme';
import { useThemeStore, ThemeMode } from '@/store/useThemeStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { showAlert } from '@/services/alert';
import { AuthAPI, AvatarAPI } from '@/services/api';
import Card from '@/components/Card';
import { formatSom } from '@/utils/money';

// Ekran: Profil — avatar bloki, hamyon qatori, ikonkali menyu guruhlari
// (hisob / faoliyat / sozlamalar), mavzu tanlovi va xavfli amallar.

type NavProp = CompositeNavigationProp<
  BottomTabNavigationProp<MainTabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

const modeOptions: { mode: ThemeMode; label: string; icon: typeof Monitor }[] = [
  { mode: 'system', label: 'Tizim', icon: Monitor },
  { mode: 'light', label: "Yorug'", icon: Sun },
  { mode: 'dark', label: 'Tungi', icon: Moon },
];

interface MenuItem {
  label: string;
  screen: keyof RootStackParamList;
  icon: typeof UserCog;
}

const MENU_GROUPS: { title: string; items: MenuItem[] }[] = [
  {
    title: 'Hisob',
    items: [
      { label: 'Profilni tahrirlash', screen: 'EditProfile', icon: UserCog },
      { label: 'Transport vositalarim', screen: 'MyVehicles', icon: Car },
      { label: 'Mening kartalarim', screen: 'MyRfidCards', icon: CreditCard },
    ],
  },
  {
    title: 'Faoliyat',
    items: [
      { label: 'Bronlarim', screen: 'MyBookings', icon: CalendarClock },
      { label: 'Sessiyalar tarixi', screen: 'History', icon: HistoryIcon },
    ],
  },
  {
    title: 'Sozlamalar',
    items: [
      { label: 'Bildirishnomalar', screen: 'NotificationSettings', icon: Bell },
      { label: 'Ilova haqida', screen: 'AboutApp', icon: Info },
    ],
  },
];

export default function ProfileScreen() {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const mode = useThemeStore((s) => s.mode);
  const setMode = useThemeStore((s) => s.setMode);
  const phone = useAuthStore((s) => s.phone);
  const name = useAuthStore((s) => s.name);
  const avatarUrl = useAuthStore((s) => s.avatarUrl);
  const setAvatarUrl = useAuthStore((s) => s.setAvatarUrl);
  const [uploading, setUploading] = useState(false);
  const logout = useAuthStore((s) => s.logout);
  const walletBalance = useAppStore((s) => s.walletBalance);

  /**
   * Galereyadan rasm tanlab, serverga yuklaydi.
   *
   * Rasm SERVERDA kichraytiriladi, shuning uchun bu yerda faqat qirqish
   * so'raladi: foydalanuvchi qaysi qismi ko'rinishini o'zi tanlasin.
   * Sifatni ham biroz tushiramiz — 4-8 MB lik surat mobil internetda
   * uzoq yuklanardi.
   */
  const handleAvatarPress = async () => {
    if (uploading) return;

    // Ruxsat so'raladi. Rad etilsa sabab aytiladi: "hech narsa
    // bo'lmadi" degan holat foydalanuvchini chalg'itadi.
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert(
        'Ruxsat kerak',
        "Rasm tanlash uchun galereyaga kirishga ruxsat bering",
        undefined,
        'error'
      );
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (picked.canceled || !picked.assets?.length) return;

    setUploading(true);
    try {
      const res = await AvatarAPI.upload(picked.assets[0].uri);
      setAvatarUrl(res.data?.avatarUrl ?? null);
    } catch (err: any) {
      showAlert(
        'Xatolik',
        err?.response?.data?.detail || "Rasmni yuklab bo'lmadi",
        undefined,
        'error'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveAvatar = () => {
    showAlert("Rasmni o'chirish", 'Profil rasmi olib tashlansinmi?', [
      { text: 'Bekor qilish', style: 'cancel' },
      {
        text: "O'chirish",
        style: 'destructive',
        onPress: async () => {
          try {
            await AvatarAPI.remove();
            setAvatarUrl(null);
          } catch {
            showAlert('Xatolik', "O'chirib bo'lmadi", undefined, 'error');
          }
        },
      },
    ]);
  };

  const handleLogout = () => {
    showAlert(
      'Chiqish',
      'Hisobingizdan chiqmoqchimisiz?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'Chiqish',
          style: 'destructive',
          onPress: () => {
            logout();
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
          },
        },
      ],
      'warning'
    );
  };

  const handleDeleteAccount = () => {
    showAlert(
      "Profilni o'chirish",
      "Hisobingiz va unga bog'liq barcha ma'lumotlar (hamyon, tarix) butunlay o'chiriladi. Bu amalni ortga qaytarib bo'lmaydi.",
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: "O'chirish",
          style: 'destructive',
          onPress: async () => {
            try {
              await AuthAPI.deleteProfile();
            } catch (err) {
              showAlert('Xatolik', "Profilni o'chirib bo'lmadi", undefined, 'error');
              return;
            }
            logout();
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Login' }] }));
          },
        },
      ],
      'warning'
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing.sm }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Profil</Text>
        <TouchableOpacity
          style={styles.logoutLink}
          activeOpacity={0.7}
          onPress={handleLogout}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <LogOut size={15} color={colors.statusError} />
          <Text style={styles.logoutLinkText}>Chiqish</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.identity}>
        {/* Rasmga bosilganda galereya ochiladi. Alohida «Yuklash»
            tugmasi ortiqcha qadam bo'lardi — rasmning o'ziga bosish
            odatiy naqsh. */}
        <TouchableOpacity
          style={styles.avatar}
          onPress={handleAvatarPress}
          disabled={uploading}
          activeOpacity={0.8}
        >
          {uploading ? (
            <ActivityIndicator color={colors.primary} />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <User size={30} color={colors.primary} />
          )}
          {!uploading && (
            <View style={styles.avatarBadge}>
              <Plus size={12} color={colors.bgPrimary} />
            </View>
          )}
        </TouchableOpacity>
        <Text style={styles.name}>{name ?? phone ?? 'Foydalanuvchi'}</Text>
        {/* Ism qo'yilgan bo'lsa pastda telefon raqami, aks holda umumiy yozuv */}
        <Text style={styles.subtitle}>{(name && phone) || 'VoltMax hisobi'}</Text>
        {!!avatarUrl && (
          <TouchableOpacity onPress={handleRemoveAvatar} hitSlop={8}>
            <Text style={styles.avatarRemove}>Rasmni o'chirish</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Hamyon qatori — balans va tezkor to'ldirish */}
      <Card onPress={() => navigation.navigate('Wallet')} style={styles.walletCard}>
        <View style={styles.walletIcon}>
          <WalletIcon size={19} color={colors.primary} />
        </View>
        <View style={styles.walletText}>
          <Text style={styles.walletLabel}>Hamyon balansi</Text>
          <Text style={styles.walletAmount}>
            {formatSom((walletBalance?.amount ?? 0))} so'm
          </Text>
        </View>
        <View style={styles.walletAction}>
          <Plus size={14} color="#FFFFFF" />
          <Text style={styles.walletActionText}>To'ldirish</Text>
        </View>
      </Card>

      {MENU_GROUPS.map((group) => (
        <View key={group.title} style={styles.group}>
          <Text style={styles.groupTitle}>{group.title}</Text>
          <View style={styles.menuCard}>
            {group.items.map((item, idx) => (
              <TouchableOpacity
                key={item.screen}
                style={[styles.row, idx > 0 && styles.rowDivided]}
                activeOpacity={0.6}
                onPress={() => navigation.navigate(item.screen as never)}
              >
                <View style={styles.rowIcon}>
                  <item.icon size={16} color={colors.primary} />
                </View>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <ChevronRight size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

      <Text style={styles.groupTitle}>Mavzu</Text>
      <View style={styles.modeRow}>
        {modeOptions.map(({ mode: optionMode, label, icon: Icon }) => {
          const active = mode === optionMode;
          return (
            <TouchableOpacity
              key={optionMode}
              style={[styles.modeOption, active && styles.modeOptionActive]}
              activeOpacity={0.8}
              onPress={() => setMode(optionMode)}
            >
              <Icon size={16} color={active ? '#FFFFFF' : colors.textSecondary} />
              <Text style={[styles.modeOptionText, active && styles.modeOptionTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={styles.deleteRow} activeOpacity={0.7} onPress={handleDeleteAccount}>
        <Trash2 size={16} color={colors.statusError} />
        <Text style={styles.deleteText}>Profilni o'chirish</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bgPrimary,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    screenTitle: {
      color: colors.textPrimary,
      fontSize: typography.size.xl,
      fontFamily: typography.fontFamily.bold,
    },
    logoutLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    logoutLinkText: {
      color: colors.statusError,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.semibold,
    },
    identity: {
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.lg,
    },
    avatar: {
      width: 78,
      height: 78,
      borderRadius: radius.pill,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
      // Rasm doiradan chiqib ketmasin
      overflow: 'hidden',
    },
    avatarImage: { width: '100%', height: '100%' },
    // Kichik belgi: rasm qo'yish MUMKINligini bildiradi. Usiz avatar
    // shunchaki bezak bo'lib ko'rinardi va hech kim bosmasdi.
    avatarBadge: {
      position: 'absolute',
      right: 2,
      bottom: 2,
      width: 22,
      height: 22,
      borderRadius: radius.pill,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarRemove: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
      textDecorationLine: 'underline',
      marginTop: spacing.xs,
    },
    name: {
      color: colors.textPrimary,
      fontSize: typography.size.lg,
      fontFamily: typography.fontFamily.bold,
    },
    subtitle: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
      marginTop: 2,
    },
    walletCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      ...shadow.card,
    },
    walletIcon: {
      width: 40,
      height: 40,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    walletText: {
      flex: 1,
    },
    walletLabel: {
      color: colors.textMuted,
      fontSize: typography.size.xs,
    },
    walletAmount: {
      color: colors.textPrimary,
      fontSize: typography.size.base,
      fontFamily: typography.fontFamily.bold,
      marginTop: 1,
    },
    walletAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    walletActionText: {
      color: '#FFFFFF',
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
    },
    group: {
      marginTop: spacing.lg,
    },
    groupTitle: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.semibold,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    menuCard: {
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
      ...shadow.card,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      paddingVertical: 13,
    },
    rowDivided: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rowIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      flex: 1,
      color: colors.textPrimary,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
    modeRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    modeOption: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.bgSecondary,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: spacing.sm,
    },
    modeOptionActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    modeOptionText: {
      color: colors.textSecondary,
      fontSize: typography.size.xs,
      fontFamily: typography.fontFamily.medium,
    },
    modeOptionTextActive: {
      color: '#FFFFFF',
      fontFamily: typography.fontFamily.semibold,
    },
    deleteRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginTop: spacing.xl,
      paddingVertical: spacing.sm,
    },
    deleteText: {
      color: colors.statusError,
      fontSize: typography.size.sm,
      fontFamily: typography.fontFamily.medium,
    },
  });
