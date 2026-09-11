"""Нарезка коллажа 5x2 на отдельные фрагменты."""
import os
import sys

from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

SRC = 'assets/figma/map/sos_mode/61f32611_4ec4_4fcc_8a5a_8047fc3510fa_1.png'
OUT_DIR = 'assets/figma/map/sos_mode/fragments'

# границы, найденные автоматически (см. analyze_collage2.py)
COLS = [(36, 292), (328, 584), (624, 884), (924, 1192), (1224, 1484)]
ROWS = [(36, 496), (536, 996)]

img = Image.open(SRC).convert('RGB')
os.makedirs(OUT_DIR, exist_ok=True)

idx = 0
for ri, (y0, y1) in enumerate(ROWS, 1):
    for ci, (x0, x1) in enumerate(COLS, 1):
        idx += 1
        frag = img.crop((x0, y0, x1, y1))
        fw, fh = frag.size
        path = os.path.join(OUT_DIR, f'fragment_{ri}_{ci}.png')
        frag.save(path)
        print(f'  {path}  {fw}x{fh}')
print(f'Готово: {idx} фрагментов')
