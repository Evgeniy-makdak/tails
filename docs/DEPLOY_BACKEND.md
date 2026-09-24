# Деплой бэкенда Tailio на постоянный сервер (без Mac)

Цель: **живой чат** и кабинет консультанта работают с телефона и GitHub Pages, **даже когда MacBook выключен**.

Сейчас в репозитории уже есть заготовка под **Fly.io**:

| Файл | Назначение |
| --- | --- |
| `server/Dockerfile` | Образ Node 22 с API + WebSocket + PWA кабинета |
| `server/fly.toml` | Конфиг приложения `tailio-chat`, HTTPS, диск `/data` |
| `.github/workflows/deploy-pages.yml` | Сборка Expo web с `EXPO_PUBLIC_API_URL` |

Инструкция ниже — **пошагово для Fly.io** (рекомендуется). В конце — кратко Railway / Render.

---

## 0. Важно понять, что именно переезжает

### Переезжает на сервер (после этой инструкции)

- REST API чата (`/api/...`)
- WebSocket (`/ws`)
- Данные чата: пользователи чата, консультанты, диалоги, сообщения (`tailio.json` на диске)
- PWA-кабинет консультанта (отдаётся с того же хоста)

### Пока остаётся на устройстве (не чинится одним деплоем бэка)

- **Регистрация / вход в приложение «Хвостик»** (`makdak23@mail.ru` и т.п.) хранятся в **браузере телефона** (AsyncStorage / localStorage), **не** на бэке.
- Поэтому «аккаунт не найден» на другом устройстве / после очистки данных сайта — ожидаемо, пока не сделаем серверную авторизацию приложения (отдельная задача).

Итого после деплоя Fly:

- ✅ Live-чат с Pages / телефона **без включённого Mac**
- ✅ Кабинет консультанта по `https://….fly.dev`
- ❌ Вход в само приложение всё ещё **локальный на каждом устройстве** (пока)

---

## 1. Что понадобится

1. Аккаунт [Fly.io](https://fly.io) (карта может понадобиться для верификации; для маленького VM обычно хватает free allowance — смотрите актуальные лимиты на сайте).
2. Установленный CLI `flyctl` (у вас на Mac уже есть: `flyctl version`).
3. Доступ к репозиторию GitHub `Evgeniy-makdak/tails` (Settings → Variables).
4. 20–40 минут и стабильный интернет.

Проверка CLI:

```bash
flyctl version
flyctl auth whoami
```

Если `no access token` — сначала логин (шаг 2).

---

## 2. Войти в Fly.io

В **Terminal.app** (не обязательно в Cursor):

```bash
flyctl auth login
```

Откроется браузер → войдите / зарегистрируйтесь → подтвердите токен в терминале.

Проверка:

```bash
flyctl auth whoami
```

Должен показать ваш email.

---

## 3. Подготовить проект на диске

```bash
cd "/Users/admin/Desktop/Рабочий стол — MacBook Air/tail"
cd server
ls Dockerfile fly.toml package.json package-lock.json public src
```

Все эти файлы должны быть на месте.

При желании заранее соберите свежий кабинет консультанта в `server/public`:

```bash
cd ..
npm run chat:consultant:build
cd server
```

---

## 4. Создать volume для данных (обязательно)

Без диска при рестарте машины файл `tailio.json` пропадёт / окажется в эфемерной FS.

Регион в `fly.toml` — `ams` (Амстердам). Можно другой (`fra`, `lhr`, `iad`), но **volume и app region должны совпадать**.

```bash
cd "/Users/admin/Desktop/Рабочий стол — MacBook Air/tail/server"

flyctl volumes create tailio_data --region ams --size 1 -a tailio-chat
```

Если приложение ещё не создано, сначала:

```bash
flyctl apps create tailio-chat
flyctl volumes create tailio_data --region ams --size 1 -a tailio-chat
```

Проверка:

```bash
flyctl volumes list -a tailio-chat
```

Должен быть `tailio_data` → `/data` (как в `fly.toml` → `[mounts]`).

---

## 5. Задать секрет JWT (обязательно для продакшена)

По умолчанию в коде стоит dev-секрет. На Fly задайте свой:

```bash
# сгенерировать длинную строку
openssl rand -hex 32

flyctl secrets set TAILIO_JWT_SECRET='ВСТАВЬТЕ_СЮДА_СЛУЧАЙНУЮ_СТРОКУ' -a tailio-chat
```

Опционально срок жизни токена:

```bash
flyctl secrets set TAILIO_JWT_TTL='7d' -a tailio-chat
```

`PORT`, `TAILIO_DB_PATH`, `NODE_ENV` уже прописаны в `fly.toml` — секретами их дублировать не нужно.

---

## 6. Первый деплой

Из папки `server/`:

```bash
cd "/Users/admin/Desktop/Рабочий стол — MacBook Air/tail/server"
flyctl deploy -a tailio-chat
```

Что произойдёт:

1. Соберётся Docker-образ из `Dockerfile`
2. Запустится машина на порту `8080`
3. Fly выдаст HTTPS: **`https://tailio-chat.fly.dev`**
4. Health-check стучится в `GET /api/health`

Если имя `tailio-chat` занято глобально — в `fly.toml` поменяйте:

```toml
app = "tailio-chat-ВАШЕ-УНИКАЛЬНОЕ"
```

и везде ниже используйте это имя (`-a ...`).

### Если `flyctl deploy` ругается на volume / mounts

1. Убедитесь, что volume создан в том же регионе, что `primary_region`.
2. Имя volume в `fly.toml` (`source = "tailio_data"`) = имя из `flyctl volumes list`.
3. Перезапустите deploy.

### Если health-check падает

```bash
flyctl logs -a tailio-chat
flyctl status -a tailio-chat
```

Частые причины: приложение слушает не `0.0.0.0` (у нас уже исправлено), неверный `PORT`, volume не смонтирован и процесс падает на запись в `/data`.

---

## 7. Проверить, что API жив без Mac

На **любом** устройстве / в браузере:

```bash
curl -sS https://tailio-chat.fly.dev/api/health
```

Ожидается JSON вида:

```json
{"ok":true,"service":"tailio-server","time":"..."}
```

Кабинет консультанта:

1. Откройте `https://tailio-chat.fly.dev`
2. Войдите: `consultant@tailio.app` / `tailio123`  
   (сид создаётся при первом старте, если консультанта ещё нет)

WebSocket (грубая проверка из DevTools на странице кабинета): статус Online после логина.

---

## 8. (Опционально) Перенести уже накопленные локальные данные чата

Если на Mac в `server/data/tailio.json` уже есть нужные диалоги:

```bash
# на Mac, пока файл актуален
cd "/Users/admin/Desktop/Рабочий стол — MacBook Air/tail/server"
flyctl ssh sftp shell -a tailio-chat
```

Или проще — скопировать файл:

```bash
flyctl ssh console -a tailio-chat -C "ls -la /data"
```

Загрузка локального файла на volume (пример через `flyctl ssh sftp`):

```bash
flyctl ssh sftp put -a tailio-chat ./data/tailio.json /data/tailio.json
```

После замены JSON перезапустите машину:

```bash
flyctl machine restart -a tailio-chat
# или
flyctl apps restart tailio-chat
```

Проверьте health и кабинет снова.

> Если SFTP-команды в вашей версии `flyctl` отличаются — смотрите `flyctl ssh sftp --help`. Альтернатива: временно открыть endpoint импорта (не сделано) или набивать данные заново.

---

## 9. Подключить GitHub Pages к постоянному API

### 9.1. Variable в GitHub

1. Откройте репозиторий: https://github.com/Evgeniy-makdak/tails  
2. **Settings → Secrets and variables → Actions → вкладка Variables**  
3. **New repository variable**  
   - Name: `CHAT_API_URL`  
   - Value: `https://tailio-chat.fly.dev`  
     (без слэша в конце, именно `https://`)

Сохраните.

Workflow уже умеет брать `vars.CHAT_API_URL` и печь его в `EXPO_PUBLIC_API_URL` при `EXPO_PUBLIC_CHAT_LIVE=1`.

### 9.2. Пересобрать Pages

Любой из вариантов:

**A.** Actions → **Deploy GitHub Pages** → **Run workflow** (ветка `main`)

**B.** Пустой коммит / любой push в `main`

Дождитесь зелёного run. Проверка, что URL попал в бандл (опционально):

```bash
git fetch origin gh-pages
# в dist/_expo/.../AppEntry-*.js должна быть строка https://tailio-chat.fly.dev
```

### 9.3. Телефон

1. Откройте https://evgeniy-makdak.github.io/tails/  
2. Hard refresh / закройте вкладку и откройте снова (чтобы сбросить старый JS со старым `*.lhr.life`)  
3. Войдите в приложение (локальный аккаунт на **этом** телефоне)  
4. Откройте чат — не должно быть `Load Failed` / `Failed to fetch`  
5. На компьютере откройте `https://tailio-chat.fly.dev`, зайдите консультантом, заберите диалог из очереди

**MacBook при этом можно выключить.**

---

## 10. Локальная разработка после деплоя

Локально по-прежнему:

```bash
# терминал 1
npm run chat:server          # http://localhost:8787

# терминал 2
npm run chat:consultant      # http://127.0.0.1:5173 → proxy на :8787

# терминал 3
npx expo start --web --port 8081
```

В `.env` для локального Expo:

```env
EXPO_PUBLIC_CHAT_LIVE=1
EXPO_PUBLIC_API_URL=http://localhost:8787
```

Чтобы локальное приложение ходило в **прод** Fly (редко нужно):

```env
EXPO_PUBLIC_CHAT_LIVE=1
EXPO_PUBLIC_API_URL=https://tailio-chat.fly.dev
```

---

## 11. Обновление бэка после правок кода

```bash
cd "/Users/admin/Desktop/Рабочий стол — MacBook Air/tail"
# при изменениях кабинета:
npm run chat:consultant:build

cd server
flyctl deploy -a tailio-chat
```

Volume `/data` **не** затирается деплоем — история чатов сохраняется.

---

## 12. Чеклист «всё ок без Mac»

- [ ] `curl https://tailio-chat.fly.dev/api/health` → `ok: true`
- [ ] Кабинет открывается с телефона/другого ПК по `https://tailio-chat.fly.dev`
- [ ] Логин консультанта работает
- [ ] В GitHub Variable `CHAT_API_URL=https://tailio-chat.fly.dev`
- [ ] Последний Deploy GitHub Pages зелёный
- [ ] На телефоне после hard refresh чат в live (не хардкод-ответы, нет Load Failed)
- [ ] MacBook выключен — чат всё ещё работает
- [ ] (Ожидаемо) вход в само приложение по email всё ещё только на том устройстве, где регистрировались

---

## 13. Типичные проблемы

| Симптом | Причина | Что делать |
| --- | --- | --- |
| С телефона `Load Failed` / `Failed to fetch` | Pages всё ещё собран на старый `*.lhr.life` или Variable пуст | Проверить Variable, перезапустить workflow, hard refresh |
| `no tunnel here` | Временный localhost.run умер | Не использовать туннель; нужен Fly + Variable |
| Кабинет Online, но очереди нет | Другой API / другой `tailio.json` | Убедиться, что приложение и кабинет бьют в **один** Fly URL |
| После рестарта Fly пропали чаты | Нет volume / путь не `/data/tailio.json` | Создать volume, проверить `TAILIO_DB_PATH` и mounts |
| `flyctl deploy` 401 | Не залогинены | `flyctl auth login` |
| App name taken | Имя `tailio-chat` занято | Переименовать `app` в `fly.toml` |
| Аккаунт приложения «не найден» | Локальное хранилище устройства | Это не бэк чата; регистрируйтесь на этом устройстве или делайте серверную auth приложения отдельно |

---

## 14. Альтернативы Fly.io (кратко)

### Railway

1. https://railway.app → New Project → Deploy from GitHub (укажите root `server/` или Dockerfile).  
2. Добавьте Volume на `/data`.  
3. Env: `PORT` (Railway задаёт сам), `TAILIO_DB_PATH=/data/tailio.json`, `TAILIO_JWT_SECRET=...`.  
4. Публичный HTTPS URL вида `https://….up.railway.app` → в GitHub Variable `CHAT_API_URL`.

### Render

1. New → Web Service → подключить репо, root directory `server`, Dockerfile.  
2. Persistent Disk mount `/data`.  
3. Health check `/api/health`.  
4. URL `https://….onrender.com` → `CHAT_API_URL`.  
   На free tier Render часто «засыпает» — для WebSocket/чата это плохо; лучше платный always-on или Fly с `auto_stop_machines = false` (как у нас).

---

## 15. Что сделать дальше (после стабильного API)

1. Серверная регистрация/вход приложения (чтобы `makdak23@mail.ru` работал с любого устройства).  
2. Перенос питомцев / профиля на API (заготовки в JSON уже есть).  
3. SMTP для OTP вместо кода `111111`.  
4. Бэкапы volume (`flyctl volumes snapshots` / внешний S3).

---

## Команды «на одной странице»

```bash
# 1) Логин
flyctl auth login

# 2) App + диск
cd server
flyctl apps create tailio-chat   # если ещё нет
flyctl volumes create tailio_data --region ams --size 1 -a tailio-chat

# 3) Секрет
flyctl secrets set TAILIO_JWT_SECRET="$(openssl rand -hex 32)" -a tailio-chat

# 4) Деплой
flyctl deploy -a tailio-chat

# 5) Проверка
curl -sS https://tailio-chat.fly.dev/api/health

# 6) GitHub → Variable CHAT_API_URL=https://tailio-chat.fly.dev
# 7) Actions → Deploy GitHub Pages → Run workflow
# 8) Телефон: hard refresh https://evgeniy-makdak.github.io/tails/
```

После шагов 1–8 Mac для чата **не нужен**.
