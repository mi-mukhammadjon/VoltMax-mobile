import { colors as darkColors, ColorPalette } from './colors';
import { lightColors } from './colorsLight';
import { useActiveScheme } from '@/store/useThemeStore';

// Ekran/komponentlar shu hook orqali amaldagi mavzuning rang palitrasini oladi
// (colors.ts'ni to'g'ridan-to'g'ri import qilish o'rniga) — shunda light/dark almashtirilganda
// komponent qayta render bo'lib, to'g'ri ranglarni ko'rsatadi.
export function useThemeColors(): ColorPalette {
  const scheme = useActiveScheme();
  return scheme === 'light' ? lightColors : darkColors;
}
