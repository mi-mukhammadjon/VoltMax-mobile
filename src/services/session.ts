import axios from 'axios';
import { API_BASE_URL } from './config';

/**
 * Chiqishda tokenni SERVERDA bekor qiladi.
 *
 * Faqat telefondagi nusxani o'chirish yetarli emas edi: `refresh` tokeni
 * server tomonda yana bir oy amal qilaverardi. Telefon boshqa odamga
 * o'tsa yoki token oshkor bo'lsa, uni to'xtatishning yo'li yo'q edi.
 *
 * `apiClient` EMAS, oddiy `axios`: `apiClient` auth do'konini import
 * qiladi, do'kon esa buni — halqa hosil bo'lardi. Bu yerda esa token
 * baribir parametr sifatida keladi, ya'ni do'kon kerak emas.
 *
 * Javob kutilmaydi va xato yutiladi: chiqish tarmoqqa bog'liq
 * bo'lmasligi kerak. Internet yo'q joyda ham foydalanuvchi chiqa olishi
 * shart — token telefondan baribir o'chadi.
 */
export function revokeSession(refreshToken: string | null): void {
  if (!refreshToken) return;

  axios
    .post(
      `${API_BASE_URL}/auth/logout/`,
      { refresh: refreshToken },
      { timeout: 8000 }
    )
    .catch(() => {
      // Serverga yetib bormadi — token telefondan baribir o'chirilgan.
      // Muddati tugagach u o'z-o'zidan yaroqsiz bo'ladi.
    });
}
