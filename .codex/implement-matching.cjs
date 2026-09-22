const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const file = path.join(root, 'utils/matching.js');
let s = fs.readFileSync(path.join(__dirname,'implementation-baseline/matching.js'), 'utf8').replace(/\r\n/g,'\n');
fs.mkdirSync(path.join(__dirname, 'implementation-baseline'), {recursive:true});
if (!fs.existsSync(path.join(__dirname,'implementation-baseline/matching.js'))) fs.copyFileSync(file,path.join(__dirname,'implementation-baseline/matching.js'));
s = s.replace("  // Try city lookup FIRST", "  // Explicit state abbreviations outrank ambiguous city names.\n  const explicit = locationStr.match(/(?:^|[\\s,;/()])([A-Z]{2})(?=$|[\\s,;/().])/g) || [];\n  const explicitStates = [...new Set(explicit.map(x => x.trim().replace(/^[,;/()]+/, '').trim()).filter(x => ALL_STATE_ABBREVS.has(x)))];\n  if (explicitStates.length) return explicitStates;\n\n  // Try city lookup FIRST");
s = s.replace("function isItemRemote(item)", "export function isItemRemote(item)");
s = s.replace("    return isNationwideOrRemote(item);", "    return isItemRemote(item);");
s = s.replace("  const lower = gradesShort.toLowerCase();", "  const lower = String(gradesShort).toLowerCase();\n  if (/\\bage(?:s)?\\b/.test(lower) && !/\\bgrade/.test(lower)) return null;");
s = s.replace("  const m = gradeStr.match(/\\d+/);", "  const m = String(gradeStr).match(/\\d+/);");
s = s.replace("    return { min: nums[0], max: nums[0] };", "    return { min: nums[0], max: nums[0] };");
const ageStart = s.indexOf('export function ageFitLevel(');
const ageEnd = s.indexOf('\nfunction gradeNumFitLevel',ageStart);
s = s.slice(0,ageStart)+`export function ageFitLevel(item, user) {
  const minAge = Number(item?.minAge) || null;
  const maxAge = Number(item?.maxAge) || null;
  if (!minAge && !maxAge) return 'eligible';
  const reference = item.ageAsOfDate || item.startDate || null;
  const birthdayAge = ageFromBirthday(user?.birthday, reference);
  const age = birthdayAge ?? (!reference && user?.age != null ? Number(user.age) : null);
  if (!Number.isFinite(age) || age < 0 || age > 120) return 'unknown';
  if ((minAge && age < minAge) || (maxAge && age > maxAge)) {
    // Without the program's cutoff date, today's age cannot prove a future rejection.
    return reference ? 'ineligible' : 'unknown';
  }
  return 'eligible';
}
`+s.slice(ageEnd);
s = s.replace("  const GRADE_TYPICAL_AGE", "  const GRADE_TYPICAL_AGE");
s = s.replace(/^const GRADE_TYPICAL_AGE.*\r?\n/m,'');
s = s.replace("  const tagsLower = (item.tags || []).map", "  const tagsLower = (item.tags || []).map");
s = s.replace("  const tagStipend = tagsLower.includes('stipend') || tagsLower.some((t) => t.includes('stipend'));", "  const tagStipend = tagsLower.includes('stipend');");
s = s.replace("  return { isStipend: false, isPaid: false, isUnpaid: true };\n}", "  if (/\\b(unpaid|volunteer)\\b/.test(body) && !/\\b(fee|tuition)\\b/.test(body)) return { isStipend: false, isPaid: false, isUnpaid: true };\n  return { isStipend: false, isPaid: false, isUnpaid: false, isUnknown: true };\n}");
const locStart=s.indexOf('export function getLocationEligibility('), locEnd=s.indexOf('\n//',s.indexOf('\n}',locStart)+2);
s=s.slice(0,locStart)+`export function getLocationEligibility(item, user) {
  const entries = getLocationEligibilityEntries(item);
  const requiredStates = [...new Set(entries.flatMap(e => e.type === 'state' ? extractStatesFromLocation(String(e.value).toUpperCase()) : (e.state ? [e.state.toUpperCase()] : [])))];
  if (!entries.length) return {status:'eligible', entries, requiredStates, label:''};
  const label = entries.map(describeLocationEntry).join('; ');
  const results = entries.map(entry => {
    const schoolScope = entry.scope === 'school' || entry.type === 'district' || entry.type === 'school';
    const homeKnown = user?.locationConfirmed === true || (!user?.school && user?.locationSource !== 'school');
    const state = schoolScope ? user?.school?.state : (homeKnown ? getUserState(user) : '');
    const city = schoolScope ? user?.school?.city : (homeKnown ? getUserCity(user) : '');
    if (entry.type === 'school') return !user?.school ? 'unknown' : (normalizeName(entry.value) === normalizeName(user.school.name) ? 'match' : 'fail');
    return evaluateLocationEntry(entry, {knownStates:state ? [state] : [], cities:city ? [normalizeName(city)] : [], district:schoolScope ? normalizeName(user?.school?.district) : '', commuteTo:entry.scope === 'site', cityStatePairs:city && state ? [{city:normalizeName(city),state}] : []});
  });
  return {status:results.includes('match') ? 'eligible' : results.includes('unknown') ? 'unknown' : 'ineligible',entries,requiredStates,label};
}
`+s.slice(locEnd);
s=s.replace("  let unknown = false;", "  let unknown = false;\n  const checksNeeded = [];\n  const gradeRange = parseGradeRange(item.gradesShort || item.grades || '');\n  if (!user.grade || !gradeRange) { unknown = true; checksNeeded.push(!user.grade ? 'Add your grade to check the grade requirement.' : 'Confirm the grade range on the program website.'); }");
s=s.replace("  if (ageFit === 'unknown' && (item.minAge || item.maxAge)) unknown = true;", "  if (ageFit === 'unknown' && (item.minAge || item.maxAge)) { unknown = true; checksNeeded.push(user.birthday ? 'Confirm the program’s age cutoff date.' : 'Add your birthday and confirm the program’s age requirement.'); }");
s=s.replace("      unknown = true;\n    } else if (!requiredGenders", "      unknown = true; checksNeeded.push('Confirm the listed gender eligibility requirement; sharing your answer is optional.');\n    } else if (!requiredGenders");
s=s.replace("      unknown = true;\n    } else if (!userRaces", "      unknown = true; checksNeeded.push('Confirm the listed race/ethnicity eligibility requirement; sharing your answer is optional.');\n    } else if (!userRaces");
s=s.replace("  if (locElig.status === 'unknown') unknown = true;", "  if (locElig.status === 'unknown') { unknown = true; checksNeeded.push('Confirm location eligibility: ' + locElig.label); }");
s=s.replace("eligible: true, unknown: true, requiredStates", "eligible: true, unknown: true, checksNeeded, requiredStates");
const start=s.indexOf('// ─── MATCH SCORE'),end=s.indexOf('// COMPETITIVENESS',start);
const newScorer=fs.readFileSync(path.join(__dirname,'matching-v2.txt'),'utf8');
s=s.slice(0,start)+newScorer+'\n'+s.slice(end);
s=s.replace("  const age = (user && (ageFromBirthday(user.birthday) || Number(user.age))) || null;", "  const age = ageFromBirthday(user?.birthday) ?? Number(user?.age);");
s=s.replace(/function gradeNumFitLevel\([\s\S]*?\n}\n/,'');
s=s.replace("const total=interests.length && denominator ?", "const enoughProfile = interests.length && user.grade && (user.remoteOnly || user.locationConfirmed && user.location) && user.logisticsAnswered;\n  const total=enoughProfile && denominator ?");
s=s.replace("if(b.eligibility.unknown || b.practical.status==='unknown')return 'Needs confirmation';", "if(b.checksNeeded.length)return 'Needs confirmation';").replace("if(b.eligibility.unknown || b.practical.status==='unknown' || b.total===null)return 1;", "if(b.checksNeeded.length || b.total===null)return 1;");
fs.writeFileSync(file,s);
