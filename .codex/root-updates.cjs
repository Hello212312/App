const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
let file=path.join(root,'data.js'),s=fs.readFileSync(file,'utf8');
if(!s.includes('ageAsOfDate:')) s=s.replace(' minAge: row.min_age ?? null,',` ageAsOfDate: row.age_as_of_date ?? null,
 startDate: row.start_date ?? null,
 endDate: row.end_date ?? null,
 latitude: typeof row.latitude === 'number' ? row.latitude : null,
 longitude: typeof row.longitude === 'number' ? row.longitude : null,
 minAge: row.min_age ?? null,`);
fs.writeFileSync(file,s);
file=path.join(root,'package.json');const pkg=JSON.parse(fs.readFileSync(file,'utf8'));pkg.dependencies['@expo/vector-icons']='^15.0.3';pkg.dependencies['expo-font']='~14.0.10';fs.writeFileSync(file,JSON.stringify(pkg,null,2)+'\n');
