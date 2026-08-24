# VoltMax — EV zaryadlash mobil ilovasi

Premium EV zaryadlash stansiyalarini topish, zaryadlashni boshqarish va to'lov qilish uchun React Native (Expo) ilovasi.

## Loyiha strukturasi

```
voltmax-app/
├── App.tsx                      # Kirish nuqtasi
├── app.json                     # Expo konfiguratsiyasi
├── package.json
├── tsconfig.json
└── src/
    ├── navigation/
    │   ├── AppNavigator.tsx     # Barcha 6 ekranni bog'lovchi stack navigator
    │   └── types.ts             # Navigatsiya param tiplari
    ├── screens/
    │   ├── OnboardingScreen.tsx     # 1. Splash/Onboarding
    │   ├── MapScreen.tsx            # 2. Xarita/Bosh ekran
    │   ├── StationDetailScreen.tsx  # 3. Stansiya detali
    │   ├── ChargingSessionScreen.tsx# 4. Live zaryadlash monitoring
    │   ├── WalletScreen.tsx         # 5. Hamyon/to'lov
    │   └── HistoryScreen.tsx        # 6. Sessiyalar tarixi
    ├── components/               # Qayta ishlatiladigan UI qismlari (keyingi bosqich)
    ├── theme/
    │   ├── colors.ts             # Brend rang tokenlari (navy/blue/mint)
    │   ├── typography.ts         # Shrift o'lchamlari
    │   └── index.ts              # spacing, radius va umumiy theme
    ├── services/
    │   └── api.ts                # Backend bilan aloqa (axios)
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

## Keyingi bosqich

Har bir ekran hozircha placeholder holatida (`TODO` izohlari bilan). Keyingi bosqichda
`src/components/` ichida qayta ishlatiladigan UI elementlari (StationCard, ChargingRing,
BalanceCard va h.k.) yaratiladi va ular screen fayllariga joylashtiriladi — Canva'da
tasdiqlangan dizayn asosida.
