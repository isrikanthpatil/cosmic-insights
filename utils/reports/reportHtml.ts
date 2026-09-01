/**
 * utils/reports/reportHtml.ts
 *
 * Builds branded, print-friendly, multi-page HTML for the three Astropanth reports
 * (Astrology, Numerology, Gemstone). Same HTML drives the in-app WebView preview
 * and the expo-print PDF. Everything is deterministic + grounded — real positions
 * with curated interpretations, never invented prediction.
 */

import type { Profile } from '@/contexts/AuthContext';
import type { EphemerisInput } from '../jyotish/ephemeris';
import { computeKundli, NAKSHATRA_INFO } from '../jyotish/kundli';
import { getAstrologyReading, getCoordinatesForPlace } from '../astrology';
import { getNumerologyReading } from '../numerology';
import { recommendGemstones } from '../jyotish/gemstones';
import { computeBirthAngas } from '../jyotish/panchang';
import { parseDDMMYYYY } from '../dateUtils';
import {
  SIGN_LORD, SIGN_NAMES, SIGN_SANSKRIT, interpretPlacement, degWithinSign,
  planetDignity, type Planet,
} from '../jyotish/interpret';
import { computeNameNumber, numberDetail } from '../numerologyDetail';
import { computeForecast, type Period } from '../jyotish/forecast';

const GRAHA_ORDER: Planet[] = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];
const NAK_SPAN = 360 / 27;
const PADA_SPAN = NAK_SPAN / 4;

function esc(s: unknown): string {
  return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function chartInput(p: Profile): EphemerisInput {
  const c = getCoordinatesForPlace(p.placeOfBirth) ?? { latitude: 22, longitude: 79 };
  return { dateOfBirth: p.dateOfBirth, timeOfBirth: p.timeOfBirth || undefined, latitude: c.latitude, longitude: c.longitude };
}

const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

function ymd(years: number): string {
  const y = Math.floor(years);
  const mo = Math.floor((years - y) * 12);
  const d = Math.round((((years - y) * 12) - mo) * 30);
  return `${y}y ${mo}m ${d}d`;
}
function ayanamsaStr(a: number): string {
  const deg = Math.floor(a);
  const min = Math.floor((a - deg) * 60);
  return `${deg}°${String(min).padStart(2, '0')}' (Lahiri)`;
}
function padaOf(sidLong: number): number {
  const within = sidLong - Math.floor(sidLong / NAK_SPAN) * NAK_SPAN;
  return Math.floor(within / PADA_SPAN) + 1;
}

function shell(reportTitle: string, subject: Profile, bodyHtml: string): string {
  const fullName = `${subject.firstName ?? ''} ${subject.lastName ?? ''}`.trim() || 'Guest';
  const born = [subject.dateOfBirth, subject.timeOfBirth, subject.placeOfBirth].filter(Boolean).map(esc).join(' · ');
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #FBF7EF; color: #23203A;
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 13.5px; line-height: 1.55; }
  .page { max-width: 760px; margin: 0 auto; padding: 26px 26px 60px; }
  h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; color: #1A1638; margin: 0; }
  .brandbar { display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #C9A24B; padding-bottom: 14px; margin-bottom: 16px; }
  .brandlock { display: flex; align-items: center; gap: 8px; }
  .mark { width: 26px; height: 26px; border-radius: 8px; display: flex; align-items: center;
    justify-content: center; background: rgba(184,137,47,0.10); border: 1px solid rgba(184,137,47,0.45);
    color: #B8892F; font-size: 15px; line-height: 1; }
  .brand { font-family: Georgia, serif; font-size: 20px; color: #1A1638; letter-spacing: .5px; }
  .brand span { color: #B8892F; }
  .kicker { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #B8892F; }
  .title { font-size: 28px; margin: 4px 0 6px; }
  .subject { color: #5A5470; font-size: 12.5px; }
  .section { margin-top: 24px; page-break-inside: avoid; }
  .section h2 { font-size: 17px; border-left: 4px solid #C9A24B; padding-left: 10px; margin-bottom: 12px; }
  .snap { display: flex; gap: 10px; flex-wrap: wrap; }
  .snapcard { flex: 1; min-width: 130px; border: 1px solid #E7DFCB; border-radius: 10px; background: #FFFDF8; padding: 11px 13px; }
  .snapcard .lbl { font-size: 10.5px; letter-spacing: 1px; text-transform: uppercase; color: #9A8F6B; }
  .snapcard .val { font-family: Georgia, serif; font-size: 19px; color: #1A1638; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  th, td { text-align: left; padding: 7px 9px; border-bottom: 1px solid #ECE4D2; vertical-align: top; }
  th { color: #7A7052; font-size: 10.5px; letter-spacing: 1px; text-transform: uppercase; }
  .kv td:first-child { color: #7A7052; width: 42%; }
  ul { margin: 6px 0; padding-left: 20px; } li { margin-bottom: 5px; }
  .card { border: 1px solid #E7DFCB; border-radius: 10px; background: #FFFDF8; padding: 13px 15px; margin-bottom: 10px; page-break-inside: avoid; }
  .interp { border-left: 3px solid #E3D5AE; padding: 4px 0 4px 12px; margin: 9px 0; }
  .interp b { color: #1A1638; }
  .gemhead { display: flex; align-items: baseline; justify-content: space-between; }
  .gemstone { font-family: Georgia, serif; font-size: 19px; color: #1A1638; }
  .gemrole { font-size: 10.5px; letter-spacing: 1px; text-transform: uppercase; color: #B8892F; }
  .meta { color: #5A5470; font-size: 12px; margin-top: 4px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 250px; }
  .cell { border: 1px solid #E1D8BF; border-radius: 8px; background: #FFFDF8; text-align: center; padding: 12px 0; font-family: Georgia, serif; font-size: 15px; color: #1A1638; }
  .cell.empty { color: #C9BFA3; }
  .caution { border: 1px solid #E5C6A0; background: #FBF1E4; border-radius: 10px; padding: 12px 14px; color: #7A5A2E; font-size: 12px; }
  .footer { margin-top: 30px; border-top: 1px solid #E7DFCB; padding-top: 12px; color: #9A8F6B; font-size: 10.5px; text-align: center; }
</style></head>
<body><div class="page">
  <div class="brandbar"><div class="brandlock"><div class="mark">✦</div><div class="brand">Astro<span>panth</span></div></div><div class="kicker">${esc(today())}</div></div>
  <div class="kicker">${esc(reportTitle)}</div>
  <div class="title">${esc(fullName)}</div>
  <div class="subject">${born || 'Birth details not provided'}</div>
  ${bodyHtml}
  <div class="footer">Generated by Astropanth · Vedic (sidereal / Lahiri) calculations · astropanth.com<br>
  Offered for guidance and self-reflection; not a substitute for professional advice.</div>
</div></body></html>`;
}

function list(items: string[] | undefined, limit = 8): string {
  const arr = (items ?? []).filter(Boolean).slice(0, limit);
  if (arr.length === 0) return '<p class="meta">—</p>';
  return `<ul>${arr.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>`;
}

// ---------------------------------------------------------------- Astrology ---
export function buildAstrologyReportHtml(p: Profile): string {
  const k = computeKundli(chartInput(p));
  const reading = getAstrologyReading(p.dateOfBirth, p.placeOfBirth, p.timeOfBirth || undefined);
  const byName = (n: string) => k.grahas.find((g) => g.name === n);

  const sun = byName('Sun');
  const moon = byName('Moon');
  const angas = sun && moon ? computeBirthAngas(sun.siderealLongitude, moon.siderealLongitude) : null;

  const bd = parseDDMMYYYY(p.dateOfBirth);
  const weekday = bd ? bd.toLocaleDateString('en-GB', { weekday: 'long' }) : '';
  const starLord = NAKSHATRA_INFO[k.moonNakshatra - 1]?.lord ?? '';
  const rasiLord = SIGN_LORD[k.moonRashi - 1];
  const lagnaLord = k.lagnaRashi ? SIGN_LORD[k.lagnaRashi - 1] : null;

  // Birth details table.
  const kv: [string, string][] = [
    ['Name', `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim()],
    ['Date of Birth', `${esc(p.dateOfBirth)}${weekday ? ', ' + weekday : ''}`],
    ['Time of Birth', p.timeOfBirth || 'Not provided'],
    ['Place of Birth', p.placeOfBirth || '—'],
    ['Ayanamsa', ayanamsaStr(k.ayanamsa)],
    ['Dasha System', 'Vimshottari (120 years)'],
    ['Janma Nakshatra', `${k.moonNakshatraName}, Pada ${k.moonPada} (lord ${starLord})`],
    ['Birth Rasi (Moon)', `${k.moonRashiName} (lord ${rasiLord})`],
    ['Lagna (Ascendant)', k.lagnaName ? `${k.lagnaName} (lord ${lagnaLord})` : 'Needs birth time'],
    ['Tithi', angas ? `${angas.paksha} ${angas.tithiName}` : '—'],
    ['Karana', angas ? angas.karanaName : '—'],
    ['Nithya Yoga', angas ? angas.yogaName : '—'],
  ];
  const detailsTable = `<table class="kv"><tbody>${kv.map(([a, b]) => `<tr><td>${esc(a)}</td><td>${esc(b)}</td></tr>`).join('')}</tbody></table>`;

  // Planetary positions.
  const rows = GRAHA_ORDER.map((n) => {
    const g = byName(n);
    if (!g) return '';
    const dignity = planetDignity(n, g.rashi);
    return `<tr><td>${esc(n)}</td><td>${esc(g.rashiName)}</td><td>${degWithinSign(g.siderealLongitude)}</td><td>${esc(g.nakshatraName)}</td><td>${padaOf(g.siderealLongitude)}</td><td>${g.house ?? '—'}</td><td>${g.retrograde ? 'R' : ''}</td><td>${esc(dignity)}</td></tr>`;
  }).join('');

  // Per-planet interpretations.
  const interps = GRAHA_ORDER.map((n) => {
    const g = byName(n);
    if (!g) return '';
    return `<div class="interp"><b>${esc(n)}</b> — ${esc(interpretPlacement(n, g.rashi, g.house))}</div>`;
  }).join('');

  // Lagna analysis.
  let lagnaHtml = '<p class="meta">Add an exact birth time to reveal your Ascendant and its analysis.</p>';
  if (k.lagnaRashi && lagnaLord) {
    const idx = k.lagnaRashi - 1;
    lagnaHtml = `<p>Your Ascendant is <b>${esc(SIGN_NAMES[idx])}</b> (${esc(SIGN_SANSKRIT[idx])}), ruled by <b>${esc(lagnaLord)}</b>. The rising sign shapes your outward personality, temperament and how you meet the world; its lord's placement (see the table) is a key to your life's direction.</p>`;
  }

  // Dasha.
  let dashaHtml = '<p class="meta">Add your birth time for the Dasha timeline.</p>';
  if (k.dasha) {
    const d = k.dasha;
    const bal = d.mahadashas[0];
    const seq = d.mahadashas.map((m, i) =>
      `<tr${i === d.currentMahaIndex ? ' style="background:#FBF3DF"' : ''}><td>${esc(m.lord)}</td><td>${fmtDate(m.start)}</td><td>${fmtDate(m.end)}</td><td>${ymd(m.years)}</td></tr>`).join('');
    const cur = `<p><b>Now running:</b> ${esc(d.mahadashas[d.currentMahaIndex].lord)} Mahadasha` +
      (d.currentAntar ? ` → ${esc(d.currentAntar.lord)} Antardasha` : '') +
      (d.currentPratyantar ? ` → ${esc(d.currentPratyantar.lord)} Pratyantardasha` : '') + `</p>`;
    dashaHtml = `<p class="meta">Dasha balance at birth: ${esc(bal.lord)} ${ymd(bal.years)}.</p>${cur}
      <table><thead><tr><th>Mahadasha</th><th>From</th><th>To</th><th>Duration</th></tr></thead><tbody>${seq}</tbody></table>`;
  }

  const body = `
  <div class="section"><h2>Birth Details</h2>${detailsTable}</div>
  <div class="section"><h2>Vedic Snapshot</h2>
    <div class="snap">
      <div class="snapcard"><div class="lbl">Sun · Surya</div><div class="val">${esc(reading.sunSign)}</div></div>
      <div class="snapcard"><div class="lbl">Moon · Chandra</div><div class="val">${esc(reading.moonSign)}</div></div>
      <div class="snapcard"><div class="lbl">Ascendant · Lagna</div><div class="val">${esc(reading.ascendant || 'Add birth time')}</div></div>
    </div>
  </div>
  <div class="section"><h2>Planetary Positions (Nirayana)</h2>
    <table><thead><tr><th>Graha</th><th>Rasi</th><th>Degree</th><th>Nakshatra</th><th>Pada</th><th>House</th><th>Motion</th><th>Dignity</th></tr></thead><tbody>${rows}</tbody></table>
    ${k.lowConfidence ? '<p class="meta">Houses use noon as an estimate — add an exact birth time for precise houses and Lagna.</p>' : ''}
  </div>
  <div class="section"><h2>What Your Planets Say</h2>${interps}</div>
  <div class="section"><h2>Your Ascendant (Lagna)</h2>${lagnaHtml}</div>
  <div class="section"><h2>Vimshottari Dasha</h2>${dashaHtml}</div>
  <div class="section"><h2>Core Traits</h2>${list(reading.traits)}</div>
  <div class="section"><h2>Strengths</h2>${list(reading.positivePoints)}
    <h2 style="margin-top:16px">Growth Areas</h2>${list(reading.negativePoints)}</div>
  <div class="section"><h2>Remedies</h2>${list(reading.remedies)}</div>`;
  return shell('Vedic Astrology Report', p, body);
}

// --------------------------------------------------------------- Numerology ---
export function buildNumerologyReportHtml(p: Profile): string {
  const n = getNumerologyReading(p.firstName, p.lastName, p.dateOfBirth, p.gender);
  const fullName = `${p.firstName ?? ''} ${p.lastName ?? ''}`.trim();
  const nameNum = computeNameNumber(fullName);
  const bd = numberDetail(n.birthNumber);
  const nameDet = numberDetail(nameNum.number);

  const gridNumbers = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
  const gridCells = gridNumbers.map((row, r) => row.map((num, c) => {
    const count = n.loshuGrid?.[r]?.[c] ?? 0;
    const content = count > 0 ? String(num).repeat(count) : '·';
    return `<div class="cell ${count === 0 ? 'empty' : ''}">${content}</div>`;
  }).join('')).join('');

  const favTable = bd ? `<table class="kv"><tbody>
    <tr><td>Ruling planet</td><td>${esc(bd.planet)}</td></tr>
    <tr><td>Favourable day</td><td>${esc(bd.day)}</td></tr>
    <tr><td>Favourable colours</td><td>${esc(bd.colour)}</td></tr>
    <tr><td>Favourable direction</td><td>${esc(bd.direction)}</td></tr>
    <tr><td>Harmonious numbers</td><td>${bd.luckyNumbers.join(', ')}</td></tr>
    <tr><td>Supportive gemstone</td><td>${esc(bd.gemstone)}</td></tr>
  </tbody></table>` : '';

  const body = `
  <div class="section"><h2>Your Core Numbers</h2>
    <div class="snap">
      <div class="snapcard"><div class="lbl">Birth · ${esc(n.birthNumberPlanet)}</div><div class="val">${n.birthNumber}</div></div>
      <div class="snapcard"><div class="lbl">Destiny · ${esc(n.destinyNumberPlanet)}</div><div class="val">${n.destinyNumber}</div></div>
      <div class="snapcard"><div class="lbl">Name · Chaldean</div><div class="val">${nameNum.number || '—'}</div></div>
      <div class="snapcard"><div class="lbl">Kua</div><div class="val">${n.kuaNumber}</div></div>
    </div>
  </div>
  <div class="section"><h2>Birth Number ${n.birthNumber}${bd ? ' · ' + esc(bd.title) : ''}</h2>
    <p>${esc(n.birthNumberMeaning)}</p><p class="meta">${esc(n.birthNumberDetail)}</p></div>
  <div class="section"><h2>Destiny Number ${n.destinyNumber}</h2>
    <p>${esc(n.destinyNumberMeaning)}</p><p class="meta">${esc(n.destinyNumberDetail)}</p></div>
  ${nameNum.number > 0 ? `<div class="section"><h2>Name Number ${nameNum.number}</h2>
    <p class="meta">From "${esc(fullName)}" (Chaldean total ${nameNum.total} → ${nameNum.number}).</p>
    ${nameDet ? `<p>As a ${esc(nameDet.title)} vibration ruled by ${esc(nameDet.planet)}, your name reinforces these qualities in how the world receives you.</p>` : ''}</div>` : ''}
  <div class="section"><h2>Kua Number ${n.kuaNumber}</h2><p>${esc(n.kuaNumberMeaning)}</p></div>
  ${bd ? `
  <div class="section"><h2>Career &amp; Vocation</h2><p>${esc(bd.career)}</p></div>
  <div class="section"><h2>Health</h2><p>${esc(bd.health)}</p></div>
  <div class="section"><h2>Relationships</h2><p>${esc(bd.relationships)}</p></div>
  <div class="section"><h2>Your Favourables</h2>${favTable}</div>` : ''}
  <div class="section"><h2>Lo Shu Grid</h2><div class="grid3">${gridCells}</div>
    <p class="meta">Repeated digits show emphasis; a dot marks a missing number — an area to consciously develop.</p></div>
  <div class="section"><h2>Remedies</h2>${list(n.remedies)}</div>`;
  return shell('Numerology Report', p, body);
}

// ----------------------------------------------------------------- Gemstone ---
const SUBSTITUTE: Record<string, string> = {
  'Ruby': 'Red Garnet or Red Spinel', 'Pearl': 'Moonstone', 'Red Coral': 'Carnelian',
  'Emerald': 'Green Tourmaline or Peridot', 'Yellow Sapphire': 'Citrine or Yellow Topaz',
  'Diamond': 'White Sapphire or White Zircon', 'Blue Sapphire': 'Amethyst or Blue Topaz',
  'Hessonite': 'Golden-brown Zircon', "Cat's Eye": 'Chrysoberyl (lower grade)',
};

export function buildGemstoneReportHtml(p: Profile): string {
  const g = recommendGemstones(chartInput(p));
  const gemCard = (r: (typeof g.recommendations)[number]) => `
    <div class="card">
      <div class="gemhead"><span class="gemstone">${esc(r.info.stone)} <span class="meta">(${esc(r.info.hindi)})</span></span><span class="gemrole">${esc(r.role)}</span></div>
      <div class="meta">${esc(r.basis)}</div>
      <p style="margin:8px 0 4px">${esc(r.info.note)}</p>
      <div class="meta">Finger: ${esc(r.info.finger)} · Metal: ${esc(r.info.metal)} · Day: ${esc(r.info.day)} · Mantra: ${esc(r.info.mantra)}</div>
      ${SUBSTITUTE[r.info.stone] ? `<div class="meta">Budget substitute: ${esc(SUBSTITUTE[r.info.stone])}.</div>` : ''}
    </div>`;

  const body = `
  <div class="section"><h2>How this is derived</h2>
    <p>Based on your ${g.lagnaBased ? 'Ascendant (Lagna)' : 'Moon sign'} — <b>${esc(g.ascendantOrMoonSignName)}</b>${g.lagnaBased ? '' : ' (no birth time provided, so the Moon sign is used)'}. Your life stone is ruled by the ${g.lagnaBased ? 'Lagna' : 'Moon-sign'} lord; the lucky and creative stones by the 9th and 5th house lords (the auspicious trine lords).</p></div>
  <div class="section"><h2>Recommended Gemstones</h2>${g.recommendations.map(gemCard).join('')}</div>
  <div class="section"><h2>Choosing &amp; Wearing</h2>
    <ul>
      <li>Use a natural, untreated, eye-clean stone of at least ~3–5 carats, set so it touches the skin.</li>
      <li>First wear on the stone's day, in the morning: cleanse it in raw milk / Ganga water, recite its mantra 108 times, then wear it.</li>
      <li>A budget substitute (listed with each stone) carries a gentler version of the same energy.</li>
      <li>Start on a trial basis and observe the effects over a few weeks.</li>
    </ul></div>
  <div class="section"><div class="caution"><b>Important:</b> Gemstones are considered powerful in Jyotish and are not one-size-fits-all. Blue Sapphire (Neelam) in particular is very fast-acting and must be trialled carefully. Please consult a qualified astrologer with your full chart before wearing any gemstone.</div></div>`;
  return shell('Gemstone Recommendation', p, body);
}

// ------------------------------------------------------------------ Forecast --
export function buildForecastReportHtml(p: Profile, period: Period): string {
  const f = computeForecast(p, period);

  const transits = f.transits
    .map((t) => `<div class="interp"><b>${esc(t.planet)}</b> — ${esc(t.text)}</div>`)
    .join('');

  const focus = f.focus
    .map((a) => `<div class="card"><b>${esc(a.area)}</b><p style="margin:6px 0 0">${esc(a.text)}</p></div>`)
    .join('');

  const monthsHtml = period === 'yearly' && f.months.length
    ? `<div class="section"><h2>Month by Month</h2>
        <table><thead><tr><th>Month</th><th>Tone</th><th>Note</th></tr></thead><tbody>
        ${f.months.map((m) => `<tr><td>${esc(m.label)}</td><td>${m.favourable ? 'Active' : 'Quieter'}</td><td>${esc(m.text)}</td></tr>`).join('')}
        </tbody></table></div>`
    : '';

  const body = `
  <div class="section"><h2>Overview</h2>
    <p><b>Period:</b> ${esc(f.rangeLabel)} &nbsp;·&nbsp; <b>Moon sign:</b> ${esc(f.moonSignName)}</p>
    <p>${esc(f.dashaLine)}</p>
    ${f.sadeSatiLine ? `<p class="meta">${esc(f.sadeSatiLine)}</p>` : ''}
  </div>
  <div class="section"><h2>Major Influences · Transits from your Moon</h2>${transits}</div>
  <div class="section"><h2>Focus Areas</h2>${focus}</div>
  ${monthsHtml}
  <div class="section"><h2>Guidance</h2>${list(f.guidance)}</div>
  <div class="section"><div class="caution">A forecast describes the prevailing planetary influences and tendencies for the period — not fixed events. Use it as a guide for <i>timing and focus</i>; your own choices and effort shape the outcome.</div></div>`;

  return shell(period === 'yearly' ? 'Yearly Forecast' : 'Monthly Forecast', p, body);
}

export type ReportType = 'astrology' | 'numerology' | 'gemstone';

export function buildReportHtml(type: ReportType, p: Profile): string {
  if (type === 'numerology') return buildNumerologyReportHtml(p);
  if (type === 'gemstone') return buildGemstoneReportHtml(p);
  return buildAstrologyReportHtml(p);
}

export const REPORT_META: Record<ReportType, { title: string; file: string }> = {
  astrology: { title: 'Vedic Astrology Report', file: 'Astropanth-Astrology-Report' },
  numerology: { title: 'Numerology Report', file: 'Astropanth-Numerology-Report' },
  gemstone: { title: 'Gemstone Recommendation', file: 'Astropanth-Gemstone-Report' },
};
