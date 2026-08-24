import { Station } from '@/types';

// Vaqtinchalik mock data — backend tayyor bo'lguncha xaritani sinash uchun
// TODO: StationsAPI.list() bilan almashtiriladi

export const mockStations: Station[] = [
  {
    id: 'st-001',
    name: 'VoltMax Chilonzor',
    address: 'Chilonzor tumani, Bunyodkor shoh ko\u02bbchasi 12',
    latitude: 41.2856,
    longitude: 69.2034,
    chargerType: 'DC',
    powerKw: 160,
    pricePerKwh: 1900,
    originalPricePerKwh: 2350,
    status: 'available',
    rating: 4.8,
    distanceKm: 0.02,
    etaMinutes: 1,
    connectors: [
      { id: 'c-001-a', label: 'A', type: 'DC', powerKw: 80, status: 'charging', chargingPercent: 97 },
      { id: 'c-001-b', label: 'B', type: 'DC', powerKw: 80, status: 'available' },
    ],
    amenities: [
      { icon: 'oil', title: 'Bepul moy almashtirish', subtitle: 'Mukofot' },
    ],
  },
  {
    id: 'st-002',
    name: 'VoltMax Yunusobod',
    address: 'Yunusobod tumani, Amir Temur shoh ko\u02bbchasi 45',
    latitude: 41.3453,
    longitude: 69.2879,
    chargerType: 'AC',
    powerKw: 20,
    pricePerKwh: 1900,
    originalPricePerKwh: 2350,
    status: 'busy',
    rating: 4.5,
    distanceKm: 0.02,
    etaMinutes: 1,
    connectors: [
      { id: 'c-002-a', label: 'A', type: 'AC', powerKw: 20, status: 'charging', chargingPercent: 62 },
      { id: 'c-002-b', label: 'B', type: 'AC', powerKw: 20, status: 'offline' },
    ],
  },
  {
    id: 'st-003',
    name: 'VoltMax Mirzo Ulug\u02bbbek',
    address: 'Mirzo Ulug\u02bbbek tumani, Universitet ko\u02bbchasi 4',
    latitude: 41.3306,
    longitude: 69.3308,
    chargerType: 'DC',
    powerKw: 120,
    pricePerKwh: 1900,
    originalPricePerKwh: 2350,
    status: 'available',
    rating: 4.9,
    distanceKm: 0.02,
    etaMinutes: 1,
    connectors: [
      { id: 'c-003-a', label: 'A', type: 'DC', powerKw: 120, status: 'available' },
    ],
  },
  {
    id: 'st-004',
    name: 'VoltMax Sergeli',
    address: 'Sergeli tumani, Qoshtepa ko\u02bbchasi 7',
    latitude: 41.2264,
    longitude: 69.2401,
    chargerType: 'AC',
    powerKw: 22,
    pricePerKwh: 1800,
    status: 'offline',
    rating: 4.2,
    distanceKm: 0.9,
    etaMinutes: 6,
    connectors: [
      { id: 'c-004-a', label: 'A', type: 'AC', powerKw: 22, status: 'offline' },
    ],
  },
];
