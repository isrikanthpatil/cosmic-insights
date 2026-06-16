# Astropanth — Android Build & Play Store Guide

Everything in the app is already configured. This guide is the steps **you** run (they need your Expo login and a Google Play account).

## What's already done (in the repo)
- Real app icon + Android **adaptive icon** (`assets/images/adaptive-icon.png`, dark `#0B0B1A` background).
- `app.json` → Android `package: com.astropanth.cosmicinsights`, `versionCode: 1`, splash screen.
- `eas.json` → `preview` profile builds an **APK** (easy to sideload + test), `production` builds an **AAB** (required by Play), both pointed at `https://api.astropanth.com`.
- Play Store **feature graphic** (`store-assets/feature-graphic-1024x500.png`) and listing copy (below).

## Prerequisites (one-time)
1. **Expo account** — free, at expo.dev (you likely have one).
2. **Google Play Developer account** — $25 one-time, at play.google.com/console.
3. EAS CLI: `npm install -g eas-cli`

## Step 1 — Link the project
From the `Astro-main` folder:
```
eas login
eas init          # creates the EAS project and fills extra.eas.projectId in app.json
```

## Step 2 — Test build (APK) before going to the store
```
eas build --platform android --profile preview
```
This runs on EAS servers (~10–20 min), then gives a download link. Install the APK on an Android phone and smoke-test: guest flow, login, readings, AskAstro (2 free → nudge), Google login, profile save.

## Step 3 — Production build (AAB for Play)
```
eas build --platform android --profile production
```
EAS will offer to **generate a release keystore** — say yes and let EAS manage it (don't lose it; it signs all future updates). Output is an `.aab`.

## Step 4 — Google Sign-In on the installed app (important)
Native Google login needs the build's signing fingerprint registered, or it fails only on the store build (works in Expo Go):
1. `eas credentials` → Android → copy the **SHA-1** of the build keystore.
2. In **Google Cloud Console → Credentials**, add an **Android OAuth client** with package `com.astropanth.cosmicinsights` + that SHA-1.
3. In **PocketBase → Settings → Auth providers → Google**, make sure the redirect/allowed schemes include `cosmic-insights://`.
(If you'd rather ship v1 without native Google and rely on email + the web Google flow, we can hide the Google button on Android — tell me.)

## Step 5 — Submit to Play
Easiest: upload the `.aab` manually in Play Console → Create app → Production/Internal testing → upload. 
Or automated: download a Play **service-account JSON**, save it as `play-service-account.json` in the project, then:
```
eas submit --platform android --profile production
```
(starts on the `internal` testing track per `eas.json`).

## Play Console — store listing
You'll need (Play Console will prompt):
- **App icon**: 512×512 PNG → export from `assets/images/icon.png` (resize to 512).
- **Feature graphic**: `store-assets/feature-graphic-1024x500.png` ✅ ready.
- **Screenshots**: 2–8 phone screenshots. Run the app, screenshot Home, Astrology, Numerology, AskAstro. (I can frame these once you send raw captures.)
- **Privacy policy URL**: required. We need to host one (e.g. www.astropanth.com/privacy) — flag this and I'll draft it.
- **Data safety form**: declare email + birth details collected, used for the readings, stored on your server.

### Listing copy (ready to paste)
**App name:** Astropanth

**Short description (≤80 chars):**
Personalised astrology & numerology, grounded in your birth chart.

**Full description:**
Astropanth turns your birth details into a personal map of the stars and numbers. Get a complete Vedic-informed astrology profile — Sun, Moon and Ascendant signs, planetary influences and houses — alongside your core numerology: Birth, Destiny and Kua numbers with a Lo Shu grid reading.

Every insight is grounded in your own chart and a curated knowledge base, not generic horoscopes. Highlights:

• Daily, weekly and personal horoscopes tuned to your signs
• Full numerology breakdown with practical meaning
• AskAstro — a chat guide that answers only astrology & numerology questions, using your chart
• Explore another chart — read a friend's or family member's details, then jump back to yours
• Clean, calm "Celestial Minimal" design

Browse astrology and numerology free as a guest; sign in to save your profile and unlock unlimited AskAstro. Astropanth is for reflection and entertainment and does not provide medical, financial, or legal advice.

**Category:** Lifestyle  ·  **Tags:** astrology, numerology, horoscope, zodiac
