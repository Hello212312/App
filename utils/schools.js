// utils/schools.js
// School directory search backed by the Supabase `schools` table
// (NCES CCD public high school directory, ~23.5k open US high schools).
// Used by the onboarding school autocomplete.

import { supabase } from './supabase';

/**
 * Searches schools by name, optionally restricted to a state.
 * Returns [{ id, name, city, state, district }] — at most `limit` rows.
 * Fails soft (empty array) so onboarding never breaks offline.
 */
export async function searchSchools(query, state, limit = 8) {
  const q = (query || '').trim();
  if (q.length < 2) return [];
  try {
    // Match each typed word independently (AND'd together) rather than requiring
    // the whole phrase as one continuous substring. A single "%query%" ilike
    // fails the moment the user types words in a different order, or extra
    // filler words the school's on-file name doesn't happen to contain (e.g.
    // "Thomas Jefferson High School for Science and Technology" wouldn't match
    // a row unless the name held that exact run of words back to back).
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
  } catch (err) {
    console.warn('[schools] search failed:', err.message);
    return [];
  }
}
