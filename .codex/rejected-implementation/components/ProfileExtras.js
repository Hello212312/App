import { useEffect, useRef, useState } from 'react';
import { Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '../theme';
import { useUser } from '../context/UserContext';
import { searchSchools } from '../utils/schools';
import { isValidState } from '../utils/matching';

export default function ProfileExtras({visible,onClose}) {
 const {user,setUser}=useUser();
 const [school,setSchool]=useState(null),[query,setQuery]=useState(''),[results,setResults]=useState([]),[status,setStatus]=useState(''),[manual,setManual]=useState(false),[city,setCity]=useState(''),[state,setState]=useState('');
 const [selectivity,setSelectivity]=useState(''),[from,setFrom]=useState(''),[until,setUntil]=useState(''),[error,setError]=useState('');
 const generation=useRef(0);
 useEffect(()=>{if(visible){setSchool(user.school || null);setQuery(user.school?.name || '');setSelectivity(user.selectivityPreference || '');setFrom(user.availableFrom || '');setUntil(user.availableUntil || '');setError('');setManual(false);}},[visible,user.school,user.selectivityPreference,user.availableFrom,user.availableUntil]);
 useEffect(()=>{
  const version=++generation.current;
  if(!visible || query.length<2 || query===school?.name)return;
  const timer=setTimeout(async()=>{setStatus('Searching…');const found=await searchSchools(query,null,8,{throwOnError:true}).catch(()=>null);if(generation.current!==version)return;setResults(found || []);setStatus(found===null?'School search is unavailable. You can enter it manually.':found.length?'':'No matching schools. You can enter yours manually.');},300);
  return()=>{clearTimeout(timer);generation.current++;};
 },[visible,query,school]);
 const field=(label,value,onChange,placeholder)=><View style={s.group}><Text style={s.label}>{label}</Text><TextInput value={value} onChangeText={onChange} placeholder={placeholder} placeholderTextColor={Colors.textTertiary} style={s.input}/></View>;
 function save(){
  const validDate=x=>!x || /^\d{4}-\d{2}-\d{2}$/.test(x)&&!Number.isNaN(Date.parse(x))&&new Date(x).toISOString().slice(0,10)===x;
  if(!validDate(from)||!validDate(until)||from&&until&&from>until){setError('Use valid YYYY-MM-DD dates, with the end after the start.');return;}
  setUser({school,selectivityPreference:selectivity,availableFrom:from,availableUntil:until});onClose();
 }
 return <Modal visible={visible} animationType="slide" onRequestClose={onClose}><SafeAreaView style={s.safe}><View style={s.top}><TouchableOpacity onPress={onClose} style={s.button}><Text style={s.link}>Cancel</Text></TouchableOpacity><Text style={s.title}>Optional details</Text><TouchableOpacity onPress={save} style={s.button}><Text style={s.link}>Save</Text></TouchableOpacity></View><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.content}>
  <Text style={s.note}>These answers stay in your local profile. School is separate from where you live. None of these details estimate your chance of acceptance.</Text>
  {field('School · optional',query,text=>{setQuery(text);setSchool(null);setResults([]);},'Search your high school')}
  {!!status&&<Text style={s.note}>{status}</Text>}
  {!school&&results.map(x=><TouchableOpacity key={x.id} style={s.option} onPress={()=>{setSchool(x);setQuery(x.name);setResults([]);setStatus('');}}><Text style={s.label}>{x.name}</Text><Text style={s.note}>{[x.city,x.state].filter(Boolean).join(', ')}</Text></TouchableOpacity>)}
  {school&&<View style={s.option}><Text style={s.label}>✓ {school.name}</Text><TouchableOpacity style={s.button} onPress={()=>{setSchool(null);setQuery('');setResults([]);}}><Text style={s.link}>Remove school</Text></TouchableOpacity></View>}
  {!school&&<TouchableOpacity style={s.button} onPress={()=>setManual(!manual)}><Text style={s.link}>Enter school manually</Text></TouchableOpacity>}
  {manual&&!school&&<>{field('School city',city,setCity,'City')}{field('School state',state,x=>setState(x.toUpperCase()),'CA')}<TouchableOpacity style={s.button} onPress={()=>{if(query.trim().length<3||!city.trim()||!isValidState(state)){setError('Enter a school name, city, and valid state.');return;}setSchool({id:'manual:'+query.trim().toLowerCase(),name:query.trim(),city:city.trim(),state:state.trim(),manual:true});setManual(false);setError('');}}><Text style={s.link}>Use this school</Text></TouchableOpacity></>}
  <Text style={s.label}>Program selectivity · optional</Text><Text style={s.note}>This is your preference, independent of your GPA or materials.</Text>{[['No preference',''],['Broadly accessible','open'],['Moderately selective','moderate'],['Highly selective','competitive']].map(([label,value])=><TouchableOpacity key={label} accessibilityRole="radio" accessibilityState={{selected:selectivity===value}} style={[s.option,selectivity===value&&s.selected]} onPress={()=>setSelectivity(value)}><Text style={s.label}>{selectivity===value?'✓ ':''}{label}</Text></TouchableOpacity>)}
  {field('Available from · optional',from,setFrom,'YYYY-MM-DD')}{field('Available until · optional',until,setUntil,'YYYY-MM-DD')}<Text style={s.note}>When a listing has no dates, you’ll see a reminder to confirm them.</Text>{!!error&&<Text accessibilityRole="alert" style={{color:'#B91C1C'}}>{error}</Text>}
 </ScrollView></SafeAreaView></Modal>;
}
const s=StyleSheet.create({safe:{flex:1,backgroundColor:Colors.background},top:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingHorizontal:20},title:{fontSize:18,fontWeight:'700',color:Colors.textPrimary},button:{minHeight:44,justifyContent:'center'},link:{fontSize:15,fontWeight:'600',color:Colors.accent},content:{padding:24,gap:12,maxWidth:600,width:'100%',alignSelf:'center'},group:{gap:8,marginTop:12},label:{fontSize:15,fontWeight:'600',color:Colors.textPrimary},note:{fontSize:14,lineHeight:21,color:Colors.textSecondary},input:{borderWidth:1,borderColor:Colors.border,borderRadius:10,padding:14,minHeight:52,fontSize:16,backgroundColor:Colors.surface,color:Colors.textPrimary},option:{padding:16,borderRadius:12,borderWidth:1,borderColor:Colors.border,backgroundColor:Colors.surface,gap:4,minHeight:48},selected:{borderColor:Colors.accent,backgroundColor:Colors.accentLight}});
