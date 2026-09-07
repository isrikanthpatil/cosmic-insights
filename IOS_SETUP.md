# iOS build & App Store submission — Astropanth

The app already builds cross-platform (Expo/RN); iOS just needs an Apple account,
a few config items, and two iOS-specific code additions. Order matters — Part 0 gates
everything.

## Part 0 — Apple Developer Program (the gate; ~24–48h)

- Enroll at **developer.apple.com/programs** — **$99/yr**.
  - **Individual** (registers under your name) — fastest, approval often same day.
  - **Organization** (company name) — needs a **D-U-N-S number**; a few days. Only if
    you want the publisher to be the company.
- Requires an Apple ID with 2FA + payment. Everything below waits on approval.

## Part 1 — App-side config

- [x] iOS bundle id `com.astropanth.cosmicinsights`, `buildNumber`, and required
      **usage strings** (camera, photo library, tracking) + `ITSAppUsesNonExemptEncryption:false`
      are set in `app.json`.
- [x] **`supportsTablet` → `false`** (iPhone-only) set in `app.json` — no iPad
      screenshots/layout needed for the first release.
- [x] **iOS launches ad-free** — `AdBanner.tsx` returns `null` on iOS (`Platform.OS === 'ios'`),
      so no iOS AdMob id / SKAdNetwork / ATT prompt is needed for v1. Turn on later.
- [ ] **Push notifications.** If your daily reminder is a *local* notification
      (scheduled on-device), no APNs is needed. For *remote* push you must create an
      **APNs key** (Apple Developer → Keys) and add it to EAS credentials.

## Part 2 — Two iOS-specific CODE additions

1. **Sign in with Apple (required).** App Store Guideline 4.8: because the app offers
   **Google** login it must also offer **Sign in with Apple** on iOS.
   - [x] **Client scaffolded.** `expo-apple-authentication` added (`package.json` +
         `app.json` plugin + `"usesAppleSignIn": true`); `utils/appleAuth.ts` presents
         the native sheet and exchanges the code via PocketBase `authWithOAuth2Code('apple', …)`;
         `AuthScreen.tsx` shows a black **Continue with Apple** button (iOS-only, above
         Google), localized in all 6 languages. tsc clean.
   - [ ] **Install the native module** before the first iOS build:
         `npx expo install expo-apple-authentication` (adds it to node_modules; the
         pinned `~7.2.4` is SDK-53-compatible).
   - [ ] **Finalize after enrollment (needs the Apple account):**
         1. Apple Developer → **Identifiers → App IDs → `com.astropanth.cosmicinsights`**:
            tick the **Sign in with Apple** capability, Save.
         2. Apple Developer → **Keys → +**: create a key, enable **Sign in with Apple**,
            download the **`.p8`** (⚠️ downloadable **once** — keep it safe). Note the
            **Key ID** (on the key page) and your **Team ID** (top-right of the account).
         3. PocketBase admin → **Settings → Auth providers → Apple → Enable**, then use
            its built-in secret generator — fill:
            - **Client ID / App ID:** `com.astropanth.cosmicinsights` (the **bundle id**;
              our flow is native, so use the App ID, not a web Services ID)
            - **Team ID:** (from step 2)
            - **Key ID:** (from step 2)
            - **Private key:** paste the whole `.p8` contents
            - **Duration:** up to ~6 months (max 15777000s). PocketBase generates the JWT
              **client secret** from these (the .p8 itself isn't stored). ⚠️ **This secret
              expires — set a reminder to regenerate it before it lapses**, or Apple login
              breaks. Redirect URL: `https://api.astropanth.com/oauth-redirect`.
         4. Smoke-test on a real device via TestFlight. If the code exchange errors,
            the usual fix is the Client ID value (native uses the **bundle id**; a web
            Services ID is only for the browser flow) — `utils/appleAuth.ts` notes this.
   - **Configured values (recorded — the .p8 is NOT stored here):**
     | Field | Value |
     |---|---|
     | Client ID (App ID / bundle id) | `com.astropanth.cosmicinsights` |
     | Team ID | `N4P923T45S` |
     | Key ID | `S3PB3DS7MQ` |
     | Key name (Apple portal) | `Astropanthkey` |
     | Private key (.p8) | held offline by Patil; paste into PocketBase only |
     | Redirect | `https://api.astropanth.com/oauth-redirect` |

     ⚠️ **The PocketBase Apple client secret is a JWT generated from the .p8 and
     expires (max ~6 months). Set a reminder to regenerate it in PB before it
     lapses**, or Sign in with Apple stops working. If the .p8 is ever lost,
     revoke key `S3PB3DS7MQ` in Apple Developer → Keys and create a new one.

2. **No web-payment steering inside the iOS app** (same anti-steering as Play). Since
   billing is web/Play-only today and iOS launches free, there's nothing to remove —
   just don't add a "buy on our site" link in the iOS build. IAP, when added, must go
   through Apple StoreKit (RevenueCat wraps it, same as Play).

## Part 3 — App Store Connect

1. **appstoreconnect.apple.com → My Apps → +** → New App: platform iOS, name
   "Astropanth", bundle id (register the App ID in Certificates/Identifiers first, or
   let EAS create it), SKU, primary language.
2. **Metadata**: subtitle, description, keywords, **Support URL** (astropanth.com),
   **Privacy Policy URL** (astropanth.com/privacy), category **Lifestyle** (or Reference).
3. **Screenshots**: 6.7" iPhone required (+ 6.5"); iPad only if `supportsTablet:true`.
4. **App Privacy** ("nutrition labels"): declare data collected (account email, usage,
   diagnostics, and "Third-party advertising" if ads stay on). Expo SDK adds the iOS
   **privacy manifest** for common APIs automatically.
5. **Age rating** questionnaire.

## Part 4 — Build & TestFlight

```bash
# EAS auto-manages iOS certs/provisioning against your Apple account
eas build --platform ios --profile production
eas submit --platform ios --profile production   # uploads to App Store Connect
```
Then App Store Connect → **TestFlight** → add yourself as an internal tester → install
via the TestFlight app and smoke-test on a real device.

## Part 5 — Submit for review

- Attach the TestFlight build to the App Store version, complete metadata/screenshots/
  privacy/age rating, answer export compliance (already declared exempt).
- **Submit.** iOS review is stricter than Play (~24–48h). Pre-empt the common rejections:
  - **4.8** — Sign in with Apple present (Part 2.1). ← most likely reject if missed.
  - **5.1.1** — core features usable without forced sign-up (guest mode ✓).
  - **2.1** — no crashes; every screen/route works; no placeholder content.
  - **4.3** — differentiated, high-quality (your Vedic astrology + AI + 6 languages ✓).
  - Working Support + Privacy URLs.

## Suggested sequence
Enroll (Part 0) → I add **Sign in with Apple** + set `supportsTablet:false` + decide
ads-off for v1 (Part 1–2) → `eas build`/`submit` (Part 4) → TestFlight → review.
Send me the word once enrolled and I'll do the Sign-in-with-Apple work so the first
build is submittable.
