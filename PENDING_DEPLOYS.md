# Pending deploys — coded, not yet live

Changes already committed in the repo that need a deploy step to take effect.
Keep this list short: move an item to "Done" (or delete it) once shipped.

## Server (PocketBase hooks on the droplet — root@168.144.189.243)

- [ ] **`pocketbase/pb_hooks/razorpay.pb.js` — new prices.** Authoritative charge
      amounts changed to ₹149 / ₹999 / ₹199 (paise: 14900 / 99900 / 19900); ₹1
      launch unchanged. **Until deployed, web checkout still charges the old
      ₹99/₹499/₹149.** Deploy the same way as the other hooks (copy into the
      server `pb_hooks/` dir, PocketBase hot-reloads), then do a ₹1 test buy to
      confirm the ledger writes the new amount.
- [ ] **`pocketbase/pb_hooks/translate.pb.js` — per-item fallback patch.** Still
      local-only (this is why ta/te translation plateaued). Deploy to harden
      chunked translation. Low urgency now that the bundle is 100%, but it should
      go up with the next server touch.

## Web / marketing (Netlify — astropanth.com)

- [ ] **Re-upload `marketing-site/`** — includes the blog articles, Hindi landing
      pages (hreflang), and the Panchang calendar-grid hub. Then in Google Search
      Console, submit the updated `sitemap.xml`.
- [ ] **Rebuild the web app** so the paywall shows the new ₹149/₹999 display prices
      (from `constants/plans.ts`).

## ⚠️ Expo SDK 53 → 57 upgrade (done in code — affects BOTH platforms)

Upgraded to Expo SDK 57 / RN 0.86 / React 19.2 to build on Xcode 26 (Apple now
requires the iOS 26 SDK; RN 0.79 wouldn't compile). Code changes: removed
`newArchEnabled` + Android `edgeToEdgeEnabled` from app.json (now defaults),
added `react-native-worklets` (reanimated 4 peer), switched two
`@react-navigation/bottom-tabs` imports to expo-router's vendored copy
(`expo-router/build/react-navigation/bottom-tabs`). tsc clean; iOS simulator
build runs on iOS 26 and Sign in with Apple verified.

- [ ] **Android regression before the next Play release.** The live Play build is
      still SDK 53; the *next* Android build will be SDK 57 (new RN). Smoke-test the
      Android build (all screens, ads, notifications, Google login, purchases)
      before promoting it — don't ship the Android update blind on the back of the
      iOS work.

## Next app build (Android + first iOS)

These ride the next `eas build`; nothing to do until then.

- [ ] Localization bundle + content-variety fixes (Fix 1/2) + gemstone disclaimer
      + name-tokenized horoscopes — all in `constants/`, `utils/`, `i18n/`.
- [ ] Sign in with Apple client + iOS config (see IOS_SETUP.md); run
      `npx expo install expo-apple-authentication` first.
- [ ] New prices in `constants/plans.ts` (display) ship automatically.

## Store dashboards (when Play Billing / iOS go live)

- [ ] **Play Console / RevenueCat products** at the SAME amounts: `plus_monthly`
      ₹149, `plus_yearly` ₹999, `reports_all` ₹199, `plus_launch` ₹1
      (see PLAY_BILLING_REVENUECAT_SETUP.md Part 1). Blocked on BillDesk video KYC.
- [ ] **App Store Connect** listing from store-assets/APP_STORE_CONNECT_METADATA.md.
      Blocked on Apple Developer approval.
