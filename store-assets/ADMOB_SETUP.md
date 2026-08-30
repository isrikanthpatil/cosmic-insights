# Astropanth — AdMob banner setup (one gentle banner per screen)

Decision: **only non-intrusive banner ads, one per screen. No interstitials, no
video** — we never push the user out of the flow. Free users see a small banner;
Astropanth Plus removes it.

This needs a bit of setup on your side (a Google AdMob account + IDs) before I wire
the code. Do the steps below, send me the four IDs, and I'll integrate
`react-native-google-mobile-ads` (the current, maintained library — the old
`expo-ads-admob` is deprecated). Until you have real IDs, I can scaffold with
Google's official **test** ad unit IDs so it builds and shows test banners.

## Part 1 — Create the AdMob account (~10 min)

1. Go to <https://admob.google.com> and sign in with the Google account you want
   tied to ad payments. AdMob is separate from your Play Console but uses the same
   Google login.
2. Complete the account setup (country = India, timezone, currency INR) and accept
   the AdMob terms.
3. Add your **payment profile** (bank/UPI details) — required to get paid, can be
   done now or later. Payments start once you cross the ₹ threshold (~$100 / ~₹8k).

## Part 2 — Register the app & create a banner ad unit

4. AdMob → **Apps → Add app → Android**. If Astropanth is already live on Play,
   search and link it; otherwise choose "No, it's not listed yet" and add manually.
   This gives you an **App ID** that looks like:
   `ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY`
5. In that app → **Ad units → Add ad unit → Banner**. Name it e.g. "Astropanth
   Banner". This gives an **Ad unit ID**:
   `ca-app-pub-XXXXXXXXXXXXXXXX/ZZZZZZZZZZ`
6. (Optional but recommended) Create a **second banner ad unit** so we can rotate /
   A-B later — not required for launch.

## Part 3 — Send me these four values

- Android **App ID** (`ca-app-pub-…~…`)
- Android **Banner ad unit ID** (`ca-app-pub-…/…`)
- (Later, when you build iOS) the iOS App ID + iOS Banner ad unit ID.

Keep these out of chat if you prefer — they're not secret (they ship in the app
anyway), but you can also just paste them; there's no security risk with AdMob IDs.

## Part 4 — What I do (client side)

Once I have the IDs:
- Install `react-native-google-mobile-ads` and add its Expo config plugin with your
  App ID in `app.json` (this is why it needs a fresh dev/preview build — it's a
  native module, not OTA).
- Add a single reusable `<AdBanner />` component (adaptive banner, anchored at the
  bottom, above the tab bar) that renders **only for non-premium users** and is
  hidden for Astropanth Plus subscribers.
- Place it on the main content screens (Home, Astrology, Numerology, AskAstro, and
  the feature screens) — one per screen, never overlapping content or the tab bar.
- Respect Play families/consent: add a simple consent check (Google User Messaging
  Platform) for personalised vs non-personalised ads, required for EU users and good
  practice generally.
- Test with Google's test IDs on a preview build first, then swap to your real IDs
  before the production build (AdMob bans clicking your own live ads).

## Realistic expectations

India banner eCPM is low (~$0.10–$0.50 for banners), so banners are a **floor**, not
a primary revenue engine — a handful of report/subscription sales will out-earn them.
That's fine: the point is gentle, non-annoying monetisation of free users while the
report + subscription revenue does the heavy lifting.
