const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const W = 1080;
const H = 1350;
const root = __dirname;
const outRoot = path.join(root, 'professional-carousels');
const photoDir = path.join(root, 'generated-photography');
const iconPath = path.resolve(root, '..', '..', 'assets', 'images', 'icon.png');
const matchPath = path.resolve(root, '..', '..', 'assets', 'tour', 'tour-match.png');

const C = {
  paper: '#F8FAFC', white: '#FFFFFF', ink: '#0F172A', muted: '#64748B',
  border: '#E2E8F0', blue: '#2563EB', blueSoft: '#EFF6FF', green: '#10B981',
  greenSoft: '#ECFDF5', amber: '#F59E0B', amberSoft: '#FFFBEB', red: '#7F1D1D',
  redSoft: '#FEF2F2'
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const tspans = (lines, x, y, size, lineHeight, weight = 700, fill = C.ink, anchor = 'start') =>
  `<text x="${x}" y="${y}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${lines.map((l, i) => `<tspan x="${x}" dy="${i ? lineHeight : 0}">${esc(l)}</tspan>`).join('')}</text>`;

const brand = (index, total, accent = C.blue) => `
  <text x="72" y="78" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="24" font-weight="750" letter-spacing="2" fill="${C.ink}">INTERNY</text>
  <circle cx="205" cy="70" r="5" fill="${accent}"/>
  <text x="1008" y="78" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="22" font-weight="650" fill="${C.muted}" text-anchor="end">${index} / ${total}</text>
  <line x1="72" y1="108" x2="1008" y2="108" stroke="${C.border}" stroke-width="2"/>`;

const footer = (text, accent = C.blue) => `
  <line x1="72" y1="1245" x2="1008" y2="1245" stroke="${C.border}" stroke-width="2"/>
  <circle cx="84" cy="1288" r="6" fill="${accent}"/>
  <text x="104" y="1296" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="22" font-weight="600" fill="${C.muted}">${esc(text)}</text>`;

const shell = (inner, bg = C.paper) => Buffer.from(`<svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1350" fill="${bg}"/>${inner}</svg>`);
const rect = (x, y, w, h, fill, r = 20, stroke = 'none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const chip = (x, y, label, fill = C.blueSoft, color = C.blue, w = 190) => `${rect(x,y,w,48,fill,24)}<text x="${x+w/2}" y="${y+32}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="19" font-weight="750" fill="${color}" text-anchor="middle" letter-spacing=".5">${esc(label)}</text>`;

async function saveSvg(dir, n, inner, bg) {
  fs.mkdirSync(dir, { recursive: true });
  await sharp(shell(inner, bg)).png().toFile(path.join(dir, `${String(n).padStart(2,'0')}.png`));
}

async function cover(dir, n, photo, eyebrow, headline, sub, accent, dark = true) {
  fs.mkdirSync(dir, { recursive: true });
  const overlay = Buffer.from(`<svg width="1080" height="1350" xmlns="http://www.w3.org/2000/svg">
    <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#07111F" stop-opacity=".78"/><stop offset=".58" stop-color="#07111F" stop-opacity=".46"/><stop offset="1" stop-color="#07111F" stop-opacity=".82"/></linearGradient></defs>
    <rect width="1080" height="1350" fill="url(#g)"/>
    <text x="72" y="82" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="24" font-weight="750" letter-spacing="2" fill="#FFFFFF">INTERNY</text><circle cx="205" cy="74" r="5" fill="${accent}"/>
    <text x="72" y="210" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="750" letter-spacing="2.4" fill="${accent}">${esc(eyebrow.toUpperCase())}</text>
    ${tspans(headline,72,300,82,92,760,'#FFFFFF')}
    ${tspans(sub,72,690,32,43,500,'#E2E8F0')}
    <line x1="72" y1="1238" x2="1008" y2="1238" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="2"/>
    <text x="72" y="1290" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="24" font-weight="700" fill="#FFFFFF">SWIPE TO SEE THE SYSTEM</text>
    <text x="1008" y="1290" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="34" font-weight="600" fill="${accent}" text-anchor="end">→</text>
  </svg>`);
  await sharp(photo).resize(W,H,{fit:'cover'}).composite([{input:overlay}]).png().toFile(path.join(dir,`${String(n).padStart(2,'0')}.png`));
}

async function setSearch() {
  const dir = path.join(outRoot, '01-searching-wrong');
  await cover(dir,1,path.join(photoDir,'internship-search.jpg'),'SEARCH STRATEGY',['You’re searching','for internships','wrong.'],['Use this three-part search instead.'], '#60A5FA');

  await saveSvg(dir,2,`${brand(2,6)}
    ${chip(72,156,'THE WEAK SEARCH',C.redSoft,C.red,230)}
    ${tspans(['“high school internships','near me”'],72,260,68,78,760)}
    ${rect(72,470,936,116,C.white,18,C.border)}
    <circle cx="126" cy="528" r="22" fill="none" stroke="${C.muted}" stroke-width="4"/><line x1="143" y1="545" x2="160" y2="562" stroke="${C.muted}" stroke-width="4"/>
    <text x="188" y="541" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="30" fill="${C.muted}">high school internships near me</text>
    ${['Generic results','Expired pages','Programs you cannot join'].map((x,i)=>{const y=650+i*126;return `${rect(72,y,936,94,C.white,16,C.border)}<circle cx="116" cy="${y+47}" r="12" fill="${C.red}"/><text x="150" y="${y+58}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="29" font-weight="650" fill="${C.ink}">${x}</text>`}).join('')}
    ${tspans(['Broad search creates more scrolling,','not better opportunities.'],72,1085,31,43,520,C.muted)}${footer('Next: the query formula')}`);

  await saveSvg(dir,3,`${brand(3,6)}
    ${chip(72,156,'THE BETTER FORMULA',C.blueSoft,C.blue,254)}
    ${tspans(['Search with','three constraints.'],72,260,68,78,760)}
    ${[['01','ROLE + FIELD','software · medicine · research'],['02','GRADE + LOCATION','11th grade · remote · Virginia'],['03','DEADLINE + PAY','September · stipend']].map((r,i)=>{const y=510+i*176;return `${rect(72,y,936,140,C.white,20,C.border)}<text x="112" y="${y+57}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="750" fill="${C.blue}">${r[0]}</text><text x="188" y="${y+53}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="30" font-weight="760" fill="${C.ink}">${r[1]}</text><text x="188" y="${y+95}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="24" fill="${C.muted}">${r[2]}</text>`}).join('')}
    ${rect(72,1075,936,112,C.ink,18)}<text x="112" y="1122" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="19" font-weight="700" fill="#93C5FD">EXAMPLE</text><text x="112" y="1162" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="25" font-weight="600" fill="#FFFFFF">remote biology internship · grade 11 · stipend</text>${footer('Specific inputs → useful results')}`);

  await saveSvg(dir,4,`${brand(4,6)}
    ${chip(72,156,'VERIFY THE LISTING',C.greenSoft,'#047857',230)}
    ${tspans(['Five checks before','you apply.'],72,260,68,78,760)}
    ${[['01','Official program page'],['02','Your grade is eligible'],['03','Deadline is current'],['04','Pay language is clear'],['05','Location actually works']].map((r,i)=>{const y=500+i*116;return `<line x1="72" y1="${y+94}" x2="1008" y2="${y+94}" stroke="${C.border}" stroke-width="2"/><circle cx="104" cy="${y+43}" r="24" fill="${C.greenSoft}"/><path d="M93 ${y+43} l8 8 l15 -18" fill="none" stroke="#047857" stroke-width="5" stroke-linecap="round"/><text x="158" y="${y+54}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="31" font-weight="650" fill="${C.ink}">${r[1]}</text>`}).join('')}
    ${tspans(['A real URL is not enough.','Every detail has to match you.'],72,1135,29,40,520,C.muted)}${footer('Save this checklist')}`);

  await saveSvg(dir,5,`${brand(5,6)}
    ${chip(72,156,'TRACK THE SHORTLIST',C.amberSoft,'#B45309',250)}
    ${tspans(['Stop keeping','deadlines in your head.'],72,260,62,72,760)}
    ${[['FOUND','Research assistant','Due Sep 18',C.blue],['APPLYING','Software intern','2 tasks left',C.amber],['SUBMITTED','Youth council','Sent Sep 03',C.green]].map((r,i)=>{const y=520+i*185;return `${rect(72,y,936,150,C.white,20,C.border)}<rect x="72" y="${y}" width="12" height="150" rx="6" fill="${r[3]}"/><text x="118" y="${y+42}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="18" font-weight="760" letter-spacing="1.6" fill="${r[3]}">${r[0]}</text><text x="118" y="${y+88}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="31" font-weight="720" fill="${C.ink}">${r[1]}</text><text x="850" y="${y+88}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="23" font-weight="600" fill="${C.muted}" text-anchor="end">${r[2]}</text>`}).join('')}
    ${footer('A system beats another open tab')}`);

  await saveSvg(dir,6,`${brand(6,6)}
    ${chip(72,156,'BUILT FOR THIS',C.blueSoft,C.blue,200)}
    ${tspans(['Find. Filter.','Track. Apply.'],72,260,72,82,770)}
    ${rect(72,485,936,500,C.white,24,C.border)}
    <text x="120" y="545" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="21" font-weight="750" fill="${C.blue}">INTERNY SEARCH</text>
    <text x="120" y="602" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="34" font-weight="720" fill="${C.ink}">Verified opportunities for high schoolers</text>
    ${chip(120,650,'GRADE 11',C.blueSoft,C.blue,170)}${chip(306,650,'REMOTE',C.blueSoft,C.blue,154)}${chip(476,650,'SCIENCE',C.blueSoft,C.blue,170)}
    ${rect(120,744,840,154,C.paper,18,C.border)}<circle cx="174" cy="821" r="26" fill="${C.greenSoft}"/><path d="M161 821 l9 9 l18 -22" fill="none" stroke="${C.green}" stroke-width="5"/><text x="222" y="805" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="29" font-weight="720" fill="${C.ink}">Verified listing</text><text x="222" y="846" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="23" fill="${C.muted}">Eligibility and deadline checked</text>
    ${tspans(['700+ opportunities. Free to browse.'],72,1075,34,44,680,C.ink)}
    ${rect(72,1150,590,66,C.blue,18)}<text x="367" y="1192" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="19" font-weight="720" fill="#FFFFFF" text-anchor="middle">SEARCH “HIGH SCHOOL INTERNSHIPS”</text>${footer('Save this before your next search')}`);
}

async function setCornell() {
  const dir = path.join(outRoot, '02-cornell-profile-decoded');
  await cover(dir,1,path.join(photoDir,'college-profile.jpg'),'ADMISSIONS PROFILE',['The Cornell CS','admit profile,','decoded.'],['Copy the strategy — not the stats.'], '#FCA5A5');

  await saveSvg(dir,2,`${brand(2,6,C.red)}
    ${chip(72,156,'THE ACADEMIC BASELINE',C.redSoft,C.red,286)}
    ${tspans(['The numbers were','already elite.'],72,260,68,78,760)}
    ${[['3.97','UNWEIGHTED GPA'],['1560','SAT'],['11','AP COURSES']].map((r,i)=>{const x=72+i*312;return `${rect(x,520,288,245,C.white,20,C.border)}<text x="${x+28}" y="625" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="70" font-weight="780" fill="${C.red}">${r[0]}</text><text x="${x+28}" y="690" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="19" font-weight="750" letter-spacing="1" fill="${C.muted}">${r[1]}</text>`}).join('')}
    ${rect(72,850,936,188,C.ink,20)}${tspans(['But strong academics explain readiness —','not what made the profile memorable.'],112,918,31,45,560,'#FFFFFF')}
    ${tspans(['The differentiation came next.'],72,1135,31,42,650,C.muted)}${footer('Profile details supplied by creator',C.red)}`);

  await saveSvg(dir,3,`${brand(3,6,C.red)}
    ${chip(72,156,'EXTERNAL PROOF',C.redSoft,C.red,200)}
    ${tspans(['The work produced','visible outcomes.'],72,260,68,78,760)}
    ${[['8,000+','mobile app users'],['1','co-authored paper'],['1st','state science fair'],['Winner','Congressional App Challenge']].map((r,i)=>{const col=i%2,row=Math.floor(i/2),x=72+col*476,y=520+row*232;return `${rect(x,y,444,196,C.white,20,C.border)}<text x="${x+30}" y="${y+78}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="52" font-weight="780" fill="${C.red}">${r[0]}</text><text x="${x+30}" y="${y+132}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="25" font-weight="620" fill="${C.ink}">${r[1]}</text>`}).join('')}
    ${rect(72,1040,936,116,C.red,18)}<text x="540" y="1112" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="35" font-weight="730" fill="#FFFFFF" text-anchor="middle">Proof beats a long activity list.</text>${footer('Outcomes make claims credible',C.red)}`);

  await saveSvg(dir,4,`${brand(4,6,C.red)}
    ${chip(72,156,'THE THROUGHLINE',C.redSoft,C.red,200)}
    ${tspans(['The activities told','one coherent story.'],72,260,68,78,760)}
    <line x1="118" y1="530" x2="118" y2="1040" stroke="${C.border}" stroke-width="6"/>
    ${[['01','Build','Launched a mobile app'],['02','Research','Co-authored university work'],['03','Lead','Math club president'],['04','Apply','Software engineering intern']].map((r,i)=>{const y=500+i*145;return `<circle cx="118" cy="${y+52}" r="27" fill="${C.red}"/><text x="118" y="${y+60}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="17" font-weight="760" fill="#FFFFFF" text-anchor="middle">${r[0]}</text><text x="180" y="${y+42}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="24" font-weight="760" fill="${C.red}">${r[1].toUpperCase()}</text><text x="180" y="${y+82}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="30" font-weight="650" fill="${C.ink}">${r[2]}</text>`}).join('')}
    ${footer('Depth + consistency > random prestige',C.red)}`);

  await saveSvg(dir,5,`${brand(5,6,C.red)}
    ${chip(72,156,'WHAT TO COPY',C.redSoft,C.red,180)}
    ${tspans(['Copy the strategy.','Not the résumé.'],72,260,68,78,760)}
    ${[['01','Build something useful'],['02','Earn outside validation'],['03','Stay in one lane long enough'],['04','Connect the work into a story']].map((r,i)=>{const y=520+i*145;return `${rect(72,y,936,112,C.white,18,C.border)}<text x="110" y="${y+68}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="760" fill="${C.red}">${r[0]}</text><text x="180" y="${y+70}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="31" font-weight="680" fill="${C.ink}">${r[1]}</text>`}).join('')}
    ${tspans(['One admitted student is not a formula.','The transferable part is how the work compounds.'],72,1145,27,38,520,C.muted)}${footer('Save the framework, skip the comparison',C.red)}`);

  await saveSvg(dir,6,`${brand(6,6,C.red)}
    ${chip(72,156,'BUILD THE EXPERIENCE',C.blueSoft,C.blue,250)}
    ${tspans(['Your résumé starts','before application season.'],72,260,62,72,760)}
    ${rect(72,510,936,440,C.white,24,C.border)}
    <text x="120" y="575" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="21" font-weight="750" fill="${C.blue}">INTERNY</text>
    <text x="120" y="642" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="38" font-weight="730" fill="${C.ink}">Find work worth talking about.</text>
    ${[['VERIFIED','Real program pages'],['FILTERED','Grade + field + location'],['TRACKED','Deadlines in one place']].map((r,i)=>{const y=710+i*76;return `<circle cx="132" cy="${y}" r="8" fill="${C.blue}"/><text x="160" y="${y+8}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="20" font-weight="760" fill="${C.blue}">${r[0]}</text><text x="318" y="${y+8}" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="25" font-weight="560" fill="${C.ink}">${r[1]}</text>`}).join('')}
    ${rect(72,1040,936,100,C.ink,18)}<text x="540" y="1102" font-family="Inter,Segoe UI,Arial,sans-serif" font-size="29" font-weight="700" fill="#FFFFFF" text-anchor="middle">SEARCH “HIGH SCHOOL INTERNSHIPS” ON THE APP STORE</text>
    ${footer('Send this to someone building their list',C.red)}`);
}

async function contactSheet(dirName) {
  const dir = path.join(outRoot, dirName);
  const files = fs.readdirSync(dir).filter(f=>f.endsWith('.png')).sort();
  const thumbW=360, thumbH=450, gap=24;
  const canvas = sharp({create:{width:thumbW*3+gap*4,height:thumbH*2+gap*3,channels:4,background:'#E2E8F0'}});
  const comps=[];
  for(let i=0;i<files.length;i++){
    const buf=await sharp(path.join(dir,files[i])).resize(thumbW,thumbH,{fit:'cover'}).toBuffer();
    comps.push({input:buf,left:gap+(i%3)*(thumbW+gap),top:gap+Math.floor(i/3)*(thumbH+gap)});
  }
  await canvas.composite(comps).png().toFile(path.join(outRoot,`${dirName}-contact-sheet.png`));
}

(async()=>{
  fs.mkdirSync(outRoot,{recursive:true});
  await setSearch();
  await setCornell();
  await contactSheet('01-searching-wrong');
  await contactSheet('02-cornell-profile-decoded');
  console.log(outRoot);
})().catch(err=>{console.error(err);process.exit(1)});
