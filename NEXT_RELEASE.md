# Next release — carried-over backlog

Items deferred from prior sessions, to pick up in the next app build.

## 1. Localization refactor — instant translation of freshly-composed content

**Problem.** Generated content (predictions, horoscopes, reports, forecasts) is
translated per-string via the server `/api/translate` hook. Newly-composed text
that isn't yet in `translation_cache` shows in English (or lags) until the cache
warms, because each unique string is translated on demand.

**Goal.** Translate at the **template level**, not the composed-string level, so
any freshly-composed content renders in the user's language immediately with no
per-string round-trip.

**Direction (to scope when picked up):**
- Separate the *template skeleton* (fixed phrasing) from the *interpolated values*
  (names, numbers, dates, planet/sign/nakshatra terms).
- Pre-translate the finite set of templates + the finite vocabulary of terms into
  all 6 languages at build time (bundled, like the UI dictionary) so composition =
  fill translated template with translated terms — zero runtime translation.
- Keep the `/api/translate` hook only as a fallback for truly free-form text
  (e.g. AskAstro answers), which is already handled.
- Net effect: instant, offline-capable localized generated content; server
  translate load drops to near-zero.

**Touch points:** `utils/i18nContent.ts`, the report/forecast HTML builders, the
generated-prediction composers, `constants/` term tables, and the bundled i18n dicts.

## 2. Dead-code / cosmetic cleanup (from the last audit)

Low-risk housekeeping flagged during the code audit — no behavior change:
- Remove unused imports, variables, and unreachable branches surfaced by the audit.
- Delete superseded components/styles left over from the Celestial Minimal re-skin
  and the coral→gold / orange→amber color tokenization.
- Collapse duplicated style blocks; tidy any remaining `letterSpacing` leftovers.
- Run `tsc --noEmit` + the lint pass and clear warnings.

**Note:** cosmetic only — schedule alongside a build where regression testing is
already planned, so the cleanup rides existing QA rather than needing its own.

## 3. SEO / growth (web + ASO)

**Highest-leverage: publish daily Panchang as indexable web pages.** Reuses the
Panchang engine + card pipeline already built. One page per day
(`astropanth.com/panchang/YYYY-MM-DD`) = fresh daily content on a very high-volume
query ("aaj ka panchang", "today's tithi", "rashifal"). Include the 5 angas,
sunrise/sunset, Rahu Kalam, and the card image; add schema.org markup.

**Supporting web SEO:**
- Keyword landing pages: Free Kundli, Kundli Matching, Numerology, Panchang — each
  targeting the term directly, with a clear app CTA.
- `hreflang` across all 6 languages so regional searchers get the right-language page.
- schema.org (Article/Event for Panchang, FAQ for Q&A), fast mobile-first load.
- Set up Google Search Console; light blog for long-tail terms
  ("what is Sade Sati", "Ardra nakshatra meaning") to build authority.
- A few quality backlinks over time.

**ASO (Play):** localized listings already done. Focus next on install velocity +
ratings + retention (prompt happy users for reviews) — that's what drives organic rank.

**Paid (optional):** small Google Ads App Campaign to seed install velocity
(India CPI ~₹13–50 for this vertical); Apple Search Ads for iOS. Note: there is no
pay-to-rank *organically* on Play — ads buy placement/installs, not organic position.

**Capacity note (for reference):** server load is light — heavy math runs on-device;
PocketBase/SQLite handles the rest. First bottleneck under load is the Groq API
rate limit (raise via Groq tier), not the droplet. Check exact droplet size next
session to set a firm concurrent-user number.
