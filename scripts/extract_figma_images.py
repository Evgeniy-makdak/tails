"""Извлечение всех растровых изображений из Figma-макета «Хвостик».

Группирует уникальные image-fill'ы по тематическим разделам макета
и скачивает их в assets/figma/<раздел>/.

Запуск: python scripts/extract_figma_images.py
Токен берётся из переменной окружения FIGMA_TOKEN.
"""
import json
import os
import re
import sys
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

FILE_KEY = 'VJHybESupMYsz3hVRwiMoj'
NODE_ID = '881:8335'
NODE_JSON = 'fromFigma/_figma_raw/node_881-8335.json'
OUT_ROOT = os.path.join('assets', 'figma')

TOKEN = os.environ.get('FIGMA_TOKEN')
if not TOKEN:
    sys.exit('Ошибка: задай переменную окружения FIGMA_TOKEN')

# Сопоставление разделов макета с папками (по конвенции проекта)
SECTION_DIRS = {
    '881:8336': 'firstEnter',            # Первый вход
    '889:2756': 'firstEnter/registration',  # Регистраци(я)
    '891:7996': 'firstEnter/onbording',  # Онбординг
    '891:7997': 'main',                  # Главная
    '901:9099': 'main',                  # Главная (внутренняя)
    '901:9100': 'main/ai_chat',          # ИИ чат
    '1555:12886': 'ownerProfile',        # Профиль хозяина
    '956:4823': 'sos',                   # Клиентский путь SOS
    '1335:20437': 'sos',                 # Клиентский путь SOS (копия)
    '893:4585': 'petProfile',            # Профиль питомца
    '893:4716': 'map',                   # Карта
    '904:10820': 'map/sos_mode',         # SOS-режим
    '904:10821': 'map/main',             # Главная раздела/все спокойно
    '1357:34066': 'map/main',            # Главная раздела/все спокойно (копия)
    '905:15407': 'map/geozones',         # Геозоны
    '1359:35272': 'map/geozones',        # Геозоны (копия)
    '905:15453': 'map/movement_history',  # История перемещений
    '1506:39827': 'map/movement_history',  # Section 1 (в истории)
    '893:4941': 'health',                # Здоровье
}

TRANSLIT = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e',
    'ж': 'zh', 'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm',
    'н': 'n', 'о': 'o', 'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u',
    'ф': 'f', 'х': 'h', 'ц': 'c', 'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '',
    'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu', 'я': 'ya',
}


def translit(name):
    return ''.join(TRANSLIT.get(ch, ch) for ch in name.lower())


def sanitize(name):
    s = translit(name)
    s = re.sub(r'[^a-z0-9]+', '_', s).strip('_')
    s = re.sub(r'_+', '_', s)[:60].strip('_')
    return s or 'img'


def api_get(url, binary=False):
    req = urllib.request.Request(url, headers={'X-Figma-Token': TOKEN})
    with urllib.request.urlopen(req, timeout=60) as resp:
        data = resp.read()
        ctype = resp.headers.get('Content-Type', '')
    return (data, ctype) if binary else json.loads(data)


# 1. Дерево узлов: собираем image-fill'ы с ближайшим родительским разделом
with open(NODE_JSON, encoding='utf-8') as f:
    data = json.load(f)
root = data['nodes'][NODE_ID]['document']

ref_info = {}  # imageRef -> {'names': [...], 'dirs': set()}


def walk(n, section_stack):
    if n.get('type') == 'SECTION':
        section_stack = section_stack + [n['id']]
    for fl in n.get('fills', []) or []:
        if fl.get('type') == 'IMAGE' and fl.get('visible', True) and fl.get('imageRef'):
            ref = fl['imageRef']
            info = ref_info.setdefault(ref, {'names': [], 'dirs': set()})
            info['names'].append(n.get('name', ''))
            for sid in reversed(section_stack):
                if sid in SECTION_DIRS:
                    info['dirs'].add(SECTION_DIRS[sid])
                    break
            else:
                # вне тематических секций — только если нет ни одной привязки
                info['dirs'].add('shared')
    for c in n.get('children', []) or []:
        walk(c, section_stack)


walk(root, [])
print(f'Найдено уникальных изображений: {len(ref_info)}')

# 2. Ссылки на скачивание (Figma возвращает их в meta.images)
imgs = api_get(f'https://api.figma.com/v1/files/{FILE_KEY}/images')
urls = (imgs.get('meta') or {}).get('images') or imgs.get('images') or {}
print(f'Получено ссылок от API: {len(urls)}')

# 3. Скачивание
used_names = set()
downloaded, failed = 0, 0
for ref, info in sorted(ref_info.items()):
    url = urls.get(ref)
    if not url:
        print(f'  !! нет URL для {ref}')
        failed += 1
        continue

    base = sanitize(info['names'][0])
    # реальный раздел(ы) использования; 'shared' учитываем, только если
    # картинка нигде больше не используется
    real_dirs = sorted(d for d in info['dirs'] if d != 'shared')
    dirs = real_dirs or ['shared']
    target_dir = dirs[0] if len(dirs) == 1 else 'shared'
    out_dir = os.path.join(OUT_ROOT, target_dir)
    os.makedirs(out_dir, exist_ok=True)

    try:
        raw, ctype = api_get(url, binary=True)
        if 'jpeg' in ctype or 'jpg' in ctype:
            ext = 'jpg'
        elif 'svg' in ctype:
            ext = 'svg'
        else:
            ext = 'png'

        name, i = base, 2
        while os.path.exists(os.path.join(out_dir, f'{name}.{ext}')) or f'{target_dir}/{name}.{ext}' in used_names:
            name = f'{base}_{i}'
            i += 1

        path = os.path.join(out_dir, f'{name}.{ext}')
        with open(path, 'wb') as f:
            f.write(raw)
        used_names.add(f'{target_dir}/{name}.{ext}')
        downloaded += 1
        mark = '' if len(dirs) == 1 else f'  (также встречается в: {", ".join(dirs[1:])})'
        print(f'  OK {target_dir}/{name}.{ext} [{len(raw) // 1024} KB]{mark}')
    except Exception as e:  # noqa: BLE001
        print(f'  !! ошибка скачивания {ref}: {e}')
        failed += 1

print(f'\nГотово: скачано {downloaded}, ошибок {failed}')
