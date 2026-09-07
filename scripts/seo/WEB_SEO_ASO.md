# Web SEO + ASO — status

## Done (this pass)
- **Keyword landing pages** (brand-styled, text-first, unique content):
  - `/kundli/` — free kundli / janam kundli / birth chart
  - `/kundli-matching/` — gun milan / ashtakoota / 36 gunas / manglik
  - `/numerology/` — mulank / bhagyank / name number / Lo Shu grid
  Each has a targeted title/description/keywords, H1, explanatory sections,
  **FAQPage + BreadcrumbList** schema, internal "Explore more" links, and app CTAs.
- **Homepage structured data** — Organization + WebSite + SoftwareApplication (the
  Android app, free, in 6 languages).
- **Internal linking** — homepage footer now links all four SEO pages; each landing
  cross-links the others + Panchang.
- **Sitemap** rebuilt by scanning the whole site (`generate_landing_pages.py` →
  `sitemap.xml`, 376 URLs: landings + 366 Panchang + main pages).

Regenerate: `python3 Astro-main/scripts/seo/generate_landing_pages.py` (also rebuilds
the sitemap). Panchang pages: `generate_panchang_pages.py`.

## Deploy
Re-upload `marketing-site` to Netlify. The sitemap is already submitted in Search
Console, so Google re-fetches it; use URL Inspection → Request Indexing on
`/kundli/`, `/kundli-matching/`, `/numerology/` to prime them.

## Next layer (not done)
- **hreflang / localized landing pages.** The landings are English only. To rank for
  Hindi/regional queries ("मुफ्त कुंडली", "कुंडली मिलान"), generate translated
  versions per language and add `hreflang` alternates. This is a content effort —
  worth doing once the English pages show traction. The generator is structured so a
  `lang` layer can be added (translate the PAGES dict, emit `/hi/kundli/` etc.).
- **Blog / long-tail** — short explainer posts ("what is Sade Sati", "Ardra nakshatra
  meaning") for long-tail capture and authority.
- **A few backlinks** — directory listings, an app-launch post.

## ASO (Play listing) — status
Localized store listings (title/short/full) in 5 languages are already done. The
remaining ASO levers are non-code: prompt happy users for **ratings/reviews** and
keep **install velocity** up (the daily Panchang social + these pages feed that).
