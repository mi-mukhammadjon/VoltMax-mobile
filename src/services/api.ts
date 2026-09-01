import axios from 'axios';

import { useAuthStore } from '@/store/useAuthStore';
import { API_BASE_URL, TOKEN_REFRESH_URL } from './config';
import { noteRequestFailure, noteRequestSuccess } from './network';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/**
 * Token yangilash.
 *
 * `access` tokeni 7 kunda tugaydi. Ilgari bu holat umuman ishlov
 * ko'rmasdi: server 401 qaytarardi, ilova esa "hech narsa yuklanmayapti"
 * bo'lib qolardi va foydalanuvchi sababini bilmasdi.
 *
 * Bir vaqtda bir nechta so'rov 401 olishi mumkin (ekranda bir necha
 * so'rov ketadi). Ular bitta yangilashni KUTADI, aks holda har biri
 * alohida yangilash yuborardi va serverdagi eski refresh tokenlar
 * bekor bo'lib, foydalanuvchi tizimdan chiqib ketardi.
 */
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const { refreshToken, setSession, logout } = useAuthStore.getState();
  if (!refreshToken) return null;

  try {
    // `apiClient` emas: interceptor cheksiz halqaga tushib qolardi
    const response = await axios.post(
      TOKEN_REFRESH_URL,
      { refresh: refreshToken },
      { timeout: 15000 }
    );
    const access = response.data?.access ?? null;
    // Server har yangilashda YANGI refresh beradi va eskisini bekor
    // qiladi (rotatsiya). Yangisini saqlamasak, keyingi yangilash
    // ishlamay foydalanuvchi bir soatdan keyin chiqib ketardi.
    const rotated = response.data?.refresh ?? refreshToken;
    if (access) setSession(access, rotated);
    return access;
  } catch {
    // Refresh ham eskirgan — qaytadan kirish kerak
    logout();
    return null;
  }
}

// Tokenni YANGILAB qayta urinish ma'nosiz bo'lgan manzillar: ular
// tokenni o'zi beradi yoki umuman token talab qilmaydi.
const NO_RETRY = ['/auth/send-otp/', '/auth/verify-otp/', '/auth/token/'];

apiClient.interceptors.response.use(
  (response) => {
    // Har muvaffaqiyatli javob aloqa borligini tasdiqlaydi
    noteRequestSuccess();
    return response;
  },
  async (error) => {
    const original = error.config;
    const status = error.response?.status;

    // Javobsiz xato — server umuman javob bermadi. Tizim "ulangan"
    // desa ham (Wi-Fi bor, internet yo'q) buni shu yerda bilamiz.
    noteRequestFailure(error);

    // Faqat 401 va faqat BIR MARTA: ikkinchi 401 haqiqiy ruxsat xatosi
    if (status !== 401 || !original || original._retried) {
      return Promise.reject(error);
    }
    // Kirish so'rovlarining o'zi qayta urinilmaydi: ular token
    // OLADI, ya'ni tokenni yangilashga urinish ma'nosiz halqa bo'lardi.
    //
    // Ilgari bu yerda butun `/auth/` yo'li tekshirilardi va bu jiddiy
    // xato edi: `/auth/profile/`, `/auth/vehicles/`, `/auth/avatar/`
    // ham shu yo'lda. Ya'ni token eskirganda profil yoki mashinalar
    // ekrani jimgina xato berardi — token yangilanmasdi.
    //
    // Kirish tokeni endi bir soat yashaydi (ilgari bir hafta edi), ya'ni
    // bu holat kunda bir necha marta uchraydi.
    if (typeof original.url === 'string'
        && NO_RETRY.some((path) => original.url.includes(path))) {
      return Promise.reject(error);
    }

    original._retried = true;
    refreshing = refreshing ?? refreshAccessToken().finally(() => {
      refreshing = null;
    });

    const access = await refreshing;
    if (!access) return Promise.reject(error);

    original.headers = original.headers ?? {};
    original.headers.Authorization = `Bearer ${access}`;
    return apiClient(original);
  }
);

export const AuthAPI = {
  // Telegram Gateway ikki bosqichli (checkSendAbility + sendVerificationMessage)
  // so'rov yuboradi va bu umumiy 10s standart timeout'dan uzoqroq (~20-25s) davom
  // etishi mumkin — shuning uchun bu chaqiruvga alohida kengroq timeout beriladi.
  sendOtp: (phone: string) => apiClient.post('/auth/send-otp/', { phone }, { timeout: 35000 }),
  verifyOtp: (phone: string, code: string) => apiClient.post('/auth/verify-otp/', { phone, code }),
  getProfile: () => apiClient.get('/auth/profile/'),
  updateProfile: (name: string) => apiClient.patch('/auth/profile/', { name }),
  deleteProfile: () => apiClient.delete('/auth/profile/'),
};

export const AvatarAPI = {
  /**
   * Profil rasmini yuklaydi.
   *
   * `FormData` bilan ketadi va `Content-Type` ATAYLAB qo'yilmaydi:
   * chegara satrini (boundary) muhitning o'zi qo'shishi kerak, qo'lda
   * yozilgan sarlavha uni buzadi va server faylni ko'rmaydi.
   *
   * Rasm serverda kichraytiriladi va EXIF tozalanadi — telefondagi
   * surat 4-8 MB bo'ladi va u bilan birga suratga olingan joy
   * koordinatalari ham ketardi.
   */
  upload: (uri: string) => {
    const form = new FormData();
    const name = uri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(name);
    const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

    form.append('avatar', { uri, name, type } as unknown as Blob);
    return apiClient.post('/auth/avatar/', form, { timeout: 60000 });
  },
  remove: () => apiClient.delete('/auth/avatar/'),
};

export const StationsAPI = {
  // Nosozlik haqida xabar. Javobdagi `alreadyKnown` — muammo
  // allaqachon ma'lum ekanini bildiradi va ilova javobni shunga qarab
  // yozadi: bilinganini «xabar qildik» deb ko'rsatish noto'g'ri
  // bo'lardi.
  report: (stationId: string, note = '') =>
    apiClient.post(`/stations/${stationId}/report/`, { note }),
  list: () => apiClient.get('/stations/'),
  getById: (id: string) => apiClient.get(`/stations/${id}/`),
  // Promo-kod sessiya boshlashdan OLDIN tekshiriladi va yangi narx
  // ko'rsatiladi. 400 — kod yaroqsiz, `detail` da sababi keladi.
  checkPromo: (stationId: string, code: string) =>
    apiClient.post(
      '/stations/promo/check/',
      { stationId: Number(stationId), code },
      { validateStatus: (status) => status === 200 || status === 400 }
    ),
};

export const ReviewsAPI = {
  list: (stationId: string) => apiClient.get(`/stations/${stationId}/reviews/`),
  create: (stationId: string, rating: number, comment: string) =>
    apiClient.post(`/stations/${stationId}/reviews/`, { rating, comment }),
};

export const VehiclesAPI = {
  list: () => apiClient.get('/auth/vehicles/'),
  create: (vehicle: { name: string; make?: string; model?: string; year?: number; batteryCapacityKwh?: number; vin?: string; isDefault?: boolean }) =>
    apiClient.post('/auth/vehicles/', vehicle),
  update: (id: string, vehicle: Partial<{ name: string; make: string; model: string; year: number; batteryCapacityKwh: number; vin: string; isDefault: boolean }>) =>
    apiClient.patch(`/auth/vehicles/${id}/`, vehicle),
  remove: (id: string) => apiClient.delete(`/auth/vehicles/${id}/`),
};

export const RfidCardsAPI = {
  list: () => apiClient.get('/auth/rfid-cards/'),
  // Yo'qolgan kartani foydalanuvchi o'zi bloklaydi. Operator bloklagan
  // kartani ochishga urinilsa server 403 va sabab qaytaradi.
  setBlocked: (id: string, block: boolean) =>
    apiClient.post(`/auth/rfid-cards/${id}/block/`, { block }),
};

export const BookingsAPI = {
  list: (scope?: 'upcoming' | 'past' | 'cancelled' | 'completed') =>
    apiClient.get('/bookings/', { params: scope ? { status: scope } : undefined }),
  create: (stationId: string, scheduledAt: string, durationMinutes: number, connectorId?: string) =>
    apiClient.post('/bookings/', {
      stationId: Number(stationId),
      scheduledAt,
      durationMinutes,
      connectorId: connectorId ? Number(connectorId) : undefined,
    }),
  cancel: (id: string) => apiClient.post(`/bookings/${id}/cancel/`),
};

export const NotificationsAPI = {
  // Serverdan keladigan xabarlar: stansiya ishlamay qolgani, tuzatilgani va h.k.
  // Javob: { results: ServerNotification[], unread: number }
  list: () => apiClient.get('/notifications/'),
  markRead: (id: string) => apiClient.post(`/notifications/${id}/read/`),
  markAllRead: () => apiClient.post('/notifications/read-all/'),
  // Telefonning push manzili. Har kirishda yuboriladi: token ilova qayta
  // o'rnatilganda o'zgaradi va eskisi bilan xabar hech qayerga bormaydi.
  registerDevice: (token: string, platform: string) =>
    apiClient.post('/notifications/device/', { token, platform }),
  unregisterDevice: (token: string) =>
    apiClient.delete('/notifications/device/', { data: { token } }),
};

export const SessionsAPI = {
  list: () => apiClient.get('/sessions/'),
  // Haqiqiy charger'ga ulangan stansiyalarda backend darhol sessiya qaytarmaydi —
  // 202 { pending: true } qaytaradi va RemoteStartTransaction charger'ga yuboriladi;
  // `validateStatus` shu holatni ham "xato emas" deb hisoblashi uchun kengaytiriladi.
  start: (stationId: string, connectorId?: string, promoCode?: string) =>
    apiClient.post(
      '/sessions/start/',
      {
        stationId: Number(stationId),
        connectorId: connectorId ? Number(connectorId) : undefined,
        // Bo'sh kod umuman yuborilmaydi: server uni tekshirishga urinib
        // "kod kiritilmadi" deb rad etardi
        promoCode: promoCode?.trim() || undefined,
      },
      { validateStatus: (status) => status === 201 || status === 202 }
    ),
  getActive: () => apiClient.get('/sessions/active/', { validateStatus: (status) => status === 200 || status === 204 }),
  stop: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/stop/`),
  getById: (sessionId: string) => apiClient.get(`/sessions/${sessionId}/`),
  getInsights: () => apiClient.get('/sessions/insights/'),
};

export const WalletAPI = {
  getBalance: () => apiClient.get('/wallet/balance/'),
  getTransactions: () => apiClient.get('/wallet/transactions/'),
  // To'ldirish usullari: faqat yoqilgan va sozlangan tizimlar keladi
  getProviders: () => apiClient.get('/wallet/providers/'),
  // Balansni OSHIRMAYDI — to'lov havolasini qaytaradi. Pul kelgani haqida
  // xabarni to'lov tizimi serverga yuboradi, shuning uchun ilova qaytgach
  // `getPaymentStatus` bilan holatni so'raydi.
  topUp: (amount: number, provider: string) =>
    apiClient.post('/wallet/topup/', { amount, provider }),
  getPaymentStatus: (orderId: number) => apiClient.get(`/wallet/payments/${orderId}/`),
};

// Biriktirilgan kartalar: brauzerga o'tmasdan to'ldirish.
//
// Karta raqami SAQLANMAYDI — u faqat `addCard` so'rovida bir marta
// serverga boradi va o'sha yerdan to'lov tizimiga o'tadi. Shuning
// uchun uni ilovada eslab qolish yoki qayta ishlatish mumkin emas.
export const CardsAPI = {
  list: () => apiClient.get('/wallet/cards/'),
  // Javob 201: karta qo'shildi, ammo hali TASDIQLANMAGAN — bank SMS
  // kod yuboradi va `verify` chaqirilishi kerak
  add: (pan: string, expiry: string, provider: string) =>
    apiClient.post('/wallet/cards/', { pan, expiry, provider }),
  verify: (cardId: string, code: string) =>
    apiClient.post(`/wallet/cards/${cardId}/verify/`, { code }),
  remove: (cardId: string) => apiClient.delete(`/wallet/cards/${cardId}/`),
  makeDefault: (cardId: string) => apiClient.post(`/wallet/cards/${cardId}/`),
  // Bu yerda balans DARHOL oshadi: to'lov havolasidan farqli o'laroq
  // server javob berishdan oldin pulni yechib bo'ladi
  charge: (cardId: string, amount: number) =>
    apiClient.post(`/wallet/cards/${cardId}/charge/`, { amount }),

  getAutoTopUp: () => apiClient.get('/wallet/auto-topup/'),
  saveAutoTopUp: (cardId: string, threshold: number, amount: number, isActive: boolean) =>
    apiClient.put('/wallet/auto-topup/', { cardId, threshold, amount, isActive }),
  removeAutoTopUp: () => apiClient.delete('/wallet/auto-topup/'),
};
