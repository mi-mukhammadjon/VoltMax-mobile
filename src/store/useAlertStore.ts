import { create } from 'zustand';

export type AlertVariant = 'info' | 'success' | 'error' | 'warning';

export interface AlertButtonConfig {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButtonConfig[];
  variant: AlertVariant;
  show: (title: string, message?: string, buttons?: AlertButtonConfig[], variant?: AlertVariant) => void;
  hide: () => void;
}

// Global alert holati — App.tsx'da bitta marta <CustomAlert /> render qilinadi,
// istalgan joydan (hook shart emas) src/services/alert.ts orqali chaqiriladi.
export const useAlertStore = create<AlertState>((set) => ({
  visible: false,
  title: '',
  message: undefined,
  buttons: [],
  variant: 'info',
  show: (title, message, buttons, variant = 'info') =>
    set({
      visible: true,
      title,
      message,
      buttons: buttons && buttons.length > 0 ? buttons : [{ text: 'OK' }],
      variant,
    }),
  hide: () => set({ visible: false }),
}));
