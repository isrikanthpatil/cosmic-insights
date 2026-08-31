import { Share, Platform, Linking } from 'react-native';
import * as StoreReview from 'expo-store-review';

export const PLAY_URL = 'https://play.google.com/store/apps/details?id=com.astropanth.cosmicinsights';

/** Share the app itself (Play Store link) — a lightweight, always-available way
 * for happy users to bring friends in. */
export async function shareApp(): Promise<void> {
  const message =
    `Astropanth — free Vedic Kundli, daily Rashifal, Panchang & Kundli matching ✨\n${PLAY_URL}`;
  try {
    if (Platform.OS === 'web') {
      const nav: any = typeof navigator !== 'undefined' ? navigator : undefined;
      if (nav?.share) await nav.share({ text: message });
      return;
    }
    await Share.share({ message });
  } catch {
    // cancelled — ignore
  }
}

/** Manual "Rate us": prefer the native in-app review sheet, fall back to opening
 * the Play Store listing so the user can always leave a rating. */
export async function rateApp(): Promise<void> {
  try {
    if (Platform.OS !== 'web' && (await StoreReview.isAvailableAsync()) && (await StoreReview.hasAction())) {
      await StoreReview.requestReview();
      return;
    }
  } catch {
    // fall through to the store page
  }
  try {
    await Linking.openURL(PLAY_URL);
  } catch {
    // no browser / cancelled — ignore
  }
}
