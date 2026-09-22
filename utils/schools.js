// utils/schools.js
// School directory search backed by the Supabase `schools` table:
// ~23.5k public high schools (NCES CCD) + ~8.4k private high schools
// (NCES PSS 2021-22, ids prefixed "PSS", district = "Private").
// Used by the onboarding school autocomplete; the onboarding screen also
// offers a manual-entry fallback for schools missing from the directory.

import { supabase } from './supabase';

/**
 * Searches schools by name, optionally restricted to a state.
 * Returns [{ id, name, city, state, district }], at most `limit` rows.
 * Fails soft (empty array) so onboarding never breaks offline.
 */
export async function searchSchools(query, state, limit = 8) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  try {
    // Server-side fuzzy search (search_schools RPC): expands NCES
    // abbreviations ("TOMPKINS H S" matches "tompkins high school"), skips
    // generic words, soundex-matches misspellings ("thompson" still surfaces
    // "Tompkins"), and counts the school's city toward the match. A plain
    // ilike over `name` can't do any of that, since many NCES rows don't even
    // contain the words "high school".
    const { data, error } = await supabase.rpc('search_schools', {
      q,
      state_filter: state || null,
      max_rows: limit,
    });
    if (error) throw error;
    return data ?? [];
  } catch (_err) {
    // Fallback if the RPC is unavailable: match each typed word independently
    // (AND'd together) as a `name` substring.
    try {
      const tokens = q.split(/\s+/).filter(Boolean);
      let req = supabase
        .from('schools')
        .select('id, name, city, state, district')
        .order('name')
        .limit(limit);
      for (const token of tokens) {
        req = req.ilike('name', `%${token}%`);
      }
      if (state) req = req.eq('state', state);
      const { data, error } = await req;
      if (error) throw error;
      return data ?? [];
    } catch (err2) {
      console.warn('[schools] search failed:', err2.message);
      return [];
    }
  }
}
