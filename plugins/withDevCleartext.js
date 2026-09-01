/**
 * Lokal server bilan ishlash uchun cleartext (http) ruxsati.
 *
 * Android 9+ dan boshlab `http://` so'rovlar standart holatda bloklanadi.
 * Lokal Django serveri esa https bilan emas, ya'ni ishlab chiqish
 * bosqichida ruxsat kerak.
 *
 * NIMA UCHUN PLUGIN, oddiy fayl emas: bu ro'yxat `android/` papkasida
 * turadi va u `.gitignore` da — `expo prebuild` uni qayta yaratganda
 * qo'lda yozilgan sozlama yo'qoladi. Bir marta shunday bo'lgan va
 * natijasi qimmatga tushgan: APK yig'ildi, o'rnatildi, ishga tushdi va
 * faqat telefonda «aloqa yo'q» degan yozuvdan keyin sabab topildi.
 *
 * MANZIL BITTA JOYDAN OLINADI — `EXPO_PUBLIC_API_URL` dan. Ilgari u uch
 * joyda alohida yozilgan edi (ilova sozlamasi, serverning
 * `ALLOWED_HOSTS` i va shu ro'yxat) va tarmoq o'zgarganda uchalasini
 * ham yangilash kerak edi. Bittasi unutilsa, ilova jimgina ishlamay
 * qolardi.
 *
 * https manzil uchun hech narsa ochilmaydi: ishlab chiqarish build'i
 * (Railway, https) o'zgarishsiz qat'iy qoladi.
 */
const fs = require('fs');
const path = require('path');

const { withAndroidManifest, withDangerousMod } = require('@expo/config-plugins');

/** Har doim ruxsat etiladigan manzillar: emulyator va shu qurilma. */
const ALWAYS = ['10.0.2.2', 'localhost', '127.0.0.1'];

/** `EXPO_PUBLIC_API_URL` dan host. https yoki bo'sh bo'lsa — `null`. */
function devHost() {
  const url = (process.env.EXPO_PUBLIC_API_URL || '').trim();
  if (!url.startsWith('http://')) return null;

  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
}

function buildXml() {
  const host = devHost();
  const hosts = host && !ALWAYS.includes(host) ? [host, ...ALWAYS] : ALWAYS;
  const lines = hosts
    .map((h) => `    <domain includeSubdomains="false">${h}</domain>`)
    .join('\n');

  return `<?xml version="1.0" encoding="utf-8"?>
<!--
  DIQQAT: bu faylni QO'LDA TAHRIRLAMANG.
  Uni \`plugins/withDevCleartext.js\` \`EXPO_PUBLIC_API_URL\` asosida yozadi.
-->
<network-security-config>
  <domain-config cleartextTrafficPermitted="true">
${lines}
  </domain-config>
</network-security-config>
`;
}

module.exports = function withDevCleartext(config) {
  // 1. Faylning o'zi
  config = withDangerousMod(config, [
    'android',
    (cfg) => {
      const dir = path.join(
        cfg.modRequest.platformProjectRoot,
        'app', 'src', 'main', 'res', 'xml'
      );
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        path.join(dir, 'network_security_config.xml'), buildXml(), 'utf8');
      return cfg;
    },
  ]);

  // 2. Manifestda unga havola
  return withAndroidManifest(config, (cfg) => {
    const application = cfg.modResults.manifest.application?.[0];
    if (application) {
      application.$['android:networkSecurityConfig'] = '@xml/network_security_config';
    }
    return cfg;
  });
};
