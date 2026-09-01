/**
 * So'rov xatosini ODAM TUSHUNADIGAN matnga aylantiradi.
 *
 * Ilgari har joyda bir xil «Xatolik» chiqardi va u ikki butunlay
 * boshqacha holatni yashirardi: internet yo'qligi va serverning rad
 * javobi. Foydalanuvchi uchun bu farq muhim — birinchisida u joyini
 * o'zgartiradi, ikkinchisida esa qilgan ishini.
 *
 * Server yuborgan matn har doim ustun: u aniqroq bo'ladi («Hamyonda
 * mablag' yetarli emas» degani «Xatolik» dan foydali).
 */
export function describeError(error: unknown, fallback = "Amalni bajarib bo'lmadi"): string {
  const wrapped = error as {
    response?: { status?: number; data?: { detail?: string } };
    code?: string;
  } | null;

  // Serverning o'z matni — eng aniq javob
  const detail = wrapped?.response?.data?.detail;
  if (typeof detail === 'string' && detail.trim()) return detail.trim();

  // Javob umuman kelmadi: internet yo'q yoki server yetib bo'lmas
  // holatda. Bu ENG KO'P uchraydigan holat va uni «Xatolik» deb
  // ko'rsatish foydalanuvchini chalg'itadi.
  if (!wrapped?.response) {
    if (wrapped?.code === 'ECONNABORTED') {
      return "Server javob bermadi — aloqa sekin bo'lishi mumkin";
    }
    return "Internetga ulanmadi. Aloqani tekshirib, qayta urinib ko'ring";
  }

  const status = wrapped.response.status;
  if (status === 401 || status === 403) return 'Ruxsat yo‘q — qaytadan kiring';
  if (status === 404) return 'Topilmadi';
  if (status === 429) return "Juda ko'p urinish. Biroz kuting";
  if (typeof status === 'number' && status >= 500) {
    return "Serverda nosozlik. Birozdan so'ng qayta urinib ko'ring";
  }

  return fallback;
}
