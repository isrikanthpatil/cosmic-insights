/**
 * utils/jyotish/kundli.ts
 *
 * Assembles a full Vedic birth chart (Kundli) from the sidereal ephemeris:
 *   - all nine grahas with rashi, nakshatra, retrograde and whole-sign house
 *   - the Lagna (Ascendant) — only when a birth time is available
 *   - the Vimshottari Dasha timeline (Mahadasha + current Antardasha)
 *
 * Whole-sign houses (the classical Vedic default): house = position of a
 * graha's rashi counted from the Lagna rashi.
 * Vimshottari Dasha: the 120-year system seeded by the Moon's nakshatra; the
 * balance of the first Mahadasha is the unelapsed fraction of that nakshatra.
 */

import { parseDDMMYYYY } from '../dateUtils';
import { computeGrahas, EphemerisInput, GrahaName, GrahaPosition } from './ephemeris';

export const RASHI_NAMES = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces',
] as const;

export const RASHI_SANSKRIT = [
  'Mesha', 'Vrishabha', 'Mithuna', 'Karka', 'Simha', 'Kanya',
  'Tula', 'Vrishchika', 'Dhanu', 'Makara', 'Kumbha', 'Meena',
] as const;

export const NAKSHATRA_NAMES = [
  'Ashwini', 'Bharani', 'Krittika', 'Rohini', 'Mrigashira', 'Ardra',
  'Punarvasu', 'Pushya', 'Ashlesha', 'Magha', 'Purva Phalguni', 'Uttara Phalguni',
  'Hasta', 'Chitra', 'Swati', 'Vishakha', 'Anuradha', 'Jyeshtha',
  'Mula', 'Purva Ashadha', 'Uttara Ashadha', 'Shravana', 'Dhanishta', 'Shatabhisha',
  'Purva Bhadrapada', 'Uttara Bhadrapada', 'Revati',
] as const;

export interface NakshatraInfo {
  deity: string;
  symbol: string;
  gana: string; // Deva / Manushya / Rakshasa
  lord: GrahaName; // Vimshottari lord
  nature: string;
}

// The 27 nakshatras with their classical attributes (index = nakshatra - 1).
export const NAKSHATRA_INFO: NakshatraInfo[] = [
  { deity: 'Ashwini Kumaras', symbol: "Horse's head", gana: 'Deva', lord: 'Ketu', nature: 'Quick, pioneering and healing — swift to begin and eager to help.' },
  { deity: 'Yama', symbol: 'Yoni (bearer of new life)', gana: 'Manushya', lord: 'Venus', nature: 'Creative and determined, carrying things through cycles of restraint and transformation.' },
  { deity: 'Agni', symbol: 'Razor / flame', gana: 'Rakshasa', lord: 'Sun', nature: 'Sharp, purifying and driven — burns away impurity with focused will.' },
  { deity: 'Brahma (Prajapati)', symbol: 'Ox-cart / chariot', gana: 'Manushya', lord: 'Moon', nature: 'Fertile, sensual and creative — a nakshatra of growth and beauty.' },
  { deity: 'Soma (Chandra)', symbol: "Deer's head", gana: 'Deva', lord: 'Mars', nature: 'Curious, gentle and searching — forever seeking something finer.' },
  { deity: 'Rudra', symbol: 'Teardrop', gana: 'Manushya', lord: 'Rahu', nature: 'Intense and transformative — storms clear the way for renewal.' },
  { deity: 'Aditi', symbol: 'Quiver of arrows', gana: 'Deva', lord: 'Jupiter', nature: 'Optimistic and renewing — a spirit of return, recovery and fresh starts.' },
  { deity: 'Brihaspati', symbol: "Cow's udder / lotus", gana: 'Deva', lord: 'Saturn', nature: 'Nourishing and auspicious — caring, generous and spiritually inclined.' },
  { deity: 'The Nagas', symbol: 'Coiled serpent', gana: 'Rakshasa', lord: 'Mercury', nature: 'Intuitive and penetrating — mystical insight beneath a still surface.' },
  { deity: 'The Pitris (ancestors)', symbol: 'Royal throne', gana: 'Rakshasa', lord: 'Ketu', nature: 'Regal and ancestral — carries dignity, tradition and authority.' },
  { deity: 'Bhaga', symbol: 'Front legs of a bed', gana: 'Manushya', lord: 'Venus', nature: 'Warm and pleasure-loving — creative, relaxed and sociable.' },
  { deity: 'Aryaman', symbol: 'Back legs of a bed', gana: 'Manushya', lord: 'Sun', nature: 'Generous and reliable — steady friendship and dependable help.' },
  { deity: 'Savitar', symbol: 'Open hand', gana: 'Deva', lord: 'Moon', nature: 'Skilful and resourceful — clever hands and a knack for getting things done.' },
  { deity: 'Vishvakarma (Tvashtar)', symbol: 'Bright jewel', gana: 'Rakshasa', lord: 'Mars', nature: 'Artistic and charismatic — brilliance that draws the eye.' },
  { deity: 'Vayu', symbol: 'Young sprout / coral', gana: 'Deva', lord: 'Rahu', nature: 'Independent and adaptable — bends like the wind, self-reliant.' },
  { deity: 'Indra & Agni', symbol: 'Triumphal archway', gana: 'Rakshasa', lord: 'Jupiter', nature: 'Ambitious and goal-focused — determined toward a chosen aim.' },
  { deity: 'Mitra', symbol: 'Lotus', gana: 'Deva', lord: 'Saturn', nature: 'Devoted and disciplined — loyal friendship and steady effort.' },
  { deity: 'Indra', symbol: 'Earring / umbrella', gana: 'Rakshasa', lord: 'Mercury', nature: 'Senior and protective — courageous, responsible, a natural elder.' },
  { deity: 'Nirriti', symbol: 'Bunch of roots', gana: 'Rakshasa', lord: 'Ketu', nature: 'Investigative and transformative — gets to the root of things.' },
  { deity: 'Apas (the waters)', symbol: 'Winnowing basket / fan', gana: 'Manushya', lord: 'Venus', nature: 'Proud and persuasive — hard to defeat once resolved.' },
  { deity: 'Vishvedevas', symbol: 'Elephant tusk', gana: 'Manushya', lord: 'Sun', nature: 'Righteous and enduring — lasting victory through integrity.' },
  { deity: 'Vishnu', symbol: 'Ear / three footprints', gana: 'Deva', lord: 'Moon', nature: 'Attentive and learned — grows through listening and connection.' },
  { deity: 'The Vasus', symbol: 'Drum', gana: 'Rakshasa', lord: 'Mars', nature: 'Rhythmic and ambitious — energetic, musical, prosperity-minded.' },
  { deity: 'Varuna', symbol: 'Empty circle / 100 stars', gana: 'Rakshasa', lord: 'Rahu', nature: 'Healing and secretive — mystical, private, quietly powerful.' },
  { deity: 'Aja Ekapada', symbol: 'Sword / front of a cot', gana: 'Manushya', lord: 'Jupiter', nature: 'Idealistic and intense — passionate about deep transformation.' },
  { deity: 'Ahir Budhnya', symbol: 'Back of a cot / twins', gana: 'Manushya', lord: 'Saturn', nature: 'Wise and compassionate — deep, patient and far-seeing.' },
  { deity: 'Pushan', symbol: 'Fish / drum', gana: 'Deva', lord: 'Mercury', nature: 'Nurturing and protective — safe journeys, prosperity and care.' },
];

// Vimshottari Dasha lords in sequence, with their period lengths (total 120y).
const DASHA_ORDER: ReadonlyArray<{ lord: GrahaName; years: number }> = [
  { lord: 'Ketu', years: 7 },
  { lord: 'Venus', years: 20 },
  { lord: 'Sun', years: 6 },
  { lord: 'Moon', years: 10 },
  { lord: 'Mars', years: 7 },
  { lord: 'Rahu', years: 18 },
  { lord: 'Jupiter', years: 16 },
  { lord: 'Saturn', years: 19 },
  { lord: 'Mercury', years: 17 },
];
const NAK_SPAN = 360 / 27;
const YEAR_DAYS = 365.25;
const DAY_MS = 86400000;

const addYears = (d: Date, years: number): Date => new Date(d.getTime() + years * YEAR_DAYS * DAY_MS);

export interface DashaPeriod {
  lord: GrahaName;
  start: Date;
  end: Date;
  years: number;
}

export interface VimshottariResult {
  mahadashas: DashaPeriod[];
  currentMahaIndex: number;
  antardashas: DashaPeriod[]; // sub-periods within the current Mahadasha
  currentAntar: DashaPeriod | null;
}

/** Vimshottari Dasha from the sidereal Moon longitude and the birth datetime. */
export function computeVimshottari(moonSiderealLongitude: number, birth: Date): VimshottariResult {
  const nak = Math.floor(moonSiderealLongitude / NAK_SPAN) + 1; // 1-27
  const within = moonSiderealLongitude - (nak - 1) * NAK_SPAN;
  const fracElapsed = within / NAK_SPAN;
  const startIdx = (nak - 1) % 9;
  const balance = DASHA_ORDER[startIdx].years * (1 - fracElapsed);

  const mahadashas: DashaPeriod[] = [];
  let cursor = new Date(birth);
  // First (partial) Mahadasha — the balance of the birth-nakshatra lord.
  let end = addYears(cursor, balance);
  mahadashas.push({ lord: DASHA_ORDER[startIdx].lord, start: new Date(cursor), end, years: balance });
  cursor = end;
  // Remaining full Mahadashas (one full 120-year cycle onward).
  let idx = (startIdx + 1) % 9;
  for (let k = 0; k < 9; k++) {
    const y = DASHA_ORDER[idx].years;
    end = addYears(cursor, y);
    mahadashas.push({ lord: DASHA_ORDER[idx].lord, start: new Date(cursor), end, years: y });
    cursor = end;
    idx = (idx + 1) % 9;
  }

  const now = new Date();
  let currentMahaIndex = mahadashas.findIndex((m) => now >= m.start && now < m.end);
  if (currentMahaIndex < 0) currentMahaIndex = now < mahadashas[0].start ? 0 : mahadashas.length - 1;

  // Antardashas (bhuktis) within the current Mahadasha, starting from its lord.
  const maha = mahadashas[currentMahaIndex];
  const mahaLordIdx = DASHA_ORDER.findIndex((d) => d.lord === maha.lord);
  const antardashas: DashaPeriod[] = [];
  let ac = new Date(maha.start);
  for (let k = 0; k < 9; k++) {
    const al = DASHA_ORDER[(mahaLordIdx + k) % 9];
    const ay = maha.years * (al.years / 120);
    const aEnd = addYears(ac, ay);
    antardashas.push({ lord: al.lord, start: new Date(ac), end: aEnd, years: ay });
    ac = aEnd;
  }
  const currentAntar = antardashas.find((a) => now >= a.start && now < a.end) ?? null;

  return { mahadashas, currentMahaIndex, antardashas, currentAntar };
}

export interface ChartGraha extends GrahaPosition {
  house: number | null; // 1-12 whole-sign from Lagna, null if no birth time
  rashiName: string;
  nakshatraName: string;
}

export interface Kundli {
  grahas: ChartGraha[];
  lagnaRashi: number | null;
  lagnaName: string | null;
  moonRashi: number;
  moonRashiName: string;
  moonNakshatra: number;
  moonNakshatraName: string;
  moonPada: number;
  dasha: VimshottariResult | null;
  ayanamsa: number;
  lowConfidence: boolean;
}

/** Build the full Kundli (grahas + houses + Lagna + Vimshottari Dasha). */
export function computeKundli(input: EphemerisInput): Kundli {
  const c = computeGrahas(input);
  const houseOf = (rashi: number): number | null =>
    c.lagnaRashi ? ((rashi - c.lagnaRashi + 12) % 12) + 1 : null;

  const grahas: ChartGraha[] = c.grahas.map((g) => ({
    ...g,
    house: houseOf(g.rashi),
    rashiName: RASHI_NAMES[g.rashi - 1],
    nakshatraName: NAKSHATRA_NAMES[g.nakshatra - 1],
  }));

  // Birth datetime for the Dasha (date + time; noon if no time).
  const d = parseDDMMYYYY(input.dateOfBirth);
  let dasha: VimshottariResult | null = null;
  if (d) {
    let hh = 12, mm = 0;
    if (input.timeOfBirth && /^\d{1,2}:\d{2}$/.test(input.timeOfBirth.trim())) {
      const [h, m] = input.timeOfBirth.trim().split(':').map((s) => parseInt(s, 10));
      if (!isNaN(h) && !isNaN(m)) { hh = h; mm = m; }
    }
    const birth = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hh, mm);
    dasha = computeVimshottari(c.moonSiderealLongitude, birth);
  }

  return {
    grahas,
    lagnaRashi: c.lagnaRashi,
    lagnaName: c.lagnaRashi ? RASHI_NAMES[c.lagnaRashi - 1] : null,
    moonRashi: c.moonRashi,
    moonRashiName: RASHI_NAMES[c.moonRashi - 1],
    moonNakshatra: c.moonNakshatra,
    moonNakshatraName: NAKSHATRA_NAMES[c.moonNakshatra - 1],
    moonPada: c.moonPada,
    dasha,
    ayanamsa: c.ayanamsa,
    lowConfidence: c.lowConfidence,
  };
}
