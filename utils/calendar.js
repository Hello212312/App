// utils/calendar.js
// Add internship deadlines to the device calendar using expo-calendar.
// Install: npx expo install expo-calendar

import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

// ─── HELPERS ──────────────────────────────────────────────────────────────────

/**
 * Parses a deadline string like "February 28" or "March 15, 2026" into a Date.
 * If no year is included, assumes the current or next year (whichever is future).
 *
 * @param {string} deadlineStr
 * @returns {Date|null}
 */
function parseDeadlineDate(deadlineStr) {
  if (!deadlineStr) return null;

  try {
    // Try parsing directly (works for "March 15, 2026")
    const direct = new Date(deadlineStr);
    if (!isNaN(direct.getTime())) return direct;

    // Append current year and retry (works for "February 28")
    const now = new Date();
    const withYear = new Date(`${deadlineStr}, ${now.getFullYear()}`);
    if (!isNaN(withYear.getTime())) {
      // If that date has already passed this year, use next year
      if (withYear < now) {
        return new Date(`${deadlineStr}, ${now.getFullYear() + 1}`);
      }
      return withYear;
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Gets a writable calendar ID.
 * - On iOS: uses the default calendar.
 * - On Android: finds the first writable calendar.
 *
 * @returns {Promise<string|null>}
 */
async function getWritableCalendarId() {
  if (Platform.OS === 'ios') {
    const defaultCal = await Calendar.getDefaultCalendarAsync();
    return defaultCal?.id ?? null;
  }

  // Android: find the first calendar that allows modifications
  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const writable = calendars.find(
    (cal) => cal.allowsModifications && cal.accessLevel !== 'read'
  );
  return writable?.id ?? null;
}

// ─── ADD TO CALENDAR ──────────────────────────────────────────────────────────

/**
 * Creates a calendar reminder for an internship application deadline.
 * Guards against duplicate events: if an event with the same title already
 * exists on the same calendar on the same date, shows a message instead of
 * creating a second one.
 *
 * @param {object} item — Internship object from data.js (must have role, company, deadline, url).
 */
export async function addDeadlineToCalendar(item) {
  try {
    // 1. Request calendar permissions
    const { status } = await Calendar.requestCalendarPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        "Couldn't add to calendar",
        'Please check your calendar permissions in Settings.'
      );
      return;
    }

    // 2. Parse the deadline date — prefer the ISO deadlineDate field first
    let startDate = null;

    if (item.deadlineDate) {
      // Parse as local date to avoid UTC offset shifting the day
      const [year, month, day] = item.deadlineDate.split('-').map(Number);
      if (year && month && day) startDate = new Date(year, month - 1, day);
    }

    if (!startDate) {
      startDate = parseDeadlineDate(item.deadline);
    }

    if (!startDate) {
      Alert.alert(
        "Couldn't add to calendar",
        "We weren't able to parse the deadline date. Please add it manually."
      );
      return;
    }

    // Midnight on the deadline day
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000); // +1 hour

    // 3. Get the writable calendar
    const calendarId = await getWritableCalendarId();
    if (!calendarId) {
      Alert.alert(
        "Couldn't add to calendar",
        'No writable calendar was found on this device.'
      );
      return;
    }

    // 4. Duplicate guard — check if an event with the same title already exists
    //    on this calendar within a ±1-day window around the deadline.
    const eventTitle = `Apply: ${item.role} at ${item.company}`;
    const windowStart = new Date(startDate.getTime() - 24 * 60 * 60 * 1000);
    const windowEnd   = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
    try {
      const existing = await Calendar.getEventsAsync([calendarId], windowStart, windowEnd);
      const alreadyAdded = existing.some((e) => e.title === eventTitle);
      if (alreadyAdded) {
        Alert.alert(
          'Already in Calendar',
          `A reminder for ${item.role} is already saved on ${startDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
        );
        return;
      }
    } catch {
      // If the duplicate check fails (e.g. permissions edge case), proceed anyway
    }

    // 5. Create the event
    await Calendar.createEventAsync(calendarId, {
      title: eventTitle,
      notes: `Deadline for internship application.\n\nApply at: ${item.url || 'See program website'}`,
      startDate,
      endDate,
      alarms: [
        { relativeOffset: -1440 }, // 1 day before
      ],
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });

    // 6. Success alert — show a human-readable date, not a raw ISO string
    const readableDate = startDate.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
    Alert.alert(
      'Added to Calendar',
      `Reminder saved for ${readableDate}.`
    );
  } catch (err) {
    console.warn('[calendar] addDeadlineToCalendar error:', err);
    Alert.alert(
      "Couldn't add to calendar",
      'Please check your calendar permissions in Settings.'
    );
  }
}