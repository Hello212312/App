const fs=require('fs');
const src=fs.readFileSync('utils/supabase.js','utf8');
const url=src.match(/const SUPABASE_URL = '([^']+)'/)[1];
const key=src.match(/const SUPABASE_PUBLISHABLE_KEY = '([^']+)'/)[1];
fetch(url+'/rest/v1/Internships?select=*&order=featured.desc,deadline_date.asc.nullslast',{headers:{apikey:key}}).then(async r=>{if(!r.ok)throw new Error('Catalog fetch HTTP '+r.status); const rows=await r.json();fs.writeFileSync('.codex/live-catalog.json',JSON.stringify(rows)); console.log('Read '+rows.length+' live catalog rows');}).catch(e=>{console.error(e.message);process.exitCode=1});
