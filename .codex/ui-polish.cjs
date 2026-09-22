const fs=require('fs');
let p='screens/SearchScreen.js',s=fs.readFileSync(p,'utf8').replace('itemIsNearMe(item, precomputed.nearbyStates || new Set())','itemIsNearMe(item, precomputed.user)');fs.writeFileSync(p,s);
p='screens/DetailScreen.js';s=fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n');
const start=s.indexOf(' {matchScore !== null && (() => {'),end=s.indexOf(' })()}',start);
if(start>=0&&end>=0)s=s.slice(0,start)+s.slice(end+7);
s=s.replace(/function matchColors\([\s\S]*?\n}\n/,'');
s=s.replace(/ const showEligibilityInfo = \(\) => \{[\s\S]*?\n };\n/,'');
s=s.replace(' <View style={{padding:16}}><MatchInsight',' <View ref={tourMatchRef} collapsable={false} style={{padding:16}}><MatchInsight');
fs.writeFileSync(p,s);
