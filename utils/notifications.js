// utils/notifications.js
// Deadline reminder notifications using expo-notifications.
// Install: npx expo install expo-notifications
//
// Premium: scheduleAllReminders's saved-reminder pass accepts an options-like
// user object. Free users get the standard 7/3/1 day schedule. Premium users
// get whatever days they have toggled on (up to 30/14/7/3/1), stored in
// user.reminderDays.
//
// Discovery: independent of the saved schedule, any internship the user
// HASN'T saved yet also gets a single "closing soon" nudge if it's both a
// strong match (>=50%) and closing within 7 days — a proactive recommendation
// rather than a reminder about something already tracked.

import * as Notifications from 'expo-notifications';
import { computeMatchBreakdown, getEffectiveDaysLeft } from './matching';
import { FREE_REMINDER_DAYS } from './premium';

// ─── PERMISSION ───────────────────────────────────────────────────────────────

/**
 * Requests push notification permission from the user.
 * @returns {Promise<boolean>} true if granted, false otherwise.
 */
export async function requestNotificationPermission() {
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

// ─── SCHEDULING ───────────────────────────────────────────────────────────────

// Returns notification copy for any number of days. Known thresholds get
// polished copy; any custom day gets a sensible generic fallback.
// At the 7-day threshold, a strong match (>=50%) gets a "why you should care"
// call-to-action instead of the generic reminder.
function getCopy(days, matchPct = null) {
  if (days === 7 && matchPct !== null && matchPct >= 50) {
    return { title: 'High match closing soon', body: (r, c) => `${r} at ${c} is closing in 7 days, and it's a ${matchPct}% match. Apply now!` };
  }
  if (days === 1)  return { title: 'Last chance',        body: (r, c) => `${r} at ${c} closes tomorrow!` };
  if (days === 3)  return { title: '3 days left',        body: (r, c) => `${r} at ${c}: application closes soon.` };
  if (days === 7)  return { title: 'Deadline in 1 week', body: (r, c) => `${r} at ${c} closes in 7 days. Don't wait!` };
  if (days === 14) return { title: '2 weeks left',       body: (r, c) => `${r} at ${c} closes in 2 weeks. Time to lock in your recommenders and essays.` };
  if (days === 30) return { title: '1 month out',       body: (r, c) => `${r} at ${c} closes in 30 days. Plenty of time to prep your materials.` };
  return { title: `${days} days left`, body: (r, c) => `${r} at ${c} closes in ${days} days.` };
}

// Threshold used for both "closing soon, strong match" discovery alerts and
// "new internship added" alerts.
const HIGH_MATCH_THRESHOLD = 50;

/**
 * Resolves which reminder days apply for this user.
 * Free: always FREE_REMINDER_DAYS. Premium: user's custom set, falling back
 * to the free schedule if they have not customized anything.
 */
function resolveReminderDays({ premium = false, reminderDays = null } = {}) {
  if (premium && Array.isArray(reminderDays) && reminderDays.length > 0) {
    return [...reminderDays].filter((d) => d > 0).sort((a, b) => b - a);
  }
  return FREE_REMINDER_DAYS;
}

// iOS silently drops everything past 64 pending local notifications. Reserve
// most of the budget for saved reminders (the user opted into these) and a
// smaller slice for discovery nudges, so neither pass can starve the other.
const MAX_SCHEDULED_TOTAL = 60;
const MAX_DISCOVERY_ALERTS = 20;

async function scheduleSavedReminders(savedIds, internships, user, startCount) {
  let scheduledCount = startCount;
  if (!savedIds || savedIds.length === 0) return scheduledCount;

  const days = resolveReminderDays({ premium: !!user.premium, reminderDays: user.reminderDays });
  const maxForPass = MAX_SCHEDULED_TOTAL - MAX_DISCOVERY_ALERTS;

  const savedItems = internships
    .filter((item) => {
      if (!savedIds.includes(item.id)) return false;
      const d = getEffectiveDaysLeft(item);
      return d !== null && d > 0;
    })
    .sort((a, b) => getEffectiveDaysLeft(a) - getEffectiveDaysLeft(b));

  for (const item of savedItems) {
    if (scheduledCount >= maxForPass) break;
    const daysLeft = getEffectiveDaysLeft(item);
    const { role, company } = item;
    const breakdown = computeMatchBreakdown(item, user);
    const matchPct = breakdown ? breakdown.total : null;

    let firedAny = false;
    for (const thresholdDays of days) {
      if (scheduledCount >= maxForPass) break;
      const copy = getCopy(thresholdDays, matchPct);

      // Only schedule if the deadline is still further away than the threshold
      if (daysLeft < thresholdDays) continue;

      // Fire when daysLeft reaches thresholdDays, i.e. (daysLeft - thresholdDays) days from now.
      const daysUntilFire = daysLeft - thresholdDays;

      // If this threshold has already arrived (daysUntilFire === 0), skip it —
      // the near-immediate fallback below handles that case instead.
      if (daysUntilFire <= 0) continue;

      const secondsUntilFire = daysUntilFire * 86400;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: copy.title,
          body: copy.body(role, company),
          sound: true,
          data: { internshipId: item.id },
        },
        // Explicit trigger type (SDK 52+ recommended form). The bare
        // `{ seconds }` shape is the legacy auto-inferred form.
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: secondsUntilFire,
        },
      });
      scheduledCount += 1;
      firedAny = true;
    }

    // Every enabled threshold already fell inside the deadline window (e.g. the
    // user saved something closing tomorrow, so the "1 day left" reminder's
    // fire time is now/in the past). Previously this meant the item silently
    // got zero reminders ever — send one near-immediate nudge instead so
    // saving something that's already urgent still notifies the user.
    if (!firedAny && scheduledCount < maxForPass) {
      const copy = getCopy(daysLeft, matchPct);
      await Notifications.scheduleNotificationAsync({
        content: {
          title: copy.title,
          body: copy.body(role, company),
          sound: true,
          data: { internshipId: item.id },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 5,
        },
      });
      scheduledCount += 1;
    }
  }
  return scheduledCount;
}

async function scheduleDiscoveryAlerts(savedIds, internships, user, startCount) {
  let scheduledCount = startCount;
  const savedSet = new Set(savedIds || []);
  const maxForPass = MAX_SCHEDULED_TOTAL;

  const candidates = internships
    .filter((item) => !savedSet.has(item.id))
    .map((item) => {
      const daysLeft = getEffectiveDaysLeft(item);
      if (daysLeft === null || daysLeft < 7) return null;
      const breakdown = computeMatchBreakdown(item, user);
      const matchPct = breakdown ? breakdown.total : null;
      if (matchPct === null || breakdown.ineligible || matchPct < HIGH_MATCH_THRESHOLD) return null;
      const daysUntilFire = daysLeft - 7;
      if (daysUntilFire <= 0) return null;
      return { item, daysLeft, matchPct, daysUntilFire };
    })
    .filter(Boolean)
    .sort((a, b) => a.daysLeft - b.daysLeft || b.matchPct - a.matchPct)
    .slice(0, MAX_DISCOVERY_ALERTS);

  for (const { item, matchPct, daysUntilFire } of candidates) {
    if (scheduledCount >= maxForPass) break;
    const copy = getCopy(7, matchPct);
    await Notifications.scheduleNotificationAsync({
      content: {
        title: copy.title,
        body: copy.body(item.role, item.company),
        sound: true,
        data: { internshipId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: daysUntilFire * 86400,
      },
    });
    scheduledCount += 1;
  }
  return scheduledCount;
}

// Alerts the user about internships that were just added to the catalog,
// are in their field of interest, and are a strong match. `newIds` is the
// set of internship IDs the caller has determined weren't present the last
// time it checked (see UserContext's seenInternshipIds tracking).
async function scheduleNewMatchAlerts(newIds, internships, user, startCount) {
  let scheduledCount = startCount;
  if (!newIds || newIds.length === 0) return scheduledCount;
  const newSet = new Set(newIds);
  const maxForPass = MAX_SCHEDULED_TOTAL;

  const candidates = internships
    .filter((item) => newSet.has(item.id))
    .map((item) => {
      const breakdown = computeMatchBreakdown(item, user);
      const matchPct = breakdown ? breakdown.total : null;
      if (matchPct === null || breakdown.ineligible || matchPct < HIGH_MATCH_THRESHOLD) return null;
      return { item, matchPct };
    })
    .filter(Boolean)
    .sort((a, b) => b.matchPct - a.matchPct)
    .slice(0, MAX_DISCOVERY_ALERTS);

  for (const { item, matchPct } of candidates) {
    if (scheduledCount >= maxForPass) break;
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'New internship in your field',
        body: `${item.role} at ${item.company} was just added and is a ${matchPct}% match. Take a look!`,
        sound: true,
        data: { internshipId: item.id },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
    scheduledCount += 1;
  }
  return scheduledCount;
}

/**
 * Cancels all existing reminders and reschedules, based on which notification
 * types the user has enabled:
 *  1. notifyDeadlines   — saved-internship deadline reminders, at each
 *     enabled threshold (default true).
 *  2. notifyHighMatch   — nudges for strong-match (>=50%) internships the
 *     user hasn't saved yet, closing within 7 days (default true).
 *  3. notifyNewMatches  — alerts for internships just added to the catalog
 *     that are in the user's field and a strong match (default true).
 * All three are gated by the master `notificationsOn` toggle, checked by
 * the caller before this function is invoked.
 *
 * @param {string[]} savedIds    — Array of saved internship IDs from UserContext.
 * @param {object[]} internships — Full INTERNSHIPS array from data.js.
 * @param {object}   user        — The user profile object (for match scoring, notification-type toggles, and premium/reminderDays).
 * @param {string[]} newIds      — Internship IDs newly added since the last check, for the "new match" alert type.
 */
export async function scheduleAllReminders(savedIds, internships, user = {}, newIds = []) {
  try {
    // Always cancel previous schedule before rebuilding
    await Notifications.cancelAllScheduledNotificationsAsync();

    if (!internships || internships.length === 0) return;

    const granted = await requestNotificationPermission();
    if (!granted) return;

    let scheduledCount = 0;
    if (user.notifyDeadlines !== false) {
      scheduledCount = await scheduleSavedReminders(savedIds, internships, user, scheduledCount);
    }
    if (user.notifyHighMatch !== false) {
      scheduledCount = await scheduleDiscoveryAlerts(savedIds, internships, user, scheduledCount);
    }
    if (user.notifyNewMatches !== false) {
      scheduledCount = await scheduleNewMatchAlerts(newIds, internships, user, scheduledCount);
    }
  } catch (err) {
    // Silently swallow — notifications are non-critical
    console.warn('[notifications] scheduleAllReminders error:', err);
  }
}

// ─── CANCEL ───────────────────────────────────────────────────────────────────

/**
 * Cancels all scheduled deadline reminders.
 */
export async function cancelAllReminders() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (err) {
    console.warn('[notifications] cancelAllReminders error:', err);
  }
}
