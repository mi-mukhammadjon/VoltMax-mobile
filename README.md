# VoltMax — EV zaryadlash mobil ilovasi

Premium EV zaryadlash stansiyalarini topish, zaryadlashni boshqarish va to'lov qilish uchun React Native (Expo) ilovasi.

## Loyiha strukturasi

```
voltmax-app/
├── App.tsx                      # Kirish nuqtasi (Inter shriftini yuklaydi)
├── app.json                     # Expo konfiguratsiyasi
├── package.json
├── tsconfig.json
└── src/
    ├── navigation/
    │   ├── AppNavigator.tsx     # Root stack + ichki 5 tabli MainTabs (bottom-tabs)
    │   └── types.ts             # RootStackParamList + MainTabParamList
    ├── screens/
    │   ├── OnboardingScreen.tsx     # Splash — "Boshlash" → Login
    │   ├── LoginScreen.tsx          # Auth: telefon raqam
    │   ├── OtpScreen.tsx            # Auth: OTP tasdiqlash
    │   ├── MapScreen.tsx            # Tab: Asosiy (xarita)
    │   ├── StationsListScreen.tsx   # Tab: Stansiyalar
    │   ├── ChargingTabScreen.tsx    # Tab: Zaryadlash (faol sessiya holati)
    │   ├── FavoritesScreen.tsx      # Tab: Sevimli
    │   ├── ProfileScreen.tsx        # Tab: Profil (Hamyon/Tarixga kirish)
    │   ├── StationDetailScreen.tsx  # Stansiya detali
    │   ├── ChargingSessionScreen.tsx# Live zaryadlash monitoring
    │   ├── WalletScreen.tsx         # Hamyon/to'lov
    │   └── HistoryScreen.tsx        # Sessiyalar tarixi
    ├── components/               # Qayta ishlatiladigan UI qismlari
    ├── theme/
    │   ├── colors.ts             # Brend rang tokenlari (navy/blue/mint)
    │   ├── typography.ts         # Shrift o'lchamlari (Inter)
    │   └── index.ts              # spacing, radius va umumiy theme
    ├── data/                     # Mock ma'lumotlar (stations, session, wallet, history)
    ├── services/
    │   └── api.ts                # Backend bilan aloqa (axios, stub)
    ├── store/
    │   └── useAppStore.ts        # Global holat (zustand)
    └── types/
        └── index.ts              # Station, ChargingSession va boshqa modellar

```

## O'rnatish

```bash
npm install
npx expo start
```

## Serverga ulanish

Server manzili kodda emas, sozlamada:

1. `EXPO_PUBLIC_API_URL` — build paytidagi muhit o'zgaruvchisi
   (EAS profilida yoki `.env` faylida);
2. `app.json` > `extra.apiUrl`;
3. zaxira qiymat — **faqat `__DEV__` rejimida**.

Build qilingan ilovada manzil topilmasa ochiq xato beriladi: jimgina
noto'g'ri manzilga urinishdan ko'ra shunisi yaxshiroq.

EAS profillari (`eas.json`):

| Profil | Manzil |
|---|---|
| `development` | lokal server (`http://192.168.1.8:8000/api`) |
| `preview`, `production` | Railway'dagi server |

Lokal ishlab chiqishda kompyuter va telefon **bir xil Wi-Fi** tarmog'ida
bo'lishi kerak. IP o'zgarsa `eas.json` dagi `development` profilini yoki
`.env` ni yangilang (`ipconfig` — IPv4 manzil). Android emulyatori uchun:
`http://10.0.2.2:8000/api`.

## Nima bor

Xarita va stansiyalar ro'yxati, stansiya detali va sharhlar, zaryadlash
sessiyasi (real vaqtda), bronlar, hamyon va **onlayn to'lov** (Payme,
Click), RFID kartalar, mashinalar, bildirishnomalar va **push xabarlar**,
profil, mavzu (yorug'/qorong'i).

Ma'lumot to'liq backend'dan keladi — mock ma'lumot qolmagan.

### To'lov oqimi

Summa tanlanadi → server to'lov havolasini qaytaradi → havola brauzerda
ochiladi → foydalanuvchi to'laydi. **Balans ilovada oshmaydi**: pul
kelganini faqat to'lov tizimi tasdiqlaydi va u haqda serverga xabar
beradi. Ilovaga qaytgach holat so'raladi.

Sozlanmagan to'lov tizimi ro'yxatda umuman ko'rinmaydi.

### Narx va promo-kod

Stansiyaning narxi tarif oynasi (tungi tarif) va avtomatik aksiyalarni
allaqachon hisobga olgan holda keladi. Chegirma bo'lsa eski narx chizib
ko'rsatiladi va yonida **sababi** yoziladi — sababsiz arzon narx
foydalanuvchida "to'lovda boshqa summa chiqadimi" degan shubha
uyg'otadi.

Promo-kod stansiya sahifasida kiritiladi va **zaryadlashdan oldin**
tekshiriladi: kod yaroqli bo'lsa yangi narx darhol ko'rsatiladi.
Tekshirilmagan kod serverga yuborilmaydi, chunki yaroqsiz kod bilan
server sessiyani umuman boshlamaydi.

### Push xabarlar

Ilova tizimga kirgandan keyin push manzilini serverga yuboradi, chiqishda
esa o'chiradi — telefon boshqa odamga o'tsa, unga avvalgi egasining
xabarlari kelmasin. Emulyatorda push tokeni berilmaydi, shuning uchun uni
faqat haqiqiy qurilmada (EAS build) sinash mumkin.

### Token

`access` tokeni tugasa ilova uni o'zi yangilaydi. Bir vaqtda bir necha
so'rov 401 olsa, ular bitta yangilashni kutadi.

## Tekshirish

```bash
npm run typecheck     # tiplar
npm test              # mantiq sinovlari
```

Sinovlar ilovaning MANTIG'INI tekshiradi: token yangilash va rotatsiya,
sessiyani boshlash oqimi (202 → kutish → sessiya), tarmoq uzilishiga
chidamlilik, qayta ulanish oralig'i, chiqish. Aynan shu joylarda xato
qimmatga tushadi.

Ekranlar sinalmaydi — ular React va butun RN muhitini talab qiladi,
xatolar esa deyarli har doim mantiqda bo'ladi.

Sinovlar **tarmoqqa chiqmaydi**: `axios` almashtiriladi va har so'rovga
qanday javob berish sinovning o'zida yoziladi. Shuning uchun ular
serversiz ham ishlaydi va CI'da maxfiy kalit talab qilmaydi.

Har push'da GitHub Actions ularni avtomatik o'tkazadi
(`.github/workflows/tests.yml`).

Backend tomonidagi API sinovlari `voltmax-backend/test_mobile_api.py` da —
ilova ishlatadigan har bir manzil o'sha yerda tekshiriladi.
