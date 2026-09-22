// utils/analytics.js
// Logs view / save / apply-click events to Supabase.

import { supabase } from './supabase';
import { getDeviceId } from './premium';
import { posthog } from './posthog';

// Activity analytics deliberately exclude names, schools, location, age, GPA and demographics.
export async function logActivityEvent({
  eventType,
  internshipId,
  internshipTitle,
  company,
}) {
  posthog.capture(eventType, { internshipId, internshipTitle, company });
  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase.from('activity_events').insert({
      device_id: deviceId,
      event_type: eventType,
      internship_id: internshipId || null,
      internship_title: internshipTitle || null,
      company: company || null,
    });
    if (error) console.warn('[analytics] insert error:', error.message);
  } catch (e) {
    console.warn('[analytics] log error:', e.message);
  }
}

// Logs how a user heard about Interny (picked during onboarding). Reuses the
// activity_events table with event_type 'onboarding' plus a referral_source
// column, rather than a new table, so admin stats can join against the same
// per-device rows.
export async function logOnboardingSource({ source }) {
  posthog.capture('onboarding', { referral_source: source || null });
  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase.from('activity_events').insert({
      device_id: deviceId,
      event_type: 'onboarding',
      referral_source: source || null,
    });
    if (error) console.warn('[analytics] onboarding insert error:', error.message);
  } catch (e) {
    console.warn('[analytics] onboarding log error:', e.message);
  }
}

// Passphrase gate on the admin_get_activity_stats() Postgres function (see
// supabase/migrations/20260817130000_admin_auth_hardening.sql) — anon/authenticated
// have no direct SELECT on activity_events, this RPC is the only read path.
// The secret is never stored in the client: it's typed in each session by
// whoever opens AdminTrackerScreen and checked server-side against a bcrypt
// hash, with a failed-attempt lockout against brute-forcing the RPC.
export async function fetchAdminStats(secret) {
  try {
    const { data, error } = await supabase.rpc('admin_get_activity_stats', {
      p_secret: secret,
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true, stats: data };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

// Only step numbers and actions; no profile answers in product analytics.
export function logOnboardingStep(action,step) { posthog.capture('onboarding_step',{action,step}); }
