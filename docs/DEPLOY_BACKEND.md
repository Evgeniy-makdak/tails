# Деплой бэкенда Tailio на постоянный сервер (без Mac)

Цель: **живой чат** и кабинет консультанта работают с телефона и GitHub Pages, **даже когда MacBook выключен**.

---

## Какой хостинг выбрать (2026)

| Платформа | Карта | Бесплатно? | Подходит для чата? |
| --- | --- | --- | --- |
| **Render Free** | Обычно **не нужна** | Да (сервис «засыпает» ~15 мин без трафика) | Да для тестов; первый заход после сна ~1 мин |
| Fly.io | Нужна | Лимиты / платно для новых | Лучше для 24/7, но карта у вас отклоняется |
| Railway | План после триала | Триал кончился → нужен план | Сейчас недоступен без оплаты |
| Туннель с Mac | Нет | Да | Только пока Mac включён |

**Рекомендация без карты: Render Free** — у вас уже задеплоено: **`https://tailio-chat.onrender.com`** (`/api/health` отвечает ok). Минус free: после ~15 мин простоя сервис спит; первый заход может занять ~минуту.

В репозитории уже есть:

| Файл | Назначение |
| --- | --- |
| `render.yaml` | Blueprint для Render Free |
| `server/Dockerfile` + `server/fly.toml` | Заготовка под Fly (если карта заработает) |
| `.github/workflows/deploy-pages.yml` | Печёт `EXPO_PUBLIC_API_URL` из Variable `CHAT_API_URL` |

---

## 0. Важно понять, что именно переезжает

### Переезжает на сервер

- REST API чата (`/api/...`), WebSocket (`/ws`)
- Пользователи чата, консультанты, диалоги, сообщения
- PWA-кабинет консультанта

### Пока остаётся на устройстве

- **Регистрация / вход в приложение «Хвостик»** — в браузере телефона, не на бэке.

На **Render Free нет постоянного диска**: история чатов может обнуляться при рестарте/redeploy. Для тестов live с телефона этого достаточно; для вечной истории позже — платный диск / VPS / Fly.

---

## A. Render Free — без карты (делайте это сейчас)

### A1. Войти через GitHub

1. Откройте: https://dashboard.render.com/login  
2. Нажмите **GitHub** (тот же аккаунт, где лежит `Evgeniy-makdak/tails`).  
3. Разрешите Render доступ к репозиториям (как минимум к `tails`).

### A2. Создать Web Service из репо

1. Dashboard → **New +** → **Web Service**  
2. Подключите репозиторий **`Evgeniy-makdak/tails`** (Connect / Configure account, если ещё не видно).  
3. Настройки:

| Поле | Значение |
| --- | --- |
| Name | `tailio-chat` |
| Region | ближайший (Frankfurt / Oregon) |
| Root Directory | `server` |
| Runtime | Node |
| Build Command | `npm ci --omit=dev` |
| Start Command | `node src/index.js` |
| Instance type | **Free** |

4. Environment Variables → Add:

| Key | Value |
| --- | --- |
| `NODE_ENV` | `production` |
| `TAILIO_JWT_SECRET` | длинная случайная строка (например вывод `openssl rand -hex 32`) |
| `TAILIO_JWT_TTL` | `7d` |

`PORT` Render задаёт сам — **не** прописывайте `8787`.

5. Health Check Path: `/api/health`  
6. **Create Web Service** → дождитесь статуса **Live**.

### A3. Либо Blueprint одной кнопкой

После логина в Render:

1. **New +** → **Blueprint**  
2. Выберите репо `tails` (в корне есть `render.yaml`)  
3. Apply → дождитесь деплоя сервиса `tailio-chat`

### A4. Проверка API

URL будет вида:

`https://tailio-chat-XXXX.onrender.com`

```bash
curl -sS https://ВАШ-СЕРВИС.onrender.com/api/health
```

Ожидается: `{"ok":true,"service":"tailio-server",...}`

Кабинет: откройте тот же URL в браузере → `consultant@tailio.app` / `tailio123`

Локальный кабинет `http://127.0.0.1:5173` по умолчанию тоже ходит на Render (`consultant/.env.development`). Иначе на `:5173` будет пустая очередь с локального `:8787`, пока телефон пишет в облако.

> Первый запрос после сна может идти ~30–60 секунд — это норма для Free.

### A5. Подключить GitHub Pages

1. GitHub → `tails` → **Settings → Secrets and variables → Actions → Variables**  
2. Variable **`CHAT_API_URL`** = `https://ВАШ-СЕРВИС.onrender.com` (без `/` в конце)  
3. Actions → **Deploy GitHub Pages** → **Run workflow**  
4. На телефоне hard refresh: https://evgeniy-makdak.github.io/tails/

Mac можно выключать (с оговоркой про «сон» Free-инстанса).

---

## B. Fly.io (если карта всё-таки привяжется)

```bash
cd server
flyctl auth login
flyctl apps create tailio-chat
flyctl volumes create tailio_data --region ams --size 1 -a tailio-chat
flyctl secrets set TAILIO_JWT_SECRET="$(openssl rand -hex 32)" -a tailio-chat
flyctl deploy -a tailio-chat
curl -sS https://tailio-chat.fly.dev/api/health
```

Затем Variable `CHAT_API_URL=https://tailio-chat.fly.dev` и пересборка Pages.

Сейчас создание app у вас блокируется: *We need your payment information*.

---

## C. Railway

CLI логинится под `makdak23@mail.ru`, но:

> Your trial has expired. Please select a plan

Без оплаты Railway сейчас недоступен.

---

## Что уже проверено автоматически

| Шаг | Статус |
| --- | --- |
| Логин Fly CLI | ✅ `makdak23@mail.ru` |
| Создать app на Fly | ❌ нужна карта (отклоняется) |
| Логин Railway CLI | ✅ |
| Создать проект Railway | ❌ trial expired |
| Файл `render.yaml` в репо | ✅ |
| Войти в Render через GitHub OAuth | нужен **ваш** клик «GitHub» на https://dashboard.render.com/login |

После того как сервис будет **Live**, пришлите URL `*.onrender.com` — допишу Variable / пересоберу Pages.

---

## Чеклист Render

- [ ] Sign in to Render with GitHub  
- [ ] Web Service `tailio-chat`, root `server`, plan Free  
- [ ] Env: `TAILIO_JWT_SECRET`, `NODE_ENV=production`  
- [ ] `curl …/api/health` → ok  
- [ ] GitHub Variable `CHAT_API_URL`  
- [ ] Pages redeploy + hard refresh на телефоне  

---

## Команды после Live на Render

```bash
curl -sS https://ВАШ.onrender.com/api/health

# GitHub → Settings → Variables → CHAT_API_URL=https://ВАШ.onrender.com
# Actions → Deploy GitHub Pages → Run workflow
```
