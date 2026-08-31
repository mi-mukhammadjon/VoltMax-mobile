import { create } from 'zustand';
import { Appearance, ColorSchemeName } from 'react-native';

export type ThemeMode = 'system' | 'light' | 'dark';
export type Scheme = 'light' | 'dark';

interface ThemeState {
  mode: ThemeMode;
  systemScheme: Scheme;
  setMode: (mode: ThemeMode) => void;
}

function normalizeScheme(scheme: ColorSchemeName): Scheme {
  return scheme === 'light' ? 'light' : 'dark';
}

export const useThemeStore = create<ThemeState>((set) => {
  Appearance.addChangeListener(({ colorScheme }) => {
    set({ systemScheme: normalizeScheme(colorScheme) });
  });

  return {
    mode: 'system',
    systemScheme: normalizeScheme(Appearance.getColorScheme()),
    setMode: (mode) => set({ mode }),
  };
});

// Foydalanuvchi tanlovi ('system' bo'lsa qurilma sozlamasi) asosida amaldagi sxemani qaytaradi
export function useActiveScheme(): Scheme {
  return useThemeStore((s) => (s.mode === 'system' ? s.systemScheme : s.mode));
}
