// VoltMax brend rang tokenlari
// Dizayn: chuqur navy fon + elektr-ko'k va mint-yashil akcentlar

export const colors = {
  // Fon ranglari
  bgPrimary: '#0B1220',      // chuqur navy - asosiy fon
  bgSecondary: '#141C2E',    // karta/panel foni
  bgElevated: '#1C2740',     // ko'tarilgan elementlar (modal, sheet)

  // Akcent ranglar
  electricBlue: '#3B82F6',
  mintGreen: '#34D9A8',

  // Gradient juftliklari (LinearGradient uchun)
  gradientPrimary: ['#3B82F6', '#34D9A8'] as const,

  // Status ranglari
  statusAvailable: '#34D9A8',  // stansiya bo'sh
  statusBusy: '#F5B942',       // stansiya band
  statusOffline: '#6B7280',    // stansiya ishlamayapti
  statusError: '#EF4444',

  // Matn
  textPrimary: '#F5F7FA',
  textSecondary: '#9AA5B8',
  textMuted: '#5B6478',

  // Border/divider
  border: '#252F45',
} as const;

export type ColorToken = keyof typeof colors;
