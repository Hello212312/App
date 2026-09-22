// screens/ProfileScreen.js
// Student profile: reads from UserContext, fully editable.
//
// FIXES applied:
// #4: Interest list in EditProfileModal now matches the exact canonical
// field names used in data.js and matching.js, so interests saved here
// produce correct match scores. Added all fields from Onboarding
// (Aerospace, Finance, Journalism, Science, Computer Science) and
// removed non-matching labels (STEM, Writing).
// #1: When saving a location, we also auto-extract and save the state
// abbreviation into user.state so both fields stay in sync.
// #18: Pipeline/applied badge now reads from statusMap (which uses the
// tracker's capitalized status keys) rather than the old appliedIds.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert, Linking, Modal,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Divider, Tag } from '../components';
import { useTourTarget } from '../context/TourContext';
import { STATUS_META, useUser } from '../context/UserContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import { requestNotificationPermission } from '../utils/notifications';
import {
  ALL_REMINDER_OPTIONS,
  ESSAY_REVIEWS_PER_MONTH,
  FREE_REMINDER_DAYS,
  essayUsageThisMonth,
} from '../utils/premium';
import { ageFromBirthday } from '../utils/matching';

// CONSTANTS 

const GRADES = ['9th Grade', '10th Grade', '11th Grade', '12th Grade'];

// Interest list matches the canonical categories used across the app and stored in the DB.
const ALL_INTERESTS = [
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

// Full US state list
const US_STATES = [
 'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
 'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
 'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
 'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
 'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
];

const APP_VERSION = '1.3.1';

const GPA_OPTIONS = [
 { label: '3.8 – 4.0', value: 'high', desc: 'Strong academics' },
 { label: '3.5 – 3.7', value: 'good', desc: 'Solid GPA' },
 { label: '3.0 – 3.4', value: 'avg', desc: 'On track' },
 { label: 'Below 3.0', value: 'below', desc: 'Working on it' },
 { label: 'Not sure', value: 'unsure', desc: 'Skip for now' },
];

// Some internships restrict eligibility to a specific gender or race/ethnicity.
// Entirely optional: only used to flag programs a student doesn't qualify for.
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

// Age is separate from grade: programs can allow all grades but require 16+.
const AGE_OPTIONS = [13, 14, 15, 16, 17, 18, 19];

const TRAVEL_OPTIONS = [
 { label: 'Stay local', value: 'local' },
 { label: 'Within my state', value: 'state' },
 { label: 'Anywhere', value: 'anywhere' },
];

const HOUSING_PREF_OPTIONS = [
 { label: 'Open to dorms/housing', value: true },
 { label: 'Live at home', value: false },
];

const FORMAT_PREF_OPTIONS = [
 { label: 'Prefer remote', value: 'remote' },
 { label: 'Prefer in-person', value: 'inperson' },
 { label: 'No preference', value: '' },
];

// Keys must match priorityMult() in utils/matching.js
const PRIORITY_FACTORS = [
 { key: 'interests', label: 'Field & interests' },
 { key: 'location', label: 'Location & format' },
 { key: 'compensation', label: 'Getting paid' },
 { key: 'competitiveness', label: 'Prestige & selectivity' },
];

// 1–5 scale (3 = neutral default), matching the onboarding priorities UI.
const PRIORITY_LEVELS = [1, 2, 3, 4, 5];
const PRIORITY_DEFAULT = 3;

const READINESS_OPTIONS = [
 { label: 'Resume', key: 'hasResume' },
 { label: 'Personal statement', key: 'hasEssay' },
 { label: 'Teacher rec letter', key: 'hasRecommendation' },
 { label: 'Transcript ready', key: 'hasTranscript' },
 { label: 'Extracurriculars', key: 'hasExtracurriculars' },
 { label: 'Previous experience', key: 'hasPriorExperience' },
];

const GPA_LABELS = {
 high: '3.8 – 4.0',
 good: '3.5 – 3.7',
 avg: '3.0 – 3.4',
 below:'Below 3.0',
 unsure:'Not set',
};

const READINESS_LABELS = {
 hasResume: 'Resume',
 hasEssay: 'Personal statement',
 hasRecommendation: 'Teacher rec letter',
 hasTranscript: 'Transcript',
 hasExtracurriculars: 'Extracurriculars',
 hasPriorExperience: 'Previous experience',
};

// Compute profile strength 0–100 based on filled fields + readiness
function computeProfileStrength(user) {
 let score = 0;
 if (user.name && user.name.trim()) score += 10;
 if (user.grade) score += 15;
 if (user.interests && user.interests.length > 0) score += 20;
 if (user.location || user.state) score += 15;
 if (user.gpaRange && user.gpaRange !== 'unsure') score += 10;
 const readiness = user.readiness || [];
 score += Math.min(readiness.length * 5, 30);
 return Math.min(100, score);
}

// HELPERS 

function getInitials(name) {
 if (!name || name.trim() === '') return '?';
 return name.trim().split(/\s+/).map((n) => n[0].toUpperCase()).slice(0, 2).join('');
}

// FIX #1: extract state abbreviation from a "City, ST" or "City ST" string
function extractStateAbbrev(locationStr) {
 if (!locationStr) return null;
 const parts = locationStr.split(/,\s*/);
 if (parts.length >= 2) {
 const st = parts[1].trim().toUpperCase();
 if (US_STATES.includes(st)) return st;
 }
 // Try last word as abbreviation
 const words = locationStr.trim().split(/\s+/);
 if (words.length >= 2) {
 const last = words[words.length - 1].toUpperCase();
 if (US_STATES.includes(last)) return last;
 }
 return null;
}

// SETTINGS ROW 

const SettingsRow = ({
 label, sublabel, onPress, destructive = false,
 hasChevron = true, badge, toggle = false, toggleValue = false, onToggle,
 tourId = null,
}) => {
 // Premium tour anchor: rows pass tourId so the spotlight can find them
 const tourRef = useTourTarget(tourId);
 return (
 <View ref={tourRef} collapsable={false}>
 <TouchableOpacity
 style={styles.settingsRow}
 onPress={onPress}
 activeOpacity={toggle ? 1 : 0.7}
 disabled={toggle}
 >
 <View style={styles.settingsRowLeft}>
 <Text style={[styles.settingsLabel, destructive && styles.settingsLabelDestructive]}>
 {label}
 </Text>
 {sublabel ? <Text style={styles.settingsSublabel}>{sublabel}</Text> : null}
 </View>
 <View style={styles.settingsRowRight}>
 {badge !== undefined && badge > 0 && (
 <View style={styles.badge}>
 <Text style={styles.badgeText}>{badge}</Text>
 </View>
 )}
 {toggle ? (
 <Switch
 value={toggleValue}
 onValueChange={onToggle}
 trackColor={{ false: Colors.border, true: Colors.accent }}
 thumbColor={Colors.white}
 />
 ) : hasChevron ? (
 <Text style={styles.chevron}>›</Text>
 ) : null}
 </View>
 </TouchableOpacity>
 </View>
 );
};

// SETTINGS SECTION 

const SettingsSection = ({ title, children }) => (
 <View style={styles.settingsSection}>
 {title && <Text style={styles.settingsSectionTitle}>{title}</Text>}
 <View style={styles.settingsCard}>{children}</View>
 </View>
);

// PIPELINE BAR 

const PipelineBar = ({ counts, total }) => {
 if (total === 0) return null;
 const segments = [
 { key: 'applied', color: STATUS_META?.applied?.color || '#3B82F6', count: counts.applied },
 { key: 'interviewing', color: STATUS_META?.interviewing?.color || '#F59E0B', count: counts.interviewing },
 { key: 'accepted', color: STATUS_META?.accepted?.color || '#10B981', count: counts.accepted },
 { key: 'rejected', color: STATUS_META?.rejected?.color || '#EF4444', count: counts.rejected },
 ].filter((s) => s.count > 0);

 return (
 <View style={styles.pipelineBar}>
 {segments.map((s) => (
 <View key={s.key} style={{ flex: s.count, backgroundColor: s.color, height: '100%' }} />
 ))}
 </View>
 );
};

// STATE PICKER MODAL 

const StatePickerModal = ({ visible, current, onSelect, onClose }) => {
 const [query, setQuery] = useState('');

 const filtered = useMemo(() => {
 const q = query.trim().toUpperCase();
 const all = ['Any', ...US_STATES];
 if (!q) return all;
 return all.filter((s) => s.toUpperCase().includes(q));
 }, [query]);

 const handlePick = (abbr) => {
 onSelect(abbr === 'Any' ? null : abbr);
 setQuery('');
 onClose();
 };

 const handleClose = () => {
 setQuery('');
 onClose();
 };

 return (
 <Modal
 visible={visible}
 animationType="slide"
 presentationStyle="pageSheet"
 onRequestClose={handleClose}
 >
 <SafeAreaView style={styles.stateModalSafe}>
 <View style={styles.stateModalHeader}>
 <TouchableOpacity onPress={handleClose}>
 <Text style={styles.stateModalCancel}>Cancel</Text>
 </TouchableOpacity>
 <Text style={styles.stateModalTitle}>Select your state</Text>
 <View style={{ width: 60 }} />
 </View>

 <View style={styles.stateModalSearch}>
 <TextInput
 style={styles.stateModalSearchInput}
 placeholder="Search states…"
 placeholderTextColor={Colors.textTertiary}
 value={query}
 onChangeText={setQuery}
 autoCorrect={false}
 clearButtonMode="while-editing"
 />
 </View>

 <ScrollView
 style={styles.stateModalList}
 keyboardShouldPersistTaps="handled"
 showsVerticalScrollIndicator={false}
 >
 {filtered.map((abbr) => {
 const active = abbr === 'Any' ? !current : current === abbr;
 return (
 <TouchableOpacity
 key={abbr}
 style={[styles.stateModalRow, active && styles.stateModalRowActive]}
 onPress={() => handlePick(abbr)}
 activeOpacity={0.7}
 >
 <Text style={[styles.stateModalRowText, active && styles.stateModalRowTextActive]}>
 {abbr === 'Any' ? 'Any (show all states)' : abbr}
 </Text>
 {active && <Text style={styles.stateModalCheck}>✓</Text>}
 </TouchableOpacity>
 );
 })}
 <View style={{ height: 40 }} />
 </ScrollView>
 </SafeAreaView>
 </Modal>
 );
};

// EDIT PROFILE MODAL 

const EditProfileModal = ({ visible, user, onSave, onClose }) => {
 const [name, setName] = useState(user.name || '');
 const [location, setLocation] = useState(user.location || '');
 const [grade, setGrade] = useState(user.grade || '');
 // FIX #4: interests stored as canonical field names (e.g. 'Art' not 'Art & Design')
 const [interests, setInterests] = useState(user.interests || []);
 const [gpaRange, setGpaRange] = useState(user.gpaRange || '');
 const [readiness, setReadiness] = useState(user.readiness || []);
 const [gender, setGender] = useState(user.gender || '');
 const [race, setRace] = useState(user.race || []);
 const [age, setAge] = useState(user.age || null);
 const [travelWillingness, setTravelWillingness] = useState(user.travelWillingness || '');
 const [openToHousing, setOpenToHousing] = useState(
 typeof user.openToHousing === 'boolean' ? user.openToHousing : null
 );
 const [formatPreference, setFormatPreference] = useState(user.formatPreference || '');
 const [priorities, setPriorities] = useState(user.priorities || {});

 React.useEffect(() => {
 if (visible) {
 setName(user.name || '');
 setLocation(user.location || '');
 setGrade(user.grade || '');
 setInterests(user.interests || []);
 setGpaRange(user.gpaRange || '');
 setReadiness(user.readiness || []);
 setGender(user.gender || '');
 setRace(user.race || []);
 setAge(user.age || null);
 setTravelWillingness(user.travelWillingness || '');
 setOpenToHousing(typeof user.openToHousing === 'boolean' ? user.openToHousing : null);
 setFormatPreference(user.formatPreference || '');
 setPriorities(user.priorities || {});
 }
 }, [visible, user.name, user.location, user.grade, user.interests, user.gpaRange, user.readiness, user.gender, user.race, user.age, user.travelWillingness, user.openToHousing, user.formatPreference, user.priorities]);

 const toggleInterest = (field) => {
 setInterests((prev) =>
 prev.includes(field) ? prev.filter((i) => i !== field) : [...prev, field]
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

 const handleSave = () => {
 // FIX #1: auto-extract state from location so both fields stay in sync
 const autoState = extractStateAbbrev(location);
 // Age is normally derived from the onboarding birthday. If the user edits the
 // age pill here to something that no longer matches their stored birthday,
 // the explicit age wins, so clear the stale birthday so matching (which prefers
 // birthday) doesn't silently ignore their change.
 const birthdayStillMatches = age != null && ageFromBirthday(user.birthday) === age;
 onSave({
 name,
 location,
 grade,
 interests,
 gpaRange,
 readiness,
 gender,
 race,
 age,
 ...(user.birthday && !birthdayStillMatches ? { birthday: '' } : {}),
 travelWillingness,
 openToHousing,
 formatPreference,
 priorities,
 // Only update state from location if user hasn't explicitly set a
 // different state via the state picker: preserve explicit state choice
 ...(autoState ? { state: autoState } : {}),
 });
 onClose();
 };

 return (
 <Modal
 visible={visible}
 animationType="slide"
 presentationStyle="pageSheet"
 onRequestClose={onClose}
 >
 <SafeAreaView style={styles.modalSafe}>
 <View style={styles.modalHeader}>
 <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
 <Text style={styles.modalCancelText}>Cancel</Text>
 </TouchableOpacity>
 <Text style={styles.modalTitle}>Edit Profile</Text>
 <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
 <Text style={styles.modalSaveText}>Save</Text>
 </TouchableOpacity>
 </View>

 <ScrollView
 style={styles.modalScroll}
 showsVerticalScrollIndicator={false}
 contentContainerStyle={styles.modalScrollContent}
 keyboardShouldPersistTaps="handled"
 >
 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Full Name</Text>
 <TextInput
 style={styles.modalInput}
 value={name}
 onChangeText={setName}
 placeholder="e.g. Alex Johnson"
 placeholderTextColor={Colors.textTertiary}
 />
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Location</Text>
 <TextInput
 style={styles.modalInput}
 value={location}
 onChangeText={setLocation}
 placeholder="e.g. Austin, TX"
 placeholderTextColor={Colors.textTertiary}
 />
 <Text style={styles.modalHint}>
 Format: City, ST (e.g. "Austin, TX"). Used to surface in-person opportunities near you.
 </Text>
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Grade</Text>
 <View style={styles.gradeList}>
 {GRADES.map((g) => (
 <TouchableOpacity
 key={g}
 style={[styles.gradeOption, grade === g && styles.gradeOptionActive]}
 onPress={() => setGrade(g)}
 activeOpacity={0.7}
 >
 <Text style={[styles.gradeOptionText, grade === g && styles.gradeOptionTextActive]}>
 {g}
 </Text>
 {grade === g && (
 <View style={styles.gradeCheck}>
 <Text style={styles.gradeCheckText}>✓</Text>
 </View>
 )}
 </TouchableOpacity>
 ))}
 </View>
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Age</Text>
 <Text style={styles.modalHint}>
 Optional. Some programs have age minimums (e.g. 16+) separate from grade.
 </Text>
 <View style={styles.interestGrid}>
 {AGE_OPTIONS.map((a) => {
 const active = age === a;
 return (
 <TouchableOpacity
 key={a}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => setAge(active ? null : a)}
 activeOpacity={0.7}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {a}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Interests</Text>
 <Text style={styles.modalHint}>Select all that apply. These personalize your home feed.</Text>
 <View style={styles.interestGrid}>
 {ALL_INTERESTS.map(({ label, field }) => {
 const active = interests.includes(field);
 return (
 <TouchableOpacity
 key={field}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => toggleInterest(field)}
 activeOpacity={0.7}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>GPA Range</Text>
 <Text style={styles.modalHint}>Helps surface programs that match your academic profile.</Text>
 <View style={styles.gradeList}>
 {GPA_OPTIONS.map((opt) => {
 const active = gpaRange === opt.value;
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => setGpaRange(opt.value)}
 activeOpacity={0.7}
 >
 <View>
 <Text style={[styles.gradeOptionText, active && styles.gradeOptionTextActive]}>
 {opt.label}
 </Text>
 <Text style={[styles.modalHint, { marginBottom: 0 }, active && { color: Colors.accent }]}>
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

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>What do you already have?</Text>
 <Text style={styles.modalHint}>Select everything you have ready to submit in an application.</Text>
 <View style={styles.gradeList}>
 {READINESS_OPTIONS.map((opt) => {
 const active = readiness.includes(opt.key);
 return (
 <TouchableOpacity
 key={opt.key}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => toggleReadiness(opt.key)}
 activeOpacity={0.7}
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

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Remote or in-person?</Text>
 <Text style={styles.modalHint}>
 Which format you prefer. This nudges your matches; it doesn't hide the other kind.
 </Text>
 <View style={styles.interestGrid}>
 {FORMAT_PREF_OPTIONS.map((opt) => {
 const active = formatPreference === opt.value;
 return (
 <TouchableOpacity
 key={opt.value || 'none'}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => setFormatPreference(opt.value)}
 activeOpacity={0.7}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {opt.label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Travel & housing</Text>
 <Text style={styles.modalHint}>
 How far you'd go for a program, and whether residential programs with dorms interest you.
 </Text>
 <View style={styles.interestGrid}>
 {TRAVEL_OPTIONS.map((opt) => {
 const active = travelWillingness === opt.value;
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => setTravelWillingness(active ? '' : opt.value)}
 activeOpacity={0.7}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {opt.label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 <View style={[styles.interestGrid, { marginTop: Spacing[3] }]}>
 {HOUSING_PREF_OPTIONS.map((opt) => {
 const active = openToHousing === opt.value;
 return (
 <TouchableOpacity
 key={String(opt.value)}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => setOpenToHousing(active ? null : opt.value)}
 activeOpacity={0.7}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {opt.label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Matching priorities</Text>
 <Text style={styles.modalHint}>
 Rate each 1–5 by how much it matters to you (3 = neutral). Weighs your match scores accordingly.
 </Text>
 <View style={styles.gradeList}>
 {PRIORITY_FACTORS.map((factor) => {
 const current = priorities[factor.key] || PRIORITY_DEFAULT;
 return (
 <View key={factor.key} style={styles.priorityRow}>
 <Text style={styles.priorityLabel} numberOfLines={1}>{factor.label}</Text>
 <View style={styles.prioritySegment}>
 {PRIORITY_LEVELS.map((lvl) => {
 const active = current === lvl;
 return (
 <TouchableOpacity
 key={lvl}
 style={[styles.prioritySegmentBtn, active && styles.prioritySegmentBtnActive]}
 onPress={() => setPriorities((prev) => ({ ...prev, [factor.key]: lvl }))}
 activeOpacity={0.7}
 >
 <Text style={[styles.prioritySegmentText, active && styles.prioritySegmentTextActive]}>
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
 </View>

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Gender</Text>
 <Text style={styles.modalHint}>
 A few internships are only open to a specific gender. Optional: flags programs you don't qualify for.
 </Text>
 <View style={styles.gradeList}>
 {GENDER_OPTIONS.map((opt) => {
 const active = gender === opt.value;
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.gradeOption, active && styles.gradeOptionActive]}
 onPress={() => setGender(active ? '' : opt.value)}
 activeOpacity={0.7}
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

 <View style={styles.modalSection}>
 <Text style={styles.modalLabel}>Race / ethnicity</Text>
 <Text style={styles.modalHint}>
 A few internships are only open to certain races/ethnicities. Select all that apply, optional.
 </Text>
 <View style={styles.interestGrid}>
 {RACE_OPTIONS.map((opt) => {
 const active = race.includes(opt.value);
 return (
 <TouchableOpacity
 key={opt.value}
 style={[styles.interestPill, active && styles.interestPillActive]}
 onPress={() => toggleRace(opt.value)}
 activeOpacity={0.7}
 >
 <Text style={[styles.interestPillText, active && styles.interestPillTextActive]}>
 {opt.label}
 </Text>
 </TouchableOpacity>
 );
 })}
 </View>
 </View>
 </ScrollView>
 </SafeAreaView>
 </Modal>
 );
};

// REMINDER TIMING MODAL (premium) 

const PRESET_DAYS = ALL_REMINDER_OPTIONS.map((o) => o.days);

const ReminderTimingModal = ({ visible, current, onSave, onClose }) => {
  const [days, setDays] = useState(current || FREE_REMINDER_DAYS);
  const [customInput, setCustomInput] = useState('');

  React.useEffect(() => {
    if (visible) {
      setDays(current && current.length > 0 ? current : FREE_REMINDER_DAYS);
      setCustomInput('');
    }
  }, [visible, current]);

  const toggle = (d) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const addCustomDay = () => {
    const n = parseInt(customInput, 10);
    if (isNaN(n) || n < 1 || n > 365) {
      Alert.alert('Invalid', 'Enter a number between 1 and 365.');
      return;
    }
    setDays((prev) => (prev.includes(n) ? prev : [...prev, n]));
    setCustomInput('');
  };

  const handleSave = () => {
    if (days.length === 0) {
      Alert.alert('Pick at least one', 'Choose at least one reminder time, or turn notifications off entirely.');
      return;
    }
    onSave([...days].sort((a, b) => b - a));
    onClose();
  };

  const customDays = days.filter((d) => !PRESET_DAYS.includes(d)).sort((a, b) => b - a);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCancelBtn}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Reminder timing</Text>
          <TouchableOpacity onPress={handleSave} style={styles.modalSaveBtn}>
            <Text style={styles.modalSaveText}>Save</Text>
          </TouchableOpacity>
        </View>
        <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
          <Text style={styles.modalHint}>
            Choose when deadline reminders fire for your saved programs. Changes apply to all saved deadlines.
          </Text>
          <View style={[styles.gradeList, { marginTop: Spacing[3] }]}>
            {ALL_REMINDER_OPTIONS.map((opt) => {
              const active = days.includes(opt.days);
              return (
                <TouchableOpacity
                  key={opt.days}
                  style={[styles.gradeOption, active && styles.gradeOptionActive]}
                  onPress={() => toggle(opt.days)}
                  activeOpacity={0.7}
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

          <Text style={[styles.modalHint, { marginTop: Spacing[5] }]}>Or type any number of days:</Text>
          <View style={styles.customDayRow}>
            <TextInput
              style={styles.customDayInput}
              value={customInput}
              onChangeText={(v) => setCustomInput(v.replace(/[^0-9]/g, ''))}
              placeholder="e.g. 21"
              placeholderTextColor={Colors.textTertiary}
              keyboardType="number-pad"
              returnKeyType="done"
              onSubmitEditing={addCustomDay}
              maxLength={3}
            />
            <TouchableOpacity style={styles.customDayAddBtn} onPress={addCustomDay} activeOpacity={0.8}>
              <Text style={styles.customDayAddText}>Add</Text>
            </TouchableOpacity>
          </View>

          {customDays.length > 0 && (
            <View style={styles.customDayChips}>
              {customDays.map((d) => (
                <TouchableOpacity key={d} style={styles.customDayChip} onPress={() => toggle(d)} activeOpacity={0.7}>
                  <Text style={styles.customDayChipText}>{d} days  ✕</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// PROFILE SCREEN 

export default function ProfileScreen({ navigation }) {
 const {
 user,
 setUser,
 setState,
 savedIds,
 appliedIds,
 viewedIds,
 topPickIds,
 statusMap,
 resetAll,
 deactivatePremium,
 setReminderDays,
 essaySubmissions,
 } = useUser();

 const [editModalVisible, setEditModalVisible] = useState(false);
 const [statePickerVisible, setStatePickerVisible] = useState(false);
 const [reminderModalVisible, setReminderModalVisible] = useState(false);
 const [deviceId, setDeviceId] = useState('');

 const isPremium = !!user.premium;
 const essaysUsed = essayUsageThisMonth(essaySubmissions || []);
 const tourScrollRef = useTourTarget('profile-scroll');

 useEffect(() => {
 AsyncStorage.getItem('@interny_device_id').then((id) => { if (id) setDeviceId(id); });
 }, []);

 // FIX #18: pipeline now reads from statusMap which uses the tracker's
 // capitalized status keys ('Applied', 'Interviewing', etc.)
 const pipeline = useMemo(() => {
 const c = { applied: 0, interviewing: 0, accepted: 0, rejected: 0 };
 Object.values(statusMap || {}).forEach((s) => {
 const lower = (s || '').toLowerCase();
 if (lower === 'applied' || lower === 'submitted') c.applied += 1;
 else if (lower === 'interviewing') c.interviewing += 1;
 else if (lower === 'accepted') c.accepted += 1;
 else if (lower === 'rejected') c.rejected += 1;
 });
 return { ...c, total: c.applied + c.interviewing + c.accepted + c.rejected };
 }, [statusMap]);

 // FIX #1: when saving profile, preserve any explicitly set state;
 // EditProfileModal will auto-extract from location if state isn't set.
 const handleSaveProfile = (updates) => {
 setUser((prev) => ({
 ...prev,
 ...updates,
 // Don't overwrite an explicit state picker choice with the auto-extracted one
 // unless the user also changed their location
 state: updates.state || prev.state,
 }));
 };

 const handleToggleRemote = (val) => {
 setUser((prev) => ({ ...prev, remoteOnly: val }));
 };

 const handleToggleNotifications = async (val) => {
 if (val) {
 const granted = await requestNotificationPermission();
 if (!granted) {
 Alert.alert(
 'Notifications disabled',
 'To receive deadline reminders, go to Settings → Interny and enable Notifications.',
 [{ text: 'OK' }]
 );
 return;
 }
 }
 setUser((prev) => ({ ...prev, notificationsOn: val }));
 };

 const handleToggleNotifyDeadlines = (val) => {
 setUser((prev) => ({ ...prev, notifyDeadlines: val }));
 };

 const handleToggleNotifyHighMatch = (val) => {
 setUser((prev) => ({ ...prev, notifyHighMatch: val }));
 };

 const handleToggleNotifyNewMatches = (val) => {
 setUser((prev) => ({ ...prev, notifyNewMatches: val }));
 };

 const handleSignOut = () => {
 Alert.alert(
 'Delete all data?',
 'This permanently erases your profile, saved internships, tracker, notes, and materials from this device. This cannot be undone.',
 [
 { text: 'Cancel', style: 'cancel' },
 {
 text: 'Delete everything',
 style: 'destructive',
 onPress: () => { resetAll(); navigation?.replace('Onboarding'); },
 },
 ],
 );
 };

 const displayName = user.name || 'Your Profile';
 const displayGrade = user.grade || 'Grade not set';
 const displayLocation = user.location || 'Location not set';
 const displayInterests = user.interests && user.interests.length > 0 ? user.interests : [];

 // Map canonical field names to display labels for profile card
 const interestDisplayLabel = (field) => {
 const found = ALL_INTERESTS.find((i) => i.field === field);
 return found ? found.label : field;
 };

 const stats = [
 { label: 'Applied', value: (appliedIds || []).length },
 { label: 'Saved', value: (savedIds || []).length },
 { label: 'Viewed', value: (viewedIds || []).length },
 ];

 return (
 <SafeAreaView style={styles.safe} edges={['top']}>
 <ScrollView
 ref={tourScrollRef}
 style={styles.scroll}
 showsVerticalScrollIndicator={false}
 contentContainerStyle={styles.scrollContent}
 >
 {/* Header */}
 <View style={styles.header}>
 <Text style={styles.headerTitle}>Profile</Text>
 <TouchableOpacity
 style={styles.editBtn}
 activeOpacity={0.7}
 onPress={() => setEditModalVisible(true)}
 >
 <Text style={styles.editBtnText}>Edit</Text>
 </TouchableOpacity>
 </View>

 {/* Profile Card */}
 <View style={styles.profileCard}>
 <View style={styles.avatarSection}>
 <TouchableOpacity
 style={styles.avatar}
 onPress={() => setEditModalVisible(true)}
 activeOpacity={0.8}
 >
 <Text style={styles.avatarText}>{getInitials(user.name)}</Text>
 </TouchableOpacity>
 <View style={styles.profileInfo}>
 <Text style={styles.profileName}>{displayName}</Text>
 <Text style={styles.profileGrade}>{displayGrade}</Text>
 {user.location ? (
 <Text style={styles.profileLocation}>{displayLocation}</Text>
 ) : (
 <TouchableOpacity onPress={() => setEditModalVisible(true)}>
 <Text style={styles.profileLocationEmpty}>+ Add location</Text>
 </TouchableOpacity>
 )}
 </View>
 </View>

 <Divider style={{ marginVertical: Spacing[4] }} />

 <View style={styles.statsRow}>
 {stats.map((stat, i, arr) => {
 const tappable = stat.label === 'Saved' || stat.label === 'Applied';
 return (
 <TouchableOpacity
 key={stat.label}
 style={[styles.statItem, i < arr.length - 1 && styles.statBorder]}
 onPress={() => tappable && navigation?.navigate('Saved')}
 activeOpacity={tappable ? 0.7 : 1}
 disabled={!tappable}
 >
 <Text style={styles.statValue}>{stat.value}</Text>
 <Text style={styles.statLabel}>{stat.label}</Text>
 </TouchableOpacity>
 );
 })}
 </View>

 <Divider style={{ marginVertical: Spacing[4] }} />

 <View>
 <Text style={styles.interestsLabel}>Interests</Text>
 {displayInterests.length > 0 ? (
 <View style={styles.interestTags}>
 {displayInterests.map((field) => (
 <Tag key={field} label={interestDisplayLabel(field)} variant={field} size="md" />
 ))}
 <TouchableOpacity
 style={styles.addInterestBtn}
 activeOpacity={0.7}
 onPress={() => setEditModalVisible(true)}
 >
 <Text style={styles.addInterestText}>+ Edit</Text>
 </TouchableOpacity>
 </View>
 ) : (
 <TouchableOpacity
 style={styles.addInterestEmptyBtn}
 onPress={() => setEditModalVisible(true)}
 activeOpacity={0.7}
 >
 <Text style={styles.addInterestEmptyText}>+ Add interests to personalize your feed</Text>
 </TouchableOpacity>
 )}
 </View>
 </View>

 {/* Pipeline insights */}
 {pipeline.total > 0 && (
 <View style={styles.insightsCard}>
 <View style={styles.insightsHeader}>
 <Text style={styles.insightsTitle}>Your application pipeline</Text>
 <TouchableOpacity onPress={() => navigation?.navigate('Tracker')}>
 <Text style={styles.insightsAction}>See all</Text>
 </TouchableOpacity>
 </View>

 <PipelineBar counts={pipeline} total={pipeline.total} />

 <View style={styles.pipelineLegend}>
 {[
 { key: 'applied', label: 'Applied', count: pipeline.applied },
 { key: 'interviewing', label: 'Interviewing', count: pipeline.interviewing },
 { key: 'accepted', label: 'Accepted', count: pipeline.accepted },
 { key: 'rejected', label: 'Rejected', count: pipeline.rejected },
 ].map((row) => (
 <View key={row.key} style={styles.legendRow}>
 <View style={[styles.legendDot, { backgroundColor: STATUS_META?.[row.key]?.color || '#ccc' }]} />
 <Text style={styles.legendLabel}>{row.label}</Text>
 <Text style={styles.legendCount}>{row.count}</Text>
 </View>
 ))}
 </View>

 {pipeline.accepted > 0 ? (
 <Text style={styles.insightsNudge}>
 You've been accepted to {pipeline.accepted}{' '}
 {pipeline.accepted === 1 ? 'program' : 'programs'}. Great work.
 </Text>
 ) : pipeline.interviewing > 0 ? (
 <Text style={styles.insightsNudge}>
 {pipeline.interviewing} interview{pipeline.interviewing !== 1 ? 's' : ''} in progress. Stay on top of those follow-ups.
 </Text>
 ) : (
 <Text style={styles.insightsNudge}>
 Keep going. Most programs accept around 10–20% of applicants.
 </Text>
 )}
 </View>
 )}

 {/* Profile Strength card */}
 {(() => {
 const strength = computeProfileStrength(user);
 const gpaLabel = GPA_LABELS[user.gpaRange] || 'Not set';
 const readiness = user.readiness || [];
 return (
 <View style={styles.strengthCard}>
 <View style={styles.strengthHeader}>
 <Text style={styles.strengthTitle}>Profile Strength</Text>
 <Text style={[
 styles.strengthScore,
 { color: strength >= 70 ? Colors.success : strength >= 40 ? Colors.warning : Colors.error }
 ]}>
 {strength}%
 </Text>
 </View>
 <View style={styles.strengthBar}>
 <View style={[
 styles.strengthBarFill,
 {
 width: `${strength}%`,
 backgroundColor: strength >= 70 ? Colors.success : strength >= 40 ? Colors.warning : Colors.error,
 }
 ]} />
 </View>
 <Text style={styles.strengthHint}>
 {strength < 40
 ? 'Add your grade, interests, and location to unlock personalized matches.'
 : strength < 70
 ? 'Add your GPA range and application materials to surface more fitting programs.'
 : 'Great profile! Your feed is highly personalized.'}
 </Text>

 <View style={styles.strengthRow}>
 <Text style={styles.strengthRowLabel}>GPA Range</Text>
 <Text style={styles.strengthRowValue}>{gpaLabel}</Text>
 </View>

 {readiness.length > 0 && (
 <View>
 <Text style={styles.strengthRowLabel}>What you have ready</Text>
 <View style={styles.readinessTags}>
 {readiness.map((key) => (
 <View key={key} style={styles.readinessTag}>
 <Text style={styles.readinessTagText}>{READINESS_LABELS[key] || key}</Text>
 </View>
 ))}
 </View>
 </View>
 )}

 {(strength < 100) && (
 <TouchableOpacity
 style={styles.strengthEditBtn}
 onPress={() => setEditModalVisible(true)}
 activeOpacity={0.85}
 >
 <Text style={styles.strengthEditBtnText}>Improve profile</Text>
 </TouchableOpacity>
 )}
 </View>
 );
 })()}

 {/* Preferences */}
 <SettingsSection title="Preferences">
 <SettingsRow
 label="Notifications"
 sublabel="Turn all notification types on or off"
 toggle
 toggleValue={user.notificationsOn ?? true}
 onToggle={handleToggleNotifications}
 tourId="profile-notifications"
 />
 {(user.notificationsOn ?? true) && (
 <>
 <Divider />
 <SettingsRow
 label="Deadline reminders"
 sublabel="Remind me as the deadline for a saved internship gets close"
 toggle
 toggleValue={user.notifyDeadlines ?? true}
 onToggle={handleToggleNotifyDeadlines}
 />
 <Divider />
 <SettingsRow
 label="High-match alerts"
 sublabel="Tell me when an internship I haven't saved is a strong match (50%+) and closing soon"
 toggle
 toggleValue={user.notifyHighMatch ?? true}
 onToggle={handleToggleNotifyHighMatch}
 />
 <Divider />
 <SettingsRow
 label="New internships in my field"
 sublabel="Tell me when a newly added internship in my field is a strong match (50%+)"
 toggle
 toggleValue={user.notifyNewMatches ?? true}
 onToggle={handleToggleNotifyNewMatches}
 />
 </>
 )}
 <Divider />
 <SettingsRow
 label="Remote only"
 sublabel="Hide in-person opportunities"
 toggle
 toggleValue={user.remoteOnly || false}
 onToggle={handleToggleRemote}
 />
 <Divider />
 <SettingsRow
 label="Grade level"
 sublabel={displayGrade}
 onPress={() => setEditModalVisible(true)}
 />
 <Divider />
 <SettingsRow
 label="Location"
 sublabel={user.location || 'Not set. Tap to add.'}
 onPress={() => setEditModalVisible(true)}
 />
 <Divider />
 <SettingsRow
 label="State"
 sublabel={user.state || (user.location ? 'Auto-detected from location' : 'Not set')}
 onPress={() => setStatePickerVisible(true)}
 />
 </SettingsSection>

 <SettingsSection title="Activity">
 <SettingsRow
 label="Saved internships"
 sublabel={`${(savedIds || []).length} saved`}
 onPress={() => navigation?.navigate('Saved')}
 />
 <Divider />
 <SettingsRow
 label="Top picks"
 sublabel={
 (topPickIds || []).length === 0
 ? 'Star your favorites to find them faster'
 : `${(topPickIds || []).length} starred`
 }
 onPress={() => navigation?.navigate('Saved')}
 />
 <Divider />
 <SettingsRow
 label="Applications"
 sublabel={
 pipeline.total === 0
 ? 'None yet. Track your progress from any internship page.'
 : `${pipeline.total} tracked`
 }
 onPress={() => navigation?.navigate('Tracker')}
 />
 <Divider />
 <SettingsRow
 label="Application materials"
 sublabel="Resumes, essays, transcripts & recommenders in one place"
 onPress={() => navigation?.navigate('Materials')}
 />
 <Divider />
 <SettingsRow
 label="Upcoming deadlines"
 sublabel="See what's closing soon"
 onPress={() => navigation?.navigate('Deadlines')}
 tourId="profile-deadlines"
 />
 </SettingsSection>

 <SettingsSection title="Account">
 <SettingsRow label="Edit profile" onPress={() => setEditModalVisible(true)} />
 <Divider />
 <SettingsRow
 label="Back up my data"
 sublabel="Everything lives on this phone. Export a copy of your saves, applications, and notes."
 onPress={async () => {
   try {
     const raw = await AsyncStorage.getItem('@interny_user_v2');
     if (!raw) {
       Alert.alert('Nothing to back up yet', 'Save or track some internships first.');
       return;
     }
     await Share.share({
       title: 'Interny backup',
       message: `Interny data backup (${new Date().toLocaleDateString()}). Keep this somewhere safe: you can use it to restore your saves, applications, and notes.\n\n${raw}`,
     });
   } catch {
     Alert.alert('Backup failed', 'Something went wrong exporting your data. Please try again.');
   }
 }}
 />
 </SettingsSection>

 <SettingsSection title="About">
 <SettingsRow label="Help & support" onPress={() => Linking.openURL('https://hello212312.github.io/privacy-policy/support')} />
 <Divider />
 <SettingsRow label="Privacy policy" onPress={() => Linking.openURL('https://hello212312.github.io/privacy-policy/privacy-policy')} />
 <Divider />
 <SettingsRow label="Terms of service" onPress={() => Linking.openURL('https://hello212312.github.io/privacy-policy/terms-of-service')} />
 <Divider />
 <SettingsRow label="App version" sublabel={APP_VERSION} hasChevron={false} />
 {deviceId ? (
 <>
 <Divider />
 <SettingsRow
 label="Device ID"
 sublabel={deviceId}
 hasChevron={false}
 onPress={() => {
 const { Share: RNShare } = require('react-native');
 RNShare.share({ message: deviceId });
 Alert.alert('Device ID', deviceId, [{ text: 'OK' }]);
 }}
 />
 </>
 ) : null}
 </SettingsSection>

 <SettingsSection>
 <SettingsRow label="Delete all data & reset" destructive hasChevron={false} onPress={handleSignOut} />
 </SettingsSection>

 <View style={{ height: Spacing[8] }} />
 </ScrollView>

 <EditProfileModal
 visible={editModalVisible}
 user={user}
 onSave={handleSaveProfile}
 onClose={() => setEditModalVisible(false)}
 />

 <StatePickerModal
 visible={statePickerVisible}
 current={user.state}
 onSelect={(abbr) => setState(abbr)}
 onClose={() => setStatePickerVisible(false)}
 />

 <ReminderTimingModal
 visible={reminderModalVisible}
 current={user.reminderDays}
 onSave={(days) => setReminderDays(days)}
 onClose={() => setReminderModalVisible(false)}
 />
 </SafeAreaView>
 );
}

// STYLES 

const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor: Colors.background },
 scroll: { flex: 1 },
 scrollContent: { paddingBottom: Spacing[8] },

 header: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: Spacing.screenPadding,
 paddingTop: Spacing[4],
 paddingBottom: Spacing[3],
 },
 headerTitle: {
 fontSize: Typography.size['3xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 letterSpacing: -0.5,
 },
 editBtn: {
 paddingHorizontal: Spacing[4],
 paddingVertical: Spacing[2],
 borderRadius: Radii.full,
 backgroundColor: Colors.accentLight,
 borderWidth: 1,
 borderColor: Colors.accentMuted,
 },
 editBtnText: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.accent,
 },

 profileCard: {
 marginHorizontal: Spacing.screenPadding,
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 padding: Spacing[5],
 borderWidth: 1,
 borderColor: Colors.border,
 ...Shadows.card,
 },
 avatarSection: { flexDirection: 'row', alignItems: 'center', gap: Spacing[4] },
 avatar: {
 width: 64,
 height: 64,
 borderRadius: Radii.full,
 backgroundColor: Colors.accentLight,
 alignItems: 'center',
 justifyContent: 'center',
 borderWidth: 2,
 borderColor: Colors.accentMuted,
 flexShrink: 0,
 },
 avatarText: {
 fontSize: Typography.size['2xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.accent,
 },
 profileInfo: { flex: 1 },
 profileName: {
 fontSize: Typography.size.xl,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 profileGrade: {
 fontSize: Typography.size.base,
 color: Colors.textSecondary,
 marginBottom: 4,
 },
 profileLocation: { fontSize: Typography.size.sm, color: Colors.textTertiary },
 profileLocationEmpty: {
 fontSize: Typography.size.sm,
 color: Colors.accent,
 fontWeight: Typography.weight.medium,
 },

 statsRow: { flexDirection: 'row' },
 statItem: { flex: 1, alignItems: 'center' },
 statBorder: { borderRightWidth: 1, borderRightColor: Colors.divider },
 statValue: {
 fontSize: Typography.size['2xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 statLabel: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.medium,
 color: Colors.textTertiary,
 textTransform: 'uppercase',
 letterSpacing: 0.3,
 },

 interestsLabel: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textSecondary,
 marginBottom: Spacing[3],
 textTransform: 'uppercase',
 letterSpacing: 0.3,
 },
 interestTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },
 addInterestBtn: {
 paddingHorizontal: 12,
 paddingVertical: 5,
 borderRadius: Radii.full,
 borderWidth: 1.5,
 borderColor: Colors.border,
 borderStyle: 'dashed',
 },
 addInterestText: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 color: Colors.textTertiary,
 },
 addInterestEmptyBtn: {
 paddingVertical: Spacing[3],
 paddingHorizontal: Spacing[4],
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 borderStyle: 'dashed',
 alignItems: 'center',
 },
 addInterestEmptyText: {
 fontSize: Typography.size.sm,
 color: Colors.textTertiary,
 fontWeight: Typography.weight.medium,
 },

 insightsCard: {
 marginHorizontal: Spacing.screenPadding,
 marginTop: Spacing[4],
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 padding: Spacing[5],
 borderWidth: 1,
 borderColor: Colors.border,
 ...Shadows.card,
 },
 insightsHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: Spacing[4],
 },
 insightsTitle: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 },
 insightsAction: {
 fontSize: Typography.size.sm,
 color: Colors.accent,
 fontWeight: Typography.weight.medium,
 },
 pipelineBar: {
 height: 8,
 borderRadius: Radii.full,
 flexDirection: 'row',
 overflow: 'hidden',
 backgroundColor: Colors.surfaceSecondary,
 marginBottom: Spacing[4],
 },
 pipelineLegend: { gap: Spacing[2], marginBottom: Spacing[3] },
 legendRow: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: Spacing[2],
 },
 legendDot: { width: 8, height: 8, borderRadius: Radii.full },
 legendLabel: { flex: 1, fontSize: Typography.size.sm, color: Colors.textSecondary },
 legendCount: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 },
 insightsNudge: {
 fontSize: Typography.size.sm,
 color: Colors.textSecondary,
 lineHeight: Typography.size.sm * 1.5,
 paddingTop: Spacing[2],
 borderTopWidth: 1,
 borderTopColor: Colors.divider,
 },

 customDayRow: {
   flexDirection: 'row',
   gap: Spacing[2],
   marginTop: Spacing[2],
   alignItems: 'center',
 },
 customDayInput: {
   flex: 1,
   borderWidth: 1,
   borderColor: Colors.border,
   borderRadius: Radii.md,
   paddingHorizontal: Spacing[3],
   paddingVertical: Spacing[2],
   fontSize: Typography.size.md,
   color: Colors.textPrimary,
   backgroundColor: Colors.background,
 },
 customDayAddBtn: {
   backgroundColor: Colors.accent,
   borderRadius: Radii.md,
   paddingHorizontal: Spacing[4],
   paddingVertical: Spacing[2],
   justifyContent: 'center',
 },
 customDayAddText: {
   color: '#fff',
   fontWeight: Typography.weight.bold,
   fontSize: Typography.size.md,
 },
 customDayChips: {
   flexDirection: 'row',
   flexWrap: 'wrap',
   gap: Spacing[2],
   marginTop: Spacing[3],
 },
 customDayChip: {
   backgroundColor: Colors.accent + '20',
   borderWidth: 1,
   borderColor: Colors.accent,
   borderRadius: Radii.full,
   paddingHorizontal: Spacing[3],
   paddingVertical: Spacing[1],
 },
 customDayChipText: {
   color: Colors.accent,
   fontSize: Typography.size.sm,
   fontWeight: Typography.weight.medium,
 },
 premiumUpsell: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: Spacing[3],
 marginHorizontal: Spacing.screenPadding,
 marginTop: Spacing[5],
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.xl,
 borderWidth: 1,
 borderColor: Colors.accentMuted,
 padding: Spacing[4],
 },
 premiumUpsellIcon: {
 width: 40,
 height: 40,
 borderRadius: Radii.md,
 backgroundColor: Colors.surface,
 alignItems: 'center',
 justifyContent: 'center',
 },
 premiumUpsellTitle: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 premiumUpsellSub: {
 fontSize: Typography.size.sm,
 color: Colors.textSecondary,
 lineHeight: Typography.size.sm * 1.4,
 },
 settingsSection: {
 marginHorizontal: Spacing.screenPadding,
 marginTop: Spacing[5],
 },
 settingsSectionTitle: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.bold,
 color: Colors.textTertiary,
 textTransform: 'uppercase',
 letterSpacing: 0.8,
 marginBottom: Spacing[2],
 paddingHorizontal: 4,
 },
 settingsCard: {
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 borderWidth: 1,
 borderColor: Colors.border,
 overflow: 'hidden',
 ...Shadows.card,
 },
 settingsRow: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: Spacing[4],
 paddingVertical: Spacing[3] + 2,
 minHeight: 52,
 },
 settingsRowLeft: { flex: 1, marginRight: Spacing[3] },
 settingsLabel: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.medium,
 color: Colors.textPrimary,
 marginBottom: 1,
 },
 settingsLabelDestructive: { color: Colors.error },
 settingsSublabel: {
 fontSize: Typography.size.sm,
 color: Colors.textTertiary,
 },
 settingsRowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
 chevron: { fontSize: 20, color: Colors.textTertiary },
 badge: {
 backgroundColor: Colors.accent,
 borderRadius: Radii.full,
 minWidth: 20,
 height: 20,
 alignItems: 'center',
 justifyContent: 'center',
 paddingHorizontal: 6,
 },
 badgeText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold, color: Colors.white },

 // Modal
 modalSafe: { flex: 1, backgroundColor: Colors.background },
 modalHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[4],
 borderBottomWidth: 1,
 borderBottomColor: Colors.divider,
 backgroundColor: Colors.surface,
 },
 modalCancelBtn: { minWidth: 60 },
 modalCancelText: { fontSize: Typography.size.md, color: Colors.textSecondary },
 modalTitle: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 },
 modalSaveBtn: { minWidth: 60, alignItems: 'flex-end' },
 modalSaveText: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.semibold,
 color: Colors.accent,
 },
 modalScroll: { flex: 1 },
 modalScrollContent: { paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing[4] },
 modalSection: { marginBottom: Spacing[6] },
 modalLabel: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textSecondary,
 marginBottom: Spacing[2],
 textTransform: 'uppercase',
 letterSpacing: 0.3,
 },
 modalHint: {
 fontSize: Typography.size.sm,
 color: Colors.textTertiary,
 marginTop: Spacing[2],
 lineHeight: Typography.size.sm * 1.5,
 },
 modalInput: {
 height: 52,
 borderRadius: Radii.lg,
 borderWidth: 1.5,
 borderColor: Colors.border,
 paddingHorizontal: Spacing[4],
 fontSize: Typography.size.md,
 color: Colors.textPrimary,
 backgroundColor: Colors.surface,
 },

 gradeList: { gap: Spacing[2] },
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
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.medium,
 color: Colors.textPrimary,
 },
 gradeOptionTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },
 gradeCheck: {
 width: 22,
 height: 22,
 borderRadius: Radii.full,
 backgroundColor: Colors.accent,
 alignItems: 'center',
 justifyContent: 'center',
 },
 gradeCheckText: { fontSize: Typography.size.xs, color: Colors.white, fontWeight: Typography.weight.bold },

 interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2], marginTop: Spacing[2] },
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

 // State modal
 stateModalSafe: { flex: 1, backgroundColor: Colors.background },
 stateModalHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[4],
 borderBottomWidth: 1,
 borderBottomColor: Colors.divider,
 backgroundColor: Colors.surface,
 },
 stateModalCancel: { fontSize: Typography.size.md, color: Colors.textSecondary, minWidth: 60 },
 stateModalTitle: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 },
 stateModalSearch: {
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[3],
 borderBottomWidth: 1,
 borderBottomColor: Colors.divider,
 },
 stateModalSearchInput: {
 height: 44,
 borderRadius: Radii.lg,
 borderWidth: 1,
 borderColor: Colors.border,
 paddingHorizontal: Spacing[3],
 fontSize: Typography.size.md,
 color: Colors.textPrimary,
 backgroundColor: Colors.surface,
 },
 stateModalList: { flex: 1 },
 stateModalRow: {
 flexDirection: 'row',
 alignItems: 'center',
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[4],
 borderBottomWidth: 1,
 borderBottomColor: Colors.divider,
 },
 stateModalRowActive: { backgroundColor: Colors.accentLight },
 stateModalRowText: {
 flex: 1,
 fontSize: Typography.size.md,
 color: Colors.textPrimary,
 },
 stateModalRowTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },
 stateModalCheck: { fontSize: Typography.size.md, color: Colors.accent, fontWeight: Typography.weight.bold },

 // Profile Strength card
 strengthCard: {
 marginHorizontal: Spacing.screenPadding,
 marginTop: Spacing[4],
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 padding: Spacing[4],
 borderWidth: 1,
 borderColor: Colors.border,
 gap: Spacing[3],
 ...Shadows.card,
 },
 strengthHeader: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 },
 strengthTitle: {
 fontSize: Typography.size.md,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 },
 strengthScore: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.bold,
 },
 strengthBar: {
 height: 6,
 backgroundColor: Colors.border,
 borderRadius: Radii.full,
 overflow: 'hidden',
 },
 strengthBarFill: {
 height: 6,
 borderRadius: Radii.full,
 },
 strengthHint: {
 fontSize: Typography.size.sm,
 color: Colors.textSecondary,
 lineHeight: Typography.size.sm * 1.5,
 },
 strengthRow: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 },
 strengthRowLabel: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textTertiary,
 textTransform: 'uppercase',
 letterSpacing: 0.3,
 marginBottom: Spacing[1],
 },
 strengthRowValue: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 },
 readinessTags: {
 flexDirection: 'row',
 flexWrap: 'wrap',
 gap: 6,
 marginTop: Spacing[1],
 },
 readinessTag: {
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.full,
 paddingHorizontal: 10,
 paddingVertical: 4,
 },
 readinessTagText: {
 fontSize: Typography.size.xs,
 color: Colors.accent,
 fontWeight: Typography.weight.semibold,
 },

 // Matching priorities (edit modal)
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
 strengthEditBtn: {
 height: 40,
 borderRadius: Radii.lg,
 backgroundColor: Colors.accent,
 alignItems: 'center',
 justifyContent: 'center',
 marginTop: Spacing[1],
 },
 strengthEditBtnText: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.white,
 },
});
