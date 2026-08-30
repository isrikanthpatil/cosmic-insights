/**
 * utils/jyotish/panchang.ts
 *
 * Pure-TypeScript daily Panchang (Hindu almanac) built on the same sidereal
 * (Lahiri) ephemeris used elsewhere in the app. Everything here is DETERMINISTIC
 * — no LLM, no network. It computes, for a given instant:
 *
 *   The five angas (limbs):
 *     - Vara      : weekday + its planetary lord
 *     - Tithi     : lunar day (Paksha + name), from Moon−Sun elongation (12° each)
 *     - Nakshatra : Moon's lunar mansion (13°20' each)
 *     - Yoga      : from (Sun + Moon) longitude (13°20' each), 27 yogas
 *     - Karana    : half-tithi (6° each), 11-karana cycle
 *
 *   Sun timings + inauspicious periods:
 *     - Sunrise / Sunset (NOAA sunrise equation)
 *     - Rahu Kalam, Yamaganda, Gulika Kalam (1/8 divisions of the daytime,
 *       assigned to a fixed slot per weekday)
 *
 * Tithi and Nakshatra also carry an approximate END time (linear extrapolation
 * of the Moon−Sun / Moon rate over the next hour — good to a few minutes).
 *
 * SOURCES: classical Panchanga definitions; sunrise equation per the standard
 * NOAA/Wikipedia formulation. Location-dependent timings use a reference point
 * (defaults to central India) — the five angas themselves are location-agnostic.
 */

import {
  julianDay,
  lahiriAyanamsa,
  sunTropicalLongitude,
  moonTropicalLongitude,
} from './ephemeris';
import { NAKSHATRA_NAMES } from './kundli';

const NAK_SPAN = 360 / 27; // 13.3333°
const TITHI_SPAN = 12;
const KARANA_SPAN = 6;

function norm360(x: number): number {
  let v = x % 360;
  if (v < 0) v += 360;
  return v;
}

/** Julian Day (UT) for a JS Date, from its UTC components. */
function jdFromDate(d: Date): number {
  const dayFrac =
    d.getUTCDate() +
    (d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600) / 24;
  return julianDay(d.getUTCFullYear(), d.getUTCMonth() + 1, dayFrac);
}

/** JD (UT) -> absolute Date. */
function jdToDate(jd: number): Date {
  return new Date((jd - 2440587.5) * 86400000);
}

function siderealSunMoon(jd: number): { sun: number; moon: number } {
  const ay = lahiriAyanamsa(jd);
  return {
    sun: norm360(sunTropicalLongitude(jd) - ay),
    moon: norm360(moonTropicalLongitude(jd) - ay),
  };
}

// --- Names --------------------------------------------------------------------

const VARA_NAMES = [
  'Ravivara', 'Somavara', 'Mangalavara', 'Budhavara', 'Guruvara', 'Shukravara', 'Shanivara',
];
const VARA_ENGLISH = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const VARA_LORDS = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn'];

const TITHI_NAMES = [
  'Pratipada', 'Dwitiya', 'Tritiya', 'Chaturthi', 'Panchami', 'Shashthi', 'Saptami',
  'Ashtami', 'Navami', 'Dashami', 'Ekadashi', 'Dwadashi', 'Trayodashi', 'Chaturdashi',
];

const YOGA_NAMES = [
  'Vishkambha', 'Priti', 'Ayushman', 'Saubhagya', 'Shobhana', 'Atiganda', 'Sukarma',
  'Dhriti', 'Shula', 'Ganda', 'Vriddhi', 'Dhruva', 'Vyaghata', 'Harshana', 'Vajra',
  'Siddhi', 'Vyatipata', 'Variyana', 'Parigha', 'Shiva', 'Siddha', 'Sadhya', 'Shubha',
  'Shukla', 'Brahma', 'Indra', 'Vaidhriti',
];

const KARANA_MOVABLE = ['Bava', 'Balava', 'Kaulava', 'Taitila', 'Gara', 'Vanija', 'Vishti'];

/** Karana name for an absolute half-tithi index 0..59 within the lunar month. */
function karanaName(halfIndex: number): string {
  if (halfIndex === 0) return 'Kimstughna';
  if (halfIndex >= 57) return ['Shakuni', 'Chatushpada', 'Naga'][halfIndex - 57];
  return KARANA_MOVABLE[(halfIndex - 1) % 7];
}

// Weekday (0=Sun..6=Sat) -> which 1/8 slot of the daytime (1-based).
const RAHU_SLOT = [8, 2, 7, 5, 6, 4, 3];
const YAMA_SLOT = [5, 4, 3, 2, 1, 7, 6];
const GULIKA_SLOT = [7, 6, 5, 4, 3, 2, 1];

// --- Sunrise / sunset (NOAA sunrise equation) --------------------------------

const RAD = Math.PI / 180;

/**
 * Sunrise & sunset as absolute UTC Dates for the civil day containing `date`,
 * at the given latitude / east-longitude. Returns null for polar day/night.
 */
function sunriseSunset(
  date: Date,
  latitude: number,
  eastLongitude: number,
): { sunrise: Date; sunset: Date } | null {
  const sinDeg = (x: number) => Math.sin(x * RAD);
  const cosDeg = (x: number) => Math.cos(x * RAD);
  const lw = -eastLongitude; // algorithm uses west longitude as positive

  // Julian dates: jd0 = 0h UT of the civil day (ends in .5); jdNoon = 12h UT.
  const jd0 = julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate());
  const jdNoon = jd0 + 0.5;

  const D = jdNoon - 2451545.0; // days since J2000 at noon UT
  const M = norm360(357.5291 + 0.98560028 * D); // solar mean anomaly
  const C =
    1.9148 * sinDeg(M) + 0.02 * sinDeg(2 * M) + 0.0003 * sinDeg(3 * M); // equation of centre
  const lambda = norm360(M + C + 282.9372); // ecliptic longitude (180 + 102.9372)

  // Julian date of solar transit (local solar noon): noon UT shifted by the
  // longitude (lw/360 day) plus the equation-of-time correction.
  const Jtransit =
    jdNoon + lw / 360 + 0.0053 * sinDeg(M) - 0.0069 * sinDeg(2 * lambda);

  const sinDec = sinDeg(lambda) * sinDeg(23.44);
  const cosDec = Math.cos(Math.asin(sinDec));
  const cosOmega =
    (sinDeg(-0.833) - sinDeg(latitude) * sinDec) / (cosDeg(latitude) * cosDec);
  if (cosOmega < -1 || cosOmega > 1) return null; // sun never rises/sets

  const omega = Math.acos(cosOmega) / RAD; // half-day arc, degrees
  return {
    sunrise: jdToDate(Jtransit - omega / 360),
    sunset: jdToDate(Jtransit + omega / 360),
  };
}

// --- Public API ---------------------------------------------------------------

export interface AngaEnd {
  name: string;
  /** Approximate end time of this anga (null if not computed). */
  endsAt: Date | null;
}

export interface KalamPeriod {
  name: string;
  start: Date;
  end: Date;
}

export interface Panchang {
  date: Date;
  vara: { name: string; english: string; lord: string };
  paksha: 'Shukla' | 'Krishna';
  tithi: AngaEnd & { paksha: 'Shukla' | 'Krishna'; number: number };
  nakshatra: AngaEnd & { number: number };
  yoga: { name: string; number: number };
  karana: { name: string };
  sunrise: Date | null;
  sunset: Date | null;
  rahuKalam: KalamPeriod | null;
  yamaganda: KalamPeriod | null;
  gulika: KalamPeriod | null;
  /** True when timings use the region reference rather than an exact location. */
  timingsApproximate: boolean;
}

/** Which 1/8 slot [start,end] of the daytime a weekday assigns to a period. */
function slotPeriod(
  name: string,
  slot: number,
  sunrise: Date,
  sunset: Date,
): KalamPeriod {
  const dayMs = sunset.getTime() - sunrise.getTime();
  const part = dayMs / 8;
  const start = new Date(sunrise.getTime() + (slot - 1) * part);
  const end = new Date(sunrise.getTime() + slot * part);
  return { name, start, end };
}

/**
 * Compute the Panchang for `now` at the given location (defaults to a central
 * India reference for the location-dependent timings).
 */
export function computePanchang(
  now: Date = new Date(),
  latitude = 22,
  eastLongitude = 79,
): Panchang {
  const jd = jdFromDate(now);
  const { sun, moon } = siderealSunMoon(jd);

  // Rates over the next hour (deg/hour) for end-time extrapolation.
  const jd2 = jd + 1 / 24;
  const nxt = siderealSunMoon(jd2);
  const angDiff = (b: number, a: number) => {
    let d = b - a;
    if (d > 180) d -= 360;
    else if (d < -180) d += 360;
    return d;
  };
  const elongRate = angDiff(nxt.moon - nxt.sun, moon - sun); // deg/hr
  const moonRate = angDiff(nxt.moon, moon); // deg/hr

  // Tithi (Moon − Sun elongation).
  const elong = norm360(moon - sun);
  const tithiAbs = Math.floor(elong / TITHI_SPAN); // 0..29
  const paksha: 'Shukla' | 'Krishna' = tithiAbs < 15 ? 'Shukla' : 'Krishna';
  const tithiInPaksha = tithiAbs % 15; // 0..14
  let tithiName: string;
  if (tithiInPaksha === 14) tithiName = paksha === 'Shukla' ? 'Purnima' : 'Amavasya';
  else tithiName = TITHI_NAMES[tithiInPaksha];
  const tithiRemainingDeg = TITHI_SPAN - (elong % TITHI_SPAN);
  const tithiEndsAt =
    elongRate > 0
      ? new Date(now.getTime() + (tithiRemainingDeg / elongRate) * 3600000)
      : null;

  // Nakshatra.
  const nakAbs = Math.floor(moon / NAK_SPAN); // 0..26
  const nakName = NAKSHATRA_NAMES[nakAbs] ?? `Nakshatra ${nakAbs + 1}`;
  const nakRemainingDeg = NAK_SPAN - (moon % NAK_SPAN);
  const nakEndsAt =
    moonRate > 0
      ? new Date(now.getTime() + (nakRemainingDeg / moonRate) * 3600000)
      : null;

  // Yoga (Sun + Moon).
  const yogaAbs = Math.floor(norm360(sun + moon) / NAK_SPAN); // 0..26
  const yogaName = YOGA_NAMES[yogaAbs] ?? `Yoga ${yogaAbs + 1}`;

  // Karana (half-tithi).
  const karanaAbs = Math.floor(elong / KARANA_SPAN); // 0..59
  const karana = karanaName(karanaAbs);

  // Vara (weekday) — use the IST civil day (the sun timings below are an India
  // reference), so the weekday and the Rahu-Kalam slot match the displayed day
  // regardless of the device's own timezone.
  const IST_OFFSET_MS = 5.5 * 3600000;
  const wd = new Date(now.getTime() + IST_OFFSET_MS).getUTCDay(); // 0=Sun..6=Sat

  // Sun timings + inauspicious periods — for the IST civil day.
  const istNow = new Date(now.getTime() + IST_OFFSET_MS);
  const st = sunriseSunset(istNow, latitude, eastLongitude);
  let rahuKalam: KalamPeriod | null = null;
  let yamaganda: KalamPeriod | null = null;
  let gulika: KalamPeriod | null = null;
  if (st) {
    rahuKalam = slotPeriod('Rahu Kalam', RAHU_SLOT[wd], st.sunrise, st.sunset);
    yamaganda = slotPeriod('Yamaganda', YAMA_SLOT[wd], st.sunrise, st.sunset);
    gulika = slotPeriod('Gulika Kalam', GULIKA_SLOT[wd], st.sunrise, st.sunset);
  }

  return {
    date: now,
    vara: { name: VARA_NAMES[wd], english: VARA_ENGLISH[wd], lord: VARA_LORDS[wd] },
    paksha,
    tithi: { name: tithiName, endsAt: tithiEndsAt, paksha, number: tithiInPaksha + 1 },
    nakshatra: { name: nakName, endsAt: nakEndsAt, number: nakAbs + 1 },
    yoga: { name: yogaName, number: yogaAbs + 1 },
    karana: { name: karana },
    sunrise: st?.sunrise ?? null,
    sunset: st?.sunset ?? null,
    rahuKalam,
    yamaganda,
    gulika,
    timingsApproximate: true,
  };
}
