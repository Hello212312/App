// utils/matching.test.mjs
// Test cases for the match-scoring engine in matching.js, focused on making
// sure each category awards the *correct* number of points for a given profile,
// and that the 1–5 priority weighting, the remote/in-person preference, the
// eligibility hard-gate, and birthday→age all behave as documented.
//
// Run with plain Node (no test framework needed):
//     node utils/matching.test.mjs
//
// matching.js is authored as an ES module but the app's package.json is CommonJS,
// so we copy it to a temp .mjs and import that, keeping this test dependency-free.

import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const srcPath = join(here, 'matching.js');
const tmpDir = mkdtempSync(join(tmpdir(), 'matching-'));
const tmpPath = join(tmpDir, 'matching.mjs');
writeFileSync(tmpPath, readFileSync(srcPath, 'utf8'));
writeFileSync(join(tmpDir, 'cityCoords.js'), readFileSync(join(here, 'cityCoords.js'), 'utf8'));
const M = await import(pathToFileURL(tmpPath).href);
const { computeMatchBreakdown, ageFromBirthday, getEligibilityStatus } = M;

// ─── tiny assert harness ──────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
function check(name, actual, expected) {
  const ok = actual === expected;
  if (ok) { passed += 1; }
  else {
    failed += 1;
    console.error(`  ✗ ${name}\n      expected ${expected}, got ${actual}`);
    return;
  }
  console.log(`  ✓ ${name}`);
}
function cat(breakdown, key) {
  return (breakdown.categories || []).find((c) => c.key === key);
}

// ─── shared fixtures ──────────────────────────────────────────────────────────
// A located student in Richmond, VA interested in Computer Science.
const baseUser = {
  name: 'Test',
  grade: '10th Grade',
  interests: ['Computer Science'],
  state: 'VA',
  location: 'Richmond, VA',
};

// A remote CS program that pays a stipend and is open to grades 9–12.
function csRemoteStipend(extra = {}) {
  return {
    id: 'cs-remote',
    field: 'Computer Science',
    tags: ['Computer Science', 'Engineering'],
    gradesShort: '9-12',
    payType: 'Stipend',
    remote: true,
    ...extra,
  };
}

console.log('Interests scoring');
{
  // 1 direct match that is ALSO the program's primary field → full 40.
  const b = computeMatchBreakdown(csRemoteStipend(), baseUser);
  check('primary-field interest match = 40 pts', cat(b, 'interests').points, 40);

  // A single non-primary tag match → 26.
  const item = csRemoteStipend({ field: 'Engineering' }); // primary now Engineering
  const b2 = computeMatchBreakdown(item, baseUser); // user likes CS (a tag, not primary)
  check('single non-primary interest match = 26 pts', cat(b2, 'interests').points, 26);

  // No overlap and no adjacency → 0.
  const artItem = { id: 'art', field: 'Arts', tags: ['Arts'], gradesShort: '9-12', remote: true };
  const b3 = computeMatchBreakdown(artItem, baseUser);
  check('no interest overlap = 0 pts', cat(b3, 'interests').points, 0);

  // Adjacent field (CS ~ Astronomy) → 14.
  const astro = { id: 'astro', field: 'Astronomy', tags: ['Astronomy'], gradesShort: '9-12', remote: true };
  const b4 = computeMatchBreakdown(astro, baseUser);
  check('adjacent interest = 14 pts', cat(b4, 'interests').points, 14);
}

console.log('Compensation scoring');
{
  const stipend = computeMatchBreakdown(csRemoteStipend(), baseUser);
  check('stipend = 8 pts', cat(stipend, 'compensation').points, 8);

  const fee = computeMatchBreakdown(csRemoteStipend({ payType: 'Paid' }), baseUser);
  check('program fee = 0 pts', cat(fee, 'compensation').points, 0);

  const unpaid = computeMatchBreakdown(csRemoteStipend({ payType: 'Unpaid' }), baseUser);
  check('unpaid = 3 pts', cat(unpaid, 'compensation').points, 3);
}

console.log('Baseline total (all priorities neutral)');
{
  // 40 interests + 9 grade + 15 remote-location + 8 stipend + 0 featured
  // + 0 school + 9 competitiveness(moderate) = 81 / 100.
  const b = computeMatchBreakdown(csRemoteStipend(), baseUser);
  check('grade eligible = 9 pts', cat(b, 'grade').points, 9);
  check('remote location (no pref) = 15 pts', cat(b, 'location').points, 15);
  check('baseline total = 81', b.total, 81);
}

console.log('1–5 priority weighting');
{
  // Boost interests to 5 (×1.8): interests → 72/72, everything else unchanged.
  // sumPoints 72+9+15+8+9 = 113, sumMax 72+12+24+8+3+3+10 = 132 → 86.
  const up = computeMatchBreakdown(csRemoteStipend(), { ...baseUser, priorities: { interests: 5 } });
  check('interests@5 points scaled to 72', cat(up, 'interests').points, 72);
  check('interests@5 max scaled to 72', cat(up, 'interests').max, 72);
  check('interests@5 total = 86', up.total, 86);

  // Drop interests to 1 (×0.35): interests → 14/14.
  // sumPoints 14+9+15+8+9 = 55, sumMax 14+12+24+8+3+3+10 = 74 → 74.
  const down = computeMatchBreakdown(csRemoteStipend(), { ...baseUser, priorities: { interests: 1 } });
  check('interests@1 points scaled to 14', cat(down, 'interests').points, 14);
  check('interests@1 total = 74', down.total, 74);

  // Priority 3 is the neutral default: identical to leaving priorities empty.
  const neutral = computeMatchBreakdown(csRemoteStipend(), { ...baseUser, priorities: { interests: 3 } });
  check('interests@3 total == baseline 81', neutral.total, 81);
}

console.log('Remote / in-person preference');
{
  // Prefer remote → a remote program tops out the location category (24).
  const prefRemote = computeMatchBreakdown(csRemoteStipend(), { ...baseUser, formatPreference: 'remote' });
  check('remote item + prefers remote = 24 pts', cat(prefRemote, 'location').points, 24);

  // Prefer in-person → that same remote program is halved (15 → 8).
  const prefIn = computeMatchBreakdown(csRemoteStipend(), { ...baseUser, formatPreference: 'inperson' });
  check('remote item + prefers in-person = 8 pts', cat(prefIn, 'location').points, 8);

  // In-person nearby-state program gets a small boost when in-person is preferred (8 → 9).
  const nearby = { id: 'md', field: 'Computer Science', tags: ['Computer Science'], gradesShort: '9-12', location: 'Baltimore, MD' };
  const nearbyBase = computeMatchBreakdown(nearby, baseUser);
  check('nearby in-person (no pref) = 8 pts', cat(nearbyBase, 'location').points, 8);
  const nearbyPref = computeMatchBreakdown(nearby, { ...baseUser, formatPreference: 'inperson' });
  check('nearby in-person + prefers in-person = 9 pts', cat(nearbyPref, 'location').points, 9);
}

console.log('Eligibility hard-gate → 0');
{
  // Gender restriction the profile does not meet → ineligible, total 0.
  const femaleOnly = csRemoteStipend({ requiredGender: 'female' });
  const male = computeMatchBreakdown(femaleOnly, { ...baseUser, gender: 'male' });
  check('gender-restricted program → total 0', male.total, 0);
  check('gender-restricted program → ineligible flag', male.ineligible, true);

  // Grade below the program's range → ineligible.
  const seniorOnly = csRemoteStipend({ gradesShort: '11-12' });
  const soph = computeMatchBreakdown(seniorOnly, baseUser); // 10th grader
  check('grade-restricted program → total 0', soph.total, 0);
}

console.log('Eligibility reason priority: race/gender before location');
{
  // Hidden-Genius-style program: Black-only, in a set of program-site cities,
  // students commute to the site (commuteTo: true).
  const raceGated = {
    id: 'hgp',
    field: 'Computer Science',
    remote: false,
    location: 'Oakland CA; Richmond CA; Los Angeles CA',
    requiredRace: 'Black',
    commuteTo: true,
    locationEligibility: [
      { type: 'city', state: 'CA', value: 'Oakland' },
      { type: 'city', state: 'CA', value: 'Richmond' },
      { type: 'city', state: 'CA', value: 'Los Angeles' },
    ],
  };

  // Asian student who lives in a different CA city (not in the list):
  // both location AND race would fail a naive first-match check. The real,
  // unfixable-by-relocating blocker is race, so that must be the reason shown.
  const asianOutOfCity = { ...baseUser, state: 'CA', location: 'Fresno, CA', race: ['asian'] };
  const statusOutOfCity = getEligibilityStatus(raceGated, asianOutOfCity);
  check('race reason wins over unproven location mismatch', statusOutOfCity.failedOn, 'race');

  // Same student, but actually IN a listed city: location is satisfied, so
  // race is still (and only) the reason.
  const asianInCity = { ...baseUser, state: 'CA', location: 'Oakland, CA', race: ['asian'] };
  const statusInCity = getEligibilityStatus(raceGated, asianInCity);
  check('race reason still applies for a student in a listed city', statusInCity.failedOn, 'race');

  // A Black student in a different CA city than the ones listed: since the
  // program is commute-based (commuteTo), an in-state city mismatch can't be
  // proven ineligible, so this student should NOT be hard-gated on location.
  const blackNearby = { ...baseUser, state: 'CA', location: 'Fresno, CA', race: ['black'] };
  const statusBlackNearby = getEligibilityStatus(raceGated, blackNearby);
  check('commuteTo: same-state city mismatch is not a hard location fail', statusBlackNearby.eligible, true);

  // A Black student out of state entirely: commuting is not plausible, so
  // this is a genuine, provable location fail.
  const blackOutOfState = { ...baseUser, state: 'NY', location: 'Buffalo, NY', race: ['black'] };
  const statusBlackOutOfState = getEligibilityStatus(raceGated, blackOutOfState);
  check('commuteTo: out-of-state is still a hard location fail', statusBlackOutOfState.failedOn, 'location');
}

console.log('Birthday → age');
{
  const d = new Date();
  const iso16 = `${d.getFullYear() - 16}-01-01`;
  check('ageFromBirthday computes 16', ageFromBirthday(iso16), 16);
  check('ageFromBirthday(null) → null', ageFromBirthday(null), null);

  // A 16+ program with a birthday that makes the student 14 → age hard-gate.
  const iso14 = `${d.getFullYear() - 14}-01-01`;
  const age16plus = csRemoteStipend({ minAge: 16 });
  const young = computeMatchBreakdown(age16plus, { ...baseUser, birthday: iso14 });
  check('under-min-age via birthday → total 0', young.total, 0);

  // Same program, birthday making them 17 → eligible (non-zero).
  const iso17 = `${d.getFullYear() - 17}-06-15`;
  const oldEnough = computeMatchBreakdown(age16plus, { ...baseUser, birthday: iso17 });
  check('meets min age via birthday → eligible', oldEnough.ineligible, false);
}

console.log('Radius-based "within N miles of X" region eligibility');
{
  // Regression test for the real HERO (UT Austin) program: item.location is
  // "Remote" but eligibility is gated to within 50 miles of Austin, TX.
  const heroLikeItem = {
    locationEligibility: [{ type: 'region', state: 'TX', value: 'Within 50 miles of Austin' }],
    location: 'Remote',
  };

  // Katy, TX is ~131 miles from Austin — same state, but well outside the
  // stated radius, so this must be a hard eligibility fail, not "unknown".
  const katyUser = { location: 'Katy, TX', school: { city: 'Katy', state: 'TX' } };
  check('same-state but 131mi away, past the radius margin → ineligible',
    getEligibilityStatus(heroLikeItem, katyUser).eligible, false);

  // Round Rock, TX is ~27 miles from Austin — inside the radius.
  const roundRockUser = { location: 'Round Rock, TX', school: { city: 'Round Rock', state: 'TX' } };
  check('within the stated radius → eligible',
    getEligibilityStatus(heroLikeItem, roundRockUser).eligible, true);

  // No resolvable city on the profile: can't disprove it, so stays eligible
  // (unknown), consistent with this file's "never zero what we can't prove" rule.
  const noCityUser = { state: 'TX', grade: '11' };
  check('unresolvable user city → still eligible (unknown, not zeroed)',
    getEligibilityStatus(heroLikeItem, noCityUser).eligible, true);
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
