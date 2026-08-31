// VoltMax tipografiya tokenlari
// Shrift: Manrope — @expo-google-fonts/manrope orqali App.tsx'da useFonts bilan ulangan
// (Proxima Nova'ning bepul, litsenziyasiz muqobili sifatida tanlandi)

export const typography = {
  fontFamily: {
    regular: 'Manrope-Regular',
    medium: 'Manrope-Medium',
    semibold: 'Manrope-SemiBold',
    bold: 'Manrope-Bold',
  },
  size: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 22,
    xxl: 28,
    display: 36,
  },
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
} as const;
