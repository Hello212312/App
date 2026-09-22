// screens/OnboardingScreen.js
// 10-step onboarding: Welcome → Referral source → Name → Grade+Age →
// Interests → School → Logistics & Priorities → GPA → Readiness → Demographics
// GPA + readiness signals feed into competitiveness matching in matching.js.
// School (via the NCES directory) supplies both city/state AND the school
// match itself: there's no separate location step since the school search
// already gives us that. School power hard eligibility gating: programs with
// residency/school-location requirements the user can't meet score 0%.

import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ONBOARDING_VERSION, useUser } from '../context/UserContext';
import { searchSchools } from '../utils/schools';
import { ageFromBirthday } from '../utils/matching';
import { logOnboardingSource } from '../utils/analytics';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

// DATA 

const GRADES = ['9th Grade', '10th Grade', '11th Grade', '12th Grade'];

// Birthday bounds: high-school age band. Age (separate from grade; many
// programs allow all grades but still require e.g. 16+) is computed from this.
const BIRTHDAY_MAX = new Date(); // can't be born in the future
const BIRTHDAY_MIN = new Date(BIRTHDAY_MAX.getFullYear() - 22, 0, 1);
// Sensible starting point for the picker: a typical high-schooler's birth year.
const BIRTHDAY_DEFAULT = new Date(BIRTHDAY_MAX.getFullYear() - 16, 0, 1);

function formatBirthday(date) {
  if (!date) return '';
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}
// ISO "YYYY-MM-DD" in local time (no UTC shift) for storage.
function birthdayToISO(date) {
  if (!date) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// Remote vs in-person preference: a soft nudge in matching, not a hard filter.
const FORMAT_OPTIONS = [
 { label: 'Remote', value: 'remote', desc: 'I prefer working from home / online' },
 { label: 'In-person', value: 'inperson', desc: 'I prefer being on-site in person' },
 { label: 'No preference', value: '', desc: 'Either format works for me' },
];

const TRAVEL_OPTIONS = [
 { label: 'Stay local', value: 'local', desc: 'Only programs I can reach from home' },
 { label: 'Within my state', value: 'state', desc: 'Willing to commute a reasonable distance' },
 { label: 'Anywhere', value: 'anywhere', desc: "I'd travel or relocate for the right program" },
];

const HOUSING_OPTIONS = [
 { label: 'Yes', value: true, desc: 'Open to residential programs with dorms' },
 { label: 'No', value: false, desc: 'I want to live at home' },
];

// Matching priorities: each scales its category's weight in the match score.
// Keys must match priorityMult() keys in utils/matching.js. `info` explains
// what the factor is and how it's used (shown in the (i) tooltip).
const PRIORITY_FACTORS = [
 { key: 'interests', label: 'Field & interests',
   info: 'How closely a program\'s field matches the interests you picked. Set this higher to push programs in your fields toward the top of your matches.' },
 { key: 'location', label: 'Location & format',
   info: 'How well a program fits where you are and how you\'d work: remote vs in-person, distance from home, commute, and housing. Set this higher to weigh location more heavily.' },
 { key: 'compensation', label: 'Getting paid',
   info: 'Whether a program pays you a stipend, is free but unpaid, or charges a fee. Set this higher to rank paid programs above unpaid ones for you.' },
 { key: 'competitiveness', label: 'Prestige & selectivity',
   info: 'How selective or prestigious a program is, weighed against your GPA and materials. Set this higher to prioritize competitive, name-brand programs.' },
];

// 1–5 scale for how much each factor matters. 3 is the neutral default and
// maps to the classic balance in matching.js (priorityMult ×1 at 3).
const PRIORITY_LEVELS = [1, 2, 3, 4, 5];
const PRIORITY_DEFAULT = 3;

const INTERESTS = [
 { label: 'Medicine', field: 'Medicine' },
 { label: 'Engineering', field: 'Engineering' },
 { label: 'Science', field: 'Science' },
 { label: 'Computer Science', field: 'Computer Science' },
 { label: 'Arts', field: 'Arts' },
 { label: 'Business', field: 'Business' },
 { label: 'Law/Advocacy', field: 'Law/Advocacy' },
 { label: 'Environment', field: 'Environment' },
 { label: 'Journalism', field: 'Journalism' },
 { label: 'History', field: 'History' },
 { label: 'Astronomy', field: 'Astronomy' },
 { label: 'Social Science', field: 'Social Science' },
];

const GPA_OPTIONS = [
 { label: '3.8 – 4.0', value: 'high', desc: 'Strong academics' },
 { label: '3.5 – 3.7', value: 'good', desc: 'Solid GPA' },
 { label: '3.0 – 3.4', value: 'avg', desc: 'On track' },
 { label: 'Below 3.0', value: 'below', desc: 'Working on it' },
 { label: 'Not sure', value: 'unsure', desc: 'Skip for now' },
];

const READINESS_OPTIONS = [
{ label: 'Resume', key: 'hasResume' },
 { label: 'Personal statement', key: 'hasEssay' },
 { label: 'Teacher rec letter', key: 'hasRecommendation' },
 { label: 'Transcript ready', key: 'hasTranscript' },
 { label: 'Extracurriculars', key: 'hasExtracurriculars' },
 { label: 'Previous experience', key: 'hasPriorExperience' },
];

// Some internships restrict eligibility to a specific gender or race/ethnicity
// (e.g. "for young women in STEM", "for Black and Hispanic students"). These
// fields are entirely optional and only used to flag programs you don't
// qualify for. It is never shown to anyone or used for anything else.
const GENDER_OPTIONS = [
 { label: 'Female', value: 'female' },
 { label: 'Male', value: 'male' },
 { label: 'Non-binary', value: 'nonbinary' },
 { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

const RACE_OPTIONS = [
 { label: 'American Indian or Alaska Native', value: 'native_american' },
 { label: 'Asian', value: 'asian' },
 { label: 'Black or African American', value: 'black' },
 { label: 'Hispanic or Latino', value: 'hispanic' },
 { label: 'Native Hawaiian or Pacific Islander', value: 'pacific_islander' },
 { label: 'White', value: 'white' },
 { label: 'Prefer not to say', value: 'prefer_not_to_say' },
];

// How the user heard about Interny. Sent to Supabase on completion so we
// can see acquisition channels in the activity_events table.
const REFERRAL_OPTIONS = [
 { label: 'Friend or classmate', value: 'friend' },
 { label: 'Instagram / TikTok', value: 'social_media' },
 { label: 'School counselor or teacher', value: 'school' },
 { label: 'App Store / Google Play search', value: 'app_store_search' },
 { label: 'Google search', value: 'web_search' },
 { label: 'Other', value: 'other' },
];

const TOTAL_STEPS = 10;

// PROGRESS BAR 

const ProgressBar = ({ step }) => (
 <View style={styles.progressContainer}>
 {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
 <View
 key={i}
 style={[styles.progressSegment, i < step && styles.progressSegmentFilled]}
 />
 ))}
 </View>
);

// STEP 1: WELCOME 

const WelcomeStep = () => (
 <View style={styles.stepContainer}>
 <View style={styles.welcomeIconBox}>
 <Text style={styles.welcomeIconLetter}>I</Text>
 </View>
 <Text style={styles.stepHeadline}>Welcome to Interny</Text>
 <Text style={styles.stepSubtitle}>
 The easiest way for high school students to find and apply to internships that fit their interests and schedule.
 </Text>
 <View style={styles.featureList}>
 {[
 ['Curated listings', 'Every opportunity verified to accept high schoolers'],
 ['All fields', 'CS, medicine, aerospace, law, business, and more'],
 ['Free to use', 'Browse, save, and track internships at no cost'],
 ].map(([title, desc]) => (
 <View key={title} style={styles.featureRow}>
 <View style={styles.featureDot} />
 <View style={styles.featureText}>
 <Text style={styles.featureTitle}>{title}</Text>
 <Text style={styles.featureDesc}>{desc}</Text>
 </View>
 </View>
 ))}
 </View>
 </View>
);

// STEP 2: REFERRAL SOURCE

const ReferralStep = ({ selected, onSelect }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 2 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>How'd you hear about us?</Text>
 <Text style={styles.stepSubtitle}>
   Helps us know what's working. Totally optional.
 </Text>
 <View style={styles.gradeList}>
 {REFERRAL_OPTIONS.map((opt) => {
 const active = selected === opt.value;
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => onSelect(active ? '' : opt.value)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={opt.label}
 accessibilityState={{ selected: active }}
 >
 <Text style={[styles.gradeOptionText, active && styles.gradeOptionTextActive]}>
 {opt.label}
 </Text>
 {active && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 );
 })}
 </View>
 </View>
);

// STEP 3: NAME

const NameStep = ({ name, onChangeName }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 3 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>What's your name?</Text>
 <Text style={styles.stepSubtitle}>We'll use this to personalize your experience.</Text>
 <Text style={styles.inputLabel}>First Name</Text>
 <TextInput
 style={styles.textInput}
 placeholder="e.g. Alex"
 placeholderTextColor={Colors.textTertiary}
 value={name}
 onChangeText={onChangeName}
 autoFocus
 autoCorrect={false}
 returnKeyType="done"
 />
 </View>
);

// STEP 3: GRADE + AGE

const GradeStep = ({ selected, onSelect, birthday, onSelectBirthday }) => {
 const [showPicker, setShowPicker] = useState(false);
 const age = birthday ? ageFromBirthday(birthdayToISO(birthday)) : null;

 const handleChange = (event, date) => {
 // Android fires with type 'dismissed' on cancel and closes the dialog itself.
 if (Platform.OS === 'android') setShowPicker(false);
 if (event?.type === 'dismissed') return;
 if (date) onSelectBirthday(date);
 };

 return (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 4 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>What grade are you in?</Text>
 <Text style={styles.stepSubtitle}>
 This helps us show you opportunities that match your eligibility.
 </Text>
 <View style={styles.gradeList}>
 {GRADES.map((grade) => (
 <TouchableOpacity
 key={grade}
 style={[styles.gradeOption, selected === grade && styles.gradeOptionActive]}
 onPress={() => onSelect(grade)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={grade}
 accessibilityState={{ selected: selected === grade }}
 >
 <Text style={[styles.gradeOptionText, selected === grade && styles.gradeOptionTextActive]}>
 {grade}
 </Text>
 {selected === grade && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 ))}
 </View>

 <Text style={[styles.inputLabel, { marginTop: Spacing[6] }]}>When's your birthday?</Text>
 <Text style={[styles.stepSubtitle, { marginBottom: Spacing[3] }]}>
 Optional. Some programs have age minimums (e.g. 16+) separate from grade, so your birthday lets us keep those off your top matches until you actually qualify, and roll you into them the day you do.
 </Text>
 <TouchableOpacity
 style={[styles.gradeOption, birthday && styles.gradeOptionActive]}
 onPress={() => setShowPicker(true)}
 activeOpacity={0.7}
 accessibilityRole="button"
 accessibilityLabel={birthday ? `Birthday: ${formatBirthday(birthday)}. Tap to change.` : 'Pick your birthday'}
 >
 <View>
 <Text style={[styles.gradeOptionText, birthday && styles.gradeOptionTextActive]}>
 {birthday ? formatBirthday(birthday) : 'Pick your birthday'}
 </Text>
 {age !== null && (
 <Text style={[styles.gradeOptionSub, styles.gradeOptionSubActive]}>
 {age} years old
 </Text>
 )}
 </View>
 <Text style={[styles.gradeOptionText, birthday && styles.gradeOptionTextActive, { fontSize: Typography.size.md }]}>
 {birthday ? 'Change' : 'Set'}
 </Text>
 </TouchableOpacity>
 {birthday && (
 <TouchableOpacity
 onPress={() => onSelectBirthday(null)}
 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
 accessibilityRole="button"
 accessibilityLabel="Clear birthday"
 >
 <Text style={styles.manualLinkText}>Clear</Text>
 </TouchableOpacity>
 )}

 {/* iOS: inline spinner shown in a modal; Android: native dialog */}
 {showPicker && Platform.OS === 'ios' && (
 <Modal transparent animationType="fade" onRequestClose={() => setShowPicker(false)}>
 <TouchableOpacity
 style={styles.pickerBackdrop}
 activeOpacity={1}
 onPress={() => setShowPicker(false)}
 >
 <View style={styles.pickerSheet}>
 <View style={styles.pickerHeader}>
 <Text style={styles.pickerTitle}>Your birthday</Text>
 <TouchableOpacity onPress={() => setShowPicker(false)}>
 <Text style={styles.pickerDone}>Done</Text>
 </TouchableOpacity>
 </View>
 <DateTimePicker
 value={birthday || BIRTHDAY_DEFAULT}
 mode="date"
 display="spinner"
 maximumDate={BIRTHDAY_MAX}
 minimumDate={BIRTHDAY_MIN}
 onChange={handleChange}
 />
 </View>
 </TouchableOpacity>
 </Modal>
 )}
 {showPicker && Platform.OS !== 'ios' && (
 <DateTimePicker
 value={birthday || BIRTHDAY_DEFAULT}
 mode="date"
 display="default"
 maximumDate={BIRTHDAY_MAX}
 minimumDate={BIRTHDAY_MIN}
 onChange={handleChange}
 />
 )}
 </View>
 );
};

// STEP 4: INTERESTS 

const InterestsStep = ({ selected, onToggle }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 5 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>What are you into?</Text>
 <Text style={styles.stepSubtitle}>
   Pick your interests. The more you select, the more programs we can surface for you.
 </Text>
 <View style={styles.interestGrid}>
 {INTERESTS.map(({ label, field }) => {
 const active = selected.includes(field);
 return (
 <TouchableOpacity
 key={field}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => onToggle(field)}
 activeOpacity={0.7}
 accessibilityRole="checkbox"
 accessibilityLabel={label}
 accessibilityState={{ checked: active }}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>
);

// STEP 5: SCHOOL (also gives us the student's city/state; no separate location step needed)

const SchoolStep = ({ school, onSelectSchool }) => {
 const [query, setQuery] = useState(school ? school.name : '');
 const [results, setResults] = useState([]);
 const [searching, setSearching] = useState(false);
 const [hasSearched, setHasSearched] = useState(false);
 // Manual fallback: the directory (NCES public + private schools) can still
 // miss a school, so never let that block a student from finishing onboarding.
 const [manualMode, setManualMode] = useState(false);
 const [manualCity, setManualCity] = useState('');
 const [manualState, setManualState] = useState('');
 const debounceRef = useRef(null);

 const manualStateOk = /^[A-Za-z]{2}$/.test(manualState.trim());
 const canAddManual = query.trim().length >= 3 && manualStateOk;

 const handleAddManual = () => {
 if (!canAddManual) return;
 onSelectSchool({
 id: `manual:${query.trim().toLowerCase()}`,
 name: query.trim(),
 city: manualCity.trim(),
 state: manualState.trim().toUpperCase(),
 district: null,
 manual: true,
 });
 setManualMode(false);
 setResults([]);
 };

 // Debounced search against the Supabase NCES school directory.
 // All setState happens inside the timeout callback (never synchronously in the effect).
 useEffect(() => {
 if (debounceRef.current) clearTimeout(debounceRef.current);
 debounceRef.current = setTimeout(async () => {
 // No search when the query is empty/short or is the already-picked school
 if ((school && query === school.name) || query.trim().length < 2) {
 setResults([]);
 setHasSearched(false);
 return;
 }
 setSearching(true);
 const found = await searchSchools(query, null);
 setResults(found);
 setSearching(false);
 setHasSearched(true);
 }, 250);
 return () => clearTimeout(debounceRef.current);
 }, [query, school]);

 const handleChangeText = (text) => {
 setQuery(text);
 // Editing the text invalidates a previous pick
 if (school && text !== school.name) onSelectSchool(null);
 };

 return (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 6 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>What school do you go to?</Text>
 <Text style={styles.stepSubtitle}>
 Some internships are only open to certain schools or districts. This step is optional, so you can skip it.
 </Text>
 <Text style={styles.inputLabel}>High school name</Text>
 <TextInput
 style={[styles.textInput, { marginBottom: Spacing[2] }]}
 placeholder="Search your school…"
 placeholderTextColor={Colors.textTertiary}
 value={query}
 onChangeText={handleChangeText}
 autoCorrect={false}
 autoCapitalize="words"
 returnKeyType="search"
 />
 {searching && <Text style={styles.schoolHintText}>Searching…</Text>}
 {results.length > 0 && (
 <View style={styles.suggestionBox}>
 {results.map((s) => (
 <TouchableOpacity
 key={s.id}
 style={styles.suggestionRow}
 onPress={() => {
 onSelectSchool(s);
 setQuery(s.name);
 setResults([]);
 }}
 activeOpacity={0.7}
 accessibilityRole="button"
 accessibilityLabel={s.name}
 >
 <Text style={styles.suggestionText} numberOfLines={1}>{s.name}</Text>
 <Text style={styles.suggestionSub} numberOfLines={1}>
 {[s.city, s.state].filter(Boolean).join(', ')}{s.district ? ` · ${s.district}` : ''}
 </Text>
 </TouchableOpacity>
 ))}
 </View>
 )}
 {/* Manual fallback: shown once a search came back without the school */}
 {!school && hasSearched && !searching && (
 <TouchableOpacity
 onPress={() => setManualMode((m) => !m)}
 accessibilityRole="button"
 accessibilityLabel="Add your school manually"
 >
 <Text style={styles.manualLinkText}>
 {manualMode ? 'Back to search results' : "Can't find your school? Add it manually"}
 </Text>
 </TouchableOpacity>
 )}
 {!school && manualMode && (
 <View style={styles.manualBox}>
 <Text style={styles.inputLabel}>City</Text>
 <TextInput
 style={[styles.textInput, { marginBottom: Spacing[3] }]}
 placeholder="e.g. Ashburn"
 placeholderTextColor={Colors.textTertiary}
 value={manualCity}
 onChangeText={setManualCity}
 autoCapitalize="words"
 autoCorrect={false}
 />
 <Text style={styles.inputLabel}>State (2 letters)</Text>
 <TextInput
 style={[styles.textInput, { marginBottom: Spacing[3] }]}
 placeholder="e.g. VA"
 placeholderTextColor={Colors.textTertiary}
 value={manualState}
 onChangeText={setManualState}
 autoCapitalize="characters"
 autoCorrect={false}
 maxLength={2}
 />
 <TouchableOpacity
 style={[styles.manualAddBtn, !canAddManual && styles.continueBtnDisabled]}
 onPress={handleAddManual}
 disabled={!canAddManual}
 activeOpacity={0.85}
 accessibilityRole="button"
 accessibilityLabel="Use this school"
 >
 <Text style={styles.continueBtnText}>Use this school</Text>
 </TouchableOpacity>
 </View>
 )}
 {school && (
 <View style={styles.schoolPicked}>
 <Text style={styles.schoolPickedCheck}>✓</Text>
 <Text style={styles.schoolPickedText} numberOfLines={2}>
 {school.name}{school.city ? `, ${school.city}, ${school.state}` : ''}
 </Text>
 </View>
 )}
 </View>
 );
};

// STEP 6: LOGISTICS & PRIORITIES

const LogisticsStep = ({ travel, onSelectTravel, housing, onSelectHousing, format, onSelectFormat, priorities, onSetPriority }) => {
 // Which factor's info tooltip is open (null = none).
 const [infoFactor, setInfoFactor] = useState(null);
 const openInfo = PRIORITY_FACTORS.find((f) => f.key === infoFactor) || null;

 return (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 7 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>How far would you go?</Text>
 <Text style={styles.stepSubtitle}>
 Some programs need a daily commute; others provide dorms so students attend from anywhere. This keeps your matches realistic. All optional.
 </Text>

 <Text style={styles.inputLabel}>Do you prefer remote or in-person?</Text>
 <View style={[styles.gradeList, { marginBottom: Spacing[6] }]}>
 {FORMAT_OPTIONS.map((opt) => {
 const active = format === opt.value;
 return (
 <TouchableOpacity
 key={opt.value || 'none'}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => onSelectFormat(opt.value)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={`${opt.label}, ${opt.desc}`}
 accessibilityState={{ selected: active }}
 >
 <View>
 <Text style={[styles.gradeOptionText, active && styles.gradeOptionTextActive]}>
 {opt.label}
 </Text>
 <Text style={[styles.gradeOptionSub, active && styles.gradeOptionSubActive]}>
 {opt.desc}
 </Text>
 </View>
 {active && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 );
 })}
 </View>

 <Text style={styles.inputLabel}>Willingness to travel</Text>
 <View style={[styles.gradeList, { marginBottom: Spacing[6] }]}>
 {TRAVEL_OPTIONS.map((opt) => {
 const active = travel === opt.value;
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => onSelectTravel(active ? '' : opt.value)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={`${opt.label}, ${opt.desc}`}
 accessibilityState={{ selected: active }}
 >
 <View>
 <Text style={[styles.gradeOptionText, active && styles.gradeOptionTextActive]}>
 {opt.label}
 </Text>
 <Text style={[styles.gradeOptionSub, active && styles.gradeOptionSubActive]}>
 {opt.desc}
 </Text>
 </View>
 {active && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 );
 })}
 </View>

 <Text style={styles.inputLabel}>Interested in programs with housing/dorms?</Text>
 <View style={[styles.gradeList, { marginBottom: Spacing[6] }]}>
 {HOUSING_OPTIONS.map((opt) => {
 const active = housing === opt.value;
 return (
 <TouchableOpacity
 key={String(opt.value)}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => onSelectHousing(active ? null : opt.value)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={`${opt.label}, ${opt.desc}`}
 accessibilityState={{ selected: active }}
 >
 <View>
 <Text style={[styles.gradeOptionText, active && styles.gradeOptionTextActive]}>
 {opt.label}
 </Text>
 <Text style={[styles.gradeOptionSub, active && styles.gradeOptionSubActive]}>
 {opt.desc}
 </Text>
 </View>
 {active && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 );
 })}
 </View>

 <Text style={styles.inputLabel}>What matters most to you?</Text>
 <Text style={[styles.stepSubtitle, { marginBottom: Spacing[2] }]}>
 Rate each from 1 to 5: 1 means it matters less, 5 means it matters more. Tap the ⓘ to see how each one is used. Leave everything at 3 if you're not sure.
 </Text>
 <View style={styles.priorityScaleLegend}>
 <Text style={styles.priorityScaleLegendText}>1 · matters less</Text>
 <Text style={styles.priorityScaleLegendText}>5 · matters more</Text>
 </View>
 <View style={styles.gradeList}>
 {PRIORITY_FACTORS.map((factor) => {
 const current = priorities[factor.key] || PRIORITY_DEFAULT;
 return (
 <View key={factor.key} style={styles.priorityCard}>
 <View style={styles.priorityCardHeader}>
 <Text style={styles.priorityLabel} numberOfLines={1}>{factor.label}</Text>
 <TouchableOpacity
 onPress={() => setInfoFactor(factor.key)}
 hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
 accessibilityRole="button"
 accessibilityLabel={`What is "${factor.label}" and how is it used?`}
 >
 <Text style={styles.priorityInfoIcon}>ⓘ</Text>
 </TouchableOpacity>
 </View>
 <View style={styles.priorityScale}>
 {PRIORITY_LEVELS.map((lvl) => {
 const active = current === lvl;
 return (
 <TouchableOpacity
 key={lvl}
 style={[styles.priorityScaleBtn, active && styles.priorityScaleBtnActive]}
 onPress={() => onSetPriority(factor.key, lvl)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={`${factor.label}: ${lvl} out of 5`}
 accessibilityState={{ selected: active }}
 >
 <Text style={[styles.priorityScaleText, active && styles.priorityScaleTextActive]}>
 {lvl}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>
 );
 })}
 </View>

 {/* Info tooltip: what a factor is and how it's used */}
 <Modal
 visible={!!openInfo}
 transparent
 animationType="fade"
 onRequestClose={() => setInfoFactor(null)}
 >
 <TouchableOpacity
 style={styles.pickerBackdrop}
 activeOpacity={1}
 onPress={() => setInfoFactor(null)}
 >
 <View style={styles.infoSheet}>
 <Text style={styles.infoTitle}>{openInfo?.label}</Text>
 <Text style={styles.infoBody}>{openInfo?.info}</Text>
 <TouchableOpacity
 style={styles.infoCloseBtn}
 onPress={() => setInfoFactor(null)}
 accessibilityRole="button"
 accessibilityLabel="Got it"
 >
 <Text style={styles.infoCloseText}>Got it</Text>
 </TouchableOpacity>
 </View>
 </TouchableOpacity>
 </Modal>
 </View>
 );
};

// STEP 7: GPA

const GpaStep = ({ selected, onSelect }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 8 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>What's your GPA range?</Text>
 <Text style={styles.stepSubtitle}>
 We use this to show you programs that match your academic profile: competitive, moderate, or open.
 </Text>
 <View style={styles.gradeList}>
 {GPA_OPTIONS.map((opt) => {
 const active = selected === opt.value;
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => onSelect(opt.value)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={`${opt.label}, ${opt.desc}`}
 accessibilityState={{ selected: active }}
 >
 <View>
 <Text style={[styles.gradeOptionText, active && styles.gradeOptionTextActive]}>
 {opt.label}
 </Text>
 <Text style={[styles.gradeOptionSub, active && styles.gradeOptionSubActive]}>
 {opt.desc}
 </Text>
 </View>
 {active && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 );
 })}
 </View>
 </View>
);

// STEP 8: READINESS

const ReadinessStep = ({ selected, onToggle }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 9 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>What do you already have?</Text>
 <Text style={styles.stepSubtitle}>
 Select everything that applies. This helps us show you internships you can actually apply to today, and what to prepare for the rest.
 </Text>
 <View style={styles.readinessGrid}>
 {READINESS_OPTIONS.map((opt) => {
 const active = selected.includes(opt.key);
 return (
 <TouchableOpacity
 key={opt.key}
 style={[styles.readinessOption, active && styles.readinessOptionActive]}
 onPress={() => onToggle(opt.key)}
 activeOpacity={0.7}
 accessibilityRole="checkbox"
 accessibilityLabel={opt.label}
 accessibilityState={{ checked: active }}
 >
 <Text style={[styles.readinessText, active && styles.readinessTextActive]}>
 {opt.label}
 </Text>
 {active && <Text style={styles.readinessCheck}>✓</Text>}
 </TouchableOpacity>
 );
 })}
 </View>
 <View style={styles.readinessHint}>
 <Text style={styles.readinessHintText}>
 Don't worry if you haven't started. We'll surface beginner-friendly programs too.
 </Text>
 </View>
 </View>
);

// STEP 9: GENDER + RACE/ETHNICITY (optional)

const DemographicsStep = ({ gender, onSelectGender, race, onToggleRace }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 10 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>Anything else?</Text>
 <Text style={styles.stepSubtitle}>
 A few internships are only open to a specific gender or race/ethnicity (e.g. "for young women in STEM"). Sharing this flags programs you don't qualify for. Completely optional, skip if you'd rather not say.
 </Text>

 <Text style={styles.inputLabel}>Gender</Text>
 <View style={[styles.gradeList, { marginBottom: Spacing[6] }]}>
 {GENDER_OPTIONS.map((opt) => {
 const active = gender === opt.value;
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => onSelectGender(active ? '' : opt.value)}
 activeOpacity={0.7}
 accessibilityRole="radio"
 accessibilityLabel={opt.label}
 accessibilityState={{ selected: active }}
 >
 <Text style={[styles.gradeOptionText, active && styles.gradeOptionTextActive]}>
 {opt.label}
 </Text>
 {active && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 );
 })}
 </View>

 <Text style={styles.inputLabel}>Race / ethnicity</Text>
 <Text style={[styles.stepSubtitle, { marginBottom: Spacing[3] }]}>Select all that apply.</Text>
 <View style={styles.interestGrid}>
 {RACE_OPTIONS.map((opt) => {
 const active = race.includes(opt.value);
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => onToggleRace(opt.value)}
 activeOpacity={0.7}
 accessibilityRole="checkbox"
 accessibilityLabel={opt.label}
 accessibilityState={{ checked: active }}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {opt.label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>
);

// ONBOARDING SCREEN

export default function OnboardingScreen({ navigation }) {
 const { setUser } = useUser();

 const [step, setStep] = useState(1);
 const [referralSource, setReferralSource] = useState('');
 const [name, setName] = useState('');
 const [grade, setGrade] = useState('');
 const [birthday, setBirthday] = useState(null); // Date | null
 const [interests, setInterests] = useState([]);
 // City/state are derived from the chosen school (see buildProfile); no
 // separate location step, since asking for the school already covers it.
 const [school, setSchool] = useState(null);
 const [travelWillingness, setTravelWillingness] = useState('');
 const [openToHousing, setOpenToHousing] = useState(null);
 const [formatPreference, setFormatPreference] = useState(''); // '' | 'remote' | 'inperson'
 const [priorities, setPriorities] = useState({});
 const [gpaRange, setGpaRange] = useState('');
 const [readiness, setReadiness] = useState([]);
 const [gender, setGender] = useState('');
 const [race, setRace] = useState([]);
 const scrollRef = useRef(null);

 const setPriority = (key, value) => {
 setPriorities((prev) => ({ ...prev, [key]: value }));
 };

 const toggleInterest = (field) => {
 setInterests((prev) =>
 prev.includes(field) ? prev.filter((f) => f !== field) : [...prev, field]
 );
 };

 const toggleReadiness = (key) => {
 setReadiness((prev) =>
 prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
 );
 };

 // 'Prefer not to say' is mutually exclusive with every other race option
 const toggleRace = (value) => {
 setRace((prev) => {
 if (value === 'prefer_not_to_say') {
 return prev.includes(value) ? [] : ['prefer_not_to_say'];
 }
 const withoutPreferNotToSay = prev.filter((r) => r !== 'prefer_not_to_say');
 return withoutPreferNotToSay.includes(value)
 ? withoutPreferNotToSay.filter((r) => r !== value)
 : [...withoutPreferNotToSay, value];
 });
 };

 const canContinue = () => {
 if (step === 1) return true;
 if (step === 2) return true; // referral source optional
 if (step === 3) return name.trim().length > 0;
 if (step === 4) return grade !== '';
 if (step === 5) return interests.length > 0;
 if (step === 6) return true; // school optional
 if (step === 7) return true; // logistics & priorities optional
 if (step === 8) return true; // GPA optional
 if (step === 9) return true; // readiness optional
 if (step === 10) return true; // gender/race optional
 return false;
 };

 // City/state come from the chosen school's NCES record: location "City, ST"
 // feeds the existing city/state parsing in matching.js
 const buildProfile = () => {
 const schoolState = (school && school.state) || null;
 const schoolCity  = (school && school.city) || '';
 const birthdayISO = birthdayToISO(birthday);
 return {
 name: name.trim(),
 referralSource,
 grade,
 birthday: birthdayISO,               // "YYYY-MM-DD" | ''
 age: ageFromBirthday(birthdayISO),   // derived, kept for existing age-based matching
 interests,
 state: schoolState,
 city: schoolCity,
 school,
 location: schoolCity && schoolState ? `${schoolCity}, ${schoolState}` : '',
 remoteOnly: false,
 formatPreference,
 travelWillingness,
 openToHousing,
 priorities,
 gpaRange,
 readiness,
 gender,
 race,
 onboardingDone: true,
 onboardingVersion: ONBOARDING_VERSION,
 };
 };

 // Fire-and-forget: never blocks onboarding completion on network state.
 const reportReferralSource = () => {
 if (referralSource) logOnboardingSource({ source: referralSource, user: buildProfile() });
 };

 const handleContinue = () => {
 if (step < TOTAL_STEPS) {
 setStep(step + 1);
 } else {
 setUser(buildProfile());
 reportReferralSource();
 }
 };

 // Skip finishes onboarding with whatever's been entered so far.
 // (Previously it wiped ALL collected data: a user who filled 6 steps and
 // skipped the 7th lost everything and got a fully generic feed.)
 const handleSkip = () => {
 setUser(buildProfile());
 reportReferralSource();
 };

 const stepComponents = [
 <WelcomeStep key="welcome" />,
 <ReferralStep key="referral" selected={referralSource} onSelect={setReferralSource} />,
 <NameStep key="name" name={name} onChangeName={setName} />,
 <GradeStep key="grade" selected={grade} onSelect={setGrade} birthday={birthday} onSelectBirthday={setBirthday} />,
 <InterestsStep key="interests" selected={interests} onToggle={toggleInterest} />,
 <SchoolStep key="school" school={school} onSelectSchool={setSchool} />,
 <LogisticsStep
 key="logistics"
 travel={travelWillingness}
 onSelectTravel={setTravelWillingness}
 housing={openToHousing}
 onSelectHousing={setOpenToHousing}
 format={formatPreference}
 onSelectFormat={setFormatPreference}
 priorities={priorities}
 onSetPriority={setPriority}
 />,
 <GpaStep key="gpa" selected={gpaRange} onSelect={setGpaRange} />,
 <ReadinessStep key="readiness" selected={readiness} onToggle={toggleReadiness} />,
 <DemographicsStep key="demographics" gender={gender} onSelectGender={setGender} race={race} onToggleRace={toggleRace} />,
 ];

 return (
 <SafeAreaView style={styles.safe}>
 {/* Top bar */}
 <View style={styles.topBar}>
 {step > 1 ? (
 <TouchableOpacity
 onPress={() => setStep(step - 1)}
 style={styles.backBtn}
 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
 accessibilityRole="button"
 accessibilityLabel="Go back a step"
 >
 <Text style={styles.backText}>Back</Text>
 </TouchableOpacity>
 ) : (
 <View style={{ width: 44 }} />
 )}

 <ProgressBar step={step} />

 {/* Skip is available on every step; it keeps whatever's been entered */}
 <TouchableOpacity
 onPress={handleSkip}
 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
 accessibilityRole="button"
 accessibilityLabel="Skip the rest of setup"
 >
 <Text style={styles.skipText}>Skip</Text>
 </TouchableOpacity>
 </View>

 {/* Content */}
 <KeyboardAvoidingView
 style={{ flex: 1 }}
 behavior={Platform.OS === 'ios' ? 'padding' : undefined}
 keyboardVerticalOffset={0}
 >
 <ScrollView
 ref={scrollRef}
 style={styles.scroll}
 showsVerticalScrollIndicator={false}
 contentContainerStyle={styles.scrollContent}
 keyboardShouldPersistTaps="handled"
 >
 {stepComponents[step - 1]}
 </ScrollView>

 {/* Bottom CTA */}
 <View style={styles.bottomBar}>
 <TouchableOpacity
 style={[styles.continueBtn, !canContinue() && styles.continueBtnDisabled]}
 onPress={handleContinue}
 disabled={!canContinue()}
 activeOpacity={0.85}
 >
 <Text style={styles.continueBtnText}>
 {step === TOTAL_STEPS ? 'Get started' : 'Continue'}
 </Text>
 </TouchableOpacity>
 <Text style={styles.stepCounter}>{step} of {TOTAL_STEPS}</Text>
 </View>
 </KeyboardAvoidingView>
 </SafeAreaView>
 );
}

// STYLES 

const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor: Colors.background },

 topBar: {
 flexDirection: 'row',
 alignItems: 'center',
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[3],
 gap: Spacing[3],
 },
 backBtn: { minWidth: 44, height: 44, justifyContent: 'center' },
 backText: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.medium,
 color: Colors.textSecondary,
 },
 skipText: {
 fontSize: Typography.size.base,
 color: Colors.textTertiary,
 minWidth: 44,
 textAlign: 'right',
 },

 progressContainer: { flex: 1, flexDirection: 'row', gap: 4, height: 4 },
 progressSegment: {
 flex: 1,
 height: 4,
 borderRadius: Radii.full,
 backgroundColor: Colors.border,
 },
 progressSegmentFilled: { backgroundColor: Colors.accent },

 scroll: { flex: 1 },
 scrollContent: {
 paddingHorizontal: Spacing.screenPadding,
 paddingBottom: Spacing[8],
 },

 stepContainer: { paddingTop: Spacing[6] },
 stepLabel: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 color: Colors.accent,
 letterSpacing: 0.5,
 textTransform: 'uppercase',
 marginBottom: Spacing[2],
 },
 stepHeadline: {
 fontSize: Typography.size['4xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 letterSpacing: -0.6,
 marginBottom: Spacing[2],
 lineHeight: Typography.size['4xl'] * 1.2,
 },
 stepSubtitle: {
 fontSize: Typography.size.md,
 color: Colors.textSecondary,
 lineHeight: Typography.size.md * 1.6,
 marginBottom: Spacing[7],
 },

 // Welcome
 welcomeIconBox: {
 width: 56,
 height: 56,
 borderRadius: Radii.xl,
 backgroundColor: Colors.accentLight,
 alignItems: 'center',
 justifyContent: 'center',
 marginBottom: Spacing[5],
 },
 welcomeIconLetter: {
 fontSize: Typography.size['3xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.accent,
 },
 featureList: { gap: Spacing[4] },
 featureRow: { flexDirection: 'row', alignItems: 'flex-start' },
 featureDot: {
 width: 8,
 height: 8,
 borderRadius: Radii.full,
 backgroundColor: Colors.accent,
 marginTop: 6,
 marginRight: Spacing[3],
 flexShrink: 0,
 },
 featureText: { flex: 1 },
 featureTitle: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 featureDesc: {
 fontSize: Typography.size.base,
 color: Colors.textSecondary,
 lineHeight: Typography.size.base * 1.5,
 },

 // Inputs
 inputLabel: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textSecondary,
 marginBottom: Spacing[2],
 letterSpacing: 0.2,
 },
 textInput: {
 height: 52,
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 paddingHorizontal: Spacing[4],
 fontSize: Typography.size.md,
 color: Colors.textPrimary,
 backgroundColor: Colors.surface,
 marginBottom: Spacing[6],
 },
 textInputDisabled: {
 backgroundColor: Colors.surfaceSecondary,
 color: Colors.textDisabled,
 borderColor: Colors.border,
 },

 // Grade / GPA (shared list style)
 gradeList: { gap: Spacing[3] },
 gradeOption: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: Spacing[4],
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surface,
 },
 gradeOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
 gradeOptionText: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.medium,
 color: Colors.textPrimary,
 },
 gradeOptionTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },
 gradeOptionSub: {
 fontSize: Typography.size.sm,
 color: Colors.textTertiary,
 marginTop: 2,
 },
 gradeOptionSubActive: { color: Colors.accent },
 gradeCheck: {
 width: 22,
 height: 22,
 borderRadius: Radii.full,
 backgroundColor: Colors.accent,
 alignItems: 'center',
 justifyContent: 'center',
 },
 gradeCheckText: { fontSize: Typography.size.xs, color: Colors.white, fontWeight: Typography.weight.bold },

 // Interests
 interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
 interestPill: {
 paddingHorizontal: Spacing[4],
 paddingVertical: Spacing[2],
 borderRadius: Radii.full,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surface,
 },
 interestPillActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
 interestPillText: {
 fontSize: Typography.size.base,
 fontWeight: Typography.weight.medium,
 color: Colors.textSecondary,
 },
 interestPillTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },

 // City / school autocomplete
 suggestionBox: {
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surface,
 overflow: 'hidden',
 marginBottom: Spacing[3],
 },
 suggestionRow: {
 paddingHorizontal: Spacing[4],
 paddingVertical: Spacing[3],
 borderBottomWidth: 1,
 borderBottomColor: Colors.divider,
 },
 suggestionText: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.medium,
 color: Colors.textPrimary,
 },
 suggestionSub: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.regular,
 color: Colors.textTertiary,
 },
 schoolHintText: {
 fontSize: Typography.size.sm,
 color: Colors.textTertiary,
 marginBottom: Spacing[2],
 },
 schoolPicked: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: Spacing[2],
 padding: Spacing[3],
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.lg,
 borderWidth: 1,
 borderColor: Colors.border,
 marginTop: Spacing[2],
 },
 schoolPickedCheck: {
 fontSize: Typography.size.md,
 color: Colors.accent,
 fontWeight: Typography.weight.bold,
 },
 schoolPickedText: {
 flex: 1,
 fontSize: Typography.size.sm,
 color: Colors.accent,
 lineHeight: Typography.size.sm * 1.5,
 },
 manualLinkText: {
 fontSize: Typography.size.base,
 fontWeight: Typography.weight.medium,
 color: Colors.accent,
 marginBottom: Spacing[3],
 },
 manualBox: {
 padding: Spacing[4],
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surfaceSecondary,
 marginBottom: Spacing[3],
 },
 manualAddBtn: {
 height: 48,
 borderRadius: Radii.lg,
 backgroundColor: Colors.accent,
 alignItems: 'center',
 justifyContent: 'center',
 },

 // Logistics: matching priorities
 priorityRow: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: Spacing[3],
 padding: Spacing[3],
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surface,
 },
 priorityLabel: {
 flex: 1,
 fontSize: Typography.size.base,
 fontWeight: Typography.weight.medium,
 color: Colors.textPrimary,
 },
 prioritySegment: {
 flexDirection: 'row',
 borderRadius: Radii.full,
 backgroundColor: Colors.surfaceSecondary,
 padding: 2,
 },
 prioritySegmentBtn: {
 paddingHorizontal: Spacing[3],
 paddingVertical: Spacing[1],
 borderRadius: Radii.full,
 },
 prioritySegmentBtnActive: { backgroundColor: Colors.accent },
 prioritySegmentText: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.medium,
 color: Colors.textSecondary,
 },
 prioritySegmentTextActive: { color: Colors.white, fontWeight: Typography.weight.semibold },

 // Priority 1–5 scale
 priorityScaleLegend: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 marginBottom: Spacing[3],
 paddingHorizontal: Spacing[1],
 },
 priorityScaleLegendText: {
 fontSize: Typography.size.xs,
 color: Colors.textTertiary,
 fontWeight: Typography.weight.medium,
 },
 priorityCard: {
 padding: Spacing[3],
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surface,
 gap: Spacing[3],
 },
 priorityCardHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 gap: Spacing[2],
 },
 priorityInfoIcon: {
 fontSize: Typography.size.lg,
 color: Colors.accent,
 fontWeight: Typography.weight.bold,
 },
 priorityScale: {
 flexDirection: 'row',
 gap: Spacing[2],
 },
 priorityScaleBtn: {
 flex: 1,
 height: 44,
 borderRadius: Radii.md,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surfaceSecondary,
 alignItems: 'center',
 justifyContent: 'center',
 },
 priorityScaleBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accent },
 priorityScaleText: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.textSecondary,
 },
 priorityScaleTextActive: { color: Colors.white },

 // Birthday picker + info sheets
 pickerBackdrop: {
 flex: 1,
 backgroundColor: 'rgba(0,0,0,0.4)',
 justifyContent: 'flex-end',
 },
 pickerSheet: {
 backgroundColor: Colors.surface,
 borderTopLeftRadius: Radii.xl,
 borderTopRightRadius: Radii.xl,
 paddingBottom: Spacing[8],
 },
 pickerHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: Spacing[4],
 paddingVertical: Spacing[3],
 borderBottomWidth: 1,
 borderBottomColor: Colors.divider,
 },
 pickerTitle: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 },
 pickerDone: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.accent,
 },
 infoSheet: {
 marginTop: 'auto',
 marginBottom: 'auto',
 marginHorizontal: Spacing[6],
 padding: Spacing[5],
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 ...Shadows.elevated,
 },
 infoTitle: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 marginBottom: Spacing[2],
 },
 infoBody: {
 fontSize: Typography.size.base,
 color: Colors.textSecondary,
 lineHeight: Typography.size.base * 1.6,
 marginBottom: Spacing[4],
 },
 infoCloseBtn: {
 height: 44,
 borderRadius: Radii.lg,
 backgroundColor: Colors.accent,
 alignItems: 'center',
 justifyContent: 'center',
 },
 infoCloseText: {
 fontSize: Typography.size.base,
 fontWeight: Typography.weight.semibold,
 color: Colors.white,
 },

 // Location toggle
 toggleRow: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: Spacing[4],
 backgroundColor: Colors.surfaceSecondary,
 borderRadius: Radii.lg,
 marginBottom: Spacing[4],
 },
 toggleLeft: { flex: 1, marginRight: Spacing[4] },
 toggleTitle: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 toggleSub: { fontSize: Typography.size.sm, color: Colors.textTertiary },
 toggle: {
 width: 46,
 height: 26,
 borderRadius: Radii.full,
 backgroundColor: Colors.border,
 justifyContent: 'center',
 padding: 3,
 },
 toggleActive: { backgroundColor: Colors.accent },
 toggleThumb: {
 width: 20,
 height: 20,
 borderRadius: Radii.full,
 backgroundColor: Colors.white,
 ...Shadows.card,
 },
 toggleThumbActive: { alignSelf: 'flex-end' },

 // Readiness
 readinessGrid: { gap: Spacing[3] },
 readinessOption: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 padding: Spacing[4],
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surface,
 },
 readinessOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
 readinessText: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.medium,
 color: Colors.textPrimary,
 },
 readinessTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },
 readinessCheck: {
 fontSize: Typography.size.md,
 color: Colors.accent,
 fontWeight: Typography.weight.bold,
 },
 readinessHint: {
 marginTop: Spacing[5],
 padding: Spacing[4],
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.lg,
 borderWidth: 1,
 borderColor: Colors.border,
 },
 readinessHintText: {
 fontSize: Typography.size.sm,
 color: Colors.accent,
 lineHeight: Typography.size.sm * 1.6,
 },

 // Bottom bar
 bottomBar: {
 paddingHorizontal: Spacing.screenPadding,
 paddingBottom: Spacing[6],
 paddingTop: Spacing[3],
 borderTopWidth: 1,
 borderTopColor: Colors.divider,
 backgroundColor: Colors.surface,
 alignItems: 'center',
 gap: Spacing[3],
 },
 continueBtn: {
 width: '100%',
 height: 52,
 borderRadius: Radii.lg,
 backgroundColor: Colors.accent,
 alignItems: 'center',
 justifyContent: 'center',
 ...Shadows.elevated,
 },
 continueBtnDisabled: {
 backgroundColor: Colors.textDisabled,
 shadowOpacity: 0,
 elevation: 0,
 },
 continueBtnText: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.white,
 letterSpacing: 0.1,
 },
 stepCounter: { fontSize: Typography.size.sm, color: Colors.textTertiary },
});