"""Проверка качества нарезки: не обрезан ли контент и нет ли захвата соседей.

Для каждого фрагмента смотрим:
- контентный bbox (есть ли контент, прижатый к краям => возможен обрез)
- однородность фона в углах (углы должны быть фоном, если скриншот с рамкой)
"""
import glob
import os
import sys
from collections import Counter

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC = 'assets/figma/map/sos_mode/61f32611_4ec4_4fcc_8a5a_8047fc3510fa_1.png'
FRAGS_DIR = 'assets/figma/map/sos_mode/fragments'

img = Image.open(SRC).convert('RGB')
w, h = img.size
small = img.resize((w // 4, h // 4))
cnt = Counter(small.getdata())
bg = cnt.most_common(1)[0][0]


def is_bg(px, tol=18):
    return all(abs(px[i] - bg[i]) <= tol for i in range(3))


print(f'Фон коллажа: {bg}\n')

for path in sorted(glob.glob(os.path.join(FRAGS_DIR, 'fragment_*.png'))):
    frag = Image.open(path).convert('RGB')
    fw, fh = frag.size
    fs = frag.resize((max(fw // 2, 1), max(fh // 2, 1)))

    # контентный bbox относительно фрагмента
    xs, ys = [], []
    for y in range(fs.height):
        for x in range(0, fs.width, 2):
            if not is_bg(fs.getpixel((x, y))):
                xs.append(x)
                ys.append(y)
    if not xs:
        print(f'{os.path.basename(path)}: ПУСТО')
        continue

    bx0, bx1 = min(xs) * 2, max(xs) * 2
    by0, by1 = min(ys) * 2, max(ys) * 2
    # отступы контента от краёв фрагмента
    m_l, m_r = bx0, fw - 1 - bx1
    m_t, m_b = by0, fh - 1 - by1
    cut = any(m == 0 for m in (m_l, m_r, m_t, m_b))
    print(f'{os.path.basename(path)} {fw}x{fh}  '
          f'отступы L/R/T/B = {m_l}/{m_r}/{m_t}/{m_b}'
          + ('  <-- контент впритык к краю' if cut else ''))
