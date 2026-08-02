// data.js
// Internship data — fetched live from Supabase.
// Falls back to an empty array (with a clear warning) if the fetch fails,
// so the app never crashes due to a network error.
//
// Usage (same as before — nothing else in the app needs to change):
// import { INTERNSHIPS, loadInternships } from './data';
//
// Call loadInternships() once at app startup (in App.js),
// then INTERNSHIPS will be populated for all screens.

import { supabase } from './utils/supabase';

// HELPERS 

/**
 * Converts a Supabase row (snake_case) back to the shape the app expects (camelCase).
 * Also computes daysLeft live from deadline_date so it's never stale.
 */
function rowToInternship(row) {
 // Compute daysLeft live from deadline_date
 let daysLeft = null;
 if (row.deadline_date) {
   // Parse date components directly to avoid UTC-vs-local timezone offset issues.
   // e.g. "2025-06-15" parsed with new Date() is UTC midnight, which is already
   // "yesterday" in negative-offset timezones (UTC-5 etc.), shifting dates by 1 day.
   const parts = String(row.deadline_date).split('-');
   if (parts.length === 3) {
     const y = parseInt(parts[0], 10);
     const m = parseInt(parts[1], 10) - 1; // 0-indexed month
     const d = parseInt(parts[2], 10);
     if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
       const deadlineLocal = new Date(y, m, d);
       const todayLocal = new Date();
       todayLocal.setHours(0, 0, 0, 0);
       const diffDays = Math.round((deadlineLocal - todayLocal) / (1000 * 60 * 60 * 24));
       // Only set daysLeft for deadlines that are today or in the future.
       // Past deadlines (diffDays < 0) get null so no badge is shown.
       // diffDays === 0 means the deadline IS today.
       if (diffDays >= 0) {
         daysLeft = diffDays;
       }
       // If diffDays < 0 (past), leave daysLeft as null — no badge shown.
     }
   }
 }

 // The DB column is "location(Remote/InPerson,Hybrid)" — there is no bare "location" column.
 // We use the full locationFormat string as item.location so that all downstream
 // matching, display, and filter logic that reads item.location works correctly.
 const locationFormat = row['location(Remote/InPerson,Hybrid)'] ?? '';

 return {
 id: String(row.id),
 role: row.role ?? '',
 company: row.company ?? '',
 location: locationFormat,                // ← the actual location data
 tags: row.tags ?? [],
 remote: row.remote ?? false,
 logoColor: row.logo_color ?? '#EFF6FF',
 field: row.field ?? '',
 featured: row.featured ?? false,
 deadline: row.deadline ?? 'Rolling',
 deadlineDate: row.deadline_date ?? null,
 duration: row.duration ?? '',
 url: row.url ?? '',
 grades: row.grades ?? row['Grades'] ?? '',          // verbose requirements text
 gradesShort: row['Grades'] ?? '',                    // short formatted field used for scoring ("Grades 9–12", "9–12", etc.)
 overview: row.overview ?? '',
 requirements: row.requirements ?? '',
 howToApply: row.how_to_apply ?? '',
 competitiveness: row.competitiveness ?? null,
 payType: row['Paid/Unpaid/Stipend'] ?? null,   // "Paid" | "Unpaid" | "Stipend" | null
 locationFormat,                                 // kept for backward compat
 daysLeft,
 createdAt: row.created_at ?? null,   // powers premium early-access window
 applicationChecklist: row['ApplicationChecklist'] ?? '',
 requiredState: row.Required_State ?? '',        // structured hard-eligibility state requirement
 requiredRace: row.Required_Race ?? '',          // structured hard-eligibility race requirement
 };
}

// MODULE STATE 

// Starts empty — populated by loadInternships() on app startup.
export let INTERNSHIPS = [];

let _loaded = false;
let _loading = false;
let _listeners = [];
let _fetchGen = 0; // bumped by refreshInternships so a stale in-flight fetch can't overwrite fresh data

/**
 * Subscribe to internship data changes.
 * Returns an unsubscribe function.
 */
export function subscribeToInternships(listener) {
 _listeners.push(listener);
 // Immediately call with current data if already loaded
 if (_loaded) listener(INTERNSHIPS);
 return () => {
 _listeners = _listeners.filter((l) => l !== listener);
 };
}

function _notify() {
 _listeners.forEach((l) => l(INTERNSHIPS));
}

// LOAD 

/**
 * Fetches all internships from Supabase and populates INTERNSHIPS.
 * Safe to call multiple times — only fetches once.
 *
 * @returns {Promise<object[]>} The loaded internships array.
 */
export async function loadInternships() {
 if (_loaded) return INTERNSHIPS;
 if (_loading) {
 // Wait for the in-flight request to finish
 return new Promise((resolve) => {
 const unsub = subscribeToInternships((data) => {
 unsub();
 resolve(data);
 });
 });
 }

 _loading = true;
 const gen = _fetchGen;

 try {
 const { data, error } = await supabase
 .from('Internships')
 .select('*')
 .order('featured', { ascending: false })
 .order('deadline_date', { ascending: true, nullsFirst: false });

 if (error) throw error;

 // A refresh started after this fetch — discard this (now stale) result.
 if (gen !== _fetchGen) return INTERNSHIPS;

 INTERNSHIPS = (data ?? []).map(rowToInternship);
 _loaded = true;
 _notify();
 return INTERNSHIPS;
 } catch (err) {
 console.warn('[data.js] Failed to load internships from Supabase:', err.message);
 if (gen !== _fetchGen) return INTERNSHIPS;
 // Keep whatever data we already have (don't wipe a good list on a failed
 // refresh); on first load this is just the empty array.
 _loaded = true;
 _notify();
 return INTERNSHIPS;
 } finally {
 if (gen === _fetchGen) _loading = false;
 }
}

/**
 * Forces a fresh fetch from Supabase (e.g. pull-to-refresh).
 */
export async function refreshInternships() {
 _fetchGen += 1; // invalidate any in-flight fetch
 _loaded = false;
 _loading = false;
 return loadInternships();
}