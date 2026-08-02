// screens/OnboardingScreen.js
// 8-step onboarding: Welcome → Name → Grade → Interests → School → GPA → Readiness → Demographics
// GPA + readiness signals feed into competitiveness matching in matching.js.
// School (via the NCES directory) supplies both city/state AND the school
// match itself — there's no separate location step since the school search
// already gives us that. School power hard eligibility gating: programs with
// residency/school-location requirements the user can't meet score 0%.

import { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../context/UserContext';
import { searchSchools } from '../utils/schools';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';

// DATA 

const GRADES = ['9th Grade', '10th Grade', '11th Grade', '12th Grade'];

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
// qualify for — never shown to anyone or used for anything else.
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

const TOTAL_STEPS = 8;

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

// STEP 2: NAME 

const NameStep = ({ name, onChangeName }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 2 of {TOTAL_STEPS}</Text>
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

// STEP 3: GRADE 

const GradeStep = ({ selected, onSelect }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 3 of {TOTAL_STEPS}</Text>
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
 </View>
);

// STEP 4: INTERESTS 

const InterestsStep = ({ selected, onToggle }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 4 of {TOTAL_STEPS}</Text>
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

// STEP 5: SCHOOL (also gives us the student's city/state — no separate location step needed)

const SchoolStep = ({ school, onSelectSchool }) => {
 const [query, setQuery] = useState(school ? school.name : '');
 const [results, setResults] = useState([]);
 const [searching, setSearching] = useState(false);
 const debounceRef = useRef(null);

 // Debounced search against the Supabase NCES school directory.
 // All setState happens inside the timeout callback (never synchronously in the effect).
 useEffect(() => {
 if (debounceRef.current) clearTimeout(debounceRef.current);
 debounceRef.current = setTimeout(async () => {
 // No search when the query is empty/short or is the already-picked school
 if ((school && query === school.name) || query.trim().length < 2) {
 setResults([]);
 return;
 }
 setSearching(true);
 const found = await searchSchools(query, null);
 setResults(found);
 setSearching(false);
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
 <Text style={styles.stepLabel}>Step 5 of {TOTAL_STEPS}</Text>
 <Text style={styles.stepHeadline}>What school do you go to?</Text>
 <Text style={styles.stepSubtitle}>
 Some internships are only open to certain schools or districts. Optional — you can skip this.
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

// STEP 6: GPA

const GpaStep = ({ selected, onSelect }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 6 of {TOTAL_STEPS}</Text>
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

// STEP 7: READINESS

const ReadinessStep = ({ selected, onToggle }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 7 of {TOTAL_STEPS}</Text>
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

// STEP 8: GENDER + RACE/ETHNICITY (optional)

const DemographicsStep = ({ gender, onSelectGender, race, onToggleRace }) => (
 <View style={styles.stepContainer}>
 <Text style={styles.stepLabel}>Step 8 of {TOTAL_STEPS}</Text>
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
 const [name, setName] = useState('');
 const [grade, setGrade] = useState('');
 const [interests, setInterests] = useState([]);
 // City/state are derived from the chosen school (see buildProfile) — no
 // separate location step, since asking for the school already covers it.
 const [school, setSchool] = useState(null);
 const [gpaRange, setGpaRange] = useState('');
 const [readiness, setReadiness] = useState([]);
 const [gender, setGender] = useState('');
 const [race, setRace] = useState([]);
 const scrollRef = useRef(null);

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
 if (step === 2) return name.trim().length > 0;
 if (step === 3) return grade !== '';
 if (step === 4) return interests.length > 0;
 if (step === 5) return true; // school optional
 if (step === 6) return true; // GPA optional
 if (step === 7) return true; // readiness optional
 if (step === 8) return true; // gender/race optional
 return false;
 };

 // City/state come from the chosen school's NCES record — location "City, ST"
 // feeds the existing city/state parsing in matching.js
 const buildProfile = () => {
 const schoolState = (school && school.state) || null;
 const schoolCity  = (school && school.city) || '';
 return {
 name: name.trim(),
 grade,
 interests,
 state: schoolState,
 city: schoolCity,
 school,
 location: schoolCity && schoolState ? `${schoolCity}, ${schoolState}` : '',
 remoteOnly: false,
 gpaRange,
 readiness,
 gender,
 race,
 onboardingDone: true,
 };
 };

 const handleContinue = () => {
 if (step < TOTAL_STEPS) {
 setStep(step + 1);
 } else {
 setUser(buildProfile());
 }
 };

 // Skip finishes onboarding with whatever's been entered so far.
 // (Previously it wiped ALL collected data — a user who filled 6 steps and
 // skipped the 7th lost everything and got a fully generic feed.)
 const handleSkip = () => {
 setUser(buildProfile());
 };

 const stepComponents = [
 <WelcomeStep key="welcome" />,
 <NameStep key="name" name={name} onChangeName={setName} />,
 <GradeStep key="grade" selected={grade} onSelect={setGrade} />,
 <InterestsStep key="interests" selected={interests} onToggle={toggleInterest} />,
 <SchoolStep key="school" school={school} onSelectSchool={setSchool} />,
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

 {/* Skip is available on every step — it keeps whatever's been entered */}
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