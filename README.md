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

## Holat

Frontend to'liq: barcha ekranlar (Onboarding → Auth → 5 tabli asosiy navigatsiya + Wallet/History)
mock data bilan ishlaydi. Batafsil holat va keyingi qadamlar uchun `HANDOFF.md`ga qarang —
asosiylari: backend integratsiyasi, Google Maps API kaliti, sevimlilar mantig'i.
