// Read-only audit probes against the current app implementation.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '../../..');
const dir = mkdtempSync(join(tmpdir(), 'interny-audit-'));
writeFileSync(join(dir, 'matching.mjs'), readFileSync(join(root, 'utils/matching.js'), 'utf8').replace("'./cityCoords.js'", "'./cityCoords.mjs'"));
writeFileSync(join(dir, 'cityCoords.mjs'), readFileSync(join(root, 'utils/cityCoords.js'), 'utf8'));
const M = await import(pathToFileURL(join(dir, 'matching.mjs')).href);
const student = { grade: '10th Grade', interests: ['Computer Science'], state: 'VA', location: 'Richmond, VA' };
const program = { id: 'audit-fixture', field: 'Computer Science', tags: ['Computer Science'], gradesShort: '9-12', payType: 'Stipend', remote: true };
const results = [];
function probe(name, item = program, user = student) {
  const b = M.computeMatchBreakdown(item, user);
  results.push({ name, score: b?.total ?? null, eligibility: M.getEligibilityStatus(item,user), ageFit: M.ageFitLevel(item,user), reasons: M.computeMatchReasons(item,user), categories: b?.categories ?? [] });
}
probe('Missing birthday, requires age 16+', {...program,minAge:16});
probe('Missing gender, explicitly female-only', {...program,requiredGender:'female'});
probe('Only grade entered', program, {grade:'10th Grade'});
probe('Only a default priority entered', program, {priorities:{interests:3}});
probe('Stay local: Richmond VA student, Los Angeles CA program', {...program,remote:false,location:'Los Angeles, CA'}, {...student,travelWillingness:'local'});
probe('Stay local + interests most important: distant program', {...program,remote:false,location:'Los Angeles, CA'}, {...student,travelWillingness:'local',priorities:{interests:5}});
probe('Stay local: San Diego CA student, San Francisco CA program', {...program,remote:false,location:'San Francisco, CA'}, {...student,state:'CA',location:'San Diego, CA',travelWillingness:'local'});
probe('Unknown pay information', {...program,payType:null});
probe('Featured on', {...program,featured:true});
probe('Featured off');
probe('Low GPA, prestige priority 5: competitive', {...program,competitiveness:'competitive'}, {...student,gpaRange:'below',priorities:{competitiveness:5}});
probe('Low GPA, prestige priority 5: open', {...program,competitiveness:'open'}, {...student,gpaRange:'below',priorities:{competitiveness:5}});
probe('Remote-only: nationwide in-person location', {...program,remote:false,location:'Various locations nationwide'}, {...student,remoteOnly:true});
probe('Age text in grade field: Ages 10-18, actual grade 11', {...program,gradesShort:'Ages 10-18'}, {...student,grade:'11th Grade',age:16});
probe('Explicit Oregon location with ambiguous city lookup', {...program,remote:false,location:'Portland, ME'}, {...student,state:'OR',location:'Eugene, OR'});
console.log(JSON.stringify({date:new Date().toISOString(),fixtures:'Synthetic diagnostic inputs; not real program listings or screenshot content.',remoteOnlyNationwidePasses:M.isLocationEligible({remote:false,location:'Various locations nationwide'},{remoteOnly:true}),results},null,2));
