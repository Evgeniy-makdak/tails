"""Экспорт экранов макета «Хвостик» в тематические папки assets/figma.

Экран = FRAME, являющийся прямым ребёнком тематической секции и имеющий
мобильный размер. Экспортируется через Figma render API (PNG, scale=2).

Запуск: $env:FIGMA_TOKEN='...' ; python scripts/export_figma_screens.py
"""
import json
import os
import sys
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding='utf-8')

FILE_KEY = 'VJHybESupMYsz3hVRwiMoj'
NODE_JSON = 'fromFigma/_figma_raw/node_881-8335.json'
OUT_ROOT = os.path.join('assets', 'figma')
SCALE = 2
BATCH = 40

TOKEN = os.environ.get('FIGMA_TOKEN')
if not TOKEN:
    sys.exit('Ошибка: задай переменную окружения FIGMA_TOKEN')

# секция -> (целевая папка, суффикс имени файла)
SECTIONS = {
    '889:2756': ('firstEnter/registration', 'reg'),
    '891:7996': ('firstEnter/onbording', 'onbord'),
    '901:9099': ('main', 'main'),
    '891:7997': ('main', 'main'),
    '901:9100': ('main/ai_chat', 'ai_chat'),
    '1555:12886': ('ownerProfile', 'owner'),
    '956:4823': ('sos', 'sos'),
    '1335:20437': ('sos', 'sos'),
    '893:4585': ('petProfile', 'pet'),
    '893:4716': ('map/main', 'map'),
    '904:10821': ('map/main', 'map'),
    '1357:34066': ('map/main', 'map'),
    '904:10820': ('map/sos_mode', 'map_sos'),
    '905:15407': ('map/geozones', 'geozones'),
    '1359:35272': ('map/geozones', 'geozones'),
    '905:15453': ('map/movement_history', 'history'),
    '1506:39827': ('map/movement_history', 'history'),
    '893:4941': ('health', 'health'),
}

MIN_W, MAX_W = 300, 470
MIN_H, MAX_H = 600, 1050


def size(n):
    b = n.get('absoluteBoundingBox') or {}
    return b.get('width', 0), b.get('height', 0)


with open(NODE_JSON, encoding='utf-8') as f:
    data = json.load(f)
root = data['nodes']['881:8335']['document']

# 1. Сбор экранов: FRAME — прямой ребёнок секции из SECTIONS
plan = []  # (dir, suffix, node_id)


def walk(n, active_sec):
    if n.get('type') == 'SECTION' and n['id'] in SECTIONS:
        active_sec = n
    elif active_sec and n.get('type') == 'FRAME':
        w, h = size(n)
        if MIN_W <= w <= MAX_W and MIN_H <= h <= MAX_H:
            target, suffix = SECTIONS[active_sec['id']]
            plan.append((target, suffix, n['id']))
            return  # вложенные фреймы не рассматриваем
    for c in n.get('children', []) or []:
        walk(c, active_sec)


walk(root, None)

print(f'Экранов к экспорту: {len(plan)}')
by_dir = {}
for target, suffix, nid in plan:
    by_dir.setdefault(target, []).append((suffix, nid))

counters = {}
for target, items in by_dir.items():
    print(f"  {target}: {len(items)}")

# 2. Экспорт через render API (батчами)
all_ids = [nid for _, _, nid in plan]
url_map = {}
for i in range(0, len(all_ids), BATCH):
    batch = all_ids[i:i + BATCH]
    q = urllib.parse.urlencode({'ids': ','.join(batch), 'format': 'png', 'scale': SCALE})
    req = urllib.request.Request(
        f'https://api.figma.com/v1/images/{FILE_KEY}?{q}',
        headers={'X-Figma-Token': TOKEN})
    with urllib.request.urlopen(req, timeout=120) as resp:
        res = json.loads(resp.read())
    urls = (res.get('meta') or {}).get('images') or res.get('images') or {}
    url_map.update(urls)
    print(f'  батч {i // BATCH + 1}: получено {len(urls)} ссылок')

# 3. Скачивание
downloaded, failed = 0, 0
for target, suffix, nid in plan:
    url = url_map.get(nid)
    if not url:
        print(f'  !! нет ссылки для {nid}')
        failed += 1
        continue
    out_dir = os.path.join(OUT_ROOT, target)
    os.makedirs(out_dir, exist_ok=True)
    n = counters.get(target, 0) + 1
    counters[target] = n
    path = os.path.join(out_dir, f'{n}_{suffix}.png')
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req, timeout=120) as resp:
            raw = resp.read()
        with open(path, 'wb') as f:
            f.write(raw)
        downloaded += 1
        print(f'  OK {target}/{n}_{suffix}.png [{len(raw) // 1024} KB]')
    except Exception as e:  # noqa: BLE001
        print(f'  !! ошибка {nid}: {e}')
        failed += 1

print(f'\nГотово: скачано {downloaded}, ошибок {failed}')
