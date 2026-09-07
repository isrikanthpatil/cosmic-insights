# iOS smoke-test checklist (Simulator or device)

Run before submitting for review. Goal: no crashes, every route works, and the
two iOS-specific things (Sign in with Apple, iOS ad-free) behave. Tick as you go.

## Auth (the highest-risk area)
- [ ] **Sign in with Apple** — black "Continue with Apple" button shows on the
      login screen (iOS only), the Apple sheet opens, and completing it lands you
      **inside the app** (tabs). ← the #1 thing to verify.
- [ ] First Apple sign-in: name/email captured; the profile is created in PocketBase.
- [ ] Sign out → **Sign in with Apple again** — logs straight back in (no re-consent loop).
- [ ] **Google sign-in** still works.
- [ ] **Email/password** sign-up + login + password reset email works.
- [ ] **Guest mode** — Astrology & Numerology usable with no account.

## Core screens (open each; no crash, no blank/placeholder, text not cut off)
- [ ] Home — daily horoscope + weekly loads
- [ ] Astrology — Kundli (Sun/Moon/Lagna, grahas, houses), traits/remedies
- [ ] Kundli Matching — enter two charts → Gun Milan score + koota breakdown + Manglik
- [ ] Numerology — Birth/Destiny/Kua + Lo Shu grid + combination insight
- [ ] Panchang — 5 angas + sunrise/sunset + Rahu Kalam
- [ ] Sade Sati / Dasha screens
- [ ] Tarot — daily card + spread
- [ ] AskAstro — ask a question, get a grounded answer (guest limit works)
- [ ] Reports — generate one, PDF opens / shares

## iOS specifics
- [ ] **No ads anywhere** on iOS (v1 is ad-free — AdBanner returns null on iOS).
- [ ] **No "buy on our website" links** in the app (anti-steering). Paywall shows
      prices but no external web-payment link on iOS.
- [ ] Language switch (English → Marathi/Hindi/…) changes UI + readings.
- [ ] Notifications permission prompt appears if/when a reminder is enabled.
- [ ] Camera/photo permission prompts show the usage strings (profile photo).

## Layout
- [ ] Safe areas OK on a notch/Dynamic-Island device (no content under the notch/home bar).
- [ ] Keyboard doesn't cover inputs on the auth + AskAstro screens.

## If Sign in with Apple fails
Note the exact error, then check (in order):
1. PocketBase Apple provider **Client ID = `com.astropanth.cosmicinsights`** (bundle
   id, not a Services ID), Team ID `N4P923T45S`, Key ID `S3PB3DS7MQ`, .p8 pasted whole.
2. The generated client secret hasn't expired.
3. Redirect `https://api.astropanth.com/oauth-redirect`.
Send me the error string and I'll pinpoint it.
