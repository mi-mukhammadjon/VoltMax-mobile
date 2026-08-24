import { create } from 'zustand';
import { Station, ChargingSession, WalletBalance } from '@/types';

interface AppState {
  stations: Station[];
  activeSession: ChargingSession | null;
  walletBalance: WalletBalance | null;

  setStations: (stations: Station[]) => void;
  setActiveSession: (session: ChargingSession | null) => void;
  setWalletBalance: (balance: WalletBalance) => void;
}

export const useAppStore = create<AppState>((set) => ({
  stations: [],
  activeSession: null,
  walletBalance: null,

  setStations: (stations) => set({ stations }),
  setActiveSession: (session) => set({ activeSession: session }),
  setWalletBalance: (balance) => set({ walletBalance: balance }),
}));
