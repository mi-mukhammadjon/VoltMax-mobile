# VoltMax — Loyiha Handoff Hujjati

**Oxirgi yangilanish:** 2026-08-27
**Loyiha turi:** EV zaryadlash stansiyalarini topish va boshqarish uchun mobil ilova
**Stack:** React Native (Expo 51) + TypeScript
**Holat:** Frontend Django backend bilan real ishlaydi (auth, stansiyalar, sessiyalar, hamyon, bronlar, sharhlar). Dizayn tili — **Prime EV** UI kit uslubi: yashil brend rangi, Manrope shrifti, tekis chegarali kartalar, light/dark mavzu.

---

## 0. Keyingi vazifalar (ustuvorlik tartibida)

- [ ] **Bildirishnomalar backend'i**: `NotificationsScreen` hozircha lentani mavjud ma'lumotlardan (faol sessiya + bronlar + tranzaksiyalar) yig'adi. Backend `/api/notifications/` qo'shilganda `buildFeed` o'rniga `NotificationsAPI.list()` qo'yiladi + FCM push.
- [ ] **Sevimlilarni saqlash**: `useAppStore.favoriteStationIds` faqat xotirada — ilova qayta ochilganda yo'qoladi. Backend endpoint yoki AsyncStorage persist kerak.
- [ ] **Qidiruvni backendga o'tkazish**: `SearchScreen` store'dagi ro'yxatdan qidiradi. Stansiyalar soni ko'payganda `StationsAPI.search(q)` kerak bo'ladi.
- [ ] **Qo'llab-quvvatlash oqimi**: `MapScreen`dagi naushnik tugmasi hali stub (`showAlert`).
- [ ] **Test**: Jest/Detox hali yo'q. `eslint` devDependency qo'shilmagan — `npm run lint` ishlamaydi.

---

## 1. Loyiha haqida

VoltMax — Toshkentdagi EV zaryadlash stansiyalari tarmog'i uchun mobil ilova. Foydalanuvchi bosh ekranda balans/yaqin stansiyalarni ko'radi, xarita yoki ro'yxatdan stansiya tanlaydi, ulagichni tanlab zaryadlashni boshlaydi, jarayonni real vaqtda kuzatadi va hamyon orqali to'laydi.

**Dizayn yo'nalishi:** CodeCanyon "Prime EV Charging Flutter App UI Kit" uslubi — yashil asosiy rang, Manrope tipografiyasi, soyasiz/tekis kartalar, nozik chegaralar, pill-shaklidagi chip'lar, bottom-sheet filtrlar.

---

## 2. Tech stack

| Kategoriya | Tanlov |
|---|---|
| Framework | Expo ~51 + React Native 0.74 + TypeScript (strict) |
| Navigatsiya | `@react-navigation/native` + native-stack + bottom-tabs |
| Holat | `zustand` (`useAppStore`, `useAuthStore`, `useThemeStore`, `useSettingsStore`, `useAlertStore`) |
| HTTP | `axios` (`src/services/api.ts`, Bearer token interceptor) |
| Realtime | WebSocket (`src/services/liveUpdates.ts`) |
| Xarita | `react-native-maps` + maxsus light/dark stil |
| Ikonkalar | `lucide-react-native` |
| Gradient | `expo-linear-gradient` |
| Shrift | Manrope (`@expo-google-fonts/manrope`) |
| Saqlash | `@react-native-async-storage/async-storage` (auth token persist) |

O'rnatish: `npm install && npx expo start`. Tekshirish: `npm run typecheck`.

---

## 3. Struktura

```
src/
├── navigation/
│   ├── AppNavigator.tsx      # Root stack + MainTabs (5 tab)
│   └── types.ts              # RootStackParamList + MainTabParamList
│
├── screens/
│   ├── LoginScreen.tsx           # Telefon raqam (real OTP yuboradi)
│   ├── OtpScreen.tsx             # OTP tasdiqlash → token saqlanadi
│   ├── HomeScreen.tsx            # ⭐ Tab: Asosiy — dashboard
│   ├── MapScreen.tsx             # Stack: Xarita (Home'dan ochiladi)
│   ├── SearchScreen.tsx          # ⭐ Stack: Qidiruv
│   ├── NotificationsScreen.tsx   # ⭐ Stack: Bildirishnomalar lentasi
│   ├── StationsListScreen.tsx    # Tab: Stansiyalar (qidiruv + filtr sheet)
│   ├── StationDetailScreen.tsx   # Stack: hero + tablar + CTA + sevimli
│   ├── ChargingSessionScreen.tsx # Stack: jonli monitoring + swipe-to-stop
│   ├── ChargingTabScreen.tsx     # Tab: Zaryadlash — jonli karta + oxirgi sessiyalar
│   ├── FavoritesScreen.tsx       # Tab: Sevimli
│   ├── ProfileScreen.tsx         # Tab: Profil — hamyon qatori + menyu guruhlari
│   ├── WalletScreen.tsx          # Balans + to'ldirish + tranzaksiyalar
│   ├── HistoryScreen.tsx         # Sessiyalar tarixi + oylik grafik
│   ├── MyBookingsScreen.tsx / NewBookingScreen.tsx
│   ├── MyVehiclesScreen.tsx / EditProfileScreen.tsx
│   └── NotificationSettingsScreen.tsx / AboutAppScreen.tsx
│
├── components/
│   ├── Card.tsx                  # ⭐ Umumiy tekis karta
│   ├── SectionHeader.tsx         # ⭐ Bo'lim sarlavhasi + "Barchasi ›"
│   ├── SearchField.tsx           # ⭐ Qidiruv maydoni (bosiladigan / input rejimi)
│   ├── StationFilterSheet.tsx    # ⭐ Filtr bottom-sheet (tur/quvvat/saralash)
│   ├── EmptyState.tsx            # ⭐ Umumiy bo'sh holat
│   ├── Skeleton.tsx              # ⭐ Yuklanish skeletlari
│   ├── StationCompactCard.tsx    # ⭐ Home karuseli kartasi
│   ├── StationListCard.tsx       # Ro'yxat kartasi
│   ├── StationMarker.tsx / StationDetailSheet.tsx
│   ├── PrimaryButton.tsx / ScreenHeader.tsx
│   ├── SegmentedTabs.tsx / UnderlineTabs.tsx
│   ├── AmenityIcon.tsx / BatteryLevelIndicator.tsx
│   ├── AnimatedStatusCircle.tsx / ConnectorWaitingOverlay.tsx
│   └── SwipeToStopButton.tsx / CustomAlert.tsx
│
├── theme/       colors.ts (dark) · colorsLight.ts · typography.ts · mapStyle.ts
│               index.ts (spacing/radius/shadow) · useThemeColors.ts
├── services/    api.ts · chargeSession.ts · liveUpdates.ts · alert.ts
├── store/       useAppStore · useAuthStore · useThemeStore · useSettingsStore · useAlertStore
└── types/       index.ts
```

⭐ = 2026-08-27 sessiyasida qo'shilgan.

---

## 4. Dizayn tizimi

Barcha ranglar/o'lchamlar `src/theme/` ichida. **Ekranlarda hech qachon `colors.ts`ni to'g'ridan-to'g'ri import qilmang** — `useThemeColors()` hook'idan foydalaning, aks holda light/dark almashganda komponent yangilanmaydi.

Odatiy shakl:

```tsx
const colors = useThemeColors();
const styles = useMemo(() => createStyles(colors), [colors]);
```

### Ranglar

| Token | Dark | Light |
|---|---|---|
| `bgPrimary` | `#0E1512` | `#FFFFFF` |
| `bgSecondary` (karta) | `#161E1A` | `#FFFFFF` |
| `bgElevated` (input/chip) | `#1E2823` | `#F5F6F7` |
| `primary` | `#2BB24C` | `#22B04B` |
| `primarySoft` (yumshoq fon) | `rgba(43,178,76,0.18)` | `#E8F6EC` |
| `border` | `#26312B` | `#E8EAE9` |

Status: `statusAvailable` (yashil) / `statusBusy` (amber) / `statusOffline` (kulrang) / `statusError` (qizil).
`gradientPrimary` — balans kartasi va jonli sessiya kartasida ishlatiladi.

### Tipografiya / o'lchamlar

Manrope: Regular / Medium / SemiBold / Bold. Shkala: `xs 12 → sm 14 → base 16 → lg 18 → xl 22 → xxl 28 → display 36`.
`spacing`: 4/8/16/24/32/48. `radius`: sm 8 · md 12 (kartalar) · lg 16 · xl 24 · **btn 10** (CTA) · pill 999.
`shadow.card` deyarli ko'rinmas (kartalarni chegara ajratadi), `shadow.float` esa FAB/sheet/gradient kartalar uchun.

---

## 5. Navigatsiya

```
Login → Otp → [stack reset] → MainTabs
                                 │
   ┌────────┬───────────┬────────┴───┬──────────┐
   ▼        ▼           ▼            ▼          ▼
 Asosiy  Stansiyalar  Zaryadlash   Sevimli    Profil
 (Home)                                          │
   │                                             ├─▶ EditProfile / MyVehicles
   ├─▶ Map ──▶ StationDetailSheet                ├─▶ MyBookings / History
   ├─▶ Search                                    ├─▶ NotificationSettings / AboutApp
   ├─▶ Notifications ──▶ NotificationSettings    └─▶ Wallet
   ├─▶ Wallet / History
   └─▶ StationDetail ──▶ NewBooking
             │
             ▼
      ChargingSession (swipe-to-stop)
```

**Muhim o'zgarish (2026-08-27):** `Main` tab endi `MapScreen` emas, **`HomeScreen`**. Xarita root stack'dagi `Map` ekraniga ko'chirildi va Home'dagi "Xarita" tugmasi orqali ochiladi (o'z ichida orqaga tugmasi bor).

---

## 6. Ekranlar bo'yicha holat

**HomeScreen (Asosiy)** — salomlashuv (vaqtga qarab) + bildirishnoma tugmasi, gradient balans kartasi ("To'ldirish" → Wallet), qidiruv maydoni (→ Search), 4 ta tezkor amal (Xarita/Bron/Hamyon/Tarix), faol sessiya banneri, "Yaqin atrofdagi stansiyalar" gorizontal karuseli (masofa bo'yicha saralangan, 6 ta), `SessionsAPI.getInsights()` asosidagi statistika (kVt·s / CO₂ / sessiyalar). Tortib-yangilash va yuklanish skeletlari bor.

**StationsListScreen** — jonli qidiruv (nom + manzil), `StationFilterSheet` (ulagich turi AC/DC, minimal quvvat 22/60/120 kVt, saralash: masofa/narx/quvvat/reyting, "faqat bo'sh" va "chegirmali" tugmalari), natijalar soni, skeletlar, filtrga mos tushuntirishli bo'sh holat.

**SearchScreen** — autofocus input, so'nggi qidiruvlar chip'lari (`useAppStore.recentSearches`, xotirada), jonli natijalar.

**NotificationsScreen** — faol sessiya + bronlar + tranzaksiyalardan yig'ilgan, vaqt bo'yicha saralangan lenta ("5 daqiqa oldin" formatida). O'ng yuqorida sozlamalarga o'tish.

**ChargingTabScreen** — faol sessiya bo'lsa: gradient jonli karta (foiz + progress chizig'i + qolgan vaqt), 3 ta statistika (kVt·s / so'm / o'tgan vaqt), tarif/quvvat qatorlari, "Jarayonni ochish" CTA. Bo'lmasa: bo'sh holat + "Stansiya tanlash". Pastda oxirgi 5 sessiya. Ekran har ochilganda `SessionsAPI.getActive()` bilan sinxronlanadi (sessiya boshqa qurilmadan boshlangan bo'lsa ham ko'rinadi).

**ProfileScreen** — avatar bloki, bosiladigan hamyon kartasi (balans + "To'ldirish"), uchta menyu guruhi (Hisob / Faoliyat / Sozlamalar) ikonkali qatorlar bilan, mavzu tanlovi (Tizim/Yorug'/Tungi), "Chiqish" va "Profilni o'chirish".

### Ulagich tanlash oqimi (2026-08-27)

Ulagich qatori bitta umumiy komponentda — `ConnectorRow.tsx` (Stansiya detali va xarita sheet'ida bir xil ko'rinadi). Har holat o'z vizual signaliga ega:

| Holat | Qatorda | Bosilganda |
|---|---|---|
| **Bo'sh** | yashil nuqta + "Tanlash" | zaryadlash boshlanadi → `ConnectorConnectingOverlay` |
| **Band** | pulslanuvchi amber nuqta + jonli foiz chizig'i | `ConnectorStatusModal` — animatsiyali foiz halqasi (SVG), qachon bo'shashi, "Bron qilish" |
| **Pullik parkovka** | amber parkovka belgisi + daqiqa tarifi | `ConnectorStatusModal` — amber halqa, tarif va hisoblangan summa |
| **Ishlamayapti** | uzuq-uzuq chegara, so'ngan ko'rinish | `ConnectorStatusModal` — chayqaluvchi ikonka, sababi, "Boshqa ulagich" |

**Ulanish jarayoni** (`ConnectorConnectingOverlay.tsx`) endi "yuklanmoqda" o'rniga aniq bosqichlarni ko'rsatadi — `chargeSession.ts`dagi `ChargingStage` orqali:
`requesting` (server'ga so'rov) → `contacting` (charger'ga RemoteStart yuborildi) → `awaiting_plug` (ulagichni ulang, teskari sanoq bilan) → `started`. Har bosqich stepper'da ✓/spinner bilan belgilanadi, pastda "Bekor qilish".

**Parkovka to'lovi** hisobga olinadi: `ChargingSession.cost_so_far` = energiya + parkovka. `stop()` da parkovka daqiqalari/summasi `final_parking_minutes` / `final_parking_cost` ga muzlatiladi, hamyondan umumiy summa yechiladi, tranzaksiya tavsifida ikkala qism ajratilgan holda yoziladi. Ilovada "Sizning to'lovingiz" tagida taqsimot chiqadi (`energyCost` / `parkingCost` / `parkingMinutes`).

**Backend tomoni** (`voltmax-backend`): `Connector` modeliga `parking_started_at` va `offline_reason` maydonlari qo'shildi (migratsiya `stations/0004`), serializer esa hosilaviy `parkingMode` / `parkingFeePerMin` / `parkingMinutes` / `estimatedFreeInMinutes` / `offlineReason` maydonlarini yuboradi. OCPP `SuspendedEV` va `Finishing` holatlari endi ulagichni bo'sh deb belgilamaydi — parkovka rejimini boshlaydi.

`ProgressRing.tsx` — `react-native-svg` asosidagi animatsiyali halqa (qiymat o'zgarganda silliq to'ladi), band/parkovka holatlarida ishlatiladi. WebSocket yangilanishi kelganda halqa o'zi qayta animatsiyalanadi.

**Marshrut qurish** (`src/services/directions.ts`): stansiya detali footer'idagi navigatsiya tugmasi va xarita sheet'idagi tugma stansiyaga marshrut qurib, tashqi navigatorda darhol ochadi. Ilovalar tartibi: Yandex Navigator → Yandex Xaritalar → Google Maps → tizim xaritasi → brauzerdagi Google Maps (fallback). Boshlanish nuqtasi berilmaydi — navigator uni joriy joylashuvdan oladi, shuning uchun geolokatsiya ruxsati kerak emas.

> **Diqqat:** Android 11+ da `Linking.canOpenURL()` ishlashi uchun `android/app/src/main/AndroidManifest.xml` dagi `<queries>` ro'yxati kerak (navigator paketlari + `geo` sxemasi). Bu **qo'lda** qo'shilgan — `network_security_config` kabi, `expo prebuild` uni qayta yaratmaydi, shuning uchun prebuild ishlatilsa qaytadan qo'shish kerak. iOS uchun mos ro'yxat `app.json` → `ios.infoPlist.LSApplicationQueriesSchemes` da.

**StationDetailScreen** — hero rasm, orqaga + **sevimli (yurak)** tugmalari, chiziqli tablar (Ulagichlar / Tafsilotlar / Sharhlar), sharh qoldirish, "Bron qilish" va zaryadlashni boshlash CTA.

**MapScreen** — holat-rangli markerlar, `StationDetailSheet`, hamyon chip'i, qidiruv/bildirishnoma tugmalari (endi haqiqiy ekranlarga ulangan), joylashuv va info tugmalari.

Qolgan ekranlar (Wallet, History, MyBookings, NewBooking, MyVehicles, EditProfile, NotificationSettings, AboutApp, ChargingSession, Login, Otp) oldingi sessiyalarda yakunlangan va backend bilan ishlaydi.

---

## 7. Backend bilan aloqa

`src/services/api.ts` — `baseURL: http://192.168.1.8:8000/api` (LAN IP o'zgarsa shu yerni yangilang; Android emulyator uchun `http://10.0.2.2:8000/api`). Barcha so'rovlarga `useAuthStore.accessToken` Bearer sifatida qo'shiladi.

API guruhlari: `AuthAPI` (OTP Telegram Gateway orqali, profil CRUD), `StationsAPI`, `ReviewsAPI`, `VehiclesAPI`, `BookingsAPI`, `SessionsAPI` (start/active/stop/insights), `WalletAPI`.

**Zaryadlashni boshlash oqimi** (`src/services/chargeSession.ts`): backend `201` qaytarsa sessiya darhol tayyor; `202` qaytarsa real charger'ga `RemoteStartTransaction` yuborilgan — `ConnectorWaitingOverlay` ko'rsatiladi va 30 soniya davomida har 2 soniyada `/sessions/active/` so'raladi.

**Realtime** (`src/services/liveUpdates.ts`): `ws://…/ws/updates/stations/`. Soket **bitta** — obunachilar sanog'i bilan boshqariladi (birinchi ekran ulaydi, oxirgisi uzadi), avtomatik qayta ulanish 3 soniyada.

---

## 8. Ma'lum cheklovlar

- Sevimlilar va qidiruv tarixi faqat xotirada (ilova qayta ochilganda yo'qoladi).
- Bildirishnomalar lentasi hosila — haqiqiy push/notification endpoint yo'q.
- `MapScreen`dagi qo'llab-quvvatlash tugmasi stub.
- Test va eslint konfiguratsiyasi yo'q.
- `ChargingSessionScreen`dagi mashina rasmi tashqi URL (Unsplash).

---

## 9. Ishga tushirish

```bash
npm install
npx expo start      # i — iOS, a — Android, yoki Expo Go bilan QR
npm run typecheck   # TypeScript tekshiruvi
```
