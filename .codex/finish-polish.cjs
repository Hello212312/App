const fs=require('fs');
let p='screens/DetailScreen.js',s=fs.readFileSync(p,'utf8');
const card=' <View ref={tourMatchRef} collapsable={false} style={{padding:16}}><MatchInsight breakdown={matchBreakdown} onPress={() => setShowMatchBreakdown(true)} /></View>';
s=s.replace(card,'').replace(' {/* Tags + competitiveness + deadline */}'," <View ref={tourMatchRef} collapsable={false}><MatchInsight compact breakdown={matchBreakdown} onPress={() => setShowMatchBreakdown(true)} /></View>\n {/* Tags + competitiveness + deadline */}");
s=s.replace(/ const eligibility = useMemo\(.*?\);\r?\n/,'');
fs.writeFileSync(p,s);
p='screens/OnboardingScreen.js';s=fs.readFileSync(p,'utf8');s=s.replace("const update=(patch)=>setProfile(prev=>({...prev,...patch}));","const update=(patch)=>setProfile(prev=>{const next={...prev,...patch}; if(!next.interests.includes(next.primaryInterest))next.primaryInterest=''; return next;});");s=s.replace('      await AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY);','      // UserContext clears the draft only after the completed profile is durably saved.');fs.writeFileSync(p,s);
p='context/UserContext.js';s=fs.readFileSync(p,'utf8');s=s.replace('AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((e) =>',"AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).then(() => {\n        if (data.user.onboardingDone) return AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY);\n      }).catch((e) =>");fs.writeFileSync(p,s);
