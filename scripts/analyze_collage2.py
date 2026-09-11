"""Точная нарезка коллажа: поиск вертикальных границ колонок по столбцам пикселей."""
import sys
from collections import Counter

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC = 'assets/figma/map/sos_mode/61f32611_4ec4_4fcc_8a5a_8047fc3510fa_1.png'
img = Image.open(SRC).convert('RGB')
w, h = img.size
small = img.resize((w // 4, h // 4))
sw, sh = small.size

cnt = Counter(small.getdata())
bg = cnt.most_common(1)[0][0]


def is_bg(px, tol=18):
    return all(abs(px[i] - bg[i]) <= tol for i in range(3))


# доля не-фона в каждом столбце и строке (уменьшенного изображения)
col_frac = []
for x in range(sw):
    n = sum(0 if is_bg(small.getpixel((x, y))) else 1 for y in range(0, sh, 2))
    col_frac.append(n / (sh // 2))
row_frac = []
for y in range(sh):
    n = sum(0 if is_bg(small.getpixel((x, y))) else 1 for x in range(0, sw, 2))
    row_frac.append(n / (sw // 2))


def segments(fracs, thresh=0.08, min_len=8):
    segs = []
    start = None
    for i, f in enumerate(fracs):
        if f > thresh and start is None:
            start = i
        elif f <= thresh and start is not None:
            if i - start >= min_len:
                segs.append((start, i))
            start = None
    if start is not None and len(fracs) - start >= min_len:
        segs.append((start, len(fracs)))
    return segs


col_segs = segments(col_frac)
row_segs = segments(row_frac)
print('колонки (x4):', [(a * 4, b * 4) for a, b in col_segs])
print('строки   (x4):', [(a * 4, b * 4) for a, b in row_segs])
print('колонок:', len(col_segs), 'строк:', len(row_segs))
