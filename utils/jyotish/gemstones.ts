/**
 * utils/jyotish/gemstones.ts
 *
 * Deterministic Vedic gemstone (Ratna) recommendation from a birth chart.
 *
 * Method (classical Jyotish):
 *   - LIFE stone (Jeevan Ratna): the gemstone of the ASCENDANT (Lagna) lord — the
 *     planet ruling the rising sign. When no birth time is available we fall back
 *     to the MOON sign lord (Chandra rashi), the standard substitute, and say so.
 *   - LUCKY / FORTUNE stone (Bhagya Ratna): the gemstone of the 9th-house lord
 *     (house of fortune) — always a benefic trine lord.
 *   - CREATIVE stone (Vidya Ratna): the gemstone of the 5th-house lord — the other
 *     benefic trine lord.
 * Trine (1/5/9) lords are universally auspicious, so their gemstones are the safe,
 * traditional recommendation regardless of the rest of the chart.
 *
 * Gemstones are considered powerful in Jyotish, so every result carries a strong
 * "consult a qualified astrologer before wearing" caution (especially Blue Sapphire).
 */

import { computeKundli } from './kundli';
import type { EphemerisInput } from './ephemeris';

export type Planet =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

// Ruling planet of each rashi (1=Aries..12=Pisces).
const SIGN_LORD: Planet[] = [
  'Mars',    // Aries
  'Venus',   // Taurus
  'Mercury', // Gemini
  'Moon',    // Cancer
  'Sun',     // Leo
  'Mercury', // Virgo
  'Venus',   // Libra
  'Mars',    // Scorpio
  'Jupiter', // Sagittarius
  'Saturn',  // Capricorn
  'Saturn',  // Aquarius
  'Jupiter', // Pisces
];

export interface GemstoneInfo {
  planet: Planet;
  stone: string;      // English name
  hindi: string;      // common Hindi/market name
  finger: string;     // finger to wear
  metal: string;      // setting metal
  day: string;        // day to first wear
  mantra: string;     // beej mantra
  note: string;       // one-line significance
}

// Per-planet gemstone data (classical associations).
export const GEMSTONE_BY_PLANET: Record<Planet, GemstoneInfo> = {
  Sun:     { planet: 'Sun',     stone: 'Ruby',            hindi: 'Manikya',  finger: 'Ring finger', metal: 'Gold',            day: 'Sunday',    mantra: 'Om Suryaya Namah',    note: 'Vitality, confidence, authority and health.' },
  Moon:    { planet: 'Moon',    stone: 'Pearl',           hindi: 'Moti',     finger: 'Little finger', metal: 'Silver',        day: 'Monday',    mantra: 'Om Chandraya Namah',  note: 'Calm, emotional balance and mental peace.' },
  Mars:    { planet: 'Mars',    stone: 'Red Coral',       hindi: 'Moonga',   finger: 'Ring finger', metal: 'Gold/Copper',     day: 'Tuesday',   mantra: 'Om Mangalaya Namah',  note: 'Courage, energy, drive and stamina.' },
  Mercury: { planet: 'Mercury', stone: 'Emerald',         hindi: 'Panna',    finger: 'Little finger', metal: 'Gold',          day: 'Wednesday', mantra: 'Om Budhaya Namah',    note: 'Intellect, communication and business acumen.' },
  Jupiter: { planet: 'Jupiter', stone: 'Yellow Sapphire', hindi: 'Pukhraj',  finger: 'Index finger', metal: 'Gold',           day: 'Thursday',  mantra: 'Om Gurave Namah',     note: 'Wisdom, prosperity, growth and good fortune.' },
  Venus:   { planet: 'Venus',   stone: 'Diamond',         hindi: 'Heera',    finger: 'Middle/Little finger', metal: 'Platinum/Silver', day: 'Friday', mantra: 'Om Shukraya Namah', note: 'Love, luxury, comfort and artistry. (White Sapphire is a common substitute.)' },
  Saturn:  { planet: 'Saturn',  stone: 'Blue Sapphire',   hindi: 'Neelam',   finger: 'Middle finger', metal: 'Silver/Panchdhatu', day: 'Saturday', mantra: 'Om Shanaye Namah',  note: 'Discipline, focus and career — but very fast-acting; strict trial advised.' },
  Rahu:    { planet: 'Rahu',    stone: 'Hessonite',       hindi: 'Gomed',    finger: 'Middle finger', metal: 'Silver/Panchdhatu', day: 'Saturday', mantra: 'Om Rahave Namah',   note: 'Clarity through confusion; protection from hidden fears.' },
  Ketu:    { planet: 'Ketu',    stone: "Cat's Eye",       hindi: 'Lehsunia', finger: 'Middle finger', metal: 'Silver/Panchdhatu', day: 'Saturday', mantra: 'Om Ketave Namah',   note: 'Intuition, detachment and spiritual insight.' },
};

export interface GemstoneRecommendation {
  role: 'Life stone' | 'Lucky stone' | 'Creative stone';
  basis: string; // e.g. "Ascendant (Lagna) lord — Jupiter"
  info: GemstoneInfo;
}

export interface GemstoneResult {
  lagnaBased: boolean; // false => derived from Moon sign (no birth time)
  ascendantOrMoonSignName: string;
  recommendations: GemstoneRecommendation[]; // de-duplicated by stone
  primary: GemstoneRecommendation; // the life stone (first)
}

const RASHI_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];

/** House `n` (1-based) counted from a starting rashi (1-12) → rashi number (1-12). */
function rashiOfHouse(startRashi: number, house: number): number {
  return ((startRashi - 1 + (house - 1)) % 12) + 1;
}

/**
 * Compute gemstone recommendations for a birth chart. Uses the Ascendant when a
 * birth time is present; otherwise falls back to the Moon sign.
 */
export function recommendGemstones(input: EphemerisInput): GemstoneResult {
  const kundli = computeKundli(input);

  // Starting sign: Lagna if we have it, else the Moon sign.
  const lagnaBased = kundli.lagnaRashi != null;
  const startRashi = kundli.lagnaRashi ?? kundli.moonRashi;

  const lordOfHouse = (house: number): Planet => SIGN_LORD[rashiOfHouse(startRashi, house) - 1];

  const lifeLord = lordOfHouse(1);   // ascendant / moon-sign lord
  const luckLord = lordOfHouse(9);   // house of fortune
  const creativeLord = lordOfHouse(5); // house of creativity/intelligence

  const basisPrefix = lagnaBased ? 'Ascendant (Lagna)' : 'Moon sign (Chandra rashi)';

  const raw: GemstoneRecommendation[] = [
    { role: 'Life stone', basis: `${basisPrefix} lord — ${lifeLord}`, info: GEMSTONE_BY_PLANET[lifeLord] },
    { role: 'Lucky stone', basis: `9th-house (fortune) lord — ${luckLord}`, info: GEMSTONE_BY_PLANET[luckLord] },
    { role: 'Creative stone', basis: `5th-house (creativity) lord — ${creativeLord}`, info: GEMSTONE_BY_PLANET[creativeLord] },
  ];

  // De-duplicate by stone, keeping the highest-priority role (life > lucky > creative).
  const seen = new Set<string>();
  const recommendations: GemstoneRecommendation[] = [];
  for (const r of raw) {
    if (!seen.has(r.info.stone)) {
      seen.add(r.info.stone);
      recommendations.push(r);
    }
  }

  return {
    lagnaBased,
    ascendantOrMoonSignName: RASHI_NAMES[startRashi - 1],
    recommendations,
    primary: recommendations[0],
  };
}
