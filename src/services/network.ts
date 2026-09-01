import NetInfo from '@react-native-community/netinfo';

/**
 * Tarmoq holati.
 *
 * Nima uchun kerak: zaryadlash stansiyalari ko'pincha yerto'la
 * parkovkada bo'ladi va u yerda aloqa yomon. Ya'ni ilova aynan ENG
 * KERAK BO'LGAN joyda ishlamay qoladi.
 *
 * Ilgari bunday paytda foydalanuvchi bo'sh ekran ko'rardi va sababini
 * bilmasdi: stansiya yo'qmi, yuklanmadimi, ilova buzildimi. Bo'sh
 * ekran eng yomon javob — u hech narsa aytmaydi.
 *
 * Ikki manba birga ishlaydi:
 *   * NetInfo — tizim aytadigan holat. U aloqa TIKLANGANINI ham
 *     biladi, ya'ni o'sha payt ma'lumotni qayta so'rash mumkin.
 *   * so'rov xatosi — ba'zan tizim "ulangan" deydi, lekin server
 *     baribir javob bermaydi (Wi-Fi bor, internet yo'q).
 */
import { useSyncExternalStore } from 'react';

type Listener = (online: boolean) => void;

let online = true;
const listeners = new Set<Listener>();
let unsubscribeNetInfo: (() => void) | null = null;

function publish(next: boolean) {
  if (next === online) return;
  online = next;
  listeners.forEach((listener) => listener(online));
}

function ensureWatching() {
  if (unsubscribeNetInfo) return;

  unsubscribeNetInfo = NetInfo.addEventListener((state) => {
    // `isInternetReachable` aniqroq: Wi-Fi ga ulangan bo'lib ham
    // internet bo'lmasligi mumkin (masalan mehmonxona tarmog'ida
    // kirish sahifasi). U `null` bo'lsa hali aniqlanmagan — o'shanda
    // `isConnected` ga tayanamiz.
    const reachable = state.isInternetReachable;
    publish(state.isConnected === true && reachable !== false);
  });
}

/** Hozir aloqa bormi (oxirgi ma'lum holat). */
export function isOnline(): boolean {
  ensureWatching();
  return online;
}

/**
 * So'rov XATOSIGA qarab holatni yangilaydi.
 *
 * Tizim "ulangan" desa ham server javob bermasligi mumkin. Javobsiz
 * xato (`error.response` yo'q) aynan shuni bildiradi.
 */
export function noteRequestFailure(error: unknown): void {
  const hasResponse = !!(error as { response?: unknown } | null)?.response;
  if (!hasResponse) publish(false);
}

/** So'rov muvaffaqiyatli — aloqa bor, holat qanday bo'lishidan qat'i nazar. */
export function noteRequestSuccess(): void {
  publish(true);
}

/**
 * Holat o'zgarishini kuzatish. Qaytgan funksiya obunani bekor qiladi.
 *
 * Asosiy foydasi — aloqa TIKLANGANDA ekranlar ma'lumotni o'zi qayta
 * so'raydi. Aks holda foydalanuvchi qo'lda yangilashi kerak bo'lardi
 * va ko'pchilik buni qilmaydi: ular ilovani "buzilgan" deb yopadi.
 */
export function subscribeToNetwork(listener: Listener): () => void {
  ensureWatching();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

/** React ekranlari uchun: joriy holat va uning o'zgarishi. */
export function useIsOnline(): boolean {
  return useSyncExternalStore(
    (notify) => subscribeToNetwork(() => notify()),
    () => isOnline(),
    () => true,
  );
}
