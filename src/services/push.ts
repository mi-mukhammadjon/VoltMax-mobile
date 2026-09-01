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
import AsyncStorage from '@react-native-async-storage/async-storage';
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

/* Ro'yxatdan o'tgan token TELEFONDA saqlanadi, faqat xotirada emas.
 *
 * Ilgari u oddiy o'zgaruvchi edi va ilova yopilganda yo'qolardi. Ya'ni:
 * odam dushanba kuni kirdi (token yozildi), seshanba kuni ilovani ochib
 * «Chiqish» bosdi — o'zgaruvchi esa bo'sh edi va serverdan HECH NARSA
 * o'chirilmadi. Telefon boshqa odamga o'tsa, unga avvalgi egasining
 * xabarlari kelaverardi — ya'ni bu funksiya aynan o'zi oldini olishi
 * kerak bo'lgan narsani qilmasdi.
 */
const TOKEN_KEY = 'voltmax-push-token';

let registeredToken: string | null = null;
let loadedFromStorage = false;

async function rememberedToken(): Promise<string | null> {
  if (loadedFromStorage) return registeredToken;
  try {
    registeredToken = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    registeredToken = null;
  }
  loadedFromStorage = true;
  return registeredToken;
}

async function remember(token: string | null): Promise<void> {
  registeredToken = token;
  loadedFromStorage = true;
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // Saqlash ishlamasa ham oqim to'xtamaydi: eng yomoni token
    // keyingi safar qaytadan yuboriladi
  }
}

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
    const known = await rememberedToken();
    const { data: token } = await Notifications.getExpoPushTokenAsync();
    if (token && token !== known) {
      await NotificationsAPI.registerDevice(token, Platform.OS);
      await remember(token);
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
  const token = await rememberedToken();
  if (!token) return;

  try {
    await NotificationsAPI.unregisterDevice(token);
  } catch {
    // Chiqishga xalaqit qilmaydi: internet yo'q joyda ham odam
    // tizimdan chiqa olishi kerak
  }
  // Telefondagi yozuv HAR HOLDA tozalanadi. Aks holda keyingi
  // foydalanuvchi kirganda eski token "allaqachon yozilgan" deb
  // hisoblanib, uning qurilmasi umuman ro'yxatga tushmasdi.
  await remember(null);
}
