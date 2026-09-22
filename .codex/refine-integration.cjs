const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
function edit(file,fn){const p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8').replace(/\r\n/g,'\n')));}
edit('screens/SearchScreen.js',s=>{
 s=s.replace('getRecommendationTier, isItemExpired','getRecommendationTier, isItemExpired, isItemRemote, getPracticalFit');
 s=s.replace('const user = _ctx.user || {};','const user = useMemo(() => _ctx.user || {}, [_ctx.user]);');
 s=s.replace(/function itemIsEffectivelyRemote\(item\) \{[\s\S]*?\n}/,'function itemIsEffectivelyRemote(item) { return isItemRemote(item); }');
 s=s.replace(/function itemIsNearMe\(item, nearbyStates\) \{[\s\S]*?\n}/,"function itemIsNearMe(item, user) {\n if (!user?.locationConfirmed || isItemRemote(item)) return false;\n const fit=getPracticalFit(item,{...user,travelWillingness:'local',remoteOnly:false});\n return fit.distanceMiles !== null && fit.distanceMiles <= (user.maxCommuteMiles || 25);\n}");
 s=s.replace('itemIsNearMe(item, precomputed?.nearbyStates || new Set())','itemIsNearMe(item, precomputed?.user)');
 s=s.replace(/itemIsNearMe\(item, precomputed\?\.nearbyStates\)/g,'itemIsNearMe(item, precomputed?.user)');
 s=s.replaceAll('nearbyStates });','nearbyStates, user });');
 s=s.replaceAll('[user.state, user.location]','[user]');
 s=s.replaceAll("'Free'","'Unpaid'");
 s=s.replace("const { isPaid, isStipend } = detectPayType(item);","const { isPaid, isStipend, isUnpaid } = detectPayType(item);");
 s=s.replace('hasStipendTag: isStipend };','hasStipendTag: isStipend, isUnpaid };');
 s=s.replace("return !hasPaidTag && !hasStipendTag;","return detectPayType(item).isUnpaid;");
 return s;
});
edit('utils/notifications.js',s=>s.replace('const matchPct = breakdown ? breakdown.total : null;','const matchPct = breakdown && isRecommendable(item,user,{confirmedOnly:true}) ? breakdown.total : null;').replace("it's a ${matchPct}% match. Apply now!","it has ${matchPct}% preference fit. Check the requirements before applying."));
edit('context/UserContext.js',s=>s.replace("import { getEffectiveDaysLeft }", "import { ONBOARDING_DRAFT_KEY } from '../utils/onboarding';\nimport { getEffectiveDaysLeft }").replace('  const resetAll = () => {','  const resetAll = () => {\n    AsyncStorage.removeItem(ONBOARDING_DRAFT_KEY).catch(() => {});'));
edit('utils/analytics.js',s=>s.replace(/\/\/ Maps the UserContext[\s\S]*?\nexport async function logActivityEvent/,'// Activity analytics deliberately exclude names, schools, location, age, GPA and demographics.\nexport async function logActivityEvent'));
edit('screens/ProfileScreen.js',s=>s.replace("import { getProfileCoverage, isValidState } from '../utils/matching';\n",'').replace("import { ageFromBirthday }", "import { ageFromBirthday, getProfileCoverage, isValidState }").replace('setEditModalVisible(true)}\n activeOpacity={0.85}\n >\n <Text style={styles.strengthEditBtnText}>Complete preferences','navigation.navigate(\'Onboarding\',{edit:true})}\n activeOpacity={0.85}\n >\n <Text style={styles.strengthEditBtnText}>Complete preferences'));
edit('utils/matching.js',s=>{
 s=s.replace("  if (!deadlineDateStr) return null;", "  if (!validDate(deadlineDateStr)) return null;");
 s=s.replace("  if (!item || !item.deadlineDate) return false;", "  if (!item || !validDate(item.deadlineDate)) return false;");
 s=s.replace("  if (item.deadlineDate) {\n    const computed", "  if (item.deadlineDate && isItemExpired(item)) return null;\n  if (item.deadlineDate) {\n    const computed");
 s=s.replace("const text=[item.applicationChecklist,item.howToApply,item.requirements].filter(Boolean).join(' ').toLowerCase();", "const text=[item.applicationChecklist,item.howToApply,item.requirements].filter(Boolean).join(' ').toLowerCase().split(/[.!\\n]/).filter(line=>!/\\b(no|not required|optional)\\b/.test(line)).join(' ');");
 s=s.replace("const canAddManual", "const canAddManual");
 return s;
});
