#!/usr/bin/env python3
"""Generate a 480x480 BUIDL logo for Beacon."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'beacon-logo.png')
SIZE = 480
BG = (12, 14, 18)
ACCENT = (52, 211, 153)

img = Image.new('RGB', (SIZE, SIZE), BG)
draw = ImageDraw.Draw(img)

# Subtle radial glow
for i in range(60):
    r = 200 - i * 2
    c = (BG[0] + int(i * 0.4), BG[1] + int(i * 0.6), BG[2] + int(i * 1.2))
    c = tuple(min(255, v) for v in c)
    cx, cy = SIZE // 2, SIZE // 2 - 10
    draw.ellipse([(cx-r, cy-r), (cx+r, cy+r)], fill=c)

# Gauge ring
cx, cy = SIZE // 2, SIZE // 2 - 20
r = 120
draw.arc([(cx-r, cy-r), (cx+r, cy+r)], start=180, end=360+90, fill=ACCENT, width=8)

# Accent dot
draw.ellipse([(cx-6, cy-r-6), (cx+6, cy-r+6)], fill=ACCENT)

# "B" text
font = None
for f in ['/System/Library/Fonts/HelveticaNeue.ttc', '/System/Library/Fonts/Helvetica.ttc']:
    if os.path.exists(f):
        try:
            font = ImageFont.truetype(f, 100)
            break
        except:
            continue
if not font:
    font = ImageFont.load_default()

bbox = draw.textbbox((0, 0), 'B', font=font)
tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
draw.text((cx - tw//2, cy - th//2 - 5), 'B', fill=(230, 233, 237), font=font)

# "BEACON" below
small = None
for f in ['/System/Library/Fonts/HelveticaNeue.ttc', '/System/Library/Fonts/Helvetica.ttc']:
    if os.path.exists(f):
        try:
            small = ImageFont.truetype(f, 22)
            break
        except:
            continue
if small:
    bbox2 = draw.textbbox((0, 0), 'BEACON', font=small)
    tw2 = bbox2[2] - bbox2[0]
    draw.text((cx - tw2//2, cy + r + 20), 'BEACON', fill=(92, 101, 119), font=small)

img.save(OUT)
print(f'OK {OUT}')
