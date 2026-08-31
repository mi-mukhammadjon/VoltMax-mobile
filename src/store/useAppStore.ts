import { create } from 'zustand';
import { Station, ChargingSession, WalletBalance } from '@/types';

const MAX_RECENT_SEARCHES = 6;

interface AppState {
  stations: Station[];
  activeSession: ChargingSession | null;
  walletBalance: WalletBalance | null;
  favoriteStationIds: string[];
  /** Qidiruv ekranidagi "So'nggi qidiruvlar" chip'lari (faqat xotirada) */
  recentSearches: string[];

  setStations: (stations: Station[]) => void;
  setActiveSession: (session: ChargingSession | null) => void;
  setWalletBalance: (balance: WalletBalance) => void;
  toggleFavoriteStation: (stationId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useAppStore = create<AppState>((set) => ({
  stations: [],
  activeSession: null,
  walletBalance: null,
  favoriteStationIds: [],
  recentSearches: [],

  setStations: (stations) => set({ stations }),
  setActiveSession: (session) => set({ activeSession: session }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
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
}));
