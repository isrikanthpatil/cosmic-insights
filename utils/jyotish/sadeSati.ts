/**
 * utils/jyotish/sadeSati.ts
 *
 * Sade Sati & Shani Dhaiya (Saturn's transit relative to the natal Moon).
 * Deterministic — built on the same sidereal (Lahiri) ephemeris.
 *
 * Sade Sati = the ~7.5-year span when transiting Saturn passes through the sign
 * BEFORE the Moon sign (12th), the Moon sign itself (1st), and the sign AFTER it
 * (2nd) — three ~2.5-year phases: Rising, Peak, Setting.
 *
 * Shani Dhaiya ("small panoti") = Saturn transiting the 4th (Kantaka) or 8th
 * (Ashtama) from the Moon — ~2.5 years each.
 *
 * Phase start/end are APPROXIMATE: Saturn retrogrades, so we project sign
 * boundaries from Saturn's mean rate (~12.18°/yr) rather than claim exact dates.
 */

import { computeGrahas } from './ephemeris';
import { RASHI_NAMES } from './kundli';

// Saturn's mean motion: one sign (30°) in ~2.4629 years.
const SATURN_DEG_PER_YEAR = 30 / 2.4629;
const MS_PER_YEAR = 365.25 * 24 * 3600 * 1000;

export type SadeSatiPhase = 'Rising' | 'Peak' | 'Setting';
export type Dhaiya = 'Kantaka' | 'Ashtama';

export interface SadeSatiResult {
  active: boolean; // true when in one of the three Sade Sati phases
  phase: SadeSatiPhase | null;
  dhaiya: Dhaiya | null; // set when not in Sade Sati but in 4th/8th
  saturnRashi: number; // 1-12
  natalMoonRashi: number; // 1-12
  saturnRashiName: string;
  moonRashiName: string;
  /** House of Saturn counted from the Moon (1-12). */
  houseFromMoon: number;
  /** Approx end of the CURRENT sign transit (phase boundary). */
  approxPhaseEnd: Date;
  /** Approx end of the whole Sade Sati (Saturn leaving the 2nd from Moon); null if not active. */
  approxOverallEnd: Date | null;
  /** Approx start of the NEXT Sade Sati (Saturn entering 12th from Moon); null when active. */
  approxNextStart: Date | null;
  title: string;
  summary: string;
  guidance: string;
}

function ddmmyyyy(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/** Years for Saturn to travel `deg` degrees at its mean rate → future Date. */
function yearsToDate(now: Date, deg: number): Date {
  const years = deg / SATURN_DEG_PER_YEAR;
  return new Date(now.getTime() + years * MS_PER_YEAR);
}

const PHASE_GUIDANCE: Record<SadeSatiPhase, string> = {
  Rising:
    "Saturn has entered the sign before your Moon (12th house from it). This first phase often brings rising expenses, changes of place or environment, disturbed sleep, and a pull toward solitude and inner work. It is a time to simplify, conserve your energy, clear old obligations, and rest rather than expand.",
  Peak:
    'Saturn now transits over your Moon sign itself — the central ~2.5 years and usually the most demanding. Responsibilities feel heavier and emotional stamina is tested. Steady routines, patience, honest effort, and looking after your health carry you through. Avoid impulsive, high-stakes decisions made under pressure.',
  Setting:
    'Saturn has moved into the sign after your Moon (2nd house from it). The intensity eases and attention turns to finances, family, and speech. Consolidate the lessons of the last few years, rebuild savings and stability patiently, and speak with care.',
};

const DHAIYA_GUIDANCE: Record<Dhaiya, string> = {
  Kantaka:
    'Saturn transits the 4th from your Moon (Kantaka / Ardha-ashtama Shani, a ~2.5-year "small panoti"). Home, property, vehicles, mother, and inner peace come under review. Attend to domestic matters patiently and protect your peace of mind.',
  Ashtama:
    'Saturn transits the 8th from your Moon (Ashtama Shani, a ~2.5-year "small panoti"). A period that asks for caution with health, sudden changes, and hidden matters. Avoid unnecessary risk and keep to steady, well-tested paths.',
};

const REMEDY_NOTE =
  'Traditional supports include patience and discipline, serving elders and those in need, and — for those who observe it — reciting the Hanuman Chalisa on Saturdays. Offered for reflection, not as prescription.';

/** Compute Saturn's current sidereal rashi (1-12) and longitude for `now`. */
function currentSaturn(now: Date): { rashi: number; longitude: number } {
  const chart = computeGrahas({
    dateOfBirth: ddmmyyyy(now),
    timeOfBirth: '12:00',
    latitude: 22,
    longitude: 79,
  });
  const sat = chart.grahas.find((g) => g.name === 'Saturn')!;
  return { rashi: sat.rashi, longitude: sat.siderealLongitude };
}

export function computeSadeSati(natalMoonRashi: number, now: Date = new Date()): SadeSatiResult {
  const { rashi: saturnRashi, longitude: satLong } = currentSaturn(now);

  // House of Saturn from the Moon (1-12).
  const houseFromMoon = ((saturnRashi - natalMoonRashi + 12) % 12) + 1;

  // Degrees remaining for Saturn to leave its current sign.
  const degIntoSign = satLong % 30;
  const degToNextSign = 30 - degIntoSign;
  const approxPhaseEnd = yearsToDate(now, degToNextSign);

  let phase: SadeSatiPhase | null = null;
  let dhaiya: Dhaiya | null = null;
  if (houseFromMoon === 12) phase = 'Rising';
  else if (houseFromMoon === 1) phase = 'Peak';
  else if (houseFromMoon === 2) phase = 'Setting';
  else if (houseFromMoon === 4) dhaiya = 'Kantaka';
  else if (houseFromMoon === 8) dhaiya = 'Ashtama';

  const active = phase !== null;

  // Overall Sade Sati end = Saturn leaving the 2nd-from-Moon sign.
  let approxOverallEnd: Date | null = null;
  if (active) {
    // Signs still remaining including the current one until the end of "2nd from Moon".
    // Rising=3 signs left, Peak=2, Setting=1.
    const signsLeft = phase === 'Rising' ? 3 : phase === 'Peak' ? 2 : 1;
    const degToOverallEnd = degToNextSign + (signsLeft - 1) * 30;
    approxOverallEnd = yearsToDate(now, degToOverallEnd);
  }

  // Next Sade Sati start = Saturn entering the 12th-from-Moon sign.
  let approxNextStart: Date | null = null;
  if (!active) {
    const startSign = ((natalMoonRashi - 2 + 12) % 12) + 1; // 12th from Moon
    // Signs Saturn must still travel to reach the START of startSign.
    let signsAway = (startSign - saturnRashi + 12) % 12;
    // Degrees to the start of that sign (finish current sign, then whole signs).
    const degToStart = degToNextSign + (signsAway === 0 ? 11 : signsAway - 1) * 30;
    approxNextStart = yearsToDate(now, degToStart);
  }

  const saturnRashiName = RASHI_NAMES[saturnRashi - 1];
  const moonRashiName = RASHI_NAMES[natalMoonRashi - 1];

  let title: string;
  let summary: string;
  let guidance: string;
  if (phase) {
    title = `Sade Sati — ${phase} Phase`;
    summary = `Saturn is transiting ${saturnRashiName} (house ${houseFromMoon} from your Moon in ${moonRashiName}).`;
    guidance = `${PHASE_GUIDANCE[phase]}\n\n${REMEDY_NOTE}`;
  } else if (dhaiya) {
    title = `Shani Dhaiya — ${dhaiya} Shani`;
    summary = `Saturn is transiting ${saturnRashiName} (house ${houseFromMoon} from your Moon in ${moonRashiName}).`;
    guidance = `${DHAIYA_GUIDANCE[dhaiya]}\n\n${REMEDY_NOTE}`;
  } else {
    title = 'No Sade Sati at present';
    summary = `Saturn is transiting ${saturnRashiName} (house ${houseFromMoon} from your Moon in ${moonRashiName}) — outside the Sade Sati and Dhaiya positions.`;
    guidance =
      'This is a comparatively lighter Saturn phase relative to your Moon. A good window to build steady foundations before the next cycle.';
  }

  return {
    active,
    phase,
    dhaiya,
    saturnRashi,
    natalMoonRashi,
    saturnRashiName,
    moonRashiName,
    houseFromMoon,
    approxPhaseEnd,
    approxOverallEnd,
    approxNextStart,
    title,
    summary,
    guidance,
  };
}
