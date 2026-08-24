export type ChargerType = 'AC' | 'DC';

export type StationStatus = 'available' | 'busy' | 'offline';

export type ConnectorStatus = 'available' | 'charging' | 'offline';

export interface Connector {
  id: string;
  label: string; // "A", "B"
  type: ChargerType;
  powerKw: number;
  status: ConnectorStatus;
  chargingPercent?: number; // status === 'charging' bo'lsa
}

export interface StationAmenity {
  icon: 'oil' | 'wifi' | 'coffee' | 'lounge';
  title: string;
  subtitle: string;
}

export interface Station {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  chargerType: ChargerType;
  powerKw: number;
  pricePerKwh: number; // joriy (chegirmali) narx, so'mda
  originalPricePerKwh?: number; // chegirmagacha bo'lgan narx
  status: StationStatus;
  rating?: number;
  photoUrl?: string;
  distanceKm?: number;
  etaMinutes?: number;
  connectors?: Connector[];
  amenities?: StationAmenity[];
}

export interface ChargingSession {
  id: string;
  stationId: string;
  startedAt: string;
  status: 'charging' | 'completed' | 'stopped' | 'error';
  currentPercent: number;
  powerKw: number;
  elapsedSeconds: number;
  costSoFar: number; // so'mda

  // Live monitoring uchun qo'shimcha maydonlar
  remainingSeconds: number;
  kwhCharged: number;
  pricePerKwh: number;
  currentAmps: number;
  voltageV: number;
  parkingFeePerMin: number;
  connectorLabel: string; // masalan "A"
}

export interface WalletBalance {
  amount: number; // so'mda
  currency: 'UZS';
}

export interface Transaction {
  id: string;
  type: 'topup' | 'charge_payment';
  amount: number;
  createdAt: string;
  description: string;
}
