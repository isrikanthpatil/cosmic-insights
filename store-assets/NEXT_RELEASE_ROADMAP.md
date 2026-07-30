# Astropanth — Next Release Roadmap (categorised)

Status: v1.0.0 is LIVE on Google Play (versionCode 8, commit 07047b9). Production = current source. All items below are fresh changes that will ship in versionCode 9+.

This document has six categories (a–f). Sections **d** and **e** started from an independent code+content audit; the owner's inputs are merged in (marked ★).

## v9 progress log (committed locally, not pushed)
- **a** (security): API 36 + R8, dropped Supabase, secrets verified, PB fallback fixed — DONE
- **f** (bugs): reinstall privacy (allowBackup off), reset-password inline banner, daily values already deterministic — DONE
- **e-M2** Kua formula (owner's method, keep literal 5) — DONE
- **d** (UI): off-brand gold, 404 re-skin, tab labels, contrast, page titles, AskAstro greeting/speed, 44pt send button, error-toast type, insets bottom-padding, modal keyboard, premium softened, accessibility labels — DONE. **Remaining: density/de-box (d-O1/O2) — pending on-device review.**
- **e-H1/H2/H3** main reading now pure sidereal (Sun/Moon from ephemeris, real Ascendant only with birth time, invented location insights removed); AskAstro grounds on sidereal — DONE + verified
- **e-M1** pure-Vedic knowledge (classical rulerships, Vedic rashi lore ×12, nine-graha Rahu/Ketu) — DONE
- **e-H4** rich planet-mapped per-number numerology (summary + expandable detail) — DONE
- **e-H5** clarified Destiny = Bhagyank (correct for Indian numerology); Namank = future — DONE
- **Remaining in e:** e-O1 (longer daily/weekly), e-O2 (daily variation via Moon nakshatra), e-M3 (weekly variation), e-M4 (27-nakshatra KB), e-M5/M6/M7 (remedy specificity, gemstone caution, disclaimers), e-H6 (dedupe AskAstro offline dataset).

## Decisions locked
- **Pure Vedic.** Remove the Western/tropical and "blended" content entirely — no modern co-rulers (Pluto/Uranus/Neptune), no Greek mythology, no tropical sun signs. The app presents sidereal (Lahiri) Jyotish. (Chinese Feng Shui numerology — Kua/Lo Shu — stays, clearly framed as its own tradition.)
- **Monetisation later.** Defer category **c** until the authenticity + UI + content enhancements ship.

Effort key: **S** = small (config/text), **M** = medium (feature work + test), **L** = large (new subsystem).

---

## a. Security / Google Play requirements

| # | Item | Why | Effort |
|---|------|-----|--------|
| a1 | **Target API 36 (Android 16)** via `expo-build-properties` | Hard requirement — from Aug 31, 2026 you can't publish updates otherwise | S |
| a2 | **Data safety form** — keep the `Device or other IDs` (FCM) declaration accurate; re-check after any SDK change | Already fixed the rejection; must stay accurate | S |
| a3 | **Keep secrets server-side only** (Groq, Brevo, GNews keys live in PocketBase hooks, never in the client bundle) | Ongoing discipline; verify before each build | S |
| a4 | **R8 / ProGuard minification** (see d — also a Play "technical quality" flag) | Smaller, faster app; Play recommendation | S+test |
| a5 | Remove unused `@supabase/supabase-js` dependency | Reduces bundle + attack surface; avoids future data-safety confusion | S |

---

## b. Feature additions

| # | Item | Notes | Effort |
|---|------|-------|--------|
| b1 | **Full Vedic Kundli (birth chart)** | Extend the *real* ephemeris engine to D1 chart + houses + planetary placements. Currently "Soon" in More tab | L |
| b2 | **Nakshatra profile** | Engine already computes Janma Nakshatra + pada (used in matching) but never shown — surface it with interpretation (see e) | M |
| b3 | **Native "Sign in with Google"** | Deferred (PocketBase realtime/EventSource issue in RN). The native flow is coded but hidden. Revisit with a deep-link OAuth2 code flow | M |
| b4 | **Hindi localization** | Broadens the India audience significantly; i18n layer + translate UI + interpretation templates | L |
| b5 | **Tarot** | Backlog; "Soon" in More tab | M |
| b6 | **iOS build** | EAS `--platform ios` + Apple Developer account + App Store review | M |
| b7 | **First-run onboarding** | 2–3 slide intro explaining tabs, guest mode, AskAstro free limit, value of birth time (see d M8) | M |

---

## c. Payments & integrations (premium)

| # | Item | Notes | Effort |
|---|------|-------|--------|
| c1 | **Google Play Billing via RevenueCat** (in-app) | Mandatory rail for in-app digital subscriptions; swap into existing `PremiumContext` | L |
| c2 | **Razorpay on web** (astropanth.com) | UPI AutoPay for recurring; cheaper, keeps more revenue; unlock same entitlement. Don't link to it from inside the Android app (Play anti-steering) | M |
| c3 | **Finish/repair the premium screen** | Today it shows placeholder prices + permanently-disabled Subscribe + a dead "Go Plus" entry from the AskAstro banner. Until billing is live, gate entry points behind a flag OR convert CTA to a real "Join waitlist / Notify me" (see d H5) | M |
| c4 | **Per-country pricing** | You launched in ~16 countries; set clean local prices once billing is live (₹ auto-converts otherwise) | S |
| c5 | Decide the Plus feature set + real pricing | `constants/plans.ts` currently has placeholder ₹199/mo, ₹1,499/yr | S |

---

## d. UI enhancements (from independent UI audit — add your inputs)

### High
- **d-H1. Adopt the design tokens.** `constants/theme.ts` defines colors/spacing/radii/typography but only one component uses it; every screen hardcodes hex + font strings. This is the root cause of most inconsistencies. Refactor screens to consume tokens — anchor task for the UI work. **(M)**
- **d-H2. Kill off-brand gold.** Old bright `#FFD700` still ships in `ToastHost.tsx` (success border) and Home `COLOR_MAP` (lucky-colour swatch). Replace with champagne `#E8C87E`. **(S)**
- **d-H3. Re-skin `+not-found.tsx`.** It uses a totally different gradient/theme — a bad route drops users onto an off-brand screen. Wrap in `ScreenBackground` + tokens. **(S)**
- **d-H4. Accessibility pass.** No `accessibilityRole`/labels on interactive controls; several touch targets < 44pt (AskAstro send 32×32, Home segment, astrology sub-tabs). Add labels/roles + bump sizes/hitSlop. **(M)**
- **d-H5. Premium screen rough edge** — see c3 (shared item). **(M)**

### Medium
- **d-M1. One loading language.** Mix of "giant Sparkles + Loading…", skeletons, and bare ActivityIndicator; Home has none. Standardise on skeletons. **(M)**
- **d-M2. Unify feedback.** Success/info use toasts; all errors use blocking native `Alert`. Add an error/warning toast type (and wire the unused `warning()` haptic); reserve Alert for destructive confirms. **(M)**
- **d-M3. Shared screen header + gutter token.** Gutters vary (16/20/24) and each tab re-implements a near-identical title header. Extract a `ScreenHeader` + single gutter. **(M)**
- **d-M4. Fix page-title scale.** Match/Premium/Auth diverge from `typography.pageTitle` (24). **(S)**
- **d-M5. Contrast.** `#56536A` faint text on dark navy (inactive sub-tabs, empty Lo-Shu cells) fails WCAG; raise to `muted` and verify AA. **(S)**
- **d-M6. Bottom padding vs tab bar.** Hardcoded, inconsistent (88/100), ignores `insets.bottom` — last card can hide under the bar on tall-inset phones. Compute from tab-bar height + insets. **(S)**
- **d-M9. Android keyboard in birth-details modal.** `GuestEntryPrompt`/`ExploreBar` sheets have no Android keyboard avoidance — the place field + autocomplete get covered. This is the main guest-conversion flow. **(M)**
- **d-M10. AskAstro greeting/typewriter.** Opening message is a wall of text; typewriter (35ms/word, no skip) feels slow. Shorten greeting; add tap-to-complete. **(S)**

### Low
- d-L1. Six 10px auto-shrinking tab labels feel cramped on small phones — consider consolidating.
- d-L2. Horizontal sub-tabs have no edge/fade hint; re-tapping active tab doesn't scroll to top.
- d-L3. Polish: LayoutAnimation on numerology expand; shimmer skeleton; daily "refresh" doesn't change state.
- d-L4. Standardise radii/letterSpacing via tokens.
- d-L5. Color-only signalling in Lo-Shu/dosha — add icon/pattern for color-blind users.
- d-L6. Gender is hardcoded male/female binary (used by Kua/Ashtakoota) — product decision.
- d-L7. Minor: no offline indicator in AskAstro; ExploreBar only on overview sub-tab; "coming soon" cards give no tap feedback.

**Owner UI inputs (★):**
- **d-O1. Denser, more readable typography.** Refine font sizes/line-height so content is still readable but MORE fits per screen with LESS scrolling. (Ties to d-H1 token work + type scale.) **(M)**
- **d-O2. Less "boxy" layout.** Reduce heavy card/box framing around text; represent content more elegantly (e.g. lighter dividers, open sections, subtle backgrounds) instead of everything in bordered boxes. **(M)**
- **d-O3. "Numerology" label/name renders smaller than others.** The auto-shrink on the 6th tab makes it look inconsistent. Fix label sizing (ties to d-L1 — possibly shorten label or consolidate tabs). **(S)**
- **d-O4. Add profile picture — DEFERRED to category b (later release).** Needs an `avatar` file field on the PocketBase `users` collection. Not in this release per decision.
- **Decision: density/de-box/tokens = CONSERVATIVE pass** — tighten spacing/line-height, lighten heavy boxes, standardise sizes on main screens; token migration done incrementally (not a full rewrite).

---

## e. Content quality (from independent content audit — add your inputs)

> **Headline finding:** the app has TWO astrology engines. A **genuine sidereal (Lahiri) engine** (`utils/jyotish/ephemeris.ts` + `ashtakoota.ts`) — high quality, validated — but it's used **only** by the Kundli-matching screen. The **flagship reading, Home, daily/weekly horoscope, and AskAstro** all run on a legacy `utils/astrology.ts` that uses **Western tropical sun signs and fabricated moon/ascendant formulas.** Fixing this is the biggest authenticity win and directly serves the "genuine, not filler" principle.

### High
- **e-H1. Route the main reading through the real sidereal engine.** `calculateSunSign` uses tropical Western date ranges (off by ~1 sign for Vedic); `computeEphemeris` already gives correct sidereal Moon rashi + nakshatra but is unused outside matching. Wire it in. **(M)**
- **e-H2. Replace fabricated Moon sign & Ascendant.** `calculateMoonSign` = `(dayOfYear + long/15) % 12`, `calculateAscendant` = `(hour*12/24) % 12` — astronomically meaningless. Use the ephemeris outputs (real lagna needs sidereal time + latitude, already implemented). **(M)**
- **e-H3. Remove invented "location insights."** `getLocationBasedInsights` asserts pseudo-astrology ("Northern Hemisphere → leadership", "Eastern coordinates → quick manifestation") that is **identical for every Indian user** and is fed into AskAstro. Delete or replace with real chart-derived content. **(S)**
- **e-H4. Deepen numerology meanings.** `numberMeanings` are 3-word stubs ("Leadership, independence, pioneering spirit"); the "tap for more" reveals the same 3 words. Build a curated per-number knowledge object (1–9, keep 11/22/33) mirroring the depth of the zodiac data: nature, strengths, challenges, career, relationships, ruling planet, remedy. **(M)**
- **e-H5. Fix the "Destiny Number" misnomer.** `calculateDestinyNumber` takes the name but ignores it — it sums only the DOB (that's Life Path/Bhagyank). True name numerology (Chaldean) is central to Indian numerology and is entirely missing. Implement name-number analysis and relabel, or relabel the current one "Life Path" honestly. **(M)**
- **e-H6. Clean up AskAstro grounding.** Good idea (curated knowledge string) but it grounds on the fake moon/asc (H2) and there's a **duplicate hand-copied zodiac dataset** inside `AstrologyAI.tsx` that will drift from `utils/`. Ground on real placements; delete the duplicate and import the shared data; add nakshatra once H1 lands. **(M)**

### Medium
- **e-M1. ★ Remove Western mixing — go pure Vedic (DECIDED).** `ZODIAC_KNOWLEDGE` lists modern co-rulers (Mars/Pluto, Saturn/Uranus, Jupiter/Neptune) and Greek mythology. Strip modern co-rulers → classical rulerships only (Mars, Saturn, Jupiter); remove Greek `mythology` fields (replace with Vedic rashi lore or drop); remove Uranus/Neptune/Pluto from planetary content. **(M)**
- **e-M2. ★ Kua formula — DONE (v9).** Implemented the owner's final method in `utils/numerology.ts`:
  1. Sum **all** digits of the birth year, reduce to a single digit. (1978 → 1+9+7+8=25 → 2+5 = **7**)
  2. **Male:** **11 − digit**, reduced. (11−7 = **4**)
  3. **Female:** **digit + 4**, reduced. (7+4=11 → **2**)
  Kua **5 is kept as-is** — no substitution. Old last-two-digit method, the 5→2/8 conversion, the `originalKuaNumber` field, all "Kua 5 doesn't exist / converted" UI notes, and the debug logs were removed. Verified: 1978 M4/F2, 1990 M1/F5, 2004 M5/F1, 2000 M9/F6.
- **e-M3. Weekly horoscope is static beyond the overview.** Highlights/focus/lucky-days always return the same first items; lucky days are a hardcoded list identical for all signs. Seed-rotate weekly; derive lucky days from the rashi lord. **(M)**
- **e-M4. Add 27-nakshatra knowledge base.** Nakshatra is computed and used in matching but has no descriptive content (deity, symbol, gana, qualities, remedy). The most distinctively Vedic layer is invisible to users. Pairs with b2. **(M)**
- **e-M5. Level up generic remedies.** `MISSING_NUMBER_REMEDIES` is excellent (specific, planet-mapped); the general `remedies` array is vague filler. Raise to the same specificity. **(S)**
- **e-M6. Gemstone caution everywhere.** Blue/yellow sapphire recommended unconditionally; classically neelam is high-risk. Numerology screen has a caution note; Astrology remedies and AskAstro don't. Add it consistently; separate "safe practices" from "gemstones (consult first)." **(S)**
- **e-M7. Disclaimer coverage.** Profile/Match/Numerology have good disclaimers; the main Astrology reading and AskAstro — the strongest personal claims — have none. Add a short consistent disclaimer. **(S)**

### Low
- e-L1. Explain which tradition each section draws from (Vedic / Chinese Feng Shui / Western) — strengthens credibility.
- e-L2. Combined-trait indexing can read repetitively when fake moon/asc equal the sun sign (resolves after H1/H2).
- e-L3. Daily horoscope is stable template recombination of static sign attributes (no Moon/transit) — acceptable v1; seed on Moon nakshatra/tithi after H1 for real variation.
- e-L4. Strip emoji `console.log` debug statements from the numerology path.

### What's already good (keep)
- The sidereal ephemeris + Ashtakoota engines (classical tables, documented conventions, honest `lowConfidence`).
- `MISSING_NUMBER_REMEDIES`; the 8-item per-sign strengths/challenges/career/health arrays; the AskAstro architecture (grounding + offline fallback + guest limits).

**Owner content inputs (★):**
- **e-O1. Longer daily & weekly horoscopes.** Roughly **2× current length** as a starting point — more substance per reading. (Do alongside e-H1 so the extra length is real content, not filler.) **(M)**
- **e-O2. Daily horoscope must actually vary day-to-day.** Users report it feels the same/similar each day. After e-H1 lands, seed the daily on the sidereal **Moon nakshatra / tithi (Panchang)** so it genuinely changes daily, not just per-date template recombination. **(M)**
- **e-O3. AskAstro replies a bit more detailed.** Increase response length/depth moderately (not verbose) — a little more explanation per answer. **(S)**
- **e-O4. AskAstro should ask clarifying follow-ups.** When a question lacks enough info to answer well, the assistant should ask a follow-up question rather than guessing. Add to the system prompt + conversation handling. **(M)**

---

## f. Bug fixes / correctness (★ owner-reported)

| # | Item | Diagnosis / approach | Effort |
|---|------|---------------------|--------|
| f1 | **Reinstall still shows profile details without signing in** | Android **Auto Backup for Apps** restores AsyncStorage (guest profile + auth token) after reinstall, so old details reappear. Fix: set `android:allowBackup=false` (or a backup-rules exclusion for the auth/guest store), and/or clear local guest data on first launch after (re)install. Privacy-relevant — prioritise. | S |
| f2 | **"Reset password" gives no confirmation** | The handler calls `requestPasswordReset` but shows no feedback ("just blinks"). Add a success toast/message: "If an account exists for this email, a reset link has been sent." (Keep wording neutral to avoid account enumeration.) Also handle error + loading state. | S |
| f3 | **Daily numbers & colours change on every login/refresh** | Lucky numbers/colour (and any "of the day" values) must be **deterministic per day** — seed on `userId + date` so they're stable across logins/refreshes for the whole day, everywhere they appear (Home, Astrology). | S |

---

## Suggested sequencing (monetisation deferred per decision)
1. **Quick compliance + quick wins (v9):** a1 (API 36) + a4 (R8) + a5 (drop supabase) + d-H2/d-H3 (gold + not-found) + f1/f2/f3 (reinstall privacy, reset-password message, stable daily values). Small, low-risk; clears the Aug 31 deadline, Play flags, and the user-reported bugs.
2. **Authenticity release (the core):** go **pure Vedic** — e-H1→H3 (retire the fake engine, wire in the sidereal ephemeris, remove invented location insights), e-M1 (strip Western co-rulers/Greek myth), e-H4/H5 + e-M2 (real numerology depth, name numerology, owner's Kua formula), e-O1/e-O2 (longer + genuinely-varying daily/weekly). Highest-value work; what the brand rests on.
3. **AskAstro upgrade:** e-H6 (ground on real placements, de-dupe data) + e-O3/e-O4 (more detail, clarifying follow-ups).
4. **UI systemic pass:** d-H1 (tokens) + d-O1/d-O2 (density, de-box) + d-M1/M2/M3 + d-H4 (a11y) + d-O3 (numerology label) + d-O4 (profile picture).
5. **Content coverage:** e-M4 (27 nakshatras) + b2 (surface nakshatra) + e-M3/M5/M6/M7 (weekly variation, remedies, gemstone caution, disclaimers).
6. **New features:** b7 (onboarding), b1 (full Kundli), then b3/b4/b5/b6 over time.
7. **Later:** monetisation (c1–c5).
