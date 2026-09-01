import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { createSplitStorage } from '@/services/secureStorage';
import { unregisterPush } from '@/services/push';
import { revokeSession } from '@/services/session';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  phone: string | null;
  /** Profilda kiritilgan ism. Bo'sh bo'lsa UI telefon raqamiga qaytadi. */
  name: string | null;
  /** Profil rasmi (to'liq manzil) — serverda saqlanadi */
  avatarUrl: string | null;
  hasHydrated: boolean;
  setTokens: (accessToken: string, refreshToken: string, phone: string) => void;
  // Token yangilanganda faqat `access` almashadi — telefon va ism
  // saqlanib qolishi kerak
  setAccessToken: (accessToken: string) => void;
  /** Token yangilangach ikkalasini ham saqlaydi (server rotatsiya qiladi) */
  setSession: (accessToken: string, refreshToken: string) => void;
  setName: (name: string | null) => void;
  setAvatarUrl: (url: string | null) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

// Token AsyncStorage'da saqlanadi — foydalanuvchi "Chiqish"ni bosmaguncha
// ilova qayta ochilganda ham login/OTP qayta so'ralmaydi.
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      refreshToken: null,
      phone: null,
      name: null,
      avatarUrl: null,
      hasHydrated: false,
      setTokens: (accessToken, refreshToken, phone) => set({ accessToken, refreshToken, phone }),
      setAccessToken: (accessToken) => set({ accessToken }),
      // Server har yangilashda YANGI refresh beradi va eskisini bekor
      // qiladi. Yangisi saqlanmasa foydalanuvchi bir soatdan keyin
      // tizimdan chiqib ketardi.
      setSession: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      // Bo'sh matn ham "ism yo'q" degani — UI ni bo'sh sarlavha bilan qoldirmaslik uchun
      setName: (name) => set({ name: name?.trim() ? name.trim() : null }),
      setAvatarUrl: (avatarUrl) => set({ avatarUrl }),
      logout: () => {
        // Push manzili ham o'chiriladi: telefon boshqa odamga o'tsa, unga
        // avvalgi egasining xabarlari kelaverardi
        unregisterPush();

        // Tokenni SERVERDA ham bekor qilamiz. Faqat telefondagi nusxani
        // o'chirish yetarli emas edi: `refresh` tokeni yana bir oy amal
        // qilaverardi va u oshkor bo'lsa to'xtatishning yo'li yo'q edi.
        //
        // Javob kutilmaydi: chiqish tarmoqqa bog'liq bo'lmasligi kerak —
        // internet yo'q joyda ham foydalanuvchi chiqa olishi shart.
        revokeSession(get().refreshToken);

        set({ accessToken: null, refreshToken: null, phone: null, name: null,
              avatarUrl: null });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'voltmax-auth',
      /* Tokenlar APPARAT himoyasida saqlanadi (iOS Keychain / Android
         Keystore), qolgani odatdagi joyda.

         Ilgari hammasi shifrlanmagan `AsyncStorage` da edi va
         `refreshToken` — o'ttiz kun amal qiladigan kalit — root
         qilingan telefonda, `adb backup` orqali yoki Google Drive
         zaxirasidan o'qib olinishi mumkin edi. */
      storage: createJSONStorage(() => createSplitStorage([
        'accessToken',
        'refreshToken',
      ])),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        phone: state.phone,
        name: state.name,
        avatarUrl: state.avatarUrl,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
