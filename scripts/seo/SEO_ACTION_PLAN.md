# Why astropanth.com isn't ranking — diagnosis & action plan

_Checked live on 2026-09-06._

## The short answer

**Nothing is technically broken. The site is simply new, has almost no
backlinks/authority, and Google hasn't finished indexing it yet.** A branded
search ("kundli matching astropanth") returns nothing because for a brand-new
domain with near-zero external links, Google often *crawls but doesn't yet index*
— and ranks nothing until the domain earns some trust. This is expected at this
stage, not a bug.

## What I verified (all healthy)

- **robots.txt** — `Allow: /`, sitemap referenced. Not blocking anything. ✓
- **sitemap.xml** — present and valid; lists home, the 4 landing pages, ~365
  daily Panchang pages, and legal pages. ✓
- **Landing pages** — good `<title>`, meta description, canonical, FAQ +
  Breadcrumb JSON-LD, clean semantic HTML, real content. **No `noindex`.** ✓
- **Homepage** — static, server-rendered HTML (not a JS shell), strong meta,
  `google-site-verification` tag present (Search Console is connected). ✓

So the pages are crawlable and well-optimized on-page. The gap is **authority +
indexing + content breadth**, not technical health.

## The real causes (in priority order)

1. **New domain, not yet indexed.** `site:astropanth.com` = 0 results. Google
   hasn't added the pages to its index. New sites routinely sit in
   "Discovered/Crawled – currently not indexed" for weeks.
2. **No backlinks / brand signals.** Nothing on the web links to the domain, so
   Google has little reason to crawl often or trust it. This is the single
   biggest lever right now.
3. **The best content isn't even deployed.** The 5 blog explainers and the Hindi
   landing pages are built but **not on the live sitemap** — they haven't been
   uploaded to Netlify yet. More indexable, long-tail pages = more entry points.
4. **Competitive head terms are a long game.** "kundli matching", "kundli" etc.
   are owned by AstroSage, Prokerala, AstroTalk — 10–15 yr domains with millions
   of backlinks. You will not rank there for months, and only with real authority.

## Do these now (highest impact first)

### A. Force indexing — Google Search Console (you; ~20 min)
1. Confirm the property is verified (the meta tag is already on the site).
2. **Sitemaps → submit** `https://astropanth.com/sitemap.xml` (do it even if done
   before — resubmit after each deploy).
3. **URL Inspection** → paste each core URL → **Request Indexing**, one by one:
   `/`, `/kundli/`, `/kundli-matching/`, `/numerology/`, `/panchang/`,
   `/pricing/`. (Manual request is the fastest nudge for a new site.)
4. Check **Indexing → Pages** in a few days: see how many are indexed and the
   reason for any excluded ("Crawled – currently not indexed" is normal early;
   just keep requesting + building links).

### B. Deploy the content that already exists (you; the pending Netlify upload)
- Re-upload `marketing-site/` so the **blog** (`/blog/…`) and **Hindi landing
  pages** (`/hi/…`) go live, then **resubmit the sitemap**. This roughly doubles
  your indexable, keyword-targeted surface for free. (Already in PENDING_DEPLOYS.)

### C. Build the first backlinks / brand signals (you; ongoing — the real fix)
- **Play Store listing** → set the **Website** field to astropanth.com (a
  high-authority link, and it ties the app entity to the domain).
- Create and link **brand social profiles** (Instagram, YouTube, X, a Facebook
  Page, LinkedIn) — consistent name "Astropanth", each linking the site. Add
  those URLs to the Organization `sameAs` (see code change below).
- List in a few **free directories / app aggregators** (e.g. relevant Indian
  startup / app listing sites) — even a handful of clean links kick-starts trust.
- Post the blog explainers to your socials and any communities you're part of.
- A **Google Business Profile** if you have any physical/service presence.

### D. Deepen content (me, in the generators; ships next site build)
- **Done:** added **Organization + WebSite JSON-LD** (with `sameAs`) to the
  landing generator so Google can form the "Astropanth" brand entity — add your
  social URLs to the `sameAs` list in `generate_landing_pages.py` as you create
  them.
- **Next (optional):** the landing pages are decent but shorter than
  competitors'. Expanding each to 800–1,200 words (worked examples, more FAQs,
  tables) and interlinking blog ↔ landing pages will help once indexed.

## Realistic timeline

- **Branded "astropanth" search:** should start showing within **days–2 weeks**
  of requesting indexing + a few links. If nothing is indexed after ~2 weeks,
  recheck GSC Pages for a specific exclusion reason.
- **Long-tail** ("kundli matching in marathi", "sade sati calculator", specific
  Panchang dates): **1–3 months** with steady indexing + a few links.
- **Head terms** ("kundli matching", "kundli"): **6–12+ months** and only with
  real backlink authority — treat as a long game, not a near-term target.

## What NOT to waste effort on
- More on-page meta tweaks — on-page is already fine.
- Chasing head terms directly — win branded + long-tail + language niches first.
- Keyword-stuffing — content quality + links move the needle now, not density.
