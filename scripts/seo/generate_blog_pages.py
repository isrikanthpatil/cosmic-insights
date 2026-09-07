#!/usr/bin/env python3
"""
generate_blog_pages.py — long-tail SEO explainer articles for the marketing site.

Brand-styled, text-first articles targeting high-volume informational queries
(what is Sade Sati, Mangal Dosha / Manglik, Gun Milan 36 gunas, Rahu Kalam,
Vimshottari Dasha). Each has Article + BreadcrumbList JSON-LD, internal links, and
an app CTA. Writes marketing-site/blog/<slug>/index.html + a /blog/ hub.

After running, re-run generate_landing_pages.py to refresh the sitemap (it scans
the whole site, so blog pages get picked up automatically).
"""
import html
import json
import os

SITE = "https://astropanth.com"
APP = "https://app.astropanth.com"
OUT = "marketing-site"

CSS = """
:root{--bg1:#0B0B1A;--bg3:#140F2A;--gold:#E8C87E;--cream:#F4F1E8;--sec:#C7C4D6;--muted:#8B88A0;--amber:#D9A441}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 600px at 50% -10%,var(--bg3),var(--bg1)) fixed;color:var(--cream);
font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.7}
a{color:var(--gold);text-decoration:none} a:hover{text-decoration:underline}
.wrap{max-width:720px;margin:0 auto;padding:24px 20px 64px}
.top{display:flex;align-items:center;justify-content:space-between;padding:8px 0 20px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Playfair Display',serif;font-size:20px;color:var(--cream)}
.brand svg{width:26px;height:26px}
.crumb{font-size:13px;color:var(--muted);margin:0 0 8px}
h1{font-family:'Playfair Display',serif;font-weight:700;font-size:32px;line-height:1.2;margin:6px 0 12px}
h2{font-family:'Playfair Display',serif;font-weight:600;font-size:22px;margin:30px 0 8px}
p{margin:12px 0} .lead{font-size:18px;color:var(--sec)}
ul{margin:12px 0;padding-left:22px} li{margin:6px 0}
.cta{display:inline-block;background:linear-gradient(90deg,var(--gold),var(--amber));color:#1a1204;
font-weight:700;border-radius:12px;padding:13px 22px;margin:22px 0;font-size:16px}
.faq h3{font-size:16px;margin:16px 0 4px;color:var(--gold)}
.rel{margin:28px 0 0;padding:16px;border:1px solid rgba(232,200,126,.25);border-radius:14px;background:rgba(255,255,255,.04)}
.rel a{display:inline-block;margin:4px 12px 4px 0}
.disc{font-size:13px;color:var(--muted);margin-top:24px;font-style:italic}
footer{color:var(--muted);font-size:13px;margin-top:40px;border-top:1px solid rgba(255,255,255,.08);padding-top:20px}
footer a{color:var(--sec)}
"""
LOGO = ('<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">'
        '<path fill="#E8C87E" d="M54,37 C56.4,54.8 63.2,61.6 81,64 C63.2,66.4 56.4,73.2 54,91 '
        'C51.6,73.2 44.8,66.4 27,64 C44.8,61.6 51.6,54.8 54,37 Z"/>'
        '<path fill="#E8C87E" d="M84,28 C85.1,35.9 88.1,38.9 96,40 C88.1,41.1 85.1,44.1 84,52 '
        'C82.9,44.1 79.9,41.1 72,40 C79.9,38.9 82.9,35.9 84,28 Z"/></svg>')


def esc(s):
    return html.escape(str(s), quote=True)


# Each article: slug, title, desc, keywords, h1, lead, body (list of (h2, [paras/lists])),
# faqs, cta. Paras that start with "-" become <ul> items.
ARTICLES = [
 {"slug":"what-is-sade-sati","title":"What is Sade Sati? Shani Sade Sati Meaning, Phases & Remedies | Astropanth",
  "desc":"Sade Sati is Saturn's ~7.5-year transit over the 12th, 1st and 2nd houses from your natal Moon. Learn its three phases, effects and grounded remedies.",
  "keywords":"sade sati, shani sade sati, saturn transit, dhaiya, saturn over moon, sade sati remedies, sade sati phases",
  "h1":"What is Sade Sati?","crumb":"Home › Blog › Sade Sati",
  "lead":"Sade Sati is the roughly <strong>seven-and-a-half year</strong> period when Saturn (Shani) transits the three signs around your natal Moon (Janma Rashi) — the 12th, the 1st (the Moon's own sign) and the 2nd.",
  "body":[
    ("Why 7.5 years",["Saturn spends about 2.5 years in each sign. As it crosses the sign before your Moon, the Moon's sign itself, and the sign after, that's three signs — about 7.5 years in total."]),
    ("The three phases",[
      "- Rising phase (12th from Moon): themes of expense, letting go, sleep and endings.",
      "- Peak phase (over the Moon): the most felt phase — mind, health and major life shifts.",
      "- Setting phase (2nd from Moon): family, finances and speech come into focus.",
    ]),
    ("What it actually means",["Sade Sati is best understood as a period of consolidation and maturity rather than simple 'bad luck'. Saturn asks for patience, honest effort and responsibility, and tends to reward discipline. Its intensity depends on Saturn's strength and placement in your own chart."]),
    ("Grounded remedies",[
      "- Keep steady routines; avoid shortcuts and overcommitment.",
      "- Serve others and elders; Saturn rules duty and humility.",
      "- Recite Shani mantras and observe Saturday practices if it suits your faith.",
    ]),
  ],
  "faqs":[
    ("How often does Sade Sati occur?","Roughly every 30 years, since Saturn takes about 30 years to circle the zodiac and Sade Sati is the 7.5-year window around your Moon sign."),
    ("Is Sade Sati always bad?","No. It's a demanding but maturing period. With patience and honest effort it often coincides with lasting growth and responsibility."),
    ("How do I know if I'm in Sade Sati?","It depends on your natal Moon sign and Saturn's current sign. Astropanth calculates your Sade Sati status and phase from your birth details, free."),
  ],
  "cta":"Check your Sade Sati free"},

 {"slug":"mangal-dosha-manglik","title":"Mangal Dosha (Manglik) Explained — Effects, Cancellation & Remedies | Astropanth",
  "desc":"Mangal Dosha (Manglik) is caused by Mars in certain houses. Learn how it's checked for marriage, when it cancels, and grounded remedies.",
  "keywords":"mangal dosha, manglik, mangalik, kuja dosha, mars dosha, manglik matching, mangal dosha cancellation",
  "h1":"Mangal Dosha (Manglik) Explained","crumb":"Home › Blog › Mangal Dosha",
  "lead":"Mangal Dosha — also called being <strong>Manglik</strong> or Kuja Dosha — occurs when Mars sits in specific houses of the chart, and is traditionally weighed in marriage matching.",
  "body":[
    ("Which placements",["Mars in the 1st, 2nd, 4th, 7th, 8th or 12th house is considered to cause Mangal Dosha. It is checked from the Ascendant (Lagna), and also from the Moon and from Venus in stricter analysis."]),
    ("Why it matters in matching",["These houses relate to self, family, home, marriage, longevity and expenses, so the tradition treats Mars here as adding intensity to married life. It is one factor among many — never the whole picture."]),
    ("When it cancels",[
      "- When both partners are Manglik, the dosha is often considered neutralised.",
      "- Certain signs, aspects and Mars placements are treated as cancelling or reducing it.",
      "- Overall chart strength and Gun Milan matter more than the label alone.",
    ]),
    ("Grounded remedies",["Traditional suggestions include Mangal (Mars) mantras, Tuesday practices and, in some customs, specific pujas. Astropanth focuses on clear analysis first — knowing whether the dosha truly applies and whether it cancels."]),
  ],
  "faqs":[
    ("What houses cause Mangal Dosha?","Mars in the 1st, 2nd, 4th, 7th, 8th or 12th house from the Ascendant (and checked from Moon and Venus too)."),
    ("Does Manglik cancel if both are Manglik?","In most traditions, yes — two Manglik partners are considered to balance the dosha."),
    ("Does Astropanth check Manglik?","Yes. Kundli Matching on Astropanth evaluates Mangal Dosha for both charts and whether it applies or cancels, free."),
  ],
  "cta":"Check Manglik in matching"},

 {"slug":"gun-milan-36-gunas","title":"Gun Milan: the 36 Gunas in Kundli Matching Explained | Astropanth",
  "desc":"Gun Milan scores marriage compatibility out of 36 gunas across 8 kootas. Learn each koota, what score is good, and why Nadi and Bhakoot matter most.",
  "keywords":"gun milan, 36 gunas, ashtakoota, kundli matching, guna milan, nadi dosha, bhakoot dosha, horoscope matching",
  "h1":"Gun Milan: the 36 Gunas Explained","crumb":"Home › Blog › Gun Milan",
  "lead":"Ashtakoota <strong>Gun Milan</strong> scores compatibility between two charts out of <strong>36 points</strong>, across eight factors called kootas, using each person's Moon sign and Nakshatra.",
  "body":[
    ("The 8 kootas and their points",[
      "- Varna (1) — spiritual/temperamental compatibility",
      "- Vashya (2) — mutual attraction and control",
      "- Tara (3) — health and well-being",
      "- Yoni (4) — physical and instinctive compatibility",
      "- Graha Maitri (5) — mental and intellectual bond",
      "- Gana (6) — temperament (Deva/Manushya/Rakshasa)",
      "- Bhakoot (7) — emotional and financial harmony",
      "- Nadi (8) — health and progeny",
    ]),
    ("What score is good",["Broadly, 18 or more out of 36 is considered acceptable, and 24+ very good. But the total alone doesn't decide a match — the specific doshas do."]),
    ("Why Nadi and Bhakoot matter most",["Nadi carries the most points (8) and same-Nadi is treated as a significant dosha. Bhakoot affects emotional and financial harmony. A high total with a serious Nadi or Bhakoot dosha still needs careful reading — which is why the koota-by-koota breakdown matters more than the headline number."]),
  ],
  "faqs":[
    ("How many gunas are needed for marriage?","18+ of 36 is traditionally acceptable, 24+ is very good — but doshas like Nadi and Bhakoot are weighed beyond the raw score."),
    ("What is Nadi dosha?","When both partners share the same Nadi (of three), it's considered a dosha affecting health and progeny, and is examined carefully."),
    ("Where can I do Gun Milan free?","Astropanth's Kundli Matching gives the full 36-guna, koota-by-koota breakdown plus Manglik, free."),
  ],
  "cta":"Do Gun Milan free"},

 {"slug":"what-is-rahu-kalam","title":"What is Rahu Kalam? Meaning, Timing & Why It's Avoided | Astropanth",
  "desc":"Rahu Kalam is an inauspicious ~90-minute window each day that changes by weekday. Learn how it's calculated and what to avoid during it.",
  "keywords":"rahu kalam, rahu kaal, rahukalam today, inauspicious time, rahu kalam timing, muhurat",
  "h1":"What is Rahu Kalam?","crumb":"Home › Blog › Rahu Kalam",
  "lead":"Rahu Kalam (Rahu Kaal) is a roughly <strong>90-minute period each day</strong>, considered inauspicious for starting important new work. Its timing changes with the weekday and with your local sunrise and sunset.",
  "body":[
    ("How it's calculated",["The daytime (sunrise to sunset) is divided into eight equal parts. One of those parts is Rahu Kalam, and which part depends on the weekday — so the exact clock time shifts through the day across the week and by your location."]),
    ("What is usually avoided",["Tradition suggests not beginning important new ventures — signing, travel starts, ceremonies or major purchases — during Rahu Kalam. Ongoing work and routine tasks are generally considered fine."]),
    ("A balanced view",["Rahu Kalam is a timing guideline, not a prohibition. Many people simply schedule important new beginnings outside the window when it's convenient, and don't worry about it otherwise."]),
  ],
  "faqs":[
    ("How long is Rahu Kalam?","About one-eighth of the daytime — typically around 90 minutes, varying slightly with the length of the day."),
    ("Does Rahu Kalam change daily?","Yes — the slot depends on the weekday, and the exact times depend on your local sunrise/sunset."),
    ("Where can I see today's Rahu Kalam?","Astropanth's free daily Panchang shows Rahu Kalam along with Tithi, Nakshatra and the day's timings."),
  ],
  "cta":"See today's Rahu Kalam"},

 {"slug":"vimshottari-dasha","title":"Vimshottari Dasha Explained — Planetary Periods & Timing | Astropanth",
  "desc":"Vimshottari Dasha is a 120-year cycle of nine planetary periods that times life events, based on your Moon's Nakshatra. Learn how it works.",
  "keywords":"vimshottari dasha, dasha, mahadasha, antardasha, planetary periods, dasha calculator, vedic timing",
  "h1":"Vimshottari Dasha Explained","crumb":"Home › Blog › Vimshottari Dasha",
  "lead":"Vimshottari Dasha is the most widely used timing system in Vedic astrology — a <strong>120-year cycle</strong> divided into nine planetary periods that indicate when different areas of life come into focus.",
  "body":[
    ("The nine periods",[
      "Each planet rules a Mahadasha of fixed length: Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19, Mercury 17 — 120 years in all.",
    ]),
    ("Where it starts",["Your first Dasha is set by the Nakshatra your Moon occupies at birth, so two people born days apart can be in very different periods. From there the sequence runs in a fixed order."]),
    ("Mahadasha and Antardasha",["Each Mahadasha (major period) is subdivided into Antardashas (sub-periods) of every planet, and further still. The combination of the ruling major and sub-period colours the themes and timing of events."]),
    ("How to use it",["Dasha is about timing — which planet's significations are active now. Read alongside transits and the natal chart for a fuller picture."]),
  ],
  "faqs":[
    ("What is Vimshottari Dasha based on?","The Nakshatra (lunar mansion) of your Moon at birth, which sets the starting period and the sequence."),
    ("What is the difference between Mahadasha and Antardasha?","Mahadasha is the major planetary period; Antardasha is a sub-period within it. Both together shape the active themes."),
    ("Can I see my Dasha free?","Yes — Astropanth shows your Vimshottari Dasha timeline (three levels) from your birth details, free."),
  ],
  "cta":"See your Dasha timeline"},
]

RELATED = [("/kundli/","Free Kundli"),("/kundli-matching/","Kundli Matching"),
           ("/numerology/","Numerology"),("/panchang/","Daily Panchang"),("/blog/","All articles")]
DISCLAIMER = ("Astrology is a tradition of insight and reflection, not a substitute for "
              "professional medical, legal or financial advice.")


def render(a):
    canonical = f"{SITE}/blog/{a['slug']}/"
    faq_ld = {"@context":"https://schema.org","@type":"FAQPage","mainEntity":[
        {"@type":"Question","name":q,"acceptedAnswer":{"@type":"Answer","text":ans}} for q,ans in a["faqs"]]}
    art_ld = {"@context":"https://schema.org","@type":"Article","headline":a["h1"],
              "description":a["desc"],"url":canonical,
              "author":{"@type":"Organization","name":"Astropanth"},
              "publisher":{"@type":"Organization","name":"Astropanth",
                           "logo":{"@type":"ImageObject","url":f"{SITE}/assets/icon.png"}}}
    crumb_ld = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":1,"name":"Home","item":SITE+"/"},
        {"@type":"ListItem","position":2,"name":"Blog","item":SITE+"/blog/"},
        {"@type":"ListItem","position":3,"name":a["h1"],"item":canonical}]}
    h=["<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">",
       "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
       f"<title>{esc(a['title'])}</title>",
       f"<meta name=\"description\" content=\"{esc(a['desc'])}\">",
       f"<meta name=\"keywords\" content=\"{esc(a['keywords'])}\">",
       f"<link rel=\"canonical\" href=\"{canonical}\">",
       f"<meta property=\"og:title\" content=\"{esc(a['title'])}\"><meta property=\"og:description\" content=\"{esc(a['desc'])}\">",
       f"<meta property=\"og:type\" content=\"article\"><meta property=\"og:url\" content=\"{canonical}\">",
       "<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>",
       "<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap\" rel=\"stylesheet\">",
       f"<style>{CSS}</style>",
       f"<script type=\"application/ld+json\">{json.dumps(art_ld,ensure_ascii=False)}</script>",
       f"<script type=\"application/ld+json\">{json.dumps(faq_ld,ensure_ascii=False)}</script>",
       f"<script type=\"application/ld+json\">{json.dumps(crumb_ld,ensure_ascii=False)}</script>",
       "</head><body><div class=\"wrap\">",
       f"<div class=\"top\"><a class=\"brand\" href=\"/\">{LOGO}<span>Astropanth</span></a><a href=\"/blog/\">Blog</a></div>",
       f"<p class=\"crumb\">{esc(a['crumb'])}</p><h1>{esc(a['h1'])}</h1><p class=\"lead\">{a['lead']}</p>",
       f"<a class=\"cta\" href=\"{APP}\">{esc(a['cta'])} →</a>"]
    for h2, paras in a["body"]:
        h.append(f"<h2>{esc(h2)}</h2>")
        items=[p for p in paras if p.startswith("- ")]
        if items:
            h.append("<ul>"+"".join(f"<li>{esc(p[2:])}</li>" for p in items)+"</ul>")
        for p in paras:
            if not p.startswith("- "): h.append(f"<p>{esc(p)}</p>")
    h.append("<div class=\"faq\"><h2>FAQ</h2>")
    for q,ans in a["faqs"]: h.append(f"<h3>{esc(q)}</h3><p>{esc(ans)}</p>")
    h.append("</div>")
    h.append(f"<a class=\"cta\" href=\"{APP}\">{esc(a['cta'])} →</a>")
    rel="".join(f'<a href="{u}">{esc(t)}</a>' for u,t in RELATED if a['slug'] not in u)
    h.append(f"<div class=\"rel\"><strong>Explore more:</strong><br>{rel}</div>")
    h.append(f"<p class=\"disc\">{esc(DISCLAIMER)}</p>")
    h.append("<footer><p><a href=\"/\">Astropanth</a> — free Vedic astrology, Kundli, Panchang & Numerology for India, in 6 languages.</p>"
             "<p><a href=\"/privacy/\">Privacy</a> · <a href=\"/terms/\">Terms</a></p></footer></div></body></html>")
    return "".join(h)


def hub():
    canonical=f"{SITE}/blog/"
    desc="Vedic astrology explained — clear guides to Sade Sati, Mangal Dosha, Gun Milan, Rahu Kalam, Vimshottari Dasha and more, from Astropanth."
    h=["<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\">",
       "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">",
       f"<title>Astropanth Blog — Vedic Astrology Explained</title>",
       f"<meta name=\"description\" content=\"{esc(desc)}\"><link rel=\"canonical\" href=\"{canonical}\">",
       "<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap\" rel=\"stylesheet\">",
       f"<style>{CSS}</style></head><body><div class=\"wrap\">",
       f"<div class=\"top\"><a class=\"brand\" href=\"/\">{LOGO}<span>Astropanth</span></a><a href=\"/panchang/\">Daily Panchang</a></div>",
       "<h1>Astropanth Blog</h1><p class=\"lead\">Clear, grounded guides to Vedic astrology concepts.</p>"]
    for a in ARTICLES:
        h.append(f'<h2 style="font-size:19px;margin:22px 0 4px"><a href="/blog/{a["slug"]}/">{esc(a["h1"])}</a></h2>')
        h.append(f'<p style="margin:2px 0;color:var(--sec)">{esc(a["desc"])}</p>')
    h.append("<footer><p><a href=\"/\">Astropanth</a> — free Vedic astrology for India.</p></footer></div></body></html>")
    return "".join(h)


def main():
    for a in ARTICLES:
        d=os.path.join(OUT,"blog",a["slug"]); os.makedirs(d,exist_ok=True)
        open(os.path.join(d,"index.html"),"w",encoding="utf-8").write(render(a))
    os.makedirs(os.path.join(OUT,"blog"),exist_ok=True)
    open(os.path.join(OUT,"blog","index.html"),"w",encoding="utf-8").write(hub())
    print(f"Wrote {len(ARTICLES)} articles + blog hub into {OUT}/blog/")


if __name__ == "__main__":
    main()
