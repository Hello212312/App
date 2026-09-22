const fs=require('fs');let p='utils/matching.js',s=fs.readFileSync(p,'utf8');const a=s.indexOf('// Remote detection:'),b=s.indexOf('\nfunction isItemNationwide',a);s=s.slice(0,a)+`// Explicit hybrid/on-site text takes precedence over a broad remote flag.
export function isItemRemote(item) {
  const loc = (item.locationFormat || item.location || '').toLowerCase();
  if (/hybrid|in[ -]?person|on[ -]?site/.test(loc)) return false;
  if (/^(remote|virtual|online)\\b/.test(loc)) return true;
  return item.remote === true && !loc;
}
`+s.slice(b);
s=s.replace('  const checksNeeded = [];\n  const gradeRange',`  const checksNeeded = [];
  const requirementText = String(item.requirements || '');
  if (/citizen|permanent resident|work authori[sz]ation|visa/i.test(requirementText)) {
    unknown = true; checksNeeded.push('Confirm citizenship or work-authorization requirements on the program website.');
  }
  if (/GPA|grade.point average/i.test(requirementText)) {
    unknown = true; checksNeeded.push('Confirm the program’s GPA requirement and accepted grading scale.');
  }
  if (/neurodivergen|neurodivers|autis|disabilit/i.test(requirementText)) {
    unknown = true; checksNeeded.push('Confirm any additional participation requirements on the program website.');
  }
  const gradeRange`);
fs.writeFileSync(p,s);
p='screens/OnboardingScreen.js';s=fs.readFileSync(p,'utf8').replace('<KeyboardAvoidingView style={{flex:1}}','<KeyboardAvoidingView style={{flex:1,minHeight:0}}').replace('<ScrollView ref={scroll} keyboardShouldPersistTaps','<ScrollView ref={scroll} style={{flex:1,minHeight:0}} keyboardShouldPersistTaps').replace('safe:{flex:1,backgroundColor:Colors.background}','safe:{flex:1,minHeight:0,...(Platform.OS===\'web\'?{height:\'100vh\'}:{}),backgroundColor:Colors.background}').replace('We’re loading your opportunities.','Your opportunities aren’t available yet.');fs.writeFileSync(p,s);
