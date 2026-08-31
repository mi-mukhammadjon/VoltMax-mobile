export type ChargerType = 'AC' | 'DC';

export type StationStatus = 'available' | 'busy' | 'offline';

// 'reserved' — bron bo'yicha qurilma darajasida ushlab turilgan: ulagich
// jismonan bo'sh, lekin faqat bron egasi boshlay oladi (OCPP ReserveNow).
export type ConnectorStatus = 'available' | 'charging' | 'reserved' | 'offline';

export interface Connector {
  id: string;
  label: string; // "A", "B"
  type: ChargerType;
  powerKw: number;
  status: ConnectorStatus;
  chargingPercent?: number; // status === 'charging' bo'lsa

  // Quyidagilar ixtiyoriy — backend yubormasa UI ularsiz ham to'g'ri ishlaydi.
  /** Zaryadlash tugagan, lekin avtomobil hali ulagichni bo'shatmagan: parkovka
   *  hisoblanmoqda. Bu holatda `status` hamon 'charging' bo'lib qoladi. */
  parkingMode?: boolean;
  /** Parkovka rejimidagi daqiqa narxi (so'm) */
  parkingFeePerMin?: number;
  /** Parkovka rejimi necha daqiqadan beri davom etmoqda */
  parkingMinutes?: number;
  /** Band ulagich taxminan necha daqiqada bo'shaydi */
  estimatedFreeInMinutes?: number;
  /** status === 'offline' bo'lganda sababi (backend bergan matn) */
  offlineReason?: string;
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
  reviewCount?: number;
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

  // Pullik parkovka (zaryad tugagan, avtomobil hali ulagichda). `costSoFar`
  // UMUMIY summa — energiya + parkovka; quyidagilar uni ajratib ko'rsatish uchun.
  energyCost?: number;
  parkingMinutes?: number;
  parkingCost?: number;
  /** Parkovkaning allaqachon hamyondan yechilgan qismi (daqiqalik hisob) */
  parkingPaid?: number;
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

export interface SessionHistoryItem {
  id: string;
  stationName: string;
  connectorLabel: string;
  date: string; // ISO
  kwhCharged: number;
  cost: number; // so'mda
  durationMinutes: number;
  startPercent: number;
  endPercent: number;
}

export interface Vehicle {
  id: string;
  name: string;
  make?: string;
  model?: string;
  year?: number;
  batteryCapacityKwh?: number;
  /** Kuzov raqami — 17 belgi. Zaryadlash sessiyasi tarixiga ham yoziladi. */
  vin?: string;
  isDefault: boolean;
}

/** Zaryadlashni boshlash uchun RFID karta (operator biriktiradi) */
export interface RfidCard {
  id: string;
  idTag: string;
  label: string;
  status: 'active' | 'blocked' | 'pending';
  companyName?: string | null;
  lastUsedAt?: string | null;
  useCount: number;
  isBlocked: boolean;
  /** Operator bloklagan kartani foydalanuvchi ocha olmaydi */
  canUnblock: boolean;
}

export interface StationReview {
  id: string;
  userName: string;
  rating: number;
  comment: string;
  createdAt: string; // ISO
}

export type BookingStatus = 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  stationId: string;
  stationName: string;
  stationAddress: string;
  connectorId?: string;
  connectorLabel?: string;
  scheduledAt: string; // ISO
  durationMinutes: number;
  estimatedCost: number; // so'mda
  status: BookingStatus;
  createdAt: string; // ISO
}

/** Serverdan keladigan bildirishnoma (panel yoki tizim yozadi) */
export type ServerNotificationKind = 'station_down' | 'station_up' | 'system';

export interface ServerNotification {
  id: string;
  kind: ServerNotificationKind;
  title: string;
  body: string;
  stationId?: number | null;
  stationName?: string | null;
  createdAt: string; // ISO
  isRead: boolean;
}

export interface SessionInsights {
  totalSessions: number;
  totalKwh: number;
  totalSpent: number;
  avgCostPerSession: number;
  avgKwhPerSession: number;
  savedVsGasoline: number;
  co2SavedKg: number;
}
