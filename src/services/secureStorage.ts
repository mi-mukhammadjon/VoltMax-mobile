import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

/**
 * Maxfiy maydonlarni apparat himoyasida saqlaydigan omborcha.
 *
 * MUAMMO: `AsyncStorage` shifrlanmagan oddiy fayl. Unda `refreshToken`
 * yotardi — o'ttiz kun amal qiladigan kalit. Uni uch yo'l bilan o'qish
 * mumkin edi:
 *   * root/jailbreak qilingan telefonda istalgan ilova;
 *   * dasturchi rejimi yoqilgan telefonda `adb backup`;
 *   * Android'ning Google Drive'ga avtomatik zaxirasi.
 *
 * Token o'g'irlansa hujumchi bir oy davomida hisobga to'liq kirish
 * oladi: hamyonni ko'radi, sessiya boshlaydi, mablag'ni sarflaydi.
 *
 * YECHIM: tokenlar iOS Keychain / Android Keystore ga o'tadi
 * (`expo-secure-store`). Ular apparat darajasida himoyalangan va
 * boshqa ilova o'qiy olmaydi.
 *
 * NIMA UCHUN HAMMASI EMAS: SecureStore bitta qiymat uchun ~2 KB
 * chegara qo'yadi va u AsyncStorage'dan sekinroq. Telefon raqami yoki
 * avatar manzili maxfiy emas — ular oddiy joyda qolaveradi.
 */
type Stored = Record<string, unknown>;

// SecureStore kalitida faqat harf, raqam, nuqta, tire va pastki chiziq
// bo'lishi mumkin
const secureKeyFor = (name: string) => `${name.replace(/[^\w.-]/g, '_')}_secure`;

let secureAvailable: boolean | null = null;

/**
 * SecureStore mavjudmi. Vebda (`expo start --web`) u yo'q, shuning
 * uchun tekshiriladi: aks holda ilova butunlay ishga tushmasdi.
 */
async function canUseSecure(): Promise<boolean> {
  if (secureAvailable !== null) return secureAvailable;
  try {
    secureAvailable = await SecureStore.isAvailableAsync();
  } catch {
    secureAvailable = false;
  }
  return secureAvailable;
}

/**
 * Zustand `persist` uchun omborcha: maxfiy maydonlarni ajratib
 * saqlaydi, qolganini odatdagi joyda qoldiradi.
 */
export function createSplitStorage(secretFields: string[]) {
  return {
    async getItem(name: string): Promise<string | null> {
      const plainRaw = await AsyncStorage.getItem(name);

      let secret: Stored = {};
      if (await canUseSecure()) {
        try {
          const raw = await SecureStore.getItemAsync(secureKeyFor(name));
          if (raw) secret = JSON.parse(raw);
        } catch {
          // Buzilgan yozuv — bo'sh deb qaraladi. Foydalanuvchi
          // qaytadan kiradi, bu ilovaning qulashidan yaxshiroq.
        }
      }

      if (!plainRaw && !Object.keys(secret).length) return null;

      const plain = plainRaw ? JSON.parse(plainRaw) : { state: {}, version: 0 };
      return JSON.stringify({
        ...plain,
        state: { ...(plain.state || {}), ...secret },
      });
    },

    async setItem(name: string, value: string): Promise<void> {
      const parsed = JSON.parse(value);
      const state: Stored = parsed.state || {};

      const secret: Stored = {};
      const plain: Stored = {};
      Object.entries(state).forEach(([key, val]) => {
        if (secretFields.includes(key)) secret[key] = val;
        else plain[key] = val;
      });

      await AsyncStorage.setItem(name, JSON.stringify({ ...parsed, state: plain }));

      if (await canUseSecure()) {
        await SecureStore.setItemAsync(secureKeyFor(name), JSON.stringify(secret));
      } else {
        // Vebda apparat himoyasi yo'q — u yerda oddiy joyda qoladi.
        // Bu ataylab: brauzerda baribir Keychain yo'q va ilovaning
        // umuman ishlamasligi yomonroq bo'lardi.
        await AsyncStorage.setItem(secureKeyFor(name), JSON.stringify(secret));
      }
    },

    async removeItem(name: string): Promise<void> {
      await AsyncStorage.removeItem(name);
      if (await canUseSecure()) {
        await SecureStore.deleteItemAsync(secureKeyFor(name));
      } else {
        await AsyncStorage.removeItem(secureKeyFor(name));
      }
    },
  };
}
