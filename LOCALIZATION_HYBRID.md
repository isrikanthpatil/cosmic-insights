# Generated-content localization — hybrid design

Goal: generated content (readings, horoscopes, reports) renders instantly in the
user's language with no English flash, ideally offline — **without** degrading
translation grammar.

## Why hybrid (not pure template-level)

Generated content splits into two kinds:

- **Finite / structured** — term names (signs, planets, nakshatras), knowledge
  phrases (traits, strengths, challenges, remedies, career), and the labeled
  reading lines (`Core Identity (Sun in Aries): …`). The full set is small and
  fixed, so it can be pre-translated as whole strings and bundled. Whole-string
  translation keeps grammar correct.
- **Combinatorial / flowing prose** — the daily/weekly horoscope sentences that
  interpolate a knowledge phrase mid-sentence *and* the user's name
  (`"${firstName}, your ${sunSign} strength of ${strength} is well-supported…"`).
  These are not finite, and slotting a separately-translated word into a
  translated frame produces ungrammatical output in Hindi/Tamil/Telugu (SOV,
  case-marked). So these stay on **whole-sentence runtime translation**, which
  reads correctly.

## Status (pilot)

Mechanism BUILT + shipping-safe. Bundle coverage as of last run: hi 100%, mr 89%,
kn 79%, ta 66%, te 65% (~80% overall). Unfilled strings fall back to English, so
it's safe to ship as-is and tops up on future runs. To finish ta/te: deploy the
per-item hook fix (`pocketbase/pb_hooks/translate.pb.js`, already patched) so
poison items don't null a whole group, then re-run
`gen_content_bundle.py --insecure --langs ta,te --chunk 12 --sleep 10` a couple
more times (Groq is capped at 8k tokens/min, so it fills in bursts).

## Part A — Bundled finite content (BUILT, pilot = astrology reading)

- `i18n/generatedContent.json` — offline map `{ lang: { english: translated } }`.
  English is identity (not stored). Flowing prose is intentionally NOT here.
- `utils/contentBundle.ts` — synchronous, offline lookup (`bundleGet`,
  `localizeFromBundle`).
- `utils/i18nContent.ts` — now bundle-first: `translateList` resolves bundled
  strings offline and never sends them to the server; `useTranslatedList` seeds
  its initial state from the bundle, so bundled content is in-language on first
  paint (no flash). Non-bundled strings fall through to the existing server path.
- No composer changes: generators still emit English; the translation layer
  resolves finite strings from the bundle. Zero grammar risk.

### Fill the bundle (one command — do this to activate the pilot)

The bundle ships with a small stub; generate the full set by calling the app's own
public translate endpoint (no API key needed here):

```bash
python3 scripts/i18n/gen_content_bundle.py --insecure
```

This reads `scripts/i18n/astro-keys.json` (637 finite strings), translates each
into hi/mr/kn/ta/te via `https://api.astropanth.com/api/translate`, and writes
`i18n/generatedContent.json`. It's resumable (skips what's already there) and
saves after every chunk. Then rebuild the app — the astrology reading renders
instantly/offline in all 6 languages.

### Regenerating the key list (only if the knowledge base changes)

`astro-keys.json` was enumerated from `ZODIAC_KNOWLEDGE` + the labeled-line
templates in `utils/astrology.ts` (`getAstrologyReading`). If those change,
re-enumerate and re-run the generator.

## Part B — Flowing prose pre-warm (NOT YET BUILT)

Daily/weekly horoscopes stay on runtime translation. To make them feel instant
too, add a **scheduled pre-warm** (server-side): each morning, for all 12 signs,
compose that day's `mainPrediction/positiveEnergy/advice` and this week's
`overview/highlights` and POST them to `/api/translate` for each language. That
seeds `translation_cache`, so when a user opens the app the sentence is already
translated → no wait. Name interpolation: pre-warm the sentence with a neutral
placeholder and translate around it, or accept that the (proper-noun) name is
slotted last — names are language-neutral and slot cleanly.

## Rollout order (after the pilot verifies)

1. Astrology reading — pilot (this doc).
2. Numerology tables (`numerologyDetail.ts`) — finite, same bundle mechanism.
3. Panchang term names (tithi/nakshatra/yoga/karana) — finite.
4. Report/forecast HTML — bundle the finite section labels + knowledge phrases;
   keep any free-form summary on runtime.
5. Part B pre-warm for daily/weekly prose.

Each step just adds its finite strings to `astro-keys.json` (or a sibling keys
file) and re-runs the generator — no code changes needed.
