import { Platform } from 'react-native';
import { colors, ColorPalette } from './colors';
import { lightColors } from './colorsLight';
import { typography } from './typography';
import { darkMapStyle, lightMapStyle, useMapStyle } from './mapStyle';
import { useThemeColors } from './useThemeColors';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  /** asosiy CTA tugmalari — Prime EV'da tugmalar pill emas, yumshoq to'rtburchak */
  btn: 10,
  pill: 999,
} as const;

// Prime EV dizayn tilida kartalar TEKIS: ularni fondan soya emas, nozik chegara
// ajratib turadi. Shu sabab card/sm soyalari deyarli ko'rinmas darajada nozik.
// Haqiqatan "suzuvchi" elementlar (FAB, bottom sheet, modal) uchun `float`.
export const shadow = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 3,
    },
    android: { elevation: 0 },
    default: {},
  }),
  sm: Platform.select({
    ios: {},
    android: { elevation: 0 },
    default: {},
  }),
  float: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    android: { elevation: 6 },
    default: {},
  }),
} as const;

export const theme = {
  colors,
  typography,
  spacing,
  radius,
  shadow,
};

export type Theme = typeof theme;
export type { ColorPalette };
export {
  colors,
  lightColors,
  typography,
  darkMapStyle,
  lightMapStyle,
  useMapStyle,
  useThemeColors,
};
