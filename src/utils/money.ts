/**
 * Pul summalarini yagona ko'rinishda chiqarish.
 *
 * Ilgari har ekran o'zicha `toLocaleString('uz-UZ')` chaqirardi — natija
 * qurilma sozlamalariga qarab har xil bo'lardi (123 000 / 123,000 / 123.000).
 * Endi hamma joyda bitta format, backend paneli bilan bir xil:
 *
 *     123 000.00
 *
 * Ming ajratgichi — uzuluvchi bo'lmagan bo'shliq (U+00A0), shunda summa
 * qator oxirida ikkiga bo'linib ketmaydi.
 */

const NBSP = ' ';

export function formatSom(amount?: number | null): string {
  if (amount == null || Number.isNaN(amount)) return `0.00`;

  const fixed = Math.abs(amount).toFixed(2);
  const [whole, fraction] = fixed.split('.');
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);

  return `${amount < 0 ? '-' : ''}${grouped}.${fraction}`;
}

/** `123 000.00 so'm` — yonida birlik bilan */
export function formatSomWithUnit(amount?: number | null, unit = "so'm"): string {
  return `${formatSom(amount)} ${unit}`;
}

/**
 * Kiritish maydoni uchun matnni toza songa keltiradi.
 *
 * Vergul ham, nuqta ham KASR ajratgichi: "1500,50" va "1500.50" bir xil.
 * Bo'shliqlar ming ajratgichi hisoblanadi va tashlab yuboriladi.
 */
export function parseSomInput(text: string): string {
  const normalized = text.replace(/,/g, '.').replace(/[\s ]/g, '');
  const firstDot = normalized.indexOf('.');

  const whole = (firstDot === -1 ? normalized : normalized.slice(0, firstDot))
    .replace(/\D/g, '')
    .replace(/^0+(?=\d)/, '');

  if (firstDot === -1) return whole;

  const fraction = normalized.slice(firstDot + 1).replace(/\D/g, '').slice(0, 2);
  return `${whole}.${fraction}`;
}

/** Yozayotganda: butun qism 3 xonadan ajratiladi, kasr esa tegilmaydi */
export function groupSomInput(value: string): string {
  if (!value) return '';
  const [whole, fraction] = value.split('.');
  const grouped = (whole || '0').replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
  return fraction === undefined ? grouped : `${grouped}.${fraction}`;
}

/**
 * Yuborishdan oldin: summalar butun so'mda saqlanadi (tiyin ishlatilmaydi),
 * shuning uchun kasr eng yaqin butun songa yaxlitlanadi.
 */
export function somInputToNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : 0;
}
