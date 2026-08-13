# Astropanth — Pre-Build Checklist

Run this every time before `eas build`. It catches the two classes of problem that slip through: **code errors** and **content/state drift** (e.g. a "coming soon" label for a feature that already shipped).

## 1. Automated checks (run from the project folder)

```bash
cd ~/Downloads/"Cowork Project"/Astro-main

# a) Type safety — must be 0 errors
npx tsc --noEmit

# b) Stale "coming soon" / feature-state drift — review every hit:
#    make sure nothing that already ships is still labelled coming soon,
#    and every "Soon" item is genuinely not yet built.
grep -rniE "coming soon|\\bsoon\\b|placeholder|TODO|WIP|not yet" app components constants utils

# c) No secrets in the client bundle (should return nothing)
grep -rniE "gsk_[A-Za-z0-9]|xkeysib-|api[_-]?key\\s*[:=]\\s*['\"]" app components contexts utils constants

# d) Feature parity — the More-tab features and their routes
grep -nE "route:|comingSoon" "app/(tabs)/more.tsx"
# ...and the plan feature lists (free vs Plus) reflect what actually ships
sed -n '/freeFeatures/,/^\]/p;/plusFeatures/,/^\]/p' constants/plans.ts

# e) Version / config sanity
node -e "const a=require('./app.json').expo; const bp=a.plugins.find(x=>Array.isArray(x)&&x[0]==='expo-build-properties'); console.log('name',a.name,'| targetSdk',bp[1].android.targetSdkVersion,'| R8',bp[1].android.enableProguardInReleaseBuilds,'| allowBackup',a.android.allowBackup);"

# f) Everything committed
git status --short
```

## 2. Feature-state consistency (manual, 2 min)
- [ ] Every **More-tab** card that has a `route` opens a working screen (no `comingSoon`).
- [ ] Every **"Soon"** card is genuinely not built yet.
- [ ] **Premium/Plus** feature list (`constants/plans.ts`) does not list a free/shipped feature as a Plus perk or "coming soon".
- [ ] Any "coming soon" copy in `premium.tsx`, `more.tsx`, onboarding, etc. is still true.
- [ ] Store listing / release notes describe what this build actually contains.

## 3. On-device smoke test (after the build, before promoting)
Because R8 minification only fails at runtime, install the APK/AAB and check:
- [ ] Home: chart (Sun/Moon/Rising), numbers, daily + weekly horoscope, reminder nudge
- [ ] Astrology: all sub-tabs render (Overview/Strengths/Growth/Remedies/Guidance)
- [ ] Numerology: numbers + tap-to-expand detail
- [ ] AskAstro: send a question, streaming works, guest limit behaves
- [ ] More → **Kundli**: chart grid, graha table, Janma Nakshatra, Dasha
- [ ] More → **Tarot**: daily card + draw three cards
- [ ] More → Kundli Matching: compute a match
- [ ] Profile: edit + save, keyboard behaves, password reset shows the inline message
- [ ] Notifications: enable the daily reminder
- [ ] Sign in / sign up / sign out

## 4. Play Console (before promoting to Production)
- [ ] Correct version code / AAB attached
- [ ] Data safety, App content, content rating all green
- [ ] Target-API warning cleared (once the API-36 build is live)
- [ ] Rollout % set **up front** (can't be lowered later)
