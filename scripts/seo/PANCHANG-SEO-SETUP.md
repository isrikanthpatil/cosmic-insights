# Daily Panchang SEO pages — setup

Indexable, brand-styled web pages for every day's Panchang, targeting high-volume
searches ("aaj ka panchang", "today's tithi", "<date> panchang", "rahu kalam
today"). Reuses the same Panchang engine + cards as the Instagram auto-poster.

What's generated (into `marketing-site/`):
- `panchang/<YYYY-MM-DD>.html` — one text-first page per day (5 Sep 2026 → 5 Sep 2027).
  Visible content = Tithi, Nakshatra, Yoga, Karana, Vara, Sunrise, Sunset, Rahu
  Kalam (real HTML text, so it's indexed), plus schema.org Article JSON-LD,
  prev/next day links, the daily card as og:image, and an app CTA.
- `panchang/index.html` — the hub: a month-by-month archive + a "Today's Panchang"
  button that JS points at the current IST date.
- `sitemap.xml` — all 366 day pages + the main pages.
- `robots.txt` — points crawlers at the sitemap.
- `social/panchang/<date>.png` — the card images the pages reference.
- A "Daily Panchang" link was added to the site footer for crawlability.

## Regenerate (only if the date window or engine changes)

```bash
# 1) refresh the data (from the Astro-main repo)
cd /tmp && node <astro>/scripts/social/... # (the batch harness that writes panchang-data.json)
# 2) build the pages
python3 Astro-main/scripts/seo/generate_panchang_pages.py \
    --data /tmp/eng/panchang-data.json --out marketing-site
```
(The data + cards are the same ones the Instagram poster uses; regenerate both
together once a year.)

## Deploy

Publish the marketing site the usual way (Netlify). Make sure these are included:
`panchang/`, `sitemap.xml`, `robots.txt`, and `social/panchang/*.png`.

Then in **Google Search Console**: add the property (if not already), and submit
`https://astropanth.com/sitemap.xml`. Indexing of 366 fresh, structured pages
usually starts within days and compounds over weeks.

## Notes
- Pages are static; "today" is resolved client-side, so the hub's Today button
  always points at the right date without rebuilds.
- Values are the same verified-accurate sidereal figures shown in the app and on
  Instagram — consistent across every surface.
- Runway matches the card batch (through 5 Sep 2027); regenerate before then.
