# Astropanth — Data Safety Form (accurate re-declaration)

Purpose: fix the "Invalid Data safety form" rejection. Below is exactly what the app transmits off-device and how to fill each field in Play Console → **Policy → App content → Data safety → Manage → Start/Edit**. Transcribe it 1:1, save, then re-submit for review.

## Why it was rejected
Google's scanner saw data leaving the device that the form didn't declare. Two sources:
1. **Your backend (`api.astropanth.com`)** receives: email, name, date/time/place of birth, gender, and AskAstro questions (guests included).
2. **Firebase Cloud Messaging** — bundled by `expo-notifications` on Android. Even though you only use *local* reminders (no push token), the FCM SDK is present and collects a **device identifier**, which the SDK Index flags. This must be declared (or removed — see end).

There are **no** analytics/ads/crash SDKs. The unused `@supabase/supabase-js` dependency transmits nothing.

---

## Step 1 — Overview questions

- **Does your app collect or share any of the required user data types?** → **Yes**
- **Is all of the user data collected by your app encrypted in transit?** → **Yes** (all traffic is HTTPS/TLS to api.astropanth.com)
- **Do you provide a way for users to request that their data be deleted?** → **Yes**
  - In-app: Profile → Delete Account (permanently deletes the account)
  - Web: https://www.astropanth.com/delete-account
  - Email: support@astropanth.com

For every data type below: **Collected = Yes**, **Shared = No** (Groq and Brevo are service providers processing on your behalf, not third-party sharing), **Processed ephemerally = No** (stored in the account), unless noted.

---

## Step 2 — Data types to mark as COLLECTED

### Personal info → Name
- Collected: Yes · Shared: No · Ephemeral: No
- Required or optional: **Users can choose** (only collected if they create an account; guests skip it)
- Purposes: **App functionality**, **Account management**

### Personal info → Email address
- Collected: Yes · Shared: No · Ephemeral: No
- Required or optional: Users can choose (account only)
- Purposes: **App functionality**, **Account management** (also verification & password-reset emails via Brevo, a service provider)

### Personal info → User IDs
- Collected: Yes · Shared: No · Ephemeral: No
- Purposes: **App functionality**, **Account management**
- (The account record ID created for signed-in users.)

### Personal info → Other info
- Collected: Yes · Shared: No · Ephemeral: No
- Covers: **date of birth, time of birth, place of birth, gender** (used to compute the chart/numerology)
- Purposes: **App functionality**, **Personalization**
- Note: place of birth is a user-entered text, NOT device location — do **not** tick the Location category.

### Messages → Other in-app messages
- Collected: Yes · Shared: No · Ephemeral: No
- Covers: **AskAstro questions and chat history** the user types (sent to your server, then to Groq for the reply). Collected for guests too.
- Purposes: **App functionality**
- (If Play's UI nudges you elsewhere, "App activity → Other user-generated content" is an acceptable equivalent — but pick only one.)

### Device or other IDs → Device or other IDs
- Collected: Yes · Shared: No · Ephemeral: No
- Source: **Firebase Cloud Messaging** (bundled by expo-notifications). Even with local-only notifications, FCM registers a device/app-instance identifier.
- Purposes: **App functionality**
- Follow Firebase's data-safety guidance in the Google Play SDK Index if prompted for more detail.

---

## Step 3 — What NOT to declare
- **Location** — no. Place of birth is text, not device GPS/network location.
- **Financial info** — no (premium billing not live yet; add later when it is).
- **IP address / rate-limiting** — collected only server-side for abuse prevention, which falls under Google's security/anti-fraud exemption. Not required. (If Play specifically asks, you may omit it.)
- **Analytics / crash / ads** — none present.

---

## Step 4 — Save & resubmit
1. Save the Data safety form.
2. Go to **Publishing overview** and **send changes for review** (and/or re-submit the rejected production release).
3. Reviews for data-safety fixes are usually quick. You'll get an email confirmation.

---

## Optional cleanup (do later, not required to pass)
- If you don't want to declare the FCM device ID at all, you could drop the Firebase transport — but `expo-notifications` needs it on Android and you use the daily local reminder, so **keep it and declare it** (simpler and honest). Removing notifications entirely is the only way to remove FCM, which isn't worth it.
- Remove the unused `@supabase/supabase-js` dependency in a future cleanup (reduces bundle size; not a data-safety issue).
