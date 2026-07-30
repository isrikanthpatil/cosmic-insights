# Astropanth — Next Release Checklist

Everything queued for the release *after* the current v1.0.0 launch. Work top-down: **Section 1 is required, Section 2 is recommended with the same build, Section 3 is the feature backlog** (do over time, not all at once). Each item has what/why/how so you can tackle them one at a time.

Current state at launch: versionCode **8**, versionName **1.0.0**, Expo SDK 53, target API 35. Share-card code is already committed and will ship in the next build automatically.

---

## Section 1 — Required before you can publish ANY update (deadline Aug 31, 2026)

### 1.1 Raise target SDK to Android 16 (API 36)
- **Why:** From Aug 31, 2026 Google blocks app *updates* unless you target API 36. Not a blocker for the live app, but blocks everything below until done.
- **How (quick path, stays on SDK 53):**
  1. `npx expo install expo-build-properties`
  2. Add to `app.json` → `expo.plugins` (see combined block in 2.1 — do both at once).
  3. Rebuild and test on a real device (keyboard, safe-area, notifications — API 36 forces edge-to-edge, which you already use).
- **Verify:** After publishing, the target-API warning clears in Play Console → Policy → App content, and Google emails confirmation.
- **Alt path:** Upgrade to Expo SDK 54 (targets 36 by default) — bigger job, plan separately.

---

## Section 2 — Recommended, bundle into the same next build

### 2.1 Enable R8 optimization
- **Why:** Play's "Technical quality" recommendation. Shrinks/optimizes code → smaller download, better memory & startup.
- **How:** Combine with 1.1 in one `expo-build-properties` block:
  ```json
  [
    "expo-build-properties",
    {
      "android": {
        "compileSdkVersion": 36,
        "targetSdkVersion": 36,
        "buildToolsVersion": "36.0.0",
        "enableProguardInReleaseBuilds": true,
        "enableShrinkResources": true
      }
    }
  ]
  ```
- **Test carefully:** R8 issues appear at *runtime*, not build time. On a real device, open every screen, run AskAstro, do a Kundli match, trigger a notification. If anything breaks, add ProGuard keep-rules for the affected library.

### 2.2 Confirm the share card is in the build
- **Why:** Committed (07047b9) but only reaches users in a fresh build.
- **How:** No action — it's in the source; just confirm the Share button appears on Home daily/weekly cards when you test the build.

### 2.3 Global-city fallback for birthplace geocoding
- **Why:** You launched in ~16 countries, but `getCoordinatesForPlace` only knows Indian cities/state centroids. Users *born outside India* don't geocode accurately (affects ascendant; moon/numerology less so).
- **How:** Add a small international-cities lookup (or a geocoding fallback) so non-India birthplaces resolve. Server-side data update where possible so it doesn't need an app rebuild.
- **Priority:** Medium — only matters for diaspora users born abroad.

---

## Section 3 — Feature backlog (over multiple releases, not all at once)

### 3.1 Premium billing (monetisation)
- **App (Android):** RevenueCat + Google Play Billing (mandatory for in-app digital subscriptions). Swap into existing `PremiumContext`.
- **Web (astropanth.com):** Razorpay (UPI AutoPay for recurring) — cheaper, keeps more revenue; unlock the same entitlement.
- **Also:** set per-country pricing once live in multiple regions (₹ auto-converts, but clean local prices are better).
- **Note:** Don't link from inside the Android app to the web purchase page (Play anti-steering rules).

### 3.2 Native "Sign in with Google" on Android
- **Why deferred:** PocketBase all-in-one OAuth2 needs realtime/EventSource that RN lacks; browser-return was finicky. Email + guest work fully today.
- **How (later):** implement the RN-friendly OAuth2 code flow (deep-link redirect) rather than the realtime-dependent helper.

### 3.3 Hindi localization
- **Why:** Broadens the India audience significantly.
- **How:** i18n layer; translate UI strings + horoscope/interpretation templates.

### 3.4 Full Vedic Kundli (birth chart)
- Currently "Soon" in the More tab. Extend the ephemeris engine to full D1 chart + house/planet placements + interpretations (validated, per your genuine-knowledge standard).

### 3.5 Tarot
- Backlog item flagged "Soon" in More tab. Content + UI.

### 3.6 iOS build
- App Store version via EAS (`--platform ios`), Apple Developer account, App Store review.

---

## Build & release procedure (when Section 1–2 are done)

1. Make the `app.json` change (combined block from 2.1) + any code changes.
2. `npx tsc --noEmit` → expect 0 errors.
3. `git add -A && git commit -m "..."` and `git push`.
4. `eas build --profile production --platform android` (versionCode auto-increments to 9).
5. **Test the built AAB/APK on a real device** — full pass (screens, AskAstro, match, notifications, share).
6. Play Console → Test and release → Production → **Create new release** → add the new AAB → release notes → **set the Rollout percentage to 20% on the "Preview & confirm" screen BEFORE clicking Start rollout** (a staged rollout can only be increased or halted later — never reduced, so you must set 20% up front; v1.0.0 went out at 100% because this field was missed) → **Start rollout to Production**.
7. After 2–3 days with healthy Android vitals, go to Production → Releases → active release → **Manage rollout** and bump to 50%, then 100%.
8. Watch Android vitals for 48h; confirm the target-API warning has cleared.

---

## Priority summary
- **Do first (one build):** 1.1 target API 36 + 2.1 R8 + 2.2 share card (already in) + optionally 2.3 global cities.
- **Then, over time:** 3.1 premium billing → 3.2 Google sign-in / 3.3 Hindi → 3.4 full Kundli → 3.5 tarot → 3.6 iOS.
