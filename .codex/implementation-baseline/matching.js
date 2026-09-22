// matching.js: Shared helpers for deadline computation and match scoring

import { CITY_COORDS } from './cityCoords.js';

// NEARBY STATES MAP
const NEARBY_STATES_MAP = {
  AL: ['FL','GA','MS','TN'], AK: [], AZ: ['CA','CO','NM','NV','UT'],
  AR: ['LA','MO','MS','OK','TN','TX'], CA: ['AZ','NV','OR'],
  CO: ['AZ','KS','NE','NM','OK','UT','WY'], CT: ['MA','NY','RI'],
  DE: ['MD','NJ','PA'], FL: ['AL','GA'], GA: ['AL','FL','NC','SC','TN'],
  HI: [], ID: ['MT','NV','OR','UT','WA','WY'], IL: ['IN','IA','KY','MO','WI'],
  IN: ['IL','KY','MI','OH'], IA: ['IL','MN','MO','NE','SD','WI'],
  KS: ['CO','MO','NE','OK'], KY: ['IL','IN','MO','OH','TN','VA','WV'],
  LA: ['AR','MS','TX'], ME: ['NH'], MD: ['DC','DE','PA','VA','WV'],
  MA: ['CT','NH','NY','RI','VT'], MI: ['IN','OH','WI'], MN: ['IA','ND','SD','WI'],
  MS: ['AL','AR','LA','TN'], MO: ['AR','IL','IA','KS','KY','NE','OK','TN'],
  MT: ['ID','ND','SD','WY'], NE: ['CO','IA','KS','MO','SD','WY'],
  NV: ['AZ','CA','ID','OR','UT'], NH: ['MA','ME','VT'], NJ: ['DE','NY','PA'],
  NM: ['AZ','CO','OK','TX'], NY: ['CT','MA','NJ','PA','VT'],
  NC: ['GA','SC','TN','VA'], ND: ['MN','MT','SD'], OH: ['IN','KY','MI','PA','WV'],
  OK: ['AR','CO','KS','MO','NM','TX'], OR: ['CA','ID','NV','WA'],
  PA: ['DE','MD','NJ','NY','OH','WV'], RI: ['CT','MA'], SC: ['GA','NC'],
  SD: ['IA','MN','MT','ND','NE','WY'], TN: ['AL','AR','GA','KY','MS','MO','NC','VA'],
  TX: ['AR','LA','NM','OK'], UT: ['AZ','CO','ID','NM','NV','WY'], VT: ['MA','NH','NY'],
  VA: ['DC','KY','MD','NC','TN','WV'], WA: ['ID','OR'],
  WV: ['KY','MD','OH','PA','VA'], WI: ['IL','IA','MI','MN'],
  WY: ['CO','ID','MT','NE','SD','UT'], DC: ['MD','VA'],
};

const ALL_STATE_ABBREVS = new Set(Object.keys(NEARBY_STATES_MAP));

// City-to-state lookup for common cities that appear without a state abbreviation suffix.
// Only unambiguous single-state cities are included.
const CITY_TO_STATE = {
  // A
  'albuquerque': 'NM', 'anaheim': 'CA', 'ann arbor': 'MI', 'atlanta': 'GA',
  'aurora': 'CO', 'austin': 'TX', 'ashburn': 'VA', 'amherst': 'MA',
  'ames': 'IA', 'arlington': 'VA',
  // B
  'baltimore': 'MD', 'berkeley': 'CA', 'bethesda': 'MD', 'birmingham': 'AL',
  'boise': 'ID', 'boston': 'MA', 'boulder': 'CO', 'bronx': 'NY',
  'brooklyn': 'NY', 'buffalo': 'NY', 'batavia': 'IL', 'bar harbor': 'ME',
  'baton rouge': 'LA', 'brookfield': 'IL',
  // C
  'cambridge': 'MA', 'charlotte': 'NC', 'chicago': 'IL', 'cincinnati': 'OH',
  'cleveland': 'OH', 'columbus': 'OH', 'cooperstown': 'NY',
  // D
  'dallas': 'TX', 'denver': 'CO', 'detroit': 'MI', 'duarte': 'CA',
  'dayton': 'OH', 'durham': 'NC',
  // E
  'eugene': 'OR', 'emeryville': 'CA', 'edmond': 'OK', 'evanston': 'IL',
  // F
  'fort worth': 'TX', 'fresno': 'CA', 'fairfax': 'VA', 'farmington': 'CT',
  // G
  'gainesville': 'FL', 'golden': 'CO', 'gaithersburg': 'MD',
  'gloucester': 'VA', 'greenbelt': 'MD', 'greensboro': 'NC',
  // H
  'hartford': 'CT', 'honolulu': 'HI', 'houston': 'TX', 'hampton': 'VA',
  'herndon': 'VA',
  // I
  'indianapolis': 'IN', 'irvine': 'CA', 'ithaca': 'NY',
  // J
  'jacksonville': 'FL', 'jersey city': 'NJ',
  // K
  'kansas city': 'MO', 'knoxville': 'TN',
  // L
  'langston': 'OK', 'las vegas': 'NV', 'lemont': 'IL', 'los angeles': 'CA',
  'louisville': 'KY', 'la jolla': 'CA', 'long beach': 'CA', 'laramie': 'WY',
  'laurel': 'MD', 'lebanon': 'NH', 'lincoln': 'NE', 'lubbock': 'TX',
  // M
  'manhattan': 'NY', 'mclean': 'VA', 'memphis': 'TN', 'miami': 'FL',
  'milwaukee': 'WI', 'minneapolis': 'MN', 'medford': 'MA', 'menlo park': 'CA',
  'meriden': 'CT', 'missoula': 'MT', 'montgomery': 'AL',
  // N
  'nashville': 'TN', 'new haven': 'CT', 'new orleans': 'LA',
  'new york city': 'NY', 'nyc': 'NY', 'newark': 'NJ', 'newport news': 'VA',
  'new britain': 'CT', 'northern virginia': 'VA', 'north virginia': 'VA',
  // O
  'oakland': 'CA', 'oklahoma city': 'OK', 'omaha': 'NE', 'orlando': 'FL',
  'oak ridge': 'TN',
  // P
  'palo alto': 'CA', 'philadelphia': 'PA', 'phoenix': 'AZ', 'pittsburgh': 'PA',
  'portland': 'OR', 'princeton': 'NJ', 'providence': 'RI', 'palisades': 'NY',
  'pacific palisades': 'CA',
  // Q
  'queens': 'NY',
  // R
  'raleigh': 'NC', 'richmond': 'VA', 'riverside': 'CA', 'rochester': 'NY',
  'reston': 'VA', 'rockville': 'MD', 'rohnert park': 'CA', 'richland': 'WA',
  // S
  'sacramento': 'CA', 'salt lake city': 'UT', 'san antonio': 'TX',
  'san diego': 'CA', 'san francisco': 'CA', 'san jose': 'CA',
  'santa barbara': 'CA', 'santa cruz': 'CA', 'santa monica': 'CA',
  'seattle': 'WA', 'st. louis': 'MO', 'st louis': 'MO', 'stamford': 'CT',
  'stony brook': 'NY', 'simi valley': 'CA', 'sioux falls': 'SD',
  'somerville': 'MA', 'sugar land': 'TX', 'stillwater': 'OK',
  // T
  'tampa': 'FL', 'tucson': 'AZ', 'tulsa': 'OK', 'tarrytown': 'NY',
  'tempe': 'AZ', 'thousand oaks': 'CA', 'toms river': 'NJ', 'trenton': 'NJ',
  // U
  'upton': 'NY',
  // V
  'ventura': 'CA',
  // W
  'washington': 'DC', 'washington dc': 'DC', 'worcester': 'MA',
  'white plains': 'NY', 'wheaton': 'IL', 'weston': 'FL',
  'winston-salem': 'NC', 'wilmington': 'DE', 'wachapreague': 'VA',
  // W continued
  'wallops island': 'VA',
};

// Checks character BEFORE and AFTER to avoid false matches (e.g. "IN" inside "Indiana")
// Escapes a string for safe use in a RegExp constructor.
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractStatesFromLocation(locationStr) {
  if (!locationStr) return [];
  const SEPARATORS = ' /;,()|\n\t.-–';
  const found = new Set();

  // Try city lookup FIRST for well-known city names (handles "Northern Virginia", etc.)
  const locLower = locationStr.toLowerCase();
  // Check multi-word city names first (longest match wins).
  // Use \b word boundaries so "ames" in "James" or "or" in "Portland" don't match.
  const sortedCities = Object.keys(CITY_TO_STATE).sort((a, b) => b.length - a.length);
  for (const city of sortedCities) {
    const cityRe = new RegExp('\\b' + escapeRegex(city) + '\\b');
    if (cityRe.test(locLower)) {
      found.add(CITY_TO_STATE[city]);
    }
  }

  // Then scan for uppercase state abbreviations in the raw string
  for (const abbr of ALL_STATE_ABBREVS) {
    let idx = locationStr.indexOf(abbr);
    while (idx !== -1) {
      const charBefore = idx === 0 ? ' ' : locationStr[idx - 1];
      const charAfter = locationStr[idx + abbr.length];
      const afterOk = charAfter === undefined || SEPARATORS.includes(charAfter);
      const beforeOk = SEPARATORS.includes(charBefore);
      if (beforeOk && afterOk) { found.add(abbr); break; }
      idx = locationStr.indexOf(abbr, idx + 1);
    }
  }

  return [...found];
}

const NATIONWIDE_LOCATION_KEYWORDS = [
  'nationwide','anywhere','all states','all u.s.','all 50 states',
  '100+ cities','~100 markets','across the u.s','your congressional district',
  'various','multiple','university and industry labs nationwide',
  'nasa centers nationwide',
];

// Remote detection: checks the boolean remote field first (most reliable),
// then looks for explicit remote keywords in the location string.
function isItemRemote(item) {
  // Primary: explicit Supabase boolean, always authoritative
  if (item.remote === true) return true;
  // Secondary: location string contains a remote keyword
  const loc = (item.location || item.locationFormat || '').toLowerCase();
  if (!loc) return false;
  const REMOTE_KEYWORDS = ['remote','virtual','online'];
  return REMOTE_KEYWORDS.some((kw) => loc.startsWith(kw));
}

function isItemNationwide(item) {
  if (isItemRemote(item)) return false;
  const loc = (item.location || item.locationFormat || '').toLowerCase();
  return NATIONWIDE_LOCATION_KEYWORDS.some((kw) => loc.includes(kw));
}

export function isNationwideOrRemote(item) {
  return isItemRemote(item) || isItemNationwide(item);
}

// isLocationEligible: used by the remoteOnly filter only.
// When a user has set remoteOnly=true, only remote/nationwide items are shown.
// For all other users, this returns true; scoring handles the ranking.
// Previously this hard-filtered out-of-state in-person items, which caused remote
// items to dominate because they were never filtered. Now scoring does the work.
export function isLocationEligible(item, user) {
  // remoteOnly users: only allow remote or nationwide items
  if (user && user.remoteOnly) {
    return isNationwideOrRemote(item);
  }
  // For all other users, everything is eligible; scoring sorts it out
  return true;
}

// ─── USER STATE EXTRACTION ────────────────────────────────────────────────────

function getUserState(user) {
  if (!user) return '';
  const explicit = (user.state || '').toUpperCase().trim();
  if (explicit && ALL_STATE_ABBREVS.has(explicit)) return explicit;
  // Try to parse from user.location string e.g. "Richmond, VA" or "Seattle WA"
  if (user.location) {
    const commaIdx = user.location.indexOf(',');
    if (commaIdx !== -1) {
      const afterComma = user.location.slice(commaIdx + 1).trim().toUpperCase();
      const tok = afterComma.split(/\s+/)[0] || '';
      if (ALL_STATE_ABBREVS.has(tok)) return tok;
    } else {
      const tokens = user.location.trim().split(/\s+/);
      const last = (tokens[tokens.length - 1] || '').toUpperCase();
      if (tokens.length >= 2 && ALL_STATE_ABBREVS.has(last)) return last;
    }
  }
  return '';
}

function getUserCity(user) {
  if (!user || !user.location) return '';
  const commaIdx = user.location.indexOf(',');
  if (commaIdx !== -1) {
    return user.location.slice(0, commaIdx).trim().toLowerCase();
  }
  const tokens = user.location.trim().split(/\s+/);
  const last = (tokens[tokens.length - 1] || '').toUpperCase();
  if (tokens.length >= 2 && ALL_STATE_ABBREVS.has(last)) {
    return tokens.slice(0, -1).join(' ').toLowerCase();
  }
  return user.location.trim().toLowerCase();
}

// DEADLINE HELPERS
export function computeDaysLeft(deadlineDateStr) {
  if (!deadlineDateStr) return null;
  try {
    const parts = String(deadlineDateStr).split('-');
    if (parts.length !== 3) return null;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
    const deadlineLocal = new Date(y, m, d);
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    const diffDays = Math.round((deadlineLocal - todayLocal) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : null;
  } catch { return null; }
}

export function getEffectiveDaysLeft(item) {
  if (item.deadlineDate) {
    const computed = computeDaysLeft(item.deadlineDate);
    if (computed !== null) return computed;
  }
  if (typeof item.daysLeft === 'number') return item.daysLeft;
  return null;
}

// Returns true if the item has a fixed deadline that is already in the past.
// computeDaysLeft returns null for past dates, which made expired programs
// visually identical to rolling ones; this makes "closed" an explicit state.
export function isItemExpired(item) {
  if (!item || !item.deadlineDate) return false;
  try {
    const parts = String(item.deadlineDate).split('-');
    if (parts.length !== 3) return false;
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    if (isNaN(y) || isNaN(m) || isNaN(d)) return false;
    const deadlineLocal = new Date(y, m, d);
    const todayLocal = new Date();
    todayLocal.setHours(0, 0, 0, 0);
    return deadlineLocal < todayLocal;
  } catch {
    return false;
  }
}

// INTEREST FIELD MAP
export const INTEREST_FIELD_MAP = {
  'Computer Science': 'Computer Science', 'Medicine': 'Medicine', 'Business': 'Business',
  'Aerospace': 'Aerospace', 'Engineering': 'Engineering', 'Art': 'Art', 'Art & Design': 'Art',
  'Arts': 'Arts',
  'Law': 'Law/Advocacy', 'Law & Policy': 'Law/Advocacy', 'Law/Advocacy': 'Law/Advocacy',
  'Environment': 'Environment', 'Education': 'Education',
  'Finance': 'Finance', 'Journalism': 'Journalism', 'Science': 'Science',
  'History': 'History',
  'Astronomy': 'Astronomy',
  'Social Science': 'Social Science', 'Social Sciences': 'Social Science',
  'STEM': null, 'Writing': 'Journalism', 'Museum': null,
};

const ADJACENCY_GROUPS = [
  new Set(['Computer Science','Engineering','Aerospace','Science','Astronomy']),
  new Set(['Medicine','Science','Environment']),
  new Set(['Business','Finance']),
  new Set(['Arts','Journalism','Education']),
  new Set(['Law/Advocacy','Education','Business']),
  new Set(['Aerospace','Engineering','Computer Science']),
  new Set(['History','Social Science','Law/Advocacy']),
];

function normaliseInterest(raw) {
  if (!raw) return null;
  if (raw in INTEREST_FIELD_MAP) return INTEREST_FIELD_MAP[raw];
  const lower = raw.toLowerCase();
  for (const [key, val] of Object.entries(INTEREST_FIELD_MAP)) {
    if (key.toLowerCase() === lower) return val;
  }
  return null;
}

// GRADE HELPERS
// gradesShort is the short formatted field ("Grades 9–12", "9–12", "Ages 14–18", etc.)
// grades (lowercase) is the verbose requirements text, not used for scoring
export function gradeToNumber(gradeStr) {
  if (!gradeStr) return null;
  const m = gradeStr.match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
}

// Extracts a { min, max } grade range from the short grades field, tolerant
// of the plain numeric formats now used in Supabase ("9-12", "10", "9") as
// well as the older verbose formats ("Grades 9-12", "11th-12th", "Grade 12+").
// Only digits 1-12 count as grade numbers, so age ranges that sometimes leak
// into this field ("Ages 14-18") are correctly ignored rather than
// misread as a grade restriction.
function parseGradeRange(gradesShort) {
  if (!gradesShort) return null;
  const lower = gradesShort.toLowerCase();
  if (/all\s+grades|not\s+specified|n\/a/.test(lower)) return null;
  const nums = (lower.match(/\d+/g) || [])
    .map((n) => parseInt(n, 10))
    .filter((n) => n >= 1 && n <= 12);
  if (nums.length === 0) return null;
  if (nums.length === 1) {
    if (lower.includes('+')) return { min: nums[0], max: 12 }; // "10+", "Grade 10+"
    if (/senior/.test(lower) && nums[0] !== 12) return { min: 12, max: 12 };
    return { min: nums[0], max: nums[0] }; // exact single-grade requirement, e.g. "10"
  }
  return { min: nums[0], max: nums[nums.length - 1] };
}

export function gradeNumIsEligible(gradeNum, gradesShort) {
  if (!gradeNum) return true;
  const range = parseGradeRange(gradesShort);
  if (!range) return true;
  return gradeNum >= range.min && gradeNum <= range.max;
}

export function gradeIsEligible(gradeStr, gradesShort) {
  if (!gradeStr) return true;
  return gradeNumIsEligible(gradeToNumber(gradeStr), gradesShort);
}

// ─── AGE ELIGIBILITY ─────────────────────────────────────────────────────────
//
// Grade and age are different axes: a program can be "Grades 9-12" AND "16+".
// item.minAge / item.maxAge come from the structured min_age/max_age Supabase
// columns (populated by the verification workflow); null = no age requirement.
//
// If the user gave their age, an out-of-range program is a hard mismatch.
// If they didn't, we fall back to the typical age band for their grade: a
// 9th grader is almost never 16, so a 16+ program is flagged "likely too
// young" (scored down, not zeroed, since some students are old for their grade).

const GRADE_TYPICAL_AGE = { 9: [13, 15], 10: [14, 16], 11: [15, 17], 12: [16, 19] };

// Returns 'eligible' | 'ineligible' | 'likely_too_young' | 'unknown'
export function ageFitLevel(item, user) {
  const minAge = item && item.minAge;
  const maxAge = item && item.maxAge;
  if (!minAge && !maxAge) return 'eligible';
  // Prefer the birthday (computed to an exact current age); fall back to a
  // directly-stored age for older profiles that predate the birthday field.
  const age = (user && (ageFromBirthday(user.birthday) || Number(user.age))) || null;
  if (age && age >= 10 && age <= 25) {
    if (minAge && age < minAge) return 'ineligible';
    if (maxAge && age > maxAge) return 'ineligible';
    return 'eligible';
  }
  // No age on profile: infer a typical band from grade
  const gradeNum = user && user.grade ? gradeToNumber(user.grade) : null;
  const band = gradeNum ? GRADE_TYPICAL_AGE[gradeNum] : null;
  if (!band) return 'unknown';
  if (minAge && band[1] < minAge) return 'likely_too_young';
  return 'eligible';
}

function gradeNumFitLevel(gradeNum, gradesShort) {
  if (!gradeNum) return 'unknown';
  const range = parseGradeRange(gradesShort);
  if (!range) return 'unknown';
  if (gradeNum < range.min || gradeNum > range.max) return 'ineligible';
  return (range.max - range.min) <= 2 ? 'exact' : 'eligible';
}

// ─── PAY DETECTION ────────────────────────────────────────────────────────────
const _NEG_PATTERN = /\b(no|not|non|without|un-?paid|volunteer)\b\s*[-–]?\s*$/i;

function _textHasPositiveSignal(text, keyword) {
  let idx = text.indexOf(keyword);
  while (idx !== -1) {
    const before = text.slice(Math.max(0, idx - 30), idx);
    if (!_NEG_PATTERN.test(before)) return true;
    idx = text.indexOf(keyword, idx + keyword.length);
  }
  return false;
}

export function detectPayType(item) {
  if (item.payType) {
    const pt = item.payType.toLowerCase().trim();
    if (pt === 'stipend') return { isStipend: true,  isPaid: false, isUnpaid: false };
    if (pt === 'paid')    return { isStipend: false,  isPaid: true,  isUnpaid: false };
    if (pt === 'unpaid')  return { isStipend: false,  isPaid: false, isUnpaid: true  };
  }
  const tagsLower = (item.tags || []).map((t) => t.toLowerCase());
  const tagStipend = tagsLower.includes('stipend') || tagsLower.some((t) => t.includes('stipend'));
  const tagPaid    = tagsLower.includes('paid');
  if (tagStipend) return { isStipend: true,  isPaid: false, isUnpaid: false };
  if (tagPaid)    return { isStipend: false,  isPaid: true,  isUnpaid: false };
  const body = [item.overview || '', item.requirements || ''].join(' ').toLowerCase();
  const isStipend = _textHasPositiveSignal(body, 'stipend');
  if (isStipend) return { isStipend: true, isPaid: false, isUnpaid: false };
  // 'paid internship/position/program' means the program pays the student: that's a stipend, not a fee.
  const bodyPaysStudent =
    _textHasPositiveSignal(body, 'paid internship') ||
    _textHasPositiveSignal(body, 'paid opportunity') ||
    _textHasPositiveSignal(body, 'paid experience') ||
    _textHasPositiveSignal(body, 'paid position') ||
    _textHasPositiveSignal(body, 'paid program');
  if (bodyPaysStudent) return { isStipend: true, isPaid: false, isUnpaid: false };
  return { isStipend: false, isPaid: false, isUnpaid: true };
}

// ─── RESIDENCY / SCHOOL-LOCATION REQUIREMENT DETECTION ───────────────────────
//
// Uses the structured `Required_State` Supabase column (e.g. "CA", "CA/NV/AZ",
// "San Francisco, CA") rather than scanning the free-text requirements
// paragraph, because the old free-text regex scan flagged far too many programs as
// residency-restricted (any mention of "resident", "lives in", a state name,
// etc. anywhere in the text), which zeroed out scores for programs that
// weren't actually geographically restricted. The structured column is
// populated by hand only for programs that truly have a hard location
// requirement, so it's the reliable source of truth for the eligibility gate.
//
// Returns an array of required state abbreviations, or [] if none / national.

function detectResidencyRequirement(item) {
  const raw = item.requiredState || '';
  if (!raw) return [];
  return extractStatesFromLocation(raw);
}

// ─── STRUCTURED LOCATION ELIGIBILITY ─────────────────────────────────────────
//
// item.locationEligibility (Supabase location_eligibility jsonb) is an array of
// places a student may live/attend school in to be eligible; matching ANY entry
// qualifies. Entry shape: { type: 'state'|'city'|'county'|'zip'|'district'|
// 'region', value, state } where `state` is the 2-letter context for non-state
// types. It supersedes the free-text Required_State column; when absent we fall
// back to state-level parsing of Required_State (the pre-existing behavior).
//
// Each entry evaluates to:
//   'match':   the user provably satisfies it
//   'fail':    the user provably does NOT satisfy it
//   'unknown': can't tell from the profile (e.g. a county/zip restriction
//               inside the user's own state; we don't collect county/zip)
// Aggregate: any match → eligible; no match but any unknown → unknown (no hard
// gate: never zero out a program we can't disprove); all fail → ineligible.

function normalizeName(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
}

function getLocationEligibilityEntries(item) {
  if (Array.isArray(item.locationEligibility) && item.locationEligibility.length > 0) {
    return item.locationEligibility.filter((e) => e && e.type && e.value);
  }
  // Legacy fallback: Required_State free text → state-level entries
  return detectResidencyRequirement(item).map((st) => ({ type: 'state', value: st }));
}

function describeLocationEntry(entry) {
  if (entry.type === 'state') return entry.value;
  if (entry.type === 'zip') return `ZIP ${entry.value}${entry.state ? `, ${entry.state}` : ''}`;
  return `${entry.value}${entry.state ? `, ${entry.state}` : ''}`;
}

// ─── RADIUS-BASED "WITHIN N MILES OF X" REGION ENTRIES ───────────────────────
//
// A handful of programs' location_eligibility 'region' entries state an
// explicit radius (e.g. "within 50 mi of Austin", "within 50 mi of NASA
// Goddard Space Flight Center, Greenbelt"). Most 'region' entries are vague
// ("Chicagoland", "Denver metro") and stay 'unknown' as before — only entries
// matching this specific phrasing get a distance-based verdict; everything
// else keeps the pre-existing conservative behavior.
//
// CITY_COORDS is a bundled ~30k-city lookup (see utils/cityCoords.js), so
// this never makes a network call.

function haversineMiles(lat1, lng1, lat2, lng2) {
  const R = 3958.8; // Earth radius in miles
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Looks up a normalized city name's coordinates. With a state, only that
// state's entry counts (avoids matching a same-named city elsewhere). Without
// a state, only a name that's unique across the whole country is trusted.
function lookupCityCoords(cityNorm, state) {
  if (!cityNorm) return null;
  if (state) return CITY_COORDS[`${state.toUpperCase()}|${cityNorm}`] || null;
  const suffix = `|${cityNorm}`;
  let found = null;
  for (const key in CITY_COORDS) {
    if (key.endsWith(suffix)) {
      if (found) return null; // ambiguous across states
      found = CITY_COORDS[key];
    }
  }
  return found;
}

const MILE_RADIUS_RE = /within\s+(\d+)\s*(?:-)?\s*(?:driving\s+)?(?:mi|mile|miles)\b\s*(?:of|from)\s+(.+)$/i;

// Parses "within N mi(les) of <place>" and resolves <place> to coordinates,
// trying each comma-separated segment (facility names like "NASA Goddard
// Space Flight Center, Greenbelt" resolve via their trailing city segment).
// Returns { radiusMiles, coords } or null if unparseable/unresolvable.
function resolveAnchorRadius(value, state) {
  const m = MILE_RADIUS_RE.exec(String(value || ''));
  if (!m) return null;
  const radiusMiles = parseInt(m[1], 10);
  const segments = m[2].replace(/\([^)]*\)/g, '').split(',').map(normalizeName).filter(Boolean);
  for (const seg of segments) {
    const coords = lookupCityCoords(seg, state);
    if (coords) return { radiusMiles, coords };
  }
  return null;
}

// Resolves the user's own coordinates from their home city/state or their
// school's city/state, whichever is known.
function resolveUserCoords(cityStatePairs) {
  for (const { city, state } of cityStatePairs || []) {
    const coords = lookupCityCoords(city, state);
    if (coords) return coords;
  }
  return null;
}

function evaluateLocationEntry(entry, ctx) {
  const { knownStates, cities, district, commuteTo, cityStatePairs } = ctx;
  const entryStates = entry.type === 'state'
    ? extractStatesFromLocation(String(entry.value).toUpperCase())
    : (entry.state ? [String(entry.state).toUpperCase()] : []);

  // State context check first: provably in a different state → fail fast
  const stateKnown = knownStates.length > 0;
  const stateMatches = entryStates.length === 0
    ? null // entry has no state context, so can't use states to decide
    : knownStates.some((s) => entryStates.includes(s));

  if (entry.type === 'state') {
    if (!stateKnown) return 'unknown';
    return stateMatches ? 'match' : 'fail';
  }
  if (stateKnown && stateMatches === false) return 'fail';

  if (entry.type === 'city') {
    const target = normalizeName(entry.value);
    if (cities.length === 0) return 'unknown';
    const cityHit = cities.some((c) => c && (c === target || target.includes(c) || c.includes(target)));
    if (cityHit) return stateMatches === false ? 'fail' : 'match';
    // City known and different from the listed site. For programs students
    // physically commute to (commuteTo), the listed city is a program site,
    // not a residency requirement. Someone elsewhere in the same state may
    // well be within commuting distance, so we can't prove ineligibility.
    // Only a cross-state mismatch is a provable fail in that case.
    if (commuteTo && stateKnown && stateMatches) return 'unknown';
    return 'fail'; // city known and provably different
  }
  if (entry.type === 'district') {
    if (!district) return 'unknown';
    const target = normalizeName(entry.value)
      .replace(/\b(public schools?|school district|schools?|district)\b/g, '').trim();
    const own = district.replace(/\b(public schools?|school district|schools?|district)\b/g, '').trim();
    if (target && own && (own.includes(target) || target.includes(own))) return 'match';
    return 'fail';
  }
  if (entry.type === 'region') {
    const anchor = resolveAnchorRadius(entry.value, entry.state);
    if (anchor) {
      const userCoords = resolveUserCoords(cityStatePairs);
      if (userCoords) {
        const distanceMiles = haversineMiles(userCoords[0], userCoords[1], anchor.coords[0], anchor.coords[1]);
        if (distanceMiles <= anchor.radiusMiles) return 'match';
        // Margin above the stated radius: city centroids are approximate, so
        // only a clear miss counts as a provable fail (same "never zero out
        // a program we can't disprove" philosophy as the rest of this file).
        if (distanceMiles > anchor.radiusMiles * 1.3) return 'fail';
      }
    }
  }
  // county / zip / unresolvable region: we don't collect these, so the state
  // pre-check above is the only thing we can prove either way.
  return 'unknown';
}

// Returns { status: 'eligible'|'unknown'|'ineligible', entries, requiredStates, label }
export function getLocationEligibility(item, user) {
  const entries = getLocationEligibilityEntries(item);
  const requiredStates = [...new Set(entries.flatMap((e) =>
    e.type === 'state' ? extractStatesFromLocation(String(e.value).toUpperCase())
      : (e.state ? [String(e.state).toUpperCase()] : [])
  ))];
  if (entries.length === 0) return { status: 'eligible', entries, requiredStates, label: '' };

  const homeState = getUserState(user);
  const schoolState = ((user && user.school && user.school.state) || '').toUpperCase();
  const knownStates = [...new Set([homeState, schoolState].filter(Boolean))];
  const cities = [
    getUserCity(user),
    normalizeName(user && user.school && user.school.city),
  ].map(normalizeName).filter(Boolean);
  const cityStatePairs = [
    { city: normalizeName(getUserCity(user)), state: homeState },
    { city: normalizeName(user && user.school && user.school.city), state: schoolState },
  ].filter((p) => p.city && p.state);
  const district = normalizeName(user && user.school && user.school.district);
  const commuteTo = !!(item && item.commuteTo);

  const results = entries.map((e) => evaluateLocationEntry(e, { knownStates, cities, district, commuteTo, cityStatePairs }));
  const label = entries.map(describeLocationEntry).join('; ');
  if (results.includes('match')) return { status: 'eligible', entries, requiredStates, label };
  if (results.includes('unknown')) return { status: 'unknown', entries, requiredStates, label };
  return { status: 'ineligible', entries, requiredStates, label };
}

// ─── GENDER ELIGIBILITY REQUIREMENT DETECTION ────────────────────────────────
//
// Some programs are explicitly restricted to a gender (e.g. "for young women
// in STEM", "identify as male"). Mirrors detectResidencyRequirement: scans
// line-by-line so a negation elsewhere in the text doesn't null out a real
// restriction, and a mixed-gender mention ("for women and men") isn't treated
// as restrictive. Returns an array of required gender codes ('female' |
// 'male' | 'nonbinary'), or [] if none / open to everyone.

const GENDER_LABELS = { female: 'female', male: 'male', nonbinary: 'non-binary' };

const GENDER_GLOBAL_NEGATIONS = [
  /open\s+to\s+(all|any)\s+genders?/,
  /regardless\s+of\s+gender/,
  /no\s+gender\s+(requirement|restriction)/,
  /all\s+gender\s+identities\s+(are\s+)?welcome/,
];

const GENDER_TRIGGERS = [
  { re: /\b(female|women|girls)[- ]only\b/, cat: 'female' },
  { re: /\bidentify(?:ing)?\s+as\s+(a\s+)?(female|woman|girl)\b/, cat: 'female' },
  { re: /\bfor\s+(young\s+)?(women|girls)\s+(in|interested)\b/, cat: 'female' },
  { re: /\b(male|men|boys)[- ]only\b/, cat: 'male' },
  { re: /\bidentify(?:ing)?\s+as\s+(a\s+)?(male|man|boy)\b/, cat: 'male' },
  { re: /\bfor\s+(young\s+)?(men|boys)\s+(in|interested)\b/, cat: 'male' },
  { re: /\bnon-?binary\s+(students|applicants|youth)\b/, cat: 'nonbinary' },
  { re: /\bidentify(?:ing)?\s+as\s+non-?binary\b/, cat: 'nonbinary' },
];

// A line mentioning both sides ("girls and boys", "men or women") is
// explicitly inclusive, not restrictive; skip it.
const GENDER_MIXED_MENTION = /\b(women|female|girls?)\b.{0,25}\b(and|or)\b.{0,10}\b(men|male|boys?)\b|\b(men|male|boys?)\b.{0,25}\b(and|or)\b.{0,10}\b(women|female|girls?)\b/;

function detectGenderRequirement(item) {
  // Primary: structured required_gender Supabase column (verification-populated).
  // Only ever set when a program explicitly restricts to one gender.
  if (item.requiredGender && GENDER_LABELS[item.requiredGender]) {
    return [item.requiredGender];
  }
  // Fallback: scan the free-text requirements (legacy rows not yet reverified)
  const text = (item.requirements || '').toLowerCase();
  if (!text) return [];
  if (GENDER_GLOBAL_NEGATIONS.some((pat) => pat.test(text))) return [];

  const lines = text.split(/[\n•]/);
  const required = new Set();
  for (const line of lines) {
    if (GENDER_GLOBAL_NEGATIONS.some((pat) => pat.test(line))) continue;
    if (GENDER_MIXED_MENTION.test(line)) continue;
    for (const { re, cat } of GENDER_TRIGGERS) {
      if (re.test(line)) required.add(cat);
    }
  }
  return [...required];
}

// ─── RACE / ETHNICITY ELIGIBILITY REQUIREMENT DETECTION ──────────────────────
//
// Uses the structured `Required_Race` Supabase column rather than scanning
// the free-text requirements paragraph, for the same reason as residency
// above: the column is populated by hand only for programs with a genuine
// race/ethnicity restriction, so it doesn't false-positive on programs that
// merely mention diversity in passing. Returns an array of required race
// codes, or [].

const RACE_LABELS = {
  black: 'Black or African American',
  hispanic: 'Hispanic or Latino',
  native_american: 'American Indian or Alaska Native',
  asian: 'Asian',
  pacific_islander: 'Native Hawaiian or Pacific Islander',
};

// "Underrepresented minorities" / "students of color" is the standard umbrella
// term for Black, Hispanic/Latino, Native American, and Pacific Islander
// students, so expand it to those four categories rather than gating on an
// unmatchable generic label.
const URM_TRIGGER = /\bunderrepresented\s+(minorit(?:y|ies)|students|groups)\b|\bstudents?\s+of\s+color\b/;
const URM_CATEGORIES = ['black', 'hispanic', 'native_american', 'pacific_islander'];

const RACE_CATEGORY_TRIGGERS = [
  { re: /\bblack\b|\bafrican[- ]american\b/, cat: 'black' },
  { re: /\bhispanic\b|\blatino\b|\blatina\b|\blatinx\b/, cat: 'hispanic' },
  { re: /\bnative\s+american\b|\bamerican\s+indian\b|\balaska\s+native\b/, cat: 'native_american' },
  { re: /\basian[- ]american\b/, cat: 'asian' },
  { re: /\bnative\s+hawaiian\b|\bpacific\s+islander\b/, cat: 'pacific_islander' },
];

function detectRaceRequirement(item) {
  const text = (item.requiredRace || '').toLowerCase();
  if (!text) return [];
  const required = new Set();
  if (URM_TRIGGER.test(text)) URM_CATEGORIES.forEach((c) => required.add(c));
  for (const { re, cat } of RACE_CATEGORY_TRIGGERS) {
    if (re.test(text)) required.add(cat);
  }
  return [...required];
}

// ─── ELIGIBILITY STATUS ───────────────────────────────────────────────────────
//
// Combines residency/school-location, gender, and race/ethnicity detection
// with the user's profile into a single verdict the UI can show. A user
// counts as meeting a location requirement if EITHER their home state OR
// their school's state matches (someone living in NJ but attending a NYC
// school meets a "NYC high school students" requirement).
//
// Returns:
//   { eligible: true,  requiredStates, requiredGenders, requiredRaces, reason: '' }
//     no restriction, or restriction met
//   { eligible: true,  ..., unknown: true, reason: '' }
//     restriction exists but the relevant profile field isn't set
//   { eligible: false, ..., reason: '<explanation>' }
//     hard mismatch → 0%

export function getEligibilityStatus(item, user) {
  const empty = { eligible: true, requiredStates: [], requiredGenders: [], requiredRaces: [], reason: '' };
  if (!item || !user) return empty;

  const locElig         = getLocationEligibility(item, user);
  const requiredStates  = locElig.requiredStates;
  const requiredGenders = detectGenderRequirement(item);
  const requiredRaces   = detectRaceRequirement(item);
  let unknown = false;

  // ── Grade ─────────────────────────────────────────────────────────────────
  // Grades are now stored as clean numbers/ranges in Supabase (e.g. "9-12",
  // "10"), so a grade outside the program's range is a hard mismatch. A
  // grade-10 student should see "not eligible" on a program open only to
  // grades 11-12, the same way an out-of-state student sees it for residency.
  if (user.grade) {
    const gradeNum = gradeToNumber(user.grade);
    const gradesForScoring = item.gradesShort || item.grades || '';
    if (gradeNum && gradesForScoring && !gradeNumIsEligible(gradeNum, gradesForScoring)) {
      return {
        eligible: false, requiredStates, requiredGenders, requiredRaces, failedOn: 'grade',
        reason: `This program is only open to ${gradesForScoring}. Your profile says you're in grade ${gradeNum}, so you don't meet its grade requirement.`,
      };
    }
  }

  // ── Age ───────────────────────────────────────────────────────────────────
  // Distinct from grade: "Grades 9-12 but must be 16+" is a real pattern.
  // Hard gate only when the user's actual age provably misses the range;
  // "likely too young" (inferred from grade) is a scoring penalty instead.
  const ageFit = ageFitLevel(item, user);
  if (ageFit === 'ineligible') {
    const range = item.maxAge
      ? (item.minAge ? `${item.minAge}–${item.maxAge}` : `${item.maxAge} or younger`)
      : `${item.minAge}+`;
    const effectiveAge = ageFromBirthday(user.birthday) || user.age;
    return {
      eligible: false, requiredStates, requiredGenders, requiredRaces, failedOn: 'age',
      reason: `This program requires participants to be ${range} years old. Your profile says you're ${effectiveAge}, so you don't meet its age requirement.`,
    };
  }
  if (ageFit === 'unknown' && (item.minAge || item.maxAge)) unknown = true;

  // ── Gender / Race: checked before location ─────────────────────────────
  // These come from structured, hand-verified columns (Required_Race,
  // required_gender) and are immutable identity requirements: no location fix
  // ever satisfies them. Location matching, by contrast, is inferred from
  // free-text/city parsing and can't always be proven true or false. Checking
  // identity restrictions first means a Black-only program correctly tells a
  // non-Black student "race" is why they're blocked, instead of surfacing a
  // location mismatch that (even if resolved) wouldn't actually make them
  // eligible.
  if (requiredGenders.length > 0) {
    const userGender = (user.gender || '').toLowerCase();
    if (!userGender || userGender === 'prefer_not_to_say') {
      unknown = true;
    } else if (!requiredGenders.includes(userGender)) {
      const where = requiredGenders.map((g) => GENDER_LABELS[g] || g).join(' or ');
      return {
        eligible: false, requiredStates, requiredGenders, requiredRaces, failedOn: 'gender',
        reason: `This program is only open to students who identify as ${where}, based on your profile.`,
      };
    }
  }

  if (requiredRaces.length > 0) {
    const userRaces = Array.isArray(user.race) ? user.race.map((r) => (r || '').toLowerCase()) : [];
    const hasKnownRace = userRaces.length > 0 && !userRaces.includes('prefer_not_to_say');
    if (!hasKnownRace) {
      unknown = true;
    } else if (!userRaces.some((r) => requiredRaces.includes(r))) {
      const where = requiredRaces.map((r) => RACE_LABELS[r] || r).join(', ');
      return {
        eligible: false, requiredStates, requiredGenders, requiredRaces, failedOn: 'race',
        reason: `This program is only open to students who identify as ${where}, based on your profile.`,
      };
    }
  }

  // ── Location ──────────────────────────────────────────────────────────────
  // Structured location_eligibility (states, cities, counties, ZIPs, school
  // districts, regions) with Required_State free text as legacy fallback.
  if (locElig.status === 'ineligible') {
    const homeState   = getUserState(user);
    const schoolState = ((user.school && user.school.state) || '').toUpperCase();
    return {
      eligible: false, requiredStates, requiredGenders, requiredRaces, failedOn: 'location',
      reason:
        `This program is only open to students located in ${locElig.label || requiredStates.join(', ')}. ` +
        `Your profile says you're in ${getUserCity(user) || homeState || schoolState || 'a different area'}, so you don't meet its location requirement.`,
    };
  }
  if (locElig.status === 'unknown') unknown = true;

  if (unknown) {
    return { eligible: true, unknown: true, requiredStates, requiredGenders, requiredRaces, reason: '' };
  }
  return { eligible: true, requiredStates, requiredGenders, requiredRaces, reason: '' };
}

// ─── SCHOOL / DISTRICT MATCH ─────────────────────────────────────────────────
//
// True when the program's requirements text explicitly names the user's school
// or district (e.g. "open to Fairfax County Public Schools students"). Used as
// a recommendation boost: these programs are a near-guaranteed eligibility fit.

export function schoolMatchesRequirement(item, user) {
  const school = user && user.school;
  if (!school) return false;
  const text = (item && item.requirements || '').toLowerCase();
  if (!text) return false;

  const name = (school.name || '').toLowerCase().trim();
  if (name.length > 6 && text.includes(name)) return true;

  // District names in NCES read like "Fairfax County Public Schools" /
  // "Richmond City Public Schools". Requirements often shorten them, so
  // strip the generic suffix before matching.
  const district = (school.district || '')
    .toLowerCase()
    .replace(/\b(public schools?|school district|schools?|district)\b/g, '')
    .trim();
  if (district.length > 3 && text.includes(district)) return true;

  return false;
}

// ─── MATCH SCORE ──────────────────────────────────────────────────────────────
//
// Weighted, normalized scoring. Category base maxes sum to exactly 100 at
// default priorities:
//   Interests             0–40   (weighted by priorities.interests)
//   Grade & age fit       2–12   (unweighted; eligibility axis, not taste)
//   Location & logistics  0–24   (weighted by priorities.location; covers
//                                 proximity, remote/in-person, commute
//                                 feasibility, and housing/dorm availability)
//   Compensation          0–8    (weighted by priorities.compensation:
//                                 stipend > unpaid > program fee)
//   Profile fit           8–10   (weighted by priorities.competitiveness)
//   Featured bonus        0–3    (unweighted)
//   School match          0–3    (unweighted)
//
// user.priorities = { interests, location, compensation, competitiveness },
// each rated 1–5 (3 = neutral default), set during onboarding. A priority
// scales BOTH the points and the max of its category (×0.35 / ×0.65 / ×1 /
// ×1.4 / ×1.8 for 1–5) and the total is normalized back to 0–100; scores stay
// comparable across users while the ordering reflects each user's stated
// priorities. Users without priorities get the default weights, which
// reproduce the classic balance.
//
// user.formatPreference = '' | 'remote' | 'inperson': a soft nudge (NOT the
// remoteOnly hard filter): it moves the Location score toward the format the
// student prefers without ever hiding the other format.
//
// Hard eligibility gates (score 0, with an explanation the UI can show):
//   grade outside the program's range, actual age outside min_age/max_age,
//   provable location-eligibility mismatch (state/city/district…), gender or
//   race restriction the profile doesn't satisfy. Unprovable restrictions
//   (e.g. a county requirement inside the user's state) never zero a score.
//
// Age soft-penalty: when the program has min_age but the user gave no age,
// the typical age band for their grade is used, so a 9th grader on a 16+
// program scores near-zero on Grade & age instead of being hard-gated.
//
// Location & logistics ladder (in-person items, user located, default weight):
//   City + state match                24
//   Same state                        21
//   City match only                   13
//   Housing provided + user open      14   ← far-away residential programs
//   Nearby state                       8      become viable when dorms exist
//   Housing provided, pref unset       8
//   No location info                   7
//   Nearby state (hybrid)              6
//   Far, willing to travel             5
//   Hybrid outside area                4
//   Far, commute required              3   (1 if user is local-only)
//   Housing provided but user said no  3
// Remote item for a located user: 15, since many students prefer remote.
// Nationwide: 4 (6 for local-only users).
// User with no location: in-person 11, hybrid 10, remote/nationwide 8.
// remoteOnly user: remote 24, hybrid 8, in-person 0.

// Priority is now a 1–5 scale (was 1/2/3). 3 is neutral (×1) so a user who
// leaves everything at the default "3" gets exactly the classic balance: the
// base category maxes still sum to 100. 1–2 progressively de-weight a category,
// 4–5 progressively boost it. The multiplier scales BOTH the points a category
// earns and its max, and the total is renormalized to 0–100, so the ordering
// reflects the user's stated priorities while scores stay comparable.
const PRIORITY_MULT = { 1: 0.35, 2: 0.65, 3: 1, 4: 1.4, 5: 1.8 };

function priorityMult(user, key) {
  const p = user && user.priorities && user.priorities[key];
  return PRIORITY_MULT[p] || 1;
}

// Derive age in whole years from an ISO birthday string ("YYYY-MM-DD"), or null.
// Onboarding now collects a birthday (via the calendar date picker) instead of
// asking for an age directly; age is computed from it wherever matching needs it.
export function ageFromBirthday(birthday) {
  if (!birthday) return null;
  const parts = String(birthday).split('-');
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const mo = parseInt(parts[1], 10);
  const d = parseInt(parts[2], 10);
  if (!y || !mo || !d) return null;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = (today.getMonth() + 1) - mo;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) age -= 1;
  return age >= 0 && age <= 120 ? age : null;
}

export function computeMatchScore(item, user) {
  const breakdown = computeMatchBreakdown(item, user);
  return breakdown ? breakdown.total : null;
}

// Same scoring logic as computeMatchScore, but returns the per-category
// point breakdown so the UI can explain *why* a program got its score.
// Kept as the single source of truth; computeMatchScore just sums it.
export function computeMatchBreakdown(item, user) {
  if (!item || !user) return null;
  const hasAnyPersonalization =
    (Array.isArray(user.interests) && user.interests.length > 0) ||
    user.grade || user.age || user.birthday || user.location || user.state || user.school || user.remoteOnly ||
    user.gpaRange || (Array.isArray(user.readiness) && user.readiness.length > 0) ||
    user.travelWillingness || user.formatPreference ||
    (user.priorities && Object.keys(user.priorities).length > 0);
  if (!hasAnyPersonalization) return null;

  const categories = [];
  let sumPoints = 0;
  let sumMax = 0;
  // Applies the category's priority weight to points AND max, accumulates the
  // normalization sums, and records the category for the breakdown UI.
  const addCategory = (key, label, points, max, detail, weightKey) => {
    const mult = weightKey ? priorityMult(user, weightKey) : 1;
    const pts = points * mult;
    const mx = max * mult;
    sumPoints += pts;
    sumMax += mx;
    categories.push({ key, label, points: Math.round(pts), max: Math.round(mx), detail });
  };

  // Hard eligibility gate: unmet residency / school-location requirement → 0%.
  const eligibility = getEligibilityStatus(item, user);
  if (!eligibility.eligible) {
    return {
      total: 0,
      ineligible: true,
      ineligibleReason: eligibility.reason,
      categories: [
        { key: 'eligibility', label: 'Eligibility', points: 0, max: 100,
          detail: eligibility.reason || "You don't meet this program's eligibility requirements." },
      ],
    };
  }

  const itemRemote    = isItemRemote(item);
  const itemNationwide = isItemNationwide(item);
  const loc = (item.location || '').toLowerCase();
  const itemHybrid    = !itemRemote && !itemNationwide && loc.includes('hybrid');

  // ── Interests (base max 40, weighted) ──────────────────────────────────────
  const rawInterests = user.interests || [];
  const interests = rawInterests.map(normaliseInterest).filter(Boolean);
  if (interests.length > 0) {
    const itemFields = new Set(
      [item.field, ...(item.tags || [])].map((f) => (f || '').trim()).filter(Boolean)
    );
    const directMatches = interests.filter((i) => itemFields.has(i));
    const primaryMatch  = !!item.field && interests.includes(item.field);
    if (directMatches.length >= 2 || (directMatches.length === 1 && primaryMatch)) {
      addCategory('interests', 'Interests', 40, 40,
        directMatches.length >= 2
          ? `Matches your ${directMatches.slice(0, 2).join(' & ')} interests`
          : `Matches your ${item.field} interest, this program's main focus`, 'interests');
    } else if (directMatches.length === 1) {
      addCategory('interests', 'Interests', 26, 40,
        `Matches your ${directMatches[0]} interest`, 'interests');
    } else {
      const hasAdjacency = interests.some((interest) =>
        ADJACENCY_GROUPS.some((group) =>
          group.has(interest) && [...itemFields].some((f) => group.has(f))
        )
      );
      addCategory('interests', 'Interests', hasAdjacency ? 14 : 0, 40,
        hasAdjacency ? 'Related to one of your interests' : "Doesn't match your listed interests", 'interests');
    }
  } else {
    addCategory('interests', 'Interests', 20, 40,
      'No interests set on your profile, neutral score given', 'interests');
  }

  // ── Grade & age (base max 12, unweighted) ──────────────────────────────────
  // Grade-ineligible and provably age-ineligible programs are caught by the
  // hard gate above. What remains: exact/eligible/unknown grade fit, plus the
  // "likely too young" soft penalty when the program has an age minimum the
  // user's grade cohort typically can't meet and no actual age is on file.
  const gradesForScoring = item.gradesShort || item.grades || '';
  const ageFit = ageFitLevel(item, user);
  if (ageFit === 'likely_too_young') {
    addCategory('grade', 'Grade & age', 2, 12,
      `Requires age ${item.minAge}+, which is above the typical age for your grade`);
  } else if (user.grade) {
    const gradeNum = gradeToNumber(user.grade);
    const fitLevel = gradeNumFitLevel(gradeNum, gradesForScoring);
    if (fitLevel === 'exact') {
      addCategory('grade', 'Grade & age', 12, 12, `Perfect fit for your grade (${user.grade})`);
    } else if (fitLevel === 'eligible') {
      addCategory('grade', 'Grade & age', 9, 12, `You're eligible at your grade (${user.grade})`);
    } else {
      addCategory('grade', 'Grade & age', 5, 12, "This listing doesn't clearly state its grade range");
    }
  } else {
    addCategory('grade', 'Grade & age', 5, 12, 'No grade set on your profile, neutral score given');
  }

  // ── Location & logistics (base max 24, weighted) ───────────────────────────
  // Covers proximity, remote/in-person format, commute feasibility, and
  // housing/dorm availability. A far-away residential program (housing
  // provided) is genuinely reachable for a student open to dorms; a far-away
  // commuter program is not reachable for anyone.
  const userHasLocation = !!(user.location || user.state);
  const userState       = getUserState(user);
  const userCity        = getUserCity(user);
  const nearbyStates    = userState ? (NEARBY_STATES_MAP[userState] || []) : [];
  const localOnly       = user.travelWillingness === 'local';
  const travelAnywhere  = user.travelWillingness === 'anywhere';
  const housingOffered  = item.housing === 'provided' || item.housing === 'optional';

  // Compute the base location points/detail via the proximity ladder, then a
  // single addCategory at the end applies the soft remote/in-person preference.
  let locPoints = 0;
  let locDetail = '';

  if (user.remoteOnly) {
    if (itemRemote) {
      locPoints = 24; locDetail = 'Fully remote, matches your remote-only preference';
    } else if (itemHybrid) {
      locPoints = 8;  locDetail = 'Hybrid, partially matches your remote-only preference';
    } else {
      locPoints = 0;  locDetail = "In-person only, but you're set to remote-only";
    }
  } else if (!userHasLocation) {
    // No location set: in-person still slightly favored. We just can't judge
    // proximity, so everyone gets the same in-person floor.
    if (itemHybrid) {
      locPoints = 10; locDetail = 'Hybrid program, no location set on your profile';
    } else if (itemRemote || itemNationwide) {
      locPoints = 8;  locDetail = `${itemRemote ? 'Remote' : 'Nationwide'} program, no location set on your profile`;
    } else {
      locPoints = 11; locDetail = 'In-person program, no location set on your profile';
    }
  } else if (itemRemote) {
    // Remote scores well since many students prefer remote internships.
    locPoints = 15; locDetail = 'Remote, a strong option many students prefer';
  } else if (itemNationwide) {
    locPoints = localOnly ? 6 : 4; locDetail = 'Open nationwide';
  } else {
    // In-person or hybrid: score by proximity, then by logistics feasibility
    const itemStates = extractStatesFromLocation(item.location || '');
    const cityMatch  = userCity.length > 2 && loc.includes(userCity);
    const stateMatch = !!userState && itemStates.some((s) => s === userState);
    const nearbyMatch = !stateMatch && itemStates.length > 0 &&
                        itemStates.some((s) => nearbyStates.includes(s));
    const farAway = !cityMatch && !stateMatch && !nearbyMatch && itemStates.length > 0;

    if (cityMatch && stateMatch) {
      locPoints = 24;
      locDetail = `In ${userCity ? userCity.replace(/\b\w/g, (c) => c.toUpperCase()) : 'your city'}, ${userState}, an exact location match`;
    } else if (stateMatch) {
      locPoints = 21; locDetail = `In ${userState}, your home state`;
    } else if (cityMatch) {
      locPoints = 13; locDetail = 'Matches your city';
    } else if (farAway && housingOffered && user.openToHousing === true) {
      locPoints = 14; locDetail = 'Provides housing/dorms, and you said you\'re open to residential programs';
    } else if (farAway && housingOffered && user.openToHousing === false) {
      locPoints = 3;  locDetail = 'Residential program far from you, and you preferred not to stay in housing';
    } else if (nearbyMatch && !itemHybrid) {
      locPoints = 8;  locDetail = 'In a state near you';
    } else if (nearbyMatch && itemHybrid) {
      locPoints = 6;  locDetail = 'Hybrid program in a state near you';
    } else if (farAway && housingOffered) {
      locPoints = 8;  locDetail = 'Far from you, but provides housing/dorms for participants';
    } else if (itemStates.length === 0) {
      locPoints = 7;  locDetail = 'No location listed for this program';
    } else if (itemHybrid) {
      locPoints = 4;  locDetail = 'Hybrid program outside your area';
    } else if (localOnly) {
      locPoints = 1;  locDetail = 'Would require commuting or relocating outside your area';
    } else {
      locPoints = travelAnywhere ? 5 : 3;
      locDetail = travelAnywhere
        ? 'Outside your area, but you said you\'d travel for the right program'
        : 'In-person and likely requires a daily commute outside your area';
    }
  }

  // Soft remote/in-person preference: distinct from the remoteOnly hard filter.
  // It nudges the location score toward the format the student said they prefer,
  // without ever hiding the other format the way remoteOnly does.
  const prefRemote   = !user.remoteOnly && user.formatPreference === 'remote';
  const prefInperson = !user.remoteOnly && user.formatPreference === 'inperson';
  if (prefRemote) {
    if (itemRemote) {
      locPoints = 24; locDetail = 'Fully remote, exactly the format you prefer';
    } else if (itemHybrid) {
      locPoints = Math.round(locPoints * 0.85); locDetail += ' (you prefer remote)';
    } else if (!itemNationwide) {
      locPoints = Math.round(locPoints * 0.7);  locDetail += ' (you prefer remote)';
    }
  } else if (prefInperson) {
    if (itemRemote) {
      locPoints = Math.round(locPoints * 0.5);  locDetail += ' (you prefer in-person)';
    } else if (itemNationwide) {
      locPoints = Math.round(locPoints * 0.6);
    } else if (!itemHybrid) {
      const boosted = Math.min(24, Math.round(locPoints * 1.15));
      if (boosted > locPoints) locDetail += ', the in-person format you prefer';
      locPoints = boosted;
    }
  }
  addCategory('location', 'Location', locPoints, 24, locDetail, 'location');

  // ── Compensation (base max 8, weighted) ────────────────────────────────────
  // DB convention: 'Stipend' = student RECEIVES money; 'Paid' = student PAYS a
  // program fee. Stipend > unpaid > fee-based.
  const { isStipend, isPaid } = detectPayType(item);
  if (isStipend) {
    addCategory('compensation', 'Compensation', 8, 8, 'Pays you a stipend', 'compensation');
  } else if (isPaid) {
    addCategory('compensation', 'Compensation', 0, 8, 'Charges a program fee', 'compensation');
  } else {
    addCategory('compensation', 'Compensation', 3, 8, 'Unpaid, but free to attend', 'compensation');
  }

  if (item.featured) {
    addCategory('featured', 'Featured', 3, 3, 'Featured program');
  } else {
    addCategory('featured', 'Featured', 0, 3, 'Not a featured program');
  }

  // Program explicitly names the user's school or district: near-guaranteed
  // eligibility fit, so surface it prominently.
  if (schoolMatchesRequirement(item, user)) {
    addCategory('school', 'School match', 3, 3, 'Names your school or district directly');
  } else {
    addCategory('school', 'School match', 0, 3, "Doesn't mention your school or district");
  }

  // ── Competitiveness fit (GPA + readiness) ─────────────────────────────────
  // Scores items based on how well the user's academic profile aligns with
  // the program's competitiveness level. High-GPA, well-prepared users see
  // competitive programs boosted; lower-GPA or less-prepared users see
  // open/moderate programs boosted instead.
  //
  // GPA tiers: high (3.8–4.0) → competitive fit; good (3.5–3.7) → moderate fit;
  //            avg/below/unsure → open-leaning fit
  // Readiness count: how many of resume/essay/rec/transcript/ec/experience the
  //                  user has ready (0–6)
  const comp = getCompetitivenessLevel(item);
  const gpa = user.gpaRange || '';
  const readinessCount = Array.isArray(user.readiness) ? user.readiness.length : 0;
  const compConfigLabel = comp === 'competitive' ? 'Competitive' : comp === 'open' ? 'Open apply' : 'Moderate';

  // Derive a profile strength from GPA + readiness materials
  // 0 = open-leaning, 1 = moderate, 2 = competitive-ready
  let profileStrength;
  if (gpa === 'high' && readinessCount >= 3) profileStrength = 2;        // strong: GPA + materials
  else if (gpa === 'high' || (gpa === 'good' && readinessCount >= 2)) profileStrength = 1; // solid
  else if (gpa === 'good') profileStrength = 1;
  else profileStrength = 0;                                               // avg/below/unsure/no data

  // Every program earns a competitiveness bonus somewhere in the 8-10 range:
  // this is a fit ranking among generally-relevant results, not a penalty
  // category, so even a "worst fit" program shouldn't get zeroed out here.
  let compPoints;
  if (profileStrength === 2) {
    // Strong profile: competitive programs rise, open programs still solid
    if (comp === 'competitive')    compPoints = 10;
    else if (comp === 'moderate')  compPoints = 9;
    else                           compPoints = 8; // open: still shows but lower priority
  } else if (profileStrength === 1) {
    // Solid profile: moderate = best fit, competitive and open both accessible
    if (comp === 'moderate')       compPoints = 10;
    else if (comp === 'competitive') compPoints = 9;
    else                           compPoints = 9; // open: equally fine
  } else {
    // Open-leaning: open programs rise; competitive programs deprioritized
    if (comp === 'open')           compPoints = 10;
    else if (comp === 'moderate')  compPoints = 9;
    else                           compPoints = 8; // competitive: still shown, ranked lower
  }
  addCategory('competitiveness', 'Profile fit', compPoints, 10,
    `${compConfigLabel} program, ${profileStrength === 2 ? 'matches your strong profile' : profileStrength === 1 ? 'fits your solid profile' : 'weighed against your profile'}`, 'competitiveness');

  // Normalize the weighted sums back to 0–100: at default priorities the
  // base maxes (40+12+24+8+3+3+10) sum to exactly 100, and with custom
  // priorities the normalization keeps scores comparable across users.
  const total = Math.max(0, Math.min(100, Math.round((sumPoints / sumMax) * 100)));
  return { total, ineligible: false, ineligibleReason: '', categories };
}

// MATCH REASONS
export function computeMatchReasons(item, user) {
  if (!item || !user) return [];
  const reasons = [];

  const rawInterests = user.interests || [];
  const interests = rawInterests.map(normaliseInterest).filter(Boolean);
  if (interests.length > 0) {
    const itemFields = new Set(
      [item.field, ...(item.tags || [])].map((f) => (f || '').trim()).filter(Boolean)
    );
    const directMatches = interests.filter((i) => itemFields.has(i));
    if (directMatches.length >= 2) {
      reasons.push(`Matches ${directMatches.slice(0, 2).join(' & ')}`);
    } else if (directMatches.length === 1) {
      reasons.push(`Matches ${directMatches[0]}`);
    } else {
      const hasAdjacency = interests.some((interest) =>
        ADJACENCY_GROUPS.some((group) =>
          group.has(interest) && [...itemFields].some((f) => group.has(f))
        )
      );
      if (hasAdjacency && (item.field || (item.tags || [])[0])) {
        reasons.push(`Related to ${item.field || item.tags[0]}`);
      }
    }
  }

  if (user.grade) {
    const gradeNum = gradeToNumber(user.grade);
    const gradesForScoring = item.gradesShort || item.grades || '';
    const fitLevel = gradeNumFitLevel(gradeNum, gradesForScoring);
    if (fitLevel === 'exact')      reasons.push(`Perfect for ${user.grade}`);
    else if (fitLevel === 'eligible') reasons.push(`${user.grade} eligible`);
    // 'ineligible' produces no reason here; it's handled by the hard
    // eligibility gate below, which returns "Not eligible: grade" instead.
  }

  const itemRemote    = isItemRemote(item);
  const itemNationwide = isItemNationwide(item);

  // Eligibility (location, gender, race): same verdict as the 0% hard gate in computeMatchScore
  const eligStatus = getEligibilityStatus(item, user);
  const userStateForReasons = getUserState(user);

  if (!eligStatus.eligible) {
    // Ineligible is the single most important thing to communicate, so lead with it
    const label = eligStatus.failedOn === 'gender' ? 'gender'
      : eligStatus.failedOn === 'race' ? 'race/ethnicity'
      : eligStatus.failedOn === 'grade' ? 'grade'
      : eligStatus.failedOn === 'age' ? 'age'
      : 'location';
    return [`Not eligible: ${label}`, ...reasons].slice(0, 4);
  }
  if (ageFitLevel(item, user) === 'likely_too_young') {
    reasons.push(`Requires age ${item.minAge}+`);
  }
  if ((item.housing === 'provided' || item.housing === 'optional') && !isItemRemote(item)) {
    reasons.push('Housing provided');
  }
  if (schoolMatchesRequirement(item, user)) {
    reasons.push('Open to your school');
  }
  if (itemRemote) {
    reasons.push('Fully remote');
  } else if (itemNationwide) {
    reasons.push('Open nationwide');
  } else if (!user.remoteOnly) {
    const itemStates  = extractStatesFromLocation(item.location || '');
    const nearbyStates = userStateForReasons ? (NEARBY_STATES_MAP[userStateForReasons] || []) : [];
    const stateMatch  = !!userStateForReasons && itemStates.some((s) => s === userStateForReasons);
    const nearbyMatch = !stateMatch && itemStates.length > 0 &&
                        itemStates.some((s) => nearbyStates.includes(s));
    if (stateMatch)       reasons.push('In your state');
    else if (nearbyMatch) reasons.push('Near you');
  }

  const { isPaid, isStipend } = detectPayType(item);
  if (isStipend)    reasons.push('Stipend');
  else if (isPaid)  reasons.push('Program fee'); // 'Paid' in DB = student pays
  if (item.featured) reasons.push('Featured program');
  return reasons.slice(0, 4);
}

// COMPETITIVENESS
export function getCompetitivenessLevel(item) {
  if (item.competitiveness) return item.competitiveness;
  const text = [item.overview, item.requirements, item.role, item.company]
    .filter(Boolean).join(' ').toLowerCase();
  const competitiveSignals = [
    'competitive','selective','prestigious','rigorous','gpa','transcript',
    'interview','essay','recommendation letter','limited spots','highly sought',
    'national','federal','congressional','senate','whitehouse','nasa',
    'fellowship','scholar',
  ];
  const openSignals = [
    'open to all','no experience required','beginner','anyone can apply',
    'first come','open enrollment','no gpa','no experience needed',
    'all students welcome','any student',
  ];
  const compScore = competitiveSignals.filter((s) => text.includes(s)).length;
  const openScore = openSignals.filter((s) => text.includes(s)).length;
  if (openScore >= 1) return 'open';
  if (compScore >= 3) return 'competitive';
  if (compScore >= 1) return 'moderate';
  return 'moderate';
}

export function getCompetitivenessConfig(level) {
  switch (level) {
    case 'competitive': return { label: 'Competitive', emoji: '', color: '#EF4444', bg: '#FEF2F2' };
    case 'open': return { label: 'Open Apply', emoji: '', color: '#10B981', bg: '#ECFDF5' };
    case 'moderate':
    default: return { label: 'Moderate', emoji: '', color: '#F59E0B', bg: '#FFFBEB' };
  }
}

// SIMILARITY SCORE
export function computeSimilarityScore(a, b) {
  if (!a || !b || a.id === b.id) return 0;
  let score = 0;
  if (a.field && b.field && a.field === b.field) score += 50;
  const aTags = new Set(a.tags || []);
  const bTags = new Set(b.tags || []);
  const sharedTags = [...aTags].filter((t) => bTags.has(t));
  score += Math.min(sharedTags.length * 10, 30);
  if (isItemRemote(a) === isItemRemote(b)) score += 10;
  const aGrades = a.gradesShort || a.grades || '';
  const bGrades = b.gradesShort || b.grades || '';
  if (aGrades && bGrades && aGrades === bGrades) score += 10;
  return Math.min(100, score);
}

export function getSimilarRecommendations(savedItems, allItems, limit = 4) {
  if (!savedItems || savedItems.length === 0) return [];
  const savedIds = new Set(savedItems.map((i) => i.id));
  return allItems
    .filter((item) => !savedIds.has(item.id))
    .map((item) => ({ item, sim: Math.max(...savedItems.map((s) => computeSimilarityScore(s, item))) }))
    .filter(({ sim }) => sim >= 30)
    .sort((a, b) => b.sim - a.sim)
    .slice(0, limit)
    .map(({ item }) => item);
}

// APPLICATION CHECKLIST
function trimStep(text) {
  const cleaned = text.replace(/^(step\s*)?\d+[.):\s]+/i, '').replace(/^[-•*]\s*/, '').trim();
  const capped = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  if (capped.length <= 42) return capped;
  const cut = capped.slice(0, 42);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 18 ? cut.slice(0, lastSpace) : cut).replace(/[,;:]+$/, '') + '…';
}

function parseApplicationChecklist(raw) {
  if (!raw || !raw.trim()) return null;
  const s = raw.trim();
  if (s.startsWith('[')) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed) && parsed.length >= 2) {
        return parsed.map((t) => String(t).trim()).filter(Boolean);
      }
    } catch (_) {}
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1);
    const parts = inner.match(/"([^"]*)"/g);
    if (parts && parts.length >= 2) {
      return parts.map((p) => p.replace(/^"|"$/g, '').trim()).filter(Boolean);
    }
    const plain = inner.split(',').map((p) => p.trim()).filter(Boolean);
    if (plain.length >= 2) return plain;
  }
  if (s.includes('|')) {
    const parts = s.split('|').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2) return parts;
  }
  if (s.includes('\n')) {
    const lines = s.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length >= 2) return lines;
  }
  if (s.includes(',')) {
    const parts = s.split(',').map((p) => p.trim()).filter(Boolean);
    if (parts.length >= 2 && parts.every((p) => p.length <= 120)) {
      return parts;
    }
  }
  if (s.length > 0) return [s];
  return null;
}

export function getChecklistItems(item) {
  if (!item) return [];
  const appChecklist = (item.applicationChecklist || '').trim();
  if (appChecklist) {
    const parsed = parseApplicationChecklist(appChecklist);
    if (parsed && parsed.length >= 1) {
      return parsed.slice(0, 6).map((l, i) => ({ key: `step_${i}`, text: trimStep(l) }));
    }
  }
  const raw = (item.howToApply || '').trim();
  if (raw) {
    const lines = raw.split('\n').map((l) => l.trim()).filter(Boolean);
    const stepLines = lines.filter((l) => /^(\d+[.):\s]|[-•*])/.test(l));
    const source = stepLines.length >= 2 ? stepLines : lines;
    if (source.length >= 2) {
      return source.slice(0, 6).map((l, i) => ({ key: `step_${i}`, text: trimStep(l) }));
    }
  }
  return [
    { key: 'visit',       text: 'Visit the program website' },
    { key: 'eligibility', text: 'Review eligibility' },
    { key: 'apply',       text: 'Submit your application' },
  ];
}

// COLLEGE MAJOR ALIGNMENT
export function getCollegeMajorAlignment(field) {
  const alignments = {
    'Computer Science': ['Computer Science','Software Engineering','Data Science','AI/ML'],
    'Medicine': ['Pre-Medicine','Biology','Biochemistry','Public Health'],
    'Business': ['Business Administration','Marketing','Management','Entrepreneurship'],
    'Aerospace': ['Aerospace Engineering','Mechanical Engineering','Physics','Astronomy'],
    'Engineering': ['Mechanical Engineering','Civil Engineering','Electrical Engineering'],
    'Art': ['Fine Arts','Graphic Design','Architecture','Film & Media'],
    'Arts': ['Fine Arts','Graphic Design','Architecture','Film & Media'],
    'Law': ['Political Science','Pre-Law','Criminal Justice','Philosophy'],
    'Law/Advocacy': ['Political Science','Pre-Law','Criminal Justice','Philosophy'],
    'Environment': ['Environmental Science','Biology','Ecology','Sustainability'],
    'Education': ['Education','Psychology','Child Development','Social Work'],
    'Finance': ['Finance','Economics','Accounting','Investment Banking'],
    'Journalism': ['Journalism','Communications','English','Media Studies'],
    'Science': ['Biology','Chemistry','Physics','Neuroscience','Biochemistry'],
    'History': ['History','Social Studies','Political Science','Humanities'],
  };
  return alignments[field] || [];
}