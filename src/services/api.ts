import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

// Lokal Django backend (voltmax-backend). Fizik qurilma bilan kompyuter bir xil
// Wi-Fi tarmog'ida bo'lishi kerak. Kompyuter LAN IP o'zgarsa shu yerni yangilang
// (`ipconfig` — IPv4-manzil). Android emulyator uchun: http://10.0.2.2:8000/api
// TODO: production'da .env orqali almashtiriladi
export const apiClient = axios.create({
  baseURL: 'http://192.168.1.8:8000/api',
  timeout: 10000,
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

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

export const StationsAPI = {
  list: () => apiClient.get('/stations/'),
  getById: (id: string) => apiClient.get(`/stations/${id}/`),
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
  start: (stationId: string, connectorId?: string) =>
    apiClient.post(
      '/sessions/start/',
      { stationId: Number(stationId), connectorId: connectorId ? Number(connectorId) : undefined },
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
