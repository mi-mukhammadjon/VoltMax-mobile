import { apiClient } from './api';

// Backend'da Station/Connector o'zgarganda (dashboard'dan tahrirlash, real
// charger'dan StatusNotification, yoki sessiya boshlanishi/tugashi) WebSocket
// orqali darhol xabar keladi — mobil ilova bu xabarni olib, /api/stations/ni
// qayta so'raydi (to'liq ma'lumot doim REST orqali, xabar faqat trigger).
//
// Bir nechta ekran (Home, Stansiyalar, Zaryadlash, Xarita, Stansiya detali)
// bir vaqtda mount bo'lishi mumkin — shuning uchun soket bitta bo'lib, obunachilar
// sanog'i bo'yicha boshqariladi: birinchi obunachi ulaydi, oxirgisi uziladi.
const RECONNECT_DELAY_MS = 3000;

function getWsUrl(path: string): string {
  const httpBase = apiClient.defaults.baseURL || '';
  const wsBase = httpBase.replace(/^http/, 'ws').replace(/\/api\/?$/, '');
  return `${wsBase}${path}`;
}

const listeners = new Set<() => void>();
let socket: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

function connect() {
  if (listeners.size === 0) return;
  socket = new WebSocket(getWsUrl('/ws/updates/stations/'));
  socket.onmessage = () => listeners.forEach((listener) => listener());
  socket.onclose = () => {
    socket = null;
    if (listeners.size > 0) reconnectTimer = setTimeout(connect, RECONNECT_DELAY_MS);
  };
  socket.onerror = () => {
    socket?.close();
  };
}

function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  const current = socket;
  socket = null;
  // onclose qayta ulanishni boshlamasligi uchun avval handler olib tashlanadi
  if (current) {
    current.onclose = null;
    current.close();
  }
}

export function subscribeToStationUpdates(onChange: () => void): () => void {
  listeners.add(onChange);
  if (listeners.size === 1) connect();

  return () => {
    listeners.delete(onChange);
    if (listeners.size === 0) disconnect();
  };
}
