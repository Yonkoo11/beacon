#!/usr/bin/env python3
"""Generate a branded closing frame for Beacon demo video."""

from PIL import Image, ImageDraw, ImageFont
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, 'frames')

def get_font(name_hint, size):
    candidates = [
        '/System/Library/Fonts/HelveticaNeue.ttc',
        '/System/Library/Fonts/Helvetica.ttc',
        '/Library/Fonts/Arial.ttf',
    ]
    for f in candidates:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except:
                continue
    return ImageFont.load_default()

W, H = 1920, 1080
BG = (7, 9, 15)
ACCENT = (99, 102, 241)
GREEN = (34, 197, 94)
TEXT = (232, 234, 240)
MUTED = (107, 114, 128)

img = Image.new('RGB', (W, H), BG)
draw = ImageDraw.Draw(img)

# Subtle radial glow behind center
for r in range(300, 0, -1):
    alpha = int(15 * (r / 300))
    color = (ACCENT[0], ACCENT[1], ACCENT[2])
    # Approximate radial glow with circles
    cx, cy = W // 2, H // 2 - 40
    draw.ellipse(
        [(cx - r*2, cy - r), (cx + r*2, cy + r)],
        fill=None,
        outline=(color[0], color[1], color[2], alpha) if alpha > 0 else None
    )

# Just draw a filled ellipse for the glow
glow_img = Image.new('RGB', (W, H), BG)
glow_draw = ImageDraw.Draw(glow_img)
# Large soft accent glow
for i in range(80):
    opacity = max(1, int(6 - i * 0.07))
    r = 400 - i * 3
    cx, cy = W // 2, H // 2 - 30
    c = (BG[0] + opacity * 2, BG[1] + opacity * 2, min(255, BG[2] + opacity * 8))
    glow_draw.ellipse([(cx-r, cy-r//2), (cx+r, cy+r//2)], fill=c)

img = glow_img

draw = ImageDraw.Draw(img)

# Beacon dot
dot_x, dot_y = W // 2 - 8, H // 2 - 130
draw.ellipse([(dot_x, dot_y), (dot_x + 16, dot_y + 16)], fill=ACCENT)

# "Beacon" title
title_font = get_font('sans', 64)
title = "Beacon"
bbox = draw.textbbox((0, 0), title, font=title_font)
tw = bbox[2] - bbox[0]
draw.text(((W - tw) // 2, H // 2 - 100), title, fill=TEXT, font=title_font)

# Tagline
tag_font = get_font('sans', 22)
tagline = "Trust scores for the x402 agent economy on Stellar"
bbox2 = draw.textbbox((0, 0), tagline, font=tag_font)
tw2 = bbox2[2] - bbox2[0]
draw.text(((W - tw2) // 2, H // 2 - 20), tagline, fill=MUTED, font=tag_font)

# URL
url_font = get_font('sans', 18)
url = "beacon-gi0z.onrender.com"
bbox3 = draw.textbbox((0, 0), url, font=url_font)
tw3 = bbox3[2] - bbox3[0]
draw.text(((W - tw3) // 2, H // 2 + 30), url, fill=ACCENT, font=url_font)

# GitHub
gh = "github.com/Yonkoo11/beacon"
bbox4 = draw.textbbox((0, 0), gh, font=url_font)
tw4 = bbox4[2] - bbox4[0]
draw.text(((W - tw4) // 2, H // 2 + 60), gh, fill=(75, 80, 96), font=url_font)

img.save(os.path.join(FRAMES_DIR, '06-close.png'))
print('OK 06-close.png (branded closing frame)')
