/**
 * utils/reports/reportHtml.ts
 *
 * Builds branded, print-friendly HTML for the three Astropanth reports
 * (Astrology, Numerology, Gemstone). The same HTML string drives BOTH the in-app
 * WebView preview and the expo-print PDF, so there is a single source of truth.
 *
 * Design: a light "parchment" theme (dark navy text, champagne-gold accents) —
 * elegant on screen and economical to print, unlike the app's dark UI.
 */

import type { Profile } from '@/contexts/AuthContext';
import type { EphemerisInput } from '../jyotish/ephemeris';
import { computeKundli } from '../jyotish/kundli';
import { getAstrologyReading, getCoordinatesForPlace } from '../astrology';
import { getNumerologyReading } from '../numerology';
import { recommendGemstones } from '../jyotish/gemstones';

const GRAHA_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu'];

function esc(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function chartInput(p: Profile): EphemerisInput {
  const c = getCoordinatesForPlace(p.placeOfBirth) ?? { latitude: 22, longitude: 79 };
  return {
    dateOfBirth: p.dateOfBirth,
    timeOfBirth: p.timeOfBirth || undefined,
    latitude: c.latitude,
    longitude: c.longitude,
  };
}

const fmtDate = (d: Date) => d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
const today = () => new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });

/** Shared document shell + CSS. */
function shell(reportTitle: string, subject: Profile, bodyHtml: string): string {
  const fullName = `${subject.firstName ?? ''} ${subject.lastName ?? ''}`.trim() || 'Guest';
  const born = [subject.dateOfBirth, subject.timeOfBirth, subject.placeOfBirth].filter(Boolean).map(esc).join(' · ');
  return `<!doctype html><html><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  body { margin: 0; background: #FBF7EF; color: #23203A;
    font-family: -apple-system, "Helvetica Neue", Arial, sans-serif; font-size: 14px; line-height: 1.55; }
  .page { max-width: 760px; margin: 0 auto; padding: 28px 26px 60px; }
  h1, h2, h3 { font-family: Georgia, "Times New Roman", serif; color: #1A1638; margin: 0; }
  .brandbar { display: flex; align-items: center; justify-content: space-between;
    border-bottom: 2px solid #C9A24B; padding-bottom: 14px; margin-bottom: 18px; }
  .brand { font-family: Georgia, serif; font-size: 20px; color: #1A1638; letter-spacing: .5px; }
  .brand span { color: #B8892F; }
  .kicker { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #B8892F; }
  .title { font-size: 30px; margin: 4px 0 6px; }
  .subject { color: #5A5470; font-size: 13px; }
  .section { margin-top: 26px; }
  .section h2 { font-size: 18px; border-left: 4px solid #C9A24B; padding-left: 10px; margin-bottom: 12px; }
  .snap { display: flex; gap: 12px; flex-wrap: wrap; }
  .snapcard { flex: 1; min-width: 150px; border: 1px solid #E7DFCB; border-radius: 10px;
    background: #FFFDF8; padding: 12px 14px; }
  .snapcard .lbl { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #9A8F6B; }
  .snapcard .val { font-family: Georgia, serif; font-size: 20px; color: #1A1638; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ECE4D2; }
  th { color: #7A7052; font-size: 11px; letter-spacing: 1px; text-transform: uppercase; }
  ul { margin: 6px 0; padding-left: 20px; }
  li { margin-bottom: 5px; }
  .card { border: 1px solid #E7DFCB; border-radius: 10px; background: #FFFDF8; padding: 14px 16px; margin-bottom: 10px; }
  .gemhead { display: flex; align-items: baseline; justify-content: space-between; }
  .gemstone { font-family: Georgia, serif; font-size: 20px; color: #1A1638; }
  .gemrole { font-size: 11px; letter-spacing: 1px; text-transform: uppercase; color: #B8892F; }
  .meta { color: #5A5470; font-size: 12.5px; margin-top: 4px; }
  .grid3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 6px; max-width: 260px; }
  .cell { border: 1px solid #E1D8BF; border-radius: 8px; background: #FFFDF8; text-align: center;
    padding: 12px 0; font-family: Georgia, serif; font-size: 16px; color: #1A1638; }
  .cell.empty { color: #C9BFA3; }
  .caution { border: 1px solid #E5C6A0; background: #FBF1E4; border-radius: 10px; padding: 12px 14px; color: #7A5A2E; font-size: 12.5px; }
  .footer { margin-top: 34px; border-top: 1px solid #E7DFCB; padding-top: 12px; color: #9A8F6B; font-size: 11px; text-align: center; }
</style></head>
<body><div class="page">
  <div class="brandbar">
    <div class="brand">Astro<span>panth</span></div>
    <div class="kicker">${esc(today())}</div>
  </div>
  <div class="kicker">${esc(reportTitle)}</div>
  <div class="title">${esc(fullName)}</div>
  <div class="subject">${born || 'Birth details not provided'}</div>
  ${bodyHtml}
  <div class="footer">
    Generated by Astropanth · Vedic (sidereal / Lahiri) calculations · astropanth.com<br>
    This report is offered for guidance and self-reflection and is not a substitute for professional advice.
  </div>
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
  const rows = GRAHA_ORDER.map((n) => {
    const g = byName(n);
    if (!g) return '';
    return `<tr><td>${esc(n)}</td><td>${esc(g.rashiName)}</td><td>${g.house ?? '—'}</td><td>${esc(g.nakshatraName)}</td><td>${g.retrograde ? 'R' : ''}</td></tr>`;
  }).join('');

  let dashaHtml = '<p class="meta">Add your birth time for the Dasha timeline.</p>';
  if (k.dasha) {
    const maha = k.dasha.mahadashas[k.dasha.currentMahaIndex];
    const antar = k.dasha.currentAntar;
    dashaHtml = `<p><strong>Mahadasha:</strong> ${esc(maha.lord)} (${fmtDate(maha.start)} – ${fmtDate(maha.end)})` +
      (antar ? `<br><strong>Antardasha:</strong> ${esc(antar.lord)} (${fmtDate(antar.start)} – ${fmtDate(antar.end)})` : '') + `</p>`;
  }

  const body = `
  <div class="section">
    <h2>Your Vedic Snapshot</h2>
    <div class="snap">
      <div class="snapcard"><div class="lbl">Sun (Surya)</div><div class="val">${esc(reading.sunSign)}</div></div>
      <div class="snapcard"><div class="lbl">Moon (Chandra)</div><div class="val">${esc(reading.moonSign)}</div></div>
      <div class="snapcard"><div class="lbl">Ascendant (Lagna)</div><div class="val">${esc(reading.ascendant || 'Add birth time')}</div></div>
    </div>
  </div>
  <div class="section">
    <h2>Planetary Positions (Graha)</h2>
    <table><thead><tr><th>Graha</th><th>Sign</th><th>House</th><th>Nakshatra</th><th>Motion</th></tr></thead>
    <tbody>${rows}</tbody></table>
    ${k.lowConfidence ? '<p class="meta">Note: houses use noon as an estimate — add an exact birth time for precise houses and Lagna.</p>' : ''}
  </div>
  <div class="section">
    <h2>Current Dasha (Vimshottari)</h2>
    ${dashaHtml}
  </div>
  <div class="section">
    <h2>Core Traits</h2>
    ${list(reading.traits)}
  </div>
  <div class="section">
    <h2>Strengths</h2>
    ${list(reading.positivePoints)}
    <h2 style="margin-top:16px">Growth Areas</h2>
    ${list(reading.negativePoints)}
  </div>
  <div class="section">
    <h2>Remedies</h2>
    ${list(reading.remedies)}
  </div>`;
  return shell('Vedic Astrology Report', p, body);
}

// --------------------------------------------------------------- Numerology ---
export function buildNumerologyReportHtml(p: Profile): string {
  const n = getNumerologyReading(p.firstName, p.lastName, p.dateOfBirth, p.gender);

  const gridNumbers = [[4, 9, 2], [3, 5, 7], [8, 1, 6]];
  const gridCells = gridNumbers.map((row, r) => row.map((num, c) => {
    const count = n.loshuGrid?.[r]?.[c] ?? 0;
    const content = count > 0 ? String(num).repeat(count) : '·';
    return `<div class="cell ${count === 0 ? 'empty' : ''}">${content}</div>`;
  }).join('')).join('');

  const body = `
  <div class="section">
    <h2>Your Core Numbers</h2>
    <div class="snap">
      <div class="snapcard"><div class="lbl">Birth · ${esc(n.birthNumberPlanet)}</div><div class="val">${n.birthNumber}</div></div>
      <div class="snapcard"><div class="lbl">Destiny · ${esc(n.destinyNumberPlanet)}</div><div class="val">${n.destinyNumber}</div></div>
      <div class="snapcard"><div class="lbl">Kua</div><div class="val">${n.kuaNumber}</div></div>
    </div>
  </div>
  <div class="section">
    <h2>Birth Number ${n.birthNumber}</h2>
    <p>${esc(n.birthNumberMeaning)}</p>
    <p class="meta">${esc(n.birthNumberDetail)}</p>
  </div>
  <div class="section">
    <h2>Destiny Number ${n.destinyNumber}</h2>
    <p>${esc(n.destinyNumberMeaning)}</p>
    <p class="meta">${esc(n.destinyNumberDetail)}</p>
  </div>
  <div class="section">
    <h2>Kua Number ${n.kuaNumber}</h2>
    <p>${esc(n.kuaNumberMeaning)}</p>
  </div>
  <div class="section">
    <h2>Lo Shu Grid</h2>
    <div class="grid3">${gridCells}</div>
    <p class="meta">Repeated digits show emphasis; a dot marks a missing number (an area to consciously develop).</p>
  </div>
  <div class="section">
    <h2>Remedies</h2>
    ${list(n.remedies)}
  </div>`;
  return shell('Numerology Report', p, body);
}

// ----------------------------------------------------------------- Gemstone ---
export function buildGemstoneReportHtml(p: Profile): string {
  const g = recommendGemstones(chartInput(p));

  const gemCard = (r: (typeof g.recommendations)[number]) => `
    <div class="card">
      <div class="gemhead">
        <span class="gemstone">${esc(r.info.stone)} <span class="meta">(${esc(r.info.hindi)})</span></span>
        <span class="gemrole">${esc(r.role)}</span>
      </div>
      <div class="meta">${esc(r.basis)}</div>
      <p style="margin:8px 0 4px">${esc(r.info.note)}</p>
      <div class="meta">Finger: ${esc(r.info.finger)} · Metal: ${esc(r.info.metal)} · Day: ${esc(r.info.day)} · Mantra: ${esc(r.info.mantra)}</div>
    </div>`;

  const body = `
  <div class="section">
    <h2>How this is derived</h2>
    <p>Based on your ${g.lagnaBased ? 'Ascendant (Lagna)' : 'Moon sign'} — <strong>${esc(g.ascendantOrMoonSignName)}</strong>${g.lagnaBased ? '' : ' (no birth time provided, so the Moon sign is used)'}. Your life stone is ruled by the ${g.lagnaBased ? 'Lagna' : 'Moon-sign'} lord; the lucky and creative stones by the 9th and 5th house lords (the auspicious trine lords).</p>
  </div>
  <div class="section">
    <h2>Recommended Gemstones</h2>
    ${g.recommendations.map(gemCard).join('')}
  </div>
  <div class="section">
    <h2>How to Wear</h2>
    <ul>
      <li>Use a natural, untreated, good-quality stone of at least ~3–5 carats, set so it touches the skin.</li>
      <li>First wear on the stone's day (see above), in the morning after cleansing it in raw milk / Ganga water, reciting its mantra 108 times.</li>
      <li>Start on a trial basis and observe its effects over a few weeks.</li>
    </ul>
  </div>
  <div class="section">
    <div class="caution"><strong>Important:</strong> Gemstones are considered powerful in Jyotish and are not one-size-fits-all. Blue Sapphire (Neelam) in particular is very fast-acting and must be trialled carefully. Please consult a qualified astrologer with your full chart before wearing any gemstone.</div>
  </div>`;
  return shell('Gemstone Recommendation', p, body);
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
