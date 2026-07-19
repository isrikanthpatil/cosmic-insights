# Astropanth — "Apply for production access" answers

When your closed test has run **14 continuous days with 12+ opted-in, engaged testers**, go to Play Console → Dashboard → **Apply for production** and answer the three sections below. These are drafts — adjust the specifics (exact tester count, real feedback quotes) to match reality before submitting. Be honest and concrete; Google looks for genuine testing, not boilerplate.

---

## Part 1 — Tell us about your closed test

**How did you recruit your testers?**
> I recruited testers through my personal and professional network — friends, family and colleagues who use Android and are interested in astrology and numerology — and a few contacts from online astrology-interest communities. I shared the closed-test opt-in link directly and asked each person to install the app and use it over the two-week period. I aimed for a mix of ages and backgrounds so feedback reflected different types of users.

**How did your testers engage with your app, and over what period?**
> [N] testers opted in and remained opted in for the full 14+ day period. I asked them to open the app several times across the two weeks and to try the core journeys: entering their birth details, reading their astrology profile (Sun/Moon/Ascendant, strengths, remedies), viewing their numerology and Lo Shu grid, asking questions in the AskAstro chat, and trying Kundli (compatibility) matching. Several testers used it on multiple days and returned to check their daily and weekly horoscopes.

**What feedback did you gather, and what changes did you make in response?**
> Testers gave feedback by messaging me directly and via Play's testing-feedback channel. Key items and the changes I made:
> - The on-screen keyboard was covering the text being typed in the chat and profile screens → I reworked keyboard handling so the input stays visible.
> - Some birth places weren't recognised for the reading → I added state-level coordinate resolution so all Indian towns work.
> - Long text on the numerology number cards was being cut off → I made those cards tap-to-expand so the full meaning is visible.
> - Testers wanted a weekly outlook, not just daily → I added a weekly horoscope alongside the daily one.
> - Various wording, layout and consistency refinements based on tester comments.
> This feedback loop directly shaped the current build.

---

## Part 2 — Tell us about your app

**What is your app about / what does it do?**
> Astropanth is a personalised astrology and numerology app for an Indian audience. From a user's birth details it generates a Vedic-informed astrology profile (Sun, Moon and Ascendant signs, strengths, areas for growth and traditional remedies), a full numerology breakdown (Birth, Destiny and Kua numbers with a Lo Shu grid), daily and weekly horoscopes, and Kundli (Ashtakoota Guna Milan) compatibility matching. It also includes "AskAstro", a chat guide that answers only astrology and numerology questions, grounded in a curated knowledge base rather than generic content.

**Who is your target audience?**
> Adults (18+) interested in astrology and numerology, primarily in India, who want a clean, trustworthy, self-service reading experience.

**How does your app make money (if applicable)?**
> The core experience is free. A future optional premium tier ("Astropanth Plus") is planned for unlimited AskAstro and detailed reports; it is not yet active. There are no ads.

---

## Part 3 — Tell us about your production readiness

**Why do you believe your app is ready for production?**
> The app is feature-complete for a first release and stable. All core journeys work for both guest and signed-in users. Astrological and numerological calculations are deterministic and were validated (for example, the Kundli-matching Moon/nakshatra results were cross-checked against an established reference and matched). The app has been through functional, security and UI review passes, and the issues found in closed testing have been fixed.

**How did you test your app and ensure quality?**
> I used internal and closed testing tracks on Play Console, plus extensive pre-release checks: a full functional pass over every screen and control, a security review (including protection against prompt-injection in the AI chat and rate limits to prevent abuse), and a UI/consistency pass. Calculations were verified against known references. Feedback from closed-test users was addressed before applying.

**Are there any known issues or incomplete features?**
> The premium subscription and native "Sign in with Google" on Android are intentionally not enabled in this release (email sign-in and guest access work fully); they are planned for a later update. No known crashes or blocking issues remain.

---

### Tips before you submit
- Fill in the real tester count ([N]) and, if you can, one or two genuine feedback quotes.
- Keep answers specific and honest — vague/boilerplate answers are a common rejection reason.
- Make sure at submission time 12+ testers are still opted in and have been for 14+ continuous days.
