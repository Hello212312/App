const fs=require('fs'),path=require('path');
const root=path.resolve('interny-site-review/interny-app');
const patch=(file,fn)=>{let p=path.join(root,file);fs.writeFileSync(p,fn(fs.readFileSync(p,'utf8')));};
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(d,x.name)):[path.join(d,x.name)]);
for(const dir of ['screens','components','context'])for(const file of walk(path.join(root,dir)).filter(x=>x.endsWith('.js'))){let s=fs.readFileSync(file,'utf8');s=s.replace(/from '@react-native-community\/datetimepicker'/g,"from '../web/DateTimePicker'");if(s.includes('TouchableOpacity')){s=s.replace(/import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/g,(all,body)=>{if(!body.includes('TouchableOpacity'))return all;return 'import {'+body.replace(/\bTouchableOpacity\s*,?/,'')+"} from 'react-native'";});s="import TouchableOpacity from '../web/TouchableOpacity';\n"+s;}fs.writeFileSync(file,s);}
patch('components.js',s=>"import TouchableOpacity from './web/TouchableOpacity';\n"+s.replace(/\bTouchableOpacity,/,''));
patch('index.js',s=>"import './web/browser';\n"+s);
patch('App.js',s=>s.replace("import * as Notifications from 'expo-notifications';","import * as Notifications from './web/notifications';\nimport {initialNavigation,saveNavigation,bindHistory} from './web/browser';")
.replace('  const navRef = useRef(null);','  const navRef = useRef(null);\n  const initial = useRef(initialNavigation());\n  useEffect(() => bindHistory(navRef), []);')
.replace("if (user.onboardingDone && user.onboardingVersion === ONBOARDING_VERSION && navRef.current)","if (user.onboardingDone && user.onboardingVersion === ONBOARDING_VERSION && navRef.current && !initial.current)")
.replace('<NavigationContainer ref={navRef}>','<NavigationContainer ref={navRef} initialState={initial.current} onReady={()=>saveNavigation(navRef.current?.getRootState(),true)} onStateChange={state=>saveNavigation(state)}>')
.replace('<UserProvider>','<UserProvider>\n            <BrowserNotice />')
.replace('// ─── ROOT ─',`function BrowserNotice(){return <View style={{paddingHorizontal:16,paddingVertical:8,backgroundColor:'#EFF6FF'}}><Text style={{fontSize:12,color:'#475569'}}>Saved data stays in this browser. Calendar reminders can work after closing this page; browser notifications require it to stay open.</Text><Text accessibilityRole="button" tabIndex={0} onPress={()=>Notifications.requestPermissionsAsync()} style={{fontSize:12,color:'#2563EB',marginTop:4}}>Enable browser notifications</Text></View>;}\n\n// ─── ROOT ─`));
patch('utils/notifications.js',s=>s.replace("from 'expo-notifications'","from '../web/notifications'"));
patch('utils/revenuecat.js',s=>s.replace("import Purchases, { LOG_LEVEL } from 'react-native-purchases';","let Purchases; let LOG_LEVEL;")
.replace('export async function initPurchases(appUserId) {',"export async function initPurchases(appUserId) {\n  if (Platform.OS === 'web') return false;\n  const sdk = require('react-native-purchases'); Purchases = sdk.default; LOG_LEVEL = sdk.LOG_LEVEL;"));
patch('screens/OnboardingScreen.js',s=>s.replace("if (Platform.OS === 'android') setShowPicker(false);","if (Platform.OS !== 'ios') setShowPicker(false);"));
// On initial load show a real loading/error state; keep the original query and row mapping.
patch('data.js',s=>s.replace('export let INTERNSHIPS = [];',"export let INTERNSHIPS = [];\nexport let catalogError = null;\nexport let catalogLoading = true;")
.replace(' _loading = true;',' _loading = true;\n catalogLoading = true; catalogError = null; _notify();')
.replace(' _loaded = true;', ' catalogLoading = false;\n _loaded = true;')
.replace(" console.warn('[data.js] Failed", " catalogLoading = false; catalogError = err.message;\n console.warn('[data.js] Failed"));
fs.appendFileSync(path.resolve('interny-site-review/.gitignore'),'\n/interny-app/node_modules/\n/interny-app/.expo/\n/interny-app/dist/\n/interny-app/.env*\n*.tsbuildinfo\n');
