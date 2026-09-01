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

### Lokal server bilan build (telefon + hotspot)

Android 9+ `http://` so'rovlarni bloklaydi. Ruxsat ro'yxatini
`plugins/withDevCleartext.js` **`EXPO_PUBLIC_API_URL` dan** yozadi —
qo'lda yozilgan ro'yxat `android/` papkasi bilan birga
`expo prebuild` da yo'qolardi va bir marta shunday bo'lgan: APK
yig'ildi, o'rnatildi, ishga tushdi va telefonda «aloqa yo'q» deb
turaverdi.

Manzilni faqat BIR joyda ko'rsatasiz:

```bash
cd android
EXPO_PUBLIC_API_URL="http://<kompyuter-ip>:8000/api" ./gradlew assembleRelease
adb install -r app/build/outputs/apk/release/app-release.apk
```

Server tomonda hech narsa sozlash kerak emas: `DEBUG` rejimida
`ALLOWED_HOSTS` o'zi to'ldiriladi.

Telefon hotspot bo'lsa, kompyuter manzilini shunday topasiz:

```bash
# Windows
ipconfig                 # hotspot interfeysidagi IPv4
```

`ping` ishlamasligi normal — Windows ICMP'ni to'sadi, TCP esa ochiq.

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

### Biriktirilgan kartalar

Karta biriktirilgan bo'lsa oqim boshqacha: brauzer ham, qaytish ham
yo'q — server javob berganda pul allaqachon yechilgan. Shuning uchun bu
ikki yo'l kodda ataylab ajratilgan: birinchisida balansga ishonib
bo'lmaydi, ikkinchisida ishonsa bo'ladi.

**Karta raqami saqlanmaydi.** U `CardsScreen` dan bir marta serverga
ketadi va o'sha yerdan to'lov tizimiga o'tadi; modal yopilganda holatdan
ham tozalanadi. Bizda faqat oxirgi to'rt raqam qoladi.

**To'lov tokeni ilovaga umuman chiqmaydi.** Ilova «shu karta bilan
to'la» deydi, qolganini server qiladi — aks holda tokenni telefondan
o'g'irlash mumkin bo'lardi.

`test_app.js` buni alohida tekshiradi: karta raqami qo'shish
so'rovidan boshqa hech qaysi so'rovga tushmasligi shart.

### Avtomatik to'ldirish

Balans chegaradan pastga tushsa kartadan yechiladi — faqat zaryadlash
ketayotgan foydalanuvchi uchun. Kunlik va oylik chegara **serverda**
turadi va ekranda faqat ko'rsatiladi: ilovadan o'zgartirilsa, ular
himoya bo'lishdan to'xtaydi.

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

### Aloqa yo'q bo'lganda

Zaryadlash stansiyalari ko'pincha yerto'la parkovkada bo'ladi va u
yerda aloqa yomon — ya'ni ilova aynan **eng kerak bo'lgan joyda**
sinovdan o'tadi.

Shuning uchun stansiyalar ro'yxati, hamyon qoldig'i va sevimlilar
telefonda saqlanadi: ekran bo'sh qolmaydi. Yuqorida esa aloqa yo'qligi
va ma'lumot **qanchalik eskiligi** aytiladi — eski ma'lumotni yangi
deb ko'rsatish yolg'on bo'lardi va odam bo'sh stansiyaga borib qolardi.

Aloqa tiklanganda ekranlar ma'lumotni o'zi qayta so'raydi.

Xato xabarlari ham ajratilgan: internet yo'qligi va serverning rad
javobi butunlay boshqa narsa — birinchisida odam joyini o'zgartiradi,
ikkinchisida qilgan ishini.

### Push xabarlar

Ilova tizimga kirgandan keyin push manzilini serverga yuboradi, chiqishda
esa o'chiradi — telefon boshqa odamga o'tsa, unga avvalgi egasining
xabarlari kelmasin. Emulyatorda push tokeni berilmaydi, shuning uchun uni
faqat haqiqiy qurilmada (EAS build) sinash mumkin.

### Tokenlar qayerda saqlanadi

`accessToken` va `refreshToken` **apparat himoyasida**: iOS Keychain,
Android Keystore (`expo-secure-store`). Ularni boshqa ilova o'qiy
olmaydi.

Ilgari ular oddiy `AsyncStorage` da edi — shifrlanmagan fayl. Undan
`refreshToken` ni (o'ttiz kun amal qiladi) uch yo'l bilan olish mumkin
edi: root qilingan telefonda, `adb backup` orqali va Google Drive
zaxirasidan. Token o'g'irlansa hujumchi bir oy davomida hisobga to'liq
kirish oladi.

Telefon raqami, ism va avatar manzili maxfiy emas — ular odatdagi
joyda qoladi: SecureStore sekinroq va bitta qiymat uchun ~2 KB chegara
qo'yadi.

`android.allowBackup` ham `false`: qolgan ma'lumot bulutga
nusxalanmaydi.

### Token

`access` tokeni tugasa ilova uni o'zi yangilaydi. Bir vaqtda bir necha
so'rov 401 olsa, ular bitta yangilashni kutadi.

## Keyingi ishlar

Orqaga surilgan hamma narsa backend repozitoriysidagi
**`KEYINGI-ISHLAR.md`** da — ikkala loyihani ham qamraydi. Ilovaga
tegishlilari: EAS build (push, avatar va SecureStore faqat haqiqiy
qurilmada tekshiriladi) va Google Maps kalitini cheklash.

## Tekshirish

```bash
npm run typecheck     # tiplar
npm test              # mantiq sinovlari
```

Sinovlar ilovaning MANTIG'INI tekshiradi: token yangilash va rotatsiya,
sessiyani boshlash oqimi (202 → kutish → sessiya), tarmoq uzilishiga
chidamlilik, qayta ulanish oralig'i, push manzili, saqlanadigan holat,
server manzilini aniqlash va chiqish. Aynan shu joylarda xato qimmatga
tushadi.

Ekranlar sinalmaydi — ular React va butun RN muhitini talab qiladi,
xatolar esa deyarli har doim mantiqda bo'ladi.

Sinovlar **tarmoqqa chiqmaydi**: `axios` almashtiriladi va har so'rovga
qanday javob berish sinovning o'zida yoziladi. Shuning uchun ular
serversiz ham ishlaydi va CI'da maxfiy kalit talab qilmaydi.

Har push'da GitHub Actions ularni avtomatik o'tkazadi
(`.github/workflows/tests.yml`).

Backend tomonidagi API sinovlari `voltmax-backend/test_mobile_api.py` da —
ilova ishlatadigan har bir manzil o'sha yerda tekshiriladi.
