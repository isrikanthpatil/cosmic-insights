/**
 * utils/numerologyDetail.ts
 *
 * Extra, grounded numerology detail for the enriched report: the Name Number
 * (Chaldean letter values, as used by classic Indian numerology software) and a
 * per-number table of ruling planet, career, health, relationships and
 * favourables. Deterministic lookups — no invented prediction.
 */

import { GEMSTONE_BY_PLANET, Planet } from './jyotish/gemstones';

// Chaldean letter values (A,I,J,Q,Y=1; B,K,R=2; C,G,L,S=3; D,M,T=4;
// E,H,N,X=5; U,V,W=6; O,Z=7; F,P=8; 9 is unassigned).
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

function reduceToDigit(n: number): number {
  while (n > 9) n = String(n).split('').reduce((s, d) => s + Number(d), 0);
  return n;
}

/** Name Number from the full name (Chaldean values, reduced to 1-9). */
export function computeNameNumber(fullName: string): { total: number; number: number } {
  const letters = (fullName || '').toUpperCase().replace(/[^A-Z]/g, '').split('');
  const total = letters.reduce((s, ch) => s + (CHALDEAN[ch] || 0), 0);
  return { total, number: total > 0 ? reduceToDigit(total) : 0 };
}

export interface NumberDetail {
  planet: Planet;
  title: string;
  career: string;
  health: string;
  relationships: string;
  day: string;
  colour: string;
  direction: string;
  luckyNumbers: number[];
  gemstone: string; // English gem name
}

const P = (planet: Planet) => GEMSTONE_BY_PLANET[planet].stone;

export const NUMBER_DETAIL: Record<number, NumberDetail> = {
  1: { planet: 'Sun', title: 'The Leader', career: 'Leadership, administration, government, or running your own venture — roles where you can direct and take responsibility.', health: 'Heart, eyes and blood pressure. Stay active and guard against ego-driven overexertion.', relationships: 'Loyal and protective, though you can be dominating; you thrive with a partner who respects your independence.', day: 'Sunday', colour: 'Gold, orange, deep yellow', direction: 'East', luckyNumbers: [1, 3, 5, 9], gemstone: P('Sun') },
  2: { planet: 'Moon', title: 'The Diplomat', career: 'Caregiving, hospitality, arts, counselling and collaborative or public-facing work.', health: 'Mind, stomach and sleep. Protect your emotional balance and rest well.', relationships: 'Gentle, romantic and intuitive; you need security and quiet reassurance.', day: 'Monday', colour: 'White, cream, silver', direction: 'North-West', luckyNumbers: [1, 2, 4, 7], gemstone: P('Moon') },
  3: { planet: 'Jupiter', title: 'The Sage', career: 'Teaching, law, finance, advisory, writing and consulting — anywhere wisdom is valued.', health: 'Liver, weight and circulation. Moderation in food and drink serves you.', relationships: 'Warm, generous and principled; you value a partner who shares your ideals.', day: 'Thursday', colour: 'Yellow, saffron', direction: 'North-East', luckyNumbers: [1, 3, 6, 9], gemstone: P('Jupiter') },
  4: { planet: 'Rahu', title: 'The Builder', career: 'Technology, engineering, research, systems and unconventional or reformative paths.', health: 'Nervous system and allergies. Routine, grounding and steady sleep help greatly.', relationships: 'Loyal but unconventional; you need a partner who understands your independent streak.', day: 'Saturday', colour: 'Grey, khaki, electric blue', direction: 'South-West', luckyNumbers: [1, 4, 5, 7], gemstone: P('Rahu') },
  5: { planet: 'Mercury', title: 'The Communicator', career: 'Communication, sales, media, travel, trade, IT and networking.', health: 'Nerves and skin. Manage restlessness and mental over-stimulation.', relationships: 'Charming, adaptable and communicative; you need mental spark and freedom.', day: 'Wednesday', colour: 'Green, light blue', direction: 'North', luckyNumbers: [1, 3, 5, 6], gemstone: P('Mercury') },
  6: { planet: 'Venus', title: 'The Nurturer', career: 'Arts, design, beauty, hospitality, luxury and relationship-centred or caring work.', health: 'Kidneys, throat and reproductive system. Balance indulgence.', relationships: 'Loving, devoted and aesthetic; you flourish in a harmonious, beautiful home.', day: 'Friday', colour: 'White, pink, pastel blue', direction: 'South-East', luckyNumbers: [3, 5, 6, 9], gemstone: P('Venus') },
  7: { planet: 'Ketu', title: 'The Seeker', career: 'Research, spirituality, analysis, healing and philosophy — the depths and the unseen.', health: 'Immunity and subtle ailments. Rest and inner practices restore you.', relationships: 'Deep, private and soulful; you need space and a meaningful connection.', day: 'Monday', colour: 'Smoky grey, muted tones', direction: 'North-East', luckyNumbers: [2, 4, 5, 7], gemstone: P('Ketu') },
  8: { planet: 'Saturn', title: 'The Achiever', career: 'Business, real estate, law, administration and long-term, structured ventures.', health: 'Bones, joints and teeth. Keep steady routines and avoid chronic overwork.', relationships: 'Committed and dependable though reserved; loyalty matters more to you than romance.', day: 'Saturday', colour: 'Deep blue, black, dark grey', direction: 'West', luckyNumbers: [3, 5, 6, 8], gemstone: P('Saturn') },
  9: { planet: 'Mars', title: 'The Warrior', career: 'Defence, sports, surgery, engineering, entrepreneurship and leadership under pressure.', health: 'Blood, inflammation and injuries. Channel your energy and manage anger.', relationships: 'Passionate and protective; you need a partner who can match your intensity.', day: 'Tuesday', colour: 'Red, coral, crimson', direction: 'South', luckyNumbers: [1, 3, 5, 9], gemstone: P('Mars') },
};

export function numberDetail(n: number): NumberDetail | null {
  return NUMBER_DETAIL[n] ?? null;
}
