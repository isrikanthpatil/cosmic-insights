/**
 * utils/jyotish/interpret.ts
 *
 * Grounded, deterministic interpretation helpers for the detailed reports. We do
 * NOT invent fortune-telling narratives — we describe what a placement classically
 * signifies (planet significations + sign nature + house theme + dignity) and let
 * the reader reflect. Everything here is a lookup/template over real positions.
 */

export type Planet =
  | 'Sun' | 'Moon' | 'Mars' | 'Mercury' | 'Jupiter' | 'Venus' | 'Saturn' | 'Rahu' | 'Ketu';

// Ruling planet of each rashi (1=Aries..12=Pisces).
export const SIGN_LORD: Planet[] = [
  'Mars', 'Venus', 'Mercury', 'Moon', 'Sun', 'Mercury',
  'Venus', 'Mars', 'Jupiter', 'Saturn', 'Saturn', 'Jupiter',
];

export const SIGN_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
];
export const SIGN_SANSKRIT = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
];

export const PLANET_SIGNIFICATION: Record<Planet, string> = {
  Sun: 'soul, vitality, confidence, father and authority',
  Moon: 'mind, emotions, mother, comfort and intuition',
  Mars: 'energy, courage, drive, siblings and initiative',
  Mercury: 'intellect, communication, learning and commerce',
  Jupiter: 'wisdom, growth, fortune, teachers and dharma',
  Venus: 'love, relationships, beauty, comfort and the arts',
  Saturn: 'discipline, responsibility, career, patience and endurance',
  Rahu: 'ambition, innovation, foreign matters and sudden change',
  Ketu: 'detachment, spirituality, intuition and letting go',
};

export const SIGN_QUALITY = [
  'a fiery, cardinal sign — pioneering and bold',
  'an earthy, fixed sign — steady and grounded',
  'an airy, mutable sign — curious and communicative',
  'a watery, cardinal sign — nurturing and sensitive',
  'a fiery, fixed sign — confident and warm',
  'an earthy, mutable sign — analytical and precise',
  'an airy, cardinal sign — balanced and relational',
  'a watery, fixed sign — intense and transformative',
  'a fiery, mutable sign — philosophical and free',
  'an earthy, cardinal sign — disciplined and ambitious',
  'an airy, fixed sign — independent and original',
  'a watery, mutable sign — compassionate and imaginative',
];

export const HOUSE_THEME = [
  'self, body and personality',            // 1
  'wealth, family and speech',             // 2
  'courage, siblings and communication',   // 3
  'home, mother, comfort and property',    // 4
  'creativity, children and intellect',    // 5
  'health, service and daily work',        // 6
  'partnerships, marriage and business',   // 7
  'transformation, longevity and the hidden', // 8
  'fortune, dharma and higher learning',   // 9
  'career, status and public life',        // 10
  'gains, income and aspirations',         // 11
  'expenses, retreat and liberation',      // 12
];

// Planet dignity by sign (1-12): exaltation & debilitation signs.
const EXALT: Partial<Record<Planet, number>> = {
  Sun: 1, Moon: 2, Mars: 10, Mercury: 6, Jupiter: 4, Venus: 12, Saturn: 7,
};
const DEBIL: Partial<Record<Planet, number>> = {
  Sun: 7, Moon: 8, Mars: 4, Mercury: 12, Jupiter: 10, Venus: 6, Saturn: 1,
};

export function planetDignity(planet: Planet, rashi: number): string {
  if (EXALT[planet] === rashi) return 'exalted (very strong)';
  if (DEBIL[planet] === rashi) return 'debilitated (needs support)';
  if (SIGN_LORD[rashi - 1] === planet) return 'in its own sign (strong)';
  return '';
}

/** Degrees within the sign (0-30) → "12°34'" string. */
export function degWithinSign(siderealLongitude: number): string {
  const d = siderealLongitude % 30;
  const deg = Math.floor(d);
  const min = Math.floor((d - deg) * 60);
  return `${deg}°${String(min).padStart(2, '0')}'`;
}

/**
 * One grounded sentence for a planet's placement. `house` may be null (no birth
 * time) — then we describe by sign only.
 */
export function interpretPlacement(planet: Planet, rashi: number, house: number | null): string {
  const sign = SIGN_NAMES[rashi - 1];
  const quality = SIGN_QUALITY[rashi - 1];
  const dignity = planetDignity(planet, rashi);
  const dignityClause = dignity ? `, ${dignity},` : '';
  const base = `Your ${planet} (${PLANET_SIGNIFICATION[planet]}) is in ${sign}${dignityClause} ${quality}`;
  if (house) {
    return `${base}, placed in the ${ordinal(house)} house of ${HOUSE_THEME[house - 1]}. This colours those areas of life with ${planet}'s themes.`;
  }
  return `${base}. Add an exact birth time to see the house placement.`;
}

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
