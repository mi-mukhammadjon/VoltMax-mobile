import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Station, ChargingSession, WalletBalance } from '@/types';

const MAX_RECENT_SEARCHES = 6;

interface AppState {
  stations: Station[];
  activeSession: ChargingSession | null;
  walletBalance: WalletBalance | null;
  favoriteStationIds: string[];
  /** Qidiruv ekranidagi "So'nggi qidiruvlar" chip'lari (faqat xotirada) */
  recentSearches: string[];
  /** Stansiyalar oxirgi marta qachon serverdan olingani (ms) */
  stationsSyncedAt: number | null;
  /** Kutilayotgan to'lov buyurtmasi — ilova to'lov sahifasiga o'tganda */
  pendingOrderId: number | null;

  setStations: (stations: Station[]) => void;
  setActiveSession: (session: ChargingSession | null) => void;
  setWalletBalance: (balance: WalletBalance) => void;
  setPendingOrder: (orderId: number | null) => void;
  toggleFavoriteStation: (stationId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
  stations: [],
  activeSession: null,
  walletBalance: null,
  favoriteStationIds: [],
  recentSearches: [],
  stationsSyncedAt: null,
  pendingOrderId: null,

  setStations: (stations) => set({ stations, stationsSyncedAt: Date.now() }),
  setActiveSession: (session) => set({ activeSession: session }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
  setPendingOrder: (pendingOrderId) => set({ pendingOrderId }),
  toggleFavoriteStation: (stationId) =>
    set((state) => ({
      favoriteStationIds: state.favoriteStationIds.includes(stationId)
        ? state.favoriteStationIds.filter((id) => id !== stationId)
        : [...state.favoriteStationIds, stationId],
    })),
  addRecentSearch: (query) =>
    set((state) => ({
      // Takrorlanganda eskisi olib tashlanadi — so'rov ro'yxat boshiga chiqadi
      recentSearches: [query, ...state.recentSearches.filter((q) => q !== query)].slice(
        0,
        MAX_RECENT_SEARCHES
      ),
    })),
  clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: 'voltmax-app',
      storage: createJSONStorage(() => AsyncStorage),
      /* Nima saqlanadi va NIMA UCHUN:

         `favoriteStationIds` — ilgari faqat xotirada edi va ilova
         yopilganda sevimlilar YO'QOLARDI. Bu shunchaki xato edi.

         `stations` va `walletBalance` — aloqa yo'q paytda ekran bo'sh
         qolmasin. Zaryadlash stansiyalari ko'pincha yerto'la
         parkovkada bo'ladi va u yerda aloqa yomon; eski ma'lumot
         hech narsadan yaxshiroq, faqat u eskiligi aytilishi kerak
         (`stationsSyncedAt`).

         `activeSession` SAQLANMAYDI: u tez o'zgaradi va eskisini
         ko'rsatish chalg'itadi — foydalanuvchi tugagan sessiyani
         ketayotgan deb o'ylardi. */
      partialize: (state) => ({
        favoriteStationIds: state.favoriteStationIds,
        stations: state.stations,
        walletBalance: state.walletBalance,
        stationsSyncedAt: state.stationsSyncedAt,
        /* To'lov buyurtmasi HAM saqlanadi: foydalanuvchi to'lash uchun
           brauzerga o'tadi va tizim shu paytda ilovani xotiradan
           chiqarib yuborishi mumkin (Android'da odatiy hol). Ilgari
           buyurtma raqami faqat ekran holatida edi va yo'qolardi —
           odam qaytganda tasdiqni umuman ko'rmasdi va to'lov
           o'tmagan deb o'ylardi. */
        pendingOrderId: state.pendingOrderId,
      }),
    }
  )
);
