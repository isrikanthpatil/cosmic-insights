// Numerology utility calculators — lucky mobile number, business/name number, and
// vehicle number. These are deterministic "number vibration" tools grounded in the
// same 1–9 planet system used by the main numerology reading. Compatibility with the
// user's own Mulank (birth number) uses classical graha-maitri (planetary friendship),
// framed cautiously as one traditional system rather than absolute fact.

// Chaldean letter values — the traditional system for name numerology in India.
// (Chaldean assigns no letter to 9, which is considered sacred.)
const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

/** Reduce a number to a single digit 1–9 (0 maps to 9). */
export function reduceToSingle(n: number): number {
  let x = Math.abs(Math.trunc(n));
  while (x > 9) {
    x = x.toString().split('').reduce((a, d) => a + parseInt(d, 10), 0);
  }
  return x === 0 ? 9 : x;
}

/** Sum only the numeric digits in a string. */
function digitsSum(s: string): number {
  return (s.match(/\d/g) ?? []).reduce((a, d) => a + parseInt(d, 10), 0);
}

/** Chaldean value of a name/word (letters only). Returns compound total + single. */
function chaldeanValue(s: string): { total: number; single: number } {
  const total = s
    .toUpperCase()
    .split('')
    .reduce((a, ch) => a + (CHALDEAN[ch] ?? 0), 0);
  return { total, single: reduceToSingle(total) };
}

// Ruling graha per number (matches NUMBER_KNOWLEDGE in numerology.ts).
export const NUMBER_PLANET: Record<number, string> = {
  1: 'Sun (Surya)', 2: 'Moon (Chandra)', 3: 'Jupiter (Guru)', 4: 'Rahu',
  5: 'Mercury (Budha)', 6: 'Venus (Shukra)', 7: 'Ketu', 8: 'Saturn (Shani)', 9: 'Mars (Mangala)',
};

// Short "vibration" line per number for these tools (planet-consistent, concise).
export const NUMBER_VIBE: Record<number, string> = {
  1: 'Leadership, name and recognition, bold new beginnings (Sun).',
  2: 'Harmony, partnership and sensitivity; good for relationships (Moon).',
  3: 'Growth, wisdom, popularity and expansion (Jupiter).',
  4: 'Hard work and unconventional paths, with sudden ups and downs (Rahu).',
  5: 'Communication, commerce and quick adaptability — very business-friendly (Mercury).',
  6: 'Comfort, attraction, beauty and relationships (Venus).',
  7: 'Research, depth and spirituality — reflective rather than commercial (Ketu).',
  8: 'Discipline and lasting results that often come slowly, after effort (Saturn).',
  9: 'Energy, courage and drive (Mars).',
};

// Classical graha-friendship, mapped to numbers (Rahu≈4 grouped with Saturn/earthy,
// Ketu≈7 grouped with Mars/spiritual). Curated; framed as "one traditional system".
const FRIENDS: Record<number, number[]> = {
  1: [1, 2, 3, 9], 2: [1, 2, 3, 5], 3: [1, 2, 3, 9], 4: [1, 2, 4, 7],
  5: [1, 5, 6], 6: [5, 6, 8], 7: [1, 2, 4, 7], 8: [5, 6, 8], 9: [1, 2, 3, 9],
};
const ENEMIES: Record<number, number[]> = {
  1: [6, 8], 2: [], 3: [5, 6], 4: [], 5: [2],
  6: [1, 2], 7: [], 8: [1, 2, 9], 9: [5],
};

export type Relation = 'friendly' | 'neutral' | 'challenging';

/** How the item's number relates to the user's Mulank, per traditional friendship. */
export function relationTo(itemNumber: number, mulank: number): Relation {
  if (FRIENDS[mulank]?.includes(itemNumber)) return 'friendly';
  if (ENEMIES[mulank]?.includes(itemNumber)) return 'challenging';
  return 'neutral';
}

function relationNote(rel: Relation, itemNumber: number, mulank: number): string {
  const p = NUMBER_PLANET[itemNumber];
  const mp = NUMBER_PLANET[mulank];
  if (rel === 'friendly')
    return `In traditional number-friendship, ${itemNumber} (${p}) is supportive for your Mulank ${mulank} (${mp}) — a harmonious, favourable vibration for you.`;
  if (rel === 'challenging')
    return `In traditional number-friendship, ${itemNumber} (${p}) is considered challenging for your Mulank ${mulank} (${mp}). It isn't "bad", but many prefer a friendlier total.`;
  return `${itemNumber} (${p}) is neutral for your Mulank ${mulank} (${mp}) — neither especially supportive nor challenging.`;
}

export interface ToolResult {
  number: number;          // final single-digit result
  total: number;           // raw compound total before reduction
  vibe: string;            // meaning of the result number
  verdict: string;         // favourability guidance for this use
  relation?: Relation;     // vs the user's Mulank (if provided)
  relationNote?: string;
}

// Numbers traditionally regarded as favourable for commercial/asset use (framed softly).
const BUSINESS_FAVOURABLE = [1, 3, 5, 6, 9];
const ASSET_CAUTION = [4, 8]; // some traditions use 4/8 carefully for vehicles/business

function verdictFor(kind: 'mobile' | 'business' | 'vehicle', n: number): string {
  if (kind === 'business') {
    if (BUSINESS_FAVOURABLE.includes(n))
      return `Total ${n} is traditionally seen as favourable for business and visibility.`;
    if (ASSET_CAUTION.includes(n))
      return `Total ${n} is a hard-working number that some traditions use carefully for business — it can bring slow, effortful growth. Consider it alongside your own Mulank.`;
    return `Total ${n} is a workable, neutral number for a business name.`;
  }
  if (kind === 'vehicle') {
    if (ASSET_CAUTION.includes(n))
      return `Total ${n} is often used carefully for vehicles in traditional practice; a friendlier total to your Mulank is usually preferred.`;
    return `Total ${n} is generally considered a fine, active vibration for a vehicle.`;
  }
  // mobile
  return `Your mobile's vibration reduces to ${n}. What matters most is how it sits with your own Mulank (below).`;
}

/** Lucky mobile number: reduce all digits, interpret, compare with the user's Mulank. */
export function analyzeMobile(raw: string, mulank?: number): ToolResult {
  const total = digitsSum(raw);
  const number = reduceToSingle(total);
  const res: ToolResult = { number, total, vibe: NUMBER_VIBE[number], verdict: verdictFor('mobile', number) };
  if (mulank) { res.relation = relationTo(number, mulank); res.relationNote = relationNote(res.relation, number, mulank); }
  return res;
}

/** Business / brand name: Chaldean value, interpret, compare with the user's Mulank. */
export function analyzeName(name: string, mulank?: number): ToolResult {
  const { total, single } = chaldeanValue(name);
  const res: ToolResult = { number: single, total, vibe: NUMBER_VIBE[single], verdict: verdictFor('business', single) };
  if (mulank) { res.relation = relationTo(single, mulank); res.relationNote = relationNote(res.relation, single, mulank); }
  return res;
}

/** Vehicle number: Chaldean letters + numeric digits together, interpret, compare. */
export function analyzeVehicle(reg: string, mulank?: number): ToolResult {
  const letters = chaldeanValue(reg).total;
  const digits = digitsSum(reg);
  const total = letters + digits;
  const number = reduceToSingle(total);
  const res: ToolResult = { number, total, vibe: NUMBER_VIBE[number], verdict: verdictFor('vehicle', number) };
  if (mulank) { res.relation = relationTo(number, mulank); res.relationNote = relationNote(res.relation, number, mulank); }
  return res;
}
