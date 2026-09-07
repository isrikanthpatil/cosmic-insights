import { Platform } from 'react-native';
import { pb } from '@/utils/pocketbase';

// Sign in with Apple (App Store Guideline 4.8 — required because the app also
// offers Google login). `expo-apple-authentication` is a native iOS module; it's
// required lazily so the JS bundle doesn't hard-fail on platforms/builds where it
// isn't present, and so tsc stays green before
// `npx expo install expo-apple-authentication` has been run.
let AppleAuthentication: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  AppleAuthentication = require('expo-apple-authentication');
} catch {
  AppleAuthentication = null;
}

const PB_URL = process.env.EXPO_PUBLIC_PB_URL ?? 'https://api.astropanth.com';
// Same server redirect page used for Google — 302s the provider back into the app.
export const APPLE_SERVER_REDIRECT = `${PB_URL}/oauth-redirect`;

/** True only on iOS where the device actually offers Sign in with Apple. */
export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios' || !AppleAuthentication) return false;
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

/**
 * Presents Apple's native sheet, then exchanges the returned authorization code
 * for a PocketBase session via the "apple" OAuth2 provider. Returns true on success.
 *
 * FINALIZE POST-ENROLLMENT (needs the Apple Developer account first):
 *  - Apple Developer: create a Services ID, a "Sign in with Apple" key (.p8),
 *    and note Team ID + Key ID.
 *  - PocketBase admin → Auth providers → Apple: set clientId, the .p8-derived
 *    secret/JWT, and redirect URL = APPLE_SERVER_REDIRECT.
 * The native flow returns an authorization code with no PKCE verifier, so we pass
 * an empty codeVerifier. On a real device confirm the provider's clientId (for the
 * native path this is typically the app bundle id, not the web Services ID).
 */
export async function signInWithApple(): Promise<boolean> {
  if (!AppleAuthentication) {
    throw new Error('Apple sign-in is unavailable on this device.');
  }
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  const code: string | undefined = credential?.authorizationCode ?? undefined;
  if (!code) throw new Error('Apple did not return an authorization code.');

  // Apple returns the user's name only on the FIRST authorization — forward it
  // (when present) so the PocketBase profile can be seeded with it.
  const name = [credential?.fullName?.givenName, credential?.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  const createData = name ? { name } : undefined;

  await pb
    .collection('users')
    .authWithOAuth2Code('apple', code, '', APPLE_SERVER_REDIRECT, createData);
  return true;
}
