/* Ilova MANTIG'INING sinovlari.
 *
 * Backendda 42 ta sinov to'plami bor edi, ilovada esa bitta ham yo'q —
 * faqat `tsc` tipni tekshirardi. Ya'ni mantiq buzilsa buni faqat
 * telefonda ochib ko'rgandagina bilardik, va eng nozik joylar aynan shu
 * yerda: token yangilash, sessiya boshlash oqimi, qayta ulanish.
 *
 * Ishlatish:
 *     npx tsc --project tsconfig.test.json
 *     node test_app.js
 *
 * EKRANLAR SINALMAYDI: ular React va butun RN muhitini talab qiladi.
 * Xatolar esa deyarli har doim mantiqda bo'ladi, ekranda emas.
 *
 * Tarmoqqa CHIQMAYDI: `axios` almashtiriladi va har so'rovga qanday
 * javob berish sinovning o'zida yoziladi.
 */
'use strict';

const path = require('path');
const Module = require('module');

const BUILD = path.join(__dirname, '.test-build');

let failures = 0;

function check(label, condition, extra = '') {
  const mark = condition ? 'OK  ' : 'XATO';
  console.log(`${mark}  ${label.padEnd(56)} ${extra}`);
  if (!condition) failures += 1;
}

/* ══ Almashtiriladigan modullar ══════════════════════════════════
   `react-native` va `expo-*` faqat qurilmada ishlaydi. `axios` esa
   ataylab almashtiriladi: sinov tarmoqqa chiqmasligi kerak. */

const rnStubs = {
  'react-native': {
    Platform: { OS: 'android', select: (o) => o.android ?? o.default },
    Alert: { alert: () => {} },
    Linking: { openURL: async () => true },
  },
  // `__esModule` SHART: TypeScript `import X from '...'` ni
  // `__importDefault(require(...))` ga o'giradi va bu belgisiz obyekt
  // yana bir qavat `default` ichiga o'raladi
  'expo-constants': { __esModule: true, default: { expoConfig: { extra: {} } } },
  '@react-native-async-storage/async-storage': {
    __esModule: true,
    default: {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    },
  },
  'expo-notifications': {
    getPermissionsAsync: async () => ({ status: 'granted' }),
    requestPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[test]' }),
    setNotificationHandler: () => {},
    AndroidImportance: { DEFAULT: 3 },
    setNotificationChannelAsync: async () => {},
  },
  'expo-device': { isDevice: true },
  'expo-image-picker': {},
};

/* Axios o'rnini bosuvchi. Har so'rov `routes.handle` ga tushadi va
   javobni sinovning o'zi belgilaydi. */
const axiosStub = createAxiosStub();

function createAxiosStub() {
  const state = {
    calls: [],
    // Sinov shu funksiyani almashtiradi
    handle: () => ({ status: 200, data: {} }),
  };

  function makeResponse(config) {
    state.calls.push(config);
    const result = state.handle(config);
    if (result && result.__reject) {
      const error = new Error('so\'rov rad etildi');
      error.config = config;
      error.response = { status: result.status, data: result.data };
      return Promise.reject(error);
    }
    return Promise.resolve({ ...result, config });
  }

  function createInstance(defaults) {
    const handlers = { ok: null, err: null };

    // `apiClient(original)` ko'rinishida ham chaqiriladi — shuning
    // uchun bu FUNKSIYA, obyekt emas
    const instance = function (config) {
      return run({ ...config });
    };

    function run(config) {
      return makeResponse(config).catch((error) => {
        if (handlers.err) return handlers.err(error);
        throw error;
      });
    }

    instance.defaults = { ...defaults, headers: { common: {} } };
    instance.interceptors = {
      request: { use: (fn) => { handlers.request = fn; } },
      response: {
        use: (ok, err) => {
          handlers.ok = ok;
          handlers.err = err;
        },
      },
    };

    ['get', 'delete', 'head'].forEach((method) => {
      instance[method] = (url, config) => run({ method, url, ...config });
    });
    ['post', 'put', 'patch'].forEach((method) => {
      instance[method] = (url, data, config) => run({ method, url, data, ...config });
    });

    return instance;
  }

  const api = {
    create: createInstance,
    post: (url, data, config) => makeResponse({ method: 'post', url, data, ...config }),
    get: (url, config) => makeResponse({ method: 'get', url, ...config }),
  };

  return { api, state };
}

/* ══ Modul yuklagichi ════════════════════════════════════════════
   `@/...` yo'llarini yig'ilgan papkaga yo'naltiradi va yuqoridagi
   almashtirmalarni beradi. */
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === 'axios') return { __esModule: true, default: axiosStub.api, ...axiosStub.api };
  if (rnStubs[request]) return rnStubs[request];
  if (request.startsWith('@/')) {
    return originalLoad(path.join(BUILD, request.slice(2)), parent, isMain);
  }
  return originalLoad(request, parent, isMain);
};

global.__DEV__ = true;

function load(name) {
  const full = path.join(BUILD, name);
  delete require.cache[require.resolve(full)];
  return require(full);
}

function reset() {
  // Har sinovdan oldin modullar qaytadan yuklanadi: ular ichida holat
  // saqlanadi (token, soket, kutilayotgan yangilash)
  Object.keys(require.cache)
    .filter((key) => key.startsWith(BUILD))
    .forEach((key) => delete require.cache[key]);
  axiosStub.state.calls.length = 0;
  axiosStub.state.handle = () => ({ status: 200, data: {} });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* So\'rov XATO bilan tugasa sinov yiqilmasligi kerak: u shu yerda
   ushlanadi va tekshiruv oddiy "XATO" bo\'lib chiqadi. Aks holda bitta
   muammo butun to\'plamni to\'xtatib, qolganini ko\'rsatmay qo\'yardi. */
async function attempt(promise) {
  try {
    return { ok: true, value: await promise };
  } catch (error) {
    return { ok: false, reason: error?.response?.status || error?.message || error };
  }
}

/* ══ 1. Token yangilash ══════════════════════════════════════════ */
async function testTokenRefresh() {
  console.log('\n-- Token yangilash --');

  reset();
  const store = load('store/useAuthStore').useAuthStore;
  store.setState({ accessToken: 'eski', refreshToken: 'refresh-1', phone: '998900000001' });
  const { apiClient } = load('services/api');

  let refreshCalls = 0;
  axiosStub.state.handle = (config) => {
    if (String(config.url).includes('/auth/token/refresh/')) {
      refreshCalls += 1;
      return { status: 200, data: { access: 'yangi', refresh: 'refresh-2' } };
    }
    // Birinchi urinishda 401, qayta urinishda muvaffaqiyat
    if (config.headers?.Authorization === 'Bearer yangi') {
      return { status: 200, data: { ok: true } };
    }
    return { __reject: true, status: 401, data: {} };
  };

  const res = await attempt(apiClient.get('/auth/profile/'));
  check('401 dan keyin token yangilandi va so\'rov takrorlandi',
        res.ok && res.value.data?.ok === true, res.reason || '');
  check('yangilash bir marta chaqirildi', refreshCalls === 1, refreshCalls);

  // ROTATSIYA: server yangi `refresh` beradi va uni saqlash SHART.
  // Saqlanmasa keyingi yangilash ishlamay, foydalanuvchi bir soatdan
  // keyin tizimdan chiqib ketardi.
  check('yangi refresh saqlandi',
        store.getState().refreshToken === 'refresh-2',
        store.getState().refreshToken);
  check('yangi access saqlandi', store.getState().accessToken === 'yangi');
}

/* ══ 2. Bir vaqtda kelgan 401 lar ════════════════════════════════ */
async function testSingleFlight() {
  console.log('\n-- Parallel so\'rovlar --');

  reset();
  const store = load('store/useAuthStore').useAuthStore;
  store.setState({ accessToken: 'eski', refreshToken: 'refresh-1' });
  const { apiClient } = load('services/api');

  let refreshCalls = 0;
  axiosStub.state.handle = (config) => {
    if (String(config.url).includes('/auth/token/refresh/')) {
      refreshCalls += 1;
      return { status: 200, data: { access: 'yangi', refresh: 'refresh-2' } };
    }
    if (config.headers?.Authorization === 'Bearer yangi') {
      return { status: 200, data: { ok: true } };
    }
    return { __reject: true, status: 401, data: {} };
  };

  // Ekranda bir vaqtda bir necha so'rov ketadi va hammasi 401 oladi.
  // Har biri alohida yangilash yuborsa, serverdagi eski refresh
  // tokenlar bekor bo'lib, foydalanuvchi tizimdan chiqib ketardi.
  const all = await Promise.all([
    apiClient.get('/wallet/balance/'),
    apiClient.get('/sessions/'),
    apiClient.get('/bookings/'),
  ]);

  check('uchala so\'rov ham muvaffaqiyatli',
        all.every((r) => r.data?.ok === true));
  check('yangilash FAQAT BIR MARTA yuborildi', refreshCalls === 1, refreshCalls);
}

/* ══ 3. Qaysi manzillar qayta urinilmaydi ════════════════════════ */
async function testNoRetryList() {
  console.log('\n-- Qayta urinish ro\'yxati --');

  reset();
  const store = load('store/useAuthStore').useAuthStore;
  store.setState({ accessToken: 'eski', refreshToken: 'refresh-1' });
  const { apiClient } = load('services/api');

  let refreshCalls = 0;
  axiosStub.state.handle = (config) => {
    if (String(config.url).includes('/auth/token/refresh/')) {
      refreshCalls += 1;
      return { status: 200, data: { access: 'yangi', refresh: 'refresh-2' } };
    }
    if (config.headers?.Authorization === 'Bearer yangi') {
      return { status: 200, data: { ok: true } };
    }
    return { __reject: true, status: 401, data: {} };
  };

  // Kirish manzillari: yangilash ma'nosiz — ular tokenni O'ZI beradi
  await apiClient.post('/auth/verify-otp/', {}).catch(() => {});
  check('verify-otp uchun yangilash yuborilmadi', refreshCalls === 0, refreshCalls);

  // Lekin `/auth/profile/`, `/auth/vehicles/`, `/auth/avatar/` ham shu
  // yo'lda turadi. Ilgari butun `/auth/` chetlab o'tilardi va bu
  // ekranlar token eskirganda jimgina xato berardi.
  refreshCalls = 0;
  const profile = await attempt(apiClient.get('/auth/profile/'));
  check('profil uchun yangilash ISHLADI',
        refreshCalls === 1 && profile.ok && profile.value.data?.ok === true,
        profile.ok ? refreshCalls : "so'rov yiqildi");

  refreshCalls = 0;
  const vehicles = await attempt(apiClient.get('/auth/vehicles/'));
  check('mashinalar uchun ham ishladi',
        refreshCalls === 1 && vehicles.ok && vehicles.value.data?.ok === true,
        vehicles.ok ? refreshCalls : "so'rov yiqildi");
}

/* ══ 4. Sessiyani boshlash oqimi ═════════════════════════════════ */
async function testChargingFlow() {
  console.log('\n-- Sessiyani boshlash --');

  reset();
  const store = load('store/useAuthStore').useAuthStore;
  store.setState({ accessToken: 'token', refreshToken: 'refresh' });
  const charge = load('services/chargeSession');

  // Mock stansiya: server darhol sessiya qaytaradi
  axiosStub.state.handle = (config) => {
    if (String(config.url).includes('/sessions/start/')) {
      return { status: 201, data: { id: '1', status: 'charging' } };
    }
    return { status: 200, data: {} };
  };

  const stages = [];
  const session = await charge.startChargingSession('5', '7', {
    onStage: (stage) => stages.push(stage),
  });
  check('201 da sessiya darhol qaytdi', session.id === '1', session.id);
  check('bosqichlar to\'g\'ri', stages.join(',') === 'requesting,started', stages);

  // Haqiqiy charger: 202 → kutish → sessiya paydo bo'ladi
  reset();
  store.setState({ accessToken: 'token', refreshToken: 'refresh' });
  const charge2 = load('services/chargeSession');

  let activeCalls = 0;
  axiosStub.state.handle = (config) => {
    const url = String(config.url);
    if (url.includes('/sessions/start/')) return { status: 202, data: { pending: true } };
    if (url.includes('/sessions/active/')) {
      activeCalls += 1;
      // Uchinchi so'rovda charger javob beradi
      return activeCalls >= 3
        ? { status: 200, data: { id: '9', status: 'charging' } }
        : { status: 204, data: null };
    }
    return { status: 200, data: {} };
  };

  const stages2 = [];
  const live = await charge2.startChargingSession('5', '7', {
    onStage: (stage) => stages2.push(stage),
  });
  check('202 dan keyin sessiya kutib olindi', live.id === '9', live.id);
  check('kutish bosqichi aytildi', stages2.includes('awaiting_plug'), stages2);

  // Tarmoq uzilishi butun oqimni to'xtatmasligi kerak: charger
  // allaqachon boshlagan bo'lishi mumkin va hisobdan pul yechilaveradi
  reset();
  store.setState({ accessToken: 'token', refreshToken: 'refresh' });
  const charge3 = load('services/chargeSession');

  let attempts = 0;
  axiosStub.state.handle = (config) => {
    const url = String(config.url);
    if (url.includes('/sessions/start/')) return { status: 202, data: { pending: true } };
    if (url.includes('/sessions/active/')) {
      attempts += 1;
      if (attempts <= 2) return { __reject: true, status: 500, data: {} };
      return { status: 200, data: { id: '11', status: 'charging' } };
    }
    return { status: 200, data: {} };
  };

  const survived = await charge3.startChargingSession('5', '7', {});
  check('tarmoq uzilishidan keyin ham sessiya topildi',
        survived.id === '11', survived.id);

  // Bekor qilish
  reset();
  store.setState({ accessToken: 'token', refreshToken: 'refresh' });
  const charge4 = load('services/chargeSession');
  axiosStub.state.handle = (config) => {
    if (String(config.url).includes('/sessions/start/')) {
      return { status: 202, data: { pending: true } };
    }
    return { status: 204, data: null };
  };

  const cancelRef = { current: false };
  const promise = charge4.startChargingSession('5', '7', { cancelRef });
  setTimeout(() => { cancelRef.current = true; }, 50);

  let cancelled = false;
  try {
    await promise;
  } catch (error) {
    cancelled = error instanceof charge4.ChargingCancelledError;
  }
  check('bekor qilish ishladi', cancelled);
}

/* ══ 5. Qayta ulanish oralig'i ═══════════════════════════════════ */
async function testReconnect() {
  console.log('\n-- Jonli yangilanish --');

  reset();

  const sockets = [];
  global.WebSocket = function (url) {
    this.url = url;
    this.close = () => { if (this.onclose) this.onclose(); };
    sockets.push(this);
  };

  const timers = [];
  const realTimeout = global.setTimeout;
  global.setTimeout = (fn, ms) => {
    timers.push(ms);
    return realTimeout(() => {}, 0);          // haqiqatan kutmaymiz
  };

  const live = load('services/liveUpdates');
  const unsubscribe = live.subscribeToStationUpdates(() => {});
  check('birinchi obunachi ulandi', sockets.length === 1, sockets.length);

  // Har uzilishda oraliq ikki baravar oshishi kerak: server uzoq
  // ishlamasa telefon uni har uch soniyada bezovta qilardi
  sockets[0].onclose();
  const first = timers[timers.length - 1];
  live.subscribeToStationUpdates(() => {});    // hali obunachi bor

  global.setTimeout = realTimeout;
  unsubscribe();

  check('qayta ulanish rejalashtirildi', first >= 3000 && first < 4100, first);
  delete global.WebSocket;
}

/* ══ 6. Chiqish ══════════════════════════════════════════════════ */
async function testLogout() {
  console.log('\n-- Chiqish --');

  reset();
  const store = load('store/useAuthStore').useAuthStore;
  store.setState({
    accessToken: 'token', refreshToken: 'refresh-1',
    phone: '998900000001', name: 'Aziz', avatarUrl: 'http://x/a.jpg',
  });

  let revoked = null;
  axiosStub.state.handle = (config) => {
    if (String(config.url).includes('/auth/logout/')) revoked = config.data;
    return { status: 205, data: {} };
  };

  store.getState().logout();
  await sleep(10);

  const after = store.getState();
  check('token o\'chirildi', after.accessToken === null && after.refreshToken === null);
  check('ism va rasm ham tozalandi',
        after.name === null && after.avatarUrl === null);
  // Faqat telefondagi nusxani o'chirish yetarli emas edi: server
  // tomonda refresh token yana bir oy amal qilaverardi
  check('token SERVERDA ham bekor qilindi',
        revoked && revoked.refresh === 'refresh-1', revoked);
}

/* ══ Ishga tushirish ═════════════════════════════════════════════ */
(async function run() {
  await testTokenRefresh();
  await testSingleFlight();
  await testNoRetryList();
  await testChargingFlow();
  await testReconnect();
  await testLogout();

  console.log('\n' + (failures ? `*** ${failures} TA XATO ***` : 'HAMMASI OK'));
  process.exit(failures ? 1 : 0);
})();
