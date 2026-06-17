# Astropanth — Play Console Submission Pack

Paste-ready answers for every Play Console section. Work top to bottom; most of it is fill-in-the-blank.

---

## 1. Store listing

| Field | Value |
|---|---|
| **App name** (30 char) | `Astropanth` |
| **Short description** (80 char) | `Personalised astrology & numerology, grounded in your birth chart.` |
| **App icon** (512×512) | `store-assets/play-icon-512.png` ✅ |
| **Feature graphic** (1024×500) | `store-assets/feature-graphic-1024x500.png` ✅ |
| **Phone screenshots** (2–8, min 320px) | TODO — capture Home, Astrology, Numerology, AskAstro |
| **App category** | Lifestyle |
| **Tags** | astrology, numerology, horoscope, zodiac |
| **Contact email** | support@astropanth.com |
| **Website** | https://www.astropanth.com |
| **Privacy policy** | https://www.astropanth.com/privacy |

**Full description** (paste as-is):

```
Astropanth turns your birth details into a personal map of the stars and numbers. Get a complete Vedic-informed astrology profile — Sun, Moon and Ascendant signs, planetary influences and houses — alongside your core numerology: Birth, Destiny and Kua numbers with a Lo Shu grid reading.

Every insight is grounded in your own chart and a curated knowledge base, not generic horoscopes. Highlights:

• Daily, weekly and personal horoscopes tuned to your signs
• Full numerology breakdown with practical meaning
• AskAstro — a chat guide that answers only astrology & numerology questions, using your chart
• Explore another chart — read a friend's or family member's details, then jump back to yours
• Clean, calm "Celestial Minimal" design

Browse astrology and numerology free as a guest; sign in to save your profile and unlock unlimited AskAstro. Astropanth is for reflection and entertainment and does not provide medical, financial, or legal advice.
```

---

## 2. App access (reviewer login)

Parts of the app (saving profile, unlimited AskAstro) need a login, so Google's reviewer needs a test account.

- Create one demo user in the app: e.g. `reviewer@astropanth.com` / a simple password, with a complete birth profile filled in.
- In **App content → App access**, choose **"All or some functionality is restricted"** and add:
  - Instructions: *"Astrology and Numerology tabs are open to all as a guest. To test saved profiles and unlimited AskAstro, sign in with the credentials below."*
  - Username: `reviewer@astropanth.com`
  - Password: (the one you set)
- Note: Google sign-in can't be tested by reviewers, so provide the email/password login above.

---

## 3. Content rating (IARC questionnaire)

- **Category:** Utility, Productivity, Communication, or Other (astrology/reference — not a game).
- Answer **No** to every content question: violence, sexual content, profanity, controlled substances, gambling/simulated gambling, user-to-user unmoderated communication, location sharing, etc.
- The chat (AskAstro) is AI-to-user only, not user-to-user, so "users can interact / share content" = **No**.
- Expected result: rated **Everyone / PEGI 3**.

---

## 4. Target audience & content

- **Target age group:** select **18 and over** (astrology/numerology guidance is aimed at adults; keeps you out of the "Designed for Families" program and its extra requirements).
- **Appeal to children:** No.
- **Store presence / ads:** No ads.

---

## 5. Data safety (most important — be accurate)

**Does your app collect or share required user data?** → **Yes.**
**Is all data encrypted in transit?** → **Yes.**
**Do you provide a way to request data deletion?** → **Yes** — users can delete their account in-app (Profile → Settings → Delete Account) and can email support@astropanth.com.

**Data types — declare these as Collected (NOT shared):**

| Data type | Collected | Purpose | Required? |
|---|---|---|---|
| Name | Yes | App functionality, Account management | Required (for account) |
| Email address | Yes | App functionality, Account management | Required (for account) |
| User IDs | Yes | Account management | Required (for account) |
| Other personal info (date of birth, place of birth, gender) | Yes | App functionality (personalised readings) | Required (for readings) |
| Other user-generated content (AskAstro questions) | Yes | App functionality | Optional |

**Key notes when filling the form:**
- For every type, choose **Collected → Not shared**. Sending AskAstro questions to an AI provider counts as a **service provider processing on your behalf**, which Google does **not** classify as "sharing."
- **Location:** answer **Not collected** — "place of birth" is typed text, not device GPS/location.
- **IP address:** used only for security/anti-abuse (the guest rate limit). If asked, this falls under security and is not collected for tracking/analytics — do not declare it as a tracked data type.
- No data is used for advertising or third-party marketing.

---

## 6. Other App content declarations

- **Ads:** No, the app does not contain ads.
- **News app:** No.
- **COVID-19 / contact tracing:** No.
- **Government app:** No.
- **Financial features:** No.
- **Health / medical:** No — it's entertainment/lifestyle; the description states it is not medical, financial, or legal advice.
- **Target countries:** select your markets (e.g., India + others, or all countries).

---

## 7. Release

1. Upload the **AAB** (from `eas build --platform android --profile production`).
2. Push to **Internal testing** first → add your own email as a tester → install from the opt-in link → verify the store build works end-to-end (including Google login after the SHA-1 step).
3. Promote to **Production** → submit for review. First review typically takes 1–7 days.

---

## Assets checklist
- [x] App icon 512×512 — `store-assets/play-icon-512.png`
- [x] Feature graphic 1024×500 — `store-assets/feature-graphic-1024x500.png`
- [x] Privacy policy — https://www.astropanth.com/privacy
- [x] Listing copy — above
- [ ] Phone screenshots (2–8) — capture from the app; send to me to frame
- [ ] Reviewer demo account — create in-app
- [ ] Production AAB — from EAS build
