#!/usr/bin/env python3
"""Generate synthetic terminal frames for Beacon demo video."""

from PIL import Image, ImageDraw, ImageFont
import os

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
FRAMES_DIR = os.path.join(SCRIPT_DIR, 'frames')
os.makedirs(FRAMES_DIR, exist_ok=True)

# Find a monospace font
def get_mono_font(size):
    candidates = [
        '/System/Library/Fonts/SFMono-Regular.otf',
        '/System/Library/Fonts/Menlo.ttc',
        '/System/Library/Fonts/Monaco.ttf',
        '/Library/Fonts/Courier New.ttf',
    ]
    for f in candidates:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except:
                continue
    return ImageFont.load_default()

def get_sans_font(size):
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

mono = get_mono_font(18)
mono_sm = get_mono_font(15)
title_font = get_sans_font(14)

BG = (10, 12, 22)
FG = (200, 205, 220)
GREEN = (34, 197, 94)
AMBER = (245, 158, 11)
BLUE = (99, 102, 241)
MUTED = (90, 95, 110)
RED = (239, 68, 68)

def draw_terminal(filename, title, lines):
    """Draw a terminal-style frame."""
    W, H = 1920, 1080
    img = Image.new('RGB', (W, H), BG)
    draw = ImageDraw.Draw(img)

    # Terminal window chrome
    chrome_h = 40
    draw.rectangle([(80, 60), (W-80, 60+chrome_h)], fill=(25, 28, 38))
    # Window dots
    for i, color in enumerate([(255,95,86), (255,189,46), (39,201,63)]):
        draw.ellipse([(100 + i*24, 72), (112 + i*24, 84)], fill=color)
    # Title
    draw.text((W//2 - 100, 68), title, fill=MUTED, font=title_font)

    # Terminal body
    body_top = 60 + chrome_h
    draw.rectangle([(80, body_top), (W-80, H-60)], fill=(13, 16, 23))

    y = body_top + 20
    x = 110
    line_h = 28

    for line in lines:
        if isinstance(line, tuple):
            text, color = line
        else:
            text, color = line, FG

        draw.text((x, y), text, fill=color, font=mono)
        y += line_h

    img.save(os.path.join(FRAMES_DIR, filename))
    print(f'OK {filename}')

# Frame 04: x402 payment test
draw_terminal('04-payment.png', 'beacon -- x402 payment test', [
    ('$ npx tsx scripts/test-client.ts', BLUE),
    ('', FG),
    ('Querying: https://beacon-gi0z.onrender.com/api/score?url=...', MUTED),
    ('', FG),
    ('Got 402 Payment Required', AMBER),
    ('Payment header found: x402v2', AMBER),
    ('  scheme: exact', MUTED),
    ('  network: stellar:testnet', MUTED),
    ('  amount: 1000 (0.001 USDC)', MUTED),
    ('  payTo: GB7DLRN3...BLVAKOH', MUTED),
    ('', FG),
    ('Signing Stellar transaction...', FG),
    ('Payment submitted to facilitator', GREEN),
    ('', FG),
    ('HTTP 200 OK', GREEN),
    ('{', FG),
    ('  "url": "https://xlm402.com/health",', FG),
    ('  "trust_score": 95,', GREEN),
    ('  "uptime_score": 100,', GREEN),
    ('  "latency_score": 87,', GREEN),
    ('  "total_probes_24h": 48,', FG),
    ('  "avg_latency_ms": 673,', FG),
    ('  "p95_latency_ms": 1134,', FG),
    ('  "x402_valid_rate": 0,', FG),
    ('  "x402_network": null', FG),
    ('}', FG),
    ('', FG),
    ('Paid 0.001 USDC on Stellar testnet', GREEN),
])

# Frame 05: Stellar explorer
draw_terminal('05-explorer.png', 'stellar.expert -- testnet account', [
    ('Account: GB7DLRN3DN3MRW3L7ARCYID54EBASQUVBRHUL7MDTADFGXPBGBLVAKOH', BLUE),
    ('Network: Stellar Testnet', MUTED),
    ('', FG),
    ('Balances:', FG),
    ('  XLM:  9,990.127 lumens', FG),
    ('  USDC: 10.000 (Circle testnet)', GREEN),
    ('', FG),
    ('Recent Operations:', FG),
    ('', FG),
    ('1. invoke_host_function  Apr 7, 21:25 UTC', GREEN),
    ('   Transfer 0.001 USDC (x402 payment)', GREEN),
    ('   Status: Successful', GREEN),
    ('', FG),
    ('2. path_payment_strict_receive  Apr 7, 21:24 UTC', FG),
    ('   Received: 10 USDC', FG),
    ('   Sent: 9.873 XLM (via DEX)', FG),
    ('   Status: Successful', GREEN),
    ('', FG),
    ('3. change_trust  Apr 7, 07:36 UTC', FG),
    ('   Asset: USDC (GBBD47IF...)', FG),
    ('   Status: Successful', GREEN),
    ('', FG),
    ('4. create_account  Apr 7, 07:24 UTC', FG),
    ('   Initial: 10,000 XLM (friendbot)', FG),
    ('   Status: Successful', GREEN),
])

print('All terminal frames generated')
