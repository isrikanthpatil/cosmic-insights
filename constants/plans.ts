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
  /** Display price string. PLACEHOLDER — not a real charge. */
  displayPrice: string;
  /** Optional secondary note (e.g. effective monthly price for yearly). */
  note?: string;
}

// PLACEHOLDER PRICING — amounts below are illustrative TODOs and are NOT wired
// to any payment provider. Replace with real store/RevenueCat product prices
// once a billing provider is chosen.
export const plusPrices: PlanPrice[] = [
  {
    id: 'monthly',
    period: 'per month',
    displayPrice: '₹199/mo', // TODO(placeholder): real price from billing provider
  },
  {
    id: 'yearly',
    period: 'per year',
    displayPrice: '₹1,499/yr', // TODO(placeholder): real price from billing provider
    note: 'Best value — about ₹125/mo',
  },
];

// Marketing copy for the paywall hero, kept here so it stays consistent.
export const plusPlanName = 'Astropanth Plus';
export const plusTagline = 'Unlock the full cosmos';

// Master switch for showing real "Buy" buttons (Razorpay on web). Keep false
// until you're ready to charge — the checkout route is built and testable by
// flipping this to true (promo codes work regardless).
export const BILLING_ENABLED = false;

// Purchasable items. `id` maps to the server-side catalog in razorpay.pb.js
// (which holds the authoritative amounts so the client can't tamper with price).
export const PRODUCTS = {
  plus_monthly: { id: 'plus_monthly', label: 'Astropanth Plus — Monthly', price: '₹99/mo' },
  plus_yearly: { id: 'plus_yearly', label: 'Astropanth Plus — Yearly', price: '₹499/yr' },
  reports_all: { id: 'reports_all', label: 'Unlock all reports', price: '₹149' },
} as const;

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
