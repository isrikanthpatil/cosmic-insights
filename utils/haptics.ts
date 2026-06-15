import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptic feedback helpers. Haptics are unsupported on web (the calls can throw
// or warn), so every helper is a no-op on web and additionally wrapped in
// try/catch to guarantee it never breaks an onPress handler.

/** Light impact — use on primary taps (buttons, cards, sub-tabs). */
export function tap(): void {
  if (Platform.OS === 'web') return;
  try {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    // no-op: haptics may be unavailable on some devices/simulators
  }
}

/** Success notification — use after a save / successful action completes. */
export function success(): void {
  if (Platform.OS === 'web') return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    // no-op
  }
}

/** Warning notification — use for validation failures / cautions. */
export function warning(): void {
  if (Platform.OS === 'web') return;
  try {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  } catch {
    // no-op
  }
}
