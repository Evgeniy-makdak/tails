# Tailio: живой чат пользователь ↔ консультант

Полный гайд по запуску, использованию и дорожной карте.

## Что появилось

| Часть | Путь | Назначение |
| --- | --- | --- |
| Бэкенд | `server/` | REST + WebSocket, JSON-хранилище, claim диалогов |
| Кабинет консультанта | `consultant/` | Браузер / PWA: логин, очередь, чат |
| Приложение | `src/chat/`, `ChatScreen` | Live-режим по флагу `EXPO_PUBLIC_CHAT_LIVE=1` |

Демо-чат (фейковые ответы) **не удалён**: без флага приложение работает как раньше.

Хранилище: `server/data/tailio.json` (пользователи, питомцы, консультанты, диалоги, сообщения + заготовки `walks` / `geozones`).

---

## Быстрый старт (локально)

### 1. Сервер

```bash
cd server
npm install
npm start
# http://localhost:8787
# ws://localhost:8787/ws
```

Сиды при старте: консультант **`consultant@tailio.app` / `tailio123`**.

Проверка:

```bash
curl http://localhost:8787/api/health
```

### 2. Кабинет консультанта

**Вариант A — через Vite (удобно для разработки):**

```bash
cd consultant
npm install
npm run dev
# http://localhost:5173  (проксирует /api и /ws на :8787)
```

**Вариант B — собранный PWA со сервера:**

```bash
cd consultant
npm run build
# статика попадает в server/public
# перезапустите server и откройте http://localhost:8787
```

Установка PWA: в Chrome / Safari «Установить приложение» / Add to Home Screen.

### 3. Мобильное приложение (live-чат)

В корне проекта создайте `.env` (см. `.env.example`):

```env
EXPO_PUBLIC_CHAT_LIVE=1
EXPO_PUBLIC_API_URL=http://localhost:8787
```

Для телефона в одной Wi‑Fi сети укажите IP Mac, например:

```env
EXPO_PUBLIC_API_URL=http://192.168.1.10:8787
```

Затем:

```bash
npm start
# или npm run web
```

Корневые скрипты:

- `npm run chat:server`
- `npm run chat:consultant`
- `npm run chat:consultant:build`

---

## Как пользоваться: пользователь

1. Войдите в Tailio (как обычно, email + онбординг).
2. Откройте **Tailio Чат** (FAB на главной) или чат из SOS («Служба помощи» → «Чат со специалистом»).
3. При `CHAT_LIVE=1` в шапке статусы: «Подключение…» / «Ищем консультанта…» / «Консультант на связи».
4. Напишите сообщение или нажмите чип («Есть ли повод…»). Сообщение уходит в очередь на сервер.
5. Когда консультант забирает диалог, появляется системное сообщение и можно общаться в реальном времени.
6. Вложения (камера/фото/файл) в live v1 уходят как текст с пометкой `[фото]` / `[файл: …]` (бинарная загрузка — в roadmap).

Без `CHAT_LIVE=1` — прежняя демо-имитация оператора.

---

## Как пользоваться: консультант

1. Откройте кабинет (`:5173` или `:8787`).
2. Войдите: `consultant@tailio.app` / `tailio123` **или** зарегистрируйте нового консультанта.
3. «Восстановить пароль» — заглушка (письмо не отправляется).
4. Слева **Ожидают** — клик по карточке **забирает** диалог (первый кликнувший выигрывает; у остальных он исчезает).
5. **Мои активные** — ваши текущие чаты.
6. Пишите ответы справа; индикатор «печатает…» приходит от пользователя.
7. «Закрыть диалог» завершает беседу для обеих сторон.

Проверка claim: откройте кабинет в двух браузерах под разными консультантами, создайте обращение из приложения — забрать сможет только один.

---

## Протокол WebSocket (кратко)

Подключение: `ws://host/ws?token=JWT`

Клиент → сервер: `conversation.ensure`, `message.send`, `conversation.claim`, `conversation.open`, `typing`, `conversation.close`, `queue.subscribe`

Сервер → клиент: `auth.ok`, `conversation.snapshot`, `message.new`, `queue.updated`, `active.updated`, `conversation.assigned`, `conversation.claimed`, `conversation.taken`, `typing`, `conversation.closed`, `error`

Claim атомарный: обновление только если `status=waiting` и `consultant_id` пуст.

---

## REST

- `GET /api/health`
- `POST /api/auth/consultant/register|login`
- `POST /api/auth/consultant/forgot-password` (stub)
- `POST /api/auth/user/upsert` — синхронизация владельца/питомца из приложения
- `GET /api/me`
- `GET /api/consultant/queue`

---

## Дорожная карта (после MVP)

1. Загрузка вложений на сервер (файлы/превью в ленте).
2. Push / звук для консультанта при новом waiting.
3. История закрытых диалогов в профиле пользователя и в кабинете.
4. Синхронизация pets / walks / geozones с бэка (сейчас заготовки таблиц есть).
5. Деплой API (Railway / Fly) + `wss://` для GitHub Pages.
6. Реальное восстановление пароля (SMTP / magic link).
7. Роли/права администратора консультантов.

---

## Важно про деплой

- **GitHub Pages** хостит только Expo web-клиент. Live-чат на Pages заработает только когда API доступен по публичному HTTPS/WSS и в сборке прописан `EXPO_PUBLIC_API_URL`.
- В GitHub → Settings → Secrets and variables → Actions добавьте секрет **`CHAT_API_URL`** (стабильный публичный URL вашего `server`, например Railway/Fly). Workflow передаёт его в `EXPO_PUBLIC_API_URL` при `build:web`.
- Пока секрета нет, на Pages откроется live-UI чата, но соединение упадёт (браузер не достучится до `localhost`). Для проверки «как в проде» нужен публичный API; для быстрой проверки — локально `:8081` + `:8787` + кабинет.
- Локально / на стенде поднимайте `server` отдельно; кабинет можно отдавать тем же сервером из `server/public` после `npm run chat:consultant:build`.

---

## Что сознательно упрощено

- Не STOMP и не логика alkoLock (филиалы, трансфер, Electron popup).
- Одно открытое обращение на пользователя (`waiting` или `active`).
- JSON-файл вместо тяжёлой БД (легко заменить на Postgres позже, API уже разделён).
