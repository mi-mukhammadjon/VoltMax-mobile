import { useAlertStore, AlertButtonConfig, AlertVariant } from '@/store/useAlertStore';

// React Native'ning Alert.alert(title, message, buttons) o'rniga ishlatiladi — bir xil
// imzo, lekin bizning navy/electric-blue/mint temamizga mos custom modal ko'rsatadi
// (ko'rinishi App.tsx'dagi <CustomAlert />). Hook emas — istalgan joydan (catch, callback)
// chaqirish mumkin.
export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButtonConfig[],
  variant: AlertVariant = 'info'
) {
  useAlertStore.getState().show(title, message, buttons, variant);
}
