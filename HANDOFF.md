# VoltMax — Loyiha Handoff Hujjati

**Sana:** 2026-08-24
**Loyiha turi:** EV zaryadlash stansiyalarini topish va boshqarish uchun mobil ilova
**Stack:** React Native (Expo) + TypeScript
**Holat:** Frontend skeleton + 4 ta asosiy ekran UI darajasida tayyor (mock data bilan), backend integratsiyasi kutilmoqda

---

## 1. Loyiha haqida qisqacha

VoltMax — Toshkentda joylashgan EV (elektromobil) zaryadlash stansiyalari tarmog'i uchun premium mobil ilova. Foydalanuvchi yaqin atrofdagi stansiyalarni xaritada yoki ro'yxatda ko'radi, stansiya detaliga kirib ulagichni (connector) tanlaydi, zaryadlashni boshlaydi, real-vaqtda jarayonni kuzatadi va Payme/Click orqali to'laydi.

Dizayn yo'nalishi: **Tesla / ChargePoint darajasidagi premium uslub** — chuqur navy fon, elektr-ko'k va mint-yashil akcentlar, minimalist tipografiya, glass/elevated kartalar.

---

## 2. Tech stack va asosiy kutubxonalar

| Kategoriya | Tanlov | Izoh |
|---|---|---|
| Framework | Expo (React Native 0.74) + TypeScript | `expo start` bilan darhol ishga tushadi |
| Navigatsiya | `@react-navigation/native` + native-stack | Bitta root stack, 7 ta ekran |
| Holat boshqaruvi | `zustand` | Global holat uchun yengil yechim |
| HTTP | `axios` | Backend bilan aloqa uchun stub (`src/services/api.ts`) |
| Xarita | `react-native-maps` | `MapScreen`da ishlatiladi |
| Ikonkalar | `lucide-react-native` | Barcha UI ikonkalari |
| Gradient | `expo-linear-gradient` | Quvvat badge, batareya fill, tugmalar |
| SVG | `react-native-svg` | `lucide-react-native` va boshqa vizual elementlar uchun peer dependency |

`package.json`da barcha versiyalar belgilangan. O'rnatish: `npm install && npx expo start`.

---

## 3. Loyiha strukturasi

```
voltmax-app/
├── App.tsx                          # Kirish nuqtasi — AppNavigator'ni render qiladi
├── app.json                         # Expo konfiguratsiyasi (nom, bundle id, dark UI)
├── package.json
├── tsconfig.json                    # "@/*" alias src/ ga yo'naltirilgan
├── README.md                        # Qisqa loyiha tavsifi
├── HANDOFF.md                       # Ushbu hujjat
└── src/
    ├── navigation/
    │   ├── AppNavigator.tsx         # Root stack navigator, dark theme sozlamalari
    │   └── types.ts                 # RootStackParamList (barcha ekran/param tiplari)
    │
    ├── screens/
    │   ├── OnboardingScreen.tsx     # 1. Splash — hozircha minimal (TODO)
    │   ├── MapScreen.tsx            # 2. Xarita — TO'LIQ ISHLAYDI
    │   ├── StationsListScreen.tsx   # 2b. Stansiyalar ro'yxati — TO'LIQ ISHLAYDI
    │   ├── StationDetailScreen.tsx  # 3. Stansiya detali — TO'LIQ ISHLAYDI
    │   ├── ChargingSessionScreen.tsx# 4. Live monitoring — TO'LIQ ISHLAYDI
    │   ├── WalletScreen.tsx         # 5. Hamyon — hozircha placeholder (TODO)
    │   └── HistoryScreen.tsx        # 6. Tarix — hozircha placeholder (TODO)
    │
    ├── components/
    │   ├── StationMarker.tsx        # Xaritadagi holat-rangli pin
    │   ├── StationDetailSheet.tsx   # Xaritada pin bosilganda chiqadigan bottom sheet
    │   ├── StationListCard.tsx      # Ro'yxatdagi stansiya kartasi (Tesla-uslub)
    │   ├── FilterChips.tsx          # Barchasi/Mavjud/Chegirmalar segment kontrol
    │   ├── AmenityIcon.tsx          # Stansiya detalidagi mukofot/qulaylik ikonkasi
    │   ├── BatteryLevelIndicator.tsx# Vertikal batareya vizuali (gradient fill)
    │   └── SwipeToStopButton.tsx    # PanResponder asosidagi "suring-to'xtatish" tugma
    │
    ├── theme/
    │   ├── colors.ts                # Brend rang tokenlari
    │   ├── typography.ts            # Shrift o'lchamlari/oilasi
    │   └── index.ts                 # spacing, radius + umumiy theme eksporti
    │
    ├── data/
    │   ├── mockStations.ts          # 4 ta test stansiya (connectors, amenities, narx bilan)
    │   └── mockSession.ts           # Test zaryadlash sessiyasi generatori
    │
    ├── services/
    │   └── api.ts                   # axios client + StationsAPI/SessionsAPI/WalletAPI stub
    │
    ├── store/
    │   └── useAppStore.ts           # zustand global holat (stations, activeSession, wallet)
    │
    └── types/
        └── index.ts                 # Station, Connector, ChargingSession, Wallet, Transaction
```

---

## 4. Dizayn tizimi (Design Tokens)

Barcha ranglar/o'lchamlar `src/theme/` ichida markazlashtirilgan — yangi ekran qurishda har doim shu yerdan foydalanish kerak, qiymatlarni qo'lda yozmaslik kerak.

### Ranglar (`src/theme/colors.ts`)

| Token | Qiymat | Ishlatilishi |
|---|---|---|
| `bgPrimary` | `#0B1220` | Asosiy fon (chuqur navy) |
| `bgSecondary` | `#141C2E` | Karta/panel foni |
| `bgElevated` | `#1C2740` | Ko'tarilgan elementlar (modal, ichki blok) |
| `electricBlue` | `#3B82F6` | Asosiy CTA, akcent |
| `mintGreen` | `#34D9A8` | Muvaffaqiyat, "bo'sh" holat, narx ta'kidlash |
| `statusAvailable` / `statusBusy` / `statusOffline` | mint / amber / kulrang | Stansiya/ulagich holati |
| `textPrimary` / `textSecondary` / `textMuted` | oq → kulrang gradatsiya | Matn ierarxiyasi |
| `border` | `#252F45` | Barcha karta/chegaralar |

`gradientPrimary = [electricBlue, mintGreen]` — badge va progress elementlarida `expo-linear-gradient` bilan ishlatiladi.

### Tipografiya

Shrift oilasi: `Inter` (Regular/Medium/SemiBold/Bold) — **hozircha haqiqiy font fayllari ulanmagan**, sistema shriftiga fallback qiladi. Productionga chiqishdan oldin `expo-font` orqali Inter shriftlarini yuklash kerak (`App.tsx`da `useFonts` bilan).

O'lcham shkala: `xs 12 → sm 14 → base 16 → lg 18 → xl 22 → xxl 28 → display 36`.

### Spacing / Radius

`spacing`: 4/8/16/24/32/48 (xs→xxl). `radius`: 8/12/16/24/pill(999).

---

## 5. Navigatsiya oqimi

```
Onboarding
   └─▶ Map ──────────────┐
        │                 │
        ▼                 ▼
   StationsList      (pin bosish → StationDetailSheet)
        │
        ▼
   StationDetail
        │ (ulagich tanlash / "Ketamiz")
        ▼
   ChargingSession
        │ (suring-toxtatish)
        ▼
   goBack()

Wallet, History — hozircha mustaqil, pastki tab/menyu orqali ulanishi kerak (hali qurilmagan)
```

Muhim: **pastki tab navigatsiya (Asosiy/Stansiyalar/Zaryadlash/Sevimli/Profil) hali qurilmagan.** Hozircha barcha ekranlar bitta native-stack ichida, ekranlar orasida `navigation.navigate()` bilan qo'lda o'tiladi. Bu keyingi eng muhim strukturaviy ish (7-bo'limga qarang).

---

## 6. Ma'lumot modellari (`src/types/index.ts`)

```ts
Station {
  id, name, address, latitude, longitude,
  chargerType: 'AC' | 'DC',
  powerKw, pricePerKwh, originalPricePerKwh?,
  status: 'available' | 'busy' | 'offline',
  rating?, distanceKm?, etaMinutes?,
  connectors?: Connector[],
  amenities?: StationAmenity[],
}

Connector {
  id, label ("A"/"B"), type, powerKw,
  status: 'available' | 'charging' | 'offline',
  chargingPercent?,
}

ChargingSession {
  id, stationId, startedAt, status,
  currentPercent, powerKw, elapsedSeconds, costSoFar,
  remainingSeconds, kwhCharged, pricePerKwh,
  currentAmps, voltageV, parkingFeePerMin, connectorLabel,
}

WalletBalance { amount, currency: 'UZS' }
Transaction { id, type, amount, createdAt, description }
```

Bitta stansiyada bir nechta `Connector` bo'lishi mumkin (skrinshotdagi GB/T A / GB/T B kabi) — bu UIda allaqachon qo'llab-quvvatlanadi (`StationDetailScreen`).

---

## 7. Ekranlar bo'yicha holat va keyingi qadamlar

### ✅ To'liq ishlaydigan (UI + navigatsiya, mock data bilan)

**MapScreen** — barcha stansiyalar holat-rangli pin bilan xaritada, pin bosilganda pastdan `StationDetailSheet` chiqadi, "Zaryadlashni boshlash" tugmasi faqat bo'sh stansiyada faol. Yuqorida "Stansiyalar" tugmasi `StationsList`ga o'tkazadi.

**StationsListScreen** — filtr chip (Barchasi/Mavjud/Chegirmalar), har bir stansiya uchun premium karta (gradient quvvat badge, reyting, masofa/vaqt/narx). Karta bosilganda `StationDetail`ga o'tadi.

**StationDetailScreen** — mukofot/qulaylik bloki, narx kartasi (chegirma bilan), ulagichlar ro'yxati holat bilan (Bo'sh/Zaryadlanmoqda %/Ishlamayapti), "Ketamiz" CTA — bo'sh ulagich topilsa `ChargingSession`ni boshlaydi.

**ChargingSessionScreen** — foydalanuvchi yuborgan skrinshot asosida: batareya vizuali + qolgan vaqt, narx/kVt-soat va to'lov kartasi, 2x2 statistik grid (quvvat/tok/voltaj/parkovka jarimasi), suring-to'xtatish tugmasi.

### ⚠️ Placeholder holatida (TODO)

- **OnboardingScreen** — faqat brend nomi va slogan matn ko'rinishida. Kerak: logotip/animatsiya, gradient fon, "Boshlash" tugmasi, keyingi ekranga navigatsiya.
- **WalletScreen** — bo'sh. Kerak: balans kartasi (gradient), Payme/Click tugmalari, "Hisobni to'ldirish" oqimi, tranzaksiyalar ro'yxati.
- **HistoryScreen** — bo'sh. Kerak: oylik xarajat grafigi (chart kutubxonasi hali tanlanmagan — Victory Native yoki react-native-svg-charts tavsiya etiladi), sessiyalar ro'yxati, chek/kvitansiya ko'rish.

### 🧩 Hali qurilmagan strukturaviy qismlar

1. **Pastki tab navigatsiya** (Asosiy/Stansiyalar/Zaryadlash/Sevimli/Profil) — skrinshotlarda ko'ringan, lekin hozirgi kod faqat bitta stack. `@react-navigation/bottom-tabs` qo'shish va `AppNavigator`ni Tab + nested Stack qilib qayta qurish kerak.
2. **Auth oqimi** — login/registratsiya, telefon raqam orqali OTP (FundFlow'dagi PINFL→2FA→OTP tajribangizga o'xshash qilish mumkin).
3. **Profil ekrani** — hali umuman yo'q.
4. **Sevimlilar (Favorites) ekrani** — hali umuman yo'q.

---

## 8. Backend integratsiyasi uchun kerakli ish

Hozir butun ilova `src/data/mockStations.ts` va `src/data/mockSession.ts` orqali statik ma'lumot bilan ishlaydi. Backend tayyor bo'lganda:

1. **`src/services/api.ts`**dagi `baseURL`ni haqiqiy manzilga almashtirish, auth interceptor qo'shish (token).
2. Har bir ekranda mock import'ni real API chaqiruviga almashtirish:
   - `MapScreen` / `StationsListScreen`: `mockStations` → `StationsAPI.list()`
   - `StationDetailScreen`: `mockStations.find()` → `StationsAPI.getById(stationId)`
   - `ChargingSessionScreen`: `getMockSession()` → `SessionsAPI.getById(sessionId)` + **WebSocket** orqali live yangilanish (`currentPercent`, `kwhCharged`, `costSoFar`, `remainingSeconds`)
   - `MapScreen.handleStart` / `StationDetailScreen.handleConnectorPress`: kommentariyadagi `SessionsAPI.start()` chaqiruvini faollashtirish
3. **OCPP** backend servisi (FastAPI + `python-ocpp`, avvalgi suhbatda muhokama qilingan) — stansiyalar bilan real vaqtli aloqa, mobil ilova esa shu backend'ning REST/WebSocket API'si bilan gaplashadi, to'g'ridan-to'g'ri OCPP bilan emas.
4. **Push-bildirishnoma**: Firebase Cloud Messaging ulash ("zaryadlash tugadi", "parkovka jarimasi boshlandi" kabi hodisalar uchun) — hali kod bazasida yo'q.

---

## 9. Ma'lum cheklovlar / texnik qarz

- Shrift fayllari (Inter) ulanmagan — hozircha tizim shrifti ishlatiladi.
- `ChargingSessionScreen`dagi mashina rasmi vaqtinchalik tashqi URL (Unsplash) — production uchun haqiqiy avtomobil rasmi/PNG kerak.
- `SwipeToStopButton` faqat frontend animatsiyasi — haqiqiy `onComplete`da hali faqat `navigation.goBack()` chaqiradi, `SessionsAPI.stop()` ulanmagan.
- Xarita uchun Google Maps API kaliti sozlanmagan (`app.json`da `ios.config.googleMapsApiKey` / `android.config.googleMaps.apiKey` qo'shilishi kerak — Expo hujjatiga qarang).
- Test (Jest/Detox) hali yo'q.

---

## 10. Ishga tushirish

```bash
cd voltmax-app
npm install
npx expo start
```

- iOS simulyator: `i` tugmasi (yoki `npm run ios`)
- Android emulyator: `a` tugmasi (yoki `npm run android`)
- Fizik qurilma: Expo Go ilovasi orqali QR skanerlash

`npm run typecheck` — TypeScript xatolarini tekshirish uchun.
