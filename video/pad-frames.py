#!/usr/bin/env python3
"""Pad cropped frames to 1920x1080 on a dark background matching Beacon's Pulse design."""

from PIL import Image
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, 'frames')
BG_COLOR = (12, 14, 18)  # --bg-base: #0c0e12
TARGET = (1920, 1080)

for fname in os.listdir(FRAMES_DIR):
    if not fname.endswith('.png'):
        continue
    fpath = os.path.join(FRAMES_DIR, fname)
    img = Image.open(fpath)
    if img.size == TARGET:
        print(f'OK {fname} (already {TARGET[0]}x{TARGET[1]})')
        continue
    canvas = Image.new('RGB', TARGET, BG_COLOR)
    x = (TARGET[0] - img.width) // 2
    y = (TARGET[1] - img.height) // 2
    canvas.paste(img, (x, y))
    canvas.save(fpath)
    print(f'OK {fname} ({img.width}x{img.height} -> {TARGET[0]}x{TARGET[1]})')

print('All frames padded')
