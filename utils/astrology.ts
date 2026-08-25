import { parseDDMMYYYY } from './dateUtils';
import { ZODIAC_KNOWLEDGE, PLANETARY_KNOWLEDGE, HOUSE_KNOWLEDGE, ZodiacSignData } from './astrologyKnowledge';
import { computeEphemeris } from './jyotish/ephemeris';

export interface AstrologyReading {
  sunSign: string;
  moonSign: string;
  ascendant: string;
  traits: string[];
  positivePoints: string[];
  negativePoints: string[];
  remedies: string[];
  pastPredictions: string[];
  futurePredictions: string[];
  luckyNumbers: number[];
  luckyColors: string[];
  compatibility: string[];
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  locationInsights: string[];
  detailedAnalysis: {
    sunSignData: ZodiacSignData;
    moonSignData: ZodiacSignData;
    ascendantData: ZodiacSignData;
  };
}

export interface DailyHoroscope {
  mainPrediction: string;
  luckyNumbers: number[];
  luckyColor: string;
  positiveEnergy: string;
  advice: string;
}

export interface WeeklyHoroscope {
  weekStart: string;
  weekEnd: string;
  overview: string;
  highlights: string[];
  luckyDays: string[];
  focusAreas: string[];
}

const zodiacSigns = [
  'Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
  'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'
];

// --- Deterministic seeded selection helpers ---
// A simple, stable string hash (no crypto). Same string -> same number.
const hashString = (seed: string): number => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0; // 32-bit wrap
  }
  return Math.abs(hash);
};

// Pick a stable index into an array from a seed string.
const seededIndex = (seed: string, length: number): number => {
  if (length <= 0) return 0;
  return hashString(seed) % length;
};

// Today's date as 'YYYY-MM-DD' (local).
const getTodayKey = (date: Date = new Date()): string => {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const d = date.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// ISO week key 'YYYY-Www' for stable weekly seeding.
const getISOWeekKey = (date: Date = new Date()): string => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7; // Mon=1..Sun=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // nearest Thursday
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${week.toString().padStart(2, '0')}`;
};

// Function to get coordinates for Indian places
export const getCoordinatesForPlace = (place: string): { latitude: number; longitude: number } | null => {
  // This is a simplified mapping. In a real app, you'd use a geocoding service
  const placeCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
    'mumbai': { latitude: 19.0760, longitude: 72.8777 },
    'delhi': { latitude: 28.7041, longitude: 77.1025 },
    'bangalore': { latitude: 12.9716, longitude: 77.5946 },
    'hyderabad': { latitude: 17.3850, longitude: 78.4867 },
    'ahmedabad': { latitude: 23.0225, longitude: 72.5714 },
    'chennai': { latitude: 13.0827, longitude: 80.2707 },
    'kolkata': { latitude: 22.5726, longitude: 88.3639 },
    'pune': { latitude: 18.5204, longitude: 73.8567 },
    'jaipur': { latitude: 26.9124, longitude: 75.7873 },
    'lucknow': { latitude: 26.8467, longitude: 80.9462 },
    'kanpur': { latitude: 26.4499, longitude: 80.3319 },
    'nagpur': { latitude: 21.1458, longitude: 79.0882 },
    'indore': { latitude: 22.7196, longitude: 75.8577 },
    'bhopal': { latitude: 23.2599, longitude: 77.4126 },
    'visakhapatnam': { latitude: 17.6868, longitude: 83.2185 },
    'patna': { latitude: 25.5941, longitude: 85.1376 },
    'vadodara': { latitude: 22.3072, longitude: 73.1812 },
    'ludhiana': { latitude: 30.9010, longitude: 75.8573 },
    'agra': { latitude: 27.1767, longitude: 78.0081 },
    'nashik': { latitude: 19.9975, longitude: 73.7898 },
    'faridabad': { latitude: 28.4089, longitude: 77.3178 },
    'meerut': { latitude: 28.9845, longitude: 77.7064 },
    'rajkot': { latitude: 22.3039, longitude: 70.8022 },
    'varanasi': { latitude: 25.3176, longitude: 82.9739 },
    'srinagar': { latitude: 34.0837, longitude: 74.7973 },
    'aurangabad': { latitude: 19.8762, longitude: 75.3433 },
    'amritsar': { latitude: 31.6340, longitude: 74.8723 },
    'ranchi': { latitude: 23.3441, longitude: 85.3096 },
    'coimbatore': { latitude: 11.0168, longitude: 76.9558 },
    'jabalpur': { latitude: 23.1815, longitude: 79.9864 },
    'gwalior': { latitude: 26.2183, longitude: 78.1828 },
    'vijayawada': { latitude: 16.5062, longitude: 80.6480 },
    'jodhpur': { latitude: 26.2389, longitude: 73.0243 },
    'madurai': { latitude: 9.9252, longitude: 78.1198 },
    'raipur': { latitude: 21.2514, longitude: 81.6296 },
    'kota': { latitude: 25.2138, longitude: 75.8648 },
    'chandigarh': { latitude: 30.7333, longitude: 76.7794 },
    'guwahati': { latitude: 26.1445, longitude: 91.7362 },
    'mysore': { latitude: 12.2958, longitude: 76.6394 },
    'bareilly': { latitude: 28.3670, longitude: 79.4304 },
    'aligarh': { latitude: 27.8974, longitude: 78.0880 },
    'jalandhar': { latitude: 31.3260, longitude: 75.5762 },
    'bhubaneswar': { latitude: 20.2961, longitude: 85.8245 },
    'salem': { latitude: 11.6643, longitude: 78.1460 },
    'thiruvananthapuram': { latitude: 8.5241, longitude: 76.9366 },
    'kochi': { latitude: 9.9312, longitude: 76.2673 },
    'dehradun': { latitude: 30.3165, longitude: 78.0322 },
    'shimla': { latitude: 31.1048, longitude: 77.1734 },
    'manali': { latitude: 32.2396, longitude: 77.1887 },
    'rishikesh': { latitude: 30.0869, longitude: 78.2676 },
    'haridwar': { latitude: 29.9457, longitude: 78.1642 },
    'mathura': { latitude: 27.4924, longitude: 77.6737 },
    'vrindavan': { latitude: 27.5706, longitude: 77.7006 },
    'pushkar': { latitude: 26.4899, longitude: 74.5511 },
    'mount abu': { latitude: 24.5925, longitude: 72.7156 },
    'ooty': { latitude: 11.4064, longitude: 76.6932 },
    'kodaikanal': { latitude: 10.2381, longitude: 77.4892 },
    'munnar': { latitude: 10.0889, longitude: 77.0595 },
    'alleppey': { latitude: 9.4981, longitude: 76.3388 },
    'varkala': { latitude: 8.7379, longitude: 76.7160 },
    'hampi': { latitude: 15.3350, longitude: 76.4600 },
    'gokarna': { latitude: 14.5492, longitude: 74.3200 },
    'pondicherry': { latitude: 11.9416, longitude: 79.8083 },
    'mahabalipuram': { latitude: 12.6269, longitude: 80.1927 },
    'khajuraho': { latitude: 24.8318, longitude: 79.9199 },
    'orchha': { latitude: 25.3518, longitude: 78.6407 },
    'sanchi': { latitude: 23.4793, longitude: 77.7398 },
    'ajanta': { latitude: 20.5519, longitude: 75.7033 },
    'ellora': { latitude: 20.0269, longitude: 75.1780 },
    'lonavala': { latitude: 18.7537, longitude: 73.4068 },
    'mahabaleshwar': { latitude: 17.9244, longitude: 73.6544 },
    'panchgani': { latitude: 17.9242, longitude: 73.8017 },
    'matheran': { latitude: 18.9847, longitude: 73.2673 },
    'alibag': { latitude: 18.6414, longitude: 72.8722 },
    'panaji': { latitude: 15.4909, longitude: 73.8278 },
    'margao': { latitude: 15.2993, longitude: 74.1240 },
    'vasco da gama': { latitude: 15.3955, longitude: 73.8157 },
    'mapusa': { latitude: 15.5909, longitude: 73.8087 },
    'calangute': { latitude: 15.5435, longitude: 73.7550 },
    'baga': { latitude: 15.5560, longitude: 73.7516 },
    'anjuna': { latitude: 15.5732, longitude: 73.7395 },
    'arambol': { latitude: 15.6869, longitude: 73.7026 },
    'palolem': { latitude: 15.0100, longitude: 74.0233 },
    'dwarka': { latitude: 22.2394, longitude: 68.9678 },
    'somnath': { latitude: 20.8880, longitude: 70.4017 },
    'palitana': { latitude: 21.5222, longitude: 71.8261 },
    'kutch': { latitude: 23.7337, longitude: 69.8597 },
    'diu': { latitude: 20.7144, longitude: 70.9876 },
    'daman': { latitude: 20.3974, longitude: 72.8328 },
    'silvassa': { latitude: 20.2740, longitude: 72.9962 },
    'gangtok': { latitude: 27.3389, longitude: 88.6065 },
    'pelling': { latitude: 27.2152, longitude: 88.2026 },
    'darjeeling': { latitude: 27.0360, longitude: 88.2627 },
    'kalimpong': { latitude: 27.0584, longitude: 88.4678 },
    'kurseong': { latitude: 26.8808, longitude: 88.2813 },
    'mirik': { latitude: 26.8854, longitude: 88.1781 },
    'digha': { latitude: 21.6281, longitude: 87.5069 },
    'mandarmani': { latitude: 21.6586, longitude: 87.7864 },
    'shantiniketan': { latitude: 23.6793, longitude: 87.6777 },
    'puri': { latitude: 19.8135, longitude: 85.8312 },
    'konark': { latitude: 19.8876, longitude: 86.0943 },
    'chilika': { latitude: 19.7165, longitude: 85.3206 },
    'tirupati': { latitude: 13.6288, longitude: 79.4192 }
  };

  // State / UT centroids — fallback for the ~558k places (name, district, state)
  // that aren't in the major-city list above. For Vedic matching the Moon's
  // nakshatra/rashi is geocentric (effectively location-independent across
  // India), so a state-level coordinate is accurate for Guna Milan; it also
  // gives the astrology screen a sensible location for any town. (Precise
  // per-place coords can be added later for full-Kundli ascendant accuracy.)
  const stateCoordinates: { [key: string]: { latitude: number; longitude: number } } = {
    'andhra pradesh': { latitude: 15.9129, longitude: 79.7400 },
    'arunachal pradesh': { latitude: 28.2180, longitude: 94.7278 },
    'assam': { latitude: 26.2006, longitude: 92.9376 },
    'bihar': { latitude: 25.0961, longitude: 85.3131 },
    'chhattisgarh': { latitude: 21.2787, longitude: 81.8661 },
    'goa': { latitude: 15.2993, longitude: 74.1240 },
    'gujarat': { latitude: 22.2587, longitude: 71.1924 },
    'haryana': { latitude: 29.0588, longitude: 76.0856 },
    'himachal pradesh': { latitude: 31.1048, longitude: 77.1734 },
    'jharkhand': { latitude: 23.6102, longitude: 85.2799 },
    'karnataka': { latitude: 15.3173, longitude: 75.7139 },
    'kerala': { latitude: 10.8505, longitude: 76.2711 },
    'madhya pradesh': { latitude: 22.9734, longitude: 78.6569 },
    'maharashtra': { latitude: 19.7515, longitude: 75.7139 },
    'manipur': { latitude: 24.6637, longitude: 93.9063 },
    'meghalaya': { latitude: 25.4670, longitude: 91.3662 },
    'mizoram': { latitude: 23.1645, longitude: 92.9376 },
    'nagaland': { latitude: 26.1584, longitude: 94.5624 },
    'odisha': { latitude: 20.9517, longitude: 85.0985 },
    'orissa': { latitude: 20.9517, longitude: 85.0985 },
    'punjab': { latitude: 31.1471, longitude: 75.3412 },
    'rajasthan': { latitude: 27.0238, longitude: 74.2179 },
    'sikkim': { latitude: 27.5330, longitude: 88.5122 },
    'tamil nadu': { latitude: 11.1271, longitude: 78.6569 },
    'telangana': { latitude: 18.1124, longitude: 79.0193 },
    'tripura': { latitude: 23.9408, longitude: 91.9882 },
    'uttar pradesh': { latitude: 26.8467, longitude: 80.9462 },
    'uttarakhand': { latitude: 30.0668, longitude: 79.0193 },
    'west bengal': { latitude: 22.9868, longitude: 87.8550 },
    'andaman and nicobar islands': { latitude: 11.7401, longitude: 92.6586 },
    'chandigarh': { latitude: 30.7333, longitude: 76.7794 },
    'dadra and nagar haveli and daman and diu': { latitude: 20.1809, longitude: 73.0169 },
    'delhi': { latitude: 28.7041, longitude: 77.1025 },
    'jammu and kashmir': { latitude: 33.7782, longitude: 76.5762 },
    'ladakh': { latitude: 34.2996, longitude: 78.2932 },
    'lakshadweep': { latitude: 10.5667, longitude: 72.6417 },
    'puducherry': { latitude: 11.9416, longitude: 79.8083 },
    'pondicherry': { latitude: 11.9416, longitude: 79.8083 },
  };

  const parts = place.toLowerCase().split(',').map((s) => s.trim()).filter(Boolean);
  const cityKey = parts[0] || '';
  if (placeCoordinates[cityKey]) {
    return placeCoordinates[cityKey];
  }
  // Fall back to the state/UT centroid (last comma-separated segment).
  const stateKey = parts.length > 1 ? parts[parts.length - 1] : '';
  if (stateKey && stateCoordinates[stateKey]) {
    return stateCoordinates[stateKey];
  }
  return null;
};

// Enhanced sun sign calculation with proper date parsing
// Map a sidereal rashi (1-12) to its English sign name (Mesha=Aries ... Meena=Pisces).
const rashiToSign = (rashi: number): string => zodiacSigns[((rashi - 1) % 12 + 12) % 12];

// Reference location (India centroid) used when no birth place is supplied. The
// sidereal SUN sign is essentially date-determined, so this only resolves the
// calendar day -> UT and does not meaningfully shift the 30° rashi bin except
// within ~1 day of a Sankranti.
const DEFAULT_COORDS = { latitude: 22, longitude: 79 };

const coordsOrDefault = (placeOfBirth?: string): { latitude: number; longitude: number } => {
  const c = placeOfBirth ? getCoordinatesForPlace(placeOfBirth) : null;
  return c ?? DEFAULT_COORDS;
};

// Sidereal (Lahiri) SUN sign — the Vedic Surya rashi. Location-insensitive, so
// the reference location is sufficient when a place isn't provided.
export const calculateSunSign = (dateOfBirth: string, timeOfBirth?: string): string => {
  try {
    const { latitude, longitude } = coordsOrDefault();
    const eph = computeEphemeris({ dateOfBirth, timeOfBirth, latitude, longitude });
    return rashiToSign(eph.sunRashi);
  } catch {
    return 'Aries';
  }
};

// Sidereal (Lahiri) MOON sign — the Vedic Janma Rashi. Uses the birth place for
// timezone; without a birth time it defaults to noon (accurate to within ~1 day
// of a rashi boundary, since the Moon stays ~2.25 days per rashi).
export const calculateMoonSign = (dateOfBirth: string, placeOfBirth: string): string => {
  try {
    const { latitude, longitude } = coordsOrDefault(placeOfBirth);
    const eph = computeEphemeris({ dateOfBirth, latitude, longitude });
    return rashiToSign(eph.moonRashi);
  } catch {
    return 'Cancer';
  }
};

// Sidereal (Lahiri) ASCENDANT (Lagna). The Lagna genuinely cannot be known
// without a birth time, so this returns '' when no time is supplied rather than
// fabricating one. Callers should treat '' as "add birth time".
export const calculateAscendant = (dateOfBirth: string, placeOfBirth: string, timeOfBirth?: string): string => {
  if (!timeOfBirth || !/^\d{1,2}:\d{2}$/.test(timeOfBirth.trim())) return '';
  try {
    const { latitude, longitude } = coordsOrDefault(placeOfBirth);
    const eph = computeEphemeris({ dateOfBirth, timeOfBirth, latitude, longitude });
    return eph.ascendantRashi ? rashiToSign(eph.ascendantRashi) : '';
  } catch {
    return '';
  }
};

// Enhanced astrology reading with comprehensive knowledge base
export const getAstrologyReading = (dateOfBirth: string, placeOfBirth: string, timeOfBirth?: string): AstrologyReading => {
  const coordinates = getCoordinatesForPlace(placeOfBirth);

  // One sidereal (Lahiri) computation drives Sun, Moon and — only when a birth
  // time is available — the Ascendant (Lagna). Pure Vedic; no tropical fallback.
  const { latitude, longitude } = coordinates ?? DEFAULT_COORDS;
  let sunSign = 'Aries';
  let moonSign = 'Cancer';
  let ascendant = '';
  try {
    const eph = computeEphemeris({ dateOfBirth, timeOfBirth, latitude, longitude });
    sunSign = rashiToSign(eph.sunRashi);
    moonSign = rashiToSign(eph.moonRashi);
    ascendant = eph.ascendantRashi ? rashiToSign(eph.ascendantRashi) : '';
  } catch {
    // keep sensible defaults on any parse/compute failure
  }
  const hasAsc = ascendant !== '';

  // Get detailed data from knowledge base
  const sunSignData = ZODIAC_KNOWLEDGE[sunSign.toLowerCase()];
  const moonSignData = ZODIAC_KNOWLEDGE[moonSign.toLowerCase()];
  const ascendantData = hasAsc ? ZODIAC_KNOWLEDGE[ascendant.toLowerCase()] : undefined;

  // Combine traits (Ascendant line only when a birth time gave us a Lagna).
  const combinedTraits = [
    `Core Identity (Sun in ${sunSign}): ${sunSignData?.traits[0] || 'Strong character'}`,
    `Emotional Nature (Moon in ${moonSign}): ${moonSignData?.traits[1] || 'Deep feelings'}`,
    ...(hasAsc ? [`Outer Personality (${ascendant} Rising): ${ascendantData?.traits[2] || 'Unique approach'}`] : []),
  ];

  const combinedStrengths = [
    `Sun in ${sunSign}: ${sunSignData?.strengths[0] || 'Core strength'}`,
    `Moon in ${moonSign}: ${moonSignData?.strengths[1] || 'Emotional strength'}`,
    ...(hasAsc ? [`${ascendant} Rising: ${ascendantData?.strengths[2] || 'Social strength'}`] : []),
    ...(sunSignData?.strengths.slice(3, 7) || []),
    ...(moonSignData?.strengths.slice(2, 4) || []),
  ];

  const combinedChallenges = [
    `Sun in ${sunSign}: ${sunSignData?.challenges[0] || 'Core challenge'}`,
    `Moon in ${moonSign}: ${moonSignData?.challenges[1] || 'Emotional challenge'}`,
    ...(hasAsc ? [`${ascendant} Rising: ${ascendantData?.challenges[2] || 'Social challenge'}`] : []),
    ...(sunSignData?.challenges.slice(3, 7) || []),
    ...(moonSignData?.challenges.slice(2, 4) || []),
  ];

  const combinedRemedies = [
    `For ${sunSign} Sun: ${sunSignData?.remedies[0] || 'Practice self-awareness'}`,
    `For ${moonSign} Moon: ${moonSignData?.remedies[1] || 'Balance emotions'}`,
    ...(hasAsc ? [`For ${ascendant} Rising: ${ascendantData?.remedies[2] || 'Align expression'}`] : []),
    ...(sunSignData?.remedies.slice(3, 7) || []),
    ...(moonSignData?.remedies.slice(2, 4) || []),
  ];

  // Helpers to safely pull a curated attribute (bounds-safe, lower-cased for
  // natural mid-sentence insertion).
  const pick = (arr: string[] | undefined, i: number, fallback: string): string => {
    if (!arr || arr.length === 0) return fallback;
    return arr[i % arr.length];
  };
  const lower = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);

  // Generate personalized predictions grounded in curated attributes. The
  // Ascendant-based line is only included when a birth time yielded a Lagna;
  // otherwise a Moon-based line takes its place.
  const pastPredictions = [
    `Your ${sunSign} Sun gave you ${lower(pick(sunSignData?.strengths, 0, 'inner strength'))}, which carried you through the past year.`,
    `With the Moon in ${moonSign}, you grew by working through ${lower(pick(moonSignData?.challenges, 1, 'old emotional patterns'))}; ${lower(pick(moonSignData?.remedies, 1, 'tending to your feelings'))} steadied you.`,
    hasAsc
      ? `Your ${ascendant} Rising shaped how others saw you, leaning on ${lower(pick(ascendantData?.strengths, 2, 'your social poise'))} when it mattered most.`
      : `Your ${moonSign} Moon shaped how you connected with others, leaning on ${lower(pick(moonSignData?.strengths, 2, 'your emotional insight'))} when it mattered most.`,
    `Drawing on ${lower(pick(sunSignData?.strengths, 3, 'your core gifts'))}, you turned recent setbacks into lasting lessons.`
  ];

  const futurePredictions = [
    `The months ahead favor your ${sunSign} gift of ${lower(pick(sunSignData?.strengths, 1, 'steady focus'))} — let it lead your biggest decisions.`,
    `Your ${moonSign} Moon points to warmer relationships; watch for ${lower(pick(moonSignData?.challenges, 0, 'guardedness'))}, and ${lower(pick(moonSignData?.remedies, 0, 'stay open'))}.`,
    `Career momentum builds where you apply ${lower(pick(sunSignData?.strengths, 2, 'your determination'))}; growth in ${lower(pick(sunSignData?.career, 0, 'your chosen field'))} is well-aspected.`,
    hasAsc
      ? `To keep the ${ascendant} Rising challenge of ${lower(pick(ascendantData?.challenges, 2, 'self-doubt'))} in check, ${lower(pick(ascendantData?.remedies, 2, 'align your actions with your values'))}.`
      : `Add your exact birth time to your profile to unlock your Ascendant (Lagna) and a more precise reading.`
  ];

  return {
    sunSign,
    moonSign,
    ascendant,
    traits: combinedTraits,
    positivePoints: combinedStrengths,
    negativePoints: combinedChallenges,
    remedies: combinedRemedies,
    pastPredictions,
    futurePredictions,
    luckyNumbers: sunSignData?.numbers || [1, 7, 14],
    luckyColors: sunSignData?.colors || ['Red', 'Gold'],
    compatibility: sunSignData?.compatibility || [],
    coordinates: coordinates || undefined,
    locationInsights: [],
    detailedAnalysis: {
      sunSignData: sunSignData || ZODIAC_KNOWLEDGE.aries,
      moonSignData: moonSignData || ZODIAC_KNOWLEDGE.cancer,
      ascendantData: ascendantData || sunSignData || ZODIAC_KNOWLEDGE.aries
    }
  };
};

// Enhanced daily horoscope with detailed sections
// Enhanced daily horoscope grounded in today's Moon transit (Chandra Gochar)
// relative to the user's natal Moon (Janma Rashi). The transit house changes as
// the Moon moves (~1 rashi per 2.25 days), so the reading genuinely varies day
// to day while staying deterministic within any given day.
export const generateDailyHoroscope = (firstName: string, dateOfBirth: string, placeOfBirth?: string): DailyHoroscope => {
  const sunSign = calculateSunSign(dateOfBirth);
  const signData = ZODIAC_KNOWLEDGE[sunSign.toLowerCase()];
  const { latitude, longitude } = (placeOfBirth ? getCoordinatesForPlace(placeOfBirth) : null) ?? DEFAULT_COORDS;

  const pick = (arr: string[] | undefined, i: number, fallback: string): string => {
    if (!arr || arr.length === 0) return fallback;
    return arr[i % arr.length];
  };
  const lower = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const ordinal = (n: number): string => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
  };

  const today = new Date();
  const todayStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  // Natal Moon (Janma Rashi) and today's transiting Moon (both sidereal).
  let natalMoonRashi = 0;
  let transitMoonRashi = 0;
  try {
    natalMoonRashi = computeEphemeris({ dateOfBirth, latitude, longitude }).moonRashi;
    transitMoonRashi = computeEphemeris({ dateOfBirth: todayStr, latitude, longitude }).moonRashi;
  } catch {
    // fall through to non-transit framing on any failure
  }
  const natalMoonSign = natalMoonRashi ? rashiToSign(natalMoonRashi) : '';
  const transitHouse = natalMoonRashi && transitMoonRashi
    ? ((transitMoonRashi - natalMoonRashi + 12) % 12) + 1
    : 0;

  // Classic Chandra Gochar significations by transit house from the Janma Rashi.
  const GOCHAR: Record<number, { tone: 'good' | 'caution'; line: string }> = {
    1: { tone: 'caution', line: 'the Moon sits over your own sign, heightening feelings and restlessness — pace yourself and avoid overreacting' },
    2: { tone: 'good', line: 'attention turns to family, finances and speech — a good day to save, plan, and speak with care' },
    3: { tone: 'good', line: 'courage and initiative are favoured — push your efforts and reach out; your words carry weight' },
    4: { tone: 'caution', line: 'home and comfort need tending and the mind may feel unsettled — keep the day light and avoid needless travel' },
    5: { tone: 'good', line: 'creativity, romance and a positive mind are supported — express yourself and enjoy learning' },
    6: { tone: 'good', line: 'you can overcome rivals and obstacles — a strong day to resolve disputes and clear pending work' },
    7: { tone: 'good', line: 'partnerships, dealings and short journeys flow well — cooperation brings the best results' },
    8: { tone: 'caution', line: 'this is Chandrashtama — guard your health and emotions, and postpone major decisions where you can' },
    9: { tone: 'good', line: 'fortune and dharma are supported — favourable for learning, travel and acts of faith' },
    10: { tone: 'good', line: 'career and visible action are favoured — a productive day to advance your work' },
    11: { tone: 'good', line: 'gains and the fulfilment of wishes are indicated — network and pursue your goals confidently' },
    12: { tone: 'caution', line: 'energy turns toward rest, expenses and letting go — good for reflection and spiritual practice, poor for big spending' },
  };

  const daySeed = `${sunSign}-${getTodayKey(today)}`;
  const gochar = transitHouse ? GOCHAR[transitHouse] : null;
  const strength = lower(pick(signData?.strengths, seededIndex(`${daySeed}-str`, signData?.strengths?.length || 1), 'inner resolve'));
  const challengeRaw = pick(signData?.challenges, seededIndex(`${daySeed}-ch`, signData?.challenges?.length || 1), 'Restlessness');
  const remedy = lower(pick(signData?.remedies, seededIndex(`${daySeed}-rem`, signData?.remedies?.length || 1), 'pause and breathe'));
  const career = lower(pick(signData?.career, seededIndex(`${daySeed}-car`, signData?.career?.length || 1), 'what matters most'));
  const trait = lower(pick(signData?.traits, seededIndex(`${daySeed}-tr`, signData?.traits?.length || 1), 'your natural drive'));

  const mainPrediction = gochar
    ? `${firstName}, today the Moon transits your ${ordinal(transitHouse)} house from your Janma Rashi (${natalMoonSign}) — ${gochar.line}. Your ${sunSign} strength of ${strength} supports you, so ${gochar.tone === 'caution' ? 'move at a steady pace and choose your moments with care' : 'put it to work where it counts and let your initiative lead'}. Watch one thing today: ${challengeRaw.toLowerCase()}; if it surfaces, ${remedy}.`
    : `${firstName}, your ${sunSign} strength of ${strength} is well-supported today — put it to good use and let ${trait} guide you. Watch one thing today: ${challengeRaw.toLowerCase()}; if it surfaces, ${remedy}.`;

  const positiveEnergy = gochar
    ? (gochar.tone === 'caution'
        ? `Even under today's ${ordinal(transitHouse)}-house Moon, your ${sunSign} gift for ${strength} keeps you steady — a good day for quiet, careful progress, especially in ${career}.`
        : `With the Moon well placed in your ${ordinal(transitHouse)} house, your ${sunSign} gift for ${strength} draws the right people and openings toward you — a fine day to make headway in ${career}.`)
    : `Your ${sunSign} talent for ${strength} draws the right people toward you today and supports real progress in ${career}.`;

  const advice = gochar && gochar.tone === 'caution'
    ? `Go gently today — avoid forcing decisions or big commitments, and ${remedy}. Small, deliberate steps will serve you better than pushing hard.`
    : `Lean into ${strength} today, ${firstName}, and channel it into ${career}; steady, intentional steps compound into real progress.`;

  const dayNumber = today.getDate();
  // Pick 3 UNIQUE lucky numbers from the sign's set, rotated by the day so they
  // vary day to day but never repeat within the trio.
  const baseLuckyNumbers = signData?.numbers || [1, 7, 14, 3, 9];
  const off = dayNumber % baseLuckyNumbers.length;
  const rotated = [...baseLuckyNumbers.slice(off), ...baseLuckyNumbers.slice(0, off)];
  const uniq = Array.from(new Set(rotated));
  while (uniq.length < 3) uniq.push(((uniq[uniq.length - 1] || 1) % 9) + 1); // pad if needed
  const todaysLuckyNumbers = uniq.slice(0, 3);
  const signColors = signData?.colors || ['Gold', 'Red'];
  const todaysLuckyColor = signColors[dayNumber % signColors.length];

  return {
    mainPrediction,
    luckyNumbers: todaysLuckyNumbers,
    luckyColor: todaysLuckyColor,
    positiveEnergy,
    advice,
  };
};

// Generate weekly horoscope
export const generateWeeklyHoroscope = (firstName: string, dateOfBirth: string, placeOfBirth?: string): WeeklyHoroscope => {
  const sunSign = calculateSunSign(dateOfBirth);
  const signData = ZODIAC_KNOWLEDGE[sunSign.toLowerCase()];
  
  // Get current week's Monday and Sunday
  const today = new Date();
  const currentDay = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (currentDay === 0 ? 6 : currentDay - 1));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const weekStart = monday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const weekEnd = sunday.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  // Bounds-safe accessors; lower-case for natural mid-sentence insertion.
  const pick = (arr: string[] | undefined, i: number, fallback: string): string => {
    if (!arr || arr.length === 0) return fallback;
    return arr[i % arr.length];
  };
  const lower = (s: string): string => (s ? s.charAt(0).toLowerCase() + s.slice(1) : s);
  const element = signData?.element || 'Cosmic';

  const weeklyOverviews = [
    `This week plays to your ${sunSign} strength of ${lower(pick(signData?.strengths, 0, 'steady resolve'))}, ${firstName}, and your ${element} drive helps you make real headway on what matters most. Lean into that momentum through the busier days, and let your natural initiative set the tone. One growth edge to keep in view this week: ${pick(signData?.challenges, 0, 'Impatience')}.`,
    `A constructive week lies ahead for you, ${firstName}. Build on ${lower(pick(signData?.strengths, 1, 'your focus'))} and your ${element}-sign momentum, and let steady, consistent effort carry your plans forward rather than rushing them. Keep a gentle check on one tendency: ${pick(signData?.challenges, 1, 'Overextending yourself')}.`,
    `Your ${sunSign} gift for ${lower(pick(signData?.strengths, 2, 'clear judgment'))} shapes the week ahead, ${firstName}. Channel that ${element} energy into your goals and your relationships alike, and trust the progress you make even when it feels gradual. The area to handle with care this week: ${pick(signData?.challenges, 0, 'Tension under pressure')}.`,
    `This week favours your ${element} nature, ${firstName}. Trust ${lower(pick(signData?.strengths, 3, 'your instincts'))} in the key moments, pace yourself through the demands, and give the important relationships your attention. Grow by softening one habit: ${pick(signData?.challenges, 2, 'Rigidity')}.`
  ];

  const weeklyHighlights = [
    `Progress in ${lower(pick(signData?.career, 0, 'your work'))}, powered by ${lower(pick(signData?.strengths, 0, 'your drive'))}`,
    `Your ${sunSign} strength of ${lower(pick(signData?.strengths, 1, 'follow-through'))} earns recognition`,
    `Openings in ${lower(pick(signData?.career, 1, 'a new project'))} reward initiative`,
    `Stronger relationships and meaningful new connections`,
    `Steady wellbeing as you apply ${lower(pick(signData?.strengths, 2, 'good habits'))}`,
    `Quiet self-understanding and renewed focus`
  ];

  const luckyDays = [
    'Tuesday - Perfect for new initiatives',
    'Thursday - Ideal for important communications',
    'Saturday - Excellent for social activities',
    'Sunday - Great for reflection and planning'
  ];

  const focusAreas = [
    `${pick(signData?.career, 0, 'Professional development')} and growing your craft`,
    `Applying your strength of ${lower(pick(signData?.strengths, 0, 'determination'))}`,
    `${pick(signData?.career, 1, 'New opportunities')} worth exploring`,
    `Relationships and emotional connections`,
    `Health and wellbeing practices`,
    `Reflection and personal growth`
  ];

  // Deterministic per ISO week: stable all week, changes next week. A seeded
  // ROTATION (not a fixed slice) makes highlights/focus/lucky-days differ week
  // to week instead of always showing the same first entries.
  const weekSeed = `${sunSign}-${getISOWeekKey(today)}`;
  const rotate = <T,>(arr: T[], seed: string, k: number): T[] => {
    if (arr.length === 0) return [];
    const off = seededIndex(seed, arr.length);
    const out: T[] = [];
    for (let i = 0; i < Math.min(k, arr.length); i++) out.push(arr[(off + i) % arr.length]);
    return out;
  };

  // Lucky days: lead with the day ruled by the sign's lord (a genuinely Vedic
  // touch), then add a rotated general suggestion.
  const RULER_DAY: Record<string, string> = {
    Sun: 'Sunday', Moon: 'Monday', Mars: 'Tuesday', Mercury: 'Wednesday',
    Jupiter: 'Thursday', Venus: 'Friday', Saturn: 'Saturday',
  };
  const lordDay = RULER_DAY[(signData?.ruler || '').trim()] || '';
  const lordLine = lordDay
    ? `${lordDay} — ruled by your sign lord ${signData?.ruler}, favourable for important matters`
    : null;
  const rotatedDays = rotate(luckyDays, `${weekSeed}-days`, 2);
  const weeklyLuckyDays = (lordLine ? [lordLine, rotatedDays[0]] : rotatedDays).filter(Boolean).slice(0, 2) as string[];

  // Overview = seeded multi-sentence overview + a clean career-focused close.
  const overview =
    `${weeklyOverviews[seededIndex(`${weekSeed}-overview`, weeklyOverviews.length)]} ` +
    `Career-wise, the week favours progress in ${lower(pick(signData?.career, seededIndex(`${weekSeed}-foc`, signData?.career?.length || 1), 'your chosen field'))}.`;

  return {
    weekStart,
    weekEnd,
    overview,
    highlights: rotate(weeklyHighlights, `${weekSeed}-hl`, 3),
    luckyDays: weeklyLuckyDays,
    focusAreas: rotate(focusAreas, `${weekSeed}-fa`, 3),
  };
};

// Simple daily horoscope for backward compatibility
export const generateSimpleDailyHoroscope = (firstName: string, dateOfBirth: string, placeOfBirth?: string): string => {
  const dailyHoroscope = generateDailyHoroscope(firstName, dateOfBirth, placeOfBirth);
  return dailyHoroscope.mainPrediction;
};

// Get detailed sign information
export const getSignDetails = (signName: string): ZodiacSignData | null => {
  return ZODIAC_KNOWLEDGE[signName.toLowerCase()] || null;
};

// Get planetary information
export const getPlanetaryInfo = (planetName: string) => {
  return (PLANETARY_KNOWLEDGE as Record<string, any>)[planetName.toLowerCase()] || null;
};

// Get house information
export const getHouseInfo = (houseNumber: number) => {
  return (HOUSE_KNOWLEDGE as Record<number, any>)[houseNumber] || null;
};