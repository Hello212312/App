// screens/DetailScreen.js
// Full internship detail: overview/requirements/how-to-apply,
// application status, notes, top-pick, share, apply link.
//
// NEW FEATURES:
// • Match reason tags ("Why this matches you")
// • Application readiness checklist (parsed from requirements)
// • College major alignment hints
// • Competitiveness badge
// • "Similar to" hint at bottom

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  AppState,
  Linking,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ClosedBadge, CompanyLogo, DeadlineBadge, Divider, Tag } from '../components';
import { MatchInsight, MatchInsightModal } from '../components/MatchInsight';
import { useTourTarget } from '../context/TourContext';
import { useUser } from '../context/UserContext';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import { addDeadlineToCalendar } from '../utils/calendar';
import { logActivityEvent } from '../utils/analytics';
import {
  computeMatchBreakdown,
  getMatchLabel,
  getChecklistItems,
  getCollegeMajorAlignment,
  getCompetitivenessConfig,
  getCompetitivenessLevel,
  getEffectiveDaysLeft,
  isItemExpired,
} from '../utils/matching';

const _FALLBACK_STATUSES = ['Saved', 'Applying', 'Submitted', 'Interviewing', 'Accepted', 'Rejected', 'Waitlisted'];
const _FALLBACK_STATUS_META = {
 Saved: { label: 'Saved', short: 'Saved', color: '#94A3B8' },
 Applying: { label: 'Applying', short: 'Applying', color: '#F59E0B' },
 Submitted: { label: 'Submitted', short: 'Submitted', color: '#3B82F6' },
 Interviewing: { label: 'Interviewing', short: 'Interview', color: '#8B5CF6' },
 Accepted: { label: 'Accepted', short: 'Accepted', color: '#10B981' },
 Rejected: { label: 'Rejected', short: 'Rejected', color: '#EF4444' },
 Waitlisted: { label: 'Waitlisted', short: 'Waitlisted', color: '#64748B' },
};

const DETAIL_TABS = ['Overview', 'Requirements', 'How to Apply'];


// OVERVIEW TAB 

const OverviewContent = ({ item }) => {
 const majors = getCollegeMajorAlignment(item.field);
 return (
 <View>
 <View style={styles.statsRow}>
 {[
 { label: 'Duration', value: item.duration || 'Varies' },
 { label: 'Grades', value: item.grades || 'See listing' },
 { label: 'Deadline', value: item.deadlineDate ? `${new Date(item.deadlineDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${isItemExpired(item) ? ' (Closed)' : ''}` : 'Rolling' },
 ].map((stat, i) => (
 <View key={stat.label} style={[styles.statItem, i < 2 && styles.statBorder]}>
 <Text style={styles.statLabel}>{stat.label}</Text>
 <Text style={styles.statValue}>{stat.value}</Text>
 </View>
 ))}
 </View>
 <Divider style={{ marginBottom: Spacing[5] }} />
 <Text style={styles.bodyText}>
 {item.overview ||
 `${item.company} offers high school students a hands-on internship opportunity in ${item.location || 'their location'}. Visit their website for full program details.`}
 </Text>
 {majors.length > 0 && (
 <View style={styles.majorBox}>
 <Text style={styles.majorBoxTitle}>College major alignment</Text>
 <Text style={styles.majorBoxSubtitle}>
 This internship is a strong fit for students interested in:
 </Text>
 <View style={styles.majorTags}>
 {majors.map((m) => (
 <View key={m} style={styles.majorTag}>
 <Text style={styles.majorTagText}>{m}</Text>
 </View>
 ))}
 </View>
 </View>
 )}
 </View>
 );
};

// REQUIREMENTS TAB 

const RequirementsContent = ({ item }) => {
 const reqText =
 item.requirements ||
 `• ${item.grades || 'High school student'}\n• Interest in ${item.field || 'this field'}\n• Check the program website for full eligibility requirements`;
 const lines = reqText.split('\n').filter((l) => l.trim());
 return (
 <View>
 {lines.map((line, i) => (
 <View key={i} style={styles.requirementRow}>
 <View style={styles.requirementDot} />
 <Text style={styles.requirementText}>{line.replace(/^[•\-]\s*/, '')}</Text>
 </View>
 ))}
 </View>
 );
};

// HOW TO APPLY TAB 

const ApplyContent = ({ item }) => {
 const applyText =
 item.howToApply ||
 `1. Visit ${item.url || 'the program website'} to find the application\n2. Complete the online application form\n3. Submit required documents (transcript, essay, etc.)\n4. Check the website for specific deadlines and requirements`;
 const lines = applyText.split('\n').filter((l) => l.trim());
 return (
 <View>
 {lines.map((line, i) => {
 const match = line.match(/^(\d+)\.\s*(.*)/);
 const num = match ? match[1] : String(i + 1);
 const text = match ? match[2] : line;
 return (
 <View key={i}>
 <View style={styles.applyStep}>
 <View style={styles.stepNumber}>
 <Text style={styles.stepNumberText}>{num}</Text>
 </View>
 <View style={styles.stepContent}>
 <Text style={styles.stepDesc}>{text}</Text>
 </View>
 </View>
 {i < lines.length - 1 && <View style={styles.stepConnector} />}
 </View>
 );
 })}
 </View>
 );
};

// STATUS PICKER MODAL 

const StatusPicker = ({ visible, current, onPick, onClose, statuses, statusMeta }) => {
 const safeStatuses = Array.isArray(statuses) ? statuses : _FALLBACK_STATUSES;
 const safeMeta = (statusMeta && typeof statusMeta === 'object') ? statusMeta : _FALLBACK_STATUS_META;
 return (
 <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
 <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={onClose}>
 <View style={styles.pickerSheet} onStartShouldSetResponder={() => true}>
 <Text style={styles.pickerTitle}>Application status</Text>
 <Text style={styles.pickerHint}>Track where this application stands.</Text>
 {safeStatuses.map((status) => {
 const meta = safeMeta[status] || { color: '#ccc', label: status, short: status };
 const active = current === status;
 return (
 <TouchableOpacity
 key={status}
 style={[styles.pickerRow, active && styles.pickerRowActive]}
 onPress={() => onPick(status)}
 activeOpacity={0.7}
 >
 <View style={[styles.pickerDot, { backgroundColor: meta.color }]} />
 <Text style={[styles.pickerLabel, active && styles.pickerLabelActive]}>
 {meta.label}
 </Text>
 {active && <Text style={styles.pickerCheck}>✓</Text>}
 </TouchableOpacity>
 );
 })}
 <TouchableOpacity style={styles.pickerCancelBtn} onPress={onClose} activeOpacity={0.7}>
 <Text style={styles.pickerCancelText}>Cancel</Text>
 </TouchableOpacity>
 </View>
 </TouchableOpacity>
 </Modal>
 );
};

// NOTES MODAL 

const NotesEditor = ({ visible, initial, onSave, onClose }) => {
 const [text, setText] = useState(initial || '');
 useEffect(() => { if (visible) setText(initial || ''); }, [visible, initial]);
 return (
 <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
 <SafeAreaView style={styles.notesSafe}>
 <View style={styles.notesHeader}>
 <TouchableOpacity onPress={onClose}>
 <Text style={styles.notesCancel}>Cancel</Text>
 </TouchableOpacity>
 <Text style={styles.notesTitle}>Notes</Text>
 <TouchableOpacity onPress={() => { onSave(text); onClose(); }}>
 <Text style={styles.notesSave}>Save</Text>
 </TouchableOpacity>
 </View>
 <View style={styles.notesBody}>
 <TextInput
 style={styles.notesInput}
 value={text}
 onChangeText={setText}
 placeholder="Write down why you're interested, things to mention in the app, contacts, follow-up dates…"
 placeholderTextColor={Colors.textTertiary}
 multiline
 autoFocus
 textAlignVertical="top"
 />
 <Text style={styles.notesHint}>Notes are private and stay on your device.</Text>
 </View>
 </SafeAreaView>
 </Modal>
 );
};

// CHECKLIST CARD 

const ChecklistCard = ({ item }) => {
 const checklistItems = getChecklistItems(item);
 const ctx = useUser() || {};
 const getApplication = ctx.getApplication || (() => null);
 const updateApplicationChecklist = ctx.updateApplicationChecklist || (() => {});

 // Seed initial checked state from persisted applicationMap, falling back to {}
 const [checked, setChecked] = useState(() => {
  const app = item?.id ? getApplication(item.id) : null;
  // stored as a plain object { [key]: boolean } in app.checklist
  if (app && app.checklist && typeof app.checklist === 'object' && !Array.isArray(app.checklist)) {
   return app.checklist;
  }
  return {};
 });

 const toggle = (key) => {
  setChecked((prev) => {
   const next = { ...prev, [key]: !prev[key] };
   if (item?.id) updateApplicationChecklist(item.id, next);
   return next;
  });
 };

 const doneCount = checklistItems.filter((c) => checked[c.key]).length;

 return (
 <View style={styles.checklistCard}>
 <View style={styles.checklistHeader}>
 <Text style={styles.checklistTitle}>Application Checklist</Text>
 <Text style={styles.checklistProgress}>
 {doneCount}/{checklistItems.length} done
 </Text>
 </View>
 <View style={styles.checklistBar}>
 <View
 style={[
 styles.checklistBarFill,
 { width: `${checklistItems.length > 0 ? (doneCount / checklistItems.length) * 100 : 0}%` },
 ]}
 />
 </View>
 {checklistItems.map((ci) => (
 <TouchableOpacity
 key={ci.key}
 style={styles.checklistRow}
 onPress={() => toggle(ci.key)}
 activeOpacity={0.7}
 accessibilityRole="checkbox"
 accessibilityLabel={ci.text}
 accessibilityState={{ checked: !!checked[ci.key] }}
 >
 <View style={[styles.checklistBox, checked[ci.key] && styles.checklistBoxDone]}>
 {checked[ci.key] && <Text style={styles.checklistBoxTick}>✓</Text>}
 </View>
 <Text style={[styles.checklistText, checked[ci.key] && styles.checklistTextDone]}>
 {ci.text}
 </Text>
 </TouchableOpacity>
 ))}
 </View>
 );
};

// DETAIL SCREEN 

export default function DetailScreen({ route, navigation }) {
 const item = route?.params?.item ?? {};
 const [activeTab, setActiveTab] = useState(0);
 // Tour anchors (feature + premium tours), plus the ScrollView that scrolls them into view
 const tourScrollRef = useTourTarget('detail-scroll');
 const tourMatchRef = useTourTarget('detail-match');
 const tourTrackRef = useTourTarget('detail-track');
 const tourChecklistRef = useTourTarget('detail-checklist');
 const [statusPickerOpen, setStatusPickerOpen] = useState(false);
 const [notesOpen, setNotesOpen] = useState(false);

 const ctx = useUser() || {};
 // Use the full APPLICATION_STATUSES set for the picker (includes Applying, Submitted, Waitlisted)
 const STATUSES = _FALLBACK_STATUSES;
 const STATUS_META = _FALLBACK_STATUS_META;
 const user = ctx.user || {};
 const savedIds = ctx.savedIds || [];
 const topPickIds = ctx.topPickIds || [];
 const statusMap = ctx.statusMap || {};
 const notesMap = ctx.notesMap || {};
 const toggleSaved = ctx.toggleSaved || (() => {});
 const setApplicationStatus = ctx.setApplicationStatus || (() => {});
 const toggleTopPick = ctx.toggleTopPick || (() => {});
 const setNoteForId = ctx.setNoteForId || (() => {});
 const markViewed = ctx.markViewed || (() => {});
 const isSaved = ctx.isSaved ? (id) => ctx.isSaved(id) : (id) => savedIds.includes(id);
 const isTopPick = ctx.isTopPick ? (id) => ctx.isTopPick(id) : (id) => topPickIds.includes(id);
 const getStatus = ctx.getStatus ? (id) => ctx.getStatus(id) : (id) => statusMap[id] || 'Saved';
 const getNoteForId = ctx.getNoteForId ? (id) => ctx.getNoteForId(id) : (id) => notesMap[id] || '';

 const id = item.id;
 const saved = !!id && isSaved(id);
 const topPick = !!id && isTopPick(id);
 const rawStatus = id ? getStatus(id) : 'Saved';
 const status = STATUS_META[rawStatus] ? rawStatus : 'Saved';
 const note = id ? getNoteForId(id) : '';

 useEffect(() => {
 if (!id || typeof markViewed !== 'function') return;
 const timer = setTimeout(() => {
 markViewed(id);
 logActivityEvent({
 eventType: 'view',
 internshipId: id,
 internshipTitle: item.title,
 company: item.company,
 user,
 });
 }, 350);
 return () => clearTimeout(timer);
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const tabContent = useMemo(() => [
 <OverviewContent key="overview" item={item} />,
 <RequirementsContent key="requirements" item={item} />,
 <ApplyContent key="apply" item={item} />,
 ], [item]);

 const closed = isItemExpired(item);

 // ── Post-apply prompt ──
 // When the user taps Apply Now we hand them to the browser. When they come
 // back, ask once whether they started; one tap sets the pipeline status.
 // Without this, tapping the app's own Apply button changed nothing in the app.
 const awaitingReturnRef = useRef(false);
 const pickStatusRef = useRef(() => {});

 const handleApply = () => {
  if (!item.url) return;
  logActivityEvent({
   eventType: 'apply_click',
   internshipId: id,
   internshipTitle: item.title,
   company: item.company,
   user,
  });
  // Normalize: prefix https:// if no scheme is present
  const raw = item.url.trim();
  const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  if (!closed) awaitingReturnRef.current = true;
  Linking.openURL(url).catch(() => {
    awaitingReturnRef.current = false;
    Alert.alert(
      "Couldn't open link",
      "The application URL couldn't be opened. Try visiting the program website directly.",
    );
  });
 };

 useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active' && awaitingReturnRef.current) {
      awaitingReturnRef.current = false;
      setTimeout(() => {
        Alert.alert(
          'How did it go?',
          `Did you start your application${item.company ? ` to ${item.company}` : ''}?`,
          [
            { text: 'Just looking', style: 'cancel' },
            { text: 'Started applying', onPress: () => pickStatusRef.current('Applying') },
            { text: 'Submitted it', onPress: () => pickStatusRef.current('Submitted') },
          ],
        );
      }, 400);
    }
  });
  return () => sub.remove();
  // eslint-disable-next-line react-hooks/exhaustive-deps
 }, []);

 const handleAddToCalendar = () => {
 addDeadlineToCalendar({ ...item, deadline: item.deadlineDate || item.deadline });
 };

 const handlePickStatus = (next) => {
   if (id) {
     if (!saved) {
       // Any status pick on an unsaved item should save it first
       toggleSaved(id);
     }
     setApplicationStatus(id, next);
   }
   setStatusPickerOpen(false);
 };
 pickStatusRef.current = handlePickStatus;

 const handleShare = async () => {
 const message = [
 `${item.role}${item.company ? ` at ${item.company}` : ''}`,
 item.location ? `Location: ${item.location}` : null,
 item.deadline ? `Deadline: ${item.deadline}` : null,
 item.url ? `\n${item.url}` : null,
 ].filter(Boolean).join('\n');
 try {
 await Share.share({ message, url: item.url || undefined, title: item.role || 'Internship' });
 } catch {}
 };

 const statusMeta = STATUS_META[status] || STATUS_META['Saved'] || { color: '#ccc', label: 'Saved', short: 'Saved' };
 const effectiveDaysLeft = getEffectiveDaysLeft(item);

 // Compute synchronously: scoring one item is cheap, and the old 350ms
 // setTimeout made the badge pop in late and shove the nav icons sideways.
 const matchBreakdown = useMemo(() => computeMatchBreakdown(item, user || {}), [item, user]);
 const matchScore = matchBreakdown ? matchBreakdown.total : null;
 const [showMatchBreakdown, setShowMatchBreakdown] = useState(false);


 const compLevel = getCompetitivenessLevel(item);
 const compConfig = getCompetitivenessConfig(compLevel);

 return (
 <SafeAreaView style={styles.safe}>
 {/* Nav bar */}
 <View style={styles.navBar}>
 <TouchableOpacity
 onPress={() => navigation?.goBack()}
 style={styles.backBtn}
 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
 accessibilityRole="button"
 accessibilityLabel="Go back"
 >
 <Ionicons name="chevron-back" size={26} color={Colors.textPrimary} />
 </TouchableOpacity>
 <View style={styles.navActions}>
 <TouchableOpacity
 onPress={() => id && toggleTopPick(id)}
 style={styles.navIconBtn}
 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
 accessibilityRole="button"
 accessibilityLabel={topPick ? 'Remove from top picks' : 'Add to top picks'}
 accessibilityState={{ selected: topPick }}
 >
 <Ionicons
 name={topPick ? 'star' : 'star-outline'}
 size={20}
 color={topPick ? Colors.warning : Colors.textSecondary}
 />
 </TouchableOpacity>
 <TouchableOpacity onPress={handleShare} style={styles.navIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Share this internship">
 <Ionicons name="share-outline" size={20} color={Colors.textSecondary} />
 </TouchableOpacity>
 <TouchableOpacity onPress={() => id && toggleSaved(id)} style={styles.navIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel={saved ? 'Remove from saved' : 'Save internship'} accessibilityState={{ selected: saved }}>
 <Ionicons
 name={saved ? 'bookmark' : 'bookmark-outline'}
 size={20}
 color={saved ? Colors.accent : Colors.textSecondary}
 />
 </TouchableOpacity>
 </View>
 </View>

 <ScrollView
 ref={tourScrollRef}
 style={styles.scroll}
 showsVerticalScrollIndicator={false}
 contentContainerStyle={{ paddingBottom: 140 }}
 >

 {/* Hero */}
 <View style={styles.hero}>
 <CompanyLogo name={item.company || '?'} size={56} color={item.logoColor || Colors.accentLight} />
 <View style={styles.heroText}>
 <Text style={styles.heroRole}>{item.role || 'Internship'}</Text>
 <Text style={styles.heroCompany}>{item.company || ''}</Text>
 <Text style={styles.heroLocation}>{item.location || ''}</Text>
 </View>

 <View ref={tourMatchRef} collapsable={false}><MatchInsight compact breakdown={matchBreakdown} onPress={() => setShowMatchBreakdown(true)} /></View>
 {/* Tags + competitiveness + deadline */}
 <View style={styles.heroTags}>
 {(item.tags || []).map((tag) => (
 <Tag key={tag} label={tag} variant={tag} size="md" />
 ))}
 <View style={[styles.compBadge, { backgroundColor: compConfig.bg }]}>
 <Text style={[styles.compBadgeText, { color: compConfig.color }]}>
 {compConfig.label}
 </Text>
 </View>
 {closed ? <ClosedBadge /> : (effectiveDaysLeft !== null && <DeadlineBadge daysLeft={effectiveDaysLeft} />)}
 </View>

 <TouchableOpacity
 style={styles.statusPill}
 onPress={() => setStatusPickerOpen(true)}
 activeOpacity={0.85}
 >
 <View style={[styles.statusDot, { backgroundColor: statusMeta.color }]} />
 <Text style={styles.statusPillLabel}>Status:</Text>
 <Text style={styles.statusPillValue}>{statusMeta.label}</Text>
 <Text style={styles.statusPillCaret}>▾</Text>
 </TouchableOpacity>

 {/* Add to Calendar */}
 <TouchableOpacity style={styles.calendarBtn} onPress={handleAddToCalendar} activeOpacity={0.85}>
 <Text style={styles.calendarBtnText}>Add to Calendar</Text>
 </TouchableOpacity>

 {/* APPLICATION CHECKLIST */}
 <View ref={tourChecklistRef} collapsable={false}>
 <ChecklistCard item={item} />
 </View>

 {/* Notes card */}
 <TouchableOpacity style={styles.notesCard} onPress={() => setNotesOpen(true)} activeOpacity={0.85}>
 <View style={styles.notesCardHeader}>
 <Text style={styles.notesCardTitle}>{note ? 'Your notes' : 'Add notes'}</Text>
 <Text style={styles.notesCardEdit}>{note ? 'Edit' : '+'}</Text>
 </View>
 {note ? (
 <Text style={styles.notesCardBody} numberOfLines={3}>{note}</Text>
 ) : (
 <Text style={styles.notesCardEmpty}>
 Write down why this caught your eye, contacts, deadlines, or anything you want to remember.
 </Text>
 )}
 </TouchableOpacity>
 </View>

 <Divider />

 {/* Tab bar */}
 <View style={styles.tabBar}>
 {DETAIL_TABS.map((tab, i) => (
 <TouchableOpacity
 key={tab}
 style={[styles.tab, activeTab === i && styles.tabActive]}
 onPress={() => setActiveTab(i)}
 activeOpacity={0.7}
 >
 <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>{tab}</Text>
 </TouchableOpacity>
 ))}
 </View>

 <Divider />

 <View style={styles.tabContent}>{tabContent[activeTab]}</View>

 </ScrollView>

 {/* Apply bar */}
 <View style={styles.applyBar}>
 <View style={styles.applyBarInner}>
 <View style={{ flex: 1 }}>
 <Text style={styles.applyDeadlineLabel}>Application deadline</Text>
 <Text style={[styles.applyDeadlineValue, closed && { color: Colors.error }]}>
 {item.deadlineDate
 ? `${new Date(item.deadlineDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}${closed ? ' · Closed' : ''}`
 : 'Rolling'}
 </Text>
 </View>
 <TouchableOpacity
 ref={tourTrackRef}
 collapsable={false}
 style={[styles.markBtn, status !== 'Saved' && styles.markBtnActive]}
 onPress={() => setStatusPickerOpen(true)}
 activeOpacity={0.85}
 accessibilityRole="button"
 accessibilityLabel={`Application status: ${statusMeta.label}. Tap to change`}
 >
 <Text style={[styles.markBtnText, status !== 'Saved' && styles.markBtnTextActive]}>
 {status !== 'Saved' ? `✓ ${statusMeta.short}` : 'Track'}
 </Text>
 </TouchableOpacity>
 <TouchableOpacity
 style={styles.applyBtn}
 onPress={handleApply}
 activeOpacity={0.85}
 accessibilityRole="button"
 accessibilityLabel={closed ? 'Applications closed. Visit program website' : 'Apply now on the program website'}
 >
 <Text style={styles.applyBtnText}>{closed ? 'Visit Website' : 'Apply Now'}</Text>
 </TouchableOpacity>
 </View>
 </View>

 <StatusPicker
 visible={statusPickerOpen}
 current={status}
 onPick={handlePickStatus}
 onClose={() => setStatusPickerOpen(false)}
 statuses={STATUSES}
 statusMeta={STATUS_META}
 />
 <NotesEditor
 visible={notesOpen}
 initial={note}
 onSave={(text) => setNoteForId(id, text)}
 onClose={() => setNotesOpen(false)}
 />
 <MatchInsightModal
 visible={showMatchBreakdown}
 onClose={() => setShowMatchBreakdown(false)}
 breakdown={matchBreakdown}
 title={matchScore !== null ? getMatchLabel(matchBreakdown) : ''}
 />
 </SafeAreaView>
 );
}

// STYLES 

const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor: Colors.surface },
 scroll: { flex: 1 },
 navBar: {
 flexDirection: 'row',
 alignItems: 'center',
 justifyContent: 'space-between',
 paddingHorizontal: Spacing.screenPadding,
 paddingVertical: Spacing[3],
 borderBottomWidth: 1,
 borderBottomColor: Colors.divider,
 },
 backBtn: { padding: 4 },
 backIcon: { fontSize: 28, color: Colors.textPrimary, lineHeight: 32 },
 navActions: { flexDirection: 'row', alignItems: 'center', gap: Spacing[1] },
 navIconBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
 navIcon: { fontSize: 20, color: Colors.textSecondary },
 matchBadge: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: 3,
 paddingHorizontal: 8,
 paddingVertical: 4,
 borderRadius: Radii.full,
 marginLeft: 4,
 },
 matchBadgeText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },
 matchBadgeScore: { fontSize: Typography.size.xs, fontWeight: Typography.weight.bold },

 hero: { padding: Spacing[5], gap: Spacing[3] },
 heroText: { gap: 2 },
 heroRole: {
 fontSize: Typography.size['2xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 letterSpacing: -0.4,
 },
 heroCompany: { fontSize: Typography.size.lg, color: Colors.textSecondary },
 heroLocation: { fontSize: Typography.size.base, color: Colors.textTertiary },
 heroTags: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing[2] },

 // Competitiveness badge
 compBadge: {
 borderRadius: Radii.full,
 paddingHorizontal: 10,
 paddingVertical: 4,
 },
 compBadgeText: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 },

  statusPill: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: Spacing[2],
 paddingHorizontal: Spacing[3],
 paddingVertical: Spacing[2],
 backgroundColor: Colors.surfaceSecondary,
 borderRadius: Radii.full,
 borderWidth: 1,
 borderColor: Colors.border,
 alignSelf: 'flex-start',
 },
 statusDot: { width: 8, height: 8, borderRadius: 4 },
 statusPillLabel: { fontSize: Typography.size.sm, color: Colors.textTertiary },
 statusPillValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
 statusPillCaret: { fontSize: Typography.size.sm, color: Colors.textTertiary },

 calendarBtn: {
 paddingHorizontal: Spacing[4],
 paddingVertical: Spacing[3],
 backgroundColor: Colors.surfaceSecondary,
 borderRadius: Radii.lg,
 borderWidth: 1,
 borderColor: Colors.border,
 alignItems: 'center',
 },
 calendarBtnText: { fontSize: Typography.size.base, fontWeight: Typography.weight.medium, color: Colors.textSecondary },

 // Checklist
 checklistCard: {
 backgroundColor: Colors.surfaceSecondary,
 borderRadius: Radii.lg,
 padding: Spacing[4],
 borderWidth: 1,
 borderColor: Colors.border,
 gap: Spacing[2],
 },
 checklistHeader: {
 flexDirection: 'row',
 justifyContent: 'space-between',
 alignItems: 'center',
 marginBottom: Spacing[1],
 },
 checklistTitle: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 },
 checklistProgress: {
 fontSize: Typography.size.xs,
 fontWeight: Typography.weight.semibold,
 color: Colors.accent,
 },
 checklistBar: {
 height: 4,
 backgroundColor: Colors.border,
 borderRadius: Radii.full,
 marginBottom: Spacing[2],
 overflow: 'hidden',
 },
 checklistBarFill: {
 height: 4,
 backgroundColor: Colors.accent,
 borderRadius: Radii.full,
 },
 checklistRow: {
 flexDirection: 'row',
 alignItems: 'center',
 gap: Spacing[3],
 paddingVertical: Spacing[1],
 },
 checklistBox: {
 width: 20,
 height: 20,
 borderRadius: 4,
 borderWidth: 1.5,
 borderColor: Colors.border,
 backgroundColor: Colors.surface,
 alignItems: 'center',
 justifyContent: 'center',
 flexShrink: 0,
 },
 checklistBoxDone: { backgroundColor: Colors.accent, borderColor: Colors.accent },
 checklistBoxTick: { fontSize: 11, color: Colors.white, fontWeight: Typography.weight.bold },
 checklistText: { fontSize: Typography.size.sm, color: Colors.textSecondary, flex: 1 },
 checklistTextDone: { color: Colors.textTertiary, textDecorationLine: 'line-through' },

 notesCard: {
 backgroundColor: Colors.surfaceSecondary,
 borderRadius: Radii.lg,
 padding: Spacing[4],
 borderWidth: 1,
 borderColor: Colors.border,
 gap: Spacing[2],
 },
 notesCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
 notesCardTitle: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textSecondary,
 textTransform: 'uppercase',
 letterSpacing: 0.3,
 },
 notesCardEdit: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.accent },
 notesCardBody: { fontSize: Typography.size.base, color: Colors.textPrimary, lineHeight: Typography.size.base * 1.5 },
 notesCardEmpty: { fontSize: Typography.size.sm, color: Colors.textTertiary, lineHeight: Typography.size.sm * 1.5 },

 tabBar: { flexDirection: 'row', paddingHorizontal: Spacing.screenPadding },
 tab: { flex: 1, paddingVertical: Spacing[3], alignItems: 'center' },
 tabActive: { borderBottomWidth: 2, borderBottomColor: Colors.accent },
 tabText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textTertiary },
 tabTextActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },
 tabContent: { padding: Spacing[5] },

 // Overview stats
 statsRow: {
 flexDirection: 'row',
 marginBottom: Spacing[5],
 backgroundColor: Colors.surfaceSecondary,
 borderRadius: Radii.lg,
 padding: Spacing[4],
 borderWidth: 1,
 borderColor: Colors.border,
 },
 statItem: { flex: 1, alignItems: 'center' },
 statBorder: { borderRightWidth: 1, borderRightColor: Colors.divider },
 statLabel: {
 fontSize: Typography.size.xs,
 color: Colors.textTertiary,
 fontWeight: Typography.weight.medium,
 textTransform: 'uppercase',
 letterSpacing: 0.3,
 marginBottom: 4,
 },
 statValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, textAlign: 'center' },
 bodyText: { fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: Typography.size.base * 1.7 },

 // College major box
 majorBox: {
 marginTop: Spacing[5],
 padding: Spacing[4],
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.lg,
 borderWidth: 1,
 borderColor: Colors.border,
 gap: Spacing[2],
 },
 majorBoxTitle: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.accent },
 majorBoxSubtitle: { fontSize: Typography.size.sm, color: Colors.textSecondary },
 majorTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
 majorTag: {
 backgroundColor: Colors.accent,
 borderRadius: Radii.full,
 paddingHorizontal: 10,
 paddingVertical: 4,
 },
 majorTagText: { fontSize: Typography.size.xs, color: Colors.white, fontWeight: Typography.weight.semibold },

 // Requirements
 requirementRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: Spacing[3], gap: Spacing[3] },
 requirementDot: {
 width: 6, height: 6, borderRadius: 3,
 backgroundColor: Colors.accent, marginTop: 7, flexShrink: 0,
 },
 requirementText: { flex: 1, fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: Typography.size.base * 1.6 },

 // How to apply
 applyStep: { flexDirection: 'row', gap: Spacing[3] },
 stepNumber: {
 width: 28, height: 28, borderRadius: Radii.full,
 backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
 },
 stepNumberText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.bold, color: Colors.accent },
 stepContent: { flex: 1, paddingTop: 4 },
 stepDesc: { fontSize: Typography.size.base, color: Colors.textSecondary, lineHeight: Typography.size.base * 1.6 },
 stepConnector: { width: 1, height: Spacing[4], backgroundColor: Colors.border, marginLeft: 13, marginVertical: 4 },

 // Apply bar
 applyBar: {
 position: 'absolute', bottom: 0, left: 0, right: 0,
 backgroundColor: Colors.surface,
 borderTopWidth: 1, borderTopColor: Colors.divider,
 paddingBottom: 24, paddingTop: Spacing[3],
 ...Shadows.elevated,
 },
 applyBarInner: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.screenPadding, gap: Spacing[3] },
 applyDeadlineLabel: { fontSize: Typography.size.xs, color: Colors.textTertiary, fontWeight: Typography.weight.medium, marginBottom: 2 },
 applyDeadlineValue: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textPrimary },
 markBtn: {
 height: 44, paddingHorizontal: Spacing[4], borderRadius: Radii.lg,
 borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
 },
 markBtnActive: { borderColor: Colors.accent, backgroundColor: Colors.accentLight },
 markBtnText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.semibold, color: Colors.textSecondary },
 markBtnTextActive: { color: Colors.accent },
 applyBtn: {
 height: 44, paddingHorizontal: Spacing[5], borderRadius: Radii.lg,
 backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', ...Shadows.card,
 },
 applyBtnText: { fontSize: Typography.size.md, fontWeight: Typography.weight.bold, color: Colors.white },

 // Status picker
 pickerBackdrop: { flex: 1, backgroundColor: Colors.overlay, justifyContent: 'center', alignItems: 'center', padding: Spacing[5] },
 pickerSheet: { backgroundColor: Colors.surface, borderRadius: Radii['2xl'], width: '100%', maxWidth: 360, paddingBottom: Spacing[2], ...Shadows.elevated },
 pickerTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary, paddingHorizontal: Spacing[5], paddingTop: Spacing[5], paddingBottom: Spacing[1] },
 pickerHint: { fontSize: Typography.size.sm, color: Colors.textTertiary, paddingHorizontal: Spacing[5], paddingBottom: Spacing[3] },
 pickerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing[5], paddingVertical: Spacing[3], gap: Spacing[3] },
 pickerRowActive: { backgroundColor: Colors.accentLight },
 pickerDot: { width: 10, height: 10, borderRadius: 5 },
 pickerLabel: { flex: 1, fontSize: Typography.size.md, color: Colors.textPrimary, fontWeight: Typography.weight.medium },
 pickerLabelActive: { color: Colors.accent, fontWeight: Typography.weight.semibold },
 pickerCheck: { fontSize: Typography.size.md, color: Colors.accent },
 pickerCancelBtn: { marginTop: Spacing[2], paddingVertical: Spacing[3], alignItems: 'center', borderTopWidth: 1, borderTopColor: Colors.divider },
 pickerCancelText: { fontSize: Typography.size.md, color: Colors.textSecondary, fontWeight: Typography.weight.medium },

 // Notes
 notesSafe: { flex: 1, backgroundColor: Colors.surface },
 notesHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.screenPadding, paddingVertical: Spacing[4], borderBottomWidth: 1, borderBottomColor: Colors.divider },
 notesCancel: { fontSize: Typography.size.md, color: Colors.textSecondary },
 notesTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.bold, color: Colors.textPrimary },
 notesSave: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.accent },
 notesBody: { flex: 1, padding: Spacing[5] },
 notesInput: { flex: 1, fontSize: Typography.size.md, color: Colors.textPrimary, lineHeight: Typography.size.md * 1.7 },
 notesHint: { fontSize: Typography.size.sm, color: Colors.textTertiary, marginTop: Spacing[3], textAlign: 'center' },
});
