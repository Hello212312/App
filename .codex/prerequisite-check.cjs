const fs=require('fs');const p='utils/matching.js';let s=fs.readFileSync(p,'utf8');s=s.replace("  const gradeRange = parseGradeRange(item.gradesShort",`  if (/coursework|pre.?calculus|completed.*(?:course|year)|prerequisite/i.test(requirementText)) {
    unknown = true; checksNeeded.push('Confirm required coursework or prerequisites on the program website.');
  }
  const gradeRange = parseGradeRange(item.gradesShort`);fs.writeFileSync(p,s);
