import type { ColorPalette } from './colors';

// VoltMax brend rang tokenlari — KUNDUZGI (light) palitra
// Prime EV uslubi: oq fon + oq kartalar, ajratuvchi rolni nozik chegara bajaradi (soya emas)

export const lightColors: ColorPalette = {
  // Fon ranglari — ekran ham, karta ham oq
  bgPrimary: '#FFFFFF',
  bgSecondary: '#FFFFFF',
  bgElevated: '#F5F6F7',     // input/chip to'ldirmasi

  // Akcent ranglar (brend rangi ikkala mavzuda ham bir xil)
  primary: '#22B04B',
  primarySoft: '#E8F6EC',    // aktiv tab pill foni
  accent: '#1B9942',

  gradientPrimary: ['#22B04B', '#1B9942'],

  // Status ranglari
  statusAvailable: '#22B04B',
  statusBusy: '#D97706',
  statusOffline: '#9AA0A6',
  statusError: '#E5484D',

  // Matn
  textPrimary: '#1A1D1B',
  textSecondary: '#6B7280',
  textMuted: '#9AA0A6',

  // Border/divider
  border: '#E8EAE9',
};
