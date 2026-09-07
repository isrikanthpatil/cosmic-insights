#!/usr/bin/env python3
"""
panchang_card.py — render a 1080x1080 daily Panchang post graphic in Astropanth's
brand style. Reusable for daily social posts (pair with ig_post.py for automation).

Needs Pillow + cairosvg and the bundled brand fonts (auto-located under dist/assets).

Example:
    python3 panchang_card.py \
      --date "Friday · 5 September 2026" \
      --tithi "Shukla Purnima" --nakshatra "Uttara Phalguni" \
      --yoga "Shula" --karana "Bava" --vara "Shukravara (Friday)" \
      --sunrise "6:12 AM" --sunset "6:34 PM" --rahu "10:45 – 12:18" \
      --out panchang.png
"""
import argparse
import glob
import io
import math
import os
import random

import cairosvg
from PIL import Image, ImageDraw, ImageFont, ImageFilter

S = 1080
GOLD_H = "#E8C87E"
GOLD = (232, 200, 126)
CREAM = (240, 238, 248)
SEC = (184, 182, 202)
MUT = (126, 124, 146)
AMBER = (217, 164, 65)
SM = 'M54,37 C56.4,54.8 63.2,61.6 81,64 C63.2,66.4 56.4,73.2 54,91 C51.6,73.2 44.8,66.4 27,64 C44.8,61.6 51.6,54.8 54,37 Z'
SA = 'M84,28 C85.1,35.9 88.1,38.9 96,40 C88.1,41.1 85.1,44.1 84,52 C82.9,44.1 79.9,41.1 72,40 C79.9,38.9 82.9,35.9 84,28 Z'

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, "..", ".."))


def font_path(pattern):
    hits = glob.glob(os.path.join(ROOT, "dist/assets/**", pattern), recursive=True)
    if not hits:
        raise SystemExit("Font not found: " + pattern + " (run from the repo).")
    return hits[0]


PF = font_path("PlayfairDisplay_700Bold.*.ttf")
INSB = font_path("Inter_600SemiBold.*.ttf")
INM = font_path("Inter_500Medium.*.ttf")


def mark(px):
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="{px}" height="{px}">'
           f'<path d="{SM}" fill="{GOLD_H}"/><path d="{SA}" fill="{GOLD_H}"/></svg>')
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svg.encode(), output_width=px, output_height=px))).convert("RGBA")


def bg():
    top, edge = (22, 17, 44), (9, 9, 20)
    cx, cy = S * 0.5, S * 0.28
    maxr = math.hypot(S, S) * 0.62
    g = Image.new("RGB", (S, S))
    px = g.load()
    for y in range(S):
        for x in range(S):
            t = min(1.0, math.hypot(x - cx, y - cy) / maxr)
            px[x, y] = (int(top[0] + (edge[0] - top[0]) * t),
                        int(top[1] + (edge[1] - top[1]) * t),
                        int(top[2] + (edge[2] - top[2]) * t))
    im = g.convert("RGBA")
    st = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    sd = ImageDraw.Draw(st)
    random.seed(3)
    for _ in range(70):
        x, y, r = random.randint(0, S), random.randint(0, S), random.choice([1, 1, 2])
        sd.ellipse([x, y, x + r, y + r], fill=(255, 255, 255, random.randint(16, 50)))
    return Image.alpha_composite(im, st)


def ctr(d, t, f, y, fill):
    w = d.textlength(t, font=f)
    d.text(((S - w) / 2, y), t, font=f, fill=fill)


def card_box(overlay_draw, x, y, w, h, accent=False):
    # Translucent fill on a separate RGBA layer so alpha actually blends.
    fill = (217, 164, 65, 40) if accent else (255, 255, 255, 13)
    line = (217, 164, 65, 230) if accent else (232, 200, 126, 70)
    overlay_draw.rounded_rectangle([x, y, x + w, y + h], radius=18, fill=fill, outline=line, width=2)


def card_text(d, x, y, w, h, label, value, accent=False):
    d.text((x + 24, y + 20), label.upper(), font=ImageFont.truetype(INSB, 20), fill=(AMBER if accent else GOLD))
    s = 36
    while s > 20 and d.textlength(value, font=ImageFont.truetype(PF, s)) > w - 48:
        s -= 1
    d.text((x + 24, y + 52), value, font=ImageFont.truetype(PF, s), fill=CREAM)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--date", required=True)
    ap.add_argument("--tithi", required=True)
    ap.add_argument("--nakshatra", required=True)
    ap.add_argument("--yoga", required=True)
    ap.add_argument("--karana", required=True)
    ap.add_argument("--vara", required=True)
    ap.add_argument("--sunrise", required=True)
    ap.add_argument("--sunset", required=True)
    ap.add_argument("--rahu", required=True, help="Rahu Kalam time range")
    ap.add_argument("--out", default="panchang.png")
    a = ap.parse_args()

    im = bg()
    im.alpha_composite(mark(78), (int(S / 2 - 39), 66))
    d = ImageDraw.Draw(im)
    ctr(d, "T O D A Y ' S   P A N C H A N G", ImageFont.truetype(INSB, 24), 168, GOLD)
    ctr(d, a.date, ImageFont.truetype(PF, 46), 210, CREAM)

    # 2-column grid. Build card specs, draw translucent boxes on an overlay
    # (so alpha blends), composite, then draw the text on top.
    M, GAP, ch = 70, 24, 116
    cw = (S - 2 * M - GAP) / 2
    y0 = 300
    cards = [
        (M, y0, cw, ch, "Tithi", a.tithi, False),
        (M + cw + GAP, y0, cw, ch, "Nakshatra", a.nakshatra, False),
        (M, y0 + (ch + GAP), cw, ch, "Yoga", a.yoga, False),
        (M + cw + GAP, y0 + (ch + GAP), cw, ch, "Karana", a.karana, False),
        (M, y0 + 2 * (ch + GAP), cw, ch, "Sunrise", a.sunrise, False),
        (M + cw + GAP, y0 + 2 * (ch + GAP), cw, ch, "Sunset", a.sunset, False),
        (M, y0 + 3 * (ch + GAP), S - 2 * M, ch, "Vara", a.vara, False),
        (M, y0 + 4 * (ch + GAP), S - 2 * M, ch, "Rahu Kalam · avoid", a.rahu, True),
    ]
    overlay = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    for (x, y, w, h, _lab, _val, acc) in cards:
        card_box(od, x, y, w, h, acc)
    im = Image.alpha_composite(im, overlay)
    d = ImageDraw.Draw(im)
    for (x, y, w, h, lab, val, acc) in cards:
        card_text(d, x, y, w, h, lab, val, acc)

    ctr(d, "Astropanth  ·  astropanth.com", ImageFont.truetype(INM, 25), 1005, MUT)
    im.convert("RGB").save(a.out, "PNG")
    print("saved", a.out)


if __name__ == "__main__":
    main()
