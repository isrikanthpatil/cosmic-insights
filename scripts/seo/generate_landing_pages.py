#!/usr/bin/env python3
"""
generate_landing_pages.py — keyword landing pages for the marketing site + a full
sitemap. Brand-styled, text-first, with FAQPage + BreadcrumbList schema, internal
links, and an app CTA. Targets high-volume queries: free kundli / janam kundli,
kundli matching / gun milan, numerology / mulank / bhagyank.

Rebuilds marketing-site/sitemap.xml by scanning ALL .html under marketing-site,
so the panchang pages + these landings + the main pages are always all listed.
"""
import html
import os
import json

SITE = "https://astropanth.com"
APP = "https://app.astropanth.com"
OUT = "marketing-site"

CSS = """
:root{--bg1:#0B0B1A;--bg3:#140F2A;--gold:#E8C87E;--cream:#F4F1E8;--sec:#C7C4D6;--muted:#8B88A0;--amber:#D9A441}
*{box-sizing:border-box}
body{margin:0;background:radial-gradient(1200px 600px at 50% -10%,var(--bg3),var(--bg1)) fixed;color:var(--cream);
font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.65}
a{color:var(--gold);text-decoration:none} a:hover{text-decoration:underline}
.wrap{max-width:760px;margin:0 auto;padding:24px 20px 64px}
.top{display:flex;align-items:center;justify-content:space-between;padding:8px 0 20px}
.brand{display:flex;align-items:center;gap:10px;font-family:'Playfair Display',serif;font-size:20px;color:var(--cream)}
.brand svg{width:26px;height:26px}
.crumb{font-size:13px;color:var(--muted);margin:0 0 8px}
h1{font-family:'Playfair Display',serif;font-weight:700;font-size:32px;line-height:1.2;margin:6px 0 10px}
h2{font-family:'Playfair Display',serif;font-weight:600;font-size:22px;margin:30px 0 8px;color:var(--cream)}
p{margin:10px 0;color:var(--cream)} .lead{font-size:18px;color:var(--sec)}
ul{margin:10px 0;padding-left:22px} li{margin:6px 0;color:var(--cream)}
.cta{display:inline-block;background:linear-gradient(90deg,var(--gold),var(--amber));color:#1a1204;
font-weight:700;border-radius:12px;padding:13px 22px;margin:20px 0;font-size:16px}
.faq{margin-top:14px} .faq h3{font-size:16px;margin:16px 0 4px;color:var(--gold)}
.rel{margin:28px 0 0;padding:16px;border:1px solid rgba(232,200,126,.25);border-radius:14px;background:rgba(255,255,255,.04)}
.rel a{display:inline-block;margin:4px 12px 4px 0}
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


# ---- page content --------------------------------------------------------
PAGES = {
    "kundli": {
        "title": "Free Kundli — Janam Kundli & Birth Chart Online | Astropanth",
        "desc": "Make your free Janam Kundli online — accurate sidereal (Lahiri) birth chart with Lagna, Rashi, Nakshatra, planetary placements and Vimshottari Dasha. In Hindi, Marathi, Kannada, Tamil, Telugu & English.",
        "keywords": "free kundli, janam kundli, kundli online, birth chart, janam patrika, lagna, rashi, nakshatra, vimshottari dasha, vedic astrology",
        "h1": "Free Kundli (Janam Kundli)",
        "crumb": "Home › Free Kundli",
        "lead": "Your Janam Kundli is your Vedic birth chart — a map of the sky at the moment you were born. Astropanth builds it from precise <strong>sidereal (Lahiri)</strong> positions, not Western tropical signs, so it reflects genuine Jyotish.",
        "sections": [
            ("What your Kundli shows", "From your date, time and place of birth, Astropanth computes:",
             ["Lagna (Ascendant) and the 12 houses — the frame of your chart",
              "Moon sign (Rashi) and Nakshatra with pada — the heart of Vedic reading",
              "Planetary placements by rashi and house",
              "Vimshottari Dasha timeline (Mahadasha / Antardasha)",
              "Yogas, Sade Sati and remedial guidance"]),
            ("Accurate, not guesswork", "Astropanth uses a self-hosted sidereal engine with the Lahiri ayanamsa and real ephemeris positions — the same calculations professional astrologers rely on. Give your exact birth time for the Ascendant; without it you still get an accurate Moon-based reading."),
            ("In your language", "The whole app and your readings are available in Hindi, Marathi, Kannada, Tamil, Telugu and English."),
        ],
        "faqs": [
            ("What is a Janam Kundli?", "A Janam Kundli (birth chart / janam patrika) is a chart of the planets' sidereal positions at your birth time and place, used in Vedic astrology to read personality, timing and compatibility."),
            ("Do I need my exact birth time?", "Birth time gives you the Ascendant (Lagna) and house placements for the most precise reading. Without it, Astropanth still gives an accurate Moon-sign and Nakshatra reading."),
            ("Is it free?", "Yes — creating your Kundli and reading your core chart on Astropanth is free."),
            ("Which ayanamsa do you use?", "Lahiri (Chitrapaksha), the standard sidereal ayanamsa used across India."),
        ],
        "cta": "Create your free Kundli",
    },
    "kundli-matching": {
        "title": "Kundli Matching — Gun Milan & Ashtakoota Compatibility | Astropanth",
        "desc": "Free Kundli matching by Ashtakoota Gun Milan — 36 gunas across 8 kootas, with Manglik (Mangal Dosha) check. Accurate sidereal compatibility for marriage, in 6 Indian languages.",
        "keywords": "kundli matching, gun milan, ashtakoota, 36 gunas, horoscope matching, marriage matching, manglik, mangal dosha, nadi dosha, bhakoot",
        "h1": "Kundli Matching (Gun Milan)",
        "crumb": "Home › Kundli Matching",
        "lead": "Astropanth matches two charts using <strong>Ashtakoota Gun Milan</strong> — the classical 36-guna system — and flags Manglik (Mangal Dosha), so you get a clear, authentic compatibility picture.",
        "sections": [
            ("The 8 Kootas & 36 Gunas", "Compatibility is scored across eight kootas, totalling 36 points:",
             ["Varna (1), Vashya (2), Tara (3), Yoni (4)",
              "Graha Maitri (5), Gana (6), Bhakoot (7), Nadi (8)",
              "A higher total indicates stronger natural compatibility"]),
            ("Manglik / Mangal Dosha", "Astropanth checks Mangal Dosha for both charts and explains whether it applies, is cancelled, or is mutual — a key factor in traditional matching."),
            ("What a good score means", "Broadly, 18+ of 36 is considered acceptable and 24+ very good, but Nadi and Bhakoot doshas matter beyond the raw number. Astropanth shows the koota-by-koota breakdown so you understand the score, not just the total."),
        ],
        "faqs": [
            ("How many gunas are needed for marriage?", "Traditionally 18 out of 36 or more is considered a match, with 24+ regarded as very good — but individual doshas (especially Nadi and Bhakoot) are weighed too."),
            ("Do you check Manglik / Mangal Dosha?", "Yes. Astropanth evaluates Mangal Dosha for both partners and whether it is cancelled or mutual."),
            ("What is Nadi dosha?", "Nadi is the highest-weighted koota (8 points). Same Nadi for both partners is considered a dosha and is examined carefully in matching."),
            ("Is Kundli matching free?", "Yes — Gun Milan matching on Astropanth is free."),
        ],
        "cta": "Match two Kundlis free",
    },
    "numerology": {
        "title": "Free Numerology — Mulank, Bhagyank & Lo Shu Grid | Astropanth",
        "desc": "Free numerology reading — Birth number (Mulank), Destiny number (Bhagyank), Name number, Kua number and Lo Shu grid, with practical remedies. In Hindi, Marathi, Kannada, Tamil, Telugu & English.",
        "keywords": "numerology, mulank, bhagyank, birth number, destiny number, name number, lo shu grid, kua number, numerology calculator",
        "h1": "Numerology",
        "crumb": "Home › Numerology",
        "lead": "Astropanth decodes your numbers — <strong>Mulank</strong> (birth number), <strong>Bhagyank</strong> (destiny number), Name number and Kua number — with a Lo Shu grid and clear, practical remedies.",
        "sections": [
            ("Your core numbers", "From your name and date of birth:",
             ["Mulank (Birth number) — your day-of-birth root, your core nature",
              "Bhagyank (Destiny number) — the sum of your full birth date",
              "Name number — the vibration of how you're known",
              "Kua number — your favourable directions (Feng Shui tradition)"]),
            ("Lo Shu grid", "Your birth digits are placed on the 3×3 Lo Shu grid to reveal strong and missing numbers — the planes of thought, will and action — and what they say about your temperament."),
            ("Remedies", "Each reading pairs your numbers with grounded, non-superstitious suggestions you can actually use."),
        ],
        "faqs": [
            ("What is Mulank and Bhagyank?", "Mulank (birth number) is derived from your date of birth's day; Bhagyank (destiny number) is the reduced sum of your complete date of birth. Together they describe core nature and life direction."),
            ("What is a name number?", "The name number reduces the letters of your name to a single digit, reflecting how you are perceived and express yourself."),
            ("Is numerology free on Astropanth?", "Yes — your core numerology reading is free."),
        ],
        "cta": "Get your free numerology",
    },
}

RELATED = [
    ("/kundli/", "Free Kundli"),
    ("/kundli-matching/", "Kundli Matching"),
    ("/numerology/", "Numerology"),
    ("/panchang/", "Daily Panchang"),
    ("/blog/", "Blog"),
]

LANDING_SLUGS = ["kundli", "kundli-matching", "numerology"]
UILABELS = {
    "en": {"explore": "Explore more:", "panchang": "Daily Panchang",
           "footer": "Astropanth — free Vedic astrology, Kundli, Panchang & Numerology for India, in 6 languages.",
           "priv": "Privacy", "terms": "Terms", "faq": "FAQ"},
    "hi": {"explore": "और देखें:", "panchang": "दैनिक पंचांग",
           "footer": "Astropanth — भारत के लिए मुफ्त वैदिक ज्योतिष, कुंडली, पंचांग और अंक ज्योतिष, 6 भाषाओं में।",
           "priv": "गोपनीयता", "terms": "शर्तें", "faq": "अक्सर पूछे जाने वाले प्रश्न"},
}
RELATED_LABELS = {
    "en": {"kundli": "Free Kundli", "kundli-matching": "Kundli Matching", "numerology": "Numerology", "panchang": "Daily Panchang", "blog": "Blog"},
    "hi": {"kundli": "मुफ्त कुंडली", "kundli-matching": "कुंडली मिलान", "numerology": "अंक ज्योतिष", "panchang": "दैनिक पंचांग", "blog": "ब्लॉग"},
}


def loc_path(lang, path):
    """Localized landing slugs get a /{lang} prefix; panchang/blog stay English."""
    if lang == "en":
        return path
    slug = path.strip("/")
    return f"/{lang}/{slug}/" if slug in LANDING_SLUGS else path


# Localized page content. Structure mirrors PAGES. English is PAGES.
L10N = {
 "hi": {
  "kundli": {
    "title": "मुफ्त कुंडली — जन्म कुंडली और बर्थ चार्ट ऑनलाइन | Astropanth",
    "desc": "अपनी मुफ्त जन्म कुंडली ऑनलाइन बनाएं — सटीक सायडरियल (लाहिरी) बर्थ चार्ट, लग्न, राशि, नक्षत्र, ग्रह स्थिति और विंशोत्तरी दशा के साथ। हिंदी, मराठी, कन्नड़, तमिल, तेलुगु और अंग्रेज़ी में।",
    "keywords": "मुफ्त कुंडली, जन्म कुंडली, कुंडली ऑनलाइन, बर्थ चार्ट, जन्म पत्रिका, लग्न, राशि, नक्षत्र, विंशोत्तरी दशा, वैदिक ज्योतिष, free kundli, janam kundli",
    "h1": "मुफ्त कुंडली (जन्म कुंडली)", "crumb": "होम › मुफ्त कुंडली",
    "lead": "आपकी जन्म कुंडली आपका वैदिक बर्थ चार्ट है — आपके जन्म के समय आकाश का नक्शा। Astropanth इसे सटीक <strong>सायडरियल (लाहिरी)</strong> ग्रह स्थितियों से बनाता है, पश्चिमी ट्रॉपिकल राशियों से नहीं — इसलिए यह असली ज्योतिष दर्शाता है।",
    "sections": [
      ("आपकी कुंडली क्या दिखाती है", "आपकी जन्म तिथि, समय और स्थान से Astropanth निकालता है:",
       ["लग्न (Ascendant) और 12 भाव — आपकी कुंडली का ढाँचा",
        "चंद्र राशि और नक्षत्र (पद सहित) — वैदिक पठन का केंद्र",
        "राशि और भाव अनुसार ग्रह स्थिति",
        "विंशोत्तरी दशा समयरेखा (महादशा / अंतर्दशा)",
        "योग, साढ़े साती और उपाय मार्गदर्शन"]),
      ("अनुमान नहीं, सटीक गणना", "Astropanth लाहिरी अयनांश और वास्तविक ग्रह-गणित वाले सायडरियल इंजन का उपयोग करता है — वही गणनाएँ जिन पर पेशेवर ज्योतिषी भरोसा करते हैं। लग्न के लिए अपना सटीक जन्म समय दें; समय न होने पर भी आपको सटीक चंद्र-आधारित पठन मिलता है।"),
      ("आपकी भाषा में", "पूरा ऐप और आपकी रीडिंग हिंदी, मराठी, कन्नड़, तमिल, तेलुगु और अंग्रेज़ी में उपलब्ध हैं।"),
    ],
    "faqs": [
      ("जन्म कुंडली क्या है?", "जन्म कुंडली (बर्थ चार्ट / जन्म पत्रिका) आपके जन्म के समय और स्थान पर ग्रहों की सायडरियल स्थितियों का चार्ट है, जिसका उपयोग वैदिक ज्योतिष में स्वभाव, समय और अनुकूलता पढ़ने के लिए किया जाता है।"),
      ("क्या मुझे सटीक जन्म समय चाहिए?", "जन्म समय से आपको लग्न और भाव स्थिति मिलती है, जिससे सबसे सटीक पठन होता है। समय के बिना भी Astropanth सटीक चंद्र-राशि और नक्षत्र पठन देता है।"),
      ("क्या यह मुफ्त है?", "हाँ — Astropanth पर अपनी कुंडली बनाना और अपना मूल चार्ट पढ़ना मुफ्त है।"),
      ("आप कौन-सा अयनांश उपयोग करते हैं?", "लाहिरी (चित्रपक्ष), पूरे भारत में उपयोग होने वाला मानक सायडरियल अयनांश।"),
    ],
    "cta": "अपनी मुफ्त कुंडली बनाएं",
  },
  "kundli-matching": {
    "title": "कुंडली मिलान — गुण मिलान और अष्टकूट अनुकूलता | Astropanth",
    "desc": "मुफ्त कुंडली मिलान अष्टकूट गुण मिलान द्वारा — 8 कूटों में 36 गुण, मंगल दोष (मांगलिक) जाँच के साथ। विवाह के लिए सटीक सायडरियल अनुकूलता, 6 भारतीय भाषाओं में।",
    "keywords": "कुंडली मिलान, गुण मिलान, अष्टकूट, 36 गुण, विवाह मिलान, मांगलिक, मंगल दोष, नाड़ी दोष, भकूट, kundli matching, gun milan",
    "h1": "कुंडली मिलान (गुण मिलान)", "crumb": "होम › कुंडली मिलान",
    "lead": "Astropanth दो कुंडलियों का मिलान <strong>अष्टकूट गुण मिलान</strong> — शास्त्रीय 36-गुण प्रणाली — से करता है और मंगल दोष (मांगलिक) की जाँच करता है, जिससे आपको स्पष्ट, प्रामाणिक अनुकूलता चित्र मिलता है।",
    "sections": [
      ("8 कूट और 36 गुण", "अनुकूलता आठ कूटों में मापी जाती है, कुल 36 अंक:",
       ["वर्ण (1), वश्य (2), तारा (3), योनि (4)",
        "ग्रह मैत्री (5), गण (6), भकूट (7), नाड़ी (8)",
        "अधिक कुल अंक मजबूत स्वाभाविक अनुकूलता दर्शाते हैं"]),
      ("मांगलिक / मंगल दोष", "Astropanth दोनों कुंडलियों के लिए मंगल दोष जाँचता है और बताता है कि यह लागू है, रद्द है, या दोनों में है — पारंपरिक मिलान का एक मुख्य कारक।"),
      ("अच्छा स्कोर क्या है", "मोटे तौर पर, 36 में से 18+ स्वीकार्य और 24+ बहुत अच्छा माना जाता है, पर नाड़ी और भकूट दोष केवल अंक से अधिक मायने रखते हैं। Astropanth कूट-दर-कूट विवरण दिखाता है ताकि आप केवल कुल नहीं, स्कोर को समझें।"),
    ],
    "faqs": [
      ("विवाह के लिए कितने गुण चाहिए?", "पारंपरिक रूप से 36 में से 18+ को मिलान माना जाता है, 24+ बहुत अच्छा — पर नाड़ी और भकूट जैसे दोष भी तौले जाते हैं।"),
      ("क्या आप मांगलिक / मंगल दोष जाँचते हैं?", "हाँ। Astropanth दोनों साथियों के लिए मंगल दोष का मूल्यांकन करता है और यह रद्द है या दोनों में, यह बताता है।"),
      ("नाड़ी दोष क्या है?", "नाड़ी सबसे अधिक अंक (8) वाला कूट है। दोनों साथियों की समान नाड़ी दोष मानी जाती है और मिलान में इसकी सावधानी से जाँच होती है।"),
      ("क्या कुंडली मिलान मुफ्त है?", "हाँ — Astropanth पर गुण मिलान मुफ्त है।"),
    ],
    "cta": "दो कुंडलियों का मुफ्त मिलान करें",
  },
  "numerology": {
    "title": "मुफ्त अंक ज्योतिष — मूलांक, भाग्यांक और लो शू ग्रिड | Astropanth",
    "desc": "मुफ्त अंक ज्योतिष रीडिंग — मूलांक, भाग्यांक, नाम अंक, कुआ अंक और लो शू ग्रिड, व्यावहारिक उपायों के साथ। हिंदी, मराठी, कन्नड़, तमिल, तेलुगु और अंग्रेज़ी में।",
    "keywords": "अंक ज्योतिष, मूलांक, भाग्यांक, नाम अंक, लो शू ग्रिड, कुआ अंक, न्यूमरोलॉजी, numerology, mulank, bhagyank",
    "h1": "अंक ज्योतिष (न्यूमरोलॉजी)", "crumb": "होम › अंक ज्योतिष",
    "lead": "Astropanth आपके अंकों को समझाता है — <strong>मूलांक</strong> (जन्म अंक), <strong>भाग्यांक</strong> (भाग्य अंक), नाम अंक और कुआ अंक — लो शू ग्रिड और स्पष्ट, व्यावहारिक उपायों के साथ।",
    "sections": [
      ("आपके मुख्य अंक", "आपके नाम और जन्म तिथि से:",
       ["मूलांक (जन्म अंक) — आपके जन्म दिन का मूल, आपका स्वभाव",
        "भाग्यांक (भाग्य अंक) — आपकी पूरी जन्म तिथि का योग",
        "नाम अंक — आप जिस रूप में जाने जाते हैं उसकी ऊर्जा",
        "कुआ अंक — आपकी शुभ दिशाएँ (फेंग शुई परंपरा)"]),
      ("लो शू ग्रिड", "आपके जन्म अंकों को 3×3 लो शू ग्रिड पर रखा जाता है जिससे मजबूत और अनुपस्थित अंक — विचार, इच्छा और क्रिया के तल — और आपके स्वभाव के बारे में पता चलता है।"),
      ("उपाय", "प्रत्येक रीडिंग आपके अंकों को व्यावहारिक, अंधविश्वास-रहित सुझावों के साथ जोड़ती है जिन्हें आप वास्तव में उपयोग कर सकते हैं।"),
    ],
    "faqs": [
      ("मूलांक और भाग्यांक क्या हैं?", "मूलांक (जन्म अंक) आपकी जन्म तिथि के दिन से निकाला जाता है; भाग्यांक (भाग्य अंक) आपकी पूरी जन्म तिथि का घटाया हुआ योग है। साथ मिलकर ये मूल स्वभाव और जीवन दिशा बताते हैं।"),
      ("नाम अंक क्या है?", "नाम अंक आपके नाम के अक्षरों को एक अंक में घटाता है, जो दर्शाता है कि आपको कैसे देखा जाता है और आप स्वयं को कैसे व्यक्त करते हैं।"),
      ("क्या Astropanth पर अंक ज्योतिष मुफ्त है?", "हाँ — आपकी मूल अंक ज्योतिष रीडिंग मुफ्त है।"),
    ],
    "cta": "अपना मुफ्त अंक ज्योतिष पाएं",
  },
 },
}


def render(slug, d, lang="en", alt_langs=("en",)):
    prefix = "" if lang == "en" else f"/{lang}"
    canonical = f"{SITE}{prefix}/{slug}/"
    ui = UILABELS[lang]
    rl = RELATED_LABELS[lang]
    faq_ld = {"@context": "https://schema.org", "@type": "FAQPage",
              "mainEntity": [{"@type": "Question", "name": q,
                              "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in d["faqs"]]}
    crumb_ld = {"@context": "https://schema.org", "@type": "BreadcrumbList",
                "itemListElement": [
                    {"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"},
                    {"@type": "ListItem", "position": 2, "name": d["h1"], "item": canonical}]}
    # Brand-entity schema — helps Google associate the site with the "Astropanth"
    # entity (aids branded-search recognition). sameAs = authoritative references
    # to the same brand; add social profile URLs here as they're created.
    org_ld = {"@context": "https://schema.org", "@type": "Organization",
              "name": "Astropanth", "url": SITE + "/",
              "logo": SITE + "/assets/icon-512.png",
              "sameAs": [
                  "https://play.google.com/store/apps/details?id=com.astropanth.cosmicinsights",
                  APP + "/",
              ]}
    website_ld = {"@context": "https://schema.org", "@type": "WebSite",
                  "name": "Astropanth", "url": SITE + "/"}
    h = []
    h.append(f"<!doctype html><html lang=\"{lang}\"><head><meta charset=\"utf-8\">")
    h.append("<meta name=\"viewport\" content=\"width=device-width, initial-scale=1\">")
    h.append(f"<title>{esc(d['title'])}</title>")
    h.append(f"<meta name=\"description\" content=\"{esc(d['desc'])}\">")
    h.append(f"<meta name=\"keywords\" content=\"{esc(d['keywords'])}\">")
    h.append(f"<link rel=\"canonical\" href=\"{canonical}\">")
    for l in alt_langs:
        href = f"{SITE}{'' if l == 'en' else '/' + l}/{slug}/"
        h.append(f"<link rel=\"alternate\" hreflang=\"{l}\" href=\"{href}\">")
    h.append(f"<link rel=\"alternate\" hreflang=\"x-default\" href=\"{SITE}/{slug}/\">")
    h.append(f"<meta property=\"og:title\" content=\"{esc(d['title'])}\">")
    h.append(f"<meta property=\"og:description\" content=\"{esc(d['desc'])}\">")
    h.append(f"<meta property=\"og:type\" content=\"website\"><meta property=\"og:url\" content=\"{canonical}\">")
    h.append("<link rel=\"preconnect\" href=\"https://fonts.googleapis.com\"><link rel=\"preconnect\" href=\"https://fonts.gstatic.com\" crossorigin>")
    h.append("<link href=\"https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:wght@600;700&display=swap\" rel=\"stylesheet\">")
    h.append(f"<style>{CSS}</style>")
    h.append(f"<script type=\"application/ld+json\">{json.dumps(faq_ld, ensure_ascii=False)}</script>")
    h.append(f"<script type=\"application/ld+json\">{json.dumps(crumb_ld, ensure_ascii=False)}</script>")
    if lang == "en" and slug == "kundli":
        # Emit the brand-entity schema once (on the top English landing page) to
        # avoid duplicating the same Organization block across every URL.
        h.append(f"<script type=\"application/ld+json\">{json.dumps(org_ld, ensure_ascii=False)}</script>")
        h.append(f"<script type=\"application/ld+json\">{json.dumps(website_ld, ensure_ascii=False)}</script>")
    h.append("</head><body><div class=\"wrap\">")
    h.append(f"<div class=\"top\"><a class=\"brand\" href=\"/\">{LOGO}<span>Astropanth</span></a><a href=\"/panchang/\">{esc(ui['panchang'])}</a></div>")
    h.append(f"<p class=\"crumb\">{esc(d['crumb'])}</p>")
    h.append(f"<h1>{esc(d['h1'])}</h1>")
    h.append(f"<p class=\"lead\">{d['lead']}</p>")
    h.append(f"<a class=\"cta\" href=\"{APP}\">{esc(d['cta'])} →</a>")
    for sec in d["sections"]:
        h.append(f"<h2>{esc(sec[0])}</h2><p>{sec[1]}</p>")
        if len(sec) > 2:
            h.append("<ul>" + "".join(f"<li>{esc(li)}</li>" for li in sec[2]) + "</ul>")
    h.append(f"<div class=\"faq\"><h2>{esc(ui['faq'])}</h2>")
    for q, a in d["faqs"]:
        h.append(f"<h3>{esc(q)}</h3><p>{esc(a)}</p>")
    h.append("</div>")
    rel = "".join(f'<a href="{loc_path(lang, u)}">{esc(rl[u.strip("/")])}</a>'
                  for u, _t in RELATED if u.strip('/') != slug)
    h.append(f"<div class=\"rel\"><strong>{esc(ui['explore'])}</strong><br>{rel}</div>")
    h.append(f"<a class=\"cta\" href=\"{APP}\">{esc(d['cta'])} →</a>")
    h.append(f"<footer><p><a href=\"/\">{esc(ui['footer'])}</a></p>")
    h.append(f"<p><a href=\"/privacy/\">{esc(ui['priv'])}</a> · <a href=\"/terms/\">{esc(ui['terms'])}</a></p></footer>")
    h.append("</div></body></html>")
    return "".join(h)


def build_sitemap():
    urls = []
    for root, _dirs, files in os.walk(OUT):
        for f in files:
            if not f.endswith(".html"):
                continue
            rel = os.path.relpath(os.path.join(root, f), OUT)
            if rel.endswith("index.html"):
                loc = "/" + rel[:-len("index.html")]
            else:
                loc = "/" + rel
            urls.append(loc.replace("\\", "/"))
    urls = sorted(set(urls))
    items = []
    for u in urls:
        lm = ""
        base = u.rsplit("/", 1)[-1]
        if base[:2] == "20" and base.endswith(".html"):   # panchang date pages
            lm = f"<lastmod>{base[:-5]}</lastmod>"
        items.append(f"<url><loc>{SITE}{u}</loc>{lm}</url>")
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + "".join(items) + "</urlset>", len(urls)


def main():
    total = 0
    for slug in PAGES:
        avail = ["en"] + [l for l in L10N if slug in L10N[l]]
        # English (root)
        os.makedirs(os.path.join(OUT, slug), exist_ok=True)
        open(os.path.join(OUT, slug, "index.html"), "w", encoding="utf-8").write(render(slug, PAGES[slug], "en", avail))
        total += 1
        # Localized (/lang/slug/)
        for l in L10N:
            if slug in L10N[l]:
                d = os.path.join(OUT, l, slug)
                os.makedirs(d, exist_ok=True)
                open(os.path.join(d, "index.html"), "w", encoding="utf-8").write(render(slug, L10N[l][slug], l, avail))
                total += 1
    sm, n = build_sitemap()
    open(os.path.join(OUT, "sitemap.xml"), "w", encoding="utf-8").write(sm)
    print(f"Wrote {total} landing pages (en + {list(L10N)}); sitemap now lists {n} URLs")


if __name__ == "__main__":
    main()
