#!/usr/bin/env python3
"""
generate_panchang_pages.py — build indexable daily Panchang web pages for SEO.

For every day in the batch it writes a brand-styled, text-first HTML page
(astropanth.com/panchang/<YYYY-MM-DD>.html) whose visible content is the day's
five angas + timings (so search engines index "aaj ka panchang / today's tithi"
queries), plus schema.org JSON-LD, prev/next navigation, an app CTA, and the
daily card as the social (og:image). Also builds the /panchang/ hub and sitemap.

Input:  panchang-data.json  (from scripts/social batch harness; array of days)
Output: marketing-site/panchang/*.html, marketing-site/panchang/index.html,
        marketing-site/sitemap.xml
Cards:  referenced at /social/panchang/<date>.png (copy the cards there before deploy).
"""
import argparse
import datetime
import html
import json
import os

SITE = "https://astropanth.com"
APP = "https://app.astropanth.com"

CSS = """
:root{--bg1:#0B0B1A;--bg2:#0E0B22;--bg3:#140F2A;--gold:#E8C87E;--cream:#F4F1E8;--sec:#C7C4D6;--muted:#8B88A0;--amber:#D9A441}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 600px at 50% -10%,var(--bg3),var(--bg1)) fixed;color:var(--cream);
font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6}
a{color:var(--gold);text-decoration:none}
.wrap{max-width:820px;margin:0 auto;padding:24px 20px 64px}
.top{display:flex;align-items:center;justify-content:space-between;padding:8px 0 24px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Playfair Display',serif;font-size:20px;color:var(--cream)}
.brand svg{width:26px;height:26px}
h1{font-family:'Playfair Display',serif;font-weight:700;font-size:30px;line-height:1.2;margin:8px 0 4px}
.sub{color:var(--sec);margin:0 0 24px;font-size:15px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:0 0 20px}
.card{background:rgba(255,255,255,.05);border:1px solid rgba(232,200,126,.28);border-radius:14px;padding:14px 16px}
.card.full{grid-column:1 / -1}
.card.avoid{background:rgba(217,164,65,.15);border-color:rgba(217,164,65,.9)}
.lab{font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--gold);margin:0 0 4px}
.val{font-family:'Playfair Display',serif;font-size:20px;color:var(--cream);margin:0}
.nav{display:flex;justify-content:space-between;gap:12px;margin:20px 0}
.nav a{background:rgba(255,255,255,.05);border:1px solid rgba(232,200,126,.28);border-radius:10px;padding:10px 14px;font-size:14px}
.cta{display:block;text-align:center;background:linear-gradient(90deg,var(--gold),var(--amber));color:#1a1204;
font-weight:700;border-radius:12px;padding:14px;margin:24px 0;font-size:16px}
.intro{color:var(--sec);font-size:15px}
.months{margin-top:28px}
.month{margin:0 0 26px}
.month h2{font-family:'Playfair Display',serif;font-weight:600;font-size:20px;margin:0 0 10px;color:var(--gold)}
.cal{display:grid;grid-template-columns:repeat(7,1fr);gap:6px}
.dow{font-size:11px;letter-spacing:.05em;text-transform:uppercase;color:var(--muted);text-align:center;padding:2px 0}
.cell{aspect-ratio:1/1;display:flex;align-items:center;justify-content:center;border-radius:10px;
background:rgba(255,255,255,.045);border:1px solid rgba(232,200,126,.18);color:var(--cream);font-size:14px;transition:background .15s}
.cell:hover{background:rgba(232,200,126,.20);text-decoration:none}
.cell.empty{background:transparent;border:0}
.cell.today{background:linear-gradient(90deg,var(--gold),var(--amber));color:#1a1204;font-weight:700;border-color:transparent}
.imgwrap{margin:20px 0;text-align:center}
.imgwrap img{max-width:340px;width:100%;border-radius:16px;border:1px solid rgba(232,200,126,.2)}
footer{color:var(--muted);font-size:13px;text-align:center;margin-top:40px;border-top:1px solid rgba(255,255,255,.08);padding-top:20px}
footer a{color:var(--sec)}
"""

LOGO = ('<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">'
        '<path fill="#E8C87E" d="M54,37 C56.4,54.8 63.2,61.6 81,64 C63.2,66.4 56.4,73.2 54,91 '
        'C51.6,73.2 44.8,66.4 27,64 C44.8,61.6 51.6,54.8 54,37 Z"/>'
        '<path fill="#E8C87E" d="M84,28 C85.1,35.9 88.1,38.9 96,40 C88.1,41.1 85.1,44.1 84,52 '
        'C82.9,44.1 79.9,41.1 72,40 C79.9,38.9 82.9,35.9 84,28 Z"/></svg>')

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="keywords" content="{keywords}">
<link rel="canonical" href="{canonical}">
<meta property="og:title" content="{title}">
<meta property="og:description" content="{desc}">
<meta property="og:type" content="article">
<meta property="og:url" content="{canonical}">
<meta property="og:image" content="{ogimage}">
<meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap" rel="stylesheet">
<style>{css}</style>
<script type="application/ld+json">{jsonld}</script>
</head>
<body><div class="wrap">
<div class="top"><a class="brand" href="/">{logo}<span>Astropanth</span></a><a href="/panchang/">All Panchang</a></div>
"""

FOOT = """<footer>
<p><a href="/">Astropanth</a> — free Vedic astrology, Kundli, Panchang & Numerology for India.
Now in Hindi, Marathi, Kannada, Tamil & Telugu.</p>
<p><a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a> · <a href="/panchang/">Panchang archive</a></p>
</footer>
</div></body></html>
"""


def esc(s):
    return html.escape(str(s), quote=True)


def card_html(lab, val, cls=""):
    return f'<div class="card {cls}"><p class="lab">{esc(lab)}</p><p class="val">{esc(val)}</p></div>'


def day_page(rec, prev_iso, next_iso):
    iso = rec["iso"]
    dl = rec["dateLabel"]
    title = f"Panchang for {dl.replace(' · ', ', ')} — Tithi {rec['tithi']}, Nakshatra {rec['nakshatra']} | Astropanth"
    desc = (f"{rec['weekday']} Panchang for {dl.split(' · ')[1]}: Tithi {rec['tithi']}, "
            f"Nakshatra {rec['nakshatra']}, Yoga {rec['yoga']}, Karana {rec['karana']}. "
            f"Sunrise {rec['sunrise']}, Sunset {rec['sunset']}, Rahu Kalam {rec['rahu']}. "
            f"Free daily Panchang & Rashifal on Astropanth.")
    keywords = (f"panchang, aaj ka panchang, today panchang, {dl.split(' · ')[1]} panchang, "
                f"tithi, nakshatra, {rec['tithi']}, {rec['nakshatra']}, hindu calendar, rashifal, muhurat")
    canonical = f"{SITE}/panchang/{iso}.html"
    ogimage = f"{SITE}/social/panchang/{iso}.png"
    jsonld = json.dumps({
        "@context": "https://schema.org", "@type": "Article",
        "headline": f"Panchang for {dl.replace(' · ', ', ')}",
        "description": desc, "image": ogimage, "url": canonical,
        "datePublished": iso, "dateModified": iso,
        "author": {"@type": "Organization", "name": "Astropanth"},
        "publisher": {"@type": "Organization", "name": "Astropanth",
                      "logo": {"@type": "ImageObject", "url": f"{SITE}/assets/icon.png"}},
        "about": ["Panchang", "Vedic Astrology", "Hindu Calendar"],
    }, ensure_ascii=False)

    head = HEAD.format(title=esc(title), desc=esc(desc), keywords=esc(keywords),
                       canonical=canonical, ogimage=ogimage, css=CSS, jsonld=jsonld, logo=LOGO)
    body = [head]
    body.append(f'<h1>Panchang · {esc(dl)}</h1>')
    body.append(f'<p class="sub">Tithi, Nakshatra, Yoga, Karana &amp; timings (IST) for {esc(rec["weekday"])}.</p>')
    body.append('<div class="grid">')
    body.append(card_html("Tithi", rec["tithi"]))
    body.append(card_html("Nakshatra", rec["nakshatra"]))
    body.append(card_html("Yoga", rec["yoga"]))
    body.append(card_html("Karana", rec["karana"]))
    body.append(card_html("Sunrise", rec["sunrise"]))
    body.append(card_html("Sunset", rec["sunset"]))
    body.append(card_html("Vara (Weekday)", rec["vara"], "full"))
    body.append(card_html("Rahu Kalam · avoid", rec["rahu"], "full avoid"))
    body.append('</div>')
    body.append(f'<div class="imgwrap"><img src="/social/panchang/{iso}.png" alt="Panchang for {esc(dl)} — Astropanth" loading="lazy"></div>')
    body.append(f'<a class="cta" href="{APP}">Get your personalized daily Rashifal &amp; Panchang — free on Astropanth →</a>')
    nav = '<div class="nav">'
    nav += f'<a href="/panchang/{prev_iso}.html">← Previous day</a>' if prev_iso else '<span></span>'
    nav += f'<a href="/panchang/{next_iso}.html">Next day →</a>' if next_iso else '<span></span>'
    nav += '</div>'
    body.append(nav)
    body.append(FOOT)
    return "".join(body)


def hub_page(days):
    canonical = f"{SITE}/panchang/"
    desc = ("Daily Panchang for India — Tithi, Nakshatra, Yoga, Karana, sunrise, sunset and "
            "Rahu Kalam for every day, free. Authentic sidereal (Lahiri) calculations from Astropanth.")
    jsonld = json.dumps({
        "@context": "https://schema.org", "@type": "WebSite", "name": "Astropanth Panchang",
        "url": canonical, "description": desc,
    }, ensure_ascii=False)
    head = HEAD.format(title="Daily Panchang — Tithi, Nakshatra, Rahu Kalam | Astropanth",
                       desc=esc(desc), keywords="panchang, aaj ka panchang, daily panchang, tithi, nakshatra, rahu kalam, hindu calendar, rashifal, muhurat",
                       canonical=canonical, ogimage=f"{SITE}/social/panchang/{days[0]['iso']}.png",
                       css=CSS, jsonld=jsonld, logo=LOGO)
    body = [head]
    body.append('<h1>Daily Panchang</h1>')
    body.append('<p class="intro">The Panchang (five limbs of the day) — <strong>Tithi</strong>, '
                '<strong>Nakshatra</strong>, <strong>Yoga</strong>, <strong>Karana</strong> and '
                '<strong>Vara</strong> — with sunrise, sunset and Rahu Kalam, computed from authentic '
                'sidereal (Lahiri) positions. Pick a date below, or open today\'s Panchang.</p>')
    body.append(f'<a class="cta" id="today" href="/panchang/{days[0]["iso"]}.html">Today\'s Panchang →</a>')
    # Group links by month.
    from collections import OrderedDict
    months = OrderedDict()
    for d in days:
        ym = d["iso"][:7]
        months.setdefault(ym, []).append(d)
    body.append('<div class="months">')
    DOW = ["S", "M", "T", "W", "T", "F", "S"]  # Sunday-first
    for ym, ds in months.items():
        label = ds[0]["dateLabel"].split(" · ")[1].split(" ", 1)[1]  # "September 2026"
        wd = datetime.date.fromisoformat(ds[0]["iso"]).weekday()  # Mon=0..Sun=6
        offset = (wd + 1) % 7  # Sunday-first column of the first present day
        body.append(f'<div class="month"><h2>{esc(label)}</h2><div class="cal">')
        body.append("".join(f'<div class="dow">{d}</div>' for d in DOW))
        body.append('<div class="cell empty"></div>' * offset)
        body.append("".join(
            f'<a class="cell" data-iso="{d["iso"]}" href="/panchang/{d["iso"]}.html">{int(d["iso"][8:10])}</a>'
            for d in ds))
        body.append('</div></div>')
    body.append('</div>')
    # JS: point "Today" at the current IST date page + highlight today's cell.
    isos = [d["iso"] for d in days]
    body.append('<script>(function(){var days=' + json.dumps(isos) +
                ';var n=new Date(Date.now()+330*60000);var t=n.toISOString().slice(0,10);'
                'if(days.indexOf(t)>=0){document.getElementById("today").href="/panchang/"+t+".html";}'
                'var c=document.querySelector(\'.cell[data-iso="\'+t+\'"]\');if(c)c.classList.add("today");})();</script>')
    body.append(FOOT)
    return "".join(body)


def sitemap(days, extra=("/", "/pricing/", "/privacy/", "/terms/", "/refund/", "/panchang/")):
    urls = list(extra) + [f"/panchang/{d['iso']}.html" for d in days]
    items = "".join(
        f"<url><loc>{SITE}{u}</loc>" + (f"<lastmod>{u.split('/')[-1].replace('.html','')}</lastmod>" if u.startswith('/panchang/2') else "") + "</url>"
        for u in urls)
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + items + '</urlset>'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--data", default="/tmp/eng/panchang-data.json")
    ap.add_argument("--out", default="marketing-site")
    args = ap.parse_args()
    days = json.load(open(args.data, encoding="utf-8"))
    pdir = os.path.join(args.out, "panchang")
    os.makedirs(pdir, exist_ok=True)
    for i, rec in enumerate(days):
        prev_iso = days[i - 1]["iso"] if i > 0 else None
        next_iso = days[i + 1]["iso"] if i < len(days) - 1 else None
        open(os.path.join(pdir, rec["iso"] + ".html"), "w", encoding="utf-8").write(day_page(rec, prev_iso, next_iso))
    open(os.path.join(pdir, "index.html"), "w", encoding="utf-8").write(hub_page(days))
    open(os.path.join(args.out, "sitemap.xml"), "w", encoding="utf-8").write(sitemap(days))
    print(f"Wrote {len(days)} day pages + hub + sitemap into {pdir}")


if __name__ == "__main__":
    main()
