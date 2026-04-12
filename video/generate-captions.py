#!/usr/bin/env python3
"""Composite subtitle text onto frames for Beacon demo."""

from PIL import Image, ImageDraw, ImageFont
import os, textwrap

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, 'frames')
COMPOSITES_DIR = os.path.join(SCRIPT_DIR, 'composites')
os.makedirs(COMPOSITES_DIR, exist_ok=True)

# MUST match audio verbatim
CLIPS = {
    "01-dashboard": "This is Beacon. It probes eight x402 endpoints on Stellar every five minutes and scores them on uptime and latency. The sparkline bars show each probe result. Green is healthy. Red is a failure.",
    "02-feed": "The probe feed streams in every five minutes. Each line is a real HTTP request. You can see latency variation across endpoints. When something fails, it shows timeout or error instead of a fake latency number.",
    "03-scores": "Trust scores combine uptime and latency over twenty-four hours. Seventy percent weight on uptime. Thirty percent on p95 latency. A 402 response counts as healthy since that's the x402 paywall working.",
    "04-payment": "The scores themselves are behind an x402 paywall. An agent pays one tenth of a cent in USDC on Stellar. It gets the full trust score JSON back. That transaction settles on Stellar testnet.",
    "05-explorer": "And here's the proof on chain. Account creation. USDC trustline. A DEX swap for testnet USDC. And the x402 payment invocation. All real transactions on Stellar.",
    "06-close": "Beacon gives agents the trust data they need before spending money. That's it.",
}

def get_font(size):
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

font = get_font(32)

for clip, text in CLIPS.items():
    frame_path = os.path.join(FRAMES_DIR, f'{clip}.png')
    if not os.path.exists(frame_path):
        print(f'SKIP {clip} (no frame)')
        continue

    img = Image.open(frame_path).convert('RGBA')
    overlay = Image.new('RGBA', img.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    wrapped = textwrap.fill(text, width=70)
    lines = wrapped.split('\n')

    line_height = 42
    padding = 20
    margin_x = 160
    box_h = len(lines) * line_height + padding * 2
    box_y = img.height - box_h - 60
    box_w = img.width - margin_x * 2

    draw.rounded_rectangle(
        [(margin_x, box_y), (margin_x + box_w, box_y + box_h)],
        radius=12,
        fill=(0, 0, 0, 120)
    )

    y = box_y + padding
    for line in lines:
        bbox = draw.textbbox((0, 0), line, font=font)
        tw = bbox[2] - bbox[0]
        x = margin_x + (box_w - tw) // 2
        draw.text((x, y), line, fill=(255, 255, 255, 240), font=font)
        y += line_height

    result = Image.alpha_composite(img, overlay)
    result = result.convert('RGB')
    result.save(os.path.join(COMPOSITES_DIR, f'{clip}.png'))
    print(f'OK {clip}')

print('All composites generated')
