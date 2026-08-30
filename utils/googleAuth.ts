import { pb } from '@/utils/pocketbase';

// Shared state for the native Google OAuth code flow.
//
// The Google redirect comes back into the app as a deep link
// (cosmic-insights://oauth?code=...). On Android that link can be delivered to
// BOTH expo-web-browser's auth session AND the Expo Router deep-link handler, so
// the code exchange might be triggered from either place. A Google auth code can
// only be redeemed once, so we guard the exchange to run exactly once per attempt
// and stash the PKCE code verifier here (it's created when we open the browser
// and needed again to redeem the code).

const PB_URL = process.env.EXPO_PUBLIC_PB_URL ?? 'https://api.astropanth.com';
export const GOOGLE_SERVER_REDIRECT = `${PB_URL}/oauth-redirect`;

let pendingVerifier: string | null = null;
let inFlight: Promise<boolean> | null = null;
let done = false;

/** Called just before opening the browser, with the provider's codeVerifier. */
export function beginGoogleAuth(codeVerifier: string): void {
  pendingVerifier = codeVerifier;
  inFlight = null;
  done = false;
}

/**
 * Redeem the authorization code for a PocketBase session. Idempotent: repeated
 * calls (e.g. one from the auth-session result and one from the /oauth route)
 * resolve to the same single exchange. Returns true on success.
 */
export function completeGoogleAuth(code: string): Promise<boolean> {
  if (done) return Promise.resolve(true);
  if (inFlight) return inFlight;
  if (!pendingVerifier) return Promise.resolve(false);
  const verifier = pendingVerifier;
  inFlight = pb
    .collection('users')
    .authWithOAuth2Code('google', code, verifier, GOOGLE_SERVER_REDIRECT)
    .then(() => {
      done = true;
      pendingVerifier = null;
      return true;
    })
    .catch((e) => {
      // Reset so a genuine retry can happen; rethrow for the caller to surface.
      inFlight = null;
      throw e;
    });
  return inFlight;
}

/** True once a Google sign-in attempt is pending (browser opened, not yet done). */
export function isGoogleAuthPending(): boolean {
  return pendingVerifier !== null && !done;
}
