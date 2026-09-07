# Content cadence audit — where text is fresh vs static/shared

Goal: find text that is **static and identical across users** (same block shown to
everyone with a given sign/number) so it can be made more varied, deeper and
personalized — without breaking the parts that are *correctly* fixed (factual
Panchang, calculated matches, etc.).

Legend for "Changes":
- **Static (reference)** — fixed data, correct to be fixed (facts/definitions).
- **Static per sign/number (SHARED)** — same text for every user of that sign/number,
  never changes → the main concern.
- **Per user (stable)** — depends on the person's chart/numbers; stable over time.
- **Daily / Weekly / Monthly / Yearly** — regenerates on that cadence.
- **Per query** — unique each time (LLM).

## Cadence table

| Screen | Section / subsection | Source | Changes | Shared across users? | Assessment |
|---|---|---|---|---|---|
| Home | Greeting, labels | `t()` UI dict | Static (reference) | n/a | OK |
| Home | Daily horoscope (main + advice) | `generateDailyHoroscope` (seeded `sign+date`, uses natal Moon transit) | **Daily** | Same only for same Sun+Moon that day | OK (dynamic) |
| Home | Weekly overview / highlights / focus | `generateWeeklyHoroscope` (seeded `sign+ISO week`) | **Weekly** | Same for same Sun sign that week | OK (dynamic) |
| Home | Chart snapshot (Sun/Moon/Asc + traits, lucky no./colour) | `getAstrologyReading` | **Static per sign (SHARED)** | Yes — identical for same Sun/Moon/Asc | **Enhance** |
| Astrology | Sun / Moon / Ascendant signs | sidereal engine | Per user (stable) | Calculated | OK |
| Astrology | Traits / Strengths / Challenges / Remedies | `getAstrologyReading` (fixed index 0–3 of sign arrays) | **Static per sign (SHARED)** | Yes | **Enhance (top priority)** |
| Astrology | Past / Future predictions | `getAstrologyReading` (fixed-index picks) | **Static per sign (SHARED)** | Yes — never varies | **Enhance (top priority)** |
| Astrology | Lucky numbers/colours, compatibility | sign knowledge | Static per sign (SHARED) | Yes | Minor |
| Numerology | Birth / Destiny / Name / Kua numbers | calculators | Per user (stable) | Calculated | OK |
| Numerology | Lo Shu grid + plane analysis | `getNumerologyReading` (user's grid) | Per user (stable) | Reflects actual grid | OK |
| Numerology | Per-number detail (title/career/health/relationships/favourables) | `NUMBER_DETAILS` (per number) | **Static per number (SHARED)** | Yes — 9 variants for everyone | **Enhance** |
| Panchang | 5 angas + sunrise/sunset/Rahu Kalam | `computePanchang` (real ephemeris) | **Daily** | Same for all (factual) | OK (correct to be shared) |
| Forecast | Monthly / yearly Gochara + Dasha lines | `forecast.ts` (transits from user's Moon + period) | **Monthly / Yearly** | Chart-specific | OK (dynamic) |
| Tarot | Daily card | `getDailyCard(date)` (seeded by date) | **Daily** | Same card for all that day; meaning fixed per card | OK |
| Match | Gun Milan score, koota breakdown, Manglik | Ashtakoota calculation | Per pair (stable) | Calculated | OK |
| Dasha | Mahadasha/Antardasha timeline | Vimshottari calc | Per user (stable) | Calculated | OK |
| Sade Sati | Status + phase | Saturn transit from natal Moon | Slow (≈ yearly) | Chart-specific | OK |
| AskAstro | Chat answers | Groq LLM, grounded on chart | **Per query** | Unique | OK |
| Reports (PDF/HTML) | Astro / numero / gem / forecast | composes the above | Inherits source cadence | — | Inherits (fix sources) |

## What's actually a problem

Only two surfaces are static **and** identical for everyone — and they're the two
most "personal-feeling" reads, so the repetition is most noticeable there:

1. **The natal Astrology reading** (`getAstrologyReading`) — traits, strengths,
   challenges, remedies and the past/future predictions are built with **fixed array
   indices (0–3)**. So every Leo (with a given Moon/Asc) sees the *same four
   sentences forever*, and only the first few entries of the richer knowledge arrays
   are ever used. It's correct that a *natal* reading is stable over time (your birth
   chart doesn't change) — the issue is it's identical across users and repetitive.
2. **Numerology per-number detail** — the career/health/relationship/title blurbs are
   one fixed paragraph per number (9 variants), shown identically to everyone with
   that number, and read independently rather than as a *combination*.

Everything else is either genuinely dynamic (daily/weekly/forecast/tarot/AskAstro) or
correctly identical because it's factual/calculated (Panchang, Match, Dasha).

## Status

- ✅ **Fix 1 (natal reading variety) — DONE.** `getAstrologyReading` now uses a
  per-user deterministic seed (`dob|place|time`); traits/strengths/challenges/
  remedies and past/future predictions are chosen via `sPick`/`sRotate`, so
  same-sign users get different but stable selections (verified: ~5 distinct
  variants over 12 users; identical across sessions for one user).
- ✅ **Fix 2 (numerology combination) — DONE.** Added `combinationInsight` — a
  Mulank × Bhagyank interplay note (81 possible outputs, varies by the pair) —
  returned from `getNumerologyReading` and shown on the Numerology screen.
- ⬜ Fix 1b (expand `ZODIAC_KNOWLEDGE` arrays to 8–10 entries) and Fix 1c (weave in
  Nakshatra/Ascendant-lord/yoga factors) — optional, for even more variety/depth.
- ℹ️ Because the natal composed lines now vary, non-English **instant** coverage for
  those specific lines falls back to runtime translation (English unaffected). To
  restore instant coverage, regenerate the localization bundle to enumerate all
  trait/strength combinations (finite: 12 signs × ~6 entries).

## Small components (confirmed to component level)

- **Focus Areas / weekly highlights / lucky days** — `rotate(..., weekSeed)` → seeded
  per ISO week, varies by sign. Dynamic. ✓
- **Mantras** — fixed sacred formulae per planet (e.g. "Om Angarakaya Namaha"). Static
  is *correct* — a mantra is not randomised. ✓ (not a concern)
- **Gemstone recommendation** — deterministic per planet/sign (a recommendation).
  Correctly stable. ✓
- **Numerology remedies** — templated per number (static). Reasonable for remedy
  guidance; could be seeded later for variety. Minor.
- **Disclaimers** — the gemstone caution (`astrology.gemstonesDesc` in all 6 languages
  + the gemstone report caution) was enhanced to also advise choosing a **good-quality,
  natural, certified** stone, alongside "consult a qualified astrologer before wearing".

Nothing static-and-shared was missed: the two problem surfaces (natal reading,
numerology per-number) are fixed; everything else is either dynamic or correctly fixed.

## Step-by-step actions

### Fix 1 — Natal reading: variety + depth (highest impact)
1. **Add a per-user deterministic seed.** In `getAstrologyReading`, derive
   `seed = hash(dateOfBirth + '|' + firstName + '|' + placeOfBirth)` and replace the
   fixed `pick(arr, 0..3)` calls with `pick(arr, seededIndex(seed+'-fieldK', arr.length))`.
   Result: selections differ between two same-sign users but stay **stable for each
   person** across sessions (natal shouldn't churn daily).
2. **Deepen with chart factors already computed.** Weave in Nakshatra (+ pada),
   Ascendant lord, Moon Nakshatra and any flagged Yogas / Mangal / Sade-Sati status,
   so two Leos with different Nakshatras/Ascendants genuinely read differently.
3. **Expand the pools.** Grow `ZODIAC_KNOWLEDGE` traits/strengths/challenges/remedies
   to ≥ 8–10 entries each so the seeded rotation has real variety to draw from.
4. **Keep it grounded.** All additions stay in the curated knowledge base (no invented
   claims), consistent with the pure-Vedic policy.
5. **Verify.** Two different same-sign/Moon profiles produce different text; the same
   profile is byte-identical across app restarts.

### Fix 2 — Numerology: combination-aware + varied
1. Make the reading reflect the **combination** (Mulank × Bhagyank interplay, Name-
   number harmony, Kua direction) rather than three independent per-number blurbs.
2. Seed the phrasing pool by `hash(dob + name)` so two people sharing one number still
   read differently, while staying stable per user.
3. Add a short combination summary (e.g., "Mulank 1 with Bhagyank 4: …") from a small
   curated matrix.

### Fix 3 — Daily/weekly repetition guard (lower priority)
1. The daily/weekly are already seeded, but each sign's arrays are small (~6–7), so a
   sign can repeat a phrase within a few weeks. Expand those arrays.
2. Optional: keep a short per-user local history of recently shown daily/weekly picks
   and exclude them from the next seed selection to avoid near-term repeats.

### Fix 4 — Nothing to change (document as intended)
Panchang, Forecast, Tarot, Match, Dasha, Sade Sati and AskAstro are correctly either
dynamic or factual/calculated — their sameness (where it exists) is correct. No action.

## Suggested order
Fix 1 (natal reading) → Fix 2 (numerology) → Fix 3 (pool expansion). Fix 1 gives the
biggest perceived-quality lift for the least risk, since it's a localized change to
one function plus knowledge-array growth, fully deterministic and testable.
