# Astropanth — App Store Connect metadata (paste-ready)

Everything needed to fill the iOS listing. Nothing here needs the Apple account —
it's ready to paste the moment the app record is created in App Store Connect.
(Field limits shown; App Store is stricter than Play.)

---

## Day-of-approval runbook (do these in order once enrolled)

1. **Install the native module** (unblocks the iOS build + `expo config`):
   `npx expo install expo-apple-authentication`
2. **Apple Developer → Identifiers:** enable *Sign in with Apple* on App ID
   `com.astropanth.cosmicinsights`; create a **Services ID** + a **Sign in with
   Apple key (.p8)**; note **Team ID** + **Key ID**.
3. **PocketBase admin → Settings → Auth providers → Apple:** set clientId, the
   .p8-derived secret, redirect `https://api.astropanth.com/oauth-redirect`.
4. **App Store Connect → My Apps → +** → New App (fields in §1 below).
5. Paste listing (§2–§4), App Privacy (§5), Age rating (§6), App Review info (§7).
6. `eas build --platform ios --profile production` → `eas submit --platform ios`.
7. TestFlight smoke-test on a real device (verify Sign in with Apple end-to-end).
8. Attach build → Submit for review.

---

## 1. New App dialog

| Field | Value |
|---|---|
| Platform | iOS |
| Name | `Astropanth: Kundli & Rashi` (≤30 — 26 chars) |
| Primary language | English (India) |
| Bundle ID | `com.astropanth.cosmicinsights` (register in Identifiers, or let EAS create) |
| SKU | `astropanth-ios-001` (any unique string) |
| User access | Full Access |

> Alt shorter name if preferred: `Astropanth`.

---

## 2. App information (static — set once)

- **Subtitle** (≤30 — 28 chars): `Vedic astrology & numerology`
- **Category:** Primary **Lifestyle**, Secondary **Reference**
- **Content rights:** Does not use third-party content → No.
- **Age rating:** see §6.

**URLs**
- **Privacy Policy URL:** `https://www.astropanth.com/privacy`
- **Support URL:** `https://www.astropanth.com` (contact: support@astropanth.com)
- **Marketing URL** (optional): `https://www.astropanth.com`

**Copyright:** `2026 Astropanth`

---

## 3. Version information (per release — v1.0.7)

**Promotional text** (≤170, editable anytime without review):
```
Your birth chart, read properly. Pure Vedic astrology, numerology, Panchang and Kundli matching — in English, Hindi, Marathi, Kannada, Tamil and Telugu.
```

**Description** (≤4000):
```
Astropanth turns your birth details into a personal map of the stars and numbers. Get a complete Vedic astrology profile — Sun, Moon and Ascendant (Lagna) signs, planetary influences and houses — alongside your core numerology: Birth, Destiny and Kua numbers with a Lo Shu grid reading.

Every insight is grounded in your own chart and a curated knowledge base, not generic horoscopes.

Highlights:
• Daily, weekly and personal horoscopes tuned to your signs
• Full Vedic birth chart (Kundli), Kundli matching (Gun Milan) and daily Panchang
• Complete numerology breakdown with practical meaning
• AskAstro — a chat guide that answers only astrology & numerology questions, using your chart
• Explore another chart — read a friend's or family member's details, then jump back to yours
• Available in English, Hindi, Marathi, Kannada, Tamil and Telugu
• Clean, calm "Celestial Minimal" design

Browse astrology and numerology free as a guest; sign in to save your profile and unlock unlimited AskAstro. You can sign in with Apple or Google.

Astropanth is for guidance and self-reflection and does not provide medical, financial, or legal advice.
```

**Keywords** (≤100 — 99 chars, comma-separated, no spaces):
```
kundli,horoscope,vedic,astrology,numerology,panchang,rashifal,zodiac,jyotish,kundali,matching,tarot
```

**What's New** (for this first version, keep simple):
```
First release on iPhone. Pure Vedic astrology, numerology, Panchang and Kundli matching — now with Sign in with Apple. Thank you.
```

---

## 4. Screenshots (upload)

- **Required:** 6.7" iPhone — **1290 × 2796 px** (iPhone 15/16 Pro Max). Min 3, up to 10.
- Optional but recommended: 6.5" — **1242 × 2688 px**.
- **No iPad** screenshots needed (`supportsTablet:false`).
- Suggested shots (reuse Play captures if same aspect, else re-capture on iOS sim):
  1. Home — daily horoscope
  2. Astrology — birth chart (Sun/Moon/Lagna + traits)
  3. Numerology — Lo Shu grid
  4. Kundli matching result
  5. Panchang
  6. AskAstro chat
- The Android screenshots in `store-assets/screenshots/` show the same screens —
  regenerate at iOS sizes on an iPhone 16 Pro Max simulator (Cmd+S) for pixel-exact.

---

## 5. App Privacy ("nutrition labels" — App Store Connect → App Privacy)

Mirrors the accurate Play data-safety declaration, iOS-framed.

- **Data used to track you:** **None.** (v1 ships with no ads/analytics/tracking
  SDK; the `NSUserTrackingUsageDescription` string is present for a future ads
  option but nothing tracks today. Do **not** enable App Tracking.)
- **Data linked to you** (collected, linked to identity):
  - **Contact Info → Name, Email address** — App Functionality, Account Management
  - **User Content → Other user content** (AskAstro questions/chat) — App Functionality
  - **Identifiers → User ID** (account record id) — App Functionality
  - **Other Data** (date/time/place of birth, gender) — App Functionality, Personalization
    - Place of birth is user-typed text, **not** device location — do NOT declare Location.
- **Data not linked to you:** none.
- **Encrypted in transit:** Yes (all HTTPS/TLS to api.astropanth.com).
- **Data deletion:** Yes — in-app (Profile → Delete Account) and
  `https://www.astropanth.com/delete-account`, plus support@astropanth.com.
- **Diagnostics/Crash data:** none (no crash SDK).

> iOS note: unlike Android there's no bundled FCM device-ID concern here — the app
> uses local notifications (APNs only if remote push is added later), so no
> advertising/device identifier is collected. Keep "Data used to track you: None".

---

## 6. Age rating (questionnaire)

- Answer **None / No** to all: violence, sexual content, profanity, horror,
  gambling/simulated gambling, drugs, mature/suggestive themes, contests.
- AskAstro is **AI-to-user**, not user-to-user — "Unrestricted web access" No,
  "User-generated content" No.
- Expected rating: **4+**.

---

## 7. App Review Information

- **Sign-in required?** Parts of the app (saved profile, unlimited AskAstro) need
  login. Astrology & Numerology tabs are fully usable as a **guest**.
- **Demo account** (create this real user in the app first):
  - Username: `reviewer@astropanth.com`
  - Password: (set a simple one, fill a complete birth profile)
- **Notes for reviewer:**
  ```
  Astrology and Numerology tabs are open to everyone as a guest — no login needed to review core content. To test saved profiles and unlimited AskAstro, sign in with the email/password demo account above. Sign in with Apple and Google are also offered on the login screen. AskAstro is an AI guide restricted to astrology/numerology topics grounded in the user's birth chart. The app provides guidance only and states it is not medical/financial/legal advice.
  ```
- **Contact:** your name, phone, `support@astropanth.com`.
- **Export compliance:** already declared exempt via
  `ITSAppUsesNonExemptEncryption:false` in app.json — answer "No" to using
  non-exempt encryption.

---

## Pre-empt the common iOS rejections (from IOS_SETUP.md Part 5)

- **4.8** Sign in with Apple — present (done: black button, iOS-only). ✓
- **5.1.1** Core features usable without forced sign-up — guest mode. ✓
- **2.1** No crashes / no placeholder — smoke-test every route in TestFlight first.
- **4.3** Differentiated & high quality — Vedic astrology + AI + 6 languages. ✓
- Working Support + Privacy URLs — set above. ✓
