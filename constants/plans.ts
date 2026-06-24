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
  { label: 'Basic compatibility check' },
  { label: '2 free AskAstro questions/day' },
];

// What "Astropanth Plus" will unlock. These are presentational only for now —
// the Subscribe flow is not wired to any billing provider yet.
export const plusFeatures: PlanFeature[] = [
  { label: 'Unlimited AskAstro' },
  { label: 'Detailed compatibility & Kundli matching reports' },
  { label: 'Full Vedic Kundli (coming soon)' },
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
