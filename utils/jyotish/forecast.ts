/**
 * utils/jyotish/forecast.ts
 *
 * Time-bound forecast (monthly / yearly) grounded in classical Gochara (transits
 * relative to the natal Moon) + the running Vimshottari Dasha + Sade Sati. We do
 * not invent specific events — we state where the planets transit from the Moon,
 * their classical benefic/malefic tendency in that house, and the running period,
 * and let the reader reflect. Deterministic throughout.
 */

import { computeKundli } from './kundli';
import { grahaRashisAtDate } from './ephemeris';
import type { EphemerisInput } from './ephemeris';
import { computeSadeSati } from './sadeSati';
import { getCoordinatesForPlace } from '../astrology';
import { SIGN_NAMES, HOUSE_THEME, PLANET_SIGNIFICATION, ordinal, type Planet } from './interpret';

export type Period = 'monthly' | 'yearly';

// Classical Gochara: houses (from the Moon) in which each planet's transit is
// considered favourable. All other houses are the more testing positions.
const FAVOURABLE_HOUSES: Record<Planet, number[]> = {
  Sun: [3, 6, 10, 11],
  Moon: [1, 3, 6, 7, 10, 11],
  Mars: [3, 6, 11],
  Mercury: [2, 4, 6, 8, 10, 11],
  Jupiter: [2, 5, 7, 9, 11],
  Venus: [1, 2, 3, 4, 5, 8, 9, 11, 12],
  Saturn: [3, 6, 11],
  Rahu: [3, 6, 11],
  Ketu: [3, 6, 11],
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

function addMonths(d: Date, m: number): Date {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
const houseFromMoon = (planetRashi: number, moonRashi: number) => ((planetRashi - moonRashi + 12) % 12) + 1;

export interface TransitLine {
  planet: Planet;
  signName: string;
  house: number;
  favourable: boolean;
  text: string;
}

export interface MonthLine {
  label: string;   // e.g. "January 2026"
  house: number;   // Sun's house from Moon that month
  favourable: boolean;
  text: string;
}

export interface Forecast {
  period: Period;
  rangeLabel: string;
  moonRashi: number;
  moonSignName: string;
  dashaLine: string;
  sadeSatiLine: string | null;
  transits: TransitLine[];
  focus: { area: string; text: string }[];
  months: MonthLine[]; // only for yearly
  guidance: string[];
}

function coordsOf(p: { placeOfBirth: string }) {
  return getCoordinatesForPlace(p.placeOfBirth) ?? { latitude: 22, longitude: 79 };
}

/** Transit positions (rashi) of the planets on a given date (transits are
 *  geocentric — independent of the observer's location). */
function transitsOn(date: Date): Record<Planet, number> {
  return grahaRashisAtDate(date) as Record<Planet, number>;
}

function transitLine(planet: Planet, rashi: number, moonRashi: number): TransitLine {
  const house = houseFromMoon(rashi, moonRashi);
  const favourable = FAVOURABLE_HOUSES[planet].includes(house);
  const tone = favourable
    ? 'a supportive influence — a good window to give these matters attention'
    : 'a more testing position that rewards patience and steady effort here';
  return {
    planet,
    signName: SIGN_NAMES[rashi - 1],
    house,
    favourable,
    text: `${planet} (${PLANET_SIGNIFICATION[planet]}) transits ${SIGN_NAMES[rashi - 1]}, the ${ordinal(house)} house from your Moon (${HOUSE_THEME[house - 1]}) — ${tone}.`,
  };
}

export function computeForecast(
  profile: { dateOfBirth: string; timeOfBirth?: string; placeOfBirth: string; firstName?: string },
  period: Period,
  now: Date = new Date(),
): Forecast {
  const { latitude, longitude } = coordsOf(profile);
  const input: EphemerisInput = {
    dateOfBirth: profile.dateOfBirth,
    timeOfBirth: profile.timeOfBirth || undefined,
    latitude,
    longitude,
  };
  const k = computeKundli(input);
  const moonRashi = k.moonRashi;

  const start = now;
  const end = period === 'yearly' ? addMonths(now, 12) : addMonths(now, 1);
  const rangeLabel = period === 'yearly'
    ? `${MONTHS[start.getMonth()]} ${start.getFullYear()} – ${MONTHS[end.getMonth()]} ${end.getFullYear()}`
    : `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;

  // Running dasha.
  let dashaLine = 'Add your birth time for the Dasha context.';
  if (k.dasha) {
    const m = k.dasha.mahadashas[k.dasha.currentMahaIndex];
    const a = k.dasha.currentAntar;
    dashaLine = `You are running the ${m.lord} Mahadasha${a ? ` and ${a.lord} Antardasha` : ''}. This period carries the themes of ${PLANET_SIGNIFICATION[m.lord as Planet]}.`;
  }

  // Sade Sati.
  const ss = computeSadeSati(moonRashi, now);
  const sadeSatiLine = ss.active
    ? `${ss.title}: ${ss.summary}`
    : ss.dhaiya
      ? `${ss.title}: ${ss.summary}`
      : null;

  // Key transits at the start of the period.
  const tr = transitsOn(start);
  const key: Planet[] = period === 'monthly'
    ? ['Sun', 'Jupiter', 'Saturn', 'Rahu', 'Ketu']
    : ['Jupiter', 'Saturn', 'Rahu', 'Ketu'];
  const transits = key.map((pl) => transitLine(pl, tr[pl], moonRashi));

  // Note a mid-period sign change for the slow benefic/malefic (yearly only).
  if (period === 'yearly') {
    const trEnd = transitsOn(end);
    for (const pl of ['Jupiter', 'Saturn'] as Planet[]) {
      if (trEnd[pl] !== tr[pl]) {
        const line = transitLine(pl, trEnd[pl], moonRashi);
        transits.push({ ...line, text: `Later in the year, ${line.text}` });
      }
    }
  }

  // Focus areas — grounded tone from the relevant transit.
  const jup = transits.find((t) => t.planet === 'Jupiter');
  const sat = transits.find((t) => t.planet === 'Saturn');
  const areaTone = (fav: boolean | undefined) =>
    fav === undefined ? 'is steady' : fav ? 'is well-supported' : 'asks for patience';
  const focus = [
    { area: 'Growth & fortune', text: `With Jupiter's transit, this area ${areaTone(jup?.favourable)} — ${jup ? jup.text : 'a steady phase.'}` },
    { area: 'Career & discipline', text: `With Saturn's transit${ss.active ? ' (during Sade Sati)' : ''}, career and responsibilities ${areaTone(sat?.favourable)} — reward consistency over shortcuts.` },
    { area: 'Overall period', text: dashaLine },
  ];

  // Month-by-month (yearly): the Sun's house from the Moon each month.
  const months: MonthLine[] = [];
  if (period === 'yearly') {
    for (let i = 0; i < 12; i++) {
      const mid = addMonths(new Date(start.getFullYear(), start.getMonth(), 15), i);
      const sunRashi = transitsOn(mid).Sun;
      const house = houseFromMoon(sunRashi, moonRashi);
      const fav = FAVOURABLE_HOUSES.Sun.includes(house);
      months.push({
        label: `${MONTHS[mid.getMonth()]} ${mid.getFullYear()}`,
        house,
        favourable: fav,
        text: fav
          ? `Vitality and initiative are supported (Sun in the ${ordinal(house)} from your Moon — ${HOUSE_THEME[house - 1]}). A good month to act.`
          : `A quieter month for outward push (Sun in the ${ordinal(house)} from your Moon — ${HOUSE_THEME[house - 1]}). Conserve energy and plan.`,
      });
    }
  }

  const guidance: string[] = [
    'Work with the favourable transits above — begin new efforts when the benefics support the relevant house.',
    'During testing transits and Sade Sati, favour patience, routine and honest effort over risky moves.',
    ss.active || ss.dhaiya
      ? 'Traditional supports for Saturn periods: discipline, serving elders and those in need, and reciting the Hanuman Chalisa on Saturdays.'
      : 'Keep to steady habits and revisit this forecast as the transits change.',
  ];

  return {
    period,
    rangeLabel,
    moonRashi,
    moonSignName: SIGN_NAMES[moonRashi - 1],
    dashaLine,
    sadeSatiLine,
    transits,
    focus,
    months,
    guidance,
  };
}
