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

## Part 4 — What I do next (client side)

Once Parts 1–3 are done and the auth-methods check shows Google:
- I implement the React Native OAuth2 **code flow** (`authWithOAuth2Code` + `expo-web-browser` + a deep-link return) and un-hide the "Continue with Google" button on Android.
- We build a **preview/internal** APK and test the round-trip: tap Google → Google consent → back into the app, signed in.
- The redirect handoff sometimes needs one tweak (deep link vs. PocketBase redirect); we finalise it on that test build **before** it ever reaches production.
- A Google sign-in creates a user with an email but no birth details, so after first sign-in the app will prompt them to add birth details (same as an incomplete profile) — that's expected.

Tell me when the auth-methods URL shows Google, and I'll wire up the client side.
