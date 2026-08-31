import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as StoreReview from 'expo-store-review';

const COUNT_KEY = 'review_positive_count_v1';
const DONE_KEY = 'review_requested_v1';
// Ask only after the user has had a few genuinely positive moments, so the
// prompt lands when they're most likely to leave a good rating.
const THRESHOLD = 3;

/**
 * Record a "positive moment" (viewing a Kundli, finishing a report, etc.) and,
 * once the user has had a few of them, quietly trigger the OS in-app review
 * sheet exactly once. Google/Apple cap how often the sheet actually appears, and
 * we never show our own rating UI — this just asks the OS at a good time. All
 * failures are swallowed so it can be called freely from any screen.
 */
export async function registerPositiveMoment(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    if (await AsyncStorage.getItem(DONE_KEY)) return; // already asked once

    const n = parseInt((await AsyncStorage.getItem(COUNT_KEY)) || '0', 10) + 1;
    await AsyncStorage.setItem(COUNT_KEY, String(n));
    if (n < THRESHOLD) return;

    const available = await StoreReview.isAvailableAsync();
    if (!available) return;

    await StoreReview.requestReview();
    // Mark done regardless — the OS decides whether the sheet actually showed,
    // and we don't want to keep asking on every subsequent positive moment.
    await AsyncStorage.setItem(DONE_KEY, '1');
  } catch {
    // storage / native errors — never block the screen over a rating prompt
  }
}
