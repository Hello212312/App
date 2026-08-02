// utils/premium.js
// Single source of truth for everything Premium: pricing, feature copy,
// essay review caps, and small shared helpers.
//
// NOTE ON PAYMENTS: Stripe is not wired up yet. PaywallScreen currently
// activates premium locally the moment the user taps the purchase button.
// When Stripe is ready, swap activatePremium() call in PaywallScreen for a
// real checkout flow (see TODO there), and have the Stripe webhook write to
// the existing premium_devices table so the gemini-chat edge function can
// verify premium server-side.

import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// ─── PRICING ──────────────────────────────────────────────────────────────────
// One-time purchase, no subscription.

export const PREMIUM_PRICE = {
  price: '$8',
  label: 'One-time purchase',
  sub: 'Pay once. Yours forever, no renewals.',
};

// ─── ESSAY REVIEW CAP ─────────────────────────────────────────────────────────

// Reviews are done by a human, so they are capped, not unlimited.
export const ESSAY_REVIEWS_PER_MONTH = 2;

// ─── FEATURES SHOWN ON THE PAYWALL ────────────────────────────────────────────

export const PREMIUM_FEATURES = [
  {
    icon: 'sparkles-outline',
    title: 'Unlimited AI chat',
    sub: 'No daily question limit on the AI assistant.',
  },
  {
    icon: 'notifications-outline',
    title: 'Smarter deadline reminders',
    sub: 'Get warned up to 30 days out and choose exactly when reminders fire.',
  },
  {
    icon: 'chatbubbles-outline',
    title: 'Interview prep bank',
    sub: '100+ practice questions with coaching hints for every field, plus a mock interview mode.',
  },
  {
    icon: 'book-outline',
    title: 'How to Apply guide',
    sub: 'The full playbook on applications and essay writing, from picking targets to the final checklist.',
  },
  {
    icon: 'school-outline',
    title: 'Essay review',
    sub: `Submit up to ${ESSAY_REVIEWS_PER_MONTH} essays a month for personal feedback, delivered to your email.`,
  },
];

// ─── ESSAY REVIEW ─────────────────────────────────────────────────────────────

export const ESSAY_MAX_CHARS = 30000; // matches the DB-side check constraint
export const ESSAY_REVIEW_TURNAROUND_COPY = 'Feedback is written personally and emailed to you, usually within 3 to 5 days.';

/** Month key like "2026-07" used to bucket essay usage. */
export function getMonthKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${d.getFullYear()}-${m}`;
}

/** Counts submissions made in the current calendar month. */
export function essayUsageThisMonth(essaySubmissions = []) {
  const key = getMonthKey();
  return essaySubmissions.filter((s) => (s.monthKey || '') === key).length;
}

// ─── REMINDER TIMING ──────────────────────────────────────────────────────────

// Free users get the standard schedule. Premium users can toggle any set.
export const FREE_REMINDER_DAYS = [7, 3, 1];
export const ALL_REMINDER_OPTIONS = [
  { days: 30, label: '1 month before', premium: true },
  { days: 14, label: '2 weeks before', premium: true },
  { days: 7,  label: '1 week before',  premium: false },
  { days: 3,  label: '3 days before',  premium: false },
  { days: 1,  label: '1 day before',   premium: false },
];

// ─── DEVICE ID ────────────────────────────────────────────────────────────────
// Same key ChatScreen uses, so essay submissions and chat usage share one id.

const DEVICE_ID_KEY = '@interny_device_id';

export async function getDeviceId() {
  let id = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!id) {
    id = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, id);
  }
  return id;
}

// ─── SUPABASE SUBMISSION ──────────────────────────────────────────────────────

/**
 * Inserts an essay review request. Write-only table: the app can insert but
 * never read back other users' essays. Returns { ok, error }.
 */
export async function submitEssayReview({ deviceId, email, essayTitle, essayText, program, notes }) {
  try {
    const { error } = await supabase.from('essay_reviews').insert({
      device_id: deviceId,
      email: email || null,
      essay_title: essayTitle || null,
      essay_text: essayText,
      program: program || null,
      notes: notes || null,
      status: 'submitted',
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
