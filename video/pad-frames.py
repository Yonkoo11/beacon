#!/usr/bin/env python3
"""Pad cropped frames to 1920x1080 on a dark background matching Beacon's theme."""

from PIL import Image
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, 'frames')
BG_COLOR = (7, 9, 15)  # --bg-base
TARGET = (1920, 1080)

# Only pad frames that aren't already 1920x1080
for fname in ['02-feed.png', '03-scores.png', '06-close.png']:
    fpath = os.path.join(FRAMES_DIR, fname)
    if not os.path.exists(fpath):
        print(f'SKIP {fname}')
        continue

    img = Image.open(fpath)
    if img.size == TARGET:
        print(f'OK {fname} (already 1920x1080)')
        continue

    # Create dark background and center the crop on it
    canvas = Image.new('RGB', TARGET, BG_COLOR)
    x = (TARGET[0] - img.width) // 2
    y = (TARGET[1] - img.height) // 2
    canvas.paste(img, (x, y))
    canvas.save(fpath)
    print(f'OK {fname} ({img.width}x{img.height} -> {TARGET[0]}x{TARGET[1]})')

print('All frames padded')
