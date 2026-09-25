# Хвостик (TAILIO)

Мобильное приложение для хозяев собак и кошек: карта с геозонами, GPS-точка питомца, здоровье, SOS и чат со специалистом **Хвостик**. Интерфейс на русском, дизайн по макету Figma «Проект „Хвостик“ — Фадейкина А.Д.».

Один и тот же код запускается:

- в **браузере** (GitHub Pages / локально) — на компьютере в рамке смартфона 390×844, на телефоне на весь экран;
- на **iPhone / iPad** (в перспективе App Store);
- на **Android** (в перспективе Google Play).

Стек: **Expo (React Native) SDK 54** — без отдельной переписки под каждую платформу.

---

## Зачем это приложение

Хозяин открывает «Хвостик» и сразу видит, в порядке ли питомец: дома ли он, спокоен ли, заряжен ли ошейник. Если питомец вышел из безопасной зоны или пропал — включается SOS: точка на карте, маршрут, свет/звук ошейника, связь с поддержкой.

**Учётные записи приложения** (почта / онбординг / питомцы) пока хранятся **локально на устройстве**. Демо: **`demo@tailio.app`**, код **`111111`**.

**Живой чат** и **кабинет консультанта** уже ходят на облачный бэкенд (не зависят от Mac).

---

## Что уже работает (актуальный статус)

| Область | Статус |
| --- | --- |
| UI / онбординг / вкладки | Рабочий прототип по Figma |
| Аккаунты приложения | Локально (AsyncStorage), без серверной авторизации |
| **Карта** | **OpenFreeMap + MapLibre** (реальные тайлы), не заглушка из макета |
| **Геопозиция** | GPS устройства как временная замена ошейника (`LOCATION_MODE=device`) |
| **Геозоны** | Рисование/ресайз/перенос квадрата; звук при выходе из безопасной / входе в опасную |
| **История перемещений** | OpenFreeMap + полилиния маршрута; треки в JSON-БД на бэкенде (`/api/tracks`) |
| **Живой чат** | Приложение ↔ консультант через WebSocket на **Render Free** |
| Кабинет оператора | PWA на том же сервере чата |
| Публичное демо | GitHub Pages после каждого push в `main` |

### Публичные URL

| Что | URL |
| --- | --- |
| Приложение (Pages) | https://evgeniy-makdak.github.io/tails/ |
| API + кабинет консультанта | https://tailio-chat.onrender.com |
| Health-check | https://tailio-chat.onrender.com/api/health |

Кабинет: `consultant@tailio.app` / `tailio123`  
Render Free после простоя «засыпает» — первый запрос может занять ~30–60 с.

Подробнее про деплой бэка: **[docs/DEPLOY_BACKEND.md](docs/DEPLOY_BACKEND.md)**.  
Про чат: **[docs/CHAT_GUIDE.md](docs/CHAT_GUIDE.md)**.

### Живой чат (кратко)

- Бэкенд: `server/` (Express + WebSocket), прод: **Render** (`tailio-chat.onrender.com`).
- Кабинет: `consultant/` (сборка в `server/public`, открывается по URL Render).
- Pages собирается с `EXPO_PUBLIC_CHAT_LIVE=1` и `EXPO_PUBLIC_API_URL` → Render.
- Локально: `npm run chat:server` (:8787) + кабинет `npm run chat:consultant` (:5173, по умолчанию тоже смотрит на Render через `consultant/.env.development`).

### Карта и геозоны (кратко)

- Движок: **MapLibre GL** + стиль **OpenFreeMap Liberty** (бесплатно, без API-ключа).
- Флаги: `EXPO_PUBLIC_MAP_ENGINE=maplibre` (по умолчанию), `EXPO_PUBLIC_LOCATION_MODE=device`.
- Главная вкладка «Карта»: точка по GPS, зум, recenter, сохранённые зоны.
- «Дом и геозоны»: реальная карта, растягиваемый квадрат зоны, сохранение bounds; алерты:
  - выход из **безопасной** — мягкий сигнал;
  - приближение / вход в **опасную** — тревожный сигнал.
- Когда появится телеметрия ошейника: `EXPO_PUBLIC_LOCATION_MODE=api`.

### История перемещений (кратко)

- Экран «История перемещений»: та же **OpenFreeMap + MapLibre**, полилиния маршрута по GPS-точкам.
- Хранение треков — **на бэкенде**, коллекция `walks` в JSON-БД (`server/src/db.js` + `server/src/trackService.js`), не на устройстве.
- API (JWT пользователя приложения):
  - `GET /api/tracks` — список прогулок; если пусто, сервер сидит 2–3 демо-маршрута около текущего GPS;
  - `GET /api/tracks/:id` — один трек;
  - `POST /api/tracks` — загрузка законченной прогулки `{ points[], petId?, steps? }` (под будущую телеметрию ошейника).
- Клиент: `src/api/tracks.ts`, хук `usePetTracks`. Если Render недоступен — локальные демо-треки офлайн.
- На **Render Free** файл БД эфемерен: после рестарта демо создаётся заново. Для продакшена — Postgres/SQLite.

---

## Что есть в прототипе UI

### Первый запуск

1. Сплэш **TAILIO**
2. Приветственный слоган
3. Регистрация / вход по почте
4. Код из письма (демо: **`111111`**)
5. Соглашение → возможности → имя хозяина → карточка питомца → ошейник (можно пропустить)

### Главные вкладки

| Вкладка | Содержание |
| --- | --- |
| **Главная** | Статус питомца, выбор питомца, чат |
| **Карта** | OpenFreeMap, Live-точка (GPS), геозоны, SOS, история |
| **Здоровье** | Индекс здоровья и метрики |
| **Профиль** | Хозяин, питомцы, документы |

Дополнительно: уведомления, «Дом и геозоны», создание места, история перемещений, SOS.

---

## Как проверить на компьютере (экран как у смартфона)

На вебе приложение **не растягивается на весь монитор**. Оно рисуется внутри чёрной рамки телефона **390×844** (как iPhone 14/15).

### 1. Что нужно один раз

- [Node.js](https://nodejs.org/) **20 LTS или 22+** (SDK 54; Node 18 уже не подходит)
- npm, VS Code или Cursor

### 2. Команды

```bash
cd путь/к/папке/tail
npm install
npm run web
```

Откройте **http://localhost:8081**. Жёсткое обновление: **Cmd+Shift+R** / **Ctrl+Shift+R**.

Порт занят → `npx expo start --web --port 8082`.

### 3. Демо-вход

- Код «из письма»: **`111111`**
- Готовый аккаунт: **`demo@tailio.app`**

### 4. Сброс тестовых пользователей

- Локально: `http://localhost:8081/?reset=1`
- Pages: https://evgeniy-makdak.github.io/tails/?reset=1  
- Или в консоли: `__HVOSTIK_RESET__()`

---

## Как проверить на iPhone и Android (Expo Go)

Прототип открывается через **Expo Go** (SDK 54). На телефоне нет веб-рамки — на весь экран.

| Телефон | Приложение |
| --- | --- |
| **iPhone** | [Expo Go](https://apps.apple.com/app/expo-go/id982107779) |
| **Android** | [Expo Go](https://play.google.com/store/apps/details?id=host.exp.exponent) |

Одна Wi‑Fi с Mac, VPN выключен:

```bash
npx expo start --clear
```

QR `exp://…` → Камера (iPhone) или Scan QR в Expo Go (Android).

**iPhone только на LTE:** `npm run phone` + режим модема iPhone, не Cloudflare-туннель для Expo Go.

**Тестировщик в другом городе:** `npm run tunnel` → ссылка `https://….trycloudflare.com` открыть в **Safari/Chrome**, не в Expo Go. Mac должен оставаться включённым.

Данные аккаунтов на телефоне свои, отдельно от браузера.

---

## Сборка в App Store и Google Play

| Платформа | Как |
| --- | --- |
| **iOS** | [EAS Build](https://docs.expo.dev/build/introduction/) → App Store Connect (`com.hvostik.app`) |
| **Android** | AAB профилем `production` в `eas.json` → Play Console |
| **До магазина** | Профиль `preview` (APK / internal) |

```bash
npm install -g eas-cli
eas login
eas build --platform ios --profile production
eas build --platform android --profile production
```

Папки `ios/` / `android/` в git не хранятся — их собирает EAS.

---

## Стек

| Слой | Технология |
| --- | --- |
| Каркас | Expo SDK 54, React Native 0.81, React 19, TypeScript |
| Навигация | React Navigation 7 |
| Состояние | Zustand + AsyncStorage persist |
| Карта | MapLibre GL + OpenFreeMap; `expo-location`; WebView на native |
| Чат | Node (Express + `ws`), JWT; клиент WebSocket |
| Веб | `react-native-web`, `PhoneShell`, GitHub Pages |
| Хостинг чата | Render Free (`render.yaml`) |
| Сборки магазинов | EAS Build / Submit |

---

## Структура репозитория

```
App.tsx                 вход: шрифты, рамка телефона на вебе, навигация
app.json                имя «Хвостик», иконки, права геолокации
eas.json                профили сборки iOS / Android
render.yaml             Blueprint Render Free для чата
src/navigation/         авторизация, вкладки, корневой стек
src/screens/            онбординг, главная, карта, здоровье, профиль, чат
src/map/                MapLibre, тайлы OpenFreeMap, геозоны, ресайз зоны
src/location/           провайдеры GPS / collar + алерты геозон
src/chat/               live WebSocket-хук чата
src/config/features.ts  флаги MAP / LOCATION / CHAT / API_URL
src/store/              питомцы, сессия, геозоны
server/                 API + WebSocket + статика кабинета
consultant/             исходники PWA-кабинета консультанта
docs/CHAT_GUIDE.md      гайд чата
docs/DEPLOY_BACKEND.md  деплой бэка (Render / Fly)
assets/                 иконки, фото, звуки
```

---

## Демо в браузере (GitHub Pages)

После каждого push в **`main`** Actions собирает веб и публикует в `gh-pages`:

**https://evgeniy-makdak.github.io/tails/**

Сборка печёт live-чат на Render и карту MapLibre (`EXPO_PUBLIC_MAP_ENGINE=maplibre`, `EXPO_PUBLIC_LOCATION_MODE=device`).

- **Телефон** — на весь экран; можно поставить PWA на домашний экран.
- **Компьютер** — рамка 390×844.
- Обновление PWA: обычно достаточно закрыть и снова открыть ярлык; если «залипло» — очистить данные сайта `github.io`.

Первичная настройка Pages (один раз): Settings → Pages → Deploy from branch → `gh-pages` / (root).

Локальная проверка production-сборки:

```bash
npm run build:web
npx serve dist
```

---

## Полезные команды

```bash
npm install                    # зависимости
npm run web                    # превью в браузере
npx expo start                 # QR для Expo Go
npm run phone                  # iPhone на LTE: режим модема
npm run tunnel                 # удалённая проверка в браузере
npm run lint                   # TypeScript
npm run build:web              # сборка для Pages
npm run chat:server            # локальный API чата :8787
npm run chat:consultant        # кабинет Vite :5173 → Render по умолчанию
npm run chat:consultant:build  # собрать кабинет в server/public
```

---

## Текущий статус

**Сделано и доступно в демо:**

- интерактивный UI по макету (онбординг, вкладки, SOS-сценарии);
- **реальная карта** (OpenFreeMap / MapLibre) с GPS устройства;
- **геозоны** с ресайзом на карте и звуковыми алертами;
- **живой чат** пользователь ↔ консультант на **https://tailio-chat.onrender.com**;
- автодеплой приложения на GitHub Pages.

**Ещё не прод-готово / следующие шаги:**

- координаты **с ошейника** (`LOCATION_MODE=api`) вместо GPS телефона;
- серверные аккаунты приложения, реальная почта / OTP;
- постоянный диск / VPS для истории чатов (на Render Free данные могут сбрасываться);
- пиксельная доводка UI, релизы App Store / Google Play.

Репозиторий: [github.com/Evgeniy-makdak/tails](https://github.com/Evgeniy-makdak/tails).
