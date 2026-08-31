/**
 * Push xabarlar: telefonning manzilini serverga yozib qo'yish.
 *
 * Server xabarni bazaga yozadi, lekin ilova yopiq bo'lsa foydalanuvchi
 * undan bexabar qoladi. "Zaryad tugadi" yoki "stansiya ishlamayapti"
 * kabi xabarning qiymati esa aynan o'sha paytda yetib borishida.
 *
 * Token qurilmaga bog'liq va o'zgarishi mumkin (ilova qayta o'rnatilganda),
 * shuning uchun u har kirishda qayta yuboriladi.
 */
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { NotificationsAPI } from './api';

/** Ilova ochiq turganda ham xabar ko'rinsin */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

let registeredToken: string | null = null;

/**
 * Ruxsat so'raydi, tokenni oladi va serverga yuboradi.
 * Qaytaradi: token yoki null (ruxsat berilmagan / emulyator).
 */
export async function registerForPush(): Promise<string | null> {
  // Emulyatorda push tokeni berilmaydi — so'rov ham yubormaymiz
  if (!Device.isDevice) return null;

  const existing = await Notifications.getPermissionsAsync();
  let status = existing.status;
  if (status !== 'granted') {
    const asked = await Notifications.requestPermissionsAsync();
    status = asked.status;
  }
  // Ruxsat berilmasa qayta so'ramaymiz: tizim oynasi faqat bir marta chiqadi,
  // keyin foydalanuvchi uni sozlamalardan yoqadi
  if (status !== 'granted') return null;

  if (Platform.OS === 'android') {
    // Android'da kanalsiz xabar ovozsiz va sokin keladi
    await Notifications.setNotificationChannelAsync('default', {
      name: 'VoltMax',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  try {
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (token && token !== registeredToken) {
      await NotificationsAPI.registerDevice(token, Platform.OS);
      registeredToken = token;
    }
    return token ?? null;
  } catch {
    // Tarmoq yoki loyiha sozlamasi muammosi — xabarlar ilova ichida
    // baribir ko'rinadi, shuning uchun oqim to'xtatilmaydi
    return null;
  }
}

/** Chiqishda tokenni serverdan o'chiradi: telefon boshqa odamga o'tsa,
 *  unga avvalgi egasining xabarlari kelmasin. */
export async function unregisterPush(): Promise<void> {
  if (!registeredToken) return;
  try {
    await NotificationsAPI.unregisterDevice(registeredToken);
  } catch {
    // Chiqishga xalaqit qilmaydi
  }
  registeredToken = null;
}
