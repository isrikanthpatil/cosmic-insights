// Local (no push server) daily horoscope reminder.
//
// Schedules a single repeating DAILY local notification at 9:00 AM local time
// using expo-notifications. There is no backend / push token involved — these
// are device-local scheduled notifications.
//
// IMPORTANT: expo-notifications must NOT be imported at module scope. On web,
// importing it runs its push-token auto-registration, which calls localStorage
// during the web (Node) render and crashes the bundle. So we lazily `require`
// it only on native, and web is a safe no-op.

import { Platform } from 'react-native';

const DAILY_REMINDER_ID = 'astropanth-daily-horoscope-reminder';
const REMINDER_HOUR = 9;
const REMINDER_MINUTE = 0;

type NotificationsModule = typeof import('expo-notifications');

let _notifications: NotificationsModule | null = null;
let _handlerSet = false;

// Load expo-notifications only on native, on first use. Returns null on web.
function getNotifications(): NotificationsModule | null {
  if (Platform.OS === 'web') {
    return null;
  }
  if (!_notifications) {
    _notifications = require('expo-notifications') as NotificationsModule;
  }
  if (!_handlerSet && _notifications) {
    // Surface a banner when a notification fires while the app is foregrounded.
    _notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    _handlerSet = true;
  }
  return _notifications;
}

/**
 * Request permission and schedule a repeating daily local notification at
 * 9:00 AM local time. Returns true if scheduled, false if permission was
 * denied or the platform is unsupported (web).
 */
export async function enableDailyHoroscopeReminder(): Promise<boolean> {
  const Notifications = getNotifications();
  if (!Notifications) {
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
  const Notifications = getNotifications();
  if (!Notifications) {
    return;
  }

  try {
    await Notifications.cancelScheduledNotificationAsync(DAILY_REMINDER_ID);
  } catch {
    // Ignore — the reminder may not have been scheduled.
  }
}
