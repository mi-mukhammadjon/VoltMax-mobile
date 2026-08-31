import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { unregisterPush } from '@/services/push';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  phone: string | null;
  /** Profilda kiritilgan ism. Bo'sh bo'lsa UI telefon raqamiga qaytadi. */
  name: string | null;
  hasHydrated: boolean;
  setTokens: (accessToken: string, refreshToken: string, phone: string) => void;
  setName: (name: string | null) => void;
  logout: () => void;
  setHasHydrated: (value: boolean) => void;
}

// Token AsyncStorage'da saqlanadi — foydalanuvchi "Chiqish"ni bosmaguncha
// ilova qayta ochilganda ham login/OTP qayta so'ralmaydi.
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      phone: null,
      name: null,
      hasHydrated: false,
      setTokens: (accessToken, refreshToken, phone) => set({ accessToken, refreshToken, phone }),
      // Bo'sh matn ham "ism yo'q" degani — UI ni bo'sh sarlavha bilan qoldirmaslik uchun
      setName: (name) => set({ name: name?.trim() ? name.trim() : null }),
      logout: () => {
        // Push manzili ham o'chiriladi: telefon boshqa odamga o'tsa, unga
        // avvalgi egasining xabarlari kelaverardi
        unregisterPush();
        set({ accessToken: null, refreshToken: null, phone: null, name: null });
      },
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: 'voltmax-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        phone: state.phone,
        name: state.name,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
