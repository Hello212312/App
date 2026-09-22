const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'..');
function edit(file,fn){const p=path.join(root,file);const dest=path.join(__dirname,'implementation-baseline',file);fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest))fs.copyFileSync(p,dest);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));}
edit('screens/HomeScreen.js',s=>{
 s=s.replace("import { INTERNSHIPS", "import { MatchInsight } from '../components/MatchInsight';\nimport { INTERNSHIPS");
 s=s.replace('  isNationwideOrRemote,','  isItemRemote,\n  computeMatchBreakdown,\n  getRecommendationTier,\n  isRecommendable,');
 s=s.replace(' const safeUser = user || {};',' const safeUser = user;',);
 s=s.replaceAll('isNationwideOrRemote(item)','isItemRemote(item)');
 s=s.replace(/\}, \[internships, safeUser\.grade[^\]]*\]\);/,'}, [internships, safeUser]);');
 s=s.replace(" const aExp = isItemExpired(a) ? 1 : 0;\n const bExp = isItemExpired(b) ? 1 : 0;", " const aExp = getRecommendationTier(a,safeUser);\n const bExp = getRecommendationTier(b,safeUser);");
 s=s.replace('[internships, isRemoteOnly, matchScoreCache, hasInterests]','[internships, isRemoteOnly, matchScoreCache, safeUser]');
 s=s.replace('sorted.filter((i) => !isItemExpired(i)).slice(0, 8)','sorted.filter((i) => isRecommendable(i,safeUser)).slice(0, 8)');
 s=s.replace('  }, [sorted]);','  }, [sorted,safeUser]);');
 s=s.replace("!savedSet.has(item.id) && !isItemExpired(item)","!savedSet.has(item.id) && isRecommendable(item,safeUser)");
 s=s.replace('[viewedIds, internships, savedIds]','[viewedIds, internships, savedIds, safeUser]');
 s=s.replace(' 0% match, not eligible',' Requirement not met');
 s=s.replace(' <Text style={styles.cardLocation}>{item.location}</Text>',' <Text style={styles.cardLocation}>{item.location}</Text>\n <MatchInsight breakdown={computeMatchBreakdown(item,safeUser)} compact />');
 s=s.replace('     {/* Personalization banner */}','     <TouchableOpacity style={{marginHorizontal:16,marginBottom:16,padding:16,backgroundColor:Colors.accentLight,borderRadius:12}} onPress={() => navigation.navigate(\'Onboarding\',{edit:true})}><Text style={{color:Colors.accent,fontWeight:\'600\'}}>Adjust your matches →</Text><Text style={{color:Colors.textSecondary,marginTop:4}}>Interests, location, commute and pay preferences</Text></TouchableOpacity>\n     {/* Personalization banner */}');
 return s;
});
edit('screens/SearchScreen.js',s=>{
 s=s.replace('gradeIsEligible, isItemExpired','getRecommendationTier, isItemExpired');
 s=s.replace(/\}, \[internships, user\.grade[^\]]*\]\);/,'}, [internships,user]);');
 s=s.replace(/    const userGrade = \(user \|\| \{\}\)\.grade;[\s\S]*?    };\n\n    \/\/ Determine/,"    const rankTier = (it) => getRecommendationTier(it,user);\n\n    // Determine");
 s=s.replace('activeFilters, user.grade, sortBy','activeFilters, user, sortBy');
 return s;
});
edit('screens/DetailScreen.js',s=>{
 s=s.replace(', MatchBreakdownModal','');
 s=s.replace("import { useTourTarget }", "import { MatchInsight, MatchInsightModal } from '../components/MatchInsight';\nimport { useTourTarget }");
 s=s.replace('  computeMatchBreakdown,','  computeMatchBreakdown,\n  getMatchLabel,');
 s=s.replace(/function matchLabel\([\s\S]*?\n}\nfunction matchColors/, 'function matchColors');
 s=s.replace('matchLabel(matchScore, ineligible)','getMatchLabel(matchBreakdown)');
 s=s.replace('matchLabel(matchScore, !eligibility.eligible)','getMatchLabel(matchBreakdown)');
 s=s.replace('{matchScore}%','{matchScore}% fit');
 s=s.replace(' {/* Hero */}'," <View style={{padding:16}}><MatchInsight breakdown={matchBreakdown} onPress={() => setShowMatchBreakdown(true)} /></View>\n {/* Hero */}");
 s=s.replace('<MatchBreakdownModal','<MatchInsightModal');
 return s;
});
edit('utils/featureTourSteps.js',s=>s.replace('computeMatchBreakdown, isItemExpired','computeMatchBreakdown, isItemExpired, isRecommendable').replace('if (!b || b.ineligible) continue;','if (!b || !isRecommendable(it,user)) continue;').replace('    demoItem = openItems[0] || internships[0] || null;','    demoItem = null;').replace('if (b.total > bestTotal)','if ((b.total ?? 0) > bestTotal)').replace('bestTotal = b.total;','bestTotal = b.total ?? 0;').replace('points: c.points,','points: c.points ?? 0,').replace('Every internship is scored from 0 to 100 against your grade, interests, and location.','Preference fit compares the interests and preferences you shared. Eligibility and practical limits are checked separately.'));
edit('context/TourContext.js',s=>s.replace('if (!loaded || !user.onboardingDone || user.featureTourSeen) return;','if (!loaded || !user.onboardingDone || user.featureTourSeen || !user.requestFeatureTour) return;'));
edit('utils/notifications.js',s=>s.replace("computeMatchBreakdown, getEffectiveDaysLeft", "computeMatchBreakdown, getEffectiveDaysLeft, isRecommendable, MATCH_THRESHOLD").replace('const HIGH_MATCH_THRESHOLD = 50;','const HIGH_MATCH_THRESHOLD = MATCH_THRESHOLD;').replaceAll('matchPct >= 50','matchPct >= MATCH_THRESHOLD').replaceAll('breakdown.ineligible || matchPct < HIGH_MATCH_THRESHOLD','!isRecommendable(item,user,{confirmedOnly:true}) || matchPct < HIGH_MATCH_THRESHOLD').replace('is a ${matchPct}% match','has ${matchPct}% preference fit').replaceAll('>=50%','>=70%'));
edit('utils/analytics.js',s=>{
 s=s.replace(/function profileFields\([\s\S]*?\n}\n/, '');
 s=s.replaceAll('      user_name: user?.name || null,\n','').replaceAll('      user_school: user?.school?.name || null,\n','').replaceAll('      ...profileFields(user),\n','');
 s=s.replace('  user,\n','').replace('export async function logOnboardingSource({ source, user })','export async function logOnboardingSource({ source })');
 return s+`\n// Only step numbers and actions; no profile answers in product analytics.\nexport function logOnboardingStep(action,step) { posthog.capture('onboarding_step',{action,step}); }\n`;
});
edit('context/UserContext.js',s=>{
 s=s.replace("import AsyncStorage", "import { AppState } from 'react-native';\nimport AsyncStorage");
 s=s.replace("  location: '',", "  location: '',\n  locationConfirmed: false,\n  locationSource: '',\n  maxCommuteMiles: 25,\n  logisticsAnswered: false,\n  paidRequired: false,\n  payPreference: '',\n  needsHousing: false,\n  exploring: false,\n  primaryInterest: '',\n  selectivityPreference: '',");
 const start=s.indexOf('  // Identifies the PostHog person'),end=s.indexOf('  // Trigger: engagement',start);
 s=s.slice(0,start)+`  // Refresh date-dependent ranking after midnight and when returning to the app.
  useEffect(() => {
    if (!loaded) return;
    const refreshDay = () => {
      const today = new Date().toDateString();
      setUserRaw(prev => prev.matchingDate === today ? prev : {...prev,matchingDate:today});
    };
    refreshDay();
    const timer = setInterval(refreshDay,60000);
    const sub = AppState.addEventListener('change',state => {if(state === 'active') refreshDay();});
    return () => {clearInterval(timer);sub.remove();};
  },[loaded]);

`+s.slice(end);
 // Don't silently infer residence from a school during migration.
 s=s.replace("if (s.user)            setUserRaw({ ...DEFAULT_USER, ...s.user });", "if (s.user) setUserRaw({ ...DEFAULT_USER, ...s.user, locationSource: s.user.locationSource || (s.user.school ? 'school' : 'home'), locationConfirmed: s.user.locationConfirmed ?? (!s.user.school && !!s.user.location) });");
 return s;
});
edit('utils/matching.js',s=>s.replace("const total=interests.length && denominator ?", "const enoughProfile = interests.length && user.grade && (user.remoteOnly || user.locationConfirmed && user.location) && user.logisticsAnswered;\n  const total=enoughProfile && denominator ?"));
