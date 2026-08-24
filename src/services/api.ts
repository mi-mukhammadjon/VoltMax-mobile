import axios from 'axios';

// TODO: .env orqali backend manzilini almashtirish (dev/prod)
export const apiClient = axios.create({
  baseURL: 'https://api.voltmax.uz/v1',
  timeout: 10000,
});

// TODO: auth interceptor - token qo'shish
// apiClient.interceptors.request.use((config) => { ... });

export const StationsAPI = {
  list: () => apiClient.get('/stations'),
  getById: (id: string) => apiClient.get(`/stations/${id}`),
};

export const SessionsAPI = {
  start: (stationId: string) => apiClient.post('/sessions/start', { stationId }),
  stop: (sessionId: string) => apiClient.post(`/sessions/${sessionId}/stop`),
  getById: (sessionId: string) => apiClient.get(`/sessions/${sessionId}`),
};

export const WalletAPI = {
  getBalance: () => apiClient.get('/wallet/balance'),
  getTransactions: () => apiClient.get('/wallet/transactions'),
  topUp: (amount: number) => apiClient.post('/wallet/topup', { amount }),
};
