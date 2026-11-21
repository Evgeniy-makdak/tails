# Живые координаты ошейника → приложение Taily

Цель: ошейник TK919 шлёт точку каждые **15 сек** → сервер → карта в PWA **live**.

## Схема (просто)

```
TK919  --TCP:5001-->  VPS (Docker Taily + TCP)  --HTTPS-->  Render (tailio-chat)
                         adminip SMS                  уже ваш бэк чата/треков
                                                              │
                                                         GitHub Pages app
                                                      LOCATION_MODE=api
```

- **Render** `https://tailio-chat.onrender.com` — хранит точку и отдаёт приложению.
- **VPS с публичным IP** — принимает протокол ошейника (TCP). Render это не умеет.
- В SMS `adminip` пишете **IP VPS**, не адрес Render.

## 1. Поднять TCP-шлюз на VPS (один раз)

На любой VPS с белым IP (Timeweb / Selectel / Aeza и т.п.):

```bash
git clone https://github.com/Evgeniy-makdak/tails.git
cd tails
export TAILIO_JWT_SECRET="$(openssl rand -hex 32)"
# Пересылка точек на ваш уже работающий Render:
export COLLAR_FORWARD_BASE="https://tailio-chat.onrender.com"
docker compose -f docker-compose.collar.yml up -d --build
```

Откройте в фаерволе порты: **5001/tcp**, **5093/tcp** (и 8787 если нужен сам API на VPS).

Проверка логов:

```bash
docker compose -f docker-compose.collar.yml logs -f taily
```

Должно быть: `Collar TCP listening 0.0.0.0:5001`.

Узнайте публичный IP VPS — ниже как `ВАШ_IP`.

## 2. SMS с телефона на номер SIM в ошейнике

Пароль по умолчанию `123456`. Каждая строка — отдельное SMS. Ждите OK.

```text
apn123456 internet.mts.ru
admin123456 +79XXXXXXXXX
timezone123456 +3
upload123456 15
adminip123456 ВАШ_IP 5001
check123456
```

APN подставьте своего оператора (МегаФон `internet`, Билайн `internet.beeline.ru`, Tele2 `internet.tele2.ru`).

Если порт 5001 не принял протокол — вторая попытка:

```text
adminip123456 ВАШ_IP 5093
```

Вернуть заводской Winnes:

```text
adminip123456 47.112.97.221 30039
```

## 3. Приложение

1. В профиле питомца **collarId / ID ошейника** = IMEI или ID с наклейки (то, что уходит в TCP).
2. PWA собирается с `EXPO_PUBLIC_LOCATION_MODE=api` и читает:

   `GET https://tailio-chat.onrender.com/api/collars/<COLLAR_ID>/location`

3. Карта опрашивает точку примерно раз в 5 секунд.

Проверка вручную (подставьте ID):

```bash
curl -sS "https://tailio-chat.onrender.com/api/collars/ВАШ_ID/location"
```

Нужен JSON с `latitude` / `longitude`. Пока 404 — ошейник ещё не достучался (сеть, APN, IP, порт, ID).

## 4. Чеклист

- [ ] Docker на VPS, в логах listening :5001  
- [ ] Фаервол 5001 (и 5093) открыт  
- [ ] SMS: APN, admin, timezone +3, upload 15, adminip ВАШ_IP 5001  
- [ ] `curl .../location` отдаёт координаты  
- [ ] В приложении верный collarId  
- [ ] На карте маркер двигается  

Печатная шпаргалка SMS: [TK919_SIM_SMS_шпаргалка_СПБ.pdf](./TK919_SIM_SMS_шпаргалка_СПБ.pdf).
