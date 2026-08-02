// matching.js — Shared helpers for deadline computation and match scoring

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
  // Primary: explicit Supabase boolean — always authoritative
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
// For all other users, this returns true — scoring handles the ranking.
// Previously this hard-filtered out-of-state in-person items, which caused remote
// items to dominate because they were never filtered. Now scoring does the work.
export function isLocationEligible(item, user) {
  // remoteOnly users: only allow remote or nationwide items
  if (user && user.remoteOnly) {
    return isNationwideOrRemote(item);
  }
  // For all other users, everything is eligible — scoring sorts it out
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
// visually identical to rolling ones — this makes "closed" an explicit state.
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
// grades (lowercase) is the verbose requirements text — not used for scoring
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
  // 'paid internship/position/program' means the program pays the student — that's a stipend, not a fee.
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
// paragraph — the old free-text regex scan flagged far too many programs as
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
// explicitly inclusive, not restrictive — skip it.
const GENDER_MIXED_MENTION = /\b(women|female|girls?)\b.{0,25}\b(and|or)\b.{0,10}\b(men|male|boys?)\b|\b(men|male|boys?)\b.{0,25}\b(and|or)\b.{0,10}\b(women|female|girls?)\b/;

function detectGenderRequirement(item) {
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
// students — expand it to those four categories rather than gating on an
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
//     — no restriction, or restriction met
//   { eligible: true,  ..., unknown: true, reason: '' }
//     — restriction exists but the relevant profile field isn't set
//   { eligible: false, ..., reason: '<explanation>' }
//     — hard mismatch → 0%

export function getEligibilityStatus(item, user) {
  const empty = { eligible: true, requiredStates: [], requiredGenders: [], requiredRaces: [], reason: '' };
  if (!item || !user) return empty;

  const requiredStates  = detectResidencyRequirement(item);
  const requiredGenders = detectGenderRequirement(item);
  const requiredRaces   = detectRaceRequirement(item);
  let unknown = false;

  // ── Grade ─────────────────────────────────────────────────────────────────
  // Grades are now stored as clean numbers/ranges in Supabase (e.g. "9-12",
  // "10"), so a grade outside the program's range is a hard mismatch — a
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

  // ── Location ──────────────────────────────────────────────────────────────
  if (requiredStates.length > 0) {
    const homeState   = getUserState(user);
    const schoolState = ((user.school && user.school.state) || '').toUpperCase();
    const knownStates = [...new Set([homeState, schoolState].filter(Boolean))];
    if (knownStates.length === 0) {
      unknown = true;
    } else if (!knownStates.some((s) => requiredStates.includes(s))) {
      return {
        eligible: false, requiredStates, requiredGenders, requiredRaces, failedOn: 'location',
        reason:
          `This program is only open to students located in ${requiredStates.join(', ')}. ` +
          `Your profile says you're in ${homeState || schoolState}, so you don't meet its location requirement.`,
      };
    }
  }

  // ── Gender ────────────────────────────────────────────────────────────────
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

  // ── Race / ethnicity ─────────────────────────────────────────────────────
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

  if (unknown) {
    return { eligible: true, unknown: true, requiredStates, requiredGenders, requiredRaces, reason: '' };
  }
  return { eligible: true, requiredStates, requiredGenders, requiredRaces, reason: '' };
}

// ─── SCHOOL / DISTRICT MATCH ─────────────────────────────────────────────────
//
// True when the program's requirements text explicitly names the user's school
// or district (e.g. "open to Fairfax County Public Schools students"). Used as
// a recommendation boost — these programs are a near-guaranteed eligibility fit.

export function schoolMatchesRequirement(item, user) {
  const school = user && user.school;
  if (!school) return false;
  const text = (item && item.requirements || '').toLowerCase();
  if (!text) return false;

  const name = (school.name || '').toLowerCase().trim();
  if (name.length > 6 && text.includes(name)) return true;

  // District names in NCES read like "Fairfax County Public Schools" /
  // "Richmond City Public Schools" — requirements often shorten them, so
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
// Score breakdown — category maxes sum to exactly 100, so a 100% match means
// every category actually hit its ceiling (no artificial clamp needed):
//   Interest match   0–44 pts
//   Grade fit        6–15 pts  (never 0 — a grade-ineligible program is a hard
//                               gate below, not a scored category)
//   Location         0–22 pts  (0 if hard residency requirement not met)
//   Pay bonus        0–3  pts  (stipend or paid)
//   Featured bonus   0–3  pts
//   School match     0–3  pts  (requirements explicitly name user's school/district)
//   Competitiveness  8–10 pts  (profile-fit ranking bonus, never a penalty)
//
// Hard eligibility gate: if the user's grade is outside the program's
// Grades range, or the program has a Required_State/Required_Race value
// (structured Supabase columns) that the user's profile doesn't satisfy, the
// whole score is 0. The item still appears in results with a 0% badge;
// getEligibilityStatus() supplies the explanation the info button shows.
//
// Location scoring (user HAS location set — state known, residency met):
//   City + state match (in-person)       22 pts  ← highest
//   Same state (in-person)               19 pts
//   City match only                      12 pts
//   Nearby state (in-person)              7 pts
//   Nearby state (hybrid)                 5 pts
//   No location info (in-person)          6 pts
//   Out-of-state in-person                4 pts
//   Hybrid (no location match)            4 pts
//   Nationwide                            3 pts
//   Remote (user has location)            1 pt   ← lowest: in-person always beats it
//
// In-person opportunities are deliberately floored above remote/nationwide
// here (an out-of-state internship a student could travel to is worth more
// than a fully virtual one) — surfaces more in-person programs on the "For
// You" feed instead of letting remote listings dominate on interest match alone.
//
// Location scoring (user has NO location / state):
//   In-person                            10 pts  ← still favored, even unlocated
//   Hybrid                                9 pts
//   Remote / nationwide                   7 pts
//
// remoteOnly user:
//   Remote                               22 pts
//   Hybrid                                7 pts
//   In-person                             0 pts

export function computeMatchScore(item, user) {
  const breakdown = computeMatchBreakdown(item, user);
  return breakdown ? breakdown.total : null;
}

// Same scoring logic as computeMatchScore, but returns the per-category
// point breakdown so the UI can explain *why* a program got its score.
// Kept as the single source of truth — computeMatchScore just sums it.
export function computeMatchBreakdown(item, user) {
  if (!item || !user) return null;
  const hasAnyPersonalization =
    (Array.isArray(user.interests) && user.interests.length > 0) ||
    user.grade || user.location || user.state || user.school || user.remoteOnly ||
    user.gpaRange || (Array.isArray(user.readiness) && user.readiness.length > 0);
  if (!hasAnyPersonalization) return null;

  const categories = [];

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

  let score = 0;
  const itemRemote    = isItemRemote(item);
  const itemNationwide = isItemNationwide(item);
  const loc = (item.location || '').toLowerCase();
  const itemHybrid    = !itemRemote && !itemNationwide && loc.includes('hybrid');

  // ── Interests (max 44) ─────────────────────────────────────────────────────
  const rawInterests = user.interests || [];
  const interests = rawInterests.map(normaliseInterest).filter(Boolean);
  if (interests.length > 0) {
    const itemFields = new Set(
      [item.field, ...(item.tags || [])].map((f) => (f || '').trim()).filter(Boolean)
    );
    const directMatches = interests.filter((i) => itemFields.has(i));
    const primaryMatch  = !!item.field && interests.includes(item.field);
    if (directMatches.length >= 2 || (directMatches.length === 1 && primaryMatch)) {
      score += 44;
      categories.push({ key: 'interests', label: 'Interests', points: 44, max: 44,
        detail: directMatches.length >= 2
          ? `Matches your ${directMatches.slice(0, 2).join(' & ')} interests`
          : `Matches your ${item.field} interest, this program's main focus` });
    } else if (directMatches.length === 1) {
      score += 28;
      categories.push({ key: 'interests', label: 'Interests', points: 28, max: 44,
        detail: `Matches your ${directMatches[0]} interest` });
    } else {
      const hasAdjacency = interests.some((interest) =>
        ADJACENCY_GROUPS.some((group) =>
          group.has(interest) && [...itemFields].some((f) => group.has(f))
        )
      );
      score += hasAdjacency ? 15 : 0;
      categories.push({ key: 'interests', label: 'Interests', points: hasAdjacency ? 15 : 0, max: 44,
        detail: hasAdjacency ? 'Related to one of your interests' : "Doesn't match your listed interests" });
    }
  } else {
    score += 22; // no interests set — neutral baseline
    categories.push({ key: 'interests', label: 'Interests', points: 22, max: 44,
      detail: 'No interests set on your profile, neutral score given' });
  }

  // ── Grade (max 15) ─────────────────────────────────────────────────────────
  // Use gradesShort (the short formatted field) for reliable parsing.
  // Falls back to grades (verbose) if gradesShort is absent.
  // A grade-ineligible program is caught by the hard eligibility gate above
  // and never reaches here, so only exact/eligible/unknown are possible.
  const gradesForScoring = item.gradesShort || item.grades || '';
  if (user.grade) {
    const gradeNum = gradeToNumber(user.grade);
    const fitLevel = gradeNumFitLevel(gradeNum, gradesForScoring);
    if (fitLevel === 'exact') {
      score += 15;
      categories.push({ key: 'grade', label: 'Grade level', points: 15, max: 15,
        detail: `Perfect fit for your grade (${user.grade})` });
    } else if (fitLevel === 'eligible') {
      score += 11;
      categories.push({ key: 'grade', label: 'Grade level', points: 11, max: 15,
        detail: `You're eligible at your grade (${user.grade})` });
    } else {
      score += 6;
      categories.push({ key: 'grade', label: 'Grade level', points: 6, max: 15,
        detail: "This listing doesn't clearly state its grade range" });
    }
  } else {
    score += 6; // no grade set — neutral
    categories.push({ key: 'grade', label: 'Grade level', points: 6, max: 15,
      detail: 'No grade set on your profile, neutral score given' });
  }

  // ── Location (max 22) ──────────────────────────────────────────────────────
  const userHasLocation = !!(user.location || user.state);
  const userState       = getUserState(user);
  const userCity        = getUserCity(user);
  const nearbyStates    = userState ? (NEARBY_STATES_MAP[userState] || []) : [];

  // Residency ineligibility is handled by the hard gate at the top of this
  // function (returns 0 before any points accrue), so location scoring here
  // only runs for programs the user is actually allowed to apply to.
  if (user.remoteOnly) {
    // remoteOnly user: remote = best, hybrid = ok, in-person = 0
    if (itemRemote) {
      score += 22;
      categories.push({ key: 'location', label: 'Location', points: 22, max: 22,
        detail: 'Fully remote, matches your remote-only preference' });
    } else if (itemHybrid) {
      score += 7;
      categories.push({ key: 'location', label: 'Location', points: 7, max: 22,
        detail: "Hybrid, partially matches your remote-only preference" });
    } else {
      categories.push({ key: 'location', label: 'Location', points: 0, max: 22,
        detail: "In-person only, but you're set to remote-only" });
    }
  } else if (!userHasLocation) {
    // No location set: in-person is still favored over remote/nationwide —
    // we just can't judge proximity, so everyone gets the same in-person floor.
    if (itemHybrid) {
      score += 9;
      categories.push({ key: 'location', label: 'Location', points: 9, max: 22,
        detail: 'Hybrid program, no location set on your profile' });
    } else if (itemRemote || itemNationwide) {
      score += 7;
      categories.push({ key: 'location', label: 'Location', points: 7, max: 22,
        detail: `${itemRemote ? 'Remote' : 'Nationwide'} program, no location set on your profile` });
    } else {
      score += 10;
      categories.push({ key: 'location', label: 'Location', points: 10, max: 22,
        detail: 'In-person program, no location set on your profile' });
    }
  } else if (itemRemote) {
    // User HAS location + item is remote → remote gets the minimum score so
    // any in-person item (even out-of-state) reliably outscores it
    score += 1;
    categories.push({ key: 'location', label: 'Location', points: 1, max: 22,
      detail: 'Remote, lower priority since in-person options exist near you' });
  } else if (itemNationwide) {
    score += 3;
    categories.push({ key: 'location', label: 'Location', points: 3, max: 22,
      detail: 'Open nationwide' });
  } else {
    // In-person or hybrid — score by geographic proximity, floored well
    // above remote/nationwide so more in-person programs surface
    const itemStates = extractStatesFromLocation(item.location || '');
    const cityMatch  = userCity.length > 2 && loc.includes(userCity);
    const stateMatch = !!userState && itemStates.some((s) => s === userState);
    const nearbyMatch = !stateMatch && itemStates.length > 0 &&
                        itemStates.some((s) => nearbyStates.includes(s));

    if (cityMatch && stateMatch) {
      score += 22;
      categories.push({ key: 'location', label: 'Location', points: 22, max: 22,
        detail: `In ${userCity ? userCity.replace(/\b\w/g, (c) => c.toUpperCase()) : 'your city'}, ${userState}, an exact location match` });
    } else if (stateMatch) {
      score += 19;
      categories.push({ key: 'location', label: 'Location', points: 19, max: 22,
        detail: `In ${userState}, your home state` });
    } else if (cityMatch) {
      score += 12;
      categories.push({ key: 'location', label: 'Location', points: 12, max: 22,
        detail: 'Matches your city' });
    } else if (nearbyMatch && !itemHybrid) {
      score += 7;  // nearby: fallback only, not a boost
      categories.push({ key: 'location', label: 'Location', points: 7, max: 22,
        detail: 'In a state near you' });
    } else if (nearbyMatch && itemHybrid) {
      score += 5;
      categories.push({ key: 'location', label: 'Location', points: 5, max: 22,
        detail: 'Hybrid program in a state near you' });
    } else if (itemStates.length === 0) {
      score += 6;   // no state info — still in-person, benefit of the doubt
      categories.push({ key: 'location', label: 'Location', points: 6, max: 22,
        detail: 'No location listed for this program' });
    } else if (itemHybrid) {
      score += 4;
      categories.push({ key: 'location', label: 'Location', points: 4, max: 22,
        detail: 'Hybrid program outside your area' });
    } else {
      score += 4;   // out-of-state in-person — still above remote
      categories.push({ key: 'location', label: 'Location', points: 4, max: 22,
        detail: 'In-person, but outside your area' });
    }
  }

  // ── Bonuses ────────────────────────────────────────────────────────────────
  // DB convention: 'Stipend' = student RECEIVES money; 'Paid' = student PAYS a
  // program fee. Only stipend programs deserve a boost — fee-based programs
  // get no bonus (they cost the student money).
  const { isStipend } = detectPayType(item);
  if (isStipend) {
    score += 3;
    categories.push({ key: 'stipend', label: 'Stipend', points: 3, max: 3, detail: 'Offers a paid stipend' });
  } else {
    categories.push({ key: 'stipend', label: 'Stipend', points: 0, max: 3, detail: 'No stipend offered' });
  }

  if (item.featured) {
    score += 3;
    categories.push({ key: 'featured', label: 'Featured', points: 3, max: 3, detail: 'Featured program' });
  } else {
    categories.push({ key: 'featured', label: 'Featured', points: 0, max: 3, detail: 'Not a featured program' });
  }

  // Program explicitly names the user's school or district — near-guaranteed
  // eligibility fit, so surface it prominently.
  if (schoolMatchesRequirement(item, user)) {
    score += 3;
    categories.push({ key: 'school', label: 'School match', points: 3, max: 3,
      detail: "Names your school or district directly" });
  } else {
    categories.push({ key: 'school', label: 'School match', points: 0, max: 3,
      detail: "Doesn't mention your school or district" });
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

  // Every program earns a competitiveness bonus somewhere in the 8-10 range —
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
  score += compPoints;
  categories.push({ key: 'competitiveness', label: 'Profile fit', points: compPoints, max: 10,
    detail: `${compConfigLabel} program, ${profileStrength === 2 ? 'matches your strong profile' : profileStrength === 1 ? 'fits your solid profile' : 'weighed against your profile'}` });

  // Category maxes (44+15+22+3+3+3+10) sum to exactly 100, so this can never
  // exceed 100 — no artificial clamp needed, unlike the old 0–135 scale.
  const total = Math.round(score);
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
    // 'ineligible' produces no reason here — it's handled by the hard
    // eligibility gate below, which returns "Not eligible: grade" instead.
  }

  const itemRemote    = isItemRemote(item);
  const itemNationwide = isItemNationwide(item);

  // Eligibility (location, gender, race) — same verdict as the 0% hard gate in computeMatchScore
  const eligStatus = getEligibilityStatus(item, user);
  const userStateForReasons = getUserState(user);

  if (!eligStatus.eligible) {
    // Ineligible is the single most important thing to communicate — lead with it
    const label = eligStatus.failedOn === 'gender' ? 'gender'
      : eligStatus.failedOn === 'race' ? 'race/ethnicity'
      : eligStatus.failedOn === 'grade' ? 'grade'
      : 'location';
    return [`Not eligible: ${label}`, ...reasons].slice(0, 4);
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