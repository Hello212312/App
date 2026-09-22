// utils/analytics.js
// Logs view / save / apply-click events to Supabase.

import { supabase } from './supabase';
import { getDeviceId } from './premium';
import { posthog } from './posthog';

// Maps the UserContext profile shape onto activity_events columns. Called on
// every event so admin stats always reflect the user's *current* profile,
// not just whatever was known at onboarding time.
function profileFields(user = {}) {
  const city = user.city || (user.school && user.school.city) || '';
  const state = user.state || (user.school && user.school.state) || '';
  return {
    user_grade: user.grade || null,
    user_gpa_range: user.gpaRange || null,
    user_gender: user.gender || null,
    user_race: Array.isArray(user.race) && user.race.length ? user.race.join(', ') : null,
    user_age: typeof user.age === 'number' ? user.age : null,
    user_interests: Array.isArray(user.interests) && user.interests.length ? user.interests.join(', ') : null,
    user_location: city && state ? `${city}, ${state}` : (state || city || null),
    user_state: state || null,
    user_city: city || null,
    user_remote_only: typeof user.remoteOnly === 'boolean' ? user.remoteOnly : null,
    user_travel_willingness: user.travelWillingness || null,
    user_format_preference: user.formatPreference || null,
  };
}

export async function logActivityEvent({
  eventType,
  internshipId,
  internshipTitle,
  company,
  user,
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
      user_name: user?.name || null,
      user_school: user?.school?.name || null,
      ...profileFields(user),
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
export async function logOnboardingSource({ source, user }) {
  posthog.capture('onboarding', { referral_source: source || null });
  try {
    const deviceId = await getDeviceId();
    const { error } = await supabase.from('activity_events').insert({
      device_id: deviceId,
      event_type: 'onboarding',
      referral_source: source || null,
      user_name: user?.name || null,
      user_school: user?.school?.name || null,
      ...profileFields(user),
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
