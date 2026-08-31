/**
 * Server manzili.
 *
 * Ilgari u kodda qattiq yozilgan edi (`http://192.168.1.8:8000/api`) — bu
 * ishlab chiquvchining uy Wi-Fi manzili. Build qilingan ilova hech qayerga
 * ulana olmasdi va buni faqat telefonda ochib ko'rgandan keyin bilib
 * bo'lardi.
 *
 * Endi manzil uch joydan qidiriladi:
 *
 *   1. `EXPO_PUBLIC_API_URL` — build paytidagi muhit o'zgaruvchisi
 *      (EAS profilida yoki `.env` faylida);
 *   2. `app.json` dagi `extra.apiUrl` — profil bo'yicha sozlash;
 *   3. lokal ishlab chiqish uchun zaxira qiymat.
 *
 * Zaxira qiymat FAQAT `__DEV__` rejimida ishlatiladi: build qilingan
 * ilovada manzil topilmasa, jimgina uy tarmog'iga urinishdan ko'ra ochiq
 * xato berish yaxshiroq.
 */
import Constants from 'expo-constants';

const FALLBACK_DEV_URL = 'http://192.168.1.8:8000/api';

function resolve(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv) return fromEnv;

  const fromConfig = (
    Constants.expoConfig?.extra as { apiUrl?: string } | undefined
  )?.apiUrl?.trim();
  if (fromConfig) return fromConfig;

  if (__DEV__) return FALLBACK_DEV_URL;

  throw new Error(
    "Server manzili sozlanmagan: EXPO_PUBLIC_API_URL yoki app.json > extra.apiUrl"
  );
}

export const API_BASE_URL = resolve();

/** Token yangilash manzili — interceptor uchun, `apiClient` dan tashqarida. */
export const TOKEN_REFRESH_URL = `${API_BASE_URL}/auth/token/refresh/`;
