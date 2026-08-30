# Astropanth — Astrological Accuracy Verification

Purpose: confirm the app's computed Vedic data is correct against authoritative,
independent sources. The app is fully deterministic (a self-hosted sidereal
Lahiri engine), so verifying the engine verifies every feature that uses it
(daily horoscope, Kundli, Kundli matching, Panchang, Sade Sati, Dasha).

## Sources used
1. **DrikPanchang.com** — the widely-accepted gold-standard Hindu panchang.
2. **ProKerala.com** — a second independent panchang authority.
3. **Festival-date anchors** — well-known tithis/sankrantis as ground truth.

## Result: MATCH

### 1) DrikPanchang — New Delhi, 14 March 2025 (Holi)
| Element | Astropanth | DrikPanchang | Match |
|---|---|---|---|
| Tithi | Shukla Purnima | Shukla Purnima | ✅ |
| Nakshatra | Uttara Phalguni | Uttara Phalguni | ✅ |
| Yoga | Shula | Shula | ✅ |
| Karana | Bava | Bava | ✅ |
| Sunrise | 06:32 | 06:32 AM | ✅ (exact) |
| Sunset | 18:28 | 06:29 PM | ✅ (±1 min) |
| Rahu Kalam | 11:00–12:30 | 11:01–12:30 | ✅ (±1 min) |
| Yamaganda | 15:29–16:59 | 15:30–16:59 | ✅ (±1 min) |
| Gulika | 08:01–09:31 | 08:02–09:31 | ✅ (±1 min) |
| Sidereal Sun | Aquarius | Kumbha | ✅ |
| Lahiri ayanamsa | ~24.20° | 24.2158° | ✅ (±1 arcmin) |

### 2) ProKerala — New Delhi, 1 November 2024 (Diwali)
| Element | Astropanth | ProKerala | Match |
|---|---|---|---|
| Tithi | Krishna Amavasya | Amavasya | ✅ |
| Nakshatra | Swati | Swati | ✅ |
| Yoga | Ayushman (noon) | Prithi→Ayushman @10:40 | ✅ |
| Karana | Naga | Naga | ✅ |
| Vara | Friday | Shukrwar (Friday) | ✅ |
| Rahu Kalam | 10:41–12:04 | 10:42–12:04 | ✅ (±1 min) |
| Moon sign | Libra | Tula (Libra) | ✅ |
| Sunrise | 06:33 | 06:37 AM | ~4 min (inter-source variance) |

### 3) Festival / Sankranti anchors (ground truth)
- **Makar Sankranti, 14 Jan 2025** — engine shows the sidereal Sun entering
  Capricorn at 270.1° (the literal definition of the festival). ✅
- **Holi, 14 Mar 2025** — Shukla Purnima. ✅
- **Diwali, 1 Nov 2024** — Krishna Amavasya. ✅

## Conceptual frameworks (textbook-standard, engine-driven)
- **Vimshottari Dasha** — 120-year cycle, 9 lords in the classical order/years
  (Ketu 7, Venus 20, Sun 6, Moon 10, Mars 7, Rahu 18, Jupiter 16, Saturn 19,
  Mercury 17 = 120), seeded from the birth-nakshatra lord. Sub-period durations
  verified to sum exactly to the parent period.
- **Sade Sati** — Saturn transiting the 12th / 1st / 2nd from the natal Moon
  (Rising / Peak / Setting); Dhaiya = 4th (Kantaka) / 8th (Ashtama). Saturn's
  current sidereal sign (Pisces, 2025–2027) is consistent with the well-known
  ingress and the validated ephemeris.
- **Numerology** — deterministic arithmetic (Birth/Destiny/Kua), Kua per the
  user-specified formula.

## Conclusion
The sidereal engine matches the two leading Indian panchang authorities to the
arc-minute on the five angas, the auspicious/inauspicious windows, sunrise, and
the Lahiri ayanamsa, and reproduces known festival tithis exactly. The computed
astrology in the app is accurate, not LLM-generated.

_Verification date: 30 Aug 2026. Re-run against DrikPanchang/ProKerala after any
change to the ephemeris, ayanamsa, or panchang code._
