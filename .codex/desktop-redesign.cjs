const fs = require('fs');
const root = __dirname + '/interny-site-review/';
function patch(name, fn) { const p=root+name; const old=fs.readFileSync(p,'utf8'); const next=fn(old); if(next===old) throw Error('No edit: '+name); fs.writeFileSync(p,next); }
patch('interny-app/App.js',s=>{
  s=s.replace("import {initialNavigation,saveNavigation,bindHistory} from './web/browser';", "import {initialNavigation,saveNavigation,bindHistory} from './web/browser';\nimport {restoreNavigation} from './web/navigation-state';\nimport DesktopShell from './web/DesktopShell';");
  s=s.replace('  const initial = useRef(initialNavigation());',`  const initial = useRef(initialNavigation());
  const [active, setActive] = useState('Home');
  const complete = user.onboardingDone && user.onboardingVersion === ONBOARDING_VERSION;
  const onNavigation = (state, replace = false) => {
    let route = state?.routes?.[state.index || 0];
    while (route?.state) route = route.state.routes[route.state.index || 0];
    setActive(route?.name || 'Home');
    saveNavigation(state, replace);
  };`);
  const start=s.indexOf('  // Once storage has loaded, route the user correctly.');
  const end=s.indexOf('  // Tapping a "closing soon"',start);
  s=s.slice(0,start)+s.slice(end);
  s=s.replace('  return (\n    <TourProvider',`  if (!loaded) return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>Loading your workspace…</Text></View>;
  return (
    <TourProvider`);
  s=s.replace('<NavigationContainer ref={navRef} initialState={initial.current} onReady={()=>saveNavigation(navRef.current?.getRootState(),true)} onStateChange={state=>saveNavigation(state)}>', '<NavigationContainer ref={navRef} initialState={restoreNavigation(initial.current, complete)} onReady={()=>onNavigation(navRef.current?.getRootState(),true)} onStateChange={state=>onNavigation(state)}>\n        <DesktopShell navRef={navRef} active={active} complete={complete}>');
  s=s.replace('<Stack.Screen name="Onboarding"  component={OnboardingScreen} />', '{!complete ? <Stack.Screen name="Onboarding" component={OnboardingScreen} /> : <>');
  s=s.replace('<Stack.Screen name="Materials"  component={MaterialsScreen} />','<Stack.Screen name="Materials"  component={MaterialsScreen} />\n          </>}');
  s=s.replace('</Stack.Navigator>', '</Stack.Navigator>\n        </DesktopShell>');
  s=s.replace('            <BrowserNotice />\n','');
  s=s.replace('        tabBarStyle: {','        tabBarStyle: {');
  // CSS targets a stable wrapper, preserving the existing mobile tab navigator.
  s=s.replace('<Tab.Navigator\n', '<Tab.Navigator\n      tabBar={props => <div className="mobile-tabs"><BottomTabBar {...props}/></div>}\n');
  s=s.replace("import { createBottomTabNavigator }", "import { BottomTabBar, createBottomTabNavigator }");
  return s;
});
patch('interny-app/web/browser.js',s=>s.replace("import { Alert, Share } from 'react-native';", "import { Alert, Share } from 'react-native';\nimport {restoreNavigation} from './navigation-state';\nimport './desktop.css';")
 .replace('  sessionStorage.setItem(NAV_KEY,JSON.stringify(state));','  try { sessionStorage.setItem(NAV_KEY,JSON.stringify(state)); } catch {}')
 .replace('const host=window.parent;const route=activeRoute(state);','const host=window.parent;const route=activeRoute(state);')
 .replace("  if(host.location.pathname==='/internships')host.history[replace?'replaceState':'pushState']({internyNavigation:state},'',path);", "  try { if(host.location.pathname==='/internships')host.history[replace?'replaceState':'pushState']({internyNavigation:state},'',path); } catch {}")
 .replace('navRef.current.resetRoot(e.state.internyNavigation);sessionStorage.setItem(NAV_KEY,JSON.stringify(e.state.internyNavigation));', "const complete = !navRef.current.getRootState()?.routeNames?.includes('Onboarding'); const next=restoreNavigation(e.state.internyNavigation,complete);navRef.current.resetRoot(next);try {sessionStorage.setItem(NAV_KEY,JSON.stringify(next));} catch {}"));
patch('interny-app/screens/OnboardingScreen.js',s=>s
 .replace(' const setPriority =', ' useEffect(() => { scrollRef.current?.scrollTo({y:0,animated:false}); }, [step]);\n\n const setPriority =')
 .replace(' const handleContinue = () => {',' const handleContinue = () => {\n if (!canContinue()) return;')
 .replace('<SafeAreaView style={styles.safe}>','<SafeAreaView dataSet={{screen:"onboarding"}} style={styles.safe}>')
 .replace('<View style={styles.topBar}>','<View dataSet={{ui:"onboarding-progress"}} style={styles.topBar}>')
 .replace('<View style={styles.bottomBar}>','<View dataSet={{ui:"onboarding-actions"}} style={styles.bottomBar}>')
 .replace('style={styles.scroll}\n','dataSet={{ui:"onboarding-scroll"}}\n style={styles.scroll}\n')
 .replace('const WelcomeStep = () => (','const WelcomeStep = () => (')
 .replace(' <Text style={styles.stepCounter}>{step} of {TOTAL_STEPS}</Text>',` <Text accessibilityLiveRegion="polite" style={styles.stepCounter}>{!canContinue() ? (step === 3 ? 'Enter your name to continue' : step === 4 ? 'Choose your grade to continue' : 'Choose at least one interest to continue') : step + ' of ' + TOTAL_STEPS}</Text>`));
// Stable styling hooks let desktop layout change without forking any data or actions.
const screens=['Home','Search','Tracker','Profile','Detail','Materials','Saved','Deadlines','ClosingSoon'];
for(const name of screens) patch('interny-app/screens/'+name+'Screen.js',s=>s.replaceAll('<SafeAreaView style={styles.safe}',`<SafeAreaView dataSet={{screen:'${name.toLowerCase()}'}} style={styles.safe}`));
patch('interny-app/theme.js',s=>s.replace("background: '#F8FAFC'","background: '#FFFFFF'").replace("accent: '#2563EB'","accent: '#1648EE'").replace('sm: 12,','sm: 14,').replace('base: 14,','base: 16,').replace('md: 15,','md: 16,').replace('md: 10,','md: 6,').replace('lg: 14,','lg: 8,').replace('xl: 16,','xl: 8,').replace("'2xl': 20,","'2xl': 12,").replace('shadowOpacity: 0.06,','shadowOpacity: 0,').replace('elevation: 2,','elevation: 0,').replace('shadowOpacity: 0.08,','shadowOpacity: 0.03,'));
patch('app/internships/page.tsx',s=>s.replace('width:min(100%,1200px)','width:100%').replace('padding-top:96px','padding-top:90px').replace('padding-top:80px','padding-top:80px'));
