# Legal / compliance decisions — Astropanth (India, sole proprietor)

_Not legal/tax advice. Confirm specifics with a CA (tax/GST) and a lawyer / TM
agent (trademark). This records the current decisions and why._

## Billing model: Play-only for now (web direct sales OFF)

**Decision:** Do not sell digital goods directly to consumers on the web
(Razorpay) for now. Sell in-app on Android via **Google Play Billing** (Google is
the merchant of record and remits Indian consumer GST). iOS launches free (and is
separately blocked in review — see store-assets).

**Why:** Selling digital services directly to Indian consumers online makes *us*
the seller of record, which is treated as **OIDAR** and triggers **GST
registration immediately (no ₹20 lakh threshold)**. Routing all sales through Play
(where Google handles the consumer GST) avoids that, so we can defer our own GST
registration until we actually approach the normal threshold.

**Implemented in code:**
- `constants/plans.ts` → `WEB_BILLING_ENABLED = false` (new flag). The Razorpay web
  checkout is no longer offered anywhere in the app. `BILLING_ENABLED` and promo
  codes are unchanged; the Razorpay client (`utils/razorpay.ts`) and server hook
  (`pocketbase/pb_hooks/razorpay.pb.js`) stay in place, just unused.
- `app/premium.tsx` → web buy buttons gated on `WEB_BILLING_ENABLED`; web now shows
  the "coming soon / redeem a code" state, Android shows its note. No web-payment
  link on any platform.
- **To re-enable web sales later:** register a GSTIN first, then flip
  `WEB_BILLING_ENABLED = true` and rebuild the web app.

## GST

- **Deferred.** With Play-only billing, register only when **aggregate turnover**
  approaches **₹20 lakh** (₹10L in special-category states). Google remits the
  consumer GST on Play sales meanwhile.
- CA to confirm: "aggregate turnover" includes AdMob income (zero-rated export) and
  any reverse-charge on Google's/Apple's commission. None of these force immediate
  registration for a small indie, but get the number checked.
- **Income tax is separate and always applies** — file your ITR on all income
  (Play payouts + AdMob); presumptive taxation (44ADA/44AD) may simplify it.

## Entity

- **Sole proprietor is fine for now.** No incorporation required for Play-only.
- Note: an Apple **Organization** account (a lever for the iOS 4.3 saturated-category
  issue) requires a **registered legal entity + D-U-N-S** — a sole proprietor can't
  get one. Revisit **OPC / LLP / Pvt Ltd** only if the iOS-Org route, limited
  liability, or scale justify it.

## Trademark

- **Protective, not mandatory — deferrable.** Recommended before scaling: file
  "Astropanth" (wordmark) + logo in **Class 9** (app software) + **Class 42** (SaaS),
  ~₹4,500/class for individuals. Can file as an individual now and assign to a
  company later if you incorporate.

## Data protection (applies regardless of billing)

- You collect personal data (name, email, DOB/time/place, gender, AskAstro chats),
  so **DPDP Act 2023** basics apply no matter how you monetise: keep the **privacy
  policy accurate**, **consent** clear, **account deletion** working (in-app +
  astropanth.com/delete-account), and note cross-border processors (Groq, Brevo).
  Nothing to "register"; this is ongoing hygiene.

## Still required near-term (not deferrable)
- Finish the **Play / BillDesk merchant KYC** (RBI PA-CB) to receive Play payouts.
- File **income-tax returns** on all earnings.
- Keep the **privacy policy / terms / refund** pages accurate.

## Open decision
- Stay sole proprietor vs incorporate (OPC) — parked; only needed if the Apple-Org
  route or limited-liability/scale reasons make the case.
