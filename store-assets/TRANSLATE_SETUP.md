# Generated-content translation (`/api/translate`) — setup

This powers translation of the **dynamic** prose — readings, daily/weekly
horoscope, and the report/forecast text — into Hindi, Marathi, Kannada, Tamil
and Telugu. (Static UI labels are already bundled in the app and need no server.)
It reuses the same Groq key as AskAstro and caches every translation so each
unique string is paid for only once.

Server-only; no app rebuild needed for this part.

## 1. Create the cache collection (recommended)

In the PocketBase admin UI, create a collection `translation_cache` with fields:

| field | type | notes |
|-------|------|-------|
| `h`   | text | hash of the source string |
| `lang`| text | target language code (hi/mr/kn/ta/te) |
| `en`  | text | source text (for debugging) |
| `tr`  | text | translated value |

Add an index on (`lang`, `h`). Lock all API rules to **admin-only** — the hook
runs with `$app`, so it still reads/writes. If you skip this collection,
translation still works; it just won't cache (slower + more Groq calls).

## 2. Deploy the hook

Copy `pocketbase/pb_hooks/translate.pb.js` to `<pocketbase>/pb_hooks/` and
restart:

```bash
sudo systemctl restart pocketbase
```

It uses `GROQ_KEY` from the environment (already set for AskAstro).

## 3. Test

```bash
curl -s https://api.astropanth.com/api/translate \
  -H 'Content-Type: application/json' \
  -d '{"lang":"kn","texts":["Your Sun is in Leo, giving you natural confidence.","Wear a red thread on Tuesday."]}'
```

You should get `{"translations":[ "<Kannada>", "<Kannada>" ]}`. Try `hi`, `mr`,
`ta`, `te`. `en` (or an unknown code) returns the input unchanged. Run the same
call twice — the second is instant (served from `translation_cache`).

## 4. Then flip localization on (app)

Once this hook is live and tested, enable in-app language switching by setting
`LOCALIZATION_ENABLED = true` in `constants/plans.ts` and shipping a build. The
picker (English, हिंदी, मराठी, ಕನ್ನಡ, தமிழ், తెలుగు) appears in Profile, the whole
UI switches instantly (bundled, offline), and generated readings/reports
translate via this hook (cached after first view).

> If you flip the flag on **without** deploying this hook, the UI still
> translates but generated readings/reports stay English (the app silently falls
> back). So deploy + test this first.
