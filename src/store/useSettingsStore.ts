import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Bildirishnoma sozlamalari — hozircha faqat lokal ko'rinim (push infratuzilma
// hali ulanmagan), keyinchalik backend/push tokeniga bog'langanda shu store
// asosida kengaytiriladi.
interface SettingsState {
  sessionNotifications: boolean;
  promoNotifications: boolean;
  setSessionNotifications: (value: boolean) => void;
  setPromoNotifications: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      sessionNotifications: true,
      promoNotifications: true,
      setSessionNotifications: (value) => set({ sessionNotifications: value }),
      setPromoNotifications: (value) => set({ promoNotifications: value }),
    }),
    {
      name: 'voltmax-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
