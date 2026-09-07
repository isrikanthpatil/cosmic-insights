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
