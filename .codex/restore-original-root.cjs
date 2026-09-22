const fs=require('fs');let p='data.js',s=fs.readFileSync(p,'utf8');s=s.replace(/ ageAsOfDate: row.age_as_of_date[^\n]*\n startDate:[\s\S]*? longitude:[^\n]*\n/,'').replace("deadline: row.deadline ?? ''","deadline: row.deadline ?? 'Rolling'");fs.writeFileSync(p,s);
p='App.js';s=fs.readFileSync(p,'utf8').replace('captureTouches: false','captureTouches: true');fs.writeFileSync(p,s);
