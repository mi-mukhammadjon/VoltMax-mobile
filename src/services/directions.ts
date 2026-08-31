import { Linking, Platform } from 'react-native';
import { showAlert } from './alert';

// Stansiyaga marshrut qurish — tashqi navigatsiya ilovasida darhol ochiladi.
//
// Boshlanish nuqtasi berilmaydi: barcha navigatorlar uni foydalanuvchining
// joriy joylashuvidan oladi, shuning uchun ilovaga geolokatsiya ruxsati kerak emas.
//
// Ilovalar O'zbekistondagi ommaviyligi bo'yicha tartiblangan: Yandex Navigator →
// Yandex Xaritalar → Google Maps → tizim standarti. Birinchi o'rnatilgani ochiladi;
// hech biri bo'lmasa brauzerdagi Google Maps marshruti (u doim ishlaydi).

interface Destination {
  latitude: number;
  longitude: number;
  /** xaritada ko'rsatiladigan nom (faqat ba'zi sxemalarda ishlatiladi) */
  label?: string;
}

function buildCandidates({ latitude, longitude, label }: Destination): string[] {
  const lat = latitude;
  const lon = longitude;
  const name = encodeURIComponent(label ?? 'VoltMax');

  const yandexNavi = `yandexnavi://build_route_on_map?lat_to=${lat}&lon_to=${lon}`;
  const yandexMaps = `yandexmaps://maps.yandex.com/?rtext=~${lat},${lon}&rtt=auto`;

  if (Platform.OS === 'ios') {
    return [
      yandexNavi,
      yandexMaps,
      `comgooglemaps://?daddr=${lat},${lon}&directionsmode=driving`,
      // Apple Maps — iOS'da doim mavjud
      `maps://?daddr=${lat},${lon}&dirflg=d&q=${name}`,
    ];
  }

  return [
    yandexNavi,
    yandexMaps,
    // Google Maps'ning "burilishma-burilish" navigatsiyasini to'g'ridan-to'g'ri ochadi
    `google.navigation:q=${lat},${lon}`,
    // Qurilmadagi istalgan xarita ilovasi (tanlov oynasi chiqishi mumkin)
    `geo:${lat},${lon}?q=${lat},${lon}(${name})`,
  ];
}

/** Hech qanday navigatsiya ilovasi topilmaganda — brauzerdagi Google Maps marshruti */
function webFallback({ latitude, longitude }: Destination): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

export async function openRouteTo(destination: Destination): Promise<void> {
  for (const url of buildCandidates(destination)) {
    try {
      // Android 11+ da canOpenURL faqat AndroidManifest'dagi <queries> ro'yxatidagi
      // ilovalar uchun true qaytaradi — ro'yxat android/app/src/main/AndroidManifest.xml da.
      if (await Linking.canOpenURL(url)) {
        await Linking.openURL(url);
        return;
      }
    } catch {
      // bu sxema ishlamadi — keyingisini sinaymiz
    }
  }

  try {
    await Linking.openURL(webFallback(destination));
  } catch {
    showAlert(
      'Xatolik',
      "Marshrutni ochib bo'lmadi — qurilmada xarita ilovasi yoki brauzer topilmadi.",
      undefined,
      'error'
    );
  }
}
