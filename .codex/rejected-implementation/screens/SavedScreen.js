// screens/SavedScreen.js
// Saved / bookmarked internships: reads from UserContext.
//
// NEW FEATURES:
// • "Similar to what you saved" recommendation rail (getSimilarRecommendations)
// • Competitiveness badge on each saved card

import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CompanyLogo, DeadlineBadge, Tag } from '../components';
import { useUser } from '../context/UserContext';
import { INTERNSHIPS, subscribeToInternships } from '../data';
import { Colors, Radii, Shadows, Spacing, Typography } from '../theme';
import {
  getCompetitivenessConfig,
  getCompetitivenessLevel,
  getEffectiveDaysLeft,
  getSimilarRecommendations,
  computeMatchBreakdown,
  getMatchLabel,
} from '../utils/matching';

const IN_PROGRESS_STATUSES = new Set([
 'Applying','Submitted','Interviewing','Accepted','Waitlisted',
 'applying','submitted','interviewing','accepted','waitlisted',
]);

// EMPTY STATE 

const EmptyState = ({ onBrowse }) => (
 <View style={styles.emptyState}>
 <View style={styles.emptyIcon}>
 <Ionicons name="bookmark-outline" size={26} color={Colors.accent} />
 </View>
 <Text style={styles.emptyTitle}>No saved internships yet</Text>
 <Text style={styles.emptySubtitle}>
 When you find an internship you like, tap the bookmark icon to save it here for later.
 </Text>
 <TouchableOpacity style={styles.emptyBtn} onPress={onBrowse} activeOpacity={0.85}>
 <Text style={styles.emptyBtnText}>Browse internships</Text>
 </TouchableOpacity>
 </View>
);

// SAVED CARD 

const SavedCard = ({ item, onPress, onUnsave, statusLabel }) => {
 const daysLeft = getEffectiveDaysLeft(item);
 const showBanner = statusLabel && statusLabel !== 'Saved';
 const compLevel = getCompetitivenessLevel(item);
 const compConfig = getCompetitivenessConfig(compLevel);

 return (
 <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.97}>
 {showBanner && (
 <View style={[
 styles.statusBanner,
 statusLabel === 'Accepted' && { backgroundColor: Colors.successLight },
 statusLabel === 'Rejected' && { backgroundColor: Colors.errorLight },
 ]}>
 <Text style={[
 styles.statusBannerText,
 statusLabel === 'Accepted' && { color: Colors.success },
 statusLabel === 'Rejected' && { color: Colors.error },
 ]}>
 {statusLabel}
 </Text>
 </View>
 )}

 <View style={styles.cardHeader}>
 <CompanyLogo name={item.company} size={44} color={item.logoColor} />
 <View style={styles.cardHeaderText}>
 <Text style={styles.cardRole} numberOfLines={1}>{item.role}</Text>
 <Text style={styles.cardCompany} numberOfLines={1}>{item.company}</Text>
 </View>
 <TouchableOpacity
 style={styles.unsaveBtn}
 onPress={onUnsave}
 hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
 activeOpacity={0.7}
 >
 <Ionicons name="bookmark" size={20} color={Colors.accent} />
 </TouchableOpacity>
 </View>

 <View style={styles.cardMeta}>
 <Text style={styles.cardLocation}>{item.location}</Text>
 </View>

 <View style={styles.cardFooter}>
 <View style={styles.cardTags}>
 {(item.tags || []).slice(0, 2).map((tag) => (
 <Tag key={tag} label={tag} variant={tag} />
 ))}
 <View style={[styles.compBadge, { backgroundColor: compConfig.bg }]}>
 <Text style={[styles.compBadgeText, { color: compConfig.color }]}>
 {compConfig.label}
 </Text>
 </View>
 </View>
 {daysLeft !== null && <DeadlineBadge daysLeft={daysLeft} />}
 </View>
 </TouchableOpacity>
 );
};

// SIMILAR MINI CARD 

const SimilarCard = ({ item, user, onPress }) => {
 const daysLeft = getEffectiveDaysLeft(item);
 return (
 <TouchableOpacity style={styles.similarCard} onPress={onPress} activeOpacity={0.9}>
 <CompanyLogo name={item.company} size={32} color={item.logoColor} />
 <Text style={styles.similarRole} numberOfLines={2}>{item.role}</Text>
 <Text style={styles.similarCompany} numberOfLines={1}>{item.company}</Text>
 <Text style={styles.similarCompany}>{getMatchLabel(computeMatchBreakdown(item,user))}</Text>
 {daysLeft !== null && (
 <View style={{ marginTop: 'auto', paddingTop: 6 }}>
 <DeadlineBadge daysLeft={daysLeft} />
 </View>
 )}
 </TouchableOpacity>
 );
};

// SAVED SCREEN 

export default function SavedScreen({ navigation }) {
 const { savedIds, statusMap, toggleSaved, user } = useUser();
 const [activeTab, setActiveTab] = useState('all');

 // Recompute when the module-level INTERNSHIPS list finishes loading,
 // otherwise this screen stays empty if opened before the fetch resolves.
 const [internshipsVersion, setInternshipsVersion] = useState(0);
 useEffect(() => subscribeToInternships(() => setInternshipsVersion((v) => v + 1)), []);

 const savedItems = useMemo(
 () => savedIds.map((id) => INTERNSHIPS.find((i) => i.id === id)).filter(Boolean),
 // eslint-disable-next-line react-hooks/exhaustive-deps
 [savedIds, internshipsVersion]
 );

 // "Similar to what you saved" recommendations
 const similarRecs = useMemo(() => {
 if (savedItems.length === 0) return [];
 return getSimilarRecommendations(savedItems, INTERNSHIPS, 6, user);
 }, [savedItems,user]);

 // Which saved item drove the most similarities (for the label)
 const similarSourceName = useMemo(() => {
 if (savedItems.length === 0) return null;
 return savedItems[savedItems.length - 1]?.role || null; // most recently saved
 }, [savedItems]);

 const displayed = useMemo(() => {
 if (activeTab === 'applied') {
 return savedItems.filter((i) => {
 const status = statusMap?.[i.id] || 'Saved';
 return IN_PROGRESS_STATUSES.has(status);
 });
 }
 return savedItems;
 }, [savedItems, statusMap, activeTab]);

 const inProgressCount = useMemo(
 () => savedItems.filter((i) => IN_PROGRESS_STATUSES.has(statusMap?.[i.id] || '')).length,
 [savedItems, statusMap]
 );

 return (
 <SafeAreaView style={styles.safe}>
 <View style={styles.header}>
 <Text style={styles.headerTitle}>Saved</Text>
 <Text style={styles.headerCount}>
 {savedItems.length} internship{savedItems.length !== 1 ? 's' : ''}
 </Text>
 </View>

 {savedItems.length > 0 && (
 <View style={styles.tabRow}>
 {[
 ['all', 'All saved'],
 ['applied', `In progress${inProgressCount > 0 ? ` (${inProgressCount})` : ''}`],
 ].map(([val, label]) => (
 <TouchableOpacity
 key={val}
 style={[styles.tabChip, activeTab === val && styles.tabChipActive]}
 onPress={() => setActiveTab(val)}
 activeOpacity={0.7}
 >
 <Text style={[styles.tabChipText, activeTab === val && styles.tabChipTextActive]}>
 {label}
 </Text>
 </TouchableOpacity>
 ))}
 </View>
 )}

 {savedItems.length === 0 ? (
 <EmptyState onBrowse={() => navigation?.navigate('Main', { screen: 'Search' })} />
 ) : (
 <ScrollView
 style={styles.scroll}
 showsVerticalScrollIndicator={false}
 contentContainerStyle={styles.scrollContent}
 >
 {displayed.length === 0 ? (
 <View style={styles.tabEmptyState}>
 <Text style={styles.tabEmptyText}>
 {activeTab === 'applied'
 ? "You haven't started any applications yet.\nTrack your status from an internship's detail page."
 : 'Nothing here.'}
 </Text>
 </View>
 ) : (
 displayed.map((item) => {
 const status = statusMap?.[item.id] || 'Saved';
 const statusLabel = IN_PROGRESS_STATUSES.has(status) ? status : null;
 return (
 <SavedCard
 key={item.id}
 item={item}
 statusLabel={statusLabel}
 onPress={() => navigation?.navigate('Detail', { item })}
 onUnsave={() => toggleSaved(item.id)}
 />
 );
 })
 )}

 {/* SIMILAR TO WHAT YOU SAVED */}
 {similarRecs.length > 0 && activeTab === 'all' && (
 <View style={styles.similarSection}>
 <View style={styles.similarHeader}>
 <Text style={styles.similarTitle}>
 You might also like
 </Text>
 {similarSourceName && (
 <Text style={styles.similarSubtitle}>
 Based on {savedItems.length === 1 ? `"${similarSourceName}"` : 'your saved internships'}
 </Text>
 )}
 </View>
 <ScrollView
 horizontal
 showsHorizontalScrollIndicator={false}
 contentContainerStyle={styles.similarScroll}
 >
 {similarRecs.map((item) => (
 <SimilarCard
 key={`sim-${item.id}`}
 user={user}
 item={item}
 onPress={() => navigation?.navigate('Detail', { item })}
 />
 ))}
 </ScrollView>
 </View>
 )}

 <View style={{ height: Spacing[8] }} />
 </ScrollView>
 )}
 </SafeAreaView>
 );
}

// STYLES 

const styles = StyleSheet.create({
 safe: { flex: 1, backgroundColor: Colors.background },
 header: {
 paddingHorizontal: Spacing.screenPadding,
 paddingTop: Spacing[4],
 paddingBottom: Spacing[3],
 flexDirection: 'row',
 alignItems: 'baseline',
 gap: Spacing[2],
 },
 headerTitle: {
 fontSize: Typography.size['3xl'],
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 letterSpacing: -0.5,
 },
 headerCount: {
 fontSize: Typography.size.base,
 color: Colors.textTertiary,
 fontWeight: Typography.weight.regular,
 },
 tabRow: {
 flexDirection: 'row',
 paddingHorizontal: Spacing.screenPadding,
 gap: Spacing[2],
 marginBottom: Spacing[3],
 },
 tabChip: {
 paddingHorizontal: 14,
 paddingVertical: 7,
 borderRadius: Radii.full,
 backgroundColor: Colors.surface,
 borderWidth: 1,
 borderColor: Colors.border,
 },
 tabChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
 tabChipText: { fontSize: Typography.size.sm, fontWeight: Typography.weight.medium, color: Colors.textSecondary },
 tabChipTextActive: { color: Colors.white },

 scroll: { flex: 1 },
 scrollContent: { paddingHorizontal: Spacing.screenPadding, paddingTop: Spacing[2] },

 statusBanner: {
 alignSelf: 'flex-start',
 backgroundColor: Colors.accentLight,
 borderRadius: Radii.full,
 paddingHorizontal: 10,
 paddingVertical: 3,
 marginBottom: Spacing[2],
 },
 statusBannerText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold, color: Colors.accent },

 card: {
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 padding: Spacing.cardPadding,
 marginBottom: Spacing.cardGap,
 borderWidth: 1,
 borderColor: Colors.border,
 ...Shadows.card,
 },
 cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing[2] },
 cardHeaderText: { flex: 1, marginLeft: Spacing[3], marginRight: Spacing[2] },
 cardRole: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginBottom: 2 },
 cardCompany: { fontSize: Typography.size.base, color: Colors.textSecondary },
 unsaveBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
 unsaveIcon: { fontSize: 18, color: Colors.accent },
 cardMeta: { marginBottom: Spacing[2], marginLeft: 44 + Spacing[3] },
 cardLocation: { fontSize: Typography.size.sm, color: Colors.textTertiary },
 cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
 cardTags: { flexDirection: 'row', gap: Spacing[1], flexWrap: 'wrap', flex: 1 },

 compBadge: { borderRadius: Radii.full, paddingHorizontal: 8, paddingVertical: 3 },
 compBadgeText: { fontSize: Typography.size.xs, fontWeight: Typography.weight.semibold },

 // Similar section
 similarSection: {
 marginTop: Spacing[4],
 marginHorizontal: -Spacing.screenPadding,
 paddingHorizontal: Spacing.screenPadding,
 paddingTop: Spacing[4],
 borderTopWidth: 1,
 borderTopColor: Colors.divider,
 },
 similarHeader: { marginBottom: Spacing[3] },
 similarTitle: {
 fontSize: Typography.size.lg,
 fontWeight: Typography.weight.bold,
 color: Colors.textPrimary,
 marginBottom: 2,
 },
 similarSubtitle: { fontSize: Typography.size.sm, color: Colors.textTertiary },
 similarScroll: { gap: Spacing[3], paddingRight: Spacing.screenPadding },
 similarCard: {
 width: 160,
 minHeight: 150,
 backgroundColor: Colors.surface,
 borderRadius: Radii.xl,
 borderWidth: 1,
 borderColor: Colors.border,
 padding: Spacing[3],
 gap: 4,
 ...Shadows.card,
 },
 similarRole: {
 fontSize: Typography.size.sm,
 fontWeight: Typography.weight.semibold,
 color: Colors.textPrimary,
 marginTop: Spacing[2],
 lineHeight: Typography.size.sm * 1.4,
 },
 similarCompany: { fontSize: Typography.size.xs, color: Colors.textTertiary },

 emptyState: { alignItems: 'center', paddingVertical: Spacing[10], paddingHorizontal: Spacing[6] },
 emptyIcon: {
 width: 56, height: 56, borderRadius: Radii.xl,
 backgroundColor: Colors.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: Spacing[4],
 },
 emptyIconLetter: { fontSize: Typography.size['3xl'], fontWeight: Typography.weight.bold, color: Colors.accent },
 emptyTitle: { fontSize: Typography.size.lg, fontWeight: Typography.weight.semibold, color: Colors.textPrimary, marginBottom: Spacing[2], textAlign: 'center' },
 emptySubtitle: { fontSize: Typography.size.base, color: Colors.textSecondary, textAlign: 'center', lineHeight: Typography.size.base * 1.5, marginBottom: Spacing[5] },
 emptyBtn: { height: 48, borderRadius: Radii.lg, backgroundColor: Colors.accent, alignItems: 'center', justifyContent: 'center', paddingHorizontal: Spacing[6] },
 emptyBtnText: { fontSize: Typography.size.md, fontWeight: Typography.weight.semibold, color: Colors.white },
 tabEmptyState: { paddingVertical: Spacing[8], alignItems: 'center' },
 tabEmptyText: { fontSize: Typography.size.base, color: Colors.textTertiary, textAlign: 'center', lineHeight: Typography.size.base * 1.6 },
});