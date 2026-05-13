import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Profile } from './database.types';
import { supabase } from './supabase';

/**
 * Daily reminders system.
 *
 * Three fixed peak-free-time slots (user's local time):
 *   - 08:00 — morning, coffee/commute window
 *   - 12:30 — lunch break
 *   - 19:30 — evening wind-down ("rescue your streak")
 *
 * Strategy:
 *   - Schedule individual DATE-trigger notifications for the next 14 days (42 total max).
 *     We use date triggers instead of DAILY recurrence so we can skip individual days
 *     (e.g. cancel today's remaining slots when the user completes their daily goal).
 *   - On every app launch, profile change, or goal completion, call refreshDailyReminders.
 *     It cancels everything and rebuilds the queue fresh.
 *   - Message text rotates to avoid notification blindness.
 *
 * Platform notes:
 *   - iOS: needs explicit user permission via requestPermissionsAsync.
 *   - Android: needs POST_NOTIFICATIONS permission (Android 13+). Same call works.
 *   - Both store schedules through the OS so they fire even if the app is killed.
 */

// ============== Module-level setup ==============
// Foreground display behavior — must be configured before any notifications fire.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ============== Slot definitions ==============
export interface ReminderSlotDef {
  key: 'morning' | 'afternoon' | 'evening';
  hour: number;
  minute: number;
  emoji: string;
  label: string;
}

export const REMINDER_SLOTS: ReadonlyArray<ReminderSlotDef> = [
  { key: 'morning', hour: 8, minute: 0, emoji: '☕', label: 'Morning (8:00)' },
  { key: 'afternoon', hour: 12, minute: 30, emoji: '🍜', label: 'Lunch (12:30)' },
  { key: 'evening', hour: 19, minute: 30, emoji: '🔥', label: 'Evening (19:30)' },
];

// Message variations — rotated randomly to keep notifications fresh
const MESSAGES: Record<ReminderSlotDef['key'], Array<{ title: string; body: string }>> = {
  morning: [
    { title: 'Dobré ráno! ☕', body: 'Pět minut češtiny na začátek dne?' },
    { title: 'Ready for Czech? ☕', body: 'A quick lesson to start your day.' },
    { title: 'Good morning! ☀️', body: 'Your daily Czech is waiting.' },
    { title: 'Start strong 💪', body: 'Five minutes now beats an hour tomorrow.' },
  ],
  afternoon: [
    { title: 'Lunch break 🍜', body: 'Squeeze in a quick Czech lesson?' },
    { title: 'Halfway there ⏱️', body: 'A few words now keeps your streak alive.' },
    { title: 'Bored at lunch? 🥪', body: 'Five words in five minutes.' },
    { title: 'Czech snack 🥨', body: 'Bite-sized lesson, big progress.' },
  ],
  evening: [
    { title: 'Save your streak 🔥', body: "Don't lose what you've built — one lesson now." },
    { title: 'Evening practice 🌙', body: 'End the day with a quick Czech win.' },
    { title: 'Almost bedtime 🌙', body: 'Five minutes to keep your streak alive.' },
    { title: 'Czech before sleep? 📚', body: 'A short lesson, then rest easy.' },
  ],
};

function pickMessage(key: ReminderSlotDef['key']) {
  const pool = MESSAGES[key];
  return pool[Math.floor(Math.random() * pool.length)];
}

// ============== Permission ==============

export async function getNotificationPermission(): Promise<'granted' | 'denied' | 'undetermined'> {
  try {
    const result = await Notifications.getPermissionsAsync();
    if (result.status === 'granted') return 'granted';
    if (result.status === 'denied') return 'denied';
    return 'undetermined';
  } catch {
    return 'undetermined';
  }
}

/**
 * Request OS permission for notifications.
 * Returns true if granted, false if denied or restricted.
 *
 * Note: on iOS this prompt only shows ONCE per install. If user denies, they must
 * re-enable in Settings — we can't re-prompt.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.status === 'granted') return true;
    if (existing.status === 'denied' && !existing.canAskAgain) return false;
    const result = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: false,
        allowSound: true,
        allowAnnouncements: false,
      },
    });
    return result.status === 'granted';
  } catch (e) {
    console.warn('[notif] permission request failed', e);
    return false;
  }
}

// ============== Scheduling ==============

/**
 * Cancel and rebuild all daily reminders for the next 14 days, respecting:
 *   - User's per-slot toggles
 *   - The master notif_streak_enabled toggle
 *   - Whether the user already completed their daily goal today (skip today's remaining)
 *   - Times that have already passed today
 *
 * Safe to call repeatedly. Idempotent.
 */
export async function refreshDailyReminders(profile: Profile, todayGoalMet: boolean): Promise<void> {
  const permission = await getNotificationPermission();
  if (permission !== 'granted') return;

  // Cancel everything we previously scheduled
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => {});

  // If the master switch is off, leave the queue empty
  if (!profile.notif_streak_enabled) return;

  const now = new Date();
  const HORIZON_DAYS = 14;

  for (let dayOffset = 0; dayOffset < HORIZON_DAYS; dayOffset++) {
    for (const slot of REMINDER_SLOTS) {
      // Per-slot toggle
      const slotEnabledKey = `notif_${slot.key}_enabled` as keyof Profile;
      if (profile[slotEnabledKey] === false) continue;

      const fireAt = new Date(now);
      fireAt.setDate(fireAt.getDate() + dayOffset);
      fireAt.setHours(slot.hour, slot.minute, 0, 0);

      // Skip past times today
      if (fireAt.getTime() <= now.getTime()) continue;
      // Skip today's remaining if user already met today's goal
      if (dayOffset === 0 && todayGoalMet) continue;

      const message = pickMessage(slot.key);
      try {
        await Notifications.scheduleNotificationAsync({
          identifier: `cesta_${slot.key}_d${dayOffset}`,
          content: {
            title: message.title,
            body: message.body,
            data: { slot: slot.key, dayOffset },
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: fireAt,
          } as any,
        });
      } catch (e) {
        console.warn(`[notif] failed to schedule ${slot.key} d${dayOffset}`, e);
      }
    }
  }
}

/**
 * Called when the user completes their daily goal. Cancels remaining reminders for today,
 * leaves tomorrow's and onward intact.
 *
 * Implementation: refreshDailyReminders with todayGoalMet=true handles this correctly
 * because day 0 entries are skipped.
 */
export async function notifyGoalMet(profile: Profile): Promise<void> {
  await refreshDailyReminders(profile, true);
}

/**
 * Cancel everything — used when user signs out or disables all notifications.
 */
export async function cancelAllReminders(): Promise<void> {
  try { await Notifications.cancelAllScheduledNotificationsAsync(); } catch {}
}

// ============== Diagnostics ==============

export async function listScheduledCount(): Promise<number> {
  try {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.length;
  } catch {
    return 0;
  }
}
