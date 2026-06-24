/**
 * utils/jyotish/ashtakoota.ts
 *
 * Deterministic Ashtakoota Guna Milan (8-koota, 36-point) matching engine.
 * Pure TypeScript, no LLM, no UI. The classical tables below are transcribed
 * verbatim from the validated "Astropanth Kundli Matching Knowledge Compendium"
 * (gen_kundli.js). Where classical sources disagree, the AstroSage convention is
 * used and noted per koota.
 *
 * Inputs per person: { nakshatra (1-27), moonRashi (1-12),
 *   marsSiderealLongitude (deg), moonSiderealLongitude? (deg, for Moon-house
 *   Mangal), lagnaRashi? (1-12, optional) }.
 *
 * Output: full per-koota breakdown, total/36, band, and dosha flags.
 * All interpretation text is minimal/neutral and curated — the AI phrases it.
 */

export type Gender = 'male' | 'female';

export interface PersonChart {
  nakshatra: number; // 1-27 (Ashwini=1 ... Revati=27)
  moonRashi: number; // 1-12 (Aries=1 ... Pisces=12)
  marsSiderealLongitude: number; // deg 0-360 (Lahiri)
  moonSiderealLongitude?: number; // deg 0-360 — for Mars-from-Moon house calc
  lagnaRashi?: number; // 1-12, optional (ascendant)
  gender?: Gender; // affects Gana (Deva-Manushya) and Varna directionality
}

export interface KootaScore {
  name: string;
  points: number;
  max: number;
  note: string; // short, neutral, curated
}

export interface DoshaFlags {
  nadiDosha: boolean; // same Nadi
  bhakootDosha: boolean; // 2-12 / 5-9 / 6-8
  bhakootPair: '2-12' | '5-9' | '6-8' | null;
  mangalDoshaMale: boolean; // Mars in 1/2/4/7/8/12 from Moon (baseline)
  mangalDoshaFemale: boolean;
  mangalReference: 'moon' | 'lagna'; // which reference was used
}

export type Band =
  | 'Not recommended'
  | 'Average'
  | 'Good'
  | 'Excellent';

export interface AshtakootaResult {
  varna: KootaScore;
  vashya: KootaScore;
  tara: KootaScore;
  yoni: KootaScore;
  grahaMaitri: KootaScore;
  gana: KootaScore;
  bhakoot: KootaScore;
  nadi: KootaScore;
  total: number; // out of 36
  max: 36;
  band: Band;
  doshas: DoshaFlags;
}

/* ------------------------------------------------------------------ *
 *  STATIC CLASSICAL TABLES (transcribed from the compendium)         *
 * ------------------------------------------------------------------ */

// 1-based rashi names (index 0 unused) for readable notes.
const RASHI_NAMES = [
  '',
  'Aries',
  'Taurus',
  'Gemini',
  'Cancer',
  'Leo',
  'Virgo',
  'Libra',
  'Scorpio',
  'Sagittarius',
  'Capricorn',
  'Aquarius',
  'Pisces',
];

/* --- VARNA (max 1) ---
 * Convention (AstroSage / standard): Brahmin>Kshatriya>Vaishya>Shudra by
 * elemental triplicity. 1 point if groom's varna rank >= bride's, else 0.
 * Rank: Brahmin=4, Kshatriya=3, Vaishya=2, Shudra=1.
 * Water=Brahmin, Fire=Kshatriya, Earth=Vaishya, Air=Shudra.
 */
const VARNA_RANK_BY_RASHI: Record<number, number> = {
  1: 3, // Aries  - Fire  - Kshatriya
  2: 2, // Taurus - Earth - Vaishya
  3: 1, // Gemini - Air   - Shudra
  4: 4, // Cancer - Water - Brahmin
  5: 3, // Leo    - Fire  - Kshatriya
  6: 2, // Virgo  - Earth - Vaishya
  7: 1, // Libra  - Air   - Shudra
  8: 4, // Scorpio- Water - Brahmin
  9: 3, // Sagittarius - Fire - Kshatriya
  10: 2, // Capricorn - Earth - Vaishya
  11: 1, // Aquarius  - Air   - Shudra
  12: 4, // Pisces - Water - Brahmin
};
const VARNA_NAME = ['', 'Shudra', 'Vaishya', 'Kshatriya', 'Brahmin'];

/* --- VASHYA (max 2) ---
 * Five groups. Note the split signs: Sagittarius (1st half=Human, 2nd half=
 * Quadruped) and Capricorn (1st half=Quadruped, 2nd half=Water). Because the
 * engine receives only the rashi (not the exact degree), we follow AstroSage's
 * displayed mapping which lists the whole-sign dominant group:
 *   Quadruped: Aries, Taurus, (2nd half Sagittarius), (1st half Capricorn)
 *   Human:     Gemini, Virgo, Libra, (1st half Sagittarius), Aquarius
 *   Water:     Cancer, Pisces, (2nd half Capricorn)
 *   Wild:      Leo
 *   Insect:    Scorpio
 * We resolve the split signs by whole-sign default: Sagittarius=Human,
 * Capricorn=Quadruped (AstroSage's whole-sign display). A finer degree-based
 * split can be added later if pada/degree is threaded through.
 * Groups: 0=Quadruped(Chatushpada),1=Human(Manava),2=Water(Jalachara),
 *         3=Wild(Vanachara),4=Insect(Keeta).
 */
const VASHYA_GROUP_BY_RASHI: Record<number, number> = {
  1: 0, // Aries  - Quadruped
  2: 0, // Taurus - Quadruped
  3: 1, // Gemini - Human
  4: 2, // Cancer - Water
  5: 3, // Leo    - Wild
  6: 1, // Virgo  - Human
  7: 1, // Libra  - Human
  8: 4, // Scorpio- Insect
  9: 1, // Sagittarius - Human (whole-sign default)
  10: 0, // Capricorn  - Quadruped (whole-sign default)
  11: 1, // Aquarius   - Human
  12: 2, // Pisces - Water
};
const VASHYA_NAME = ['Quadruped', 'Human', 'Water', 'Wild', 'Insect'];

/* Vashya 5x5 matrix (rows = person A group, cols = person B group). Frozen from
 * the widely-published AstroSage-style matrix. Anchors per compendium:
 * same-group / canonical compatible = 2; prey-predator = 1; intermediate = 0.5;
 * hostile = 0. (Symmetric here; direction is not material in the standard table.)
 *           Quad  Human Water Wild  Insect
 */
const VASHYA_MATRIX: number[][] = [
  /*Quad  */ [2, 1, 1, 1, 0.5],
  /*Human */ [0.5, 2, 1, 0, 1],
  /*Water */ [1, 1, 2, 0, 1],
  /*Wild  */ [1, 0, 0, 2, 1],
  /*Insect*/ [0.5, 1, 1, 1, 2],
];

/* --- TARA (max 3) --- counting nakshatras both ways, mod 9.
 * Convention (AstroSage / common software): an EVEN remainder (2,4,6,8) and 0
 * (=9, Param Mitra) is auspicious; ODD remainder (1,3,5,7) is inauspicious.
 * Both auspicious -> 3; one auspicious -> 1.5; none -> 0.
 */

/* --- YONI (max 4) --- 14 animal yonis. Nakshatra(1-27) -> yoni index.
 * Transcribed from the compendium yoni table. Yoni indices:
 * 0 Horse,1 Elephant,2 Sheep,3 Serpent,4 Dog,5 Cat,6 Rat,7 Cow,8 Buffalo,
 * 9 Tiger,10 Deer,11 Monkey,12 Lion,13 Mongoose.
 * (Ashwini=1 ... Revati=27.)
 */
const YONI_BY_NAKSHATRA: number[] = [
  0, // 1  Ashwini      Horse
  1, // 2  Bharani      Elephant
  2, // 3  Krittika     Sheep
  3, // 4  Rohini       Serpent
  3, // 5  Mrigashira   Serpent
  4, // 6  Ardra        Dog
  5, // 7  Punarvasu    Cat
  2, // 8  Pushya       Sheep
  5, // 9  Ashlesha     Cat
  6, // 10 Magha        Rat
  6, // 11 Purva Phalguni Rat
  7, // 12 Uttara Phalguni Cow
  8, // 13 Hasta        Buffalo
  9, // 14 Chitra       Tiger
  8, // 15 Swati        Buffalo
  9, // 16 Vishakha     Tiger
  10, // 17 Anuradha     Deer
  10, // 18 Jyeshtha     Deer
  4, // 19 Mula         Dog
  11, // 20 Purva Ashadha Monkey
  13, // 21 Uttara Ashadha Mongoose
  11, // 22 Shravana     Monkey
  12, // 23 Dhanishtha   Lion
  0, // 24 Shatabhisha  Horse
  12, // 25 Purva Bhadrapada Lion
  7, // 26 Uttara Bhadrapada Cow
  1, // 27 Revati       Elephant
];
const YONI_NAME = [
  'Horse',
  'Elephant',
  'Sheep',
  'Serpent',
  'Dog',
  'Cat',
  'Rat',
  'Cow',
  'Buffalo',
  'Tiger',
  'Deer',
  'Monkey',
  'Lion',
  'Mongoose',
];

/* The 7 sworn-enemy (0-point) yoni pairs from the compendium:
 * Cow-Tiger, Elephant-Lion, Horse-Buffalo, Dog-Deer, Cat-Rat,
 * Serpent-Mongoose, Sheep-Monkey.
 */
const YONI_ENEMY_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [7, 9], // Cow - Tiger
  [1, 12], // Elephant - Lion
  [0, 8], // Horse - Buffalo
  [4, 10], // Dog - Deer
  [5, 6], // Cat - Rat
  [3, 13], // Serpent - Mongoose
  [2, 11], // Sheep - Monkey
];

/* Friendly yoni pairs (score 3) — common AstroSage-style friend list. Pairs not
 * same, not friend, not enemy fall to neutral (2). The compendium also allows a
 * 1-point "mildly inimical" band; AstroSage's mainstream engine collapses most
 * non-friend/non-enemy to neutral=2, so we use 4/3/2/0 with the enemy pairs at
 * 0, and reserve 1 for the documented mildly-inimical set (kept empty by default
 * to match AstroSage's common output; documented for future tuning).
 */
const YONI_FRIEND_PAIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 2], // Horse - Sheep
  [1, 7], // Elephant - Cow
  [3, 5], // Serpent - Cat
  [4, 11], // Dog - Monkey
  [10, 12], // Deer - Lion
  [6, 13], // Rat - Mongoose
  [8, 9], // Buffalo - Tiger
];

/* --- GRAHA MAITRI (max 5) --- rashi -> lord, then natural friendship.
 * Lord indices: 0 Sun,1 Moon,2 Mars,3 Mercury,4 Jupiter,5 Venus,6 Saturn.
 */
const LORD_BY_RASHI: Record<number, number> = {
  1: 2, // Aries  - Mars
  2: 5, // Taurus - Venus
  3: 3, // Gemini - Mercury
  4: 1, // Cancer - Moon
  5: 0, // Leo    - Sun
  6: 3, // Virgo  - Mercury
  7: 5, // Libra  - Venus
  8: 2, // Scorpio- Mars
  9: 4, // Sagittarius - Jupiter
  10: 6, // Capricorn  - Saturn
  11: 6, // Aquarius   - Saturn
  12: 4, // Pisces - Jupiter
};
const LORD_NAME = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

/* Naisargika (natural permanent) friendship. relation[a][b]:
 * 1 = friend, 0 = neutral, -1 = enemy. From the compendium table.
 * Order: 0 Sun,1 Moon,2 Mars,3 Mercury,4 Jupiter,5 Venus,6 Saturn.
 */
const FRIENDSHIP: number[][] = [
  /* Sun     */ [/*Su*/ 0, /*Mo*/ 1, /*Ma*/ 1, /*Me*/ 0, /*Ju*/ 1, /*Ve*/ -1, /*Sa*/ -1],
  /* Moon    */ [1, 0, 0, 1, 0, 0, 0],
  /* Mars    */ [1, 1, 0, -1, 1, 0, 0],
  /* Mercury */ [1, -1, 0, 0, 0, 1, 0],
  /* Jupiter */ [1, 1, 1, -1, 0, -1, 0],
  /* Venus   */ [-1, -1, 0, 1, 0, 0, 1],
  /* Saturn  */ [-1, -1, -1, 1, 0, 1, 0],
];

/* --- GANA (max 6) --- nakshatra -> gana. 0 Deva,1 Manushya,2 Rakshasa. */
const GANA_BY_NAKSHATRA: number[] = [
  0, // 1  Ashwini      Deva
  1, // 2  Bharani      Manushya
  2, // 3  Krittika     Rakshasa
  1, // 4  Rohini       Manushya
  0, // 5  Mrigashira   Deva
  1, // 6  Ardra        Manushya
  0, // 7  Punarvasu    Deva
  0, // 8  Pushya       Deva
  2, // 9  Ashlesha     Rakshasa
  2, // 10 Magha        Rakshasa
  1, // 11 Purva Phalguni Manushya
  1, // 12 Uttara Phalguni Manushya
  0, // 13 Hasta        Deva
  2, // 14 Chitra       Rakshasa
  0, // 15 Swati        Deva
  2, // 16 Vishakha     Rakshasa
  0, // 17 Anuradha     Deva
  2, // 18 Jyeshtha     Rakshasa
  2, // 19 Mula         Rakshasa
  1, // 20 Purva Ashadha Manushya
  1, // 21 Uttara Ashadha Manushya
  0, // 22 Shravana     Deva
  2, // 23 Dhanishtha   Rakshasa
  2, // 24 Shatabhisha  Rakshasa
  1, // 25 Purva Bhadrapada Manushya
  1, // 26 Uttara Bhadrapada Manushya
  0, // 27 Revati       Deva
];
const GANA_NAME = ['Deva', 'Manushya', 'Rakshasa'];

/* Gana 3x3 scoring matrix (rows = GROOM, cols = BRIDE) per compendium /
 * drikpanchang / AstroSage style:
 *            Deva Manushya Rakshasa
 *  Deva       6     6        1
 *  Manushya   5     6        0
 *  Rakshasa   1     0        6
 */
const GANA_MATRIX: number[][] = [
  [6, 6, 1],
  [5, 6, 0],
  [1, 0, 6],
];

/* --- NADI (max 8) --- nakshatra -> nadi. 0 Aadi,1 Madhya,2 Antya. */
const NADI_BY_NAKSHATRA: number[] = [
  0, // 1  Ashwini      Aadi
  1, // 2  Bharani      Madhya
  2, // 3  Krittika     Antya
  2, // 4  Rohini       Antya
  1, // 5  Mrigashira   Madhya
  0, // 6  Ardra        Aadi
  0, // 7  Punarvasu    Aadi
  1, // 8  Pushya       Madhya
  2, // 9  Ashlesha     Antya
  2, // 10 Magha        Antya
  1, // 11 Purva Phalguni Madhya
  0, // 12 Uttara Phalguni Aadi
  0, // 13 Hasta        Aadi
  1, // 14 Chitra       Madhya
  2, // 15 Swati        Antya
  2, // 16 Vishakha     Antya
  1, // 17 Anuradha     Madhya
  0, // 18 Jyeshtha     Aadi
  0, // 19 Mula         Aadi
  1, // 20 Purva Ashadha Madhya
  2, // 21 Uttara Ashadha Antya
  2, // 22 Shravana     Antya
  1, // 23 Dhanishtha   Madhya
  0, // 24 Shatabhisha  Aadi
  0, // 25 Purva Bhadrapada Aadi
  1, // 26 Uttara Bhadrapada Madhya
  2, // 27 Revati       Antya
];
const NADI_NAME = ['Aadi', 'Madhya', 'Antya'];

/* ------------------------------------------------------------------ *
 *  PER-KOOTA FUNCTIONS                                                *
 * ------------------------------------------------------------------ */

function clampRashi(r: number): number {
  return ((((r - 1) % 12) + 12) % 12) + 1;
}

/** Forward count from rashi `from` to rashi `to`, inclusive (1..12). */
function rashiDistance(from: number, to: number): number {
  return ((to - from + 12) % 12) + 1;
}

/** 1. Varna — groom rank >= bride rank => 1 else 0. Needs genders. */
function scoreVarna(male: PersonChart, female: PersonChart): KootaScore {
  const gRank = VARNA_RANK_BY_RASHI[clampRashi(male.moonRashi)];
  const bRank = VARNA_RANK_BY_RASHI[clampRashi(female.moonRashi)];
  const points = gRank >= bRank ? 1 : 0;
  return {
    name: 'Varna',
    points,
    max: 1,
    note: `Groom ${VARNA_NAME[gRank]}, bride ${VARNA_NAME[bRank]}.`,
  };
}

/** 2. Vashya — 5x5 matrix lookup. */
function scoreVashya(male: PersonChart, female: PersonChart): KootaScore {
  const g = VASHYA_GROUP_BY_RASHI[clampRashi(male.moonRashi)];
  const b = VASHYA_GROUP_BY_RASHI[clampRashi(female.moonRashi)];
  const points = VASHYA_MATRIX[g][b];
  return {
    name: 'Vashya',
    points,
    max: 2,
    note: `Groom ${VASHYA_NAME[g]}, bride ${VASHYA_NAME[b]}.`,
  };
}

/** Tara number from a forward nakshatra count, mod 9 (0 -> 9). */
function taraNumber(fromNak: number, toNak: number): number {
  const count = ((toNak - fromNak + 27) % 27) + 1;
  const rem = count % 9;
  return rem === 0 ? 9 : rem;
}
function taraAuspicious(t: number): boolean {
  return t === 9 || t % 2 === 0; // even or 9 (Param Mitra)
}

/** 3. Tara — count both ways; both good=3, one=1.5, none=0. */
function scoreTara(male: PersonChart, female: PersonChart): KootaScore {
  // From bride to groom and groom to bride (compendium method).
  const t1 = taraNumber(female.nakshatra, male.nakshatra);
  const t2 = taraNumber(male.nakshatra, female.nakshatra);
  const a1 = taraAuspicious(t1);
  const a2 = taraAuspicious(t2);
  const goodCount = (a1 ? 1 : 0) + (a2 ? 1 : 0);
  const points = goodCount === 2 ? 3 : goodCount === 1 ? 1.5 : 0;
  return {
    name: 'Tara',
    points,
    max: 3,
    note: `Tara counts ${t1}/${t2} (${goodCount} of 2 favourable).`,
  };
}

/** 4. Yoni — same=4, friend=3, neutral=2, enemy=0. */
function scoreYoni(male: PersonChart, female: PersonChart): KootaScore {
  const yg = YONI_BY_NAKSHATRA[male.nakshatra - 1];
  const yb = YONI_BY_NAKSHATRA[female.nakshatra - 1];
  let points: number;
  if (yg === yb) {
    points = 4;
  } else if (YONI_ENEMY_PAIRS.some(([a, b]) => (a === yg && b === yb) || (a === yb && b === yg))) {
    points = 0;
  } else if (YONI_FRIEND_PAIRS.some(([a, b]) => (a === yg && b === yb) || (a === yb && b === yg))) {
    points = 3;
  } else {
    points = 2; // neutral
  }
  return {
    name: 'Yoni',
    points,
    max: 4,
    note: `Groom ${YONI_NAME[yg]}, bride ${YONI_NAME[yb]}.`,
  };
}

/** 5. Graha Maitri — mutual lord friendship banding 5/4/3/1/0.5/0. */
function scoreGrahaMaitri(male: PersonChart, female: PersonChart): KootaScore {
  const lg = LORD_BY_RASHI[clampRashi(male.moonRashi)];
  const lb = LORD_BY_RASHI[clampRashi(female.moonRashi)];
  let points: number;
  if (lg === lb) {
    points = 5; // same lord
  } else {
    const ab = FRIENDSHIP[lg][lb]; // lord A toward lord B
    const ba = FRIENDSHIP[lb][lg]; // lord B toward lord A
    const friends = (ab === 1 ? 1 : 0) + (ba === 1 ? 1 : 0);
    const enemies = (ab === -1 ? 1 : 0) + (ba === -1 ? 1 : 0);
    const neutrals = (ab === 0 ? 1 : 0) + (ba === 0 ? 1 : 0);
    if (friends === 2) points = 5;
    else if (friends === 1 && neutrals === 1) points = 4;
    else if (neutrals === 2) points = 3;
    else if (friends === 1 && enemies === 1) points = 1;
    else if (neutrals === 1 && enemies === 1) points = 0.5;
    else points = 0; // both enemies
  }
  return {
    name: 'Graha Maitri',
    points,
    max: 5,
    note: `Lords ${LORD_NAME[lg]} & ${LORD_NAME[lb]}.`,
  };
}

/** 6. Gana — 3x3 matrix (rows groom, cols bride). */
function scoreGana(male: PersonChart, female: PersonChart): KootaScore {
  const gg = GANA_BY_NAKSHATRA[male.nakshatra - 1];
  const gb = GANA_BY_NAKSHATRA[female.nakshatra - 1];
  const points = GANA_MATRIX[gg][gb];
  return {
    name: 'Gana',
    points,
    max: 6,
    note: `Groom ${GANA_NAME[gg]}, bride ${GANA_NAME[gb]}.`,
  };
}

/** 7. Bhakoot — 2-12/5-9/6-8 => 0 (dosha), else 7. */
function scoreBhakoot(
  male: PersonChart,
  female: PersonChart,
): { score: KootaScore; pair: '2-12' | '5-9' | '6-8' | null } {
  const a = clampRashi(male.moonRashi);
  const b = clampRashi(female.moonRashi);
  const d1 = rashiDistance(a, b); // a->b
  const d2 = rashiDistance(b, a); // b->a
  let pair: '2-12' | '5-9' | '6-8' | null = null;
  const has = (x: number, y: number) =>
    (d1 === x && d2 === y) || (d1 === y && d2 === x);
  if (has(2, 12)) pair = '2-12';
  else if (has(5, 9)) pair = '5-9';
  else if (has(6, 8)) pair = '6-8';
  const points = pair ? 0 : 7;
  return {
    score: {
      name: 'Bhakoot',
      points,
      max: 7,
      note: pair
        ? `${pair} dosha (${RASHI_NAMES[a]}/${RASHI_NAMES[b]}).`
        : `No Bhakoot dosha (${RASHI_NAMES[a]}/${RASHI_NAMES[b]}).`,
    },
    pair,
  };
}

/** 8. Nadi — same nadi => 0 (dosha), else 8. */
function scoreNadi(
  male: PersonChart,
  female: PersonChart,
): { score: KootaScore; dosha: boolean } {
  const ng = NADI_BY_NAKSHATRA[male.nakshatra - 1];
  const nb = NADI_BY_NAKSHATRA[female.nakshatra - 1];
  const dosha = ng === nb;
  return {
    score: {
      name: 'Nadi',
      points: dosha ? 0 : 8,
      max: 8,
      note: dosha
        ? `Nadi Dosha (both ${NADI_NAME[ng]}).`
        : `Different Nadi (${NADI_NAME[ng]}/${NADI_NAME[nb]}).`,
    },
    dosha,
  };
}

/* ------------------------------------------------------------------ *
 *  MANGAL (Manglik) DOSHA                                            *
 * ------------------------------------------------------------------ *
 * Manglik when Mars sits in houses 1,2,4,7,8,12 from a reference. We use the
 * MOON as the baseline reference (Chandra-Manglik) because lagna may be absent;
 * if a lagnaRashi is supplied we use the lagna instead (more standard). House =
 * forward rashi distance from reference rashi to Mars's rashi (1..12). Documented.
 */
const MANGLIK_HOUSES = new Set([1, 2, 4, 7, 8, 12]);

function marsRashi(p: PersonChart): number {
  return Math.floor(((p.marsSiderealLongitude % 360) + 360) % 360 / 30) + 1;
}

function isManglik(p: PersonChart): { manglik: boolean; reference: 'moon' | 'lagna' } {
  const reference: 'moon' | 'lagna' = p.lagnaRashi ? 'lagna' : 'moon';
  const refRashi = p.lagnaRashi ? clampRashi(p.lagnaRashi) : clampRashi(p.moonRashi);
  const mr = marsRashi(p);
  const house = rashiDistance(refRashi, mr);
  return { manglik: MANGLIK_HOUSES.has(house), reference };
}

/* ------------------------------------------------------------------ *
 *  PUBLIC API                                                         *
 * ------------------------------------------------------------------ */

function bandForTotal(total: number): Band {
  if (total < 18) return 'Not recommended';
  if (total <= 24) return 'Average';
  if (total <= 32) return 'Good';
  return 'Excellent';
}

/**
 * Compute the full Ashtakoota result for a (male, female) pair.
 * The directional kootas (Varna, Gana) treat `male` as the groom and `female`
 * as the bride. Pass charts accordingly.
 */
export function computeAshtakoota(male: PersonChart, female: PersonChart): AshtakootaResult {
  const varna = scoreVarna(male, female);
  const vashya = scoreVashya(male, female);
  const tara = scoreTara(male, female);
  const yoni = scoreYoni(male, female);
  const grahaMaitri = scoreGrahaMaitri(male, female);
  const gana = scoreGana(male, female);
  const bhakoot = scoreBhakoot(male, female);
  const nadi = scoreNadi(male, female);

  const total =
    varna.points +
    vashya.points +
    tara.points +
    yoni.points +
    grahaMaitri.points +
    gana.points +
    bhakoot.score.points +
    nadi.score.points;

  const mMale = isManglik(male);
  const mFemale = isManglik(female);

  const doshas: DoshaFlags = {
    nadiDosha: nadi.dosha,
    bhakootDosha: bhakoot.pair !== null,
    bhakootPair: bhakoot.pair,
    mangalDoshaMale: mMale.manglik,
    mangalDoshaFemale: mFemale.manglik,
    // Both use the same reference type given identical inputs; report it.
    mangalReference: mMale.reference,
  };

  return {
    varna,
    vashya,
    tara,
    yoni,
    grahaMaitri,
    gana,
    bhakoot: bhakoot.score,
    nadi: nadi.score,
    total,
    max: 36,
    band: bandForTotal(total),
    doshas,
  };
}
