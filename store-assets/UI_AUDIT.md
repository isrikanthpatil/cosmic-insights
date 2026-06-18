# Astropanth — UI Consistency & Spacing Audit

Read-only review of all screens + shared components against the "Celestial Minimal" design system (dark navy gradient, champagne gold `#E8C87E`, PlayfairDisplay-Bold headings, Inter body; tokens in `constants/theme.ts`). Grouped by priority. Nothing here is implemented yet.

## Tier 1 — Brand colour (highest visual impact)

1. **Primary buttons are off-brand coral `#FF6B6B`.** Every main CTA — Save, Create Profile, Sign In/Up, "Get my reading", active gender, ExploreBar banner, AskAstro limit banner — fills with Bolt-era coral. Coral isn't a primary-button colour in the palette (it's defined as "missing/secondary"). Recommend champagne gold `#E8C87E` with dark text `#0B0B1A` — exactly how the AskAstro send button already looks.
   - Files: AuthScreen, BirthDetailsForm, profile, GuestEntryPrompt, LoginNudge, ExploreBar, AstrologyAI.
2. **Toast success colour is legacy bright yellow `#FFD700`** (`components/ToastHost.tsx`) — the exact colour the theme comment says was replaced. → `#E8C87E`.
3. **"Rising/Ascendant" icon is coral** on Home + Astrology while Sun is gold and Moon is silver — coral reads like an error next to them. → gold or purple `#B49BE6`.
4. **Numerology "Birth" icon is coral**, Destiny gold, Kua purple — coral is arbitrary here. → align to a consistent accent.

## Tier 2 — Off-token accent colours

- Orange `#FF9800` (Growth section icon, balance card, Kua-conversion notes) — no orange in the palette. Pick one role colour (gold or a new amber token).
- Magenta `#E91E63` (Remedies "Heart" icon) — no theme role. → gold or purple.
- Wrong purple `#9C27B0` (Gem icon) while its own card uses the theme purple `#B49BE6`. → `#B49BE6`.
- Stray greys `#B8B8B8 / #E0E0E0 / #FFFFFF` and surface `#1A152E` in dead number-card styles + ToastHost.

## Tier 3 — Structural consistency

- **Section headers:** Astrology now all use the shared `SectionHeader` (gold uppercase eyebrow). Numerology still has two inline 20px Playfair titles ("Detailed Analysis", "Remedies & Suggestions") — convert to `SectionHeader` so the app is uniform.
- **Card radius:** mix of 12 / 14 / 16. Standardize full cards on `radii.lg (16)`, small chips/inputs on `radii.md (12)`. (Home chart/number cards at 14 are the main outliers.)
- **Card border:** gold hairline mostly `.25` but Home chart cards use `.20`. Unify on `colors.goldHairline (.25)`.
- **Card padding:** ad-hoc spread of 8/10/12/14/16 for equivalent cards. Use 16 for full cards, 12 for compact.
- **Button shape:** two shapes coexist on the same screen — pill `radius 25` (guest/create) vs rounded `radius 12` (save/cancel). Pick one (suggest 12 for full-width form buttons).
- **letterSpacing:** the same gold uppercase label uses `1` in some places, `2` in others. Pick one.
- **Body text sizes drift:** card descriptions appear at 12 / 13 / 14 for the same role; captions at 9 / 10 / 11. Settle on 14 body, 12 secondary, 10 caption.
- **Icon sizes for equivalent "stat cards":** Home 20 vs Numerology 16. Unify.

## Tier 4 — Spacing reduction (recover vertical space, no aesthetic loss)

Per-screen trims:

- **Home:** content `paddingTop 48 → 32`, `padding 20 → 16`, card `marginBottom 16 → 12` (chart/numbers/horoscope), `paddingBottom 100 → 88`.
- **Astrology:** header `paddingTop 50 → 40`, `tabContent gap 18 → 12`, `section marginBottom 16 → 12`, inner card `marginTop 14 → 12`.
- **Numerology:** header `paddingTop 50 → 40`, `section marginBottom 16 → 12`, content padding 12 → 16 (to match other tabs).
- **AskAstro:** container `margin 20 → 16`, message `marginBottom 14 → 12`.
- **Profile:** header `paddingTop 50 → 40`, `noProfileContainer paddingVertical 60 → 40`, `editContainer gap 20 → 16`, `paddingBottom 100 → 88`.
- **Login/Auth:** content `paddingTop 80 → 56`, brand icon `80 → 64`.

## Tier 5 — Cleanup (no visual change)

- Delete ~18 dead styles left from the chip refactor: in `astrology.tsx` (sectionTitle, traitsList/traitItem/traitText, insightsList/insightItem/insightText, pointCard/pointText, remedyCard/remedyText) and `numerology.tsx` (numberCard/numberCardGradient/numberLabel/numberValue/kuaNumberContainer/originalKuaText/numberMeaning).
- Larger refactor: route hardcoded hex, spacing literals, and radii through the existing `colors` / `spacing` / `radii` tokens (currently only `SectionHeader` imports them).

## Suggested order
Tier 4 (spacing) + Tier 3 section-headers + Tier 2 stray colours + Tier 1 ToastHost are all low-risk and can ship together. The **coral → gold primary-button** change (Tier 1.1) is the one real aesthetic decision — it changes the most visible accent in the app — so it's worth a deliberate yes/no before implementing.
