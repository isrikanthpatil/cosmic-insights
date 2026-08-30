# Astropanth — Google Sign-In setup (prerequisite config)

Native Google sign-in needs two things configured before the app code can use it:
a **Google OAuth client** and the **Google provider enabled in PocketBase**. Do
these first; then I'll implement the client-side flow and we'll test it on a
build (the redirect usually needs one iteration to confirm).

Do NOT paste any client secret into chat — keep it on the server only.

---

## Part 1 — Google Cloud: create an OAuth client

1. Go to <https://console.cloud.google.com> → create or select a project (e.g. "Astropanth").
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → Create.
   - App name: **Astropanth**; user support email: your email; developer contact: your email.
   - Scopes: add **`.../auth/userinfo.email`**, **`.../auth/userinfo.profile`**, **`openid`**.
   - While in "Testing", add your own Google account under **Test users** (so you can sign in before the app is verified). Publish later for all users.
3. **APIs & Services → Credentials → Create credentials → OAuth client ID**:
   - Application type: **Web application** (PocketBase uses a client secret, so this is the right type).
   - Name: "Astropanth PocketBase".
   - **Authorized redirect URIs** → add exactly:
     ```
     https://api.astropanth.com/api/oauth2-redirect
     ```
     (This is PocketBase's standard OAuth2 redirect endpoint.)
   - Create → copy the **Client ID** and **Client Secret**.

---

## Part 2 — PocketBase: enable the Google provider

1. Open the PocketBase admin: <https://api.astropanth.com/_/>.
2. Go to your **users** collection → **Options** (or **Settings → Auth providers**, depending on your PB version) → find **OAuth2 → Google**.
3. **Enable** Google and paste the **Client ID** and **Client Secret** from Part 1. Save.
4. (Leave the redirect URL as PocketBase's default — it matches what you registered in Google.)

---

## Part 3 — Verify the provider is live (quick check)

In a browser, open:
```
https://api.astropanth.com/api/collections/users/auth-methods
```
You should see JSON that includes an `oauth2` section listing **google** as a provider (with an `authURL`). If Google appears there, the server side is ready.

---

## Part 4b — Deep-link flow (REVISED after on-device testing)

The first client implementation used PocketBase's realtime OAuth flow. On Android
that proved unreliable — the in-app browser never returned to the app on its own
and the SSE handshake raced on first use ("Auth failed"), plus the dismiss call
crashed (those APIs are iOS-only). Replaced with a deterministic **deep-link**
flow. Two one-time prerequisites are needed:

**1) Deploy the redirect hook to PocketBase.**
Copy `pocketbase/pb_hooks/oauth_redirect.pb.js` (in this repo) to the server:
```
scp pocketbase/pb_hooks/oauth_redirect.pb.js root@<server>:/root/pocketbase/pb_hooks/
ssh root@<server> 'systemctl restart pocketbase'
```
Quick check — this should return an HTML "Signing you in…" page (not 404):
```
https://api.astropanth.com/oauth-redirect
```

**2) Add the redirect URI in Google Cloud.**
Google Cloud → Credentials → your Web OAuth client → Authorized redirect URIs →
add (in addition to the existing one):
```
https://api.astropanth.com/oauth-redirect
```

How it works: the app sends Google to `…/oauth-redirect`; that page bounces the
browser to `cosmic-insights://oauth?code=…`, which closes the in-app browser and
returns the code to the app for the PKCE exchange (`authWithOAuth2Code`). No
realtime, no lingering browser, no dismiss hack.

---

## Part 4 — Client side (initial realtime version, superseded by 4b)

Parts 1–3 are confirmed live: the auth-methods URL lists **google** with a valid
authURL and our client ID. The client flow is now built:

- **"Continue with Google" is un-gated on Android** (it was web-only before).
- The app uses PocketBase's all-in-one `authWithOAuth2`, which receives the code
  back over a **realtime (SSE)** connection. React Native has no built-in
  `EventSource`, so we polyfill it with the pure-JS `react-native-sse` (no native
  module — builds fine on EAS). After the handshake completes, the app dismisses
  the leftover auth browser tab automatically.
- **Incomplete-profile handling:** a Google account has an email but no birth
  details, so the reading screens now detect that and show **"Complete your birth
  details"** instead of a fabricated chart. Saving there writes to the account.

### How to test (on the internal/preview build)
1. Make sure your Google account is under **Audience → Test users** in Google Cloud
   (the app is in "Testing", so only listed testers can sign in).
2. Open the app → Sign in → **Continue with Google** → pick your account → consent.
3. You should land back in the app, signed in. Then a reading screen prompts you to
   **complete birth details** — add them once and readings populate.

### If it doesn't come back cleanly
The realtime handshake is the one part that occasionally needs a tweak on device.
If the browser hangs on PocketBase's redirect page instead of returning:
- First retry (sometimes the SSE connection just needs a moment).
- If it's consistent, tell me what you see and I'll switch to the fallback
  approach (a custom `oauth-mobile` redirect page on PocketBase that deep-links
  the code straight back to the app — no realtime). That needs one extra Google
  redirect URI + a small server hook, so we only do it if the SSE path misbehaves.

This is client-side only — no new build config, no server change beyond Parts 1–3.
