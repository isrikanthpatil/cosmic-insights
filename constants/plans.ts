// Single source of truth for the free-vs-Plus feature split and pricing.
// The paywall (app/premium.tsx) and any future gating read from here so the
// plan definition lives in exactly one place.

export interface PlanFeature {
  /** Short, user-facing label for the benefit. */
  label: string;
}

// What every user gets for free today (nothing here is gated by this scaffolding).
export const freeFeatures: PlanFeature[] = [
  { label: 'Browse astrology & numerology' },
  { label: 'Daily & weekly horoscope' },
  { label: 'Full Vedic Kundli, Dasha & Tarot' },
  { label: 'Kundli matching (compatibility)' },
  { label: '2 free AskAstro questions/day' },
];

// What "Astropanth Plus" will unlock. These are presentational only for now —
// the Subscribe flow is not wired to any billing provider yet.
export const plusFeatures: PlanFeature[] = [
  { label: 'Unlimited AskAstro' },
  { label: 'In-depth chart, dasha & remedy reports' },
  { label: 'Detailed compatibility & matching reports' },
  { label: 'Ad-free' },
  { label: 'Priority responses' },
];

export interface PlanPrice {
  /** Stable identifier — maps to a store product id once billing is wired. */
  id: 'monthly' | 'yearly';
  /** User-facing billing cadence label. */
  period: string;
  /** Display price string. */
  displayPrice: string;
  /** Optional secondary note (e.g. effective monthly price for yearly). */
  note?: string;
}

// Final pricing. On web these display strings back the Razorpay catalog; the
// authoritative charge amounts live server-side in pocketbase/pb_hooks/razorpay.pb.js.
// On Android/iOS the store (Play / App Store via RevenueCat) is the source of the
// actual localized price — set the same amounts there.
export const plusPrices: PlanPrice[] = [
  {
    id: 'monthly',
    period: 'per month',
    displayPrice: '₹149/mo',
  },
  {
    id: 'yearly',
    period: 'per year',
    displayPrice: '₹999/yr',
    note: 'Best value — about ₹83/mo',
  },
];

// Marketing copy for the paywall hero, kept here so it stays consistent.
export const plusPlanName = 'Astropanth Plus';
export const plusTagline = 'Unlock the full cosmos';

// Master switch for the in-app monetisation UI (Android note / paywall states).
// Promo codes work regardless of this flag.
export const BILLING_ENABLED = true;

// COMPLIANCE GATE — direct web sales via Razorpay.
// Selling digital goods directly to Indian consumers on the web makes US the
// seller of record, which triggers GST registration immediately (OIDAR, no
// threshold). To stay compliant while we defer GST, keep this FALSE: no web
// checkout is offered. Android in-app purchases go through Google Play Billing
// (Google is the merchant of record and remits the consumer GST), so those are
// unaffected. Flip this back to true only AFTER a GSTIN is registered and web
// sales are meant to resume. The Razorpay code + server hook stay in place.
export const WEB_BILLING_ENABLED = false;

// Purchasable items. `id` maps to the server-side catalog in razorpay.pb.js
// (which holds the authoritative amounts so the client can't tamper with price).
export const PRODUCTS = {
  plus_monthly: { id: 'plus_monthly', label: 'Astropanth Plus — Monthly', price: '₹149/mo' },
  plus_yearly: { id: 'plus_yearly', label: 'Astropanth Plus — Yearly', price: '₹999/yr' },
  reports_all: { id: 'reports_all', label: 'Unlock all reports', price: '₹199' },
  // Launch offer — Astropanth Plus for ₹1 (30 days) while we grow the user base.
  plus_launch: { id: 'plus_launch', label: 'Astropanth Plus — Launch', price: '₹1' },
} as const;

// When true, the paywall sells the ₹1 launch product instead of the regular
// monthly/yearly prices. Flip to false to switch to standard pricing.
export const LAUNCH_PRICING = true;

// Master switch for in-app language switching. Kept FALSE until localization is
// complete across all screens AND generated content, so users never see a
// half-translated app. When false: the picker is hidden and the app stays in
// English regardless of any saved choice or server `languages` rows. Flip to
// true only once every language is verified end-to-end.
export const LOCALIZATION_ENABLED = true;

// Feature gating toggle. When true, the detailed Reports require a `reports`
// (or `plus`) entitlement — obtained via a promo code today, and via Razorpay/
// Play once billing is wired. Set to false to make reports free for all
// signed-in users (e.g. during a growth push). Everything else stays free.
export const REPORTS_REQUIRE_ENTITLEMENT = false;
