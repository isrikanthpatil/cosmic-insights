// Local (no push server) daily horoscope reminder.
//
// Schedules a single repeating DAILY local notification at 9:00 AM local time
// using expo-notifications. There is no backend / push token involved — these
// are device-local scheduled notifications. Web is a safe no-op since the
// scheduling APIs are not supported there.

import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

// Stable identifier so we can cancel/replace the reminder without touching any
// other scheduled notifications.
const DAILY_REMINDER_ID = 'astropanth-daily-horoscope-reminder';

const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

// Ensure notifications surface an alert (and not just silently) while the app
// is foregrounded. Registering this is cheap and idempotent.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/**
 * Request permission and schedule a repeating daily local notification at
 * 9:00 AM local time. Returns true if scheduled, false if permission was
 * denied or the platform is unsupported (web).
 */
export async function enableDailyHoroscopeReminder(): Promise<boolean> {
  // expo-notifications scheduling is not supported on web — no-op gracefully.
  if (Platform.OS === 'web') {
    return false;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return false;
    }

    // Cancel any existing reminder before re-scheduling to avoid duplicates.
    await disableDailyHoroscopeReminder();

    await Notifications.scheduleNotificationAsync({
      identifier: DAILY_REMINDER_ID,
      content: {
        title: 'Astropanth',
        body: 'Your daily horoscope is ready ✨ — see what the stars say today.',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: REMINDER_HOUR,
        minute: REMINDER_MINUTE,
      },
    });

    return true;
  } catch {
    // Any unexpected native/permission error: treat as not enabled.
    return false;
  }
}

/**
 * Cancel the scheduled daily reminder. Safe to call when nothing is scheduled,
 * and a no-op on web.
 */
export async function disableDailyHoroscopeReminder(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  } catch {
    // Ignore — the reminder may not have been scheduled.
  }
}
