# Horoscope prose localization — pre-warm (hybrid Part B)

Daily/weekly horoscope sentences are flowing prose that must be translated as whole
sentences (grammar). They also embed the user's name, so historically every user
produced a UNIQUE string → a fresh Groq translation per user, per day.

## Done — name tokenization (the main win)

`utils/nameToken.ts` + the home screen now translate these sentences with the name
swapped for a `{name}` token, then restore the name at render:

- `tokenizeName(s, name)` → `restoreName(s, name)`; the translate hook preserves
  `{placeholder}` tokens, so the token survives.
- Effect: the sentence is now **identical across users** for a given
  (sign, natal-Moon, day). The first user to view it warms the server
  `translation_cache`; every other user with the same combination gets it
  **instantly** from cache. Groq load drops sharply, and translations become
  pre-warmable.

This alone delivers most of the "instant" benefit organically, with no cron.

## Optional — nightly pre-warm cron (not built; low marginal value)

To also eliminate the *first* user's latency each day, a scheduled job could
pre-translate the day's sentences into all languages ahead of traffic. Notes if you
build it:

- **Weekly is clean**: `generateWeeklyHoroscope` depends only on sun sign + ISO week
  (12 combos/week), so its overview/highlights/focus can be fully pre-warmed cheaply.
- **Daily is combinatorial**: `generateDailyHoroscope` depends on sun sign AND natal
  Moon (transit house) — up to ~144 combos/day — so full daily pre-warm is heavier.
- **Deploy shape** (mirror the Panchang poster, since the server has Python, not
  Node): pre-compute the tokenized sentences in the repo (Node + the astrology
  engine) into a dated JSON, ship it, and a small Python cron POSTs each day's/week's
  batch to `/api/translate` (which caches them). Pace under Groq's 8k tokens/min.

Given tokenization already yields shared caching, this cron is a polish item — worth
it only at higher traffic. Left as a documented option.
