# Google Play Billing via RevenueCat — setup & plan (Option A)

Android in-app purchases go through Google Play Billing, wrapped by RevenueCat.
Web keeps Razorpay. Both rails feed one `purchases` ledger and one entitlement rule.

Entitlements (define both in RevenueCat): **`plus`** (ad-free + everything) and
**`reports`** (reports only). `plus` implies `reports` in the app already.

---

## Order & gates (READ FIRST — the sequence matters)

Two hard gates block product creation; do them in this order:

- [ ] **G1. Payments/merchant profile healthy.** Play Console → Setup → **Payments
      profile**. Fix any "issue with your payments profile" banner. Add the **payout
      bank account** (name / account no. / IFSC) in the linked **Google Payments
      Center** (payments.google.com), and complete India **identity + bank
      verification** (test deposit). *This takes a few days — kick it off first.*
- [ ] **G2. A build with the BILLING permission is uploaded.** Play won't let you
      create *any* in-app product until an uploaded AAB declares
      `com.android.vending.BILLING`. That permission is added automatically by the
      RevenueCat library:
      - `npx expo install react-native-purchases`
      - bump `app.json` version → `eas build --profile production --platform android`
      - upload the AAB to an **Internal testing** track and let it process.
- [ ] **G3. Only now** can you create products (One-time products / Subscriptions).

Everything below assumes G1–G3 are done.

## Part 1 — Play Console (you)

1. Play Console → your app → **Monetize → Products → In-app products** (one-time)
   and **Subscriptions**. Create products matching the catalog in `razorpay.pb.js`.
   **Final prices (locked — must match web/server exactly):**
   - `plus_monthly` (subscription, **₹149/mo**)
   - `plus_yearly` (subscription, **₹999/yr**)
   - `reports_all` (one-time, **₹199**)
   - `plus_launch` (one-time or intro, **₹1** / 30 days) — the launch offer is live,
     so create this too; `reports_launch` (₹1) only if you also want a launch price
     on reports.
   Use the SAME product ids as the web catalog. Server-side these are, in paise:
   14900 / 99900 / 19900 / 100 (source of truth: `pocketbase/pb_hooks/razorpay.pb.js`).
2. **Monetize → Monetization setup**: note the license testers section (add your
   test Google account so you can buy without being charged).
3. Create a **Google Cloud service account** with Play Developer API access and grant
   it in Play Console (Users & permissions) — RevenueCat needs this to verify/refund.
   (RC's dashboard has a step-by-step for this credential.)

## Part 2 — RevenueCat (you)

1. Create a RevenueCat account → new **Project** → add a **Play Store app**
   (package `com.astropanth.cosmicinsights`), upload the service-account credential.
2. **Products**: import the Play products above.
3. **Entitlements**: create `plus` and `reports`; attach the right products to each
   (`plus_*` → `plus`; `reports_*` → `reports`).
4. **Offerings**: make a default offering with the monthly/yearly/reports packages
   (the app shows these with correct localized prices).
5. Copy the **Public SDK key (Android)** — the app needs it.
6. **Integrations → Webhooks**: URL `https://api.astropanth.com/revenuecat-webhook`,
   and set an **Authorization** value; store that same value on the server as
   `RC_WEBHOOK_AUTH` (systemd env, next to GROQ_KEY etc.). Hook is already deployed
   (`pocketbase/pb_hooks/revenuecat_webhook.pb.js`).

## Part 3 — App build (you, then me)

1. `npm i react-native-purchases` (+ it ships an Expo config plugin).
2. Add the plugin + Android billing permission via `app.json` (RC docs give the exact
   snippet). Bump `app.json` version.
3. This is a native module → build a **dev client** with EAS (`eas build --profile
   development --platform android`) and run on device; Play Billing only works on a
   real Play-signed build (internal testing track), not Expo Go.

## Part 4 — Code I'll add (once RC entitlement/product ids exist)

- `utils/purchases.ts` — RC wrapper: `configure(userId)` (uses the PocketBase user id
  as the RC app-user-id, so entitlements follow the account across devices),
  `getOfferings()`, `purchase(pkg)`, and a `CustomerInfo` listener that maps RC
  entitlements → `plus` / `reports`.
- `contexts/PremiumContext.tsx` — merge RC state: `isPremium = localFlag || rcPlus`,
  `hasReports = isPremium || localReports || rcReports`. Web/other platforms skip RC
  entirely (Platform.OS guard), so nothing changes for the web/Razorpay path.
- `app/premium.tsx` — on Android show RC offerings (localized prices from RC) and buy
  via `utils/purchases.ts`; on web keep the Razorpay flow. Restore-purchases button.
- `constants/plans.ts` — stop hardcoding prices for Android; read them from the RC
  offering. Keep the web catalog (paise) as the Razorpay source of truth.

## Part 5 — Ledger note

Add **`expired`** to the `purchases.status` select values (alongside
paid/refunded/partial_refund/failed) — the RC webhook uses it when a subscription
lapses. Entitlement stays driven by RC live state, not the ledger; the ledger is your
record-keeping + refund history across both rails.

## Sequence

Do Parts 1–3 (they gate everything and only you can do them). Ping me with the RC
entitlement ids + Android SDK key and I'll write Part 4 and verify it type-checks.
Test end-to-end on the internal track with a license tester, confirm a purchase
unlocks Plus and shows up in `purchases`, then a test refund flips it to `refunded`.
