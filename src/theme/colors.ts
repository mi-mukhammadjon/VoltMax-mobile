// VoltMax brend rang tokenlari — TUNGI (dark) palitra
// Dizayn tili: Prime EV — yashil asosiy rang, tekis kartalar, nozik chegaralar

export interface ColorPalette {
  bgPrimary: string;
  bgSecondary: string;
  bgElevated: string;

  primary: string;
  /** primary'ning och/shaffof varianti — aktiv tab, badge, yumshoq fonlar uchun */
  primarySoft: string;
  accent: string;
  gradientPrimary: readonly [string, string];

  statusAvailable: string;
  statusBusy: string;
  statusOffline: string;
  statusError: string;

  textPrimary: string;
  textSecondary: string;
  textMuted: string;

  border: string;
}

export const colors: ColorPalette = {
  // Fon ranglari
  bgPrimary: '#0E1512',      // chuqur yashil-qora - asosiy fon
  bgSecondary: '#161E1A',    // karta/panel foni
  bgElevated: '#1E2823',     // ko'tarilgan elementlar (modal, sheet, input)

  // Akcent ranglar
  primary: '#2BB24C',
  primarySoft: 'rgba(43,178,76,0.18)',
  accent: '#43D06A',

  // Gradient juftliklari (LinearGradient uchun)
  gradientPrimary: ['#2BB24C', '#43D06A'],

  // Status ranglari
  statusAvailable: '#2BB24C',  // stansiya bo'sh
  statusBusy: '#F5B942',       // stansiya band
  statusOffline: '#6B7280',    // stansiya ishlamayapti
  statusError: '#E5484D',

  // Matn
  textPrimary: '#F2F5F3',
  textSecondary: '#9BA8A1',
  textMuted: '#6B7873',

  // Border/divider
  border: '#26312B',
};

export type ColorToken = keyof ColorPalette;
